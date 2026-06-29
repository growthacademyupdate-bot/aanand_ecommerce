import { NextRequest, NextResponse } from 'next/server';
import { Db, ObjectId } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';
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
    
    // Use aggregation to fetch subcategories with their parent category name
    const subcategories = await database.collection('subcategories').aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'parentCategory'
        }
      },
      {
        $unwind: {
          path: '$parentCategory',
          preserveNullAndEmptyArrays: true
        }
      }
    ]).toArray();
    
    // Map data to include category name at the top level
    const mappedSubcategories = subcategories.map(sub => ({
      ...sub,
      categoryName: sub.parentCategory?.name || 'Unknown Category'
    }));

    return NextResponse.json({ success: true, data: mappedSubcategories });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subcategories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let name, slug, imageUrl, description, categoryId, statusStr;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      name = body.name;
      slug = body.slug;
      imageUrl = body.imageUrl;
      description = body.description;
      categoryId = body.categoryId;
      statusStr = String(body.status);
    } else {
      const formData = await request.formData();
      name = formData.get('name') as string;
      slug = formData.get('slug') as string;
      imageUrl = formData.get('imageUrl') as string;
      description = formData.get('description') as string;
      categoryId = formData.get('categoryId') as string;
      statusStr = formData.get('status') as string;
    }

    const status = statusStr === 'false' ? false : true;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Subcategory name is required' }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'Parent Category is required' }, { status: 400 });
    }

    const database = await getDatabase();
    
    // Check if parent category exists
    const parentCategory = await database.collection('categories').findOne({ _id: new ObjectId(categoryId) });
    if (!parentCategory) {
      return NextResponse.json({ success: false, error: 'Parent Category not found' }, { status: 404 });
    }

    // Check for duplicate name in the same category
    const existing = await database.collection('subcategories').findOne({ 
      categoryId: new ObjectId(categoryId),
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existing) {
      return NextResponse.json({ success: false, error: 'A subcategory with this name already exists in the selected category' }, { status: 400 });
    }

    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

    let imageUrlToUse = imageUrl || '';
    if (imageUrlToUse.startsWith('data:image/')) {
      const base64Data = imageUrlToUse.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      imageUrlToUse = await uploadImage(buffer, 'subcategories');
    }

    const subcategory = {
      name,
      slug: finalSlug,
      image: imageUrlToUse,
      description: description || '',
      categoryId: new ObjectId(categoryId),
      status: status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await database.collection('subcategories').insertOne(subcategory);
    
    return NextResponse.json({
      success: true,
      data: { ...subcategory, _id: result.insertedId.toString(), categoryName: parentCategory.name }
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subcategory' },
      { status: 500 }
    );
  }
}
