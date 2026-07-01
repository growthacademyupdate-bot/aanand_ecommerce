import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Heart, User, Menu, X, LogOut, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import logo from '@/assets/logo.png';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Category', to: '/products?category=all' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

let navbarRenderCount = 0;

const Navbar = () => {
  navbarRenderCount++;
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cart = useStore((s) => s.cart);
  const wishlist = useStore((s) => s.wishlist);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const isAdmin = useStore((s) => s.isAdmin);
  const userName = useStore((s) => s.userName);
  const logout = useStore((s) => s.logout);
  const cartCount = cart.length;
  const [userMenu, setUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Escape key to close sidebar and body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-50">
        {/* Top Announcement Bar */}
        <div className="bg-foreground text-background hidden md:block">
          <div className="container mx-auto px-6 py-2 flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span> Free Shipping Above ₹1499</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-accent rounded-full"></span> 7 Days Easy Return</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-accent rounded-full"></span> 100% Authentic Products</span>
            </div>
            <div className="flex items-center gap-2">
              Support Number: <span className="font-bold text-accent">+91 90969 71199</span>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <nav className="bg-card">
          <div className="container mx-auto px-6">
            {/* Logo, Search, Icons Row */}
            <div className="flex items-center justify-between h-20 gap-4 md:gap-8 relative">
              <Link href="/" className="shrink-0 relative w-[130px] h-full">
                <div className="absolute top-0 left-0 z-50">
                  <Image src={logo} alt="Morpankh Saree" height={130} width={130} className="object-contain drop-shadow-md" />
                </div>
              </Link>

              {/* Large Search Bar - Center */}
              <div className="hidden md:flex flex-1 max-w-2xl">
                <form onSubmit={handleSearch} className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for sarees, collections..."
                    className="w-full pl-6 pr-12 py-3 rounded-full border border-border/60 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm shadow-inner"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-full hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* Right Icons */}
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <Link href="/wishlist" className="relative group p-2 flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                  <div className="relative">
                    <Heart className="h-6 w-6 transition-transform group-hover:scale-110" strokeWidth={1.5} />
                    {wishlist.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {wishlist.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium hidden md:block">Wishlist</span>
                </Link>
                <Link href="/cart" className="relative group p-2 flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                  <div className="relative">
                    <ShoppingCart className="h-6 w-6 transition-transform group-hover:scale-110" strokeWidth={1.5} />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium hidden md:block">Cart</span>
                </Link>

                <div className="relative">
                  <button onClick={() => setUserMenu(!userMenu)} className="relative group p-2 flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                    <User className="h-6 w-6 transition-transform group-hover:scale-110" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium hidden md:block">Account</span>
                    {isLoggedIn && (
                      <span className="absolute top-1 right-2 w-2 h-2 bg-primary rounded-full border border-card" />
                    )}
                  </button>
                  <AnimatePresence>
                    {userMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-[18px] shadow-xl z-50 py-2 overflow-hidden"
                        >
                          {isLoggedIn ? (
                            <>
                              <div className="px-4 py-3 border-b border-border bg-muted/30">
                                <p className="text-sm font-semibold text-foreground">{userName}</p>
                                <p className="text-xs text-muted-foreground">{isAdmin ? 'Admin' : 'Customer'}</p>
                              </div>
                              <Link href="/profile" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">My Profile</Link>
                              <Link href="/orders" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">My Orders</Link>
                              {isAdmin && (
                                <Link href="/admin" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">Admin Panel</Link>
                              )}
                              <button onClick={() => { logout(); toast({ title: 'Logged out successfully' }); setUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2">
                                <LogOut className="h-4 w-4" /> Logout
                              </button>
                            </>
                          ) : (
                            <>
                              <Link href="/login" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">Customer Login</Link>
                              <Link href="/register" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">Register</Link>
                            </>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 text-foreground hover:text-primary transition-colors">
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Navigation Links Row (Desktop) */}
            <div className="hidden md:flex items-center justify-center h-12 gap-6">
              {navLinks.map((link) => {
                const active = isActive(link.to);
                return (
                  <Link 
                    key={link.to} 
                    href={link.to} 
                    className={`relative px-5 py-2 text-sm font-medium transition-all duration-300 rounded-full ${
                      active 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'text-foreground hover:text-primary hover:bg-muted/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/50 z-[60] md:hidden backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-80 bg-card border-r border-border shadow-2xl z-[70] md:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
                <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                  <Image src={logo} alt="Morpankh Saree" height={40} width={40} className="object-contain" />
                  <span className="text-lg font-display font-bold text-primary">Morpankh</span>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Mobile Search */}
              <div className="p-4 border-b border-border">
                <form onSubmit={handleSearch} className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-4 pr-10 py-2 rounded-xl border border-border/60 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>

              <div className="flex flex-col p-4 gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    href={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
                      isActive(link.to)
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
