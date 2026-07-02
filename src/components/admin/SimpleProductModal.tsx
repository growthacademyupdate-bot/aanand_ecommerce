"use client";

import { useState, useEffect } from "react";
import { X, Upload, Loader2 } from "lucide-react";
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

interface SimpleProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DbCategory[];
  subcategories: DbSubcategory[];
  onSuccess: () => void;
  initialData?: any;
}

export default function SimpleProductModal({
  isOpen,
  onClose,
  categories,
  subcategories,
  onSuccess,
  initialData,
}: SimpleProductModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    discount: "",
    stock: "",
    image: "",
    description: "",
    status: "published",
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
        discount: "",
        stock: initialData.stock?.toString() || "",
        image: initialData.images?.[0] || "",
        description: initialData.description || "",
        status: initialData.hidden ? "hidden" : "published",
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
        discount: "",
        stock: "",
        image: "",
        description: "",
        status: "published",
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
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToR2(file, {
        folder: "products",
        maxBytes: 10 * 1024 * 1024,
      });
      setForm((prev) => ({ ...prev, image: url }));
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Image upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.sellingPrice || !form.categoryId) {
      toast({ title: "Please fill required fields (Name, SKU, Price, Category)", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const cat = categories.find(c => c._id === form.categoryId);
      
      const payload = {
        ...form,
        productType: "simple",
        category: cat?.slug || "",
        price: Number(form.sellingPrice),
        comparePrice: Number(form.originalPrice) || undefined,
        wholesalePrice: Number(form.wholesalePrice) || undefined,
        moq: Number(form.moq) || undefined,
        stock: Number(form.stock) || 0,
        images: form.image ? [form.image] : [],
        // Convert local status to existing hidden flag
        hidden: form.status === "hidden",
        isNew: form.isNew,
        fabric: form.fabric,
        sareeLength: form.sareeLength,
        cardOfferText: form.cardOfferText,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        isPremium: form.isPremium,
        isTrending: form.isTrending,
        isLiveSpecial: form.isLiveSpecial,
        isLimitedOffer: form.isLimitedOffer,
        limitedStock: Number(form.limitedStock) || 0,
        limitedOfferMessage: form.limitedOfferMessage,
        isPrebooking: form.isPrebooking,
        prebookingPrice: Number(form.prebookingPrice) || 0,
        prebookingDeliveryDays: Number(form.prebookingDeliveryDays) || 0,
        prebookingMessage: form.prebookingMessage,
        rating: Number(form.rating) || 0,
        reviews: Number(form.reviews) || 0,
        barcode: form.barcode,
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
        toast({ title: initialData ? "Simple product updated successfully" : "Simple product added successfully" });
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
      <div className="bg-card rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between mb-6 border-b pb-3 sticky top-0 bg-card z-10">
          <h2 className="font-display text-xl font-semibold">{initialData ? "Edit Simple Product" : "Add Simple Product"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Product Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU *</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Barcode</label>
              <input
                type="text"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
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
                {subcategories
                  .filter((s) => s.categoryId === form.categoryId)
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Quantity</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Original Price</label>
              <input
                type="number"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Selling Price *</label>
              <input
                type="number"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">Wholesale Price</label>
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Product Image</label>
            <div className="flex items-center gap-4">
              {form.image && (
                <img src={form.image} alt="Product" className="w-20 h-20 object-cover rounded-lg border border-border" />
              )}
              <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80 transition-colors">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading..." : "Upload Image"}
                <input type="file" accept="image/*" disabled={uploading || submitting} onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

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

          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-1.5 bg-background text-sm"
              >
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border mt-6">
            <button onClick={onClose} disabled={submitting} className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={submitting || uploading} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Simple Product"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
