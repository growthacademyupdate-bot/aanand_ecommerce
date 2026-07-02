import { NextRequest, NextResponse } from 'next/server';
import { WithId, Document, ObjectId, Db } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import nodemailer from 'nodemailer';

interface ColorVariant {
  colorName?: string;
  stock?: number;
  images?: string[];
  sizes?: { [key: string]: number };
  hasSizes?: boolean;
}

export const runtime = 'nodejs';

interface OrderItem {
  productId: string;
  name: string;
  image?: string;
  color: string;
  size?: string;
  quantity: number;
  price: number;
}

interface OrderDoc {
  userId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  alternatePhone?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader) return null;

  const raw = authHeader.trim();
  if (raw.toLowerCase().startsWith('bearer ')) return raw.slice(7).trim();
  return raw;
}

function decodeBase64Json(b64: string): unknown {
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

  const jsonStr =
    typeof Buffer !== 'undefined'
      ? Buffer.from(padded, 'base64').toString('utf8')
      : atob(padded);

  return JSON.parse(jsonStr) as unknown;
}

function verifyToken(token: string): { id: string; email?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = decodeBase64Json(parts[1]);
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;

    const exp = typeof p.exp === 'number' ? p.exp : undefined;
    if (exp && exp < Date.now() / 1000) return null;

    const userId = (p.id ?? p.userId) as unknown;
    if (!userId) return null;

    const email = typeof p.email === 'string' ? p.email : undefined;
    return { id: String(userId), email };
  } catch {
    return null;
  }
}

function normalizeOrderItem(raw: unknown): OrderItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const productId = String(r.productId ?? '').trim();
  const name = String(r.name ?? '').trim();
  const image = typeof r.image === 'string' ? r.image.trim() : undefined;
  const color = String(r.color ?? '').trim();
  const size = typeof r.size === 'string' ? r.size : undefined;
  const quantity = Number(r.quantity);
  const price = Number(r.price);

  if (!productId || !name || !color) return null;
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  if (!Number.isFinite(price) || price < 0) return null;

  return {
    productId,
    name,
    image,
    color,
    size,
    quantity,
    price,
  };
}

interface InventoryResult {
  success: boolean;
  error?: string;
}

