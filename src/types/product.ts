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

  mrp?: number;
  sellingPrice: number;
  costPrice?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  taxPercent?: number;

  stock: number;
  lowStockAlert?: number;
  barcode?: string;
  trackInventory?: boolean;
  allowBackorders?: boolean;

  variants?: ProductVariant[];

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
