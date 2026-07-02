
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Category, Order, Customer, Review } from '@/lib/api';

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  comparePrice?: number;
  wholesalePrice?: number;
  moq?: number;
  color: string;
  size?: string;
  quantity: number;
  // Prebooking fields
  isPrebooking?: boolean;
  prebookingPrice?: number;
  prebookingDeliveryDays?: number;
}

interface StoreState {
  products: Product[];
  categories: Category[];
  orders: Order[];
  customers: Customer[];
  reviews: Review[];
  cart: CartItem[];
  wishlist: string[];
  isLoggedIn: boolean;
  isAdmin: boolean;
  userName: string;
  user: {
    id: string;
    name: string;
    email: string;
    verified: boolean;
    mobile?: string;
    alternateMobile?: string;
    address?: string;
    city?: string;
    pincode?: string;
  } | null;
  token: string | null;
  
  wholesaleEnabled: boolean;
  fetchWholesaleSettings: () => Promise<void>;

  loadProducts: (page?: number, limit?: number) => Promise<void>;

  // Product actions
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Category actions
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Cart actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, color: string) => void;
  updateCartQuantity: (productId: string, color: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  loadCartFromBackend: () => Promise<void>;
  saveCartToBackend: (cart: CartItem[]) => Promise<void>;

  // Wishlist actions
  toggleWishlist: (productId: string) => void;
  loadWishlist: () => Promise<void>;

  // Order actions
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order['orderStatus']) => void;

  // Inventory
  updateStock: (productId: string, change: number) => void;
  updateVariantStock: (productId: string, variant: string, change: number) => Promise<void>;

  // Reviews
  addReview: (review: Review) => void;
  approveReview: (id: string) => void;
  deleteReview: (id: string) => void;

  // Auth
  login: (user: { id: string; name: string; email: string; verified: boolean }, token: string, isAdmin?: boolean) => void;
  logout: () => void;
  initializeAuth: () => void;
  checkTokenValidity: () => boolean;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      orders: [],
      customers: [],
      reviews: [],
      cart: [],
      wishlist: [],
      isLoggedIn: false,
      isAdmin: false,
      userName: '',
      user: null,
      token: null,
      wholesaleEnabled: false,

      fetchWholesaleSettings: async () => {
        try {
          const res = await fetch('/api/settings');
          const data = await res.json();
          if (data.success) {
            set({ wholesaleEnabled: data.data.wholesaleEnabled });
          }
        } catch (error) {
          console.error('Failed to fetch wholesale settings:', error);
        }
      },

      loadProducts: async (page = 1, limit = 12) => {
        try {
          const res = await fetch(`/api/products?page=${page}&limit=${limit}`);
          const data = await res.json();
          if (res.ok && data?.success && Array.isArray(data.data)) {
            set({ products: data.data });
          } else {
            set({ products: [] });
          }
        } catch (error) {
          console.error('Error loading products:', error);
          set({ products: [] });
        }
      },

      addProduct: (product) => set((s) => ({ products: [...s.products, product] })),
      updateProduct: (id, updates) => set((s) => ({
        products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),
      deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      addCategory: (category) => set((s) => ({ categories: [...s.categories, category] })),
      updateCategory: (id, updates) => set((s) => ({
        categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      })),
      deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),


      // --- Cart persistence helpers ---
      loadCartFromBackend: async () => {
        const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
        if (!token) return;
        try {
          const res = await fetch('/api/cart', { headers: { authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (res.ok && Array.isArray(data.cart)) {
            set({ cart: data.cart });
          }
        } catch {
          // ignore
        }
      },
      saveCartToBackend: async (cart) => {
        const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
        if (!token) return;
        try {
          await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
            body: JSON.stringify({ items: cart }),
          });
        } catch {
          // ignore
        }
      },

      addToCart: (item) => set((s) => {
        // Get the product to check variant stock
        const product = s.products.find((p) => p.id === item.productId);
        if (!product) {
          const newCart = [...s.cart, item];
          if (s.isLoggedIn) {
            setTimeout(() => get().saveCartToBackend(newCart), 0);
          }
          return { cart: newCart };
        }
        
        // Calculate available stock for the variant
        let availableStock = product.stock || 0;
        if (product.colors && typeof product.colors[0] !== 'string') {
          const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[]; sizes?: { [key: string]: number }; hasSizes?: boolean }>)
            .find((c) => c.colorName === item.color);
          // Use size-specific stock if size is provided and variant has sizes
          if (item.size && colorVariant?.hasSizes && colorVariant?.sizes) {
            availableStock = colorVariant.sizes[item.size] || 0;
          } else {
            availableStock = colorVariant?.stock || product.stock || 0;
          }
        }
        
        const existing = s.cart.find((c) => c.productId === item.productId && c.color === item.color && c.size === item.size);
        const currentQuantity = existing ? existing.quantity : 0;
        const newTotalQuantity = currentQuantity + item.quantity;
        
        // Validate stock
        if (newTotalQuantity > availableStock) {
          // Don't add to cart if it exceeds available stock
          console.warn(`Cannot add to cart: Only ${availableStock} quantity available for ${item.color}`);
          return s;
        }
        
        let newCart;
        if (existing) {
          newCart = s.cart.map((c) => c.productId === item.productId && c.color === item.color && c.size === item.size ? { ...c, quantity: newTotalQuantity } : c);
        } else {
          newCart = [...s.cart, item];
        }
        // Sync to backend if logged in
        if (s.isLoggedIn) {
          setTimeout(() => get().saveCartToBackend(newCart), 0);
        }
        return { cart: newCart };
      }),
      removeFromCart: (productId, color) => set((s) => {
        const newCart = s.cart.filter((c) => !(c.productId === productId && c.color === color));
        if (s.isLoggedIn) {
          setTimeout(() => get().saveCartToBackend(newCart), 0);
        }
        return { cart: newCart };
      }),
      updateCartQuantity: (productId, color, quantity, size) => set((s) => {
        // Get the product to check variant stock
        const product = s.products.find((p) => p.id === productId);
        if (!product) {
          let newCart;
          if (quantity <= 0) {
            newCart = s.cart.filter((c) => !(c.productId === productId && c.color === color && c.size === size));
          } else {
            newCart = s.cart.map((c) =>
              c.productId === productId && c.color === color && c.size === size ? { ...c, quantity } : c
            );
          }
          if (s.isLoggedIn) {
            setTimeout(() => get().saveCartToBackend(newCart), 0);
          }
          return { cart: newCart };
        }
        
        // Calculate available stock for the variant
        let availableStock = product.stock || 0;
        if (product.colors && typeof product.colors[0] !== 'string') {
          const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[]; sizes?: { [key: string]: number }; hasSizes?: boolean }>)
            .find((c) => c.colorName === color);
          // Use size-specific stock if size is provided and variant has sizes
          if (size && colorVariant?.hasSizes && colorVariant?.sizes) {
            availableStock = colorVariant.sizes[size] || 0;
          } else {
            availableStock = colorVariant?.stock || product.stock || 0;
          }
        }
        
        // Validate stock
        if (quantity > availableStock) {
          // Don't update if it exceeds available stock
          console.warn(`Cannot update quantity: Only ${availableStock} quantity available for ${color}`);
          return s;
        }
        
        let newCart;
        if (quantity <= 0) {
          newCart = s.cart.filter((c) => !(c.productId === productId && c.color === color && c.size === size));
        } else {
          newCart = s.cart.map((c) => c.productId === productId && c.color === color && c.size === size ? { ...c, quantity } : c);
        }
        if (s.isLoggedIn) {
          setTimeout(() => get().saveCartToBackend(newCart), 0);
        }
        return { cart: newCart };
      }),
      clearCart: () => {
        if (get().isLoggedIn) {
          setTimeout(() => get().saveCartToBackend([]), 0);
        }
        set({ cart: [] });
      },

      loadWishlist: async () => {
        const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
        if (!token) {
          // Don't clear wishlist for non-logged-in users - preserve local state
          return;
        }

        try {
          const res = await fetch('/api/wishlist', {
            headers: { authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            set({ wishlist: Array.isArray(data.wishlist) ? data.wishlist : [] });
          }
        } catch {
          // ignore
        }
      },

      toggleWishlist: (productId) => {
        const state = get();
        const exists = state.wishlist.includes(productId);

        set({
          wishlist: exists
            ? state.wishlist.filter((id) => id !== productId)
            : [...state.wishlist, productId],
        });

        const token = state.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
        if (!state.isLoggedIn || !token) return;

        (async () => {
          try {
            if (exists) {
              await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
                method: 'DELETE',
                headers: { authorization: `Bearer ${token}` },
              });
            } else {
              await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
                body: JSON.stringify({ productId }),
              });
            }
          } catch {
            // ignore
          }
        })();
      },

      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
      updateOrderStatus: (id, status) => set((s) => ({
        orders: s.orders.map((o) => (o.id === id ? { ...o, orderStatus: status } : o)),
      })),

      updateStock: (productId, change) => set((s) => ({
        products: s.products.map((p) => p.id === productId ? { ...p, stock: Math.max(0, p.stock + change) } : p),
      })),

      updateVariantStock: async (productId, variant, change) => {
        try {
          console.log('🔄 STORE VARIANT STOCK UPDATE:', { productId, variant, change });
          
          const response = await fetch('/api/admin/inventory', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              authorization: 'Bearer admin-token'
            },
            body: JSON.stringify({
              productId,
              variant,
              change
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('✅ STORE VARIANT UPDATE SUCCESS:', result.data);
            
            // Update local state with new variant stock and recalculate product total
            set((s) => {
              const updatedProducts = s.products.map((p): Product => {
                if (p.id === productId) {
                  const updatedColors = p.colors?.map((color: string | { colorName: string; stock?: number; images?: string[] }) => {
                    const colorName = typeof color === 'string' ? color : color.colorName;
                    if (colorName === variant) {
                      if (typeof color === 'string') {
                        return { colorName, stock: Math.max(0, change), images: [] };
                      } else {
                        return { ...color, stock: Math.max(0, (color.stock || 0) + change) };
                      }
                    }
                    return color;
                  }).filter((c): c is { colorName: string; stock?: number; images?: string[] } => typeof c !== 'string')
                    .map((c): { colorName: string; stock: number; images: string[] } => ({
                      colorName: c.colorName,
                      stock: c.stock || 0,
                      images: c.images || []
                    })) || [];
                  return { ...p, colors: updatedColors };
                } else {
                  return p;
                }
              });
              
              return { products: updatedProducts as Product[] };
            });
          } else {
            const error = await response.json();
            console.error('❌ STORE VARIANT UPDATE FAILED:', error);
            throw new Error(error.error || 'Failed to update variant stock');
          }
        } catch (error) {
          console.error('❌ STORE VARIANT UPDATE ERROR:', error);
          throw error;
        }
      },

      addReview: (review) => set((s) => ({ reviews: [...s.reviews, review] })),
      approveReview: (id) => set((s) => ({
        reviews: s.reviews.map((r) => (r.id === id ? { ...r, approved: true } : r)),
      })),
      deleteReview: (id) => set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),

      login: async (user, token, isAdmin = false) => {
        const loginTime = Date.now();
        
        // Get current cart and wishlist before login to preserve them
        const currentCart = get().cart;
        const currentWishlist = get().wishlist;
        
        if (isAdmin) {
          localStorage.setItem('adminToken', token);
        } else {
          localStorage.setItem('token', token);
        }
        localStorage.setItem('loginTime', loginTime.toString());
        localStorage.setItem('isAdmin', isAdmin.toString());

        set({
          isLoggedIn: true,
          userName: user.name,
          user,
          token,
          isAdmin,
        });
        
        if (!isAdmin) {
          // Load backend data first
          await get().loadWishlist();
          await get().loadCartFromBackend();
          
          // Merge with local data (prioritize backend data, but add local items that don't exist)
          const backendCart = get().cart;
          const backendWishlist = get().wishlist;
          
          // Merge cart: combine backend and local carts, avoid duplicates
          const mergedCart = [...backendCart];
          currentCart.forEach(localItem => {
            const existing = mergedCart.find(item => 
              item.productId === localItem.productId && 
              item.color === localItem.color && 
              item.size === localItem.size
            );
            if (!existing) {
              mergedCart.push(localItem);
            } else {
              // Update quantity if local item has more
              const totalQuantity = existing.quantity + localItem.quantity;
              const product = get().products.find(p => p.id === localItem.productId);
              if (product) {
                let availableStock = product.stock || 0;
                if (product.colors && typeof product.colors[0] !== 'string') {
                  const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[]; sizes?: { [key: string]: number }; hasSizes?: boolean }>)
                    .find((c) => c.colorName === localItem.color);
                  // Use size-specific stock if size is provided and variant has sizes
                  if (localItem.size && colorVariant?.hasSizes && colorVariant?.sizes) {
                    availableStock = colorVariant.sizes[localItem.size] || 0;
                  } else {
                    availableStock = colorVariant?.stock || product.stock || 0;
                  }
                }
                
                if (totalQuantity <= availableStock) {
                  existing.quantity = totalQuantity;
                }
              }
            }
          });
          
          // Merge wishlist: combine backend and local wishlists
          const mergedWishlist = [...new Set([...backendWishlist, ...currentWishlist])];
          
          // Update state with merged data
          set({ cart: mergedCart, wishlist: mergedWishlist });
          
          // Save merged data to backend
          await get().saveCartToBackend(mergedCart);
          
          // Save merged wishlist to backend
          const tokenToUse = get().token;
          if (tokenToUse) {
            try {
              // Add each missing wishlist item to backend
              for (const productId of mergedWishlist) {
                if (!backendWishlist.includes(productId)) {
                  await fetch('/api/wishlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', authorization: `Bearer ${tokenToUse}` },
                    body: JSON.stringify({ productId }),
                  });
                }
              }
              // Reload to get updated wishlist
              await get().loadWishlist();
            } catch (error) {
              console.error('Failed to sync wishlist:', error);
            }
          }
        }
      },
      logout: () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('token');
        
        // Preserve cart and wishlist in localStorage for next session
        // Don't clear them from state immediately, let Zustand persist handle it
        set({
          isLoggedIn: false,
          userName: '',
          user: null,
          token: null,
          isAdmin: false,
          // Don't clear cart and wishlist here - let them persist in localStorage
        });
      },
      initializeAuth: () => {
        const loginTime = localStorage.getItem('loginTime');
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const token = isAdmin ? localStorage.getItem('adminToken') : localStorage.getItem('token');
        
        if (token && loginTime) {
          const loginTimestamp = parseInt(loginTime);
          const currentTime = Date.now();
          const twentyFourHours = 24 * 60 * 60 * 1000;
          
          if ((currentTime - loginTimestamp) < twentyFourHours) {
            // Restore session
            set({
              isLoggedIn: true,
              userName: isAdmin ? 'Admin' : (JSON.parse(atob(token.split('.')[1]))?.name || 'User'),
              user: isAdmin ? {
                id: 'admin',
                name: 'Admin',
                email: 'admin@anandwholesale.com',
                verified: true
              } : JSON.parse(atob(token.split('.')[1])),
              token,
              isAdmin
            });
          } else {
            // Token expired, clean up
            localStorage.removeItem('adminToken');
            localStorage.removeItem('token');
            localStorage.removeItem('loginTime');
            localStorage.removeItem('isAdmin');
          }
        }
      },
      checkTokenValidity: () => {
        const loginTime = localStorage.getItem('loginTime');
        if (!loginTime) return false;
        
        const currentTime = Date.now();
        const loginTimestamp = parseInt(loginTime);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        return (currentTime - loginTimestamp) < twentyFourHours;
      },
    }),
    {
      name: 'anand-wholesale-store',
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        isLoggedIn: state.isLoggedIn,
        userName: state.userName,
        user: state.user,
        token: state.token,
        isAdmin: state.isAdmin,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.isLoggedIn && !state.isAdmin) {
          state.loadWishlist();
          state.loadCartFromBackend();
        }
        // If not logged in, cart and wishlist will be restored from localStorage via Zustand persist
      },
    }
  )
);
