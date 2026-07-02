import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { getDatabaseName } from '@/lib/database';

const uri = process.env.MONGODB_URI!;

interface User {
  name: string;
  email: string;
  password: string;
  otp?: string;
  otpExpiry?: Date;
  verified: boolean;
  createdAt: Date;
}

async function sendOTP(email: string, otp: string) {
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: process.env.EMAIL_USE_SSL === 'true',
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_HOST_USER,
    to: email,
    subject: 'OTP for Account Verification - Anand Wholesale',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Anand Wholesale!</h2>
        <p>Your OTP for account verification is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function POST(request: NextRequest) {
  const client = new MongoClient(uri);
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db(getDatabaseName());
    const users = db.collection<User>('users');

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user: User = {
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
      verified: false,
      createdAt: new Date(),
    };

    const result = await users.insertOne(user);

    // Send OTP email
    try {
      const emailResult = await sendOTP(email, otp);
      console.log(`✓ OTP ${otp} sent to ${email}`);
    } catch (emailError) {
      console.error('✗ Failed to send OTP email:', emailError);
      // Return error to client so user knows email sending failed
      return NextResponse.json(
        {
          error: `Email sending failed. ${emailError instanceof Error ? emailError.message : 'Unknown error'}. Please try registering again.`,
          userId: result.insertedId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'User registered successfully. Please check your email for OTP verification.',
      userId: result.insertedId,
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}