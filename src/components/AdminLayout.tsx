import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, FolderTree, ClipboardList, Warehouse, Download, LogOut, User, MessageSquare, Mail, Megaphone, Menu, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';

const menuItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Categories', to: '/admin/categories', icon: FolderTree },
  { label: 'Orders', to: '/admin/orders', icon: ClipboardList },
  { label: 'Messages', to: '/admin/messages', icon: Mail },
  { label: 'Reviews', to: '/admin/reviews', icon: MessageSquare },
  { label: 'Inventory', to: '/admin/inventory', icon: Warehouse },
  { label: 'Announcement', to: '/admin/announcement-bar', icon: Megaphone },
  { label: 'Export Data', to: '/admin/export', icon: Download },
  { label: 'Logout', to: '#', icon: LogOut, isLogout: true },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, userName, isAdmin, isLoggedIn } = useStore();
  const reviews = useStore((s) => s.reviews);
  const pendingReviews = reviews.filter((r) => !r.approved).length;
  const [isInitialized, setIsInitialized] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Wait for auth to initialize
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle Escape key to close mobile sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileSidebarOpen]);

  // Protect admin routes
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return <RedirectToAdminLogin />;
  }

  function RedirectToAdminLogin() {
    useEffect(() => {
      router.replace('/admin/login');
    }, []);
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="h-8" />
            <span className="font-display text-sm font-bold">Admin Panel</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const active = pathname === item.to;
            if (item.isLogout) {
              return (
                <button
                  key={item.to}
                  onClick={() => {
                    logout();
                    toast({ title: 'Logged out successfully' });
                    router.push('/');
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            }
            return (
              <Link key={item.to} href={item.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.label === 'Reviews' && pendingReviews > 0 && (
                  <span className="ml-auto bg-secondary text-secondary-foreground text-xs px-1.5 py-0.5 rounded-full">{pendingReviews}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-sidebar-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{userName || 'Admin'}</p>
              <p className="text-xs text-sidebar-foreground/50">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              toast({ title: 'Logged out successfully' });
              router.push('/');
            }}
            className="flex items-center gap-2 text-sm text-sidebar-foreground/50 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar text-sidebar-foreground p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMobileSidebarOpen(true)} 
            className="p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-sm font-bold">Admin</span>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-sidebar text-sidebar-foreground shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="h-8" />
            <span className="font-display text-sm font-bold">Admin Panel</span>
          </Link>
          <button 
            onClick={() => setMobileSidebarOpen(false)} 
            className="p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const active = pathname === item.to;
            if (item.isLogout) {
              return (
                <button
                  key={item.to}
                  onClick={() => {
                    logout();
                    toast({ title: 'Logged out successfully' });
                    router.push('/');
                    setMobileSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            }
            return (
              <Link 
                key={item.to} 
                href={item.to} 
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.label === 'Reviews' && pendingReviews > 0 && (
                  <span className="ml-auto bg-secondary text-secondary-foreground text-xs px-1.5 py-0.5 rounded-full">{pendingReviews}</span>
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-sidebar-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{userName || 'Admin'}</p>
              <p className="text-xs text-sidebar-foreground/50">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              toast({ title: 'Logged out successfully' });
              router.push('/');
              setMobileSidebarOpen(false);
            }}
            className="flex items-center gap-2 text-sm text-sidebar-foreground/50 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 bg-muted/30 p-4 md:p-8 md:pt-8 pt-16 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
