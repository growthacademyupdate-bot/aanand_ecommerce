import { NextRequest, NextResponse } from 'next/server';
import { Db, ObjectId } from 'mongodb';
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
      const hasSizes = Boolean(c?.hasSizes || false);
      const sizes = c?.sizes && typeof c.sizes === 'object' ? c.sizes : { s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0, free: 0 };
      
      // Calculate stock from sizes if hasSizes is true
      let stock = Number(c?.stock) || 0;
      if (hasSizes && sizes) {
        stock = (sizes.s || 0) + (sizes.m || 0) + (sizes.l || 0) + (sizes.xl || 0) + (sizes.xxl || 0) + (sizes.xxxl || 0) + (sizes.free || 0);
      }

      return {
        colorName: String(c.colorName),
        colorImage: String(c.colorImage || ''),
        stock,
        hasSizes,
        sizes: hasSizes ? sizes : undefined,
      };
    });

  return result;
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
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

    console.log('[SIZE-PRODUCTS-PUT] Category lookup:', {
      requested: categoryParam,
      found: !!category,
      category: category ? { _id: category._id?.toString(), name: category.name, slug: category.slug } : null
    });

    if (!category) {
      return NextResponse.json({ success: false, error: `${categoryParam} category not found in database. Please create a ${categoryParam} category first.` }, { status: 400 });
    }

    // Use the actual category slug from the database
    const categorySlug = category.slug as string;

    console.log('[SIZE-PRODUCTS-PUT] Using category slug:', categorySlug);

    // Check if SKU already exists (excluding current product)
    const existingSku = await database.collection('products').findOne({
      sku,
      _id: { $ne: new ObjectId(id) }
    });
    if (existingSku) {
      return NextResponse.json({ success: false, error: 'A size product with this SKU already exists' }, { status: 400 });
    }

    // Check if barcode already exists (excluding current product)
    const existingBarcode = await database.collection('products').findOne({
      barcode,
      _id: { $ne: new ObjectId(id) }
    });
    if (existingBarcode) {
      return NextResponse.json({ success: false, error: 'A size product with this barcode already exists' }, { status: 400 });
    }

    // Calculate total stock from all colors
    const totalStock = colors.reduce((sum, color) => sum + color.stock, 0);

    const updateDoc = {
      ...(body?.name && { name }),
      ...(body?.slug && { slug: body.slug }),
      ...(body?.sku !== undefined && { sku: body.sku }),
      ...(body?.barcode !== undefined && { barcode: body.barcode }),
      category: categorySlug,

      // store both for compatibility
      ...(body?.price !== undefined && { price }),
      ...(body?.comparePrice !== undefined && { comparePrice }),
      ...(body?.price !== undefined && { basePrice: price }),
      ...(body?.comparePrice !== undefined && { compareAtPrice: comparePrice }),

      stock: totalStock,
      colors,

      ...(body?.description !== undefined && { description: body.description }),
      ...(body?.fabric !== undefined && { fabric: body.fabric }),
      ...(body?.fabricType !== undefined && { fabricType: body.fabricType }),
      ...(body?.shortDescription !== undefined && { shortDescription: body.shortDescription }),

      ...(body?.hidden !== undefined && { hidden: Boolean(body.hidden) }),
      ...(body?.featured !== undefined && { featured: Boolean(body.featured) }),
      ...(body?.isNew !== undefined && { isNew: Boolean(body.isNew) }),
      ...(body?.isPremium !== undefined && { isPremium: Boolean(body.isPremium) }),
      ...(body?.isTrending !== undefined && { isTrending: Boolean(body.isTrending) }),
      ...(body?.isLiveSpecial !== undefined && { isLiveSpecial: Boolean(body.isLiveSpecial) }),
      ...(body?.isLimitedOffer !== undefined && { isLimitedOffer: Boolean(body.isLimitedOffer) }),
      ...(body?.limitedStock !== undefined && { limitedStock: body.isLimitedOffer ? Number(body.limitedStock) || undefined : undefined }),
      ...(body?.limitedOfferMessage !== undefined && { limitedOfferMessage: body.isLimitedOffer ? String(body.limitedOfferMessage || '') : undefined }),
      ...(body?.cardOfferText !== undefined && { cardOfferText: typeof body.cardOfferText === 'string' ? body.cardOfferText.trim() : '' }),

      // Prebooking fields
      ...(body?.isPrebooking !== undefined && { isPrebooking: Boolean(body.isPrebooking) }),
      ...(body?.prebookingPrice !== undefined && { prebookingPrice: body.isPrebooking ? Number(body.prebookingPrice) || undefined : undefined }),
      ...(body?.prebookingDeliveryDays !== undefined && { prebookingDeliveryDays: body.isPrebooking ? Number(body.prebookingDeliveryDays) || undefined : undefined }),
      ...(body?.prebookingMessage !== undefined && { prebookingMessage: body.isPrebooking ? String(body.prebookingMessage || '') : undefined }),

      ...(body?.rating !== undefined && { rating: Number(body.rating) }),
      ...(body?.reviews !== undefined && { reviews: Number(body.reviews) }),
      ...(body?.tags !== undefined && { tags: Array.isArray(body.tags) ? body.tags : [] }),

      // Preserve formType - size-based products must remain size-based products
      formType: 'dress',

      // fallbacks for legacy UI usage
      images: colors.flatMap((c) => [c.colorImage]).filter(Boolean),

      updatedAt: new Date(),
    };

    const result = await database.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );

    console.log('[SIZE-PRODUCTS-PUT] Product updated:', {
      productId: id,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      category: updateDoc.category
    });

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Size product not found' }, { status: 404 });
    }

    const updatedProduct = await database.collection('products').findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      data: { ...updatedProduct, _id: updatedProduct?._id.toString() },
    });
  } catch (error) {
    console.error('Error updating size product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update size product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const database = await getDatabase();

    const result = await database.collection('products').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Size product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Size product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting size product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete size product' },
      { status: 500 }
    );
  }
}
