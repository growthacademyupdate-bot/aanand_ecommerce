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

export async function GET(request: NextRequest) {
  void request;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json(
      { enabled: true, text: 'Free Shipping On Orders Above 1499' },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }

  const client = await getMongoClient(uri);
  try {
    const db = client.db(getDatabaseName());
    const settings = db.collection<AnnouncementDoc>('site_settings');

    const record = await settings.findOne({ key: 'announcement_bar' });
    if (!record) {
      return NextResponse.json(
        { enabled: true, text: 'Free Shipping On Orders Above 1499' },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    return NextResponse.json(
      { enabled: Boolean(record.enabled), text: String(record.text || '') },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch {
    return NextResponse.json(
      { enabled: true, text: 'Free Shipping On Orders Above 1499' },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}
