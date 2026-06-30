import { Document, WithId } from 'mongodb';

export interface MappedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number;
  description: string;
  fabric: string;
  size: string;
  hasSizes: boolean;
  sizes: string[];
  images: string[];
  category: string;
  colors: Array<{
    colorName: string;
    stock: number;
    images: string[];
    sizes?: { [key: string]: number };
    hasSizes?: boolean;
  }>;
  stock: number;
  sku: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  isSale: boolean;
  isPremium: boolean;
  isTrending: boolean;
  isLiveSpecial: boolean;
  isLimitedOffer: boolean;
  limitedStock?: number;
  limitedOfferMessage?: string;
  cardOfferText?: string;
  isPrebooking: boolean;
  prebookingPrice?: number;
  prebookingDeliveryDays?: number;
  prebookingMessage?: string;
  rating: number;
  reviews: number;
  hidden: boolean;
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
  colorImage?: unknown;
  stock?: unknown;
  hasSizes?: unknown;
  sizes?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getVariantColorName(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  const name = (value as ColorVariantLike).colorName;
  return typeof name === 'string' ? name : undefined;
}

function getVariantImages(value: unknown): string[] {
  if (!isRecord(value)) return [];
  const v = value as ColorVariantLike;
  if (!Array.isArray(v.images)) return [];
  return (v.images as unknown[]).filter((u): u is string => typeof u === 'string' && u.length > 0);
}

export function mapProductFromDoc(p: WithId<Document>): MappedProduct {
  const price = toNumber(p.basePrice ?? p.price);
  const comparePrice = toNumber(p.compareAtPrice ?? p.comparePrice, price);
  const rawColors = p.colors as unknown;

  const processedColors = Array.isArray(rawColors)
    ? rawColors
        .map((c) => {
          if (typeof c === 'string') {
            return {
              colorName: c,
              stock: toNumber(p.stock),
              images: [] as string[],
            };
          }
          if (!isRecord(c)) return null;

          const colorName = getVariantColorName(c) || '';
          let stock = toNumber(c.stock);
          let images = getVariantImages(c);
          if (images.length === 0 && typeof c.colorImage === 'string') {
            images = [c.colorImage];
          }

          let sizes: { [key: string]: number } | undefined;
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
            stock =
              (sizes.s || 0) +
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
            hasSizes: Boolean(c.hasSizes),
          };
        })
        .filter((c) => c !== null && c.colorName.trim().length > 0) as MappedProduct['colors']
    : [];

  const imagesFromVariants = processedColors.flatMap((c) => c.images);
  const images =
    Array.isArray(p.images) && p.images.length
      ? (p.images as unknown[]).filter((u): u is string => typeof u === 'string' && u.length > 0)
      : imagesFromVariants;

  const stock = toNumber(p.stock);
  const isSale = p.isSale !== undefined ? Boolean(p.isSale) : comparePrice > price;

  return {
    id: String(p._id),
    name: String(p.name || ''),
    slug: String(p.slug || getSlug(String(p.name || ''))),
    price,
    comparePrice,
    description: String(p.description || ''),
    fabric: String(p.fabricType ?? p.fabric ?? ''),
    size: String(p.size || ''),
    hasSizes: Boolean(p.hasSizes || false),
    sizes: p.hasSizes ? (Array.isArray(p.sizes) ? (p.sizes as string[]) : []) : [],
    images: images.length ? images : ['/placeholder.svg'],
    category: String(p.category || ''),
    colors: processedColors,
    stock,
    sku: String(p.sku || ''),
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
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
    isPrebooking: Boolean(p.isPrebooking),
    prebookingPrice: p.isPrebooking ? toNumber(p.prebookingPrice) : undefined,
    prebookingDeliveryDays: p.isPrebooking ? toNumber(p.prebookingDeliveryDays) : undefined,
    prebookingMessage: p.isPrebooking ? String(p.prebookingMessage || '') : undefined,
    rating: toNumber(p.rating),
    reviews: toNumber(p.reviewCount ?? p.reviews),
    hidden: Boolean(p.hidden),
  };
}

export function hasAvailableStock(product: MappedProduct): boolean {
  if (product.stock > 0) return true;
  return product.colors.some((c) => c.stock > 0);
}

export function buildProductQuery(params: {
  category?: string;
  highlight?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  subcategoryId?: string;
}): Record<string, unknown> {
  const filter: Record<string, unknown> = { hidden: { $ne: true } };

  if (params.category) {
    filter.category = { $regex: `^${params.category}$`, $options: 'i' };
  }

  if (params.subcategoryId) {
    filter.subcategoryId = params.subcategoryId;
  }

  if (params.search) {
    const q = params.search.trim();
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
    ];
  }

  switch (params.highlight) {
    case 'featured':
      filter.$or = [{ featured: true }, { isFeatured: true }];
      break;
    case 'limited':
      filter.isLimitedOffer = true;
      break;
    case 'sale':
      filter.isSale = true;
      break;
    case 'new':
      filter.isNew = true;
      break;
    case 'trending':
      filter.isTrending = true;
      break;
    case 'premium':
      filter.isPremium = true;
      break;
    case 'liveSpecial':
      filter.isLiveSpecial = true;
      break;
    default:
      break;
  }

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    filter.basePrice = {};
    if (params.minPrice !== undefined) {
      (filter.basePrice as Record<string, number>).$gte = params.minPrice;
    }
    if (params.maxPrice !== undefined) {
      (filter.basePrice as Record<string, number>).$lte = params.maxPrice;
    }
  }

  if (params.size) {
    filter.sizes = params.size;
  }

  return filter;
}

export function sortProducts(products: MappedProduct[], sortBy: string): MappedProduct[] {
  const copy = [...products];
  if (sortBy === 'price-low') copy.sort((a, b) => a.price - b.price);
  if (sortBy === 'price-high') copy.sort((a, b) => b.price - a.price);
  if (sortBy === 'newest') copy.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  return copy;
}
