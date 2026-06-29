import { NextRequest, NextResponse } from 'next/server';
import { Db, ObjectId } from 'mongodb';
import crypto from 'crypto';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function verifyRazorpaySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}



type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        [key: string]: unknown;
      };
    };
  };
};

async function validateAndUpdateInventory(
  db: Db,
  items: Array<{ productId: string; color: string; quantity: number }>,
  updateStock = true,
): Promise<{ success: boolean; error?: string }> {
  const products = db.collection('products');

  for (const item of items) {
    const product = await products.findOne({ _id: new ObjectId(item.productId) });
    if (!product) {
      return { success: false, error: `Product not found: ${item.productId}` };
    }

    let availableStock = 0;
    if (product.colors && Array.isArray(product.colors)) {
      const colorVariant = product.colors.find(
        (c: unknown) =>
          c && typeof c === 'object' &&
          typeof (c as { colorName?: unknown }).colorName === 'string' &&
          String((c as { colorName?: unknown }).colorName).trim().toLowerCase() === item.color.trim().toLowerCase()
      );
      if (!colorVariant) {
        return { success: false, error: `Color variant not found: ${item.color} for product ${product.name}` };
      }
      availableStock = Number((colorVariant as { stock?: unknown }).stock) || 0;
    } else {
      availableStock = Number(product.stock) || 0;
    }

    if (availableStock < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for ${item.color} (${item.productId}). Available: ${availableStock}, Requested: ${item.quantity}`,
      };
    }
  }

  if (!updateStock) {
    return { success: true };
  }

  for (const item of items) {
    const product = await products.findOne({ _id: new ObjectId(item.productId) });
    if (!product) {
      return { success: false, error: `Product not found during update: ${item.productId}` };
    }

    if (product.colors && Array.isArray(product.colors)) {
      const colorIndex = product.colors.findIndex(
        (c: unknown) =>
          c && typeof c === 'object' &&
          typeof (c as { colorName?: unknown }).colorName === 'string' &&
          String((c as { colorName?: unknown }).colorName).trim().toLowerCase() === item.color.trim().toLowerCase()
      );

      if (colorIndex === -1) {
        return { success: false, error: `Color variant not found during update: ${item.color} for product ${item.productId}` };
      }

      const currentStock = Number(product.colors[colorIndex].stock) || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      await products.updateOne(
        { _id: new ObjectId(item.productId) },
        { $set: { [`colors.${colorIndex}.stock`]: newStock, updatedAt: new Date() } }
      );
    } else {
      const currentStock = Number(product.stock) || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      await products.updateOne(
        { _id: new ObjectId(item.productId) },
        { $set: { stock: newStock, updatedAt: new Date() } }
      );
    }
  }

  return { success: true };
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || getEnv('RAZORPAY_SECRET');
    const signature = request.headers.get('x-razorpay-signature') || '';
    const rawBody = await request.text();

    if (!signature) {
      console.error('Razorpay webhook: missing signature header');
      return NextResponse.json({ success: false, error: 'Missing signature' }, { status: 400 });
    }

    if (!verifyRazorpaySignature(rawBody, signature, secret)) {
      console.error('Razorpay webhook: invalid signature');
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    let webhookData: RazorpayWebhookPayload;
    try {
      webhookData = JSON.parse(rawBody) as RazorpayWebhookPayload;
    } catch (error) {
      console.error('Razorpay webhook: invalid JSON body', error);
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    if (webhookData.event !== 'payment.captured') {
      console.log('Razorpay webhook: ignored event', webhookData.event);
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    const paymentEntity = webhookData.payload?.payment?.entity;
    const orderId = String(paymentEntity?.order_id || '').trim();
    const paymentId = String(paymentEntity?.id || '').trim();
    const status = String(paymentEntity?.status || '').trim().toLowerCase();

    if (!orderId || !paymentId || status !== 'captured') {
      console.error('Razorpay webhook: invalid payment capture payload', { orderId, paymentId, status });
      return NextResponse.json({ success: false, error: 'Invalid payment capture payload' }, { status: 400 });
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('Razorpay webhook: MONGODB_URI is not configured');
      return NextResponse.json({ success: false, error: 'MONGODB_URI is not configured' }, { status: 500 });
    }

    try {
      const client = await getMongoClient(uri);
      const db = client.db(getDatabaseName());
      const orders = db.collection('orders');

      let existingOrder = await orders.findOne({ razorpayOrderId: orderId });
      if (!existingOrder) {
        const notes = paymentEntity?.notes as Record<string, unknown> | undefined;
        const fallbackOrderNumber = typeof notes?.orderNumber === 'string' ? notes.orderNumber.trim() : undefined;

        if (fallbackOrderNumber) {
          existingOrder = await orders.findOne({ orderNumber: fallbackOrderNumber });
          if (existingOrder) {
            console.log('Razorpay webhook: found order by fallback orderNumber', fallbackOrderNumber);
          }
        }
      }

      if (!existingOrder) {
        console.error('Razorpay webhook: order not found for razorpayOrderId', orderId);
        return NextResponse.json({ success: true, message: 'Order not found, ignoring' });
      }

      if (existingOrder.paymentStatus === 'paid') {
        console.log('Razorpay webhook: order already finalized', existingOrder.orderNumber);
        return NextResponse.json({ success: true, message: 'Already finalized' });
      }

      const inventoryResult = await validateAndUpdateInventory(db, existingOrder.items, true);
      if (!inventoryResult.success) {
        console.error('Razorpay webhook: inventory update failed', inventoryResult.error);
        return NextResponse.json({ success: false, error: inventoryResult.error }, { status: 400 });
      }

      const updateResult = await orders.updateOne(
        { _id: existingOrder._id },
        {
          $set: {
            paymentStatus: 'paid',
            orderStatus: 'confirmed',
            razorpayPaymentId: paymentId,
            updatedAt: new Date(),
          },
        }
      );

      if (updateResult.matchedCount === 0) {
        console.error('Razorpay webhook: failed to update order status', existingOrder._id);
        return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
      }

      console.log('Razorpay webhook: finalized order', existingOrder.orderNumber, 'paymentId', paymentId);
      return NextResponse.json({ success: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Razorpay webhook processing failed', msg);
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Razorpay webhook fatal error', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
