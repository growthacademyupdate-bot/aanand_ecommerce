"use client";

import { useState, useEffect } from "react";
import { X, Upload, Loader2, Plus, Trash2 } from "lucide-react";
import { uploadToR2 } from "@/lib/r2Upload";
import { toast } from "@/hooks/use-toast";

interface DbCategory {
  _id?: string;
  name: string;
  slug: string;
}

interface DbSubcategory {
  _id?: string;
  name: string;
  categoryId: string;
}

interface ColorVariant {
  id: string;
  colorName: string;
  stock: string;
  image: string;
  hasSizes: boolean;
  sizes: {
    S: string;
    M: string;
    L: string;
    XL: string;
    XXL: string;
    XXXL: string;
    FREE: string;
  };
}

interface VariantProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DbCategory[];
  subcategories: DbSubcategory[];
  onSuccess: () => void;
  initialData?: any;
}

export default function VariantProductModal({
  isOpen,
  onClose,
  categories,
  subcategories,
  onSuccess,
  initialData,
}: VariantProductModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    subcategoryId: "",
    brand: "",
    sku: "",
    barcode: "",
    originalPrice: "",
    sellingPrice: "",
    wholesalePrice: "",
    moq: "",
    description: "",
    fabric: "",
    sareeLength: "",
    cardOfferText: "",
    tags: "",
    featured: false,
    isNew: false,
    isPremium: false,
    isTrending: false,
    isLiveSpecial: false,
    isLimitedOffer: false,
    limitedStock: "",
    limitedOfferMessage: "",
    isPrebooking: false,
    prebookingPrice: "",
    prebookingDeliveryDays: "",
    prebookingMessage: "",
    rating: "",
    reviews: "",
  });

  const [colors, setColors] = useState<ColorVariant[]>([
    {
      id: "col_" + Date.now(),
      colorName: "",
      stock: "0",
      image: "",
      hasSizes: false,
      sizes: {
        S: "0",
        M: "0",
        L: "0",
        XL: "0",
        XXL: "0",
        XXXL: "0",
        FREE: "0",
      },
    },
  ]);

  useEffect(() => {
    if (isOpen && initialData) {
      setForm({
        name: initialData.name || "",
        categoryId: initialData.categoryId || initialData.category || "",
        subcategoryId: initialData.subcategoryId || "",
        brand: initialData.brand || "",
        sku: initialData.sku || "",
        barcode: initialData.barcode || "",
        originalPrice: initialData.comparePrice?.toString() || "",
        sellingPrice: (initialData.price ?? initialData.basePrice ?? "").toString(),
        wholesalePrice: initialData.wholesalePrice?.toString() || "",
        moq: initialData.moq?.toString() || "",
        description: initialData.description || "",
        fabric: initialData.fabric || "",
        sareeLength: initialData.sareeLength || "",
        cardOfferText: initialData.cardOfferText || "",
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(", ") : (initialData.tags || ""),
        featured: initialData.featured || false,
        isNew: initialData.isNew || false,
        isPremium: initialData.isPremium || false,
        isTrending: initialData.isTrending || false,
        isLiveSpecial: initialData.isLiveSpecial || false,
        isLimitedOffer: initialData.isLimitedOffer || false,
        limitedStock: initialData.limitedStock?.toString() || "",
        limitedOfferMessage: initialData.limitedOfferMessage || "",
        isPrebooking: initialData.isPrebooking || false,
        prebookingPrice: initialData.prebookingPrice?.toString() || "",
        prebookingDeliveryDays: initialData.prebookingDeliveryDays?.toString() || "",
        prebookingMessage: initialData.prebookingMessage || "",
        rating: initialData.rating?.toString() || "",
        reviews: initialData.reviews?.toString() || "",
      });
      if (Array.isArray(initialData.colors) && initialData.colors.length > 0) {
        setColors(initialData.colors.map((c: any, idx: number) => ({
          id: `col_${Date.now()}_${idx}`,
          colorName: c.colorName || "",
          stock: c.stock?.toString() || "0",
          image: c.colorImage || c.images?.[0] || "",
          hasSizes: c.hasSizes || false,
          sizes: {
            S: c.sizes?.s?.toString() || c.sizes?.S?.toString() || "0",
            M: c.sizes?.m?.toString() || c.sizes?.M?.toString() || "0",
            L: c.sizes?.l?.toString() || c.sizes?.L?.toString() || "0",
            XL: c.sizes?.xl?.toString() || c.sizes?.XL?.toString() || "0",
            XXL: c.sizes?.xxl?.toString() || c.sizes?.XXL?.toString() || "0",
            XXXL: c.sizes?.xxxl?.toString() || c.sizes?.XXXL?.toString() || "0",
            FREE: c.sizes?.free?.toString() || c.sizes?.FREE?.toString() || "0",
          }
        })));
      } else {
        setColors([{
          id: "col_" + Date.now(),
          colorName: "",
          stock: "0",
          image: "",
          hasSizes: false,
          sizes: { S: "0", M: "0", L: "0", XL: "0", XXL: "0", XXXL: "0", FREE: "0" },
        }]);
      }
    } else if (isOpen && !initialData) {
      setForm({
        name: "",
        categoryId: "",
        subcategoryId: "",
        brand: "",
        sku: "",
        barcode: "",
        originalPrice: "",
        sellingPrice: "",
        wholesalePrice: "",
        moq: "",
        description: "",
        fabric: "",
        sareeLength: "",
        cardOfferText: "",
        tags: "",
        featured: false,
        isNew: false,
        isPremium: false,
        isTrending: false,
        isLiveSpecial: false,
        isLimitedOffer: false,
        limitedStock: "",
        limitedOfferMessage: "",
        isPrebooking: false,
        prebookingPrice: "",
        prebookingDeliveryDays: "",
        prebookingMessage: "",
        rating: "",
        reviews: "",
      });
      setColors([
        {
          id: "col_" + Date.now(),
          colorName: "",
          stock: "0",
          image: "",
          hasSizes: false,
          sizes: {
            S: "0",
            M: "0",
            L: "0",
            XL: "0",
            XXL: "0",
            XXXL: "0",
            FREE: "0",
          },
        },
      ]);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAddColor = () => {
    setColors([
      ...colors,
      {
        id: "col_" + Date.now() + Math.random(),
        colorName: "",
        stock: "0",
        image: "",
        hasSizes: false,
        sizes: { S: "0", M: "0", L: "0", XL: "0", XXL: "0", XXXL: "0", FREE: "0" },
      },
    ]);
  };

  const handleRemoveColor = (id: string) => {
    if (colors.length === 1) {
      toast({ title: "At least one color is required", variant: "destructive" });
      return;
    }
    setColors(colors.filter((c) => c.id !== id));
  };

  const handleUpdateColor = (id: string, field: keyof ColorVariant, value: any) => {
    setColors((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, [field]: value };
        }
        return c;
      })
    );
  };

  const handleUpdateColorSize = (id: string, sizeName: string, value: string) => {
    setColors((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, sizes: { ...c.sizes, [sizeName]: value } };
        }
        return c;
      })
    );
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVariantIndex(index);
    try {
      const url = await uploadToR2(file, {
        folder: "variants",
        maxBytes: 10 * 1024 * 1024,
      });
      setColors((prev) =>
        prev.map((c, i) => (i === index ? { ...c, image: url } : c))
      );
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Image upload failed", variant: "destructive" });
    } finally {
      setUploadingVariantIndex(null);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.categoryId || !form.sku || !form.sellingPrice) {
      toast({ title: "Please fill basic required fields (Name, Category, SKU, Sale Price)", variant: "destructive" });
      return;
    }

    const invalidColor = colors.find((c) => !c.colorName);
    if (invalidColor) {
      toast({ title: "Each color must have a name", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const cat = categories.find((c) => c._id === form.categoryId);

      let totalStock = 0;
      const formattedColors = colors.map((c) => {
        let colorStock = 0;
        let formattedSizes: Record<string, number> | undefined = undefined;

        if (c.hasSizes) {
          formattedSizes = {};
          for (const [size, qty] of Object.entries(c.sizes)) {
            const numQty = Number(qty) || 0;
            formattedSizes[size] = numQty;
            colorStock += numQty;
          }
        } else {
          colorStock = Number(c.stock) || 0;
        }

        totalStock += colorStock;

        return {
          colorName: c.colorName,
          stock: colorStock,
          images: c.image ? [c.image] : [],
          sizes: formattedSizes,
        };
      });
      
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        limitedStock: Number(form.limitedStock) || undefined,
        prebookingPrice: Number(form.prebookingPrice) || undefined,
        prebookingDeliveryDays: Number(form.prebookingDeliveryDays) || undefined,
        rating: Number(form.rating) || 0,
        reviews: Number(form.reviews) || 0,
        productType: "variant",
        category: cat?.slug || "",
        price: Number(form.sellingPrice),
        comparePrice: Number(form.originalPrice) || undefined,
        wholesalePrice: Number(form.wholesalePrice) || undefined,
        moq: Number(form.moq) || undefined,
        stock: totalStock,
        colors: formattedColors,
        hasSizes: colors.some(c => c.hasSizes),
        status: "published",
        hidden: false,
      };

      const method = initialData ? "PUT" : "POST";
      const url = initialData ? `/api/admin/products/${initialData._id}` : "/api/admin/products";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer admin-token",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        toast({ title: initialData ? "Variant product updated successfully" : "Variant product added successfully" });
        onSuccess();
        onClose();
      } else {
        toast({ title: result.error || "Failed to add product", variant: "destructive" });
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Failed to add product", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between mb-6 border-b pb-3 sticky top-0 bg-card z-10">
          <h2 className="font-display text-xl font-semibold">{initialData ? "Edit Variant Product" : "Add Variant Product"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Basic Information Section */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium border-b border-border pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter product name"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">SKU *</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="Enter SKU"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Barcode *</label>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="Enter Barcode"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Original Price (₹)</label>
                <input
                  type="number"
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                  placeholder="e.g. 4000"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sale Price (₹)</label>
                <input
                  type="number"
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                  placeholder="e.g. 1999"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-primary">Wholesale Price (₹)</label>
                <input
                  type="number"
                  value={form.wholesalePrice}
                  onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })}
                  className="w-full border border-primary/30 rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-primary">MOQ (Min Qty)</label>
                <input
                  type="number"
                  value={form.moq}
                  onChange={(e) => setForm({ ...form, moq: e.target.value })}
                  className="w-full border border-primary/30 rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Optional"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value, subcategoryId: "" })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
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
                  <option value="">{form.categoryId ? "Select Subcategory" : "Select Category First"}</option>
                  {subcategories.filter((s) => s.categoryId === form.categoryId).map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

            </div>
          </section>

          {/* Additional Details Section */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium border-b border-border pb-2">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fabric</label>
                <input
                  type="text"
                  value={form.fabric}
                  onChange={(e) => setForm({ ...form, fabric: e.target.value })}
                  placeholder="e.g. Cotton, Silk"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Saree Length (meters)</label>
                <input
                  type="text"
                  value={form.sareeLength}
                  onChange={(e) => setForm({ ...form, sareeLength: e.target.value })}
                  placeholder="e.g. 5.5"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Product Card Offer Text</label>
                <input
                  type="text"
                  value={form.cardOfferText}
                  onChange={(e) => setForm({ ...form, cardOfferText: e.target.value })}
                  placeholder="e.g. BUY 1 GET 1"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="Enter tags separated by comma"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  Featured Product
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.isNew}
                    onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  New Product
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.isPremium}
                    onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  Premium Product
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.isTrending}
                    onChange={(e) => setForm({ ...form, isTrending: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  Trending Product
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.isLiveSpecial}
                    onChange={(e) => setForm({ ...form, isLiveSpecial: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  Live Special
                </label>
              </div>

              <div className="md:col-span-2 border border-border rounded-lg p-4 space-y-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.isLimitedOffer}
                    onChange={(e) => setForm({ ...form, isLimitedOffer: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  Limited Offer Product
                </label>
                {form.isLimitedOffer && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-xs font-medium mb-1">Limited Stock Quantity</label>
                      <input
                        type="number"
                        value={form.limitedStock}
                        onChange={(e) => setForm({ ...form, limitedStock: e.target.value })}
                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Offer Message</label>
                      <input
                        type="text"
                        value={form.limitedOfferMessage}
                        onChange={(e) => setForm({ ...form, limitedOfferMessage: e.target.value })}
                        placeholder="e.g. Only 5 left!"
                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 border border-border rounded-lg p-4 space-y-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.isPrebooking}
                    onChange={(e) => setForm({ ...form, isPrebooking: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  Enable Prebooking
                </label>
                {form.isPrebooking && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-xs font-medium mb-1">Prebooking Price</label>
                      <input
                        type="number"
                        value={form.prebookingPrice}
                        onChange={(e) => setForm({ ...form, prebookingPrice: e.target.value })}
                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Delivery Days</label>
                      <input
                        type="number"
                        value={form.prebookingDeliveryDays}
                        onChange={(e) => setForm({ ...form, prebookingDeliveryDays: e.target.value })}
                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium mb-1">Prebooking Message</label>
                      <input
                        type="text"
                        value={form.prebookingMessage}
                        onChange={(e) => setForm({ ...form, prebookingMessage: e.target.value })}
                        placeholder="e.g. Dispatch in 15 days"
                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  placeholder="0.0"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reviews</label>
                <input
                  type="number"
                  value={form.reviews}
                  onChange={(e) => setForm({ ...form, reviews: e.target.value })}
                  placeholder="0"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </section>

          {/* Colors Section */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium border-b border-border pb-2">Colors</h3>
            <div className="space-y-6">
              {colors.map((color, index) => (
                <div key={color.id} className="border border-border rounded-lg p-4 relative">
                  <button
                    onClick={() => handleRemoveColor(color.id)}
                    className="absolute right-2 top-2 text-red-500 hover:text-red-700 bg-white rounded-full p-0.5"
                    title="Remove Color"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Color Name</label>
                      <input
                        type="text"
                        value={color.colorName}
                        onChange={(e) => handleUpdateColor(color.id, "colorName", e.target.value)}
                        placeholder="Enter color name"
                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Stock</label>
                      <input
                        type="number"
                        value={color.stock}
                        onChange={(e) => handleUpdateColor(color.id, "stock", e.target.value)}
                        disabled={color.hasSizes}
                        className="w-32 border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={color.hasSizes}
                        onChange={(e) => handleUpdateColor(color.id, "hasSizes", e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      This product has sizes.
                    </label>
                  </div>

                  {color.hasSizes && (
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {["S", "M", "L", "XL", "XXL", "XXXL", "FREE"].map((s) => (
                        <div key={s}>
                          <label className="block text-[10px] text-muted-foreground font-medium mb-1">{s}</label>
                          <input
                            type="number"
                            value={color.sizes[s as keyof typeof color.sizes]}
                            onChange={(e) => handleUpdateColorSize(color.id, s, e.target.value)}
                            className="w-full border border-border rounded px-2 py-1 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1">Upload Image</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm cursor-pointer hover:bg-muted/80 transition-colors">
                        {uploadingVariantIndex === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploadingVariantIndex === index ? "Uploading..." : "Upload image"}
                        <input type="file" accept="image/*" disabled={uploadingVariantIndex === index || submitting} onChange={(e) => handleImageUpload(index, e)} className="hidden" />
                      </label>
                      {color.image && (
                        <img src={color.image} alt="Color" className="w-10 h-10 object-cover rounded border border-border" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <button onClick={handleAddColor} className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> Add Color
              </button>
            </div>
          </section>

          <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground">
            Total product stock is calculated from color quantities: <strong className="text-foreground">{colors.reduce((sum, c) => {
              if (c.hasSizes) {
                return sum + Object.values(c.sizes).reduce((s, val) => s + (Number(val) || 0), 0);
              }
              return sum + (Number(c.stock) || 0);
            }, 0)}</strong>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border mt-6">
            <button onClick={onClose} disabled={submitting} className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={submitting || uploadingVariantIndex !== null} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Add Product"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
