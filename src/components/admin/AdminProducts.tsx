"use client";

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Upload, FileText, Loader2, Search } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import { uploadToR2 } from '@/lib/r2Upload';

// Database interfaces
interface ColorVariant {
  colorName: string;
  stock: number;
  images: string[];
  colorImage?: string;
  hasSizes?: boolean;
  sizes?: {
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
    xxxl: number;
    free: number;
  };
}

interface DbProduct {
  _id?: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number;
  category: string;
  stock: number;
  colors: ColorVariant[];
  description: string;
  fabric: string;
  size?: string;
  hasSizes?: boolean;
  sizes?: string[];
  sizeQuantities?: { [key: string]: number };
  hidden?: boolean;
  images?: string[];
  sku?: string;
  barcode?: string;
  tags?: string[];
  featured?: boolean;
  isNew?: boolean;
  isPremium?: boolean;
  isTrending?: boolean;
  isLiveSpecial?: boolean;
  rating?: number;
  reviews?: number;
  sareeLength?: string;
  cardOfferText?: string;
  isLimitedOffer?: boolean;
  limitedStock?: number;
  limitedOfferMessage?: string;
  // Prebooking fields
  isPrebooking?: boolean;
  prebookingPrice?: number;
  prebookingDeliveryDays?: number;
  prebookingMessage?: string;
  createdAt?: Date;
  formType?: string;
}

interface DbCategory {
  _id?: string;
  name: string;
  slug: string;
  image: string;
  productCount?: number;
}

interface DbSubcategory {
  _id?: string;
  name: string;
  categoryId: string;
  status?: boolean;
}

type ProductForm = {
  name: string;
  sku: string;
  barcode: string;
  originalPrice: string;
  salePrice: string;
  category: string;
  categoryId: string;
  subcategoryId: string;
  stock: string;

  colors: {
    colorName: string;
    stock: string;
    images: string[];
    colorImage: string;
    hasSizes: boolean;
    sizes: {
      s: string;
      m: string;
      l: string;
      xl: string;
      xxl: string;
      xxxl: string;
      free: string;
    };
  }[];

  description: string;
  fabric: string;
  size: string;
  hasSizes: boolean;
  sizes: string[];
  sizeQuantities: { [key: string]: string };
  hidden: boolean;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  isPremium: boolean;
  isTrending: boolean;
  isLiveSpecial: boolean;
  rating: number;
  reviews: number;
  sareeLength: string;
  cardOfferText: string;
  isLimitedOffer: boolean;
  limitedStock: string;
  limitedOfferMessage: string;
  // Prebooking fields
  isPrebooking: boolean;
  prebookingPrice: string;
  prebookingDeliveryDays: string;
  prebookingMessage: string;
};

