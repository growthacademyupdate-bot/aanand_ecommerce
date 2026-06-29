import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('📧 Testing email configuration...');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('EMAIL_HOST_USER:', process.env.EMAIL_HOST_USER);
    console.log('EMAIL_USE_SSL:', process.env.EMAIL_USE_SSL);

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

    console.log('🔄 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully');

    const mailOptions = {
      from: `"Morpankh Saree" <${process.env.EMAIL_HOST_USER}>`,
      to: email,
      subject: 'Test Email - Morpankh Saree',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937;">Test Email from Morpankh Saree</h2>
          <p style="color: #4b5563;">This is a test email to verify that your email configuration is working correctly.</p>
          <p style="color: #4b5563;">If you received this email, your email settings are configured properly!</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Test sent at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    };

    console.log('🔄 Sending test email to:', email);
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Test email sent successfully:', info.messageId);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('✗ Test email failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
