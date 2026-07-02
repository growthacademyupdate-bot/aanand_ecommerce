"use client";

import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, ShoppingCart, ChevronDown, Search } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface OrderRow {
  id: string;
  productId: string;
  color: string;
  size: string;
  quantity: number;
}

const ProductSelect = ({ 
  value, 
  onChange, 
  products 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  products: any[] 
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectedProduct = products.find(p => p.id === value);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-border/60 hover:border-primary/50 rounded-lg px-3 py-2 text-sm bg-background flex items-center justify-between transition-colors shadow-sm"
      >
        {selectedProduct ? (
           <div className="flex items-center gap-2 overflow-hidden">
             <img src={selectedProduct.images?.[0] || '/placeholder.svg'} alt="" className="w-6 h-6 object-cover rounded bg-muted" />
             <span className="truncate font-medium">{selectedProduct.name}</span>
           </div>
        ) : (
           <span className="text-muted-foreground">Select a product...</span>
        )}
        <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-lg shadow-xl overflow-hidden flex flex-col w-full sm:w-[400px]">
            <div className="p-2 border-b bg-muted/20">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search products..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-md bg-background border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No products found.</div>
              ) : (
                filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    className="p-2.5 hover:bg-muted/50 cursor-pointer flex items-center gap-3 border-b last:border-b-0 transition-colors"
                    onClick={() => {
                       onChange(p.id);
                       setOpen(false);
                       setSearch('');
                    }}
                  >
                    <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="w-12 h-12 object-cover rounded-md border shadow-sm bg-background" />
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs line-through text-muted-foreground">₹{p.price}</span>
                        <span className="text-xs text-primary font-bold">
                           {p.wholesalePrice ? `B2B: ₹${p.wholesalePrice}` : `₹${p.price}`}
                        </span>
                        {p.moq && (
                          <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">MOQ: {p.moq}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const QuickOrder = () => {
  const { products, addToCart, loadProducts, wholesaleEnabled, cart } = useStore();
  const router = useRouter();
  
  const [rows, setRows] = useState<OrderRow[]>([
    { id: '1', productId: '', color: '', size: '', quantity: 1 }
  ]);

  useEffect(() => {
    // Unconditionally load a large batch of products for the quick order form
    loadProducts(1, 1000);
  }, [loadProducts]);

  const handleAddRow = () => {
    setRows([...rows, { id: Date.now().toString(), productId: '', color: '', size: '', quantity: 1 }]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const handleChange = (id: string, field: keyof OrderRow, value: string | number) => {
    setRows(rows.map(r => {
      if (r.id === id) {
        // If changing product, reset color and size
        if (field === 'productId') {
          return { ...r, [field]: value, color: '', size: '' };
        }
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const handleAddAllToCart = () => {
    let addedCount = 0;
    
    rows.forEach(row => {
      if (row.productId && row.quantity > 0) {
        const product = products.find(p => p.id === row.productId);
        if (product) {
          // If product has variants, require color selection
          if (product.colors && product.colors.length > 0 && !row.color) {
            toast({ title: `Please select a color for ${product.name}`, variant: 'destructive' });
            return;
          }
          
          let variantImage = product.images[0];
          const colorVariant = (product.colors as any[])?.find((c) => c.colorName === row.color);
          
          if (colorVariant?.hasSizes && !row.size) {
            toast({ title: `Please select a size for ${product.name} (${row.color})`, variant: 'destructive' });
            return;
          }
          
          if (colorVariant?.images?.length > 0) {
            variantImage = colorVariant.images[0];
          }
          
          // Use variant color or default
          const finalColor = row.color || (product.colors?.[0] as any)?.colorName || '';

          // Add to cart
          addToCart({
            productId: product.id,
            name: product.name,
            image: variantImage,
            price: product.price,
            wholesalePrice: product.wholesalePrice,
            moq: product.moq,
            color: finalColor,
            size: row.size,
            quantity: Number(row.quantity)
          });
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      toast({ title: `Added ${addedCount} item(s) to cart!` });
      // Reset rows after adding
      setRows([{ id: Date.now().toString(), productId: '', color: '', size: '', quantity: 1 }]);
      router.push('/cart');
    } else {
      toast({ title: "Please fill out at least one product completely.", variant: 'destructive' });
    }
  };

  if (!wholesaleEnabled) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Wholesale System Not Enabled</h1>
          <p className="text-muted-foreground">The wholesale quick order form is currently disabled.</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Quick Order (B2B)</h1>
        </div>

        <div className="bg-card border rounded-2xl shadow-sm p-6 mb-8 overflow-hidden">
          <p className="text-muted-foreground mb-6">
            Quickly add multiple items to your cart. Select product, variant, and enter quantity.
          </p>

          <div className="space-y-4">
            {rows.map((row, index) => {
              const product = products.find(p => p.id === row.productId);
              const colorVariant = product?.colors?.find((c: any) => c.colorName === row.color) as any;
              
              // Only allow items with stock
              const hasSizes = colorVariant?.sizes && Object.keys(colorVariant.sizes).length > 0;
              let availableSizes: string[] = [];
              if (hasSizes && colorVariant?.sizes) {
                availableSizes = Object.entries(colorVariant.sizes)
                  .filter(([_, qty]) => Number(qty) > 0)
                  .map(([size]) => size);
              }

              return (
                <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="md:col-span-4">
                    <label className="text-xs font-medium mb-1 block text-muted-foreground">Product</label>
                    <ProductSelect
                      value={row.productId}
                      onChange={(val) => handleChange(row.id, 'productId', val)}
                      products={products}
                    />
                  </div>
                  
                  <div className="md:col-span-3">
                    <label className="text-xs font-medium mb-1 block text-muted-foreground">Color Variant</label>
                    <select
                      value={row.color}
                      onChange={(e) => handleChange(row.id, 'color', e.target.value)}
                      disabled={!product || !product.colors || product.colors.length === 0}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background disabled:opacity-50"
                    >
                      <option value="">Select color...</option>
                      {product?.colors?.map((c: any) => (
                        <option key={c.colorName} value={c.colorName}>{c.colorName} (Stock: {c.stock})</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-medium mb-1 block text-muted-foreground">Size</label>
                    <select
                      value={row.size}
                      onChange={(e) => handleChange(row.id, 'size', e.target.value)}
                      disabled={!hasSizes}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background disabled:opacity-50"
                    >
                      <option value="">Select size...</option>
                      {availableSizes.map((size) => (
                        <option key={size} value={size}>{size.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-medium mb-1 block text-muted-foreground">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={row.quantity || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange(row.id, 'quantity', val === '' ? '' : parseInt(val, 10));
                      }}
                      onBlur={(e) => {
                        if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                          handleChange(row.id, 'quantity', 1);
                        }
                      }}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-end mt-4 md:mt-0 pt-5">
                    <button
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={rows.length === 1}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 items-center justify-between border-t pt-6">
            <button
              onClick={handleAddRow}
              className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add another product
            </button>

            <button
              onClick={handleAddAllToCart}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-medium transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20"
            >
              <ShoppingCart className="w-5 h-5" />
              Add All to Cart
            </button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default QuickOrder;
