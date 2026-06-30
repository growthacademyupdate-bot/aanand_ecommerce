"use client";



import { useState, useEffect } from 'react';

import { SlidersHorizontal, X, Search, ShoppingBag, Loader2 } from 'lucide-react';

import PublicLayout from '@/components/PublicLayout';

import ProductCard from '@/components/ProductCard';

import { useStore } from '@/store/useStore';

import { Category, Product } from '@/data/mockData';

import { Slider } from '@/components/ui/slider';



const highlightFilters = [

  { label: 'Best Seller', key: 'featured' },

  { label: 'Limited Offer', key: 'limited' },

  { label: 'Sale', key: 'sale' },

  { label: 'New Arrival', key: 'new' },

  { label: 'Trending', key: 'trending' },

  { label: 'Premium', key: 'premium' },

  { label: 'Live Special', key: 'liveSpecial' },

];



const Products = ({ initialCategory = '', initialHighlight = '', initialSubcategoryId = '' }: { initialCategory?: string; initialHighlight?: string; initialSubcategoryId?: string }) => {

  const storeCategories = useStore((s) => s.categories);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(initialSubcategoryId);
  const [selectedHighlight, setSelectedHighlight] = useState(initialHighlight);

  const [sortBy, setSortBy] = useState('');

  const [selectedSize, setSelectedSize] = useState('');

  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);

  const [page, setPage] = useState(1);



  const maxPrice = 20000;



  const clearFilters = () => {

    setSelectedCategory('');
    setSelectedSubcategoryId('');
    setSelectedHighlight('');
    setSelectedSize('');

    setAvailableSizes([]);

    setSearchQuery('');

    setPriceRange([0, maxPrice]);

    setSortBy('');

    setPage(1);

  };



  const hasActiveFilters = selectedCategory || selectedSubcategoryId || selectedHighlight || selectedSize || searchQuery || priceRange[0] > 0 || priceRange[1] < maxPrice;



  const pageSize = 12;

  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedSubcategoryId, selectedSize, selectedHighlight, sortBy, searchQuery, priceRange]);

  useEffect(() => {
    const loadProducts = async () => {
      setProductsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(pageSize));
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedSubcategoryId) params.set('subcategoryId', selectedSubcategoryId);
        if (selectedHighlight) params.set('highlight', selectedHighlight);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (sortBy) params.set('sort', sortBy);
        if (selectedSize) params.set('size', selectedSize);
        if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
        if (priceRange[1] < maxPrice) params.set('maxPrice', String(priceRange[1]));

        const response = await fetch(`/api/products?${params.toString()}`);
        const result = await response.json();
        if (response.ok && result?.success && Array.isArray(result.data)) {
          setProducts(result.data as Product[]);
          setTotalProducts(Number(result.pagination?.total) || result.data.length);
          setTotalPages(Number(result.pagination?.totalPages) || 1);
        } else {
          setProducts([]);
          setTotalProducts(0);
          setTotalPages(1);
        }
      } catch {
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        setProductsLoading(false);
      }
    };
    void loadProducts();
  }, [page, selectedCategory, selectedSubcategoryId, selectedSize, selectedHighlight, sortBy, searchQuery, priceRange, maxPrice]);

  useEffect(() => {
    const fetchCategories = async () => {

      try {

        const response = await fetch('/api/categories');

        const result = await response.json();

        if (response.ok && result?.success && Array.isArray(result.data)) {

          setCategories(result.data as Category[]);

          return;

        }

      } catch {

        // ignore

      }

      setCategories(Array.isArray(storeCategories) ? (storeCategories as unknown as Category[]) : []);

    };



    fetchCategories();

  }, [storeCategories]);



  useEffect(() => {

    if (page > totalPages) setPage(totalPages);

  }, [page, totalPages]);



  useEffect(() => {
    if (!selectedCategory) {
      setAvailableSizes([]);
      setSelectedSize('');
      return;
    }

    const loadSizes = async () => {
      try {
        const params = new URLSearchParams({
          category: selectedCategory,
          limit: '48',
          page: '1',
        });
        const response = await fetch(`/api/products?${params.toString()}`);
        const result = await response.json();
        if (response.ok && result?.success && Array.isArray(result.data)) {
          const uniqueSizes = Array.from(
            new Set(
              (result.data as Product[])
                .filter((p) => p.sizes && p.sizes.length > 0)
                .flatMap((p) => p.sizes || [])
            )
          ).sort();
          setAvailableSizes(uniqueSizes);
        } else {
          setAvailableSizes([]);
        }
      } catch {
        setAvailableSizes([]);
      }
      setSelectedSize('');
    };

    void loadSizes();
  }, [selectedCategory]);

  const startIndex = totalProducts === 0 ? 0 : (page - 1) * pageSize;
  const endIndexExclusive = Math.min(startIndex + products.length, totalProducts);
  const pagedProducts = products;



  const handleSetPage = (nextPage: number) => {

    const clamped = Math.min(totalPages, Math.max(1, nextPage));

    setPage(clamped);

    if (typeof window !== 'undefined') {

      window.scrollTo({ top: 0, behavior: 'smooth' });

    }

  };



  const getPageItems = () => {

    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);



    const items: Array<number | 'ellipsis'> = [1];



    const left = Math.max(2, page - 1);

    const right = Math.min(totalPages - 1, page + 1);



    if (left > 2) items.push('ellipsis');

    for (let p = left; p <= right; p++) items.push(p);

    if (right < totalPages - 1) items.push('ellipsis');



    items.push(totalPages);

    return items;

  };



  return (

    <PublicLayout>

      <div className="min-h-screen bg-[#F9FAFB] pb-12">

        {/* Mobile filter drawer - outside stacking contexts */}
        {filterOpen && (
          <div className="md:hidden fixed inset-0 z-[9999] bg-foreground/50">
            <div className="absolute right-0 top-0 h-full w-72 bg-card p-6 animate-slide-in-right overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg font-semibold">Filters</h3>
                <button onClick={() => setFilterOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-2 mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Category</p>
                <button onClick={() => { setSelectedCategory(''); setFilterOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${!selectedCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>All</button>
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => { setSelectedCategory(cat.slug); setFilterOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${selectedCategory === cat.slug ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{cat.name}</button>
                ))}
              </div>
              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Price Range</p>
                <div className="px-2">
                  <Slider min={0} max={maxPrice} step={500} value={priceRange} onValueChange={(val) => setPriceRange(val as [number, number])} />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>₹{priceRange[0].toLocaleString()}</span>
                    <span>₹{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Highlights</p>
                {highlightFilters.map((f) => (
                  <button key={f.key} onClick={() => { setSelectedHighlight(selectedHighlight === f.key ? '' : f.key); setFilterOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${selectedHighlight === f.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{f.label}</button>
                ))}
              </div>
              {selectedCategory && availableSizes.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Size</p>
                  <div className="space-y-2">
                    <button onClick={() => { setSelectedSize(''); setFilterOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${!selectedSize ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>All Sizes</button>
                    {availableSizes.map((size) => (
                      <button key={size} onClick={() => { setSelectedSize(size); setFilterOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${selectedSize === size ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{size}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DRAGGABLE CONTENT ── */}

        <div

          className="container mx-auto px-4 py-12 relative z-10"

        >

          {/* page pill + title */}

          {/* <div className="text-center mb-14 fade-up-1">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">

              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />

              Product Explorer

            </div>

            <h1 className="text-5xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>

              {totalProducts} Products

            </h1>

          </div> */}



          <div className="flex gap-8">

            <aside className="hidden md:block w-64 shrink-0">

              <div className="space-y-8">

                <div>

                  <div className="text-base font-bold text-gray-900 mb-4">Category</div>

                  <div className="space-y-2">

                    <button

                      onClick={() => setSelectedCategory('')}

                      className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${!selectedCategory ? 'bg-[#10B981] text-white' : 'bg-[#F3F4F6] text-gray-700 hover:bg-[#E5E7EB]'}`}

                    >

                      All

                    </button>

                    {categories.map((cat) => (

                      <button

                        key={cat.id}

                        onClick={() => setSelectedCategory(cat.slug)}

                        className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${selectedCategory === cat.slug ? 'bg-[#10B981] text-white' : 'bg-[#F3F4F6] text-gray-700 hover:bg-[#E5E7EB]'}`}

                      >

                        {cat.name}

                      </button>

                    ))}

                  </div>

                </div>



                <div>

                  <div className="text-base font-bold text-gray-900 mb-4">Highlight</div>

                  <div className="space-y-2">

                    {highlightFilters.map((f) => (

                      <button

                        key={f.key}

                        onClick={() => setSelectedHighlight(selectedHighlight === f.key ? '' : f.key)}

                        className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${selectedHighlight === f.key ? 'bg-[#10B981] text-white' : 'bg-[#F3F4F6] text-gray-700 hover:bg-[#E5E7EB]'}`}

                      >

                        {f.label}

                      </button>

                    ))}

                  </div>

                </div>

                <div>

                  <div className="text-base font-bold text-gray-900 mb-4">Price Range</div>

                  <div className="px-1">

                    <Slider

                      min={0}

                      max={maxPrice}

                      step={500}

                      value={priceRange}

                      onValueChange={(val) => setPriceRange(val as [number, number])}

                    />

                    <div className="flex justify-between mt-3 text-xs text-gray-500 font-medium">

                      <span>₹{priceRange[0].toLocaleString()}</span>

                      <span>₹{priceRange[1].toLocaleString()}</span>

                    </div>

                  </div>

                </div>

                {hasActiveFilters && (

                  <button onClick={clearFilters} className="text-sm text-red-500 hover:underline font-medium">

                    Clear All Filters

                  </button>

                )}

              </div>

            </aside>



            <div className="flex-1 min-w-0">

              {/* Search Bar */}

              <div className="relative max-w-lg mx-auto md:mx-0 mb-6 fade-up-3">

                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <input

                  type="text"

                  value={searchQuery}

                  onChange={(e) => setSearchQuery(e.target.value)}

                  placeholder="Search sarees by name..."

                  className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"

                />

              </div>



              {/* Filters bar */}

              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">

                <button onClick={() => setFilterOpen(!filterOpen)} className="md:hidden btn-outline-primary flex items-center gap-2 text-sm py-2 px-4">

                  <SlidersHorizontal className="h-4 w-4" /> Filters

                </button>

                <div className="flex items-center gap-3">

                  {hasActiveFilters && (

                    <button onClick={clearFilters} className="text-xs text-destructive hover:underline">Clear All</button>

                  )}

                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-card border border-border rounded-lg px-4 py-2 text-sm">

                    <option value="">Sort by</option>

                    <option value="price-low">Price: Low to High</option>

                    <option value="price-high">Price: High to Low</option>

                    <option value="newest">Newest First</option>

                  </select>

                  {selectedCategory && availableSizes.length > 0 && (

                    <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="bg-card border border-border rounded-lg px-4 py-2 text-sm">

                      <option value="">Select Size</option>

                      {availableSizes.map((size) => (

                        <option key={size} value={size}>{size}</option>

                      ))}

                    </select>

                  )}

                </div>

              </div>






              {/* Grid */}

              {productsLoading ? (
                <div className="text-center py-20 text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading products...
                </div>
              ) : pagedProducts.length === 0 ? (

                <div className="text-center py-20 text-muted-foreground">No products found matching your filters.</div>

              ) : (

                <>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">

                    {pagedProducts.map((p, index) => (

                      <div key={`${p.id}-${index}`} className="product-card" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>

                        <ProductCard product={p} />

                      </div>

                    ))}

                  </div>



                  <div className="mt-10 flex flex-col items-center gap-4">

                    <div className="text-sm text-muted-foreground">

                      Showing {startIndex + 1} - {endIndexExclusive} of {totalProducts} products

                    </div>



                    {totalPages > 1 && (

                      <div className="flex items-center justify-center gap-2 flex-wrap">

                        <button

                          type="button"

                          onClick={() => {

                            if (page > 1) handleSetPage(page - 1);

                          }}

                          disabled={page <= 1}

                          className="px-4 py-2 rounded-lg border border-border bg-card text-sm text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50"

                        >

                          Previous

                        </button>



                        {getPageItems().map((it, idx) => {

                          if (it === 'ellipsis') {

                            return (

                              <span key={`ellipsis-${idx === 1 ? 'start' : 'end'}`} className="px-2 text-muted-foreground">

                                ...

                              </span>

                            );

                          }



                          const isActive = it === page;

                          return (

                            <button

                              key={`page-${it}`}

                              type="button"

                              onClick={() => handleSetPage(it)}

                              className={`h-10 min-w-10 px-3 rounded-lg border text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-muted/50'}`}

                              aria-current={isActive ? 'page' : undefined}

                            >

                              {it}

                            </button>

                          );

                        })}



                        <button

                          type="button"

                          onClick={() => {

                            if (page < totalPages) handleSetPage(page + 1);

                          }}

                          disabled={page >= totalPages}

                          className="px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50"

                        >

                          Next

                        </button>

                      </div>

                    )}

                  </div>

                </>

              )}

            </div>

          </div>

        </div>

      </div>

    </PublicLayout>

  );

};



export default Products;

