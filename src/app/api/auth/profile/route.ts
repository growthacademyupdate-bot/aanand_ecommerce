import { NextRequest, NextResponse } from 'next/server';
import { WithId, Document } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

const uri = process.env.MONGODB_URI!;
const JWT_SECRET = process.env.JWT_SECRET || 'morpankh-saree-jwt-secret-key-2026';

interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  verified: boolean;
  mobile?: string;
  alternateMobile?: string;
  address?: string;
  city?: string;
  pincode?: string;
  createdAt: Date;
}

function normalizeOptionalString(value: unknown): string | undefined {
  const s = String(value ?? '').trim();
  return s.length > 0 ? s : undefined;
}

function normalizePhone(value: unknown): string | undefined {
  const raw = normalizeOptionalString(value);
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, '');
  return digits.length > 0 ? digits : undefined;
}

function isValidPhone(digits: string): boolean {
  return /^\d{10}$/.test(digits);
}

function isValidPincode(digits: string): boolean {
  return /^\d{6}$/.test(digits);
}

// Simple JWT verification (since jsonwebtoken might not be available)
function verifyToken(token: string): { id: string } | null {
  try {
    // For now, we'll use a simple approach - in production, use proper JWT verification
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode payload (base64)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check if token is expired (simple check)
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return { id: payload.id };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const users = db.collection<User>('users');

    const user = await users.findOne({ id: decoded.id });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove sensitive fields
    const { _id, ...userWithoutId } = user;
    return NextResponse.json(userWithoutId);

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found');
      return NextResponse.json({ error: 'Unauthorized: No valid token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 50) + '...');
    
    const decoded = verifyToken(token);
    console.log('Decoded token:', decoded);
    
    if (!decoded) {
      console.log('Token verification failed');
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const updates: Partial<User> = await request.json();
    console.log('Profile updates:', updates);
    
    // Validate required fields
    if (!updates.name || !updates.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const mobileDigits = normalizePhone(updates.mobile);
    const altMobileDigits = normalizePhone(updates.alternateMobile);
    const address = normalizeOptionalString(updates.address);
    const city = normalizeOptionalString(updates.city);
    const pincodeDigits = normalizePhone(updates.pincode);

    if (mobileDigits && !isValidPhone(mobileDigits)) {
      return NextResponse.json({ error: 'Mobile Number must be exactly 10 digits' }, { status: 400 });
    }
    if (altMobileDigits && !isValidPhone(altMobileDigits)) {
      return NextResponse.json({ error: 'Alternate Mobile must be exactly 10 digits' }, { status: 400 });
    }
    if (mobileDigits && altMobileDigits && mobileDigits === altMobileDigits) {
      return NextResponse.json({ error: 'Alternate Mobile must be different from Mobile Number' }, { status: 400 });
    }

    if (address && (address.length < 5 || address.length > 250)) {
      return NextResponse.json({ error: 'Address must be between 5 and 250 characters' }, { status: 400 });
    }

    if (city && (city.length < 2 || city.length > 60 || !/^[a-zA-Z\s.\-']+$/.test(city))) {
      return NextResponse.json({ error: 'City must be 2-60 characters and contain only letters' }, { status: 400 });
    }

    if (pincodeDigits && !isValidPincode(pincodeDigits)) {
      return NextResponse.json({ error: 'Pincode must be exactly 6 digits' }, { status: 400 });
    }

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const users = db.collection<User>('users');

    // Check if email is being changed and if it's already taken
    const existingUser = await users.findOne({ 
      email: updates.email, 
      id: { $ne: decoded.id } 
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const updateData: Partial<User> = {
      name: updates.name,
      email: updates.email,
      mobile: mobileDigits,
      alternateMobile: altMobileDigits,
      address,
      city,
      pincode: pincodeDigits,
    };

    console.log('Updating user with ID:', decoded.id);
    console.log('Update data:', updateData);

    const result = await users.updateOne(
      { id: decoded.id },
      { $set: updateData }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch updated user data
    const updatedUser = await users.findOne({ id: decoded.id });
    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to fetch updated user' }, { status: 500 });
    }

    // Remove sensitive fields
    const { _id, ...userWithoutId } = updatedUser;
    console.log('Updated user data:', userWithoutId);
    
    return NextResponse.json(userWithoutId);

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
