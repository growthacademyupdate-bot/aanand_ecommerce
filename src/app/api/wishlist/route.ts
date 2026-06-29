import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient, getDatabaseName } from '@/lib/database';

export const runtime = 'nodejs';

interface WishlistDoc {
  userId: string;
  productIds: string[];
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

  // Prefer Buffer when available (nodejs runtime), otherwise fallback to atob.
  const jsonStr =
    typeof Buffer !== 'undefined'
      ? Buffer.from(padded, 'base64').toString('utf8')
      : atob(padded);

  return JSON.parse(jsonStr) as unknown;
}

function verifyToken(token: string): { id: string } | null {
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
    return { id: String(userId) };
  } catch {
    return null;
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
    const wishlists = db.collection<WishlistDoc>('wishlists');

    const doc = await wishlists.findOne({ userId: decoded.id });

    return NextResponse.json({ wishlist: doc?.productIds || [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Wishlist GET failed', { userId: decoded.id, error: msg });
    return NextResponse.json({ error: msg, hint: 'Wishlist read failed', where: 'GET /api/wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const productId =
    body && typeof body === 'object' && 'productId' in body
      ? String((body as Record<string, unknown>).productId || '').trim()
      : '';
  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const client = await getMongoClient(uri);
  try {
    const db = client.db(getDatabaseName());
    const wishlists = db.collection<WishlistDoc>('wishlists');

    const now = new Date();
    await wishlists.updateOne(
      { userId: decoded.id },
      {
        $setOnInsert: { userId: decoded.id, createdAt: now },
        $addToSet: { productIds: productId },
        $set: { updatedAt: now },
      },
      { upsert: true }
    );

    const updated = await wishlists.findOne({ userId: decoded.id });
    return NextResponse.json({ wishlist: updated?.productIds || [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Wishlist POST failed', { userId: decoded.id, productId, error: msg });
    return NextResponse.json(
      {
        error: msg,
        hint: 'Wishlist write failed',
        where: 'POST /api/wishlist',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const productId = String(searchParams.get('productId') || '').trim();
  if (!productId) {
    return NextResponse.json({ error: 'productId query param is required' }, { status: 400 });
  }

  const client = await getMongoClient(uri);
  try {
    const db = client.db(getDatabaseName());
    const wishlists = db.collection<WishlistDoc>('wishlists');

    const now = new Date();
    await wishlists.updateOne(
      { userId: decoded.id },
      {
        $pull: { productIds: productId },
        $set: { updatedAt: now },
      }
    );

    const updated = await wishlists.findOne({ userId: decoded.id });
    return NextResponse.json({ wishlist: updated?.productIds || [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Wishlist DELETE failed', { userId: decoded.id, productId, error: msg });
    return NextResponse.json({ error: msg, hint: 'Wishlist delete failed', where: 'DELETE /api/wishlist' }, { status: 500 });
  }
}
