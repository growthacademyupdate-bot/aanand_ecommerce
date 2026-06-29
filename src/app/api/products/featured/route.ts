import { NextRequest, NextResponse } from 'next/server';
import { WithId, Document } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import { cacheOrFetch } from '@/lib/redis';

export const runtime = 'nodejs';

interface ColorVariant {
  colorName?: string;
  stock?: number;
  images?: string[];
  sizes?: { [key: string]: number };
  hasSizes?: boolean;
}

function getSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

type ColorVariantLike = {
  colorName?: unknown;
  images?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getVariantColorName(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  const v = value as ColorVariantLike;
  return typeof v.colorName === 'string' ? v.colorName : undefined;
}

function getVariantImages(value: unknown): string[] {
  if (!isRecord(value)) return [];
  const v = value as ColorVariantLike;
  if (!Array.isArray(v.images)) return [];
  return (v.images as unknown[]).filter((u): u is string => typeof u === 'string' && u.length > 0);
}

export async function GET(_request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json(
      { success: false, error: 'MONGODB_URI is not configured on the server' },
      { status: 500 }
    );
  }

  // Use Redis cache with 10-minute TTL (600 seconds)
  // Cache key: products:featured
  const cacheKey = 'products:v2:featured';
  const cacheTTL = 600; // 10 minutes

  try {
    const payload = await cacheOrFetch(cacheKey, cacheTTL, async () => {
    const client = await getMongoClient(uri);
      const database = client.db(getDatabaseName());

      // Fetch only featured products from products collection
      const raw = await database
        .collection('products')
        .find({ 
          $or: [
            { featured: true },
            { isFeatured: true }
          ],
          hidden: { $ne: true }
        })
        .sort({ createdAt: -1 })
        .toArray();

    const products = (raw as WithId<Document>[]).map((p) => {
      const price = toNumber(p.basePrice ?? p.price);
      const comparePrice = toNumber(p.compareAtPrice ?? p.comparePrice, price);

      const rawColors = p.colors as unknown;
      
      // Process colors to include variant stock information
      const processedColors = Array.isArray(rawColors)
        ? rawColors.map((c) => {
            if (typeof c === 'string') {
              // Legacy format: convert to object with default stock
              return {
                colorName: c,
                stock: toNumber(p.stock), // Use main product stock as fallback
                images: []
              };
            } else if (isRecord(c)) {
              // New format: extract colorName, stock, and images
              const colorName = getVariantColorName(c) || '';
              let stock = toNumber(c.stock);
              
              // Handle dress product structure with colorImage
              let images = getVariantImages(c);
              if (images.length === 0 && typeof c.colorImage === 'string') {
                images = [c.colorImage];
              }
              
              // If hasSizes is true, stock is calculated from sizes
              let sizes: { [key: string]: number } | undefined = undefined;
              if (c.hasSizes && isRecord(c.sizes)) {
                const sizeData = c.sizes as Record<string, unknown>;
                sizes = {
                  s: toNumber(sizeData.s) || 0,
                  m: toNumber(sizeData.m) || 0,
                  l: toNumber(sizeData.l) || 0,
                  xl: toNumber(sizeData.xl) || 0,
                  xxl: toNumber(sizeData.xxl) || 0,
                  xxxl: toNumber(sizeData.xxxl) || 0,
                  free: toNumber(sizeData.free) || 0,
                };
                stock = (sizes.s || 0) + 
                        (sizes.m || 0) + 
                        (sizes.l || 0) + 
                        (sizes.xl || 0) + 
                        (sizes.xxl || 0) +
                        (sizes.xxxl || 0) +
                        (sizes.free || 0);
              }
              
              return {
                colorName,
                stock,
                images,
                sizes,
                hasSizes: Boolean(c.hasSizes)
              };
            }
            return null;
          }).filter((c) => c !== null && c.colorName.trim().length > 0) as Array<{ colorName: string; stock: number; images: string[]; sizes?: { [key: string]: number }; hasSizes?: boolean }>
        : [];

      const colorNames = processedColors.map(c => c.colorName);
      const imagesFromVariants = processedColors.flatMap(c => c.images);
      
      
      const images = Array.isArray(p.images) && p.images.length
        ? (p.images as unknown[]).filter((u): u is string => typeof u === 'string' && u.length > 0)
        : imagesFromVariants;

      const stock = toNumber(p.stock);
      const isSale =
        p.isSale !== undefined
          ? Boolean(p.isSale)
          : (comparePrice > price);

      const result = {
        id: String(p._id),
        name: String(p.name || ''),
        slug: String(p.slug || getSlug(String(p.name || ''))),
        price,
        comparePrice,
        description: String(p.description || ''),
        fabric: String(p.fabricType ?? p.fabric ?? ''),
        size: String(p.size || ''),
        hasSizes: Boolean(p.hasSizes || false),
        sizes: p.hasSizes ? (Array.isArray(p.sizes) ? p.sizes : []) : [],
        images: images.length ? images : ['/placeholder.svg'],
        category: String(p.category || ''),
        colors: processedColors,
        stock,
        sku: String(p.sku || ''),
        tags: Array.isArray(p.tags) ? p.tags : [],
        featured: Boolean(p.isFeatured ?? p.featured),
        isNew: Boolean(p.isNew),
        isSale,
        isPremium: Boolean(p.isPremium),
        isTrending: Boolean(p.isTrending),
        isLiveSpecial: Boolean(p.isLiveSpecial),
        isLimitedOffer: Boolean(p.isLimitedOffer),
        limitedStock: p.isLimitedOffer ? toNumber(p.limitedStock, 0) || undefined : undefined,
        limitedOfferMessage: p.isLimitedOffer ? String(p.limitedOfferMessage || '') : undefined,
        cardOfferText: typeof p.cardOfferText === 'string' ? String(p.cardOfferText) : undefined,
        // Prebooking fields
        isPrebooking: Boolean(p.isPrebooking),
        prebookingPrice: p.isPrebooking ? toNumber(p.prebookingPrice) : undefined,
        prebookingDeliveryDays: p.isPrebooking ? toNumber(p.prebookingDeliveryDays) : undefined,
        prebookingMessage: p.isPrebooking ? String(p.prebookingMessage || '') : undefined,
        rating: toNumber(p.rating),
        reviews: toNumber(p.reviewCount ?? p.reviews),
        hidden: Boolean(p.hidden),
      };
      
            
      return result;
    });

    // Build completely new response object to ensure proper serialization
    const cleanProducts = products.map(p => {
      const cleanColors = Array.isArray(p.colors) 
        ? p.colors.map((c: ColorVariant) => ({
            colorName: c.colorName || '',
            stock: Number(c.stock) || 0,
            images: Array.isArray(c.images) ? c.images.filter((img: string) => typeof img === 'string') : [],
            sizes: c.sizes,
            hasSizes: Boolean(c.hasSizes)
          }))
        : [];
      
      return {
        id: String(p.id),
        name: String(p.name),
        slug: String(p.slug),
        price: Number(p.price),
        comparePrice: Number(p.comparePrice),
        description: String(p.description),
        fabric: String(p.fabric),
        size: String(p.size),
        hasSizes: Boolean(p.hasSizes),
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        images: Array.isArray(p.images) ? p.images : [],
        category: String(p.category),
        colors: cleanColors,
        stock: Number(p.stock),
        sku: String(p.sku),
        tags: Array.isArray(p.tags) ? p.tags : [],
        featured: Boolean(p.featured),
        isNew: Boolean(p.isNew),
        isSale: Boolean(p.isSale),
        isPremium: Boolean(p.isPremium),
        isTrending: Boolean(p.isTrending),
        isLiveSpecial: Boolean(p.isLiveSpecial),
        isLimitedOffer: Boolean(p.isLimitedOffer),
        limitedStock: p.limitedStock,
        limitedOfferMessage: p.limitedOfferMessage,
        cardOfferText: p.cardOfferText,
        isPrebooking: Boolean(p.isPrebooking),
        prebookingPrice: p.prebookingPrice,
        prebookingDeliveryDays: p.prebookingDeliveryDays,
        prebookingMessage: p.prebookingMessage,
        rating: Number(p.rating),
        reviews: Number(p.reviews),
        hidden: Boolean(p.hidden)
      };
    });
    

    return { success: true, data: cleanProducts };
    });

    const response = NextResponse.json(payload);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}
