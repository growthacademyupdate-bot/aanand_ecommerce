import { Heart, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Product } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import PrebookingBadge from '@/components/PrebookingBadge';

interface ProductCardProps {
  product: Product;
}

let productCardRenderCount = 0;

const ProductCard = ({ product }: ProductCardProps) => {
  productCardRenderCount++;
  console.log(`[DEBUG] ProductCard (ID: ${product.id}) Render Count: ${productCardRenderCount}`);
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const isWished = wishlist.includes(product.id);
  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  const [imageSrc, setImageSrc] = useState(product.images[0] || '/placeholder.svg');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setImageSrc(product.images[0] || '/placeholder.svg');
    setImgLoaded(false);
  }, [product.id, product.images[0]]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsNearViewport(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin: '300px', threshold: 0.01 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Check cart for existing quantity
    const cart = useStore.getState().cart;
    const color = typeof product.colors?.[0] === 'string' ? product.colors?.[0] : product.colors?.[0]?.colorName || '';
    const existing = cart.find((c) => c.productId === product.id && c.color === color);
    const alreadyInCart = existing ? existing.quantity : 0;
    
    // Calculate available stock for variant
    let availableStock = product.stock || 0;
    if (product.colors && typeof product.colors[0] !== 'string') {
      const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[] }>)
        .find((c) => c.colorName === color);
      availableStock = colorVariant?.stock || product.stock || 0;
    }
    
    if (alreadyInCart + 1 > availableStock) {
      toast({ title: `Only ${availableStock} quantity available for ${color}`, variant: 'destructive' });
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: product.isPrebooking ? (product.prebookingPrice || product.price) : product.price,
      comparePrice: product.comparePrice,
      color,
      quantity: 1,
      isPrebooking: product.isPrebooking,
      prebookingPrice: product.prebookingPrice,
      prebookingDeliveryDays: product.prebookingDeliveryDays,
    });
    toast({ 
      title: product.isPrebooking ? 'Prebooked successfully' : 'Added to cart', 
      description: product.name 
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
    toast({ title: isWished ? 'Removed from wishlist' : 'Added to wishlist', description: product.name });
  };

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div ref={containerRef} className="bg-card rounded-xl overflow-hidden card-hover border border-border">
        <div className="relative aspect-[3/4] overflow-hidden">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          {isNearViewport && (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
              quality={60}
              onLoadingComplete={() => setImgLoaded(true)}
              onError={() => {
                setImageSrc('/placeholder.svg');
                setImgLoaded(true);
              }}
              className={`object-cover transition-transform duration-500 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between gap-2">
            {/* Prebooking badge */}
            {product.isPrebooking && (
              <PrebookingBadge 
                deliveryDays={product.prebookingDeliveryDays || 12} 
                className="max-w-[48%]"
              />
            )}
            
            {/* Sale/Discount badge */}
            {!product.isPrebooking && discount > 0 ? (
              <span className="bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md max-w-[48%] truncate">
                {product.isSale ? `${discount}% OFF` : `-${discount}%`}
              </span>
            ) : (
              !product.isPrebooking && <span />
            )}

            {/* Limited Offer badge - positioned above sale badge */}
            {!product.isPrebooking && product.isLimitedOffer && (
              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md animate-pulse max-w-[48%] truncate">
                <span className="sm:hidden">LIMITED</span>
                <span className="hidden sm:inline">LIMITED OFFER</span>
              </span>
            )}
          </div>
          {product.isNew && (
            <span className="absolute bottom-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md">
              NEW
            </span>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
            <button onClick={handleAddToCart} className="bg-card text-foreground p-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors" title="Add to Cart">
              <ShoppingCart className="h-5 w-5" />
            </button>
            <button onClick={handleToggleWishlist} className={`p-3 rounded-full transition-colors ${isWished ? 'bg-destructive text-destructive-foreground' : 'bg-card text-foreground hover:bg-destructive hover:text-destructive-foreground'}`} title="Wishlist">
              <Heart className="h-5 w-5" fill={isWished ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-foreground text-sm truncate">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-primary font-bold">
              Rs{product.isPrebooking ? (product.prebookingPrice || product.price) : product.price.toLocaleString()}
            </span>
            {product.comparePrice > product.price && (
              <span className="text-muted-foreground text-sm line-through">Rs{product.comparePrice.toLocaleString()}</span>
            )}
          </div>
          
          {/* Prebooking message */}
          {product.isPrebooking && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium text-purple-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                {product.prebookingMessage || 'Prebook now - Limited availability!'}
              </div>
              <div className="text-xs text-purple-700">
                Expected delivery: {product.prebookingDeliveryDays || 10}-{(product.prebookingDeliveryDays || 10) + 5} days
              </div>
            </div>
          )}
          
          {product.cardOfferText && !product.isPrebooking && (
            <div className="mt-2 flex justify-end">
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                {product.cardOfferText}
              </span>
            </div>
          )}
          {!product.isPrebooking && product.isLimitedOffer && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium text-orange-600">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                {product.limitedOfferMessage || 'Hurry! Limited stock available!'}
              </div>
              {product.limitedStock && (
                <div className="text-xs text-orange-700 font-semibold">
                  Only {product.limitedStock} left!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
