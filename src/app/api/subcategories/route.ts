import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import { withPublicCache } from '@/lib/httpCache';
import { cacheOrFetch } from '@/lib/redis';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  void request;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return NextResponse.json(
      { success: false, error: 'MONGODB_URI is not configured on the server' },
      { status: 500 }
    );
  }

  // Use Redis cache with 30-minute TTL (1800 seconds)
  const cacheKey = 'subcategories:v2:list';
  const cacheTTL = 1800; // 30 minutes

  const isValidPayload = (
    data: unknown
  ): data is { success: true; data: unknown[] } => {
    if (typeof data !== 'object' || data === null) return false;
    const record = data as Record<string, unknown>;
    return record.success === true && Array.isArray(record.data);
  };

  try {
    const payload = await cacheOrFetch(cacheKey, cacheTTL, async () => {
      const client = await getMongoClient(uri);
      const database = client.db(getDatabaseName());
      
      const subcategories = await database.collection('subcategories').aggregate([
        { $match: { status: { $ne: false } } }, // Only active subcategories
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

      const transformedSubcategories = subcategories.map(sub => ({
        id: sub._id.toString(),
        categoryId: sub.categoryId?.toString() || '',
        categorySlug: sub.parentCategory?.slug || '',
        name: sub.name as string,
        slug: sub.slug as string,
        image: (sub.imageUrl || sub.image || '') as string,
      }));

      return {
        success: true,
        data: transformedSubcategories,
      };
    }, isValidPayload);

    return withPublicCache(NextResponse.json(payload), 300);
  } catch (error) {
    console.error('[SUBCATEGORIES-API] Error fetching subcategories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subcategories' },
      { status: 500 }
    );
  }
}
