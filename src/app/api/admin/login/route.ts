import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
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

    const envAdminEmail = process.env.ADMIN_EMAIL ? normalize(process.env.ADMIN_EMAIL).toLowerCase() : undefined;
    const envAdminPassword = process.env.ADMIN_PASSWORD ? normalize(process.env.ADMIN_PASSWORD) : undefined;

    if (!envAdminEmail || !envAdminPassword) {
      return NextResponse.json(
        { error: 'Admin credentials are not configured on the server' },
        { status: 500 }
      );
    }

    const inputEmail = normalize(String(email)).toLowerCase();
    const inputPassword = normalize(String(password));

    if (inputEmail !== envAdminEmail || inputPassword !== envAdminPassword) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'Login successful',
      token: 'admin-token',
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
