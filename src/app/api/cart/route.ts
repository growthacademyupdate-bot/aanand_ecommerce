import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  comparePrice?: number;
  color: string;
  size?: string;
  quantity: number;
  isPrebooking?: boolean;
  prebookingPrice?: number;
  prebookingDeliveryDays?: number;
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
  const jsonStr = typeof Buffer !== 'undefined' ? Buffer.from(padded, 'base64').toString('utf8') : atob(padded);
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
    const carts = db.collection('carts');
    const doc = await carts.findOne({ userId: decoded.id });
    return NextResponse.json({ cart: doc?.items || [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
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
  const items = Array.isArray((body as { items?: unknown }).items) ? (body as { items: unknown }).items : [];
  const client = await getMongoClient(uri);
  try {
    const db = client.db(getDatabaseName());
    const carts = db.collection('carts');
    await carts.updateOne(
      { userId: decoded.id },
      { $set: { items, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
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
  const client = await getMongoClient(uri);
  try {
    const db = client.db(getDatabaseName());
    const carts = db.collection('carts');
    await carts.deleteOne({ userId: decoded.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
