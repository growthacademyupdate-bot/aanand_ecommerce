export interface ProductVariant {
  id?: string;
  size?: string;
  color?: string;
  fabric?: string;
  material?: string;
  sku?: string;
  price?: number;
  stock?: number;
  image?: string;
  wholesalePrice?: number;
  moq?: number;
}

export interface ProductLabels {
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isRecommended?: boolean;
  isLimitedTime?: boolean;
  isFlashSale?: boolean;
}

export interface AdminProduct {
  _id?: string;
  name: string;
  slug: string;
  sku: string;
  brand?: string;
  
  categoryId: string;
  subcategoryId: string;
  categoryName?: string;
  subcategoryName?: string;
  
  productType?: 'simple' | 'variant' | 'legacy';

  mrp?: number;
  sellingPrice: number;
  costPrice?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  taxPercent?: number;

  wholesalePrice?: number;
  moq?: number;

  stock: number;
  lowStockAlert?: number;
  barcode?: string;
  trackInventory?: boolean;
  allowBackorders?: boolean;

  variants?: ProductVariant[];

  // Legacy fields for backward compatibility
  colors?: any[];
  hasSizes?: boolean;
  sizes?: any;
  sizeQuantities?: any;

  featuredImage: string;
  images?: string[];

  shortDescription?: string;
  description?: string;

  labels?: ProductLabels;
  status: 'draft' | 'published' | 'hidden';

  seoTitle?: string;
  metaDescription?: string;
  seoKeywords?: string;

  weight?: number;
  length?: number;
  width?: number;
  height?: number;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}
