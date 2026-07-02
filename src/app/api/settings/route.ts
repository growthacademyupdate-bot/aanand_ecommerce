import { NextResponse } from 'next/server';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

export async function GET() {
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
