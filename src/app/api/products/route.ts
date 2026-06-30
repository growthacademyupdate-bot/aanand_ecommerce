import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import { withPublicCache } from '@/lib/httpCache';
import {
  buildProductQuery,
  hasAvailableStock,
  mapProductFromDoc,
  sortProducts,
} from '@/lib/mapProduct';
import { cacheOrFetch } from '@/lib/redis';

export const runtime = 'nodejs';

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
}

export async function GET(request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json(
      { success: false, error: 'MONGODB_URI is not configured on the server' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get('page'), 1, 500);
  const limit = parsePositiveInt(searchParams.get('limit'), 12, 48);
  const category = searchParams.get('category')?.trim() || '';
  const highlight = searchParams.get('highlight')?.trim() || '';
  const search = searchParams.get('search')?.trim() || '';
  const sortBy = searchParams.get('sort')?.trim() || '';
  const size = searchParams.get('size')?.trim() || '';
  const subcategoryId = searchParams.get('subcategoryId')?.trim() || '';
  const inStock = searchParams.get('inStock') !== 'false';
  const minPrice = searchParams.has('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.has('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

  const cacheKey = `products:v2:list:${page}:${limit}:${category}:${subcategoryId}:${highlight}:${search}:${sortBy}:${size}:${inStock}:${minPrice ?? ''}:${maxPrice ?? ''}`;
  const cacheTTL = 300;

  try {
    const payload = await cacheOrFetch(cacheKey, cacheTTL, async () => {
      const client = await getMongoClient(uri);
      const database = client.db(getDatabaseName());
      const collection = database.collection('products');
      const filter = buildProductQuery({
        category: category || undefined,
        subcategoryId: subcategoryId || undefined,
        highlight: highlight || undefined,
        search: search || undefined,
        size: size || undefined,
        minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
        maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      });

      const raw = await collection.find(filter).sort({ createdAt: -1 }).toArray();
      let products = raw.map((doc) => mapProductFromDoc(doc));

      if (inStock) {
        products = products.filter(hasAvailableStock);
      }

      products = sortProducts(products, sortBy);

      const total = products.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * limit;
      const data = products.slice(start, start + limit);

      return {
        success: true,
        data,
        pagination: {
          page: safePage,
          limit,
          total,
          totalPages,
        },
      };
    });

    return withPublicCache(NextResponse.json(payload), 60);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
