import { NextRequest, NextResponse } from 'next/server';
import { WithId, Document } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

const uri = process.env.MONGODB_URI!;

interface AdminOtpDoc {
  email: string;
  otpHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const normalize = (v: string) => {
      const trimmed = v.trim();
      return trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;
    };

    const envAdminEmail = process.env.ADMIN_EMAIL ? normalize(process.env.ADMIN_EMAIL).toLowerCase() : undefined;
    if (!envAdminEmail) {
      return NextResponse.json(
        { error: 'Admin credentials are not configured on the server' },
        { status: 500 }
      );
    }

    const inputEmail = normalize(String(email)).toLowerCase();
    if (inputEmail !== envAdminEmail) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const adminOtps = db.collection<AdminOtpDoc>('admin_otps');

    const record = await adminOtps.findOne({ email: inputEmail });

    if (!record) {
      return NextResponse.json(
        { error: 'OTP not found. Please request a new OTP.' },
        { status: 400 }
      );
    }

    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      await adminOtps.deleteOne({ email: inputEmail });
      return NextResponse.json(
        { error: 'OTP expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(String(otp), record.otpHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    await adminOtps.deleteOne({ email: inputEmail });

    const token = 'admin-token';

    return NextResponse.json({
      message: 'Admin login successful',
      token,
      user: {
        id: 'admin',
        name: 'Admin',
        email: inputEmail,
        verified: true,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
