import Link from 'next/link';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const Wishlist = () => {
  const { products, wishlist, toggleWishlist, addToCart, loadProducts } = useStore();
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  useEffect(() => {
    if (products.length === 0) {
      loadProducts(1, 100);
    }
  }, []);

  useEffect(() => {
    if (wishlist.length > 0 && products.length === 0) {
      loadProducts(1, 100);
    }
  }, [wishlist.length]);

  if (wishlistProducts.length === 0) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          {/* BANNER */}
          <div className="relative w-full overflow-hidden bg-gradient-to-r from-primary to-primary/80" style={{ height: 260 }}>
            {/* dot grid */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '32px 32px',
              }}
            />
            {/* banner text */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
              <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">
                Morpankh Saree · Wishlist
              </p>
              <h2 className="text-4xl font-bold mb-2">My Wishlist</h2>
              <p className="text-white/70 text-sm max-w-md">
                Your favorite items saved for later. Add them to cart when you're ready to purchase.
              </p>
            </div>
          </div>

          {/* DRAGGABLE CONTENT */}
          <div
            className="container mx-auto px-4 py-12 relative z-10"
          >
            {/* page pill + title */}
            <div className="text-center mb-14 fade-up-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Wishlist Management
              </div>
              <h1 className="text-5xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>
                
              </h1>
            </div>

            {/* EMPTY STATE */}
            <div className="max-w-2xl mx-auto text-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-primary/20 bg-primary/10">
                  <Heart className="w-16 h-16 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-primary">Your wishlist is empty</h2>
              <p className="text-muted-foreground text-lg mb-8">Start adding your favorite sarees to your wishlist</p>
              <Link href="/products" className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:scale-105 font-medium shadow-lg">
                <ShoppingCart className="w-5 h-5" />
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* BANNER */}
        <div className="relative w-full overflow-hidden bg-gradient-to-r from-primary to-primary/80" style={{ height: 260 }}>
          {/* dot grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
          {/* banner text */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
            <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">
              Morpankh Saree · Wishlist
            </p>
            <h2 className="text-4xl font-bold mb-2">My Wishlist</h2>
            <p className="text-white/70 text-sm max-w-md">
              Your favorite items saved for later. Add them to cart when you're ready to purchase.
            </p>
          </div>
        </div>

        {/* DRAGGABLE CONTENT */}
        <div
          className="container mx-auto px-4 py-12 relative z-10"
        >
          {/* page pill + title */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Wishlist Management
            </div>
            <h1 className="text-5xl font-bold mb-4 text-primary">
              {wishlistProducts.length} {wishlistProducts.length === 1 ? 'Item' : 'Items'}
            </h1>
          </div>

          {/* WISHLIST GRID */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistProducts.map((product, index) => (
              <div
                key={product.id}
                className="rounded-2xl p-6 bg-card/80 backdrop-blur-xl border border-border/60 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-l-4 border-l-primary/50"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link href={`/product/${product.slug}`} className="block group">
                  <div className="relative mb-4">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-xl border border-border/50"
                    />
                    <div className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                    </div>
                  </div>
                </Link>

                <div className="p-4">
                  <h3 className="font-medium text-sm truncate mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-lg" style={{ color: 'hsl(var(--primary))' }}>
                      ₹{product.price.toLocaleString()}
                    </p>
                    {product.comparePrice > product.price && (
                      <p className="text-muted-foreground text-xs line-through">
                        ₹{product.comparePrice.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        addToCart({
                          productId: product.id,
                          name: product.name,
                          image: product.images[0],
                          price: product.price,
                          color: typeof product.colors?.[0] === 'string' ? product.colors?.[0] : product.colors?.[0]?.colorName || '',
                          quantity: 1,
                        });
                        toast({ title: 'Added to cart' });
                      }}
                      className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium flex items-center justify-center gap-1 hover:bg-primary/90 transition-all hover:scale-105"
                    >
                      <ShoppingCart className="h-3 w-3" /> Add to Cart
                    </button>
                    <button
                      onClick={() => {
                        toggleWishlist(product.id);
                        toast({ title: 'Removed from wishlist' });
                      }}
                      className="p-2 border border-destructive text-destructive rounded-xl hover:bg-destructive/10 transition-all hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
    </PublicLayout>
  );
};

export default Wishlist;
