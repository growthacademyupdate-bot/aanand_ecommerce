import { NextRequest, NextResponse } from 'next/server';
import { WithId, Document } from 'mongodb';
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
  // Cache key: categories:list
  const cacheKey = 'categories:v2:list';
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
      const categories = await database.collection('categories')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      const productCounts = await database
        .collection('products')
        .aggregate([
          { $match: { hidden: { $ne: true } } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ])
        .toArray();

      const countBySlug = new Map<string, number>();
      for (const row of productCounts as Array<{ _id?: unknown; count?: unknown }>) {
        const slug = typeof row?._id === 'string' ? row._id : '';
        const count = typeof row?.count === 'number' ? row.count : 0;
        if (slug) countBySlug.set(slug, count);
      }

      const transformedCategories = categories.map((cat: WithId<Document>) => ({
        id: cat._id.toString(),
        name: cat.name as string,
        slug: cat.slug as string,
        image: cat.image as string,
        productCount: countBySlug.get((cat.slug as string) || '') || 0,
      }));

      return {
        success: true,
        data: transformedCategories,
      };
    }, isValidPayload);

    return withPublicCache(NextResponse.json(payload), 300);
  } catch (error) {
    console.error('[CATEGORIES-API] Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
