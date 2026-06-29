import { NextRequest, NextResponse } from 'next/server';
import { Db, ObjectId, WithId, Document } from 'mongodb';
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

type IncomingColorVariant = {
  colorName: string;
  stock: number;
  images: string[];
  sizes?: { [key: string]: number };
};

function normalizeColors(value: unknown): IncomingColorVariant[] {
  if (!Array.isArray(value)) return [];

  if (value.every((v) => typeof v === 'string')) {
    return (value as string[]).map((c) => ({
      colorName: c,
      stock: 0,
      images: [],
    }));
  }

  return (value as Array<Partial<IncomingColorVariant>>)
    .filter((c) => typeof c?.colorName === 'string')
    .map((c) => ({
      colorName: String(c.colorName),
      stock: Number(c.stock) || 0,
      images: Array.isArray(c.images) ? (c.images as string[]) : [],
      sizes: c.sizes && typeof c.sizes === 'object' ? c.sizes : undefined,
    }));
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid product id' }, { status: 400 });
    }

    const body = await request.json();

    // Validate required fields
    if (body?.sku !== undefined && !String(body.sku).trim()) {
      return NextResponse.json({ success: false, error: 'SKU is required' }, { status: 400 });
    }
    if (body?.barcode !== undefined && !String(body.barcode).trim()) {
      return NextResponse.json({ success: false, error: 'Barcode is required' }, { status: 400 });
    }

    const database = await getDatabase();

    // Check if SKU already exists (excluding current product)
    if (body?.sku !== undefined) {
      const sku = String(body.sku).trim();
      const existingSku = await database.collection('products').findOne({ 
        sku, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (existingSku) {
        return NextResponse.json({ success: false, error: 'A product with this SKU already exists' }, { status: 400 });
      }
    }

    // Check if barcode already exists (excluding current product)
    if (body?.barcode !== undefined) {
      const barcode = String(body.barcode).trim();
      const existingBarcode = await database.collection('products').findOne({ 
        barcode, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (existingBarcode) {
        return NextResponse.json({ success: false, error: 'A product with this barcode already exists' }, { status: 400 });
      }
    }

    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body?.name !== undefined) update.name = String(body.name).trim();
    if (body?.slug !== undefined) update.slug = String(body.slug).trim();
    if (body?.sku !== undefined) update.sku = String(body.sku).trim();
    if (body?.barcode !== undefined) update.barcode = String(body.barcode).trim();
    if (body?.category !== undefined) update.category = String(body.category).trim();
    if (body?.categoryId !== undefined) update.categoryId = String(body.categoryId).trim();
    if (body?.subcategoryId !== undefined) update.subcategoryId = String(body.subcategoryId).trim();

    const nextPrice = body?.price ?? body?.salePrice ?? body?.basePrice;
    const nextCompare = body?.comparePrice ?? body?.compareAtPrice ?? body?.originalPrice;

    if (nextPrice !== undefined) {
      const p = Number(nextPrice);
      if (!Number.isFinite(p)) {
        return NextResponse.json({ success: false, error: 'Valid price is required' }, { status: 400 });
      }
      update.price = p;
      update.basePrice = p;
    }

    if (nextCompare !== undefined) {
      const cp = Number(nextCompare);
      if (!Number.isFinite(cp)) {
        return NextResponse.json({ success: false, error: 'Valid compare price is required' }, { status: 400 });
      }
      update.comparePrice = cp;
      update.compareAtPrice = cp;
    }

    if (body?.stock !== undefined) update.stock = Number(body.stock) || 0;

    if (body?.colors !== undefined) {
      const colors = normalizeColors(body.colors);
      if (colors.length === 0) {
        return NextResponse.json(
          { success: false, error: 'At least one color variant is required' },
          { status: 400 }
        );
      }
      update.colors = colors;
      update.images = colors.flatMap((c) => c.images || []).filter(Boolean);
    }

    if (body?.description !== undefined) update.description = body.description || '';

    if (body?.fabric !== undefined) {
      update.fabric = body.fabric || '';
      update.fabricType = body.fabricType ?? body.fabric ?? '';
    } else if (body?.fabricType !== undefined) {
      update.fabricType = body.fabricType ?? '';
    }

    if (body?.shortDescription !== undefined) update.shortDescription = body.shortDescription;

    if (body?.size !== undefined) update.size = body.size || '';
    if (body?.hasSizes !== undefined) update.hasSizes = Boolean(body.hasSizes || false);
    if (body?.sizes !== undefined) update.sizes = body.hasSizes ? (Array.isArray(body.sizes) ? body.sizes : []) : [];

    if (body?.hidden !== undefined) update.hidden = Boolean(body.hidden);
    if (body?.featured !== undefined) update.featured = Boolean(body.featured);
    if (body?.isNew !== undefined) update.isNew = Boolean(body.isNew);
    if (body?.isPremium !== undefined) update.isPremium = Boolean(body.isPremium);
    if (body?.isTrending !== undefined) update.isTrending = Boolean(body.isTrending);
    if (body?.isLiveSpecial !== undefined) update.isLiveSpecial = Boolean(body.isLiveSpecial);
    if (body?.isLimitedOffer !== undefined) update.isLimitedOffer = Boolean(body.isLimitedOffer);
    if (body?.limitedStock !== undefined) update.limitedStock = body.isLimitedOffer ? Number(body.limitedStock) || undefined : undefined;
    if (body?.limitedOfferMessage !== undefined) update.limitedOfferMessage = body.isLimitedOffer ? String(body.limitedOfferMessage || '') : undefined;
    if (body?.cardOfferText !== undefined) update.cardOfferText = typeof body.cardOfferText === 'string' ? body.cardOfferText.trim() : '';

    // Prebooking fields
    if (body?.isPrebooking !== undefined) update.isPrebooking = Boolean(body.isPrebooking);
    if (body?.prebookingPrice !== undefined) update.prebookingPrice = body.isPrebooking ? Number(body.prebookingPrice) || undefined : undefined;
    if (body?.prebookingDeliveryDays !== undefined) update.prebookingDeliveryDays = body.isPrebooking ? Number(body.prebookingDeliveryDays) || undefined : undefined;
    if (body?.prebookingMessage !== undefined) update.prebookingMessage = body.isPrebooking ? String(body.prebookingMessage || '') : undefined;

    if (body?.rating !== undefined) update.rating = Number(body.rating) || 0;
    if (body?.reviews !== undefined) update.reviews = Number(body.reviews) || 0;
    if (body?.sareeLength !== undefined) update.sareeLength = body.sareeLength || '';
    if (body?.blouseIncluded !== undefined) update.blouseIncluded = Boolean(body.blouseIncluded);
    if (body?.tags !== undefined) update.tags = Array.isArray(body.tags) ? body.tags : [];

    const result = await database
      .collection('products')
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: update },
        { returnDocument: 'after' }
      );

    if (!result) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const productSlug = (result as WithId<Document>).slug as string;
    const transformed = {
      ...(result as WithId<Document>),
      _id: String((result as WithId<Document>)._id),
    };

    // Invalidate product cache after update
    await invalidateProductCache(productSlug);

    return NextResponse.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid product id' }, { status: 400 });
    }

    const database = await getDatabase();

    // Get product slug before deletion for cache invalidation
    const product = await database.collection('products').findOne({ _id: new ObjectId(id) });
    const productSlug = product?.slug as string;

    const result = await database
      .collection('products')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Invalidate product cache after deletion
    await invalidateProductCache(productSlug);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
