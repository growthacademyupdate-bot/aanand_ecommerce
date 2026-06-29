// API utility functions for fetching data from backend

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Reuse types from mockData for consistency
export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number;
  description: string;
  fabric: string;
  images: string[];
  category: string;
  colors?: string[] | Array<{ colorName: string; stock: number; images: string[]; sizes?: { [key: string]: number }; hasSizes?: boolean }>;
  hasSizes?: boolean;
  sizes?: string[];
  stock: number;
  sku: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  isSale: boolean;
  isPremium: boolean;
  isTrending: boolean;
  isLiveSpecial?: boolean;
  rating: number;
  reviews: number;
  hidden?: boolean;
  salePercent?: number;
  isLimitedOffer?: boolean;
  limitedStock?: number;
  limitedOfferMessage?: string;
  cardOfferText?: string;
  isPrebooking?: boolean;
  prebookingPrice?: number;
  prebookingDeliveryDays?: number;
  prebookingMessage?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: { 
    productId: string; 
    name: string; 
    image?: string; 
    color: string; 
    size?: string; 
    quantity: number; 
    price: number;
    isPrebooking?: boolean;
    prebookingDeliveryDays?: number;
  }[];
  subtotal: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  isPrebookingOrder?: boolean;
  expectedDeliveryDate?: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  avatar: string;
  approved: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
}

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  comparePrice?: number;
  color: string;
  size?: string;
  quantity: number;
  isPrebooking?: boolean;
  prebookingPrice?: number;
  prebookingDeliveryDays?: number;
}

// Products API
export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (res.ok && data?.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${slug}`);
    const data = await res.json();
    if (res.ok && data?.success && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Categories API
export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (res.ok && data?.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Orders API
export async function fetchOrders(token: string): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// Reviews API
export async function fetchReviews(): Promise<Review[]> {
  try {
    const res = await fetch('/api/reviews');
    const data = await res.json();
    if (res.ok && data?.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

// Cart API
export async function fetchCart(token: string): Promise<CartItem[]> {
  try {
    const res = await fetch('/api/cart', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.items)) {
      return data.items;
    }
    return [];
  } catch (error) {
    console.error('Error fetching cart:', error);
    return [];
  }
}

export async function updateCart(token: string, items: CartItem[]): Promise<boolean> {
  try {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });
    return res.ok;
  } catch (error) {
    console.error('Error updating cart:', error);
    return false;
  }
}

// Wishlist API
export async function fetchWishlist(token: string): Promise<string[]> {
  try {
    const res = await fetch('/api/wishlist', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.wishlist)) {
      return data.wishlist;
    }
    return [];
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return [];
  }
}

// Admin APIs
export async function fetchAdminOrders(token: string): Promise<Order[]> {
  try {
    const res = await fetch('/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return [];
  }
}

export async function fetchAdminProducts(token: string): Promise<Product[]> {
  try {
    const res = await fetch('/api/admin/products', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok && data?.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return [];
  }
}

export async function fetchAdminCategories(token: string): Promise<Category[]> {
  try {
    const res = await fetch('/api/admin/categories', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok && data?.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    return [];
  }
}

export async function fetchAdminCustomers(token: string): Promise<Customer[]> {
  try {
    const res = await fetch('/api/admin/customers', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok && data?.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching admin customers:', error);
    return [];
  }
}

export async function fetchAdminReviews(token: string): Promise<Review[]> {
  try {
    const res = await fetch('/api/admin/reviews', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok && data?.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return [];
  }
}
