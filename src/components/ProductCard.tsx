import { Heart, ShoppingCart, Eye, Star } from 'lucide-react';
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

const ProductCard = ({ product }: ProductCardProps) => {
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
    if (!isWished) {
      toast({
        title: 'Added to Wishlist',
        description: `${product.name} saved for later.`,
      });
    }
  };

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full">
      <div ref={containerRef} className="bg-card rounded-[18px] h-full flex flex-col overflow-hidden border border-border transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
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
              className={`object-cover transition-transform duration-700 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between gap-2">
            <div className="flex flex-col gap-2">
              {/* Prebooking badge */}
              {product.isPrebooking && (
                <PrebookingBadge 
                  deliveryDays={product.prebookingDeliveryDays || 12} 
                  className="max-w-full"
                />
              )}
              
              {/* Sale/Discount badge */}
              {!product.isPrebooking && discount > 0 && (
                <span className="bg-secondary text-secondary-foreground text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-sm w-max">
                  {discount}% OFF
                </span>
              )}

              {/* Limited Offer badge */}
              {!product.isPrebooking && product.isLimitedOffer && (
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md animate-pulse w-max">
                  <span className="sm:hidden">LIMITED</span>
                  <span className="hidden sm:inline">LIMITED OFFER</span>
                </span>
              )}
            </div>
          </div>

          {product.isNew && (
            <span className="absolute bottom-3 right-3 bg-primary text-primary-foreground text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-sm z-20">
              NEW
            </span>
          )}

          {/* Hover overlay for cart and wishlist */}
          <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-black/10 backdrop-blur-[2px]">
            <button 
              onClick={handleAddToCart} 
              className="bg-white text-foreground p-3.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-xl translate-y-4 group-hover:translate-y-0"
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
            <button 
              onClick={handleToggleWishlist} 
              className="bg-white text-foreground p-3.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-xl translate-y-4 group-hover:translate-y-0 delay-75"
              aria-label="Add to wishlist"
            >
              <Heart className={`h-5 w-5 ${isWished ? 'fill-primary text-primary' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-5 flex flex-col flex-grow bg-card">
          <div className="flex items-center gap-1 text-accent mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-current" />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">(4.8)</span>
          </div>

          <h3 className="font-display font-semibold text-base md:text-lg text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          <div className="mt-auto pt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg md:text-xl text-primary">
                ₹{(product.isPrebooking ? (product.prebookingPrice || product.price) : product.price).toLocaleString()}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-sm text-muted-foreground line-through">₹{product.comparePrice.toLocaleString()}</span>
              )}
            </div>
            
            {/* Prebooking message */}
            {product.isPrebooking && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-medium text-accent">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                  {product.prebookingMessage || 'Prebook now - Limited availability!'}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Expected delivery: {product.prebookingDeliveryDays || 10}-{(product.prebookingDeliveryDays || 10) + 5} days
                </div>
              </div>
            )}
            
            {product.cardOfferText && !product.isPrebooking && (
              <div className="flex justify-start">
                <span className="inline-flex items-center rounded-md bg-secondary/10 px-2 py-1 text-[10px] font-semibold text-secondary border border-secondary/20">
                  {product.cardOfferText}
                </span>
              </div>
            )}

            {!product.isPrebooking && product.isLimitedOffer && (
              <div className="space-y-1 mt-1">
                <div className="flex items-center gap-1 text-[10px] font-medium text-orange-600">
                  <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse"></span>
                  {product.limitedOfferMessage || 'Hurry! Limited stock!'}
                </div>
                {product.limitedStock && (
                  <div className="text-[10px] text-orange-700 font-semibold">
                    Only {product.limitedStock} left!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
