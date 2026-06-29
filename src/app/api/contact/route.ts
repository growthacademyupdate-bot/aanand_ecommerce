import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient, getDatabaseName } from '@/lib/database';
import { WithId, Document } from 'mongodb';

export const runtime = 'nodejs';

interface ContactMessage {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}

function isAdminRequest(request: NextRequest) {
  const auth = (request.headers.get('authorization') || '').trim();
  const bearerMatch = auth.match(/^Bearer\s+(.+)$/i);
  const rawToken = (bearerMatch?.[1] ?? auth).trim();
  const token = rawToken.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
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
    const auth = request.headers.get('authorization');
    const authTrimmed = (auth || '').trim();
    const bearerMatch = authTrimmed.match(/^Bearer\s+(.+)$/i);
    const rawToken = (bearerMatch?.[1] ?? authTrimmed).trim();
    const token = rawToken.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();

    return NextResponse.json(
      {
        error: 'Unauthorized',
        ...(process.env.NODE_ENV !== 'production'
          ? {
              hasAuthorizationHeader: Boolean(auth && authTrimmed.length > 0),
              authorizationHeaderPrefix: authTrimmed.slice(0, 10),
              parsedTokenLength: token.length,
            }
          : null),
      },
      { status: 401 }
    );
  }

  const client = await getMongoClient(uri);

  try {
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

export async function POST(request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json(
      { error: 'MONGODB_URI is not configured on the server' },
      { status: 500 }
    );
  }

  const client = await getMongoClient(uri);

  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    const db = client.db(getDatabaseName());
    const contactMessages = db.collection<ContactMessage>('contact_messages');

    await contactMessages.insertOne({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      message: String(message).trim(),
      createdAt: new Date(),
    });

    return NextResponse.json({ message: 'Message sent successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: msg,
        ...(process.env.NODE_ENV !== 'production'
          ? {
              hint:
                'If this is a timeout/ECONNREFUSED, ensure MongoDB is running locally on mongodb://localhost:27017 and the morepankh_6th_may database is accessible.',
            }
          : null),
      },
      { status: 500 }
    );
  }
}
