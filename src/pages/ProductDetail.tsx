import { useEffect, useState, useMemo, useCallback } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Heart, ShoppingCart, Minus, Plus } from 'lucide-react';

import Image from 'next/image';

import PublicLayout from '@/components/PublicLayout';

import ProductCard from '@/components/ProductCard';

import { useStore } from '@/store/useStore';

import { toast } from '@/hooks/use-toast';

import { Product } from '@/data/mockData';

function mapDetailResponse(data: Record<string, unknown>): Product {
  const colors = (data.colors as Array<{ colorName: string; stock: number; images?: string[]; sizes?: Record<string, number>; hasSizes?: boolean }>) || [];
  const images = colors.flatMap((c) => c.images || []).filter(Boolean);
  const price = Number(data.basePrice ?? 0);
  const comparePrice = Number(data.compareAtPrice ?? price);

  return {
    id: String(data._id ?? ''),
    name: String(data.name ?? ''),
    slug: String(data.slug ?? ''),
    price,
    comparePrice,
    description: String(data.description ?? ''),
    fabric: String(data.fabricType ?? ''),
    images: images.length ? images : ['/placeholder.svg'],
    category: String(data.category ?? ''),
    colors: colors as Product['colors'],
    hasSizes: Boolean(data.hasSizes),
    sizes: Array.isArray(data.sizes) ? (data.sizes as string[]) : [],
    stock: colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0),
    sku: String(data.sku ?? ''),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    featured: Boolean(data.isFeatured),
    isNew: Boolean(data.isNew),
    isSale: Boolean(data.isSale),
    isPremium: Boolean(data.isPremium),
    isTrending: Boolean(data.isTrending),
    isLiveSpecial: Boolean(data.isLiveSpecial),
    isLimitedOffer: Boolean(data.isLimitedOffer),
    limitedStock: data.limitedStock ? Number(data.limitedStock) : undefined,
    limitedOfferMessage: data.limitedOfferMessage ? String(data.limitedOfferMessage) : undefined,
    isPrebooking: Boolean(data.isPrebooking),
    prebookingPrice: data.prebookingPrice ? Number(data.prebookingPrice) : undefined,
    prebookingDeliveryDays: data.prebookingDeliveryDays ? Number(data.prebookingDeliveryDays) : undefined,
    prebookingMessage: data.prebookingMessage ? String(data.prebookingMessage) : undefined,
    rating: Number(data.rating ?? 0),
    reviews: Number(data.reviewCount ?? 0),
  };
}

