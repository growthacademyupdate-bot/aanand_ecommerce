import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { Category } from '@/data/mockData';
import { Loader2, ShoppingBag, Search } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      const name = String(c.name || '').toLowerCase();
      const slug = String(c.slug || '').toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
  }, [categories, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/categories', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const result = await response.json();

      if (response.ok && result.success && Array.isArray(result.data)) {
        setCategories(result.data);
      } else {
        console.error(
          'Failed to fetch categories:',
          result.error || `HTTP ${response.status}`
        );
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

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
        @keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
        .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}
        .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}
        .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}
        .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}
        .category-card:hover{transform:translateY(-12px) scale(1.05) rotate-2;box-shadow:0 32px 64px hsl(var(--primary)/0.2)}
        .category-card{transition:transform 0.4s ease,box-shadow 0.4s ease}
        .logo-pulse{animation:zoomPulse 4s ease-in-out infinite}
        .spin-ring{animation:spinSlow 22s linear infinite}
        .categories-container:hover .floating-orb{animation-play-state:paused}
        .categories-container:hover .banner-shape{animation-play-state:paused}
      `}</style>

      <div className="min-h-screen relative overflow-hidden categories-container">
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
          className="absolute rounded-full pointer-events-none floating-orb"
          style={{
            width: 380, height: 380, top: -80, right: -100,
            background: 'radial-gradient(circle, hsl(var(--primary)/0.12), transparent 70%)',
            animation: 'float1 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none floating-orb"
          style={{
            width: 260, height: 260, bottom: 60, left: -80,
            background: 'radial-gradient(circle, hsl(var(--secondary)/0.10), transparent 70%)',
            animation: 'float2 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none floating-orb"
          style={{
            width: 180, height: 180, top: '40%', left: '5%',
            background: 'radial-gradient(circle, hsl(var(--primary)/0.07), transparent 70%)',
            animation: 'float3 9s ease-in-out infinite',
          }}
        />

        {/* ── BANNER ── */}
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
          <div className="absolute banner-shape" style={{ top: '12%', left: '8%', animation: 'float1 8s ease-in-out infinite' }}>
            <div className="w-16 h-16 rounded-2xl rotate-12 border-2 border-white/20" />
          </div>
          <div className="absolute banner-shape" style={{ top: '50%', right: '10%', animation: 'float2 9s ease-in-out infinite' }}>
            <div className="w-12 h-12 rounded-full border-2 border-white/20" />
          </div>
          <div className="absolute banner-shape" style={{ bottom: '15%', left: '18%', animation: 'float3 7s ease-in-out infinite' }}>
            <div className="w-8 h-8 rounded-lg rotate-45 border border-white/20" />
          </div>
          <div className="absolute banner-shape" style={{ top: '20%', right: '25%', animation: 'spinSlow 18s linear infinite' }}>
            <div className="w-20 h-20 rounded-full border border-dashed border-white/15" />
          </div>
          {/* banner text */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
            <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">
              Morpankh Saree · Categories
            </p>
            <h2 className="text-4xl font-bold mb-2">Categories</h2>
            <p className="text-white/70 text-sm max-w-md">
              Explore our curated collection of traditional and contemporary sarees across different categories.
            </p>
          </div>
        </div>

        {/* ── DRAGGABLE CONTENT ── */}
        <div
          className="container mx-auto px-4 py-12 relative z-10"
        >
          {/* page pill + title */}
          <div className="text-center mb-14 fade-up-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Category Explorer
            </div>
            <h1 className="text-5xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>
              
            </h1>
          </div>

          {/* CATEGORIES CONTENT */}
          <div className="max-w-6xl mx-auto mb-10 fade-up-2">
            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto mb-8 fade-up-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No categories found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCategories.map((cat, index) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="category-card group relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/60 shadow-xl backdrop-blur-xl"
                  style={{
                    background: 'hsl(var(--card)/0.85)',
                    animationDelay: `${0.6 + index * 0.1}s`,
                    borderLeft: '3px solid hsl(var(--primary)/0.5)'
                  }}
                >
                  <div className="relative h-full">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent flex flex-col items-center justify-end p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary)/0.2)' }}>
                          <ShoppingBag className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-xl">{cat.name}</h3>
                      </div>
                      <p className="text-white/90 text-sm">{cat.productCount} Products</p>
                    </div>
                  </div>
                </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Categories;
