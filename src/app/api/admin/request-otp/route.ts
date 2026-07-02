import { NextRequest, NextResponse } from 'next/server';
import { WithId, Document } from 'mongodb';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

const uri = process.env.MONGODB_URI;

interface AdminOtpDoc {
  email: string;
  otpHash: string;
  expiresAt: Date;
  createdAt: Date;
}

function getEmailTransporter() {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT || '465');
  const secure = process.env.EMAIL_USE_SSL === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

async function sendAdminOtpEmail(toEmail: string, otp: string) {
  const transporter = getEmailTransporter();

  await transporter.sendMail({
    from: `"Anand Wholesale" <${process.env.EMAIL_HOST_USER}>`,
    to: toEmail,
    subject: 'Admin Login OTP - Anand Wholesale',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="margin: 0 0 12px;">Admin Login Verification</h2>
        <p style="margin: 0 0 16px;">Your OTP for admin login is:</p>
        <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; border-radius: 8px;">
          ${otp}
        </div>
        <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;">This OTP will expire in 10 minutes.</p>
      </div>
    `,
  });
}

export async function POST(request: NextRequest) {
  if (!uri) {
    return NextResponse.json(
      { error: 'MONGODB_URI is not configured on the server' },
      { status: 500 }
    );
  }

  try {
    let stage: 'validate' | 'auth' | 'mongo' | 'email' = 'validate';
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalize = (v: string) => {
      const trimmed = v.trim();
      return trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;
    };

    const envAdminEmail = process.env.ADMIN_EMAIL ? normalize(process.env.ADMIN_EMAIL) : undefined;
    const envAdminPasswordRaw = process.env.ADMIN_PASSWORD;

    if (!envAdminEmail || !envAdminPasswordRaw) {
      return NextResponse.json(
        { error: 'Admin credentials are not configured on the server' },
        { status: 500 }
      );
    }

    if (!process.env.EMAIL_HOST_USER || !process.env.EMAIL_HOST_PASSWORD) {
      return NextResponse.json(
        { error: 'Email SMTP credentials are not configured on the server' },
        { status: 500 }
      );
    }

    const envAdminPassword = normalize(envAdminPasswordRaw);
    const inputEmail = normalize(String(email)).toLowerCase();
    const inputPassword = normalize(String(password));

    const envAdminEmailNormalized = envAdminEmail.toLowerCase();

    const emailMatch = inputEmail === envAdminEmailNormalized;
    const passwordMatch = inputPassword === envAdminPassword;

    if (!emailMatch || !passwordMatch) {
      return NextResponse.json(
        {
          error: 'Invalid admin credentials',
          ...(process.env.NODE_ENV !== 'production'
            ? {
                emailMatch,
                passwordMatch,
              }
            : null),
        },
        { status: 401 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    stage = 'mongo';
    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const adminOtps = db.collection<AdminOtpDoc>('admin_otps');

    await adminOtps.updateOne(
      { email: inputEmail },
      {
        $set: { otpHash, expiresAt },
        $setOnInsert: { createdAt: new Date(), email: inputEmail },
      },
      { upsert: true }
    );

    stage = 'email';
    await Promise.race([
      sendAdminOtpEmail(inputEmail, otp),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Email send timeout')), 20_000)),
    ]);

    return NextResponse.json({ message: 'OTP sent to admin email' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: msg,
        ...(process.env.NODE_ENV !== 'production'
          ? {
              hint:
                'If this is an SMTP error, ensure EMAIL_HOST_USER is a Gmail address and EMAIL_HOST_PASSWORD is a Google App Password (not your normal password).',
            }
          : null),
      },
      { status: 500 }
    );
  }
}
