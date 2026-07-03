import { NextResponse } from 'next/server';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import { withPublicCache } from '@/lib/httpCache';
import { hasAvailableStock, mapProductFromDoc } from '@/lib/mapProduct';
import { cacheOrFetch } from '@/lib/redis';

export const runtime = 'nodejs';

const SECTION_LIMIT = 4;

async function fetchSection(
  filter: Record<string, unknown>,
  limit = SECTION_LIMIT
) {
  const uri = process.env.MONGODB_URI!;
  const client = await getMongoClient(uri);
  const database = client.db(getDatabaseName());
  const raw = await database
    .collection('products')
    .find({ hidden: { $ne: true }, ...filter })
    .sort({ createdAt: -1 })
    .limit(limit * 2)
    .toArray();

  return raw
    .map((doc) => mapProductFromDoc(doc))
    .filter(hasAvailableStock)
    .slice(0, limit);
}

export async function GET() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json(
      { success: false, error: 'MONGODB_URI is not configured on the server' },
      { status: 500 }
    );
  }

  const cacheKey = 'products:v2:home';
  const cacheTTL = 300;

  try {
    const payload = await cacheOrFetch(cacheKey, cacheTTL, async () => {
      const [
        featured,
        newArrivals,
        sale,
        premium,
        trending,
        limitedOffer,
        liveSpecial,
        spotlight,
      ] = await Promise.all([
        fetchSection({ $or: [{ featured: true }, { isFeatured: true }, { bestSeller: true }] }),
        fetchSection({ isNew: true }),
        fetchSection({ isSale: true }),
        fetchSection({ isPremium: true }),
        fetchSection({ isTrending: true }),
        fetchSection({ isLimitedOffer: true }),
        fetchSection({ isLiveSpecial: true }),
        fetchSection({}, 10),
      ]);

      return {
        success: true,
        data: {
          featured,
          newArrivals,
          sale,
          premium,
          trending,
          limitedOffer,
          liveSpecial,
          spotlight,
        },
      };
    });

    return withPublicCache(NextResponse.json(payload), 120);
  } catch (error) {
    console.error('Error fetching home products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch home products' },
      { status: 500 }
    );
  }
}
