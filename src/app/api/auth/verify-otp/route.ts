import { NextRequest, NextResponse } from 'next/server';
import { ObjectId, WithId, Document } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

interface User {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  otp?: string;
  otpExpiry?: Date;
  verified: boolean;
  createdAt: Date;
}

async function sendWelcomeEmail(email: string, name: string) {
  try {
    console.log('📧 Attempting to send welcome email to:', email);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: process.env.EMAIL_USE_SSL === 'true',
      auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD,
      },
      logger: true,
      debug: true,
    });

    // Verify SMTP Connection
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully');

    const mailOptions = {
      from: `"Anand Wholesale" <${process.env.EMAIL_HOST_USER}>`,
      to: email,
      subject: 'Welcome to Anand Wholesale - Account Verified Successfully!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="margin: 0 0 12px; color: #2563eb;">Welcome to Anand Wholesale, ${name}!</h2>
          <p style="margin: 0 0 16px;">Congratulations! Your email has been successfully verified and your account is now active.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px; color: #1f2937;">What you can do now:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Browse our exclusive collection of traditional sarees</li>
              <li style="margin-bottom: 8px;">Add items to your wishlist</li>
              <li style="margin-bottom: 8px;">Place orders securely</li>
              <li style="margin-bottom: 8px;">Track your order history</li>
              <li style="margin-bottom: 8px;">Get personalized recommendations</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Shopping Now</a>
          </div>
          
          <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px;">
            If you have any questions, feel free to contact our support team.
          </p>
          
          <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
            Happy Shopping!<br>
            <strong>Anand Wholesale Team</strong>
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Welcome email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('✗ Failed to send welcome email:', error);
    return false;
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

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json(
      { error: 'JWT_SECRET is not configured on the server' },
      { status: 500 }
    );
  }

  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const users = db.collection<User>('users');

    // Find user with matching email and OTP
    const user = await users.findOne({
      email,
      otp,
      otpExpiry: { $gt: new Date() }, // OTP not expired
      verified: false,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Update user as verified and remove OTP
    await users.updateOne(
      { _id: user._id },
      {
        $set: { verified: true },
        $unset: { otp: 1, otpExpiry: 1 },
      }
    );

    // Send welcome email after successful verification
    const emailSent = await sendWelcomeEmail(user.email, user.name);
    if (!emailSent) {
      console.warn('Welcome email failed to send, but account verification succeeded');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Account verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        verified: true,
      },
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}