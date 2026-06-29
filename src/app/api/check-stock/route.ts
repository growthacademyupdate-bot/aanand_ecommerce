import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

interface ColorVariant {
  colorName?: string;
  stock?: number;
  images?: string[];
}

export async function GET(request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json({ success: false, error: 'MONGODB_URI not configured' });
  }

  const client = await getMongoClient(uri);
  try {
    const database = client.db(getDatabaseName());
    
    const product = await database.collection('products').findOne({ 
      name: 'Vintage Floral Grace' 
    });
    
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' });
    }

    console.log('🔍 DIRECT STOCK CHECK - Vintage Floral Grace:', {
      productName: product.name,
      mainStock: product.stock,
      colors: product.colors,
      greyStock: product.colors?.find((c: ColorVariant) => 
        c.colorName?.toLowerCase() === 'grey'
      )?.stock,
      whiteStock: product.colors?.find((c: ColorVariant) => 
        c.colorName?.toLowerCase() === 'white'
      )?.stock,
      pastelStock: product.colors?.find((c: ColorVariant) => 
        c.colorName?.toLowerCase() === 'pastel'
      )?.stock
    });

    return NextResponse.json({
      success: true,
      productName: product.name,
      mainStock: product.stock,
      colors: product.colors,
      greyStock: product.colors?.find((c: ColorVariant) => 
        c.colorName?.toLowerCase() === 'grey'
      )?.stock,
      whiteStock: product.colors?.find((c: ColorVariant) => 
        c.colorName?.toLowerCase() === 'white'
      )?.stock,
      pastelStock: product.colors?.find((c: ColorVariant) => 
        c.colorName?.toLowerCase() === 'pastel'
      )?.stock
    });
  } catch (error) {
    console.error('Error checking stock:', error);
    return NextResponse.json({ success: false, error: 'Failed to check stock' });
  }
}