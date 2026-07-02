import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingCart, Package, Calendar } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import { useStore } from '@/store/useStore';
import PrebookingBadge from '@/components/PrebookingBadge';
import { toast } from '@/hooks/use-toast';

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart, products, wholesaleEnabled } = useStore();
  
  const subtotal = cart.reduce((sum, item) => {
    let itemPrice = item.price;
    if (wholesaleEnabled && item.wholesalePrice && item.moq && item.quantity >= item.moq) {
      itemPrice = item.wholesalePrice;
    }
    return sum + itemPrice * item.quantity;
  }, 0);

  // Get stock for selected color variant
  const getVariantStock = (productId: string, color: string, size?: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return 0;
    
    // Check if colors is array of strings or objects
    if (!product.colors || typeof product.colors[0] === 'string') {
      // Legacy format: use main product stock
      return product.stock || 0;
    }
    
    // New format: find variant stock (case-insensitive to match orders API)
    const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[]; sizes?: { [key: string]: number }; hasSizes?: boolean }>)
      .find((c) => c.colorName?.toLowerCase() === color.toLowerCase());
    
    // Use size-specific stock if size is provided and variant has sizes
    if (size && colorVariant?.hasSizes && colorVariant?.sizes) {
      return colorVariant.sizes[size] || 0;
    }
    
    return colorVariant?.stock || product.stock || 0;
  };

  if (cart.length === 0) {
    return (
      <PublicLayout>
        <style>{`
          @keyframes float1{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-24px) scale(1.03)}}
          @keyframes float2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(18px) scale(0.97)}}
          @keyframes float3{0%,100%{transform:translateX(0)}50%{transform:translateX(12px)}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
          @keyframes bannerReveal{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}
          @keyframes zoomPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
          @keyframes spinSlow{to{transform:rotate(360deg)}}
          @keyframes cartBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
          .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}
          .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}
          .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}
          .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}
          .cart-card:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 16px 40px hsl(var(--primary)/0.12)}
          .cart-card{transition:transform 0.3s ease,box-shadow 0.3s ease}
          .cart-bounce{animation:cartBounce 3s ease-in-out infinite}
          .logo-pulse{animation:zoomPulse 4s ease-in-out infinite}
          .spin-ring{animation:spinSlow 22s linear infinite}
        `}</style>

        <div className="min-h-screen relative overflow-hidden">
          {/* background gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(160deg, hsl(var(--primary)/0.06) 0%, hsl(var(--background)) 50%, hsl(var(--secondary)/0.08) 100%)',
            }}
          />

          {/* floating orbs */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 380, height: 380, top: -80, right: -100,
              background: 'radial-gradient(circle, hsl(var(--primary)/0.12), transparent 70%)',
              animation: 'float1 10s ease-in-out infinite',
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 260, height: 260, bottom: 60, left: -80,
              background: 'radial-gradient(circle, hsl(var(--secondary)/0.10), transparent 70%)',
              animation: 'float2 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 180, height: 180, top: '40%', left: '5%',
              background: 'radial-gradient(circle, hsl(var(--primary)/0.07), transparent 70%)',
              animation: 'float3 9s ease-in-out infinite',
            }}
          />

          {/* BANNER */}
          <div className="relative w-full overflow-hidden banner-reveal" style={{ height: 260 }}>
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(160deg, hsl(var(--primary)/0.95), hsl(168 60% 18%))',
              }}
            />
            {/* dot grid */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '32px 32px',
              }}
            />
            {/* floating shapes */}
            <div className="absolute" style={{ top: '12%', left: '8%', animation: 'float1 8s ease-in-out infinite' }}>
              <div className="w-16 h-16 rounded-2xl rotate-12 border-2 border-white/20" />
            </div>
            <div className="absolute" style={{ top: '50%', right: '10%', animation: 'float2 9s ease-in-out infinite' }}>
              <div className="w-12 h-12 rounded-full border-2 border-white/20" />
            </div>
            <div className="absolute" style={{ bottom: '15%', left: '18%', animation: 'float3 7s ease-in-out infinite' }}>
              <div className="w-8 h-8 rounded-lg rotate-45 border border-white/20" />
            </div>
            <div className="absolute" style={{ top: '20%', right: '25%', animation: 'spinSlow 18s linear infinite' }}>
              <div className="w-20 h-20 rounded-full border border-dashed border-white/15" />
            </div>
            {/* banner text */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
              <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">
                Morpankh Saree · Shopping Cart
              </p>
              <h2 className="text-4xl font-bold mb-2">Shopping Cart</h2>
              <p className="text-white/70 text-sm max-w-md">
                Your selected items are ready for checkout. Review and proceed to complete your order.
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
                Cart Management
              </div>
              <h1 className="text-5xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>
                
              </h1>
            </div>

            {/* EMPTY STATE */}
            <div className="max-w-2xl mx-auto text-center fade-up-2">
              <div className="relative">
                <div className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-primary/20" style={{ background: 'hsl(var(--primary)/0.08)' }}>
                  <ShoppingCart className="w-16 h-16 cart-bounce" style={{ color: 'hsl(var(--primary))' }} />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>Your cart is empty</h2>
              <p className="text-muted-foreground text-lg mb-8">Add some beautiful sarees to your cart and start shopping</p>
              <Link href="/products" className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:scale-105 font-medium shadow-lg">
                <Package className="w-5 h-5" />
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
      <style>{`
        @keyframes float1{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-24px) scale(1.03)}}
        @keyframes float2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(18px) scale(0.97)}}
        @keyframes float3{0%,100%{transform:translateX(0)}50%{transform:translateX(12px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bannerReveal{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}
        @keyframes zoomPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
        @keyframes spinSlow{to{transform:rotate(360deg)}}
        @keyframes cartBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}
        .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}
        .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}
        .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}
        .cart-card:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 16px 40px hsl(var(--primary)/0.12)}
        .cart-card{transition:transform 0.3s ease,box-shadow 0.3s ease}
        .cart-bounce{animation:cartBounce 3s ease-in-out infinite}
        .logo-pulse{animation:zoomPulse 4s ease-in-out infinite}
        .spin-ring{animation:spinSlow 22s linear infinite}
      `}</style>

      <div className="min-h-screen relative overflow-hidden">
        {/* background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(160deg, hsl(var(--primary)/0.06) 0%, hsl(var(--background)) 50%, hsl(var(--secondary)/0.08) 100%)',
          }}
        />

        {/* floating orbs */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 380, height: 380, top: -80, right: -100,
            background: 'radial-gradient(circle, hsl(var(--primary)/0.12), transparent 70%)',
            animation: 'float1 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 260, height: 260, bottom: 60, left: -80,
            background: 'radial-gradient(circle, hsl(var(--secondary)/0.10), transparent 70%)',
            animation: 'float2 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 180, height: 180, top: '40%', left: '5%',
            background: 'radial-gradient(circle, hsl(var(--primary)/0.07), transparent 70%)',
            animation: 'float3 9s ease-in-out infinite',
          }}
        />

        {/* BANNER */}
        <div className="relative w-full overflow-hidden banner-reveal" style={{ height: 260 }}>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, hsl(var(--primary)/0.95), hsl(168 60% 18%))',
            }}
          />
          {/* dot grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
          {/* floating shapes */}
          <div className="absolute" style={{ top: '12%', left: '8%', animation: 'float1 8s ease-in-out infinite' }}>
            <div className="w-16 h-16 rounded-2xl rotate-12 border-2 border-white/20" />
          </div>
          <div className="absolute" style={{ top: '50%', right: '10%', animation: 'float2 9s ease-in-out infinite' }}>
            <div className="w-12 h-12 rounded-full border-2 border-white/20" />
          </div>
          <div className="absolute" style={{ bottom: '15%', left: '18%', animation: 'float3 7s ease-in-out infinite' }}>
            <div className="w-8 h-8 rounded-lg rotate-45 border border-white/20" />
          </div>
          <div className="absolute" style={{ top: '20%', right: '25%', animation: 'spinSlow 18s linear infinite' }}>
            <div className="w-20 h-20 rounded-full border border-dashed border-white/15" />
          </div>
          {/* banner text */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
            <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">
              Morpankh Saree · Shopping Cart
            </p>
            <h2 className="text-4xl font-bold mb-2">Shopping Cart</h2>
            <p className="text-white/70 text-sm max-w-md">
              Your selected items are ready for checkout. Review and proceed to complete your order.
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
              Cart Management
            </div>
            <h1 className="text-5xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>
              
            </h1>
          </div>

          {/* CART CONTENT */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 fade-up-2">
            {/* CART ITEMS */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item, index) => (
                <div 
                  key={`${item.productId}-${item.color}-${item.size || ''}-${index}`} 
                  className="cart-card rounded-2xl p-6 border border-border/60 shadow-xl backdrop-blur-xl"
                  style={{ 
                    background: 'hsl(var(--card)/0.85)',
                    animationDelay: `${0.6 + index * 0.1}s`,
                    borderLeft: '3px solid hsl(var(--primary)/0.5)'
                  }}
                >
                  <div className="flex gap-6">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-24 h-28 object-cover rounded-xl border border-border/50" 
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        {item.isPrebooking && (
                          <PrebookingBadge deliveryDays={item.prebookingDeliveryDays || 12} />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Color: {item.color}{item.size ? ` | Size: ${item.size}` : ''}
                      </p>
                      <div className="mb-4">
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-xl" style={{ color: 'hsl(var(--primary))' }}>
                            ₹{(wholesaleEnabled && item.wholesalePrice && item.moq && item.quantity >= item.moq) ? item.wholesalePrice.toLocaleString() : item.price.toLocaleString()}
                          </p>
                          {(wholesaleEnabled && item.wholesalePrice && item.moq && item.quantity >= item.moq) && (
                            <span className="text-muted-foreground text-sm line-through">
                              ₹{item.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {wholesaleEnabled && item.wholesalePrice && item.moq && (
                          <div className="mt-1">
                            <span className={`text-sm font-medium ${item.quantity >= item.moq ? 'text-green-600' : 'text-amber-600'}`}>
                              {item.quantity >= item.moq 
                                ? `Wholesale applied (MOQ: ${item.moq})`
                                : `Add ${item.moq - item.quantity} more for Wholesale Price (₹${item.wholesalePrice})`}
                            </span>
                          </div>
                        )}
                        {item.isPrebooking && (
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center gap-1 text-xs font-medium text-purple-600">
                              <Calendar className="h-3 w-3" />
                              Expected delivery: {item.prebookingDeliveryDays || 10}-{(item.prebookingDeliveryDays || 10) + 5} days
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => updateCartQuantity(item.productId, item.color, item.quantity - 1, item.size)} 
                            className="p-2 border border-border rounded-xl hover:bg-muted transition-all hover:scale-105"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => {
                              const availableStock = getVariantStock(item.productId, item.color, item.size);
                              if (item.quantity >= availableStock) {
                                toast({ 
                                  title: `Only ${availableStock} quantity available for ${item.color}${item.size ? ` (${item.size})` : ''}`, 
                                  variant: 'destructive' 
                                });
                                return;
                              }
                              updateCartQuantity(item.productId, item.color, item.quantity + 1, item.size);
                            }} 
                            className="p-2 border border-border rounded-xl hover:bg-muted transition-all hover:scale-105"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.productId, item.color)} 
                          className="text-destructive hover:bg-destructive/10 p-3 rounded-xl transition-all hover:scale-105"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        {/* Stock indicator */}
                        <div className="text-xs text-muted-foreground">
                          Stock: {getVariantStock(item.productId, item.color, item.size)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ORDER SUMMARY */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="cart-card rounded-2xl p-6 border border-border/60 shadow-xl backdrop-blur-xl" style={{ background: 'hsl(var(--card)/0.85)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary)/0.1)' }}>
                    <ShoppingCart className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <h3 className="text-xl font-semibold" style={{ color: 'hsl(var(--primary))' }}>Order Summary</h3>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-4 border-b border-border/30">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border/30">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-semibold" style={{ color: 'hsl(var(--success))' }}>Free</span>
                  </div>
                </div>
                <div className="border-t border-border/60 pt-4 flex justify-between items-center mb-6">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>₹{subtotal.toLocaleString()}</span>
                </div>
                <Link 
                  href="/checkout" 
                  className="w-full block text-center px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:scale-105 font-medium shadow-lg"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Cart;
