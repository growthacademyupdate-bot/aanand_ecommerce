import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Heart, User, Menu, X, LogOut, Send } from 'lucide-react';
import { useStore } from '@/store/useStore';
import logo from '@/assets/logo.png';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Category', to: '/categories' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

let navbarRenderCount = 0;
let notificationFetchCount = 0;

const Navbar = () => {
  navbarRenderCount++;
  console.log(`[DEBUG] Navbar Render Count: ${navbarRenderCount}`);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cart = useStore((s) => s.cart);
  const wishlist = useStore((s) => s.wishlist);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const isAdmin = useStore((s) => s.isAdmin);
  const userName = useStore((s) => s.userName);
  const logout = useStore((s) => s.logout);
  const cartCount = cart.length;
  const [userMenu, setUserMenu] = useState(false);

  const [announcement, setAnnouncement] = useState<{ text: string; enabled: boolean } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        notificationFetchCount++;
        console.log(`[DEBUG] Notification (Announcement Bar) Fetch Count: ${notificationFetchCount}`);
        const res = await fetch('/api/announcement-bar', { cache: 'no-store' });
        const data = await res.json();
        if (!mounted) return;
        if (res.ok && data && typeof data.enabled === 'boolean' && typeof data.text === 'string') {
          setAnnouncement({ text: data.text, enabled: data.enabled });
        } else {
          setAnnouncement(null);
        }
      } catch {
        if (!mounted) return;
        setAnnouncement(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Handle Escape key to close sidebar and body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Prevent body scroll when sidebar is open
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

  return (
    <>
    <div className="sticky top-0 z-50">
  {announcement?.enabled ? (
    <div className="bg-green-600 text-gray-200 overflow-hidden">
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: inline-flex;
          align-items: center;
          gap: 40px;
          white-space: nowrap;
          width: max-content;
          animation: marquee-scroll 50s linear infinite;
          will-change: transform;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="py-2">
        <div className="marquee-track">
          {Array.from({ length: 12 }).flatMap((_, i) => [
            <div key={`a-${i}`} className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Send className="h-4 w-4 shrink-0" />
              <span>{announcement.text}</span>
            </div>,
            <span key={`a-dot-${i}`} className="inline-block w-1 h-1 rounded-full bg-white/30 shrink-0" />,
          ])}
          {Array.from({ length: 12 }).flatMap((_, i) => [
            <div key={`b-${i}`} className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Send className="h-4 w-4 shrink-0" />
              <span>{announcement.text}</span>
            </div>,
            <span key={`b-dot-${i}`} className="inline-block w-1 h-1 rounded-full bg-white/30 shrink-0" />,
          ])}
        </div>
      </div>
    </div>
  ) : null}

      <nav className="bg-white/98 backdrop-blur-lg border-b border-gray-100 shadow-md">
        <div className="container mx-auto px-6 flex items-center justify-between h-18">
          <Link href="/" className="flex items-center gap-2">
            <Image src={logo} alt="Morpankh Saree" height={120} width={120} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                href={link.to}
                className={
                  isActive(link.to)
                    ? 'relative text-sm font-semibold text-white px-5 py-2.5 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105'
                    : 'relative text-sm font-medium text-gray-700 hover:text-green-600 px-5 py-2.5 rounded-full hover:bg-green-50 transition-all duration-300'
                }
              >
                {link.label}
                {isActive(link.to) && (
                  <span className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
                )}
              </Link>
            ))}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3">
          <Link href="/wishlist" className="relative group p-3 text-gray-600 hover:text-green-600 transition-all duration-300 rounded-full hover:bg-green-50">
            <Heart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md animate-pulse">
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative group p-3 text-gray-600 hover:text-green-600 transition-all duration-300 rounded-full hover:bg-green-50">
            <ShoppingCart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User dropdown */}
          <div className="relative">
            <button onClick={() => setUserMenu(!userMenu)} className="relative group p-3 text-gray-600 hover:text-green-600 transition-all duration-300 rounded-full hover:bg-green-50">
              <User className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              {isLoggedIn && (
                <span className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white" />
              )}
            </button>
            {userMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 py-3 overflow-hidden">
                  <div className="absolute top-0 right-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45 -translate-y-2" />
                  {isLoggedIn ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                        <p className="text-sm font-semibold text-gray-800">{userName}</p>
                        <p className="text-xs text-gray-600">{isAdmin ? 'Admin' : 'Customer'}</p>
                      </div>
                      <Link href="/profile" onClick={() => setUserMenu(false)} className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                        My Profile
                      </Link>
                      <Link href="/orders" onClick={() => setUserMenu(false)} className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                        My Orders
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setUserMenu(false)} className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3">
                          <span className="w-2 h-2 bg-gray-400 rounded-full" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          toast({ title: 'Logged out successfully' });
                          setUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setUserMenu(false)} className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                        Customer Login
                      </Link>
                      <Link href="/register" onClick={() => setUserMenu(false)} className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="md:hidden p-2 text-foreground/70 hover:text-primary transition-colors touch-manipulation"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        </div>
      </nav>
    </div>

    {/* Mobile sidebar overlay */}
    {mobileOpen && (
      <div 
        className="fixed inset-0 bg-black/50 z-[60] md:hidden"
        onClick={() => setMobileOpen(false)}
      />
    )}

    {/* Mobile sidebar */}
    <div className={`fixed top-0 left-0 h-full w-80 bg-white border-r border-gray-200 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out md:hidden ${
      mobileOpen ? 'translate-x-0' : '-translate-x-full'
    } overflow-y-auto`}>
      <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="relative">
            <Image src={logo} alt="Morpankh Saree" height={50} width={50} />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-600 rounded-full" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">Morpankh</span>
        </Link>
        <button 
          onClick={() => setMobileOpen(false)} 
          className="p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-300 touch-manipulation"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex flex-col p-5 gap-2">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            href={link.to}
            onClick={() => setMobileOpen(false)}
            className={
              isActive(link.to)
                ? 'py-3 px-4 rounded-xl transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-md flex items-center gap-3 touch-manipulation'
                : 'py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation'
            }
          >
            {isActive(link.to) && (
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
            {!isActive(link.to) && (
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
            )}
            {link.label}
          </Link>
        ))}
        
        {/* Mobile user menu items */}
        <div className="border-t border-gray-200 pt-5 mt-3">
          {isLoggedIn ? (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg mb-3">
                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-600">{isAdmin ? 'Admin' : 'Customer'}</p>
              </div>
              <Link href="/profile" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                My Profile
              </Link>
              <Link href="/orders" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                My Orders
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation">
                  <span className="w-2 h-2 bg-gray-400 rounded-full" />
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  toast({ title: 'Logged out successfully' });
                  setMobileOpen(false);
                }}
                className="w-full text-left py-3 px-4 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                Customer Login
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Navbar;
