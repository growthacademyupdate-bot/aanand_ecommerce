import { NextRequest, NextResponse } from 'next/server';
import { Db, WithId, Document } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

let db: Db;

function isAdminRequest(request: NextRequest) {
  const auth = (request.headers.get('authorization') || '').trim();
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token === 'admin-token';
}

async function getDatabase() {
  if (!db) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/morepankh_6th_may';
    const client = await getMongoClient(uri);
    db = client.db(getDatabaseName());
  }
  return db;
}

function getSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

type DressColorVariant = {
  colorName: string;
  colorImage: string;
  stock: number;
  hasSizes: boolean;
  sizes?: {
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
    xxxl: number;
    free: number;
  };
};

function normalizeDressColors(value: unknown): DressColorVariant[] {
  if (!Array.isArray(value)) return [];

  const result = (value as Array<Partial<DressColorVariant>>)
    .filter((c) => typeof c?.colorName === 'string')
    .map((c) => {
      // Always set hasSizes to true for dress products since they have size variants
      const hasSizes = true;
      const sizes = c?.sizes && typeof c.sizes === 'object' ? c.sizes : { s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0, free: 0 };
      
      // Calculate stock from sizes
      let stock = Number(c?.stock) || 0;
      if (sizes) {
        stock = (sizes.s || 0) + (sizes.m || 0) + (sizes.l || 0) + (sizes.xl || 0) + (sizes.xxl || 0) + (sizes.xxxl || 0) + (sizes.free || 0);
      }

      return {
        colorName: String(c.colorName),
        colorImage: String(c.colorImage || ''),
        stock,
        hasSizes,
        sizes,
      };
    });

  return result;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get('pageSize')) || 6));
    const search = searchParams.get('search')?.trim() || '';
    const categoryParam = searchParams.get('category')?.trim() || 'Dress';

    const database = await getDatabase();

    // Find the specified category in the database to get its actual slug
    const category = await database.collection('categories').findOne({ 
      $or: [
        { name: categoryParam },
        { name: { $regex: new RegExp(`^${categoryParam}$`, 'i') } },
        { slug: categoryParam.toLowerCase() }
      ]
    });

    console.log('[SIZE-PRODUCTS-GET] Category lookup:', {
      requested: categoryParam,
      found: !!category,
      category: category ? { _id: category._id?.toString(), name: category.name, slug: category.slug } : null
    });

    if (!category) {
      return NextResponse.json({ success: false, error: `${categoryParam} category not found in database. Please create a ${categoryParam} category first.` }, { status: 400 });
    }

    const categorySlug = category.slug as string;

    console.log('[SIZE-PRODUCTS-GET] Using category slug for filtering:', categorySlug);

    // Build query with category filter and search
    const query: Record<string, unknown> = { category: categorySlug };
    if (search) {
      Object.assign(query, {
        category: categorySlug,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } }
        ]
      });
      console.log(`🔍 Size products search query:`, JSON.stringify(query));
    }

    const total = await database.collection('products').countDocuments(query);

    console.log('[SIZE-PRODUCTS-GET] Product count:', {
      categorySlug,
      search,
      total
    });

    const skip = (page - 1) * pageSize;
    const products = await database
      .collection('products')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    console.log('[SIZE-PRODUCTS-GET] Products fetched:', {
      count: products.length,
      products: products.map(p => ({ _id: p._id?.toString(), name: p.name, category: p.category }))
    });

    const transformed = (products as WithId<Document>[]).map((p) => {
      console.log('[SIZE-PRODUCTS-GET] Processing product:', {
        _id: p._id?.toString(),
        name: p.name,
        category: p.category,
        formType: p.formType,
        colorsCount: Array.isArray(p.colors) ? p.colors.length : 0,
        firstColor: Array.isArray(p.colors) && p.colors[0] ? {
          colorName: p.colors[0].colorName,
          hasSizes: p.colors[0].hasSizes,
          sizes: p.colors[0].sizes
        } : null
      });

      // Lazy migration: if formType is missing, detect and set it
      if (!p.formType) {
        const hasDressStructure = Array.isArray(p.colors) && p.colors.some((c: { hasSizes?: boolean; sizes?: { xxxl?: number; free?: number } }) =>
          c.hasSizes && c.sizes && (c.sizes.xxxl !== undefined || c.sizes.free !== undefined)
        );

        if (hasDressStructure) {
          // Update the product with formType = 'dress'
          database.collection('products').updateOne(
            { _id: p._id },
            { $set: { formType: 'dress', updatedAt: new Date() } }
          ).catch(err => console.error('[SIZE-PRODUCTS-GET] Migration error:', err));

          console.log('[SIZE-PRODUCTS-GET] Migrated product to dress formType:', p._id?.toString());
        } else {
          // Update the product with formType = 'regular'
          database.collection('products').updateOne(
            { _id: p._id },
            { $set: { formType: 'regular', updatedAt: new Date() } }
          ).catch(err => console.error('[SIZE-PRODUCTS-GET] Migration error:', err));

          console.log('[SIZE-PRODUCTS-GET] Migrated product to regular formType:', p._id?.toString());
        }
      }

      return {
        ...p,
        _id: p._id.toString(),
      };
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: transformed,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching dress products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dress products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const name = String(body?.name || '').trim();
    const sku = String(body?.sku || '').trim();
    const barcode = String(body?.barcode || '').trim();
    const categoryParam = String(body?.category || 'Dress').trim();

    const price = Number(body?.price ?? body?.salePrice ?? body?.basePrice);
    const comparePrice = Number(body?.comparePrice ?? body?.compareAtPrice ?? body?.originalPrice);

    if (!name) {
      return NextResponse.json({ success: false, error: 'Product name is required' }, { status: 400 });
    }
    if (!sku) {
      return NextResponse.json({ success: false, error: 'SKU is required' }, { status: 400 });
    }
    if (!barcode) {
      return NextResponse.json({ success: false, error: 'Barcode is required' }, { status: 400 });
    }
    if (!Number.isFinite(price)) {
      return NextResponse.json({ success: false, error: 'Valid price is required' }, { status: 400 });
    }
    if (!Number.isFinite(comparePrice)) {
      return NextResponse.json({ success: false, error: 'Valid compare price is required' }, { status: 400 });
    }

    const colors = normalizeDressColors(body?.colors);
    if (colors.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one color variant is required' }, { status: 400 });
    }

    const database = await getDatabase();

    // Find the specified category in the database to get its actual slug
    const category = await database.collection('categories').findOne({
      $or: [
        { name: categoryParam },
        { name: { $regex: new RegExp(`^${categoryParam}$`, 'i') } },
        { slug: categoryParam.toLowerCase() }
      ]
    });

    console.log('[SIZE-PRODUCTS-POST] Category lookup:', {
      requested: categoryParam,
      found: !!category,
      category: category ? { _id: category._id?.toString(), name: category.name, slug: category.slug } : null
    });

    if (!category) {
      return NextResponse.json({ success: false, error: `${categoryParam} category not found in database. Please create a ${categoryParam} category first.` }, { status: 400 });
    }

    // Use the actual category slug from the database
    const categorySlug = category.slug as string;

    console.log('[SIZE-PRODUCTS-POST] Using category slug:', categorySlug);

    const slug = String(body?.slug || getSlug(name));

    // Check if SKU already exists in products
    const existingSku = await database.collection('products').findOne({ sku });
    if (existingSku) {
      return NextResponse.json({ success: false, error: 'A product with this SKU already exists' }, { status: 400 });
    }

    // Check if barcode already exists in products
    const existingBarcode = await database.collection('products').findOne({ barcode });
    if (existingBarcode) {
      return NextResponse.json({ success: false, error: 'A product with this barcode already exists' }, { status: 400 });
    }

    // Calculate total stock from all colors
    const totalStock = colors.reduce((sum, color) => sum + color.stock, 0);

    const doc = {
      name,
      slug,
      sku: body?.sku || '',
      barcode: body?.barcode || '',
      category: categorySlug,

      // store both for compatibility
      price,
      comparePrice,
      basePrice: price,
      compareAtPrice: comparePrice,

      stock: totalStock,
      colors,

      description: body?.description || '',
      fabric: body?.fabric || '',
      fabricType: body?.fabricType ?? body?.fabric ?? '',
      shortDescription: body?.shortDescription,

      hidden: Boolean(body?.hidden),
      featured: Boolean(body?.featured),
      isNew: Boolean(body?.isNew),
      isPremium: Boolean(body?.isPremium),
      isTrending: Boolean(body?.isTrending),
      isLiveSpecial: Boolean(body?.isLiveSpecial),
      isLimitedOffer: Boolean(body?.isLimitedOffer),
      limitedStock: body?.isLimitedOffer ? Number(body?.limitedStock) || undefined : undefined,
      limitedOfferMessage: body?.isLimitedOffer ? String(body?.limitedOfferMessage || '') : undefined,
      cardOfferText: typeof body?.cardOfferText === 'string' ? body.cardOfferText.trim() : '',

      // Prebooking fields
      isPrebooking: Boolean(body?.isPrebooking),
      prebookingPrice: body?.isPrebooking ? Number(body?.prebookingPrice) || undefined : undefined,
      prebookingDeliveryDays: body?.isPrebooking ? Number(body?.prebookingDeliveryDays) || undefined : undefined,
      prebookingMessage: body?.isPrebooking ? String(body?.prebookingMessage || '') : undefined,

      rating: Number(body?.rating) || 0,
      reviews: Number(body?.reviews) || 0,
      tags: Array.isArray(body?.tags) ? body.tags : [],

      // Form type tracking - size-based products created via "Size Product"
      formType: 'dress',

      // fallbacks for legacy UI usage
      images: colors.flatMap((c) => [c.colorImage]).filter(Boolean),

      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await database.collection('products').insertOne(doc);

    console.log('[SIZE-PRODUCTS-POST] Product saved:', {
      productId: result.insertedId.toString(),
      name: doc.name,
      category: doc.category,
      categorySlug: categorySlug
    });

    return NextResponse.json({
      success: true,
      data: { ...doc, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error('Error creating size product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create size product' },
      { status: 500 }
    );
  }
}
