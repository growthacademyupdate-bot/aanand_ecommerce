import { NextRequest, NextResponse } from 'next/server';

import { WithId, Document } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

interface ContactMessage {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}

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
      { error: 'MONGODB_URI is not configured on the server' },
      { status: 500 }
    );
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const contactMessages = db.collection<ContactMessage>('contact_messages');

    const messagesRaw = await contactMessages
      .find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    const messages = messagesRaw.map((m: WithId<Document>) => ({
      _id: String(m._id),
      name: m.name as string,
      email: m.email as string,
      message: m.message as string,
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
