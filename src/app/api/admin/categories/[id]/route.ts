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

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const description = formData.get('description') as string;
    const statusStr = formData.get('status') as string;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const database = await getDatabase();
    
    // Get existing category to check for image changes
    const existingCategory = await database.collection('categories').findOne({ _id: new ObjectId(id) });
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    let imageUrlToUse = existingCategory.image;

    if (imageUrl && imageUrl !== existingCategory.image) {
      if (imageUrl.startsWith('data:image/')) {
        const base64Data = imageUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        imageUrlToUse = await uploadImage(buffer, 'categories');
      } else {
        imageUrlToUse = imageUrl;
      }
    }

    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

    const updateData: any = {
      name,
      slug: finalSlug,
      image: imageUrlToUse,
      updatedAt: new Date(),
    };

    if (description !== undefined && description !== null) {
      updateData.description = description;
    }
    
    if (statusStr !== null && statusStr !== undefined) {
      updateData.status = statusStr === 'false' ? false : true;
    }

    const result = await database.collection('categories').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get updated category
    const updatedCategory = await database.collection('categories').findOne({ _id: new ObjectId(id) });
    
    // Invalidate category cache after update
    await invalidateCategoryCache();
    
    return NextResponse.json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const database = await getDatabase();
    
    // Get category before deletion to remove image from Cloudinary
    const category = await database.collection('categories').findOne({ _id: new ObjectId(id) });
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Delete category from database
    const result = await database.collection('categories').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Invalidate category cache after deletion
    await invalidateCategoryCache();
    
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
