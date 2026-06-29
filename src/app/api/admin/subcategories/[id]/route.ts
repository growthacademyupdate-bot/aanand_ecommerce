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

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;
    const statusStr = formData.get('status') as string;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Subcategory name is required' }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'Parent Category is required' }, { status: 400 });
    }

    const database = await getDatabase();
    
    // Get existing to verify
    const existingSubcategory = await database.collection('subcategories').findOne({ _id: new ObjectId(id) });
    if (!existingSubcategory) {
      return NextResponse.json({ success: false, error: 'Subcategory not found' }, { status: 404 });
    }
    
    // Check if parent category exists
    const parentCategory = await database.collection('categories').findOne({ _id: new ObjectId(categoryId) });
    if (!parentCategory) {
      return NextResponse.json({ success: false, error: 'Parent Category not found' }, { status: 404 });
    }

    // Check for duplicate name in the same category (excluding self)
    const duplicate = await database.collection('subcategories').findOne({ 
      _id: { $ne: new ObjectId(id) },
      categoryId: new ObjectId(categoryId),
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (duplicate) {
      return NextResponse.json({ success: false, error: 'A subcategory with this name already exists in the selected category' }, { status: 400 });
    }

    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');
    let imageUrlToUse = existingSubcategory.image;
    if (imageUrl && imageUrl !== existingSubcategory.image) {
      if (imageUrl.startsWith('data:image/')) {
        const base64Data = imageUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        imageUrlToUse = await uploadImage(buffer, 'subcategories');
      } else {
        imageUrlToUse = imageUrl;
      }
    }

    const updateData: any = {
      name,
      slug: finalSlug,
      image: imageUrlToUse,
      categoryId: new ObjectId(categoryId),
      updatedAt: new Date(),
    };

    if (description !== undefined && description !== null) {
      updateData.description = description;
    }
    
    if (statusStr !== null && statusStr !== undefined) {
      updateData.status = statusStr === 'false' ? false : true;
    }

    const result = await database.collection('subcategories').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Subcategory not found' }, { status: 404 });
    }

    const updatedSubcategory = await database.collection('subcategories').findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({
      success: true,
      data: { ...updatedSubcategory, categoryName: parentCategory.name }
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update subcategory' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const database = await getDatabase();
    
    const result = await database.collection('subcategories').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Subcategory not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete subcategory' },
      { status: 500 }
    );
  }
}
