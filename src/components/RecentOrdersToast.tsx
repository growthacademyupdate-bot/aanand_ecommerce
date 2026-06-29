import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface RecentOrder {
  customerName: string;
  productName: string;
  price: number;
  orderNumber: string;
  productImage?: string;
}

const customerNames = [
  'Priya Sharma',
  'Anjali Patel',
  'Sneha Reddy',
  'Pooja Singh',
  'Neha Gupta',
  'Riya Mehta',
  'Kavita Joshi',
  'Divya Nair',
  'Sonal Agarwal',
  'Meera Kapoor',
];

const RecentOrdersToast = () => {
  const [currentOrder, setCurrentOrder] = useState<RecentOrder | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const lastOrderIndexRef = useRef(-1);
  const ordersRef = useRef<RecentOrder[]>([]);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadSpotlight = async () => {
      try {
        const res = await fetch('/api/products/home');
        const json = await res.json();
        const spotlight = json?.data?.spotlight;
        if (res.ok && Array.isArray(spotlight) && spotlight.length > 0) {
          ordersRef.current = buildOrders(spotlight);
        }
      } catch {
        // ignore
      }
    };
    void loadSpotlight();
  }, []);

  const buildOrders = (products: typeof useStore extends (sel: (s: infer S) => unknown) => unknown ? S extends { products: infer P } ? P : never : never): RecentOrder[] => {
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10).map((product, index) => ({
      customerName: customerNames[index % customerNames.length],
      productName: product.name,
      price: product.price || 0,
      orderNumber: `ORD-${1000 + Math.floor(Math.random() * 9000)}`,
      productImage: product.images?.[0] || '',
    }));
  };

  const clearAllTimers = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    if (startTimerRef.current) clearTimeout(startTimerRef.current);
  }, []);

  const showNextOrder = useCallback(() => {
    const orders = ordersRef.current;
    if (orders.length === 0) return;

    let nextIndex: number;
    do {
      nextIndex = Math.floor(Math.random() * orders.length);
    } while (nextIndex === lastOrderIndexRef.current && orders.length > 1);

    lastOrderIndexRef.current = nextIndex;
    setCurrentOrder(orders[nextIndex]);
    setIsVisible(true);

    // Auto-hide after 3 seconds
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);

      // Show next notification after 10 seconds
      nextTimerRef.current = setTimeout(() => {
        showNextOrder();
      }, 10000);
    }, 3000);
  }, []);

  // Start the cycle once
  useEffect(() => {
    startTimerRef.current = setTimeout(() => {
      showNextOrder();
    }, 3000);

    return () => {
      clearAllTimers();
    };
  }, [showNextOrder, clearAllTimers]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    nextTimerRef.current = setTimeout(() => {
      showNextOrder();
    }, 10000);
  }, [showNextOrder]);

  if (!currentOrder || !isVisible) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-50 max-w-sm"
      style={{
        animation: 'slideInLeft 0.5s ease-out',
      }}
    >
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOutLeft {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-100%);
          }
        }
        .recent-order-toast {
          animation: slideInLeft 0.5s ease-out;
        }
        .recent-order-toast.closing {
          animation: slideOutLeft 0.3s ease-in forwards;
        }
      `}</style>

      <div className="recent-order-toast bg-card border border-primary/20 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          {/* Product Image */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted border border-border">
            {currentOrder.productImage ? (
              <img
                src={currentOrder.productImage}
                alt={currentOrder.productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary font-medium mb-1">Recently Ordered</p>
            <p className="text-sm font-semibold text-foreground truncate">
              {currentOrder.productName}
            </p>
            <p className="text-xs text-muted-foreground mb-1">
              by {currentOrder.customerName}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                ₹{currentOrder.price.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentOrder.orderNumber}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentOrdersToast;
