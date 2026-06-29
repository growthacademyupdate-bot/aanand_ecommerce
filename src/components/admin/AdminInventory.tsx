"use client";

import { Plus, Minus, Camera, Search, X, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { toast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';

interface InventoryItem {
  _id: string;
  productId: string;
  productName: string;
  variant: string;
  sku: string;
  stock: number;
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
  productSku: string;
  images: string[];
  variantIndex: number;
}

interface ProductColor {
  colorName: string;
  stock: number;
  images: string[];
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

interface ScannedProduct {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  colors: ProductColor[];
  stock: number;
}

const AdminInventory = () => {
  // State management
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Barcode scanner states
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [variantQuantities, setVariantQuantities] = useState<{ [key: string]: number }>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  // Fetch inventory data from API
  const fetchInventory = async (page: number = 1, search: string = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '50',
        ...(search && { search })
      });
      
      const response = await fetch(`/api/admin/inventory?${params}`, {
        headers: { authorization: 'Bearer admin-token' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 API RESPONSE:', JSON.stringify(data, null, 2));
        setInventory(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        
        console.log('📦 INVENTORY STATE AFTER SET:', data.data || []);
        
        console.log('📦 INVENTORY LOADED:', {
          page,
          search,
          items: data.data?.length || 0,
          total: data.pagination?.total || 0
        });
      } else {
        toast({ title: 'Failed to load inventory', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({ title: 'Failed to load inventory', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Update variant stock
  const updateVariantStock = async (productId: string, variantName: string, change: number, size?: string) => {
    const updateKey = size ? `${productId}-${variantName}-${size}` : `${productId}-${variantName}`;
    setUpdating(updateKey);
    
    try {
      console.log('🔄 UPDATING VARIANT STOCK:', {
        productId,
        variant: variantName,
        change,
        size
      });

      const response = await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          authorization: 'Bearer admin-token'
        },
        body: JSON.stringify({
          productId,
          variant: variantName,
          change: change,
          size: size
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ STOCK UPDATE SUCCESS:', result.data);
        
        // Update the scanned product's variant stock
        setScannedProduct(prev => {
          if (!prev || !prev.colors) return prev;
          return {
            ...prev,
            colors: prev.colors.map((color: ProductColor) => 
              color.colorName === variantName 
                ? {
                    ...color,
                    stock: result.data.newColorStock || result.data.newStock,
                    sizes: result.data.size && color.sizes 
                      ? { ...color.sizes, [result.data.size]: result.data.newSizeStock }
                      : color.sizes
                  }
                : color
            )
          };
        });
        
        toast({ 
          title: `Stock updated for ${variantName}`,
          description: result.data.message || `${result.data.oldStock || result.data.oldSizeStock} → ${result.data.newStock || result.data.newSizeStock}`
        });
        
        // Refresh the product lookup to get latest data
        if (scannedProduct && scannedProduct.sku) {
          await lookupProduct(scannedProduct.sku);
        }
      } else {
        const error = await response.json();
        toast({ 
          title: 'Failed to update stock', 
          description: error.error || 'Unknown error',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({ 
        title: 'Failed to update stock', 
        variant: 'destructive' 
      });
    } finally {
      setUpdating(null);
    }
  };

  // Camera scanner functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        
        // Initialize ZXing reader
        codeReader.current = new BrowserMultiFormatReader();
        
        // Start continuous scanning
        codeReader.current.decodeFromVideoDevice(null, videoRef.current, (result: Result | undefined, error: unknown) => {
          if (result) {
            const scannedCode = result.getText();
            setBarcodeInput(scannedCode);
            lookupProduct(scannedCode);
            stopCamera(); // Stop camera after successful scan
          }
        });
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      toast({
        title: 'Camera Access Denied',
        description: 'Please allow camera access to scan barcodes',
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    if (codeReader.current) {
      codeReader.current.reset();
      codeReader.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const lookupProduct = async (code: string) => {
    console.log('🔍 LOOKING UP PRODUCT:', code);
    
    try {
      // Search products API by SKU or barcode
      const response = await fetch(`/api/admin/products?search=${encodeURIComponent(code)}`, {
        headers: { authorization: 'Bearer admin-token' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const products = data.data || [];
        
        // Find product matching SKU or barcode
        const product = products.find((p: ScannedProduct) => 
          p.sku === code || 
          p.barcode === code ||
          p.name.toLowerCase().includes(code.toLowerCase())
        );
        
        if (product) {
          // Store the full product with all variants
          console.log('📦 SCANNED PRODUCT STATE:', JSON.stringify(product, null, 2));
          setScannedProduct(product);
          
          // Initialize variant quantities to 1 for each variant
          const quantities: { [key: string]: number } = {};
          if (product.colors && Array.isArray(product.colors)) {
            product.colors.forEach((color: ProductColor, index: number) => {
              quantities[`${product._id}-${color.colorName}`] = 1;
            });
          }
          setVariantQuantities(quantities);
          
          toast({
            title: 'Product Found',
            description: `${product.name} - ${product.colors?.length || 0} variants`,
          });
        } else {
          toast({
            title: 'Product Not Found',
            description: 'No product found with this barcode/SKU',
            variant: 'destructive'
          });
          setScannedProduct(null);
        }
      } else {
        toast({
          title: 'Search Failed',
          description: 'Failed to search products',
          variant: 'destructive'
        });
        setScannedProduct(null);
      }
    } catch (error) {
      console.error('Error looking up product:', error);
      toast({
        title: 'Search Failed',
        description: 'Failed to search products',
        variant: 'destructive'
      });
      setScannedProduct(null);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      lookupProduct(barcodeInput.trim());
    }
  };

  const handleManualScan = () => {
    if (barcodeInput.trim()) {
      lookupProduct(barcodeInput.trim());
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInventory(1, searchQuery);
  };

  // Effects
  useEffect(() => {
    fetchInventory();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (currentPage > 1) {
      fetchInventory(currentPage, searchQuery);
    }
  }, [currentPage]);

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">Inventory</h1>
      
      {/* Barcode Scanner Section */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Scan Barcode / QR Code (Variant Code) / SKU</h2>
          <p className="text-sm text-muted-foreground">Enter or scan barcode/variant code/SKU...</p>
        </div>
        
        <form onSubmit={handleBarcodeSubmit} className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Enter barcode/SKU/variant code manually..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="button"
            onClick={handleManualScan}
            disabled={!barcodeInput.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lookup
          </button>
          <button
            type="button"
            onClick={isScanning ? stopCamera : startCamera}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-2"
          >
            {isScanning ? (
              <>
                <X className="h-4 w-4" />
                Stop Camera
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Scan with Camera
              </>
            )}
          </button>
        </form>
        
        {/* Camera Scanner Modal */}
        {isScanning && (
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-md mx-auto rounded-lg"
              />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-48 h-48 border-2 border-primary rounded-lg">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Position barcode within the frame to scan
            </p>
          </div>
        )}
        
        {/* Scanned Product Display */}
        {scannedProduct && (
          <div className="mt-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
              <div>
                <h3 className="font-semibold text-primary">Product Found</h3>
                <p className="text-sm">{scannedProduct.name}</p>
                <p className="text-sm text-muted-foreground">SKU: {scannedProduct.sku}</p>
                <p className="text-sm text-muted-foreground">Barcode: {scannedProduct.barcode}</p>
              </div>
            </div>
            
            {/* Variants Table */}
            {scannedProduct.colors && Array.isArray(scannedProduct.colors) && scannedProduct.colors.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3">Color / Variant</th>
                      <th className="text-left p-3">Current stock</th>
                      <th className="text-center p-3">Qty</th>
                      <th className="text-center p-3">Add / Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scannedProduct.colors.map((color: ProductColor, index: number) => {
                      const variantKey = `${scannedProduct._id}-${color.colorName}`;
                      const isUpdating = updating === variantKey;
                      
                      return [
                        // Color row
                        <tr key={`color-${index}`} className="border-t border-border bg-muted/30">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {color.images?.[0] && (
                                <img
                                  src={color.images[0]}
                                  alt={color.colorName}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <span className="font-medium">{color.colorName} ({color.stock})</span>
                            </div>
                          </td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                        </tr>,
                        
                        // Size rows (if hasSizes)
                        ...(color.hasSizes && color.sizes ? Object.entries(color.sizes).map(([size, stock]) => (
                          <tr key={`${index}-${size}`} className="border-t border-border">
                            <td className="p-3 pl-8">
                              <span className="text-muted-foreground">— {size.toUpperCase()}</span>
                            </td>
                            <td className="p-3">
                              <span className={`font-bold ${stock <= 5 ? 'text-destructive' : stock <= 10 ? 'text-gold' : 'text-primary'}`}>
                                {stock}
                              </span>
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="1"
                                value={variantQuantities[`${variantKey}-${size}`] || 1}
                                onChange={(e) => setVariantQuantities(prev => ({
                                  ...prev,
                                  [`${variantKey}-${size}`]: Math.max(1, Number(e.target.value))
                                }))}
                                className="w-20 px-2 py-1 border border-border rounded text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => updateVariantStock(scannedProduct._id, color.colorName, variantQuantities[`${variantKey}-${size}`] || 1, size)}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Plus className="h-3 w-3" />
                                  )}
                                </button>
                                <button
                                  onClick={() => updateVariantStock(scannedProduct._id, color.colorName, -(variantQuantities[`${variantKey}-${size}`] || 1), size)}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Minus className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )) : []),
                        
                        // Non-size variant row (if no sizes)
                        ...(!color.hasSizes ? [
                          <tr key={`${index}-nostock`} className="border-t border-border">
                            <td className="p-3 pl-8">
                              <span className="text-muted-foreground">— Stock</span>
                            </td>
                            <td className="p-3">
                              <span className={`font-bold ${color.stock <= 5 ? 'text-destructive' : color.stock <= 10 ? 'text-gold' : 'text-primary'}`}>
                                {color.stock}
                              </span>
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="1"
                                value={variantQuantities[variantKey] || 1}
                                onChange={(e) => setVariantQuantities(prev => ({
                                  ...prev,
                                  [variantKey]: Math.max(1, Number(e.target.value))
                                }))}
                                className="w-20 px-2 py-1 border border-border rounded text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => updateVariantStock(scannedProduct._id, color.colorName, variantQuantities[variantKey] || 1)}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Plus className="h-3 w-3" />
                                  )}
                                </button>
                                <button
                                  onClick={() => updateVariantStock(scannedProduct._id, color.colorName, -(variantQuantities[variantKey] || 1))}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Minus className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ] : [])
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminInventory;
