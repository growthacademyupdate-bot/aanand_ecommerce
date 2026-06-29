import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return NextResponse.json({ success: false, error: 'MONGODB_URI not configured' }, { status: 500 });
    }

    const client = await getMongoClient(uri);
    const database = client.db(getDatabaseName());
    
    // Test basic connection
    const collections = await database.listCollections().toArray();
    
    // Test products collection
    const productsCollection = database.collection('products');
    const totalProducts = await productsCollection.countDocuments();
    
    // Test the actual query from products API
    const activeProducts = await productsCollection
      .find({ isActive: { $ne: false } })
      .limit(5)
      .toArray();
    
    return NextResponse.json({ 
      success: true, 
      database: getDatabaseName(),
      collections: collections.map(c => c.name),
      totalProducts,
      activeProductsCount: activeProducts.length,
      sampleProducts: activeProducts.map(p => ({
        _id: p._id,
        name: p.name,
        isActive: p.isActive,
        hasIsActive: 'isActive' in p
      }))
    });
  } catch (error) {
    console.error('Debug GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return NextResponse.json({ success: false, error: 'MONGODB_URI not configured' }, { status: 500 });
    }

    const client = await getMongoClient(uri);
    const database = client.db(getDatabaseName());
    
    const product = await database.collection('products').findOne({ _id: new ObjectId(productId) });
    
    return NextResponse.json({ 
      success: true, 
      data: product,
      colorsType: typeof product?.colors,
      colorsValue: product?.colors,
      colorsIsArray: Array.isArray(product?.colors)
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