const AdminProducts = () => {
  const { addProduct, updateProduct, deleteProduct } = useStore();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [subcategories, setSubcategories] = useState<DbSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<DbProduct | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingColorIndex, setUploadingColorIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [paginatingLoading, setPaginatingLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDressMode, setIsDressMode] = useState(false);
  
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState('');
  const [addSubcategoryModalOpen, setAddSubcategoryModalOpen] = useState(false);
  const [submittingSub, setSubmittingSub] = useState(false);
  const [subForm, setSubForm] = useState({ name: '', categoryId: '', description: '', status: true });

  const [form, setForm] = useState<ProductForm>({
    name: '',
    sku: '',
    barcode: '',
    originalPrice: '', salePrice: '', category: '', categoryId: '', subcategoryId: '', stock: '', colors: [],
    description: '', fabric: '', size: '', hasSizes: false, sizes: [], sizeQuantities: {}, hidden: false,
    tags: [], featured: false, isNew: false, isPremium: false,
    isTrending: false, isLiveSpecial: false, rating: 0, reviews: 0,
    sareeLength: '', cardOfferText: '', isLimitedOffer: false, limitedStock: '', limitedOfferMessage: '',
    // Prebooking fields
    isPrebooking: false,
    prebookingPrice: '',
    prebookingDeliveryDays: '',
    prebookingMessage: '',
  });

  // Helper to calculate stock from size quantities for a color
  const calculateColorStock = (color: ProductForm['colors'][0]): number => {
    if (!color.hasSizes) return Number(color.stock) || 0;
    return (Number(color.sizes?.s) || 0) + 
           (Number(color.sizes?.m) || 0) + 
           (Number(color.sizes?.l) || 0) + 
           (Number(color.sizes?.xl) || 0) + 
           (Number(color.sizes?.xxl) || 0) +
           (Number(color.sizes?.xxxl) || 0) +
           (Number(color.sizes?.free) || 0);
  };

  const totalStock = form.colors.reduce((sum, color) => sum + calculateColorStock(color), 0);

  // Helper function to calculate dynamic stock from variants
  const calculateProductStock = (product: DbProduct): number => {
    if (!Array.isArray(product.colors)) return 0;
    const totalStock = product.colors.reduce((sum, color) => {
      const stock = typeof color === 'string' ? 0 : (Number(color.stock) || 0);
      return sum + stock;
    }, 0);

    console.log('📊 PRODUCT STOCK CALCULATION:', {
      productId: product._id,
      productName: product.name,
      colors: product.colors,
      calculatedStock: totalStock,
      storedStock: product.stock
    });

    return totalStock;
  };

  // Short timer to hide skeleton quickly on refresh
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Fetch data from database
  const fetchData = async (isPagination = false) => {
    if (isPagination) {
      setPaginatingLoading(true);
    } else {
      setLoading(true);
    }
    try {
      // Fetch categories (only on initial load)
      if (!isPagination) {
        const [categoriesRes, subcatRes] = await Promise.all([
          fetch('/api/admin/categories', { headers: { authorization: 'Bearer admin-token' } }),
          fetch('/api/admin/subcategories', { headers: { authorization: 'Bearer admin-token' } })
        ]);
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.data || []);
        }
        if (subcatRes.ok) {
          const subData = await subcatRes.json();
          setSubcategories(subData.data || []);
        }
      }

      // Fetch products from regular products and size-based categories (Dress and Blouse)
      const subcatQuery = selectedSubcategoryFilter ? `&subcategory=${selectedSubcategoryFilter}` : '';
      const [productsRes, dressProductsRes, blouseProductsRes] = await Promise.all([
        fetch(`/api/admin/products?page=${currentPage}&pageSize=6&search=${encodeURIComponent(searchQuery)}${subcatQuery}`, {
          headers: { authorization: 'Bearer admin-token' }
        }),
        fetch(`/api/admin/dress-products?page=${currentPage}&pageSize=6&search=${encodeURIComponent(searchQuery)}&category=Dress`, {
          headers: { authorization: 'Bearer admin-token' }
        }),
        fetch(`/api/admin/dress-products?page=${currentPage}&pageSize=6&search=${encodeURIComponent(searchQuery)}&category=Blouse`, {
          headers: { authorization: 'Bearer admin-token' }
        })
      ]);

      let allProducts: DbProduct[] = [];
      let totalRegular = 0;
      let totalSizeBased = 0;

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        allProducts = [...allProducts, ...(productsData.data || [])];
        totalRegular = productsData.pagination?.total || 0;
      }

      if (dressProductsRes.ok) {
        const dressProductsData = await dressProductsRes.json();
        allProducts = [...allProducts, ...(dressProductsData.data || [])];
        totalSizeBased += dressProductsData.pagination?.total || 0;
      }

      if (blouseProductsRes.ok) {
        const blouseProductsData = await blouseProductsRes.json();
        allProducts = [...allProducts, ...(blouseProductsData.data || [])];
        totalSizeBased += blouseProductsData.pagination?.total || 0;
      }

      // Sort by createdAt descending
      allProducts.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      // Deduplicate products by _id to avoid React key conflicts
      const uniqueProducts = Array.from(
        new Map(allProducts.map(p => [p._id, p])).values()
      );

      setProducts(uniqueProducts);
      setTotal(totalRegular + totalSizeBased);
      setTotalPages(Math.ceil((totalRegular + totalSizeBased) / 6));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
      setPaginatingLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, []);

  useEffect(() => {
    // Reset to page 1 when search changes and fetch data
    setCurrentPage(1);
    fetchData(false);
  }, [searchQuery, selectedSubcategoryFilter]);

  useEffect(() => {
    fetchData(true);
  }, [currentPage]);

  const openAddModal = (category?: string) => {
    setEditing(null);
    setModalOpen(true);
    setForm({
      name: '',
      sku: '',
      barcode: '',
      originalPrice: '', salePrice: '', category: category || (categories[0]?.slug || ''), categoryId: categories[0]?._id || '', subcategoryId: '', stock: '', colors: [],
      description: '', fabric: '', size: '', hasSizes: false, sizes: [], sizeQuantities: {}, hidden: false,
      tags: [], featured: false, isNew: false, isPremium: false,
      isTrending: false, isLiveSpecial: false, rating: 0, reviews: 0,
      sareeLength: '', cardOfferText: '', isLimitedOffer: false, limitedStock: '', limitedOfferMessage: '',
      // Prebooking fields
      isPrebooking: false,
      prebookingPrice: '',
      prebookingDeliveryDays: '',
      prebookingMessage: '',
    });
    // Don't reset isDressMode here - it's set by the button click
  };

  const openEditModal = (p: DbProduct) => {
    console.log('[ADMIN-PRODUCTS] openEditModal called with product:', {
      _id: p._id,
      name: p.name,
      category: p.category,
      formType: p.formType,
      hasSizes: p.hasSizes,
      colorsCount: Array.isArray(p.colors) ? p.colors.length : 0,
      firstColor: Array.isArray(p.colors) && p.colors[0] ? {
        colorName: p.colors[0].colorName,
        hasSizes: p.colors[0].hasSizes,
        sizes: p.colors[0].sizes
      } : null
    });

    setEditing(p);
    setModalOpen(true);
    // Use formType to determine which form to open, fallback to structure detection for legacy products
    const isSizeBasedProduct = p.formType === 'dress' ||
      (p.category?.toLowerCase() === 'dress' || p.category?.toLowerCase() === 'blouse') ||
      (p.hasSizes && p.sizes && typeof p.sizes === 'object' &&
        ('xxxl' in p.sizes || 'free' in p.sizes));
    setIsDressMode(isSizeBasedProduct || false);

    const mappedColors = (Array.isArray(p.colors) ? p.colors : []).map((c) => ({
      colorName: c.colorName,
      stock: c.stock?.toString() || '',
      images: Array.isArray(c.images) ? c.images : [],
      colorImage: c.colorImage || (Array.isArray(c.images) ? c.images[0] || '' : ''),
      hasSizes: c.hasSizes || false,
      sizes: {
        s: c.sizes?.s?.toString() || '0',
        m: c.sizes?.m?.toString() || '0',
        l: c.sizes?.l?.toString() || '0',
        xl: c.sizes?.xl?.toString() || '0',
        xxl: c.sizes?.xxl?.toString() || '0',
        xxxl: c.sizes?.xxxl?.toString() || '0',
        free: c.sizes?.free?.toString() || '0',
      },
    }));

    console.log('[ADMIN-PRODUCTS] Mapped colors for edit:', mappedColors);

    setForm({
      name: p.name,
      sku: p.sku || '',
      barcode: p.barcode || '',
      originalPrice: p.comparePrice?.toString() || '',
      salePrice: p.price?.toString() || '',
      category: p.category,
      categoryId: (p as any).categoryId || '',
      subcategoryId: (p as any).subcategoryId || '',
      stock: p.stock?.toString() || '',
      colors: mappedColors,
      description: p.description,
      fabric: p.fabric,
      size: p.size || '',
      hasSizes: p.hasSizes || false,
      sizes: p.sizes || [],
      sizeQuantities: p.sizeQuantities ? Object.fromEntries(Object.entries(p.sizeQuantities).map(([k, v]) => [k, v.toString()])) : {},
      hidden: p.hidden || false,
      tags: p.tags || [],
      featured: p.featured || false,
      isNew: p.isNew || false,
      isPremium: p.isPremium || false,
      isTrending: p.isTrending || false,
      isLiveSpecial: p.isLiveSpecial || false,
      rating: p.rating || 0,
      reviews: p.reviews || 0,
      sareeLength: p.sareeLength || '',
      cardOfferText: p.cardOfferText || '',
      isLimitedOffer: p.isLimitedOffer || false,
      limitedStock: p.limitedStock?.toString() || '',
      limitedOfferMessage: p.limitedOfferMessage || '',
      // Prebooking fields
      isPrebooking: p.isPrebooking || false,
      prebookingPrice: p.prebookingPrice?.toString() || '',
      prebookingDeliveryDays: p.prebookingDeliveryDays?.toString() || '',
      prebookingMessage: p.prebookingMessage || '',
    });
    setModalOpen(true);
  };

  const openDetailsModal = (p: DbProduct) => {
    setDetailsProduct(p);
    setDetailsOpen(true);
  };

  // Color management functions
  const addColor = () => {
    setForm({
      ...form,
      colors: [...form.colors, { 
        colorName: '', 
        stock: '', 
        images: [], 
        colorImage: '',
        hasSizes: false,
        sizes: { s: '', m: '', l: '', xl: '', xxl: '', xxxl: '', free: '' }
      }],
    });
  };

  const removeColor = (index: number) => {
    setForm({ ...form, colors: form.colors.filter((_, i) => i !== index) });
  };

  const uploadColorImage = async (colorIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingColorIndex(colorIndex);
    setUploadProgress(0);

    try {
      const url = await uploadToR2(file, {
        folder: 'products',
        maxBytes: 10 * 1024 * 1024,
        onProgress: (pct) => setUploadProgress(pct),
      });

      setForm((prev) => {
        const nextColors = [...prev.colors];
        const current = nextColors[colorIndex];
        if (!current) return prev;
        nextColors[colorIndex] = {
          ...current,
          images: [url],
          colorImage: url, // Set colorImage for dress mode
        };
        return { ...prev, colors: nextColors };
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Image upload failed', variant: 'destructive' });
    } finally {
      setUploadingColorIndex(null);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (submitting) return;
    if (uploadingColorIndex !== null) {
      toast({ title: 'Please wait for image upload to finish', variant: 'destructive' });
      return;
    }

    // Validate required fields
    if (!form.sku.trim()) {
      toast({ title: 'SKU is required', variant: 'destructive' });
      return;
    }
    if (!form.barcode.trim()) {
      toast({ title: 'Barcode is required', variant: 'destructive' });
      return;
    }

    // Use the category from form when in dress mode (will be Dress or Blouse based on selection)
    const finalCategory = isDressMode ? form.category : form.category;

    const slug = form.name.toLowerCase().replace(/\s+/g, '-');
    
    // Prepare color data based on mode
    const colorsData = isDressMode 
      ? form.colors.map((c) => ({
          colorName: c.colorName.trim(),
          stock: calculateColorStock(c),
          colorImage: c.colorImage || (c.images?.[0] || ''),
          hasSizes: c.hasSizes,
          sizes: c.hasSizes ? {
            s: Number(c.sizes?.s) || 0,
            m: Number(c.sizes?.m) || 0,
            l: Number(c.sizes?.l) || 0,
            xl: Number(c.sizes?.xl) || 0,
            xxl: Number(c.sizes?.xxl) || 0,
            xxxl: Number(c.sizes?.xxxl) || 0,
            free: Number(c.sizes?.free) || 0,
          } : undefined,
        }))
      : form.colors.map((c) => ({
          colorName: c.colorName.trim(),
          stock: Number(c.stock),
          images: (c.images || []).filter((img) => typeof img === 'string' && !img.startsWith('data:')),
        }));

    const data: Partial<DbProduct> & { categoryId?: string, subcategoryId?: string } = {
      name: form.name,
      slug,
      price: Number(form.salePrice),
      comparePrice: Number(form.originalPrice),
      category: finalCategory,
      categoryId: form.categoryId || finalCategory,
      subcategoryId: form.subcategoryId,
      stock: totalStock,
      colors: colorsData as ColorVariant[],
      description: form.description,
      fabric: form.fabric,
      size: form.size,
      hasSizes: form.hasSizes,
      sizes: form.hasSizes ? form.sizes : [],
      sizeQuantities: form.hasSizes ? Object.fromEntries(
        Object.entries(form.sizeQuantities).map(([k, v]) => [k, Number(v)])
      ) : undefined,
      hidden: form.hidden,
      sku: form.sku,
      barcode: form.barcode,
      tags: form.tags,
      featured: form.featured,
      isNew: form.isNew,
      isPremium: form.isPremium,
      isTrending: form.isTrending,
      isLiveSpecial: form.isLiveSpecial,
      rating: form.rating,
      reviews: form.reviews,
      sareeLength: form.sareeLength,
      cardOfferText: form.cardOfferText?.trim() ? form.cardOfferText.trim() : undefined,
      isLimitedOffer: form.isLimitedOffer,
      limitedStock: form.isLimitedOffer ? Number(form.limitedStock) : undefined,
      limitedOfferMessage: form.isLimitedOffer ? form.limitedOfferMessage : undefined,
      // Prebooking fields
      isPrebooking: form.isPrebooking,
      prebookingPrice: form.isPrebooking ? Number(form.prebookingPrice) : undefined,
      prebookingDeliveryDays: form.isPrebooking ? Number(form.prebookingDeliveryDays) : undefined,
      prebookingMessage: form.isPrebooking ? form.prebookingMessage?.trim() : undefined,
    };

    setSubmitting(true);
    try {
      let response;

      if (editing) {
        // For editing, determine the correct API endpoint based on whether the product has sizes
        // Use the same logic as when opening the edit modal to ensure consistency
        const isSizeBasedProduct = editing.formType === 'dress' ||
          (editing.category?.toLowerCase() === 'dress' || editing.category?.toLowerCase() === 'blouse') ||
          (editing.hasSizes && editing.sizes && typeof editing.sizes === 'object' &&
            ('xxxl' in editing.sizes || 'free' in editing.sizes)) ||
          (editing.colors && editing.colors.some((c: ColorVariant) => c.hasSizes && c.sizes));
        const editApiUrl = isSizeBasedProduct ? `/api/admin/dress-products/${editing._id}` : `/api/admin/products/${editing._id}`;
        response = await fetch(editApiUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer admin-token'
          },
          body: JSON.stringify(data),
        });
      } else {
        // For new products, determine API endpoint based on isDressMode (which is set when clicking Size Product)
        const apiUrl = isDressMode ? '/api/admin/dress-products' : '/api/admin/products';
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer admin-token'
          },
          body: JSON.stringify(data),
        });
      }

      const result = await response.json();

      if (response.ok) {
        // Refresh the products list using fetchData to ensure consistency
        await fetchData(false);

        toast({ title: editing ? 'Product updated' : 'Product added' });
        setModalOpen(false);
        setIsDressMode(false);
        setCurrentPage(1);
      } else {
        toast({ title: result.error || 'Failed to save product', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Failed to save product', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      // Find the product to determine if it's a size-based product (Dress or Blouse)
      const product = products.find(p => p._id === id);
      const isSizeBasedProduct = product?.formType === 'dress' ||
        (product?.category?.toLowerCase() === 'dress' || product?.category?.toLowerCase() === 'blouse') ||
        (product?.hasSizes && product?.sizes && typeof product?.sizes === 'object' &&
         ('xxxl' in product.sizes || 'free' in product.sizes));
      const apiUrl = isSizeBasedProduct ? `/api/admin/dress-products/${id}` : `/api/admin/products/${id}`;

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          authorization: 'Bearer admin-token'
        },
      });

      const result = await response.json();

      if (response.ok) {
        // Refresh the products list using fetchData to ensure consistency
        await fetchData(false);

        setConfirmDelete(null);
        toast({ title: 'Product deleted' });
      } else {
        toast({ title: result.error || 'Failed to delete product', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Failed to delete product', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleHidden = async (p: DbProduct) => {
    try {
      const isSizeBasedProduct = p.formType === 'dress' ||
        (p.category?.toLowerCase() === 'dress' || p.category?.toLowerCase() === 'blouse') ||
        (p.hasSizes && p.sizes && typeof p.sizes === 'object' &&
         ('xxxl' in p.sizes || 'free' in p.sizes));
      const apiUrl = isSizeBasedProduct ? `/api/admin/dress-products/${p._id}` : `/api/admin/products/${p._id}`;

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          authorization: 'Bearer admin-token'
        },
        body: JSON.stringify({ hidden: !p.hidden }),
      });

      const result = await response.json();

      if (response.ok) {
        // Refresh products list using fetchData to ensure consistency
        await fetchData(false);

        toast({ title: p.hidden ? 'Product is now visible' : 'Product hidden from store' });
      } else {
        toast({ title: result.error || 'Failed to update product', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Toggle hidden error:', error);
      toast({ title: 'Failed to update product', variant: 'destructive' });
    }
  };

  // Filter products based on search query
  const filteredProducts = products; // Search is now handled at backend API level

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl font-bold">Products</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSubcategoryFilter}
            onChange={(e) => setSelectedSubcategoryFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[180px]"
          >
            <option value="">All Subcategories</option>
            {categories.map(cat => {
              const catSubs = subcategories.filter(s => s.categoryId === cat._id && s.status !== false);
              if (catSubs.length === 0) return null;
              return (
                <optgroup key={cat._id} label={cat.name}>
                  {catSubs.map(sub => (
                    <option key={sub._id} value={sub._id}>{sub.name}</option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <button onClick={() => setAddSubcategoryModalOpen(true)} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3 shadow-sm">
            <Plus className="h-4 w-4" /> Add Subcategory
          </button>
          <button onClick={() => openAddModal()} className="btn-primary flex items-center gap-2 text-sm py-2 px-4 shadow-sm">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto relative">
        {loading ? (
          <div className="p-4">
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={`admin-skeleton-${i}`} className="flex items-center gap-4 p-3 border-b border-border last:border-0">
                  <div className="w-10 h-12 bg-muted rounded animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/5 animate-pulse" />
                  </div>
                  <div className="h-4 bg-muted rounded w-12 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-8 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-10 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                  <div className="flex gap-1">
                    <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                    <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                    <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {paginatingLoading && (
              <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">Loading page...</div>
                </div>
              </div>
            )}
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4">Price</th>
                  <th className="text-left p-4">Offer%</th>
                  <th className="text-left p-4">Stock</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={p.colors?.[0]?.images?.[0] || p.images?.[0] || '/placeholder.svg'}
                        alt={p.name}
                        className="w-10 h-12 object-cover rounded"
                      />
                      <div>
                        <span className="font-medium">{p.name}</span>
                        {p.hidden && <span className="ml-2 text-xs text-destructive">(Hidden)</span>}
                        {p.isLimitedOffer && <span className="ml-2 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">Limited</span>}
                      </div>
                    </td>
                    <td className="p-4">₹{p.price.toLocaleString()}</td>
                    <td className="p-4">{p.comparePrice > p.price ? `${Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)}%` : '—'}</td>
                    <td className="p-4">{calculateProductStock(p)}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${calculateProductStock(p) > 10 ? 'bg-primary/20 text-primary' : calculateProductStock(p) > 0 ? 'bg-gold/20 text-gold' : 'bg-destructive/20 text-destructive'}`}>
                        {calculateProductStock(p) > 10 ? 'In Stock' : calculateProductStock(p) > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => openDetailsModal(p)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="View Details"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => toggleHidden(p)} className="p-2 hover:bg-muted rounded-lg transition-colors" title={p.hidden ? 'Show' : 'Hide'}>
                        {p.hidden ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <button onClick={() => openEditModal(p)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <Pencil className="h-4 w-4 text-primary" />
                      </button>
                      <button onClick={() => setConfirmDelete(p._id || '')} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {total} products
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || paginatingLoading}
                  className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || paginatingLoading}
                  className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Product Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => { setModalOpen(false); setIsDressMode(false); }}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              {/* Product Name - First Field */}
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter product name"
                />
              </div>

              {/* SKU and Barcode - Side by Side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">SKU *</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter SKU"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Barcode *</label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter Barcode"
                    required
                  />
                </div>
              </div>

              {/* Price Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="4000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="1999"
                  />
                </div>
              </div>

              {/* Colors with Image Uploads */}
              <div>
                <label className="block text-sm font-medium mb-2">Colors</label>
                <div className="space-y-3">
                  {form.colors.map((color, index) => (
                    <div key={`color-${index}`} className="border border-border rounded-lg p-3 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">Color Name</label>
                          <input
                            type="text"
                            value={color.colorName}
                            onChange={(e) => {
                              const updatedColors = form.colors.map((c, i) =>
                                i === index ? { ...c, colorName: e.target.value } : c
                              );
                              setForm({ ...form, colors: updatedColors });
                            }}
                            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Enter color name"
                          />
                        </div>
                        {!isDressMode && (
                          <div className="w-28">
                            <label className="block text-sm font-medium mb-1">Stock</label>
                            <input
                              type="text"
                              value={color.stock}
                              onChange={(e) => {
                                const updatedColors = form.colors.map((c, i) =>
                                  i === index ? { ...c, stock: e.target.value } : c
                                );
                                setForm({ ...form, colors: updatedColors });
                              }}
                              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                        )}
                        {isDressMode && (
                          <div className="w-28">
                            <label className="block text-sm font-medium mb-1">Stock</label>
                            <input
                              type="text"
                              defaultValue={calculateColorStock(color).toString()}
                              disabled={color.hasSizes}
                              className={`w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${color.hasSizes ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                              placeholder="0"
                              min="0"
                            />
                          </div>
                        )}
                        <button
                          onClick={() => removeColor(index)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Dress-specific size-wise inventory */}
                      {isDressMode && (
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <input
                              type="checkbox"
                              checked={color.hasSizes}
                              onChange={(e) => {
                                const updatedColors = form.colors.map((c, i) =>
                                  i === index ? { ...c, hasSizes: e.target.checked } : c
                                );
                                setForm({ ...form, colors: updatedColors });
                              }}
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            This product has sizes
                          </label>

                          {color.hasSizes && (
                            <div className="grid grid-cols-7 gap-2 mt-2">
                              {['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'FREE'].map((size) => (
                                <div key={size} className="flex flex-col">
                                  <label className="text-xs text-muted-foreground mb-1">{size}</label>
                                  <input
                                    type="number"
                                    value={color.sizes?.[size.toLowerCase() as keyof typeof color.sizes] || '0'}
                                    onChange={(e) => {
                                      const updatedColors = form.colors.map((c, i) =>
                                        i === index ? {
                                          ...c,
                                          sizes: {
                                            ...c.sizes,
                                            [size.toLowerCase()]: e.target.value
                                          }
                                        } : c
                                      );
                                      setForm({ ...form, colors: updatedColors });
                                    }}
                                    className="w-full border border-border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="0"
                                    min="0"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium mb-1">Upload Image</label>
                        <div className="flex items-center gap-3">
                          {Array.isArray(color.images) && color.images.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {color.images.slice(0, 4).map((img, imgIdx) => (
                                <img
                                  key={imgIdx}
                                  src={img}
                                  alt={color.colorName}
                                  className="w-16 h-16 object-cover rounded border border-border"
                                />
                              ))}
                            </div>
                          )}
                          <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80 transition-colors">
                            <Upload className="h-4 w-4" /> Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              disabled={submitting || uploadingColorIndex !== null}
                              onChange={(e) => void uploadColorImage(index, e)}
                              className="hidden"
                            />
                          </label>
                          {uploadingColorIndex === index && (
                            <div className="text-xs text-muted-foreground">Uploading: {uploadProgress}%</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addColor}
                    className="w-full px-3 py-2 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    + Add Color
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Fabric</label>
                  <input
                    type="text"
                    value={form.fabric}
                    onChange={(e) => setForm({ ...form, fabric: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter fabric type"
                  />
                </div>
                {!isDressMode && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-3">
                      <input
                        type="checkbox"
                        checked={form.hasSizes}
                        onChange={(e) => setForm({ ...form, hasSizes: e.target.checked, sizes: e.target.checked ? form.sizes : [], sizeQuantities: e.target.checked ? form.sizeQuantities : {} })}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      This product has sizes
                    </label>

                    {form.hasSizes && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Available Sizes & Quantities</label>
                        <div className="space-y-2">
                          {['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'FREE'].map((size) => (
                            <div key={size} className="flex items-center gap-3">
                              <label className="flex items-center gap-2 text-sm flex-1">
                                <input
                                  type="checkbox"
                                  checked={form.sizes.includes(size)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setForm({
                                        ...form,
                                        sizes: [...form.sizes, size],
                                        sizeQuantities: { ...form.sizeQuantities, [size]: '0' }
                                      });
                                    } else {
                                      const newSizeQuantities = { ...form.sizeQuantities };
                                      delete newSizeQuantities[size];
                                      setForm({
                                        ...form,
                                        sizes: form.sizes.filter(s => s !== size),
                                        sizeQuantities: newSizeQuantities
                                      });
                                    }
                                  }}
                                  className="rounded border-border text-primary focus:ring-primary"
                                />
                                {size}
                              </label>
                              {form.sizes.includes(size) && (
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-muted-foreground">Qty:</label>
                                  <input
                                    type="number"
                                    value={form.sizeQuantities[size] || '0'}
                                    onChange={(e) => {
                                      setForm({
                                        ...form,
                                        sizeQuantities: { ...form.sizeQuantities, [size]: e.target.value }
                                      });
                                    }}
                                    className="w-20 border border-border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="0"
                                    min="0"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="rounded-3xl border border-border bg-muted/70 p-3 text-sm text-muted-foreground">
                  Total product stock is calculated from color quantities: <span className="font-semibold text-foreground">{totalStock}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Saree Length (meters)</label>
                  <input
                    type="text"
                    value={form.sareeLength}
                    onChange={(e) => setForm({ ...form, sareeLength: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. 5.5"
                  />
                </div>
              </div>

              {!isDressMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select 
                      value={form.categoryId || form.category} 
                      onChange={(e) => {
                        const catId = e.target.value;
                        const cat = categories.find(c => c._id === catId);
                        setForm({ ...form, categoryId: catId, category: cat?.slug || catId, subcategoryId: '' });
                      }} 
                      className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subcategory</label>
                    <select 
                      value={form.subcategoryId} 
                      onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })} 
                      disabled={!form.categoryId}
                      className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm disabled:opacity-50"
                    >
                      <option value="">{form.categoryId ? 'Select Subcategory' : 'Select Category First'}</option>
                      {subcategories.filter(s => s.categoryId === form.categoryId).map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product Card Offer Text</label>
                <input
                  type="text"
                  value={form.cardOfferText}
                  onChange={(e) => setForm({ ...form, cardOfferText: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. BUY 1 GET 1"
                  maxLength={40}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={form.tags.join(', ')}
                  onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                  placeholder="Enter tags separated by commas"
                />
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      className="rounded"
                    />
                    Featured Product
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.isNew}
                      onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
                      className="rounded"
                    />
                    New Product
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.isPremium}
                      onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                      className="rounded"
                    />
                    Premium Product
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.isTrending}
                      onChange={(e) => setForm({ ...form, isTrending: e.target.checked })}
                      className="rounded"
                    />
                    Trending Product
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.isLiveSpecial}
                      onChange={(e) => setForm({ ...form, isLiveSpecial: e.target.checked })}
                      className="rounded"
                    />
                    Live Special
                  </label>
                </div>
              </div>

              {/* Limited Offer Section */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={form.isLimitedOffer}
                        onChange={(e) => setForm({ ...form, isLimitedOffer: e.target.checked, limitedStock: e.target.checked ? form.limitedStock : '', limitedOfferMessage: e.target.checked ? form.limitedOfferMessage : '' })}
                        className="rounded"
                      />
                      Limited Offer Product
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">Enable to show urgency messaging on the website</p>
                  </div>

                  {form.isLimitedOffer && (
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Limited Stock Quantity</label>
                        <input
                          type="number"
                          value={form.limitedStock}
                          onChange={(e) => setForm({ ...form, limitedStock: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="e.g. 5"
                          min="1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Number of items left for this limited offer</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Limited Offer Message</label>
                        <input
                          type="text"
                          value={form.limitedOfferMessage}
                          onChange={(e) => setForm({ ...form, limitedOfferMessage: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="e.g. Hurry! Only few left in stock!"
                          maxLength={100}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Custom urgency message (max 100 characters)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Prebooking Section */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isPrebooking}
                        onChange={(e) => setForm({ ...form, isPrebooking: e.target.checked, prebookingPrice: e.target.checked ? form.prebookingPrice : '', prebookingDeliveryDays: e.target.checked ? form.prebookingDeliveryDays : '', prebookingMessage: e.target.checked ? form.prebookingMessage : '' })}
                        className="rounded"
                      />
                      Enable Prebooking
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">Allow customers to prebook this product before it's available</p>
                  </div>

                  {form.isPrebooking && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Prebooking Price (₹)</label>
                          <input
                            type="number"
                            value={form.prebookingPrice}
                            onChange={(e) => setForm({ ...form, prebookingPrice: e.target.value })}
                            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="9999"
                            min="0"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Price for prebooking (can be same as regular price)</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Delivery Days</label>
                          <input
                            type="number"
                            value={form.prebookingDeliveryDays}
                            onChange={(e) => setForm({ ...form, prebookingDeliveryDays: e.target.value })}
                            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="10"
                            min="1"
                            max="30"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Expected delivery time in days</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Prebooking Message</label>
                        <input
                          type="text"
                          value={form.prebookingMessage}
                          onChange={(e) => setForm({ ...form, prebookingMessage: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="e.g. Exclusive prebooking - Limited availability!"
                          maxLength={100}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Custom message for prebooking (max 100 characters)</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <input
                    type="number"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0-5"
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reviews</label>
                  <input
                    type="number"
                    value={form.reviews}
                    onChange={(e) => setForm({ ...form, reviews: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setModalOpen(false); setIsDressMode(false); }} disabled={submitting} className="flex-1 btn-outline-primary text-sm py-2 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={submitting} className="flex-1 btn-primary text-sm py-2 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editing ? 'Update Product' : 'Add Product'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {detailsOpen && detailsProduct && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">Product Details</h2>
              <button
                onClick={() => {
                  setDetailsOpen(false);
                  setDetailsProduct(null);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="rounded-lg border border-border p-3 bg-muted/30">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>{' '}
                      <span className="font-medium">{detailsProduct.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Slug:</span>{' '}
                      <span className="font-medium">{detailsProduct.slug}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SKU:</span>{' '}
                      <span className="font-medium">{detailsProduct.sku || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>{' '}
                      <span className="font-medium">{detailsProduct.category || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{' '}
                      <span className="font-medium">{detailsProduct.hidden ? 'Hidden' : 'Visible'}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Sale Price</div>
                      <div className="font-semibold">₹{Number(detailsProduct.price || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Original Price</div>
                      <div className="font-semibold">₹{Number(detailsProduct.comparePrice || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Offer</div>
                      <div className="font-semibold">
                        {detailsProduct.comparePrice > detailsProduct.price
                          ? `${Math.round(((detailsProduct.comparePrice - detailsProduct.price) / detailsProduct.comparePrice) * 100)}%`
                          : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Stock</div>
                      <div className="font-semibold">{detailsProduct.stock ?? 0}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3 text-sm">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <span className="text-muted-foreground">Fabric:</span>{' '}
                      <span className="font-medium">{detailsProduct.fabric || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Has Sizes:</span>{' '}
                      <span className="font-medium">{detailsProduct.hasSizes ? 'Yes' : 'No'}</span>
                    </div>
                    {detailsProduct.hasSizes && detailsProduct.sizes && detailsProduct.sizes.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Available Sizes:</span>{' '}
                        <span className="font-medium">{detailsProduct.sizes.join(', ') || '—'}</span>
                      </div>
                    )}
                    {!detailsProduct.hasSizes && detailsProduct.size && (
                      <div>
                        <span className="text-muted-foreground">Size:</span>{' '}
                        <span className="font-medium">{detailsProduct.size || '—'}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Saree Length:</span>{' '}
                      <span className="font-medium">{detailsProduct.sareeLength || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tags:</span>{' '}
                      <span className="font-medium">{Array.isArray(detailsProduct.tags) && detailsProduct.tags.length ? detailsProduct.tags.join(', ') : '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Highlights:</span>{' '}
                      <span className="font-medium">
                        {[
                          detailsProduct.featured ? 'Featured' : null,
                          detailsProduct.isNew ? 'New' : null,
                          detailsProduct.isPremium ? 'Premium' : null,
                          detailsProduct.isTrending ? 'Trending' : null,
                          detailsProduct.isLimitedOffer ? 'Limited Offer' : null,
                          detailsProduct.isPrebooking ? 'Prebooking' : null,
                        ]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </span>
                    </div>
                    {detailsProduct.isLimitedOffer && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 mt-2">
                        <div className="text-sm font-medium text-orange-800 mb-1">Limited Offer Details</div>
                        <div className="grid grid-cols-1 gap-1 text-sm">
                          <div>
                            <span className="text-orange-600">Limited Stock:</span>{' '}
                            <span className="font-medium text-orange-800">{detailsProduct.limitedStock || '—'} items left</span>
                          </div>
                          {detailsProduct.limitedOfferMessage && (
                            <div>
                              <span className="text-orange-600">Message:</span>{' '}
                              <span className="font-medium text-orange-800">{detailsProduct.limitedOfferMessage}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {detailsProduct.isPrebooking && (
                      <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 mt-2">
                        <div className="text-sm font-medium text-purple-800 mb-1">Prebooking Details</div>
                        <div className="grid grid-cols-1 gap-1 text-sm">
                          <div>
                            <span className="text-purple-600">Prebooking Price:</span>{' '}
                            <span className="font-medium text-purple-800">₹{Number(detailsProduct.prebookingPrice || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-purple-600">Delivery Days:</span>{' '}
                            <span className="font-medium text-purple-800">{detailsProduct.prebookingDeliveryDays || '—'} days</span>
                          </div>
                          {detailsProduct.prebookingMessage && (
                            <div>
                              <span className="text-purple-600">Message:</span>{' '}
                              <span className="font-medium text-purple-800">{detailsProduct.prebookingMessage}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Rating:</span>{' '}
                      <span className="font-medium">{typeof detailsProduct.rating === 'number' ? detailsProduct.rating : '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reviews:</span>{' '}
                      <span className="font-medium">{typeof detailsProduct.reviews === 'number' ? detailsProduct.reviews : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-border p-3">
                  <div className="text-sm font-medium mb-2">Images</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(Array.isArray(detailsProduct.images) ? detailsProduct.images : [])
                      .concat(
                        (Array.isArray(detailsProduct.colors) ? detailsProduct.colors : []).flatMap((c) =>
                          Array.isArray(c.images) ? c.images : []
                        )
                      )
                      .filter(Boolean)
                      .slice(0, 12)
                      .map((img, idx) => (
                        <img
                          key={`${img}-${idx}`}
                          src={img}
                          alt={detailsProduct.name}
                          className="w-full h-24 object-cover rounded border border-border"
                        />
                      ))}
                  </div>
                  {(!detailsProduct.images || detailsProduct.images.length === 0) && (!detailsProduct.colors || detailsProduct.colors.length === 0) && (
                    <div className="text-sm text-muted-foreground">No images.</div>
                  )}
                </div>

                <div className="rounded-lg border border-border p-3">
                  <div className="text-sm font-medium mb-2">Description</div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{detailsProduct.description || '—'}</div>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <div className="text-sm font-medium mb-2">Color Variants</div>
                  <div className="space-y-2">
                    {(Array.isArray(detailsProduct.colors) ? detailsProduct.colors : []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">No color variants.</div>
                    ) : (
                      (detailsProduct.colors || []).map((c, idx) => (
                        <div key={`${c.colorName}-${idx}`} className="rounded-lg border border-border p-3 text-sm">
                          <div className="font-medium mb-2">{c.colorName || '—'}</div>
                          {c.hasSizes && c.sizes ? (
                            <div className="space-y-1">
                              {Object.entries(c.sizes).map(([size, stock]) => (
                                stock > 0 && (
                                  <div key={size} className="flex items-center justify-between gap-3 pl-2 text-muted-foreground">
                                    <span className="uppercase">{size}</span>
                                    <span>Stock: <span className="font-medium text-foreground">{stock}</span></span>
                                  </div>
                                )
                              ))}
                            </div>
                          ) : (
                            <div className="text-muted-foreground">Stock: <span className="font-medium text-foreground">{c.stock ?? 0}</span></div>
                          )}
                          {Array.isArray(c.images) && c.images.length > 0 && (
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {c.images.slice(0, 6).map((img, imgIdx) => (
                                <img
                                  key={`${img}-${imgIdx}`}
                                  src={img}
                                  alt={c.colorName}
                                  className="w-16 h-16 object-cover rounded border border-border"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                onClick={() => {
                  setDetailsOpen(false);
                  setDetailsProduct(null);
                }}
                className="btn-outline-primary text-sm py-2 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-sm border border-border text-center">
            <h3 className="font-display text-lg font-semibold mb-2">Delete Product?</h3>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} disabled={Boolean(deletingId)} className="flex-1 btn-outline-primary text-sm py-2 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={Boolean(deletingId)} className="flex-1 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2">
                {deletingId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subcategory Modal */}
      {addSubcategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Add Subcategory</h2>
              <button onClick={() => setAddSubcategoryModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <select 
                  value={subForm.categoryId}
                  onChange={(e) => setSubForm({ ...subForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Category</option>
                  {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subcategory Name *</label>
                <input 
                  value={subForm.name}
                  onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                  placeholder="e.g. Shirts" 
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  value={subForm.description}
                  onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                  placeholder="Optional description..." 
                  rows={3} 
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary resize-none" 
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input 
                    type="checkbox" 
                    checked={subForm.status}
                    onChange={(e) => setSubForm({ ...subForm, status: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" 
                  />
                  Active Status
                </label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setAddSubcategoryModalOpen(false)} className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted font-medium">Cancel</button>
                  <button 
                    type="button" 
                    disabled={submittingSub || !subForm.categoryId || !subForm.name}
                    onClick={async () => {
                      setSubmittingSub(true);
                      try {
                        const res = await fetch('/api/admin/subcategories', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', authorization: 'Bearer admin-token' },
                          body: JSON.stringify(subForm)
                        });
                        if (res.ok) {
                          toast({ title: 'Success', description: 'Subcategory added successfully' });
                          setAddSubcategoryModalOpen(false);
                          setSubForm({ name: '', categoryId: '', description: '', status: true });
                          fetchData(false); // Reload subcategories
                        } else {
                          const err = await res.json();
                          toast({ title: 'Error', description: err.error, variant: 'destructive' });
                        }
                      } catch (e) {
                        toast({ title: 'Error', description: 'Failed to add subcategory', variant: 'destructive' });
                      } finally {
                        setSubmittingSub(false);
                      }
                    }}
                    className="btn-primary px-6 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingSub ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminProducts;
