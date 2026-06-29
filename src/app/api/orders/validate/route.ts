import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';

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

function normalizeOrderItem(raw: unknown): OrderItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const productId = String(r.productId ?? '').trim();
  const name = String(r.name ?? '').trim();
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
    image: typeof r.image === 'string' ? r.image.trim() : undefined,
    color,
    size,
    quantity,
    price,
  };
}

export async function POST(request: NextRequest) {
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

  const itemsRaw = Array.isArray((body as Record<string, unknown>).items)
    ? ((body as Record<string, unknown>).items as unknown[])
    : [];

  const items = itemsRaw.map(normalizeOrderItem).filter(Boolean) as OrderItem[];
  if (items.length === 0) {
    return NextResponse.json({ success: false, error: 'At least one order item is required' }, { status: 400 });
  }

  try {
    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const products = db.collection('products');

    for (const item of items) {
      const product = await products.findOne({ _id: new ObjectId(item.productId) });
      if (!product) {
        return NextResponse.json({ success: false, error: `Product not found: ${item.productId}` }, { status: 400 });
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
          return NextResponse.json({ success: false, error: `Color variant not found: ${item.color} for product ${product.name}` }, { status: 400 });
        }
        availableStock = Number((colorVariant as { stock?: unknown }).stock) || 0;
      } else {
        availableStock = Number(product.stock) || 0;
      }

      if (availableStock < item.quantity) {
        return NextResponse.json({
          success: false,
          error: `Insufficient stock for ${item.color} (${item.name}). Available: ${availableStock}, Requested: ${item.quantity}`,
        }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Order validation failed', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