const ProductDetail = () => {

  const params = useParams<{ slug: string }>();

  const slug = params?.slug;

  const router = useRouter();

  const { addToCart, toggleWishlist, wishlist } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const loadProduct = async () => {
      setLoadingProduct(true);
      try {
        const res = await fetch(`/api/product/${slug}`);
        const data = await res.json();
        if (!res.ok || data?.error) {
          setProduct(null);
          setRelatedProducts([]);
          return;
        }

        const mapped = mapDetailResponse(data as Record<string, unknown>);
        setProduct(mapped);

        if (mapped.category) {
          const relatedRes = await fetch(
            `/api/products?category=${encodeURIComponent(mapped.category)}&limit=5`
          );
          const relatedJson = await relatedRes.json();
          if (relatedRes.ok && relatedJson?.success && Array.isArray(relatedJson.data)) {
            setRelatedProducts(
              (relatedJson.data as Product[]).filter((p) => p.id !== mapped.id).slice(0, 4)
            );
          } else {
            setRelatedProducts([]);
          }
        }
      } catch {
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        setLoadingProduct(false);
      }
    };

    void loadProduct();
  }, [slug]);

  const [selectedColor, setSelectedColor] = useState('');

  const [selectedSize, setSelectedSize] = useState('');

  const [quantity, setQuantity] = useState(1);

  const [selectedImage, setSelectedImage] = useState(0);

  const [mainImageSrc, setMainImageSrc] = useState(product?.images?.[0] || '/placeholder.svg');

  const [thumbErrors, setThumbErrors] = useState<Record<number, boolean>>({});



  // Get images for selected color

  const getImagesForColor = useCallback((color: string) => {

    if (!product?.colors) return [];

    // Check if colors is array of strings or objects

    if (typeof product.colors[0] === 'string') {

      // Legacy format: colors are just strings, use main images

      return product.images || [];

    }

    // New format: colors have their own images

    const colorVariant = (product.colors as unknown as Array<{ colorName: string; images: string[] }>).find((c) => c.colorName === color);

    return colorVariant?.images || product.images || [];

  }, [product]);



  const currentImages = useMemo(() => {

    if (!product) return [];

    // If no color selected, get the first available color's images

    const colorToUse = selectedColor || (

      product.colors?.[0] 

        ? (typeof product.colors[0] === 'string' ? product.colors[0] : product.colors[0].colorName)

        : ''

    );

    const images = getImagesForColor(colorToUse);

    console.log(`Color: ${colorToUse}, Images:`, images);

    return images;

  }, [product, selectedColor, getImagesForColor]);



  // Convert color names to hex values for display

  const getColorHex = useCallback((colorName: string) => {

    const colorMap: { [key: string]: string } = {

      'Red': '#DC2626',

      'Blue': '#2563EB',

      'Green': '#16A34A',

      'Yellow': '#CA8A04',

      'Orange': '#EA580C',

      'Purple': '#9333EA',

      'Pink': '#EC4899',

      'Brown': '#92400E',

      'Black': '#000000',

      'White': '#FFFFFF',

      'Gray': '#6B7280',

      'Grey': '#6B7280',

      'Beige': '#F5F5DC',

      'Cream': '#FFFDD0',

      'Maroon': '#800000',

      'Navy': '#000080',

      'Teal': '#008080',

      'Cyan': '#00FFFF',

      'Magenta': '#FF00FF',

      'Lime': '#32CD32',

      'Olive': '#808000',

      'Gold': '#FFD700',

      'Silver': '#C0C0C0',

      'Indigo': '#4B0082',

      'Violet': '#EE82EE',

    };

    return colorMap[colorName] || '#6B7280'; // Default to gray if color not found

  }, []);



  const isWished = product ? wishlist.includes(product.id) : false;

  const discount = product ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;




  // Get stock for selected color variant

  const getVariantStock = useCallback((color: string, size?: string) => {

    if (!product?.colors) return product?.stock || 0;

    

    // Check if colors is array of strings or objects

    if (typeof product.colors[0] === 'string') {

      // Legacy format: use main product stock

      return product.stock || 0;

    }

    

    // New format: find variant stock

    const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[]; sizes?: { [key: string]: number }; hasSizes?: boolean }>)

      .find((c) => c.colorName?.toLowerCase() === color.toLowerCase());

    // Use size-specific stock if size is provided and variant has sizes
    if (size && colorVariant?.hasSizes && colorVariant?.sizes) {
      return colorVariant.sizes[size] || 0;
    }

    return colorVariant?.stock || product.stock || 0;

  }, [product]);



  useEffect(() => {

    // Auto-select first available color on page load

    if (product && product.colors && product.colors.length > 0 && !selectedColor) {

      const colorVariants = product.colors.map((color) => {

        const colorName = typeof color === 'string' ? color : (color as unknown as { colorName: string }).colorName;

        const stock = getVariantStock(colorName);

        return { color: colorName, stock };

      });



      const firstAvailable = colorVariants.find(v => v.stock > 0) || colorVariants[0];

      setSelectedColor(firstAvailable.color);

      setQuantity(firstAvailable.stock > 0 ? 1 : 0);

    }

  }, [product, selectedColor, getVariantStock]);



  useEffect(() => {

    setSelectedImage(0); // Reset to first image when color changes

  }, [selectedColor]);



  useEffect(() => {

    const nextSrc = currentImages?.[selectedImage] || '/placeholder.svg';

    setMainImageSrc(nextSrc);

  }, [currentImages, selectedImage]);



  

  const currentVariantStock = useMemo(() => {

    if (!product?.colors) return product?.stock || 0;

    

    // Debug: Log product data and selected color

    if (product.name === 'Vintage Floral Grace') {

      console.log('🌸 FRONTEND STOCK DEBUG:', {

        productName: product.name,

        selectedColor,

        selectedSize,

        colors: product.colors,

        colorsType: typeof product.colors[0],

        allColorStocks: product.colors?.map(c => ({ 

          color: c.colorName, 

          stock: c.stock,

          stockType: typeof c.stock 

        }))

      });

    }

    

    // Check if colors is array of strings or objects

    if (typeof product.colors[0] === 'string') {

      // Legacy format: use main product stock

      return product.stock || 0;

    }

    

    // New format: find variant stock

    const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[]; sizes?: { [key: string]: number } }>)

      .find((c) => c.colorName?.toLowerCase() === selectedColor.toLowerCase());

    

    // For products with per-color size quantities
    // If size is selected, use size-specific stock
    // If no size selected, use total color stock (but require size selection before add to cart)
    if (colorVariant?.sizes) {
      if (selectedSize) {
        const sizeStock = colorVariant.sizes[selectedSize] || 0;
        
        // Debug: Log size-specific stock
        if (product.name === 'Vintage Floral Grace') {
          console.log('🎯 FRONTEND SIZE STOCK DEBUG:', {
            productName: product.name,
            selectedColor,
            selectedSize,
            sizeStock
          });
        }
        
        return sizeStock;
      }
      // No size selected - return total color stock for display
      return colorVariant.stock || product.stock || 0;
    }

    

    // Fix: Only use fallback if color variant is not found, not if stock is 0

    const stock = colorVariant !== undefined ? colorVariant.stock : (product.stock || 0);

    

    // Debug: Log found variant and stock

    if (product.name === 'Vintage Floral Grace') {

      console.log('🎯 FRONTEND VARIANT STOCK DEBUG:', {

        productName: product.name,

        selectedColor,

        foundVariant: colorVariant,

        finalStock: stock

      });

    }

    

    return stock;

  }, [product, selectedColor, selectedSize]);



  // Reset quantity to 1 when stock is 0, or to 1 when switching to a variant with stock

  useEffect(() => {

    if (currentVariantStock === 0) {

      setQuantity(0);

    } else if (quantity === 0) {

      setQuantity(1);

    }

  }, [currentVariantStock, quantity]);



  if (loadingProduct) return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading product...</div>
    </PublicLayout>
  );

  if (!product) return (

    <PublicLayout>

      <div className="container mx-auto px-4 py-20 text-center">

        <h1 className="text-2xl font-display font-bold">Product not found</h1>

      </div>

    </PublicLayout>

  );



  const handleAddToCart = () => {

    // Check cart for existing quantity

    const cart = useStore.getState().cart;

    const existing = cart.find((c) => c.productId === product.id && c.color === selectedColor && c.size === selectedSize);

    const alreadyInCart = existing ? existing.quantity : 0;

    const availableStock = currentVariantStock;

    

    if (alreadyInCart + quantity > availableStock) {

      toast({ title: `Only ${availableStock} quantity available for ${selectedColor}`, variant: 'destructive' });

      return;

    }

    

    // Get the correct variant image

    let variantImage = product.images[0]; // fallback to first image

    if (product.colors && typeof product.colors[0] !== 'string') {

      const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[] }>)

        .find((c) => c.colorName?.toLowerCase() === selectedColor.toLowerCase());

      if (colorVariant?.images && colorVariant.images.length > 0) {

        variantImage = colorVariant.images[0];

      }

    }

    

    addToCart({ productId: product.id, name: product.name, image: variantImage, price: product.price, color: selectedColor, size: selectedSize, quantity });

    toast({ title: 'Added to cart!', description: `${product.name} (${selectedColor})` });

  };



  const handleBuyNow = () => {

    // Check cart for existing quantity

    const cart = useStore.getState().cart;

    const existing = cart.find((c) => c.productId === product.id && c.color === selectedColor && c.size === selectedSize);

    const alreadyInCart = existing ? existing.quantity : 0;

    const availableStock = currentVariantStock;

    

    if (alreadyInCart + quantity > availableStock) {

      toast({ title: `Only ${availableStock} quantity available for ${selectedColor}`, variant: 'destructive' });

      return;

    }

    

    // Get correct variant image

    let variantImage = product.images[0]; // fallback to first image

    if (product.colors && typeof product.colors[0] !== 'string') {

      const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[] }>)

        .find((c) => c.colorName?.toLowerCase() === selectedColor.toLowerCase());

      if (colorVariant?.images && colorVariant.images.length > 0) {

        variantImage = colorVariant.images[0];

      }

    }

    

    // Store buy now item in sessionStorage with correct quantity

    const buyNowItem = {

      productId: product.id,

      name: product.name,

      image: variantImage,

      price: product.price,

      comparePrice: product.comparePrice,

      color: selectedColor,

      size: selectedSize,

      quantity: quantity, // This ensures quantity is passed correctly

      isPrebooking: product.isPrebooking,

      prebookingPrice: product.prebookingPrice,

      prebookingDeliveryDays: product.prebookingDeliveryDays,

    };

    sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));

    router.push('/checkout');

  };



  return (

    <PublicLayout>

      <div className="container mx-auto px-4 py-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

          {/* Images */}

          <div>

            <div className="aspect-[3/4] rounded-xl overflow-hidden mb-4">

              <div className="relative w-full h-full">

                <Image

                  src={mainImageSrc}

                  alt={product.name}

                  fill

                  priority

                  quality={75}

                  onError={() => setMainImageSrc('/placeholder.svg')}

                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 520px"

                  className="object-cover"

                />

              </div>

            </div>

            <div className="flex gap-3">

              {currentImages.map((img, i) => (

                <button key={i} onClick={() => setSelectedImage(i)} className={`w-20 h-24 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === i ? 'border-primary' : 'border-border'}`}>

                  <div className="relative w-full h-full">

                    <Image

                      src={thumbErrors[i] ? '/placeholder.svg' : img}

                      alt=""

                      fill

                      quality={60}

                      onError={() => setThumbErrors((prev) => ({ ...prev, [i]: true }))}

                      sizes="80px"

                      className="object-cover"

                    />

                  </div>

                </button>

              ))}

            </div>

          </div>



          {/* Info */}

          <div>

            <h1 className="font-display text-2xl md:text-3xl font-bold">{product.name}</h1>

            <div className="flex items-center gap-3 mt-3">

              <span className="text-2xl font-bold text-primary">₹{product.price.toLocaleString()}</span>

              {product.comparePrice > product.price && (

                <>

                  <span className="text-lg text-muted-foreground line-through">₹{product.comparePrice.toLocaleString()}</span>

                  <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">-{discount}%</span>

                </>

              )}

            </div>



            {/* Colors */}

            <div className="mt-6">

              <h3 className="text-sm font-medium mb-3">Color: {selectedColor}</h3>

              <div className="flex gap-2">

                {product?.colors?.map((color) => {

                  const colorName = typeof color === 'string' ? color : (color as unknown as { colorName: string }).colorName;

                  const isSelected = selectedColor === colorName;

                  const stock = getVariantStock(colorName);

                  const isOutOfStock = stock === 0;

                  

                  const handleColorSelect = (color: string) => {

                    setSelectedColor(color);

                    // Reset selected size when changing color for products with sizes
                    const colorVariant = (product.colors as Array<{ colorName: string; sizes?: { [key: string]: number } }>)
                      .find((c) => c.colorName?.toLowerCase() === color.toLowerCase());

                    if (colorVariant?.sizes && Object.keys(colorVariant.sizes).length > 0) {
                      setSelectedSize('');
                      setQuantity(1); // Allow quantity selection, but require size before add to cart
                    } else {
                      const variantStock = getVariantStock(color);
                      setQuantity(variantStock > 0 ? 1 : 0);
                    }

                  };

                  

                  return (

                    <button 

                      key={colorName} 

                      onClick={() => !isOutOfStock && handleColorSelect(colorName)} 

                      disabled={isOutOfStock}

                      className={`w-10 h-10 rounded-full border-2 transition-all relative ${

                        isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'

                      } ${

                        isOutOfStock 

                          ? 'opacity-40 cursor-not-allowed grayscale' 

                          : 'hover:scale-110 cursor-pointer'

                      }`}

                      title={isOutOfStock ? `${colorName} - Out of Stock` : colorName}

                      style={{ 

                        backgroundColor: getColorHex(colorName),

                        backgroundImage: `linear-gradient(135deg, ${getColorHex(colorName)}dd, ${getColorHex(colorName)})`

                      }}

                    >

                      <span className="sr-only">{colorName}</span>

                      {isOutOfStock && (

                        <span className="absolute inset-0 flex items-center justify-center">

                          <span className="text-[9px] font-bold text-white/80 bg-black/40 rounded-full px-0.5 leading-tight">

                            OUT

                          </span>

                        </span>

                      )}

                    </button>

                  );

                })}

              </div>

              {currentVariantStock === 0 && (

                <p className="text-red-500 font-semibold mt-2">

                  Out of Stock

                </p>

              )}

            </div>



            {/* Sizes */}

            {(product.sizes && product.sizes.length > 0) || (selectedColor && (product.colors as Array<{ colorName: string; sizes?: { [key: string]: number } }>)?.some(c => c.sizes && Object.keys(c.sizes).length > 0)) ? (

              <div className="mt-4">

                <h3 className="text-sm font-medium mb-3">Size</h3>

                <div className="flex gap-2">

                  {(() => {

                    // Get sizes from the selected color variant if available
                    if (selectedColor) {
                      const colorVariant = (product.colors as Array<{ colorName: string; sizes?: { [key: string]: number } }>)
                        .find((c) => c.colorName?.toLowerCase() === selectedColor.toLowerCase());

                      if (colorVariant?.sizes && Object.keys(colorVariant.sizes).length > 0) {
                        const availableSizes = Object.keys(colorVariant.sizes);

                        return availableSizes.map((size) => {
                          const sizeStock = colorVariant?.sizes?.[size] || 0;
                          const isOutOfStock = sizeStock === 0;

                          return (
                            <button
                              key={size}
                              onClick={() => !isOutOfStock && setSelectedSize(size)}
                              disabled={isOutOfStock}
                              className={`px-4 py-2 rounded-lg text-sm border-2 transition-colors ${
                                selectedSize === size ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                              } ${
                                isOutOfStock ? 'opacity-40 cursor-not-allowed grayscale' : ''
                              }`}
                              title={isOutOfStock ? `${size} - Out of Stock` : size}
                            >
                              {size}
                            </button>
                          );
                        });
                      }
                    }

                    // Fallback to product.sizes array for legacy products
                    return product.sizes?.map((size) => (
                      <button key={size} onClick={() => setSelectedSize(size)} className={`px-4 py-2 rounded-lg text-sm border-2 transition-colors ${selectedSize === size ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                        {size}
                      </button>
                    ));

                  })()}

                </div>

              </div>

            ) : null}



            {/* Quantity */}

            <div className="mt-6">

              <h3 className="text-sm font-medium mb-3">Quantity</h3>

              <div className="flex items-center gap-3">

                <button 

                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 

                  className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"

                  disabled={currentVariantStock === 0 || quantity <= 1}

                >

                  <Minus className="h-4 w-4" />

                </button>

                <span className="w-12 text-center font-medium">{quantity}</span>

                <button

                  onClick={() => {

                    if (quantity < currentVariantStock) {

                      setQuantity(quantity + 1);

                    } else {

                      toast({ title: `Only ${currentVariantStock} quantity available for ${selectedColor}`, variant: 'destructive' });

                    }

                  }}

                  className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"

                  disabled={currentVariantStock === 0 || quantity >= currentVariantStock}

                >

                  <Plus className="h-4 w-4" />

                </button>

              </div>

              {currentVariantStock > 1 && quantity === currentVariantStock && (

                <div className="text-xs text-destructive mt-1">Max available quantity reached</div>

              )}

              

                          </div>



            {/* Buttons */}

            <div className="flex gap-3 mt-8">

              <button 

                onClick={handleAddToCart} 

                className={`btn-primary flex items-center gap-2 flex-1 ${

                  currentVariantStock === 0 ? "opacity-50 cursor-not-allowed" : ""

                }`}

                disabled={currentVariantStock === 0}

              >

                <ShoppingCart className="h-4 w-4" /> Add to Cart

              </button>

              <button 

                onClick={handleBuyNow} 

                className={`btn-secondary flex-1 ${

                  currentVariantStock === 0 ? "opacity-50 cursor-not-allowed" : ""

                }`}

                disabled={currentVariantStock === 0}

              >

                Buy Now

              </button>

              <button onClick={() => { toggleWishlist(product.id); toast({ title: isWished ? 'Removed' : 'Added to wishlist' }); }} className={`p-3 rounded-lg border-2 transition-colors ${isWished ? 'border-destructive text-destructive' : 'border-border hover:border-destructive hover:text-destructive'}`}>

                <Heart className="h-5 w-5" fill={isWished ? 'currentColor' : 'none'} />

              </button>

            </div>



            {/* Description */}

            <div className="mt-8 space-y-4">

              <div>

                <h3 className="font-display text-lg font-semibold mb-2">Description</h3>

                <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>

              </div>

              <div>

                <h3 className="font-display text-lg font-semibold mb-2">Fabric Details</h3>

                <p className="text-muted-foreground text-sm">{product.fabric}</p>

              </div>

            </div>

          </div>

        </div>



        {/* Related */}

        {relatedProducts.length > 0 && (

          <div className="mt-16">

            <h2 className="section-title mb-8">Related Products</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">

              {relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}

            </div>

          </div>

        )}

      </div>

    </PublicLayout>

  );

};



export default ProductDetail;

