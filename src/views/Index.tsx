import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Star, Plus, Send } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import ProductCard from '@/components/ProductCard';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import { Category, Product } from '@/data/mockData';

let indexRenderCount = 0;
let productListRenderCount = 0;

const Section = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <section className="py-6 md:py-10">
    <div className="container mx-auto px-4">
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
      <div className="mt-4 md:mt-6">{children}</div>
    </div>
  </section>
);

const ProductSection = ({
  title,
  subtitle,
  items,
  filterParam,
  bg,
}: {
  title: string;
  subtitle: string;
  items: Product[];
  filterParam: string;
  bg?: string;
}) => {
  productListRenderCount++;
  console.log(`[DEBUG] ProductList (ProductSection) Render Count: ${productListRenderCount}`);
  const show = items.slice(0, 4);
  if (items.length === 0) return null;
  return (
    <section className={`py-6 md:py-10 ${bg || ''}`}>
      <div className="container mx-auto px-4">
        <h2 className="section-title">{title}</h2>
        <p className="section-subtitle">{subtitle}</p>
        <div className="mt-4 md:mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {show.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="text-center mt-4 md:mt-6">
          <Link
            href={`/products?highlight=${filterParam}`}
            className="btn-outline-primary inline-flex items-center gap-2"
          >
            View More <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

type ApprovedReviewItem = {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  avatar: string;
  createdAt: string | null;
};

const Index = () => {
  indexRenderCount++;
  console.log(`[DEBUG] Home Page (Index) Render Count: ${indexRenderCount}`);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const userName = useStore((s) => s.userName);

  // ─── All state (declared once, in order) ──────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>('All');
  const [homeProducts, setHomeProducts] = useState<{
    featured: Product[];
    newArrivals: Product[];
    sale: Product[];
    premium: Product[];
    trending: Product[];
    limitedOffer: Product[];
    liveSpecial: Product[];
  }>({
    featured: [],
    newArrivals: [],
    sale: [],
    premium: [],
    trending: [],
    limitedOffer: [],
    liveSpecial: [],
  });
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [approvedReviews, setApprovedReviews] = useState<ApprovedReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isReviewsPaused, setIsReviewsPaused] = useState(false);

  const subcategoryScrollRef = useRef<HTMLDivElement>(null);
  const [isSubcategoryHovered, setIsSubcategoryHovered] = useState(false);

  // ─── Subcategory auto-slide ────────────────────────────────────────────────
  useEffect(() => {
    if (isSubcategoryHovered) return;
    const interval = setInterval(() => {
      if (subcategoryScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = subcategoryScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          subcategoryScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          subcategoryScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isSubcategoryHovered]);

  const scrollSubcategoryNext = () => {
    if (subcategoryScrollRef.current) {
      subcategoryScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const scrollSubcategoryPrev = () => {
    if (subcategoryScrollRef.current) {
      subcategoryScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  // ─── Loading skeleton timer ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadHome = async () => {
      try {
        const res = await fetch('/api/products/home');
        const json = await res.json();
        if (res.ok && json?.success && json.data) {
          setHomeProducts(json.data);
        }
      } catch {
        // ignore
      }
    };
    void loadHome();
  }, []);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length <= 2) {
      setSearchResults([]);
      return;
    }
    const loadSearch = async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=24`);
        const json = await res.json();
        if (res.ok && json?.success && Array.isArray(json.data)) {
          setSearchResults(json.data as Product[]);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      }
    };
    void loadSearch();
  }, [debouncedQuery]);

  // ─── Fetch approved reviews ────────────────────────────────────────────────
  useEffect(() => {
    const loadApprovedReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch('/api/reviews?approved=true');
        const data = await res.json();
        if (res.ok) setApprovedReviews(data.reviews || []);
      } catch {
        // ignore
      } finally {
        setReviewsLoading(false);
      }
    };
    loadApprovedReviews();
  }, []);

  // ─── Fetch categories ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        if (response.ok && result?.success && Array.isArray(result.data)) {
          setCategories(result.data as Category[]);
        } else {
          setCategories([]);
        }
      } catch {
        setCategories([]);
      }
    };
    const fetchSubcategories = async () => {
      try {
        const response = await fetch('/api/subcategories');
        const result = await response.json();
        if (response.ok && result?.success && Array.isArray(result.data)) {
          setSubcategories(result.data);
        } else {
          setSubcategories([]);
        }
      } catch {
        setSubcategories([]);
      }
    };
    fetchCategories();
    fetchSubcategories();
  }, []);

  // ─── Debounce search input (300ms) ────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Dropdown: only show for 1-2 char quick-peek ─────────────────────────
  useEffect(() => {
    setShowDropdown(searchQuery.trim().length > 0 && searchQuery.trim().length <= 2);
  }, [searchQuery]);

  // ─── Click outside to close dropdown ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('#search-box')) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Hero slider auto-slide ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // ─── Hero images array ───────────────────────────────────────────────────
  const heroImages = [
    '/Hero section Banner image.png',
    '/Hero section Banner image 2.png',
    '/Hero section banner image 3.png',
  ];

  // ─── Slider navigation handlers ───────────────────────────────────────────
  const goToSlide = (index: number) => setCurrentSlide(index);
  const goToPrevious = () => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length);

  // ─── Derived data (single source of truth: debouncedQuery) ───────────────
  const limitedOfferProducts = homeProducts.limitedOffer;
  const liveSpecialProducts = homeProducts.liveSpecial;
  const bestSellers = homeProducts.featured;
  const newArrivals = homeProducts.newArrivals;
  const saleProducts = homeProducts.sale;
  const premiumSarees = homeProducts.premium;
  const trendingSarees = homeProducts.trending;

  const isSearching = debouncedQuery.trim().length > 0;
  const isFullSearch = debouncedQuery.trim().length > 2;

  const filteredCategories = isSearching
    ? categories.filter((cat) =>
        cat.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : categories;

  const filteredProducts = isSearching ? searchResults : [];

  // ─── Review submit handler ────────────────────────────────────────────────
  const handleReviewSubmit = async () => {
    if (reviewSubmitting) return;
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reviewForm.name,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Review submitted!', description: 'It will appear after admin approval.' });
        setReviewForm({ name: isLoggedIn ? userName : '', rating: 5, comment: '' });
        setReviewModal(false);
      } else {
        toast({ title: data.error || 'Failed to submit review', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to submit review', variant: 'destructive' });
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Subcomponents Section and ProductSection have been moved outside the component to prevent unnecessary unmounting/remounting

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="h-[400px] skeleton-loading mb-12 rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={`skeleton-${i}`} className="space-y-3">
                <div className="aspect-[3/4] skeleton-loading rounded-xl" />
                <div className="h-4 skeleton-loading w-3/4" />
                <div className="h-4 skeleton-loading w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </PublicLayout>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <PublicLayout>

      {/* Hero Slider */}
      <section className="relative overflow-hidden group">
        <div className="relative w-full overflow-hidden bg-muted/10">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {heroImages.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Anand Wholesale Banner ${idx + 1}`}
                className="w-full h-auto object-contain flex-shrink-0"
              />
            ))}
          </div>
          
          {/* Previous/Next Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 md:p-3 rounded-full transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronRight className="h-6 w-6 rotate-180" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 md:p-3 rounded-full transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>



      {/* ── Full search results (>2 chars) OR homepage sections ── */}
      {isFullSearch ? (
        // ─── Search Results View ──────────────────────────────────────────────
        <section className="py-12 bg-muted/40 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold">
                Results for &ldquo;{debouncedQuery}&rdquo;
              </h2>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear ✕
              </button>
            </div>

            {filteredCategories.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-medium mb-4">Categories</h3>
                <div className="flex flex-wrap gap-3">
                  {filteredCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.slug}`}
                      className="px-4 py-2 bg-card border border-border rounded-full text-sm hover:bg-muted transition"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Products
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({filteredProducts.length} found)
                  </span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No matching products found.</p>
            )}
          </div>
        </section>
      ) : (
        // ─── Normal Homepage Sections ─────────────────────────────────────────
        <>
          {/* Category Carousel */}
          <Section title="Shop by Category" subtitle="Explore our curated collection">
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No categories available.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-8 w-full">
                {/* Category Pill Buttons */}
                <div className="flex flex-wrap justify-center gap-3 w-full px-4">
                  <button
                    onClick={() => setSelectedCategoryId('All')}
                    className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                      selectedCategoryId === 'All'
                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                        : 'bg-muted text-foreground hover:bg-primary/10'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                        selectedCategoryId === cat.id
                          ? 'bg-primary text-primary-foreground shadow-md scale-105'
                          : 'bg-muted text-foreground hover:bg-primary/10'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Subcategories Slider */}
                <div 
                  className="relative w-full max-w-7xl mx-auto pt-4 px-8 group"
                  onMouseEnter={() => setIsSubcategoryHovered(true)}
                  onMouseLeave={() => setIsSubcategoryHovered(false)}
                >
                  {/* Next/Prev Arrows */}
                  <button
                    onClick={scrollSubcategoryPrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-md text-foreground p-2 rounded-full transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 hover:scale-110 border border-border"
                    aria-label="Previous subcategories"
                  >
                    <ChevronRight className="h-5 w-5 rotate-180" />
                  </button>
                  <button
                    onClick={scrollSubcategoryNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-md text-foreground p-2 rounded-full transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 hover:scale-110 border border-border"
                    aria-label="Next subcategories"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {(() => {
                    const activeSubcategories = selectedCategoryId === 'All' 
                      ? subcategories 
                      : subcategories.filter(sub => sub.categoryId === selectedCategoryId);
                    
                    if (activeSubcategories.length === 0) {
                      return (
                         <div className="text-center py-8 text-muted-foreground">
                           No subcategories found.
                         </div>
                      );
                    }

                    return (
                      <div 
                        ref={subcategoryScrollRef}
                        className="subcategories-scroll flex w-full gap-4 sm:gap-6 pb-6 overflow-x-auto scroll-smooth snap-x snap-mandatory"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        <style>{`
                          .subcategories-scroll::-webkit-scrollbar {
                            display: none;
                          }
                        `}</style>
                        {activeSubcategories.map((sub, idx) => (
                          <Link
                            key={`${sub.id}-${idx}`}
                            href={`/products?category=${sub.categorySlug}&subcategoryId=${sub.id}`}
                            className="snap-start group/item flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] relative aspect-square rounded-full overflow-hidden card-hover border border-border/30 shadow-sm"
                          >
                            <img
                              src={sub.image || '/placeholder.svg'}
                              alt={sub.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent flex items-end justify-center p-4">
                              <span className="text-background font-display font-medium text-sm sm:text-base text-center leading-tight drop-shadow-md">
                                {sub.name}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </Section>

          {/* Product Sections */}
          <ProductSection
            title="Limited Offer"
            subtitle="Hurry up! Limited stock available"
            items={limitedOfferProducts}
            filterParam="limited"
            bg="bg-muted/50"
          />
          <ProductSection
            title="Live Special"
            subtitle="Exclusive live deals for you"
            items={liveSpecialProducts}
            filterParam="liveSpecial"
            bg="bg-background"
          />
          <ProductSection
            title="Best Sellers"
            subtitle="Our most loved sarees"
            items={bestSellers}
            filterParam="featured"
            bg="bg-muted/30"
          />
          <ProductSection
            title="New Arrivals"
            subtitle="Fresh additions to our collection"
            items={newArrivals}
            filterParam="new"
            bg="bg-background"
          />
          <ProductSection
            title="Sale"
            subtitle="Grab these deals before they're gone"
            items={saleProducts}
            filterParam="sale"
            bg="bg-muted/50"
          />
          <ProductSection
            title="Premium Sarees"
            subtitle="Luxury craftsmanship for special occasions"
            items={premiumSarees}
            filterParam="premium"
            bg="bg-background"
          />
          <ProductSection
            title="Trending products"
            subtitle="What's popular right now"
            items={trendingSarees}
            filterParam="trending"
            bg="bg-muted/30"
          />
        </>
      )}

      {/* Reviews — always visible */}
      <section className="py-6 md:py-10 bg-muted">
        <style>{`
          @keyframes reviewsMarqueeLTR {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0%); }
          }
        `}</style>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h2 className="section-title">Customer Reviews</h2>
          </div>
          <div className="text-center mb-8">
            <button
              onClick={() => {
                setReviewForm({ name: isLoggedIn ? userName : '', rating: 5, comment: '' });
                setReviewModal(true);
              }}
              className="btn-outline-primary inline-flex items-center gap-2 text-sm py-2 px-4"
            >
              <Plus className="h-4 w-4" /> Add Review
            </button>
          </div>
          {reviewsLoading ? (
            <div className="text-center text-sm text-muted-foreground">Loading reviews...</div>
          ) : approvedReviews.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">No reviews yet.</div>
          ) : (
            <div
              className="relative overflow-hidden"
              onMouseEnter={() => setIsReviewsPaused(true)}
              onMouseLeave={() => setIsReviewsPaused(false)}
            >
              <div
                className="flex w-max gap-6"
                style={{
                  animation: `reviewsMarqueeLTR 30s linear infinite`,
                  animationPlayState: isReviewsPaused ? 'paused' : 'running'
                }}
              >
                {[...approvedReviews, ...approvedReviews].map((review, idx) => (
                  <div
                    key={`${review._id}-${idx}`}
                    className="bg-card rounded-xl p-6 card-hover border border-border flex-shrink-0 w-[280px]"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                        {review.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{review.name}</p>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={`star-${i}`}
                              className={`h-3 w-3 ${
                                i < review.rating ? 'text-gold fill-gold' : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
            <h3 className="font-display text-lg font-semibold mb-4">Write a Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  value={reviewForm.name}
                  onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: r })}
                    >
                      <Star
                        className={`h-6 w-6 cursor-pointer transition-colors ${
                          r <= reviewForm.rating ? 'text-gold fill-gold' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Comment</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={3}
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setReviewModal(false)}
                  disabled={reviewSubmitting}
                  className="flex-1 btn-outline-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewSubmit}
                  disabled={reviewSubmitting}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reviewSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA — always visible */}
      <section className="py-24 relative overflow-hidden bg-background">
        {/* Subtle pattern or image (optional, removing for clean white look as requested) */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?q=80&w=2000&auto=format&fit=crop')] opacity-5 bg-cover bg-fixed bg-center -z-10 mix-blend-multiply"></div>
        
        <div className="container mx-auto px-6 text-center z-10">
          <div className="max-w-3xl mx-auto bg-card border border-border/50 rounded-[32px] p-8 md:p-12 shadow-xl shadow-primary/5">
            <span className="text-primary font-bold tracking-widest uppercase text-xs mb-4 inline-block">Experience Luxury</span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Discover Your <span className="text-primary italic">Perfect Saree</span>
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Browse our complete collection of handcrafted sarees from across India. Elevate your wardrobe with timeless elegance.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-10 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1"
            >
              Browse All Products <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
};

export default Index;