async function validateAndUpdateInventory(db: Db, items: OrderItem[], updateStock: boolean): Promise<InventoryResult> {
  const products = db.collection('products');

  for (const item of items) {
    const product = await products.findOne({ _id: new ObjectId(item.productId) });
    if (!product) {
      return { success: false, error: `Product not found: ${item.productId}` };
    }

    let availableStock = 0;
    if (product.colors && Array.isArray(product.colors)) {
      const colorVariant = product.colors.find((c: unknown) =>
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
        error: `Insufficient stock for ${item.color} (${item.name}). Available: ${availableStock}, Requested: ${item.quantity}`,
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
      const colorIndex = product.colors.findIndex((c: unknown) =>
        c && typeof c === 'object' &&
        typeof (c as { colorName?: unknown }).colorName === 'string' &&
        String((c as { colorName?: unknown }).colorName).trim().toLowerCase() === item.color.trim().toLowerCase()
      );

      if (colorIndex !== -1) {
        const currentStock = Number(product.colors[colorIndex].stock) || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        await products.updateOne(
          { _id: new ObjectId(item.productId) },
          {
            $set: {
              [`colors.${colorIndex}.stock`]: newStock,
              updatedAt: new Date(),
            },
          }
        );
      } else {
        return { success: false, error: `Color variant not found during update: ${item.color} for product ${item.productId}` };
      }
    } else {
      const currentStock = Number(product.stock) || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      await products.updateOne(
        { _id: new ObjectId(item.productId) },
        {
          $set: {
            stock: newStock,
            updatedAt: new Date(),
          },
        }
      );
    }
  }

  return { success: true };
}

async function sendInvoiceEmail(order: OrderDoc): Promise<boolean> {
  try {
    console.log('📧 Attempting to send invoice email to:', order.customerEmail);
    console.log('📧 Order details:', {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      total: order.total,
      itemsCount: order.items.length
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: process.env.EMAIL_USE_SSL === 'true',
      auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD,
      },
      logger: true,
      debug: true,
    });

    // Verify SMTP Connection
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully');

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.color}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.size || 'N/A'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toLocaleString()}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
        </tr>
      `
      )
      .join('');

    const mailOptions = {
      from: `"Morpankh Saree" <${process.env.EMAIL_HOST_USER}>`,
      to: order.customerEmail,
      subject: `Order Confirmation - ${order.orderNumber} | Morpankh Saree`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #dbeafe; padding-bottom: 20px;">
              <h1 style="margin: 0; color: #1f2937; font-size: 28px;">Morpankh Saree</h1>
              <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">Celebrating Indian Tradition</p>
            </div>

            <!-- Order Status -->
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
              <h2 style="margin: 0 0 8px; color: #059669; font-size: 18px;">✓ Order Confirmed!</h2>
              <p style="margin: 0; color: #047857;">Thank you for your purchase. Your order has been successfully placed.</p>
            </div>

            <!-- Order Details -->
            <div style="margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold; width: 50%;">Order Number:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${order.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Order Date:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${order.date}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Status:</td>
                  <td style="padding: 8px 0; color: #10b981; font-weight: bold;">Confirmed</td>
                </tr>
              </table>
            </div>

            <!-- Customer Details -->
            <div style="margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Delivery Address</h3>
              <p style="margin: 0; color: #1f2937; font-weight: bold;">${order.customerName}</p>
              <p style="margin: 5px 0; color: #4b5563;">${order.address}</p>
              <p style="margin: 5px 0; color: #4b5563;">${order.city}, ${order.state} ${order.pincode}</p>
              <p style="margin: 5px 0; color: #4b5563;">Phone: ${order.customerPhone}</p>
              ${order.alternatePhone ? `<p style="margin: 5px 0; color: #4b5563;">Alternate Phone: ${order.alternatePhone}</p>` : ''}
            </div>

            <!-- Order Items -->
            <div style="margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151;">Product</th>
                    <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Color</th>
                    <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Size</th>
                    <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-weight: bold; color: #374151;">Price</th>
                    <th style="padding: 12px; text-align: right; font-weight: bold; color: #374151;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <!-- Order Summary -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; text-align: right;">Subtotal:</td>
                  <td style="padding: 10px 15px; text-align: right; color: #1f2937;">₹${order.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: bold; font-size: 18px; text-align: right;">Total Amount:</td>
                  <td style="padding: 10px 15px; background-color: #dbeafe; color: #1e40af; font-weight: bold; font-size: 18px; text-align: right; border-radius: 4px;">₹${order.total.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <!-- Next Steps -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
              <h4 style="margin: 0 0 8px; color: #92400e; font-weight: bold;">What's Next?</h4>
              <p style="margin: 0; color: #78350f; font-size: 14px;">Your order will be processed shortly. You will receive a shipping confirmation email with tracking details once your order is dispatched.</p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Thank you for shopping with Morpankh Saree!</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated email. Please do not reply. For any queries, contact us at support@morpankh.com
              </p>
            </div>

          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Invoice email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('✗ Failed to send invoice email:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json({ error: 'MONGODB_URI is not configured on the server' }, { status: 500 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const client = await getMongoClient(uri);
  try {
    const db = client.db(getDatabaseName());
    const orders = db.collection<OrderDoc>('orders');

    const docs = await orders
      .find({ userId: decoded.id })
      .sort({ createdAt: -1 })
      .toArray();

    const data = docs.map((d) => {
      const oid = (d as unknown as { _id: ObjectId })._id;
      const id = oid ? oid.toString() : undefined;
      return {
        ...d,
        _id: id,
        id,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Orders GET failed', { userId: decoded.id, error: msg });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json({ error: 'MONGODB_URI is not configured on the server' }, { status: 500 });
  }

  const token = getBearerToken(request);
  const decoded = token ? verifyToken(token) : null;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const customerName = String(b.customerName ?? '').trim();
  const customerEmail = String(b.customerEmail ?? '').trim();
  const customerPhone = String(b.customerPhone ?? '').trim();
  const alternatePhone = String(b.alternatePhone ?? '').trim();
  const razorpayOrderId = typeof b.razorpayOrderId === 'string' ? b.razorpayOrderId.trim() : undefined;
  const razorpayPaymentId = typeof b.razorpayPaymentId === 'string' ? b.razorpayPaymentId.trim() : undefined;
  const address = String(b.address ?? '').trim();
  const city = String(b.city ?? '').trim();
  const state = String(b.state ?? '').trim();
  const pincode = String(b.pincode ?? '').trim();

  const itemsRaw = Array.isArray(b.items) ? b.items : [];
  const items = itemsRaw.map(normalizeOrderItem).filter(Boolean) as OrderItem[];

  // Note: We will calculate subtotal and total dynamically below based on DB prices
  let subtotal = Number(b.subtotal);
  let total = Number(b.total);

  const paymentStatus = String(b.paymentStatus ?? 'paid') as OrderDoc['paymentStatus'];
  const orderStatus = String(b.orderStatus ?? 'confirmed') as OrderDoc['orderStatus'];
  const isDraft = paymentStatus === 'pending' && orderStatus === 'pending';
  const date = String(b.date ?? new Date().toISOString().split('T')[0]);

  if (!customerName || !customerEmail || !customerPhone) {
    return NextResponse.json({ error: 'customerName, customerEmail and customerPhone are required' }, { status: 400 });
  }
  if (!address || !city || !state || !pincode) {
    return NextResponse.json({ error: 'address, city, state and pincode are required' }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: 'At least one order item is required' }, { status: 400 });
  }
  if (!Number.isFinite(subtotal) || !Number.isFinite(total)) {
    return NextResponse.json({ error: 'subtotal and total must be valid numbers' }, { status: 400 });
  }

  const client = await getMongoClient(uri);
  try {
    const db = client.db(getDatabaseName());
    const orders = db.collection<OrderDoc>('orders');

    let orderNumber: string;
    if (b.orderNumber) {
      orderNumber = String(b.orderNumber);
    } else {
      // Get last order number and increment
      const lastOrder = await orders.findOne({}, { sort: { createdAt: -1 } });
      const lastOrderNumber = lastOrder?.orderNumber || 'ORD-00000';
      const lastNumber = parseInt(lastOrderNumber.replace('ORD-', '')) || 0;
      const nextNumber = lastNumber + 1;
      orderNumber = `ORD-${nextNumber.toString().padStart(5, '0')}`;
    }

    // Fetch wholesale settings
    const settingsDoc = await db.collection('settings').findOne({ _id: 'global_settings' });
    const wholesaleEnabled = settingsDoc?.wholesaleEnabled || false;

    // Recalculate prices from DB to prevent tampering
    let calculatedSubtotal = 0;
    for (const item of items) {
      const product = await db.collection('products').findOne({ _id: new ObjectId(item.productId) });
      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });
      }

      let appliedPrice = product.price;
      if (wholesaleEnabled && product.wholesalePrice && product.moq && item.quantity >= product.moq) {
        appliedPrice = product.wholesalePrice;
      }
      
      item.price = appliedPrice; // Save the correctly applied price
      calculatedSubtotal += appliedPrice * item.quantity;
    }

    subtotal = calculatedSubtotal;
    total = calculatedSubtotal;

    const now = new Date();
    const doc: OrderDoc = {
      userId: decoded?.id || 'guest',
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      alternatePhone: alternatePhone || undefined,
      razorpayOrderId,
      razorpayPaymentId,
      address,
      city,
      state,
      pincode,
      items,
      subtotal,
      total,
      paymentStatus,
      orderStatus,
      date,
      createdAt: now,
      updatedAt: now,
    };

    const inventoryResult = await validateAndUpdateInventory(db, items, !isDraft);
    if (!inventoryResult.success) {
      return NextResponse.json({ success: false, error: inventoryResult.error ?? 'Inventory validation failed' }, { status: 400 });
    }

    const result = await orders.insertOne(doc);

    console.log('📧 Order created successfully, orderNumber:', doc.orderNumber, 'draft:', isDraft);

    if (!isDraft) {
      const completeOrder = {
        ...doc,
        _id: result.insertedId,
      };
      console.log('📧 Sending invoice email for final order...');
      sendInvoiceEmail(completeOrder)
        .then((success) => {
          if (success) {
            console.log(`✓ Invoice email sent successfully to ${completeOrder.customerEmail} for order ${completeOrder.orderNumber}`);
          } else {
            console.error(`✗ Failed to send invoice email to ${completeOrder.customerEmail} for order ${completeOrder.orderNumber}`);
          }
        })
        .catch((err) => console.error('Email sending error:', err));
    } else {
      console.log('⚠️ Draft order created without sending invoice email:', doc.orderNumber);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...doc,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Orders POST failed', { userId: decoded?.id || 'guest', error: msg });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json({ error: 'MONGODB_URI is not configured on the server' }, { status: 500 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const id = typeof b.id === 'string' ? b.id.trim() : undefined;
  const orderNumber = typeof b.orderNumber === 'string' ? b.orderNumber.trim() : undefined;
  const razorpayOrderId = typeof b.razorpayOrderId === 'string' ? b.razorpayOrderId.trim() : undefined;
  const razorpayPaymentId = typeof b.razorpayPaymentId === 'string' ? b.razorpayPaymentId.trim() : undefined;
  const paymentStatus = typeof b.paymentStatus === 'string' ? (b.paymentStatus as OrderDoc['paymentStatus']) : undefined;
  const orderStatus = typeof b.orderStatus === 'string' ? (b.orderStatus as OrderDoc['orderStatus']) : undefined;

  if (!id && !orderNumber) {
    return NextResponse.json({ error: 'id or orderNumber is required to update the order' }, { status: 400 });
  }

  if (!razorpayOrderId && !razorpayPaymentId && !paymentStatus && !orderStatus) {
    return NextResponse.json({ error: 'At least one update field is required' }, { status: 400 });
  }

  const client = await getMongoClient(uri);
  try {
    const db = client.db(getDatabaseName());
    const orders = db.collection<OrderDoc>('orders');

    const filter = id ? { _id: new ObjectId(id) } : { orderNumber };
    const existingOrder = await orders.findOne(filter as Record<string, unknown>);
    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (razorpayOrderId) update.razorpayOrderId = razorpayOrderId;
    if (razorpayPaymentId) update.razorpayPaymentId = razorpayPaymentId;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (orderStatus) update.orderStatus = orderStatus;

    const shouldUpdateStock = existingOrder.paymentStatus !== 'paid' && paymentStatus === 'paid';
    if (shouldUpdateStock) {
      const inventoryResult = await validateAndUpdateInventory(db, existingOrder.items, true);
      if (!inventoryResult.success) {
        return NextResponse.json({ success: false, error: inventoryResult.error ?? 'Inventory update failed' }, { status: 400 });
      }
    }

    const result = await orders.updateOne(filter as Record<string, unknown>, { $set: update });
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (paymentStatus === 'paid' && orderStatus === 'confirmed') {
      const updatedOrder = await orders.findOne(filter as Record<string, unknown>);
      if (updatedOrder) {
        sendInvoiceEmail(updatedOrder as OrderDoc)
          .then((success) => {
            if (success) {
              console.log(`✓ Invoice email sent successfully for updated order ${updatedOrder.orderNumber}`);
            } else {
              console.error(`✗ Failed to send invoice email for updated order ${updatedOrder.orderNumber}`);
            }
          })
          .catch((err) => console.error('Email sending error:', err));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Orders PUT failed', { error: msg });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
