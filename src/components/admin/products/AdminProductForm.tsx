"use client";

import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trash2, UploadCloud, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AdminProduct } from '@/types/product';

const productSchema = z.object({
  name: z.string().min(1, 'Product Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  brand: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().min(1, 'Subcategory is required'),
  originalPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0, 'Selling Price is required'),
  costPrice: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  gst: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  lowStockAlert: z.number().min(0).optional(),
  variants: z.array(z.object({
    id: z.string().optional(),
    size: z.string().optional(),
    color: z.string().optional(),
    fabric: z.string().optional(),
    material: z.string().optional(),
    price: z.number().optional(),
    stock: z.number().optional(),
    sku: z.string().optional(),
    image: z.string().optional(),
  })).optional(),
  featuredImage: z.string().min(1, 'Featured Image is required'),
  images: z.array(z.string()).optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  labels: z.object({
    isFeatured: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    isTrending: z.boolean().optional(),
    isRecommended: z.boolean().optional(),
  }).optional(),
  status: z.enum(['draft', 'published', 'hidden']),
  slug: z.string().optional(),
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Props {
  onClose: () => void;
  initialData?: AdminProduct;
}

export default function AdminProductForm({ onClose, initialData }: Props) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      sku: initialData?.sku || '',
      brand: initialData?.brand || '',
      categoryId: initialData?.categoryId || (initialData as any)?.category || '',
      subcategoryId: initialData?.subcategoryId || '',
      originalPrice: initialData?.mrp || (initialData as any)?.comparePrice || 0,
      sellingPrice: initialData?.sellingPrice || (initialData as any)?.price || 0,
      costPrice: initialData?.costPrice || 0,
      discount: initialData?.discountValue || 0,
      gst: initialData?.taxPercent || 0,
      stock: initialData?.stock || 0,
      lowStockAlert: initialData?.lowStockAlert || 0,
      variants: initialData?.variants || [],
      featuredImage: initialData?.featuredImage || initialData?.images?.[0] || '',
      images: initialData?.images || [],
      shortDescription: initialData?.shortDescription || '',
      description: initialData?.description || '',
      labels: initialData?.labels || {
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false,
        isTrending: false,
        isRecommended: false,
      },
      status: initialData?.status || 'draft',
      slug: initialData?.slug || '',
      seoTitle: initialData?.seoTitle || '',
      metaDescription: initialData?.metaDescription || '',
    }
  });

  const { fields: variants, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants"
  });

  const watchCategoryId = watch('categoryId');
  const watchImages = watch('images') || [];
  const watchFeaturedImage = watch('featuredImage');
  const watchName = watch('name');

  // Auto-generate slug from name if empty
  useEffect(() => {
    if (watchName && !watch('slug')) {
      setValue('slug', watchName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  }, [watchName, setValue, watch]);

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await fetch('/api/admin/categories', { headers: { authorization: 'Bearer admin-token' } });
      const json = await res.json();
      return json.data.filter((c: any) => c.status !== false);
    }
  });

  // Fetch Subcategories
  const { data: subcategories, isLoading: isSubcatsLoading } = useQuery({
    queryKey: ['admin-subcategories', watchCategoryId],
    queryFn: async () => {
      if (!watchCategoryId) return [];
      const res = await fetch('/api/admin/subcategories', { headers: { authorization: 'Bearer admin-token' } });
      const json = await res.json();
      return json.data.filter((s: any) => s.categoryId === watchCategoryId && s.status !== false);
    },
    enabled: !!watchCategoryId
  });

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (base64) {
          const currentImages = watch('images') || [];
          const newImages = [...currentImages, base64];
          setValue('images', newImages);
          if (!watch('featuredImage')) {
            setValue('featuredImage', base64, { shouldValidate: true });
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, [setValue, watch]);

  const removeImage = (index: number) => {
    const currentImages = [...(watch('images') || [])];
    const removedUrl = currentImages[index];
    currentImages.splice(index, 1);
    
    if (watch('featuredImage') === removedUrl) {
      setValue('featuredImage', currentImages[0] || '', { shouldValidate: true });
    }
    
    setValue('images', currentImages);
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const url = initialData?._id ? `/api/admin/products/${initialData._id}` : '/api/admin/products';
      const method = initialData?._id ? 'PUT' : 'POST';
      
      const payload = {
        ...data,
        mrp: data.originalPrice,
        taxPercent: data.gst,
        discountValue: data.discount
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', authorization: 'Bearer admin-token' },
        body: JSON.stringify(payload)
      });
      
      const responseData = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: "Product saved successfully" });
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        onClose();
      } else {
        toast({ title: "Error", description: responseData.error || "Failed to save product", variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error occurred", variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-border">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/10 sticky top-0 z-10">
          <h2 className="text-xl font-bold">{initialData ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <form id="productForm" onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
            
            {/* Basic Info */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Basic Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Product Name *</label>
                  <input {...register('name')} placeholder="e.g. Elegant Silk Saree" className={`w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary ${errors.name ? 'border-destructive' : 'border-border'}`} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU *</label>
                  <div className="flex gap-2">
                    <input {...register('sku')} placeholder="SKU-123" className={`flex-1 px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary ${errors.sku ? 'border-destructive' : 'border-border'}`} />
                    <button type="button" onClick={() => setValue('sku', `SKU-${Math.floor(1000 + Math.random() * 9000)}`, { shouldValidate: true })} className="px-3 py-2 bg-muted text-muted-foreground rounded-md text-sm hover:bg-muted/80">Generate</button>
                  </div>
                  {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Brand</label>
                  <input {...register('brand')} placeholder="Brand Name" className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </section>

            {/* Categories */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <select {...register('categoryId')} onChange={(e) => { setValue('categoryId', e.target.value); setValue('subcategoryId', ''); }} className={`w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary ${errors.categoryId ? 'border-destructive' : 'border-border'}`}>
                    <option value="">Select Category</option>
                    {categories?.map((cat: any) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
                  {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subcategory *</label>
                  <select {...register('subcategoryId')} disabled={!watchCategoryId || isSubcatsLoading} className={`w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary disabled:opacity-50 ${errors.subcategoryId ? 'border-destructive' : 'border-border'}`}>
                    <option value="">{watchCategoryId ? 'Select Subcategory' : 'Select Category First'}</option>
                    {subcategories?.map((sub: any) => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
                  </select>
                  {errors.subcategoryId && <p className="text-xs text-destructive">{errors.subcategoryId.message}</p>}
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Pricing</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Selling Price *</label>
                  <input type="number" {...register('sellingPrice', { valueAsNumber: true })} className={`w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary ${errors.sellingPrice ? 'border-destructive' : 'border-border'}`} />
                  {errors.sellingPrice && <p className="text-xs text-destructive">{errors.sellingPrice.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Original Price</label>
                  <input type="number" {...register('originalPrice', { valueAsNumber: true })} className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Cost Price</label>
                  <input type="number" {...register('costPrice', { valueAsNumber: true })} className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">GST %</label>
                  <input type="number" {...register('gst', { valueAsNumber: true })} className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </section>

            {/* Inventory */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Inventory</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Quantity</label>
                  <input type="number" {...register('stock', { valueAsNumber: true })} className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Low Stock Alert</label>
                  <input type="number" {...register('lowStockAlert', { valueAsNumber: true })} className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </section>

            {/* Images */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider flex justify-between items-center">
                <span>Product Images *</span>
                {errors.featuredImage && <span className="text-xs text-destructive normal-case">{errors.featuredImage.message}</span>}
              </h3>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : errors.featuredImage ? 'border-destructive bg-destructive/5' : 'border-border hover:border-primary/50 bg-muted/10'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={onDrop}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Drag & drop your images here</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WEBP (Max 5MB each)</p>
                  </div>
                  <div className="relative mt-2">
                    <input 
                      type="file" multiple accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => { if (e.target.files) processFiles(Array.from(e.target.files)); }}
                    />
                    <button type="button" className="btn-secondary text-sm px-4 py-2 pointer-events-none">Browse Files</button>
                  </div>
                </div>
              </div>

              {watchImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                  {watchImages.map((img, idx) => (
                    <div key={idx} className={`relative group rounded-lg overflow-hidden border-2 ${watchFeaturedImage === img ? 'border-primary' : 'border-transparent hover:border-border'}`}>
                      <img src={img} alt={`Upload ${idx}`} className="w-full h-24 object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                        <div className="flex justify-end">
                          <button type="button" onClick={() => removeImage(idx)} className="p-1 bg-destructive text-white rounded hover:bg-destructive/90">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {watchFeaturedImage !== img && (
                          <button type="button" onClick={() => setValue('featuredImage', img, { shouldValidate: true })} className="text-[10px] bg-primary text-primary-foreground px-1.5 py-1 rounded shadow text-center">
                            Set Featured
                          </button>
                        )}
                      </div>
                      {watchFeaturedImage === img && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shadow">
                          Featured
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Variants */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Variants</h3>
                <button type="button" onClick={() => appendVariant({ size: '', color: '', price: 0, stock: 0 })} className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-md flex items-center gap-1 font-medium transition-colors border border-border">
                  <Plus className="w-3 h-3" /> Add Variant
                </button>
              </div>
              
              {variants.length > 0 && (
                <div className="space-y-3">
                  {variants.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-3 p-3 bg-muted/20 border border-border rounded-lg relative group items-start">
                      <div className="col-span-6 sm:col-span-3 space-y-1.5">
                        <label className="text-[10px] uppercase font-semibold text-muted-foreground">Size</label>
                        <input {...register(`variants.${index}.size`)} placeholder="e.g. L" className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background" />
                      </div>
                      <div className="col-span-6 sm:col-span-3 space-y-1.5">
                        <label className="text-[10px] uppercase font-semibold text-muted-foreground">Color</label>
                        <input {...register(`variants.${index}.color`)} placeholder="e.g. Red" className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background" />
                      </div>
                      <div className="col-span-4 sm:col-span-2 space-y-1.5">
                        <label className="text-[10px] uppercase font-semibold text-muted-foreground">Price</label>
                        <input type="number" {...register(`variants.${index}.price`, { valueAsNumber: true })} placeholder="0" className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background" />
                      </div>
                      <div className="col-span-4 sm:col-span-2 space-y-1.5">
                        <label className="text-[10px] uppercase font-semibold text-muted-foreground">Stock</label>
                        <input type="number" {...register(`variants.${index}.stock`, { valueAsNumber: true })} placeholder="0" className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background" />
                      </div>
                      <div className="col-span-2 flex justify-end items-end pb-1.5">
                        <button type="button" onClick={() => removeVariant(index)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Description */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Description</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Short Description</label>
                  <textarea {...register('shortDescription')} rows={2} className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Description</label>
                  <textarea {...register('description')} rows={5} className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </section>

            {/* Labels & Status */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Product Options</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                <div className="space-y-3">
                  <label className="text-sm font-medium">Status</label>
                  <select {...register('status')} className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium block">Labels</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['isFeatured', 'isNewArrival', 'isBestSeller', 'isTrending'].map((label) => (
                      <label key={label} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded -ml-1.5 transition-colors">
                        <input type="checkbox" {...register(`labels.${label}` as any)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                        {label.replace('is', '').replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

          </form>
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/10 sticky bottom-0 z-10">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 border border-border rounded-md hover:bg-muted font-medium text-sm transition-colors">
            Cancel
          </button>
          <button type="submit" form="productForm" disabled={isSubmitting} className="btn-primary flex items-center gap-2 text-sm px-6 py-2 shadow-sm">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {initialData ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>

      {/* Background overlay click to close */}
      <div className="absolute inset-0 z-[-1]" onClick={onClose} />
    </div>
  );
}
