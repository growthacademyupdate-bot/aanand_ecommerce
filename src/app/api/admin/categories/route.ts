import { NextRequest, NextResponse } from 'next/server';
import { Db, ObjectId } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import { invalidateCategoryCache } from '@/lib/redis';
import { uploadImage } from '@/lib/cloudinary';

export const runtime = 'nodejs';

let db: Db;

async function getDatabase() {
  if (!db) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/morepankh_6th_may';
    const client = await getMongoClient(uri);
    db = client.db(getDatabaseName());
  }
  return db;
}

export async function GET(request: NextRequest) {
  try {
    const database = await getDatabase();
    const categories = await database.collection('categories').find({}).toArray();
    
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const description = formData.get('description') as string;
    const statusStr = formData.get('status') as string;
    const status = statusStr === 'false' ? false : true;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    let imageUrlToUse = imageUrl;
    if (imageUrlToUse && imageUrlToUse.startsWith('data:image/')) {
      const base64Data = imageUrlToUse.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      imageUrlToUse = await uploadImage(buffer, 'categories');
    }

    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

    const database = await getDatabase();
    const category = {
      name,
      slug: finalSlug,
      image: imageUrlToUse || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop',
      description: description || '',
      status: status,
      productCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await database.collection('categories').insertOne(category);
    
    // Invalidate category cache after creation
    await invalidateCategoryCache();
    
    return NextResponse.json({
      success: true,
      data: { ...category, _id: result.insertedId.toString() }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
