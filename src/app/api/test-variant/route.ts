import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return NextResponse.json({ success: false, error: 'MONGODB_URI not configured' }, { status: 500 });
    }

    const client = await getMongoClient(uri);
    const database = client.db(getDatabaseName());
    
    const product = await database.collection('products').findOne({ _id: new ObjectId('69faca8d1a9df7043c38dd0d') });
    
    // Create simple test response
    const testColors = [
      { colorName: 'Purple', stock: 0, images: ['https://example.com/purple.jpg'] },
      { colorName: 'Yellow', stock: 1, images: ['https://example.com/yellow.jpg'] }
    ];
    
    const testResponse = {
      id: '69faca8d1a9df7043c38dd0d',
      name: 'Garden Muse Saree PT11',
      colors: testColors,
      debug: {
        dbColors: product?.colors,
        testColors: testColors,
        dbColorsType: typeof product?.colors,
        dbColorsIsArray: Array.isArray(product?.colors)
      }
    };
    
    console.log('🧪 TEST RESPONSE:', testResponse);
    
    return NextResponse.json({ success: true, data: testResponse });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
