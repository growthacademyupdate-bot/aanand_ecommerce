import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

function isAdminRequest(request: NextRequest) {
  const auth = (request.headers.get('authorization') || '').trim();
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token === 'admin-token';
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: 'MONGODB_URI is not configured' }, { status: 500 });

  const client = await getMongoClient(uri);
  try {
    const db = client.db(getDatabaseName());
    const settingsColl = db.collection('settings');
    const settings = await settingsColl.findOne({ _id: 'global' as any });

    return NextResponse.json({
      success: true,
      data: {
        wholesaleEnabled: settings?.wholesaleEnabled ?? false,
      }
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: 'MONGODB_URI is not configured' }, { status: 500 });

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const client = await getMongoClient(uri);
  try {
    const db = client.db(getDatabaseName());
    const settingsColl = db.collection('settings');

    await settingsColl.updateOne(
      { _id: 'global' as any },
      {
        $set: {
          wholesaleEnabled: Boolean(body.wholesaleEnabled),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
