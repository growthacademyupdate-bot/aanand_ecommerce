import { NextRequest, NextResponse } from 'next/server';
import { Db, WithId, Document } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import { invalidateProductCache } from '@/lib/redis';

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

type IncomingColorVariant = {
  colorName: string;
  stock: number;
  images: string[];
  sizes?: { [key: string]: number };
};

function normalizeColors(value: unknown): IncomingColorVariant[] {
  if (!Array.isArray(value)) return [];

  console.log('🔍 NORMALIZE COLORS DEBUG:', {
    value,
    valueType: typeof value,
    isArray: Array.isArray(value),
    firstItem: value[0],
    firstItemType: typeof value[0],
    allStrings: value.every((v) => typeof v === 'string')
  });

  // allow both old schema colors: string[] and new schema colors: {colorName, stock, images}[]
  if (value.every((v) => typeof v === 'string')) {
    console.log('📝 Processing legacy string colors');
    return (value as string[]).map((c) => ({
      colorName: c,
      stock: 0, // Default for legacy format - main stock will be used
      images: [],
    }));
  }

  console.log('🎨 Processing object colors');
  const result = (value as Array<Partial<IncomingColorVariant>>)
    .filter((c) => typeof c?.colorName === 'string')
    .map((c) => {
      const normalized = {
        colorName: String(c.colorName),
        stock: Number(c.stock) || 0,
        images: Array.isArray(c.images) ? (c.images as string[]) : [],
        sizes: c.sizes && typeof c.sizes === 'object' ? c.sizes : undefined,
      };
      console.log('✨ Normalized color:', { original: c, normalized });
      return normalized;
    });
  
  console.log('🎯 Final normalized colors:', result);
  return result;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get('pageSize')) || 10));
    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const subcategory = searchParams.get('subcategory')?.trim() || '';

    const database = await getDatabase();

    const matchStage: any = {};
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      matchStage.$or = [
        ...(matchStage.$or || []),
        { categoryId: category },
        { category: category }
      ];
    }
    
    if (subcategory) {
      matchStage.subcategoryId = subcategory;
    }

    const pipeline = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      {
        $addFields: {
          catObjectId: { $convert: { input: "$categoryId", to: "objectId", onError: null, onNull: null } },
          subObjectId: { $convert: { input: "$subcategoryId", to: "objectId", onError: null, onNull: null } }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'catObjectId',
          foreignField: '_id',
          as: 'categoryDoc'
        }
      },
      {
        $lookup: {
          from: 'subcategories',
          localField: 'subObjectId',
          foreignField: '_id',
          as: 'subcategoryDoc'
        }
      },
      {
        $addFields: {
          categoryName: { $arrayElemAt: ["$categoryDoc.name", 0] },
          subcategoryName: { $arrayElemAt: ["$subcategoryDoc.name", 0] }
        }
      },
      {
        $project: {
          categoryDoc: 0,
          subcategoryDoc: 0,
          catObjectId: 0,
          subObjectId: 0
        }
      }
    ];

    const [products, total] = await Promise.all([
      database.collection('products').aggregate(pipeline).toArray(),
      database.collection('products').countDocuments(matchStage)
    ]);

    // Additional step to search by category/subcategory name if a search string is provided.
    // MongoDB text indexes or regex across lookup is complex, so we could just do an application level filter for this edge case or build it into the match if we lookup first.
    // Since we need to paginate accurately, lookup first then match is slow but necessary for searching by category name.
    // We will stick to name/sku/barcode search in the initial match for performance, as requested "search should work on...". 
    // To properly support search by category/subcategory name, let's adjust the pipeline to look up first if there's a search.

    let finalPipeline = pipeline;
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const lookupFirstPipeline = [
        // No match stage initially except category/subcategory filters
        { $match: { 
          ...(category ? { $or: [{ categoryId: category }, { category: category }] } : {}),
          ...(subcategory ? { subcategoryId: subcategory } : {})
        }},
        {
          $addFields: {
            catObjectId: { $convert: { input: "$categoryId", to: "objectId", onError: null, onNull: null } },
            subObjectId: { $convert: { input: "$subcategoryId", to: "objectId", onError: null, onNull: null } }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'catObjectId',
            foreignField: '_id',
            as: 'categoryDoc'
          }
        },
        {
          $lookup: {
            from: 'subcategories',
            localField: 'subObjectId',
            foreignField: '_id',
            as: 'subcategoryDoc'
          }
        },
        {
          $addFields: {
            categoryName: { $arrayElemAt: ["$categoryDoc.name", 0] },
            subcategoryName: { $arrayElemAt: ["$subcategoryDoc.name", 0] }
          }
        },
        {
          $match: {
            $or: [
              { name: searchRegex },
              { sku: searchRegex },
              { barcode: searchRegex },
              { categoryName: searchRegex },
              { subcategoryName: searchRegex }
            ]
          }
        },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            paginatedResults: [
              { $skip: (page - 1) * pageSize },
              { $limit: pageSize },
              {
                $project: {
                  categoryDoc: 0,
                  subcategoryDoc: 0,
                  catObjectId: 0,
                  subObjectId: 0
                }
              }
            ],
            totalCount: [
              { $count: "count" }
            ]
          }
        }
      ];

      const result = await database.collection('products').aggregate(lookupFirstPipeline).toArray();
      const docs = result[0]?.paginatedResults || [];
      const count = result[0]?.totalCount[0]?.count || 0;

      const transformed = docs.map((p: any) => ({
        ...p,
        _id: p._id.toString(),
        categoryName: p.categoryName || p.category || 'Uncategorized',
      }));

      return NextResponse.json({
        success: true,
        data: transformed,
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize),
        },
      });
    }

    // Default fast path (no search term, or just filter)
    const transformed = products.map(p => ({
      ...p,
      _id: p._id.toString(),
      categoryName: p.categoryName || p.category || 'Uncategorized',
    }));

    return NextResponse.json({
      success: true,
      data: transformed,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const name = String(body?.name || '').trim();
    const category = String(body?.category || '').trim();
    const productType = String(body?.productType || 'legacy').trim();
    
    // For legacy products, they come from the root level. 
    // For simple products, SKU comes from the root. 
    // For variant products, we might not have a root SKU, or we take the first variant's SKU.
    const sku = String(body?.sku || (body?.variants?.[0]?.sku) || '').trim();
    const barcode = String(body?.barcode || '').trim();
    const subcategoryId = String(body?.subcategoryId || '').trim();

    const price = Number(body?.price ?? body?.salePrice ?? body?.basePrice);
    const comparePrice = Number(body?.comparePrice ?? body?.compareAtPrice ?? body?.originalPrice);

    if (!name) {
      return NextResponse.json({ success: false, error: 'Product name is required' }, { status: 400 });
    }
    if (!sku && productType !== 'variant') {
      return NextResponse.json({ success: false, error: 'SKU is required' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 });
    }
    if (!Number.isFinite(price)) {
      return NextResponse.json({ success: false, error: 'Valid price is required' }, { status: 400 });
    }

    const colors = normalizeColors(body?.colors);
    if (colors.length === 0 && productType === 'legacy') {
      return NextResponse.json({ success: false, error: 'At least one color variant is required' }, { status: 400 });
    }

    const slug = String(body?.slug || getSlug(name));

    const database = await getDatabase();

    // Only check SKU if we have a valid root SKU to check
    if (sku) {
      const existingSku = await database.collection('products').findOne({ sku });
      if (existingSku) {
        return NextResponse.json({ success: false, error: 'A product with this SKU already exists' }, { status: 400 });
      }
    }

    const doc = {
      name,
      slug,
      productType,
      sku: sku || '',
      barcode: barcode || '',
      category,
      categoryId: body?.categoryId || category,
      subcategoryId: subcategoryId,

      // store both for compatibility
      price,
      comparePrice,
      basePrice: price,
      compareAtPrice: comparePrice,
      wholesalePrice: Number(body?.wholesalePrice) || undefined,
      moq: Number(body?.moq) || undefined,

      stock: Number(body?.stock) || 0,
      colors,
      variants: Array.isArray(body?.variants) ? body.variants : [],
      images: Array.isArray(body?.images) ? body.images : colors.flatMap((c) => c.images || []).filter(Boolean),

      description: body?.description || '',
      fabric: body?.fabric || '',
      fabricType: body?.fabricType ?? body?.fabric ?? '',
      shortDescription: body?.shortDescription,
      size: body?.size || '',
      hasSizes: Boolean(body?.hasSizes || false),
      sizes: body?.hasSizes ? (Array.isArray(body?.sizes) ? body.sizes : []) : [],

      hidden: Boolean(body?.hidden),
      featured: Boolean(body?.featured),
      isNew: Boolean(body?.isNew),
      isPremium: Boolean(body?.isPremium),
      isTrending: Boolean(body?.isTrending),
      isLiveSpecial: Boolean(body?.isLiveSpecial),
      
      bestSeller: Boolean(body?.bestSeller),
      
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await database.collection('products').insertOne(doc);

    // Invalidate product cache after creation
    await invalidateProductCache(doc.slug);

    return NextResponse.json({
      success: true,
      data: { ...doc, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
