import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AnnouncementDoc = {
  key: 'announcement_bar';
  text: string;
  enabled: boolean;
  updatedAt: Date;
};

function isAdminRequest(request: NextRequest) {
  const auth = (request.headers.get('authorization') || '').trim();
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token === 'admin-token';
}

export async function GET(request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json(
      { success: false, error: 'MONGODB_URI is not configured on the server' },
      { status: 500 }
    );
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const client = await getMongoClient(uri);
  try {
    const db = client.db(getDatabaseName());
    const settings = db.collection<AnnouncementDoc>('site_settings');

    const record = await settings.findOne({ key: 'announcement_bar' });

    return NextResponse.json({
      success: true,
      data: {
        enabled: record ? Boolean(record.enabled) : true,
        text: record ? String(record.text || '') : 'Free Shipping On Orders Above 1499',
      },
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json(
      { success: false, error: 'MONGODB_URI is not configured on the server' },
      { status: 500 }
    );
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const enabled = Boolean(body?.enabled);
  const text = String(body?.text || '').trim();

  const client = await getMongoClient(uri);
  try {
    const db = client.db(getDatabaseName());
    const settings = db.collection<AnnouncementDoc>('site_settings');

    const next: AnnouncementDoc = {
      key: 'announcement_bar',
      enabled,
      text,
      updatedAt: new Date(),
    };

    await settings.updateOne(
      { key: 'announcement_bar' },
      { $set: next },
      { upsert: true }
    );

    return NextResponse.json({ success: true, data: { enabled, text } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
