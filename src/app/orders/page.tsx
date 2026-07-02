"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Eye, Search, Calendar, X, RotateCcw, Download } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

type OrderItem = { productId: string; name: string; color: string; size?: string; quantity: number; price: number; image?: string };
type Order = {
  id?: string;
  _id?: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
};

const OrdersPage = () => {
  const { isLoggedIn, user, token } = useStore((s) => ({ isLoggedIn: s.isLoggedIn, user: s.user, token: s.token }));
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchOrders = async (authToken?: string | null) => {
    const tokenToUse = authToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!tokenToUse) {
      setMyOrders([]);
      setFilteredOrders([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: {
          authorization: `Bearer ${tokenToUse}`,
        },
      });
      const data = await res.json();
      if (res.ok && data?.success && Array.isArray(data.data)) {
        setMyOrders(data.data as Order[]);
      } else {
        console.log('Orders API response:', data);
        setMyOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setMyOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isClient) return;
    
    if (!isLoggedIn || !user) {
      setMyOrders([]);
      setLoading(false);
      return;
    }

    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    fetchOrders(authToken);
  }, [isLoggedIn, user, token, isClient]);

  useEffect(() => {
    if (!isClient) return;
    
    const handleFocus = () => {
      if (!isLoggedIn || !user) return;
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      if (authToken) fetchOrders(authToken);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, [isLoggedIn, user, token, isClient]);

  useEffect(() => {
    let filtered = myOrders;
    
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (fromDate) {
      filtered = filtered.filter(order => order.date >= fromDate);
    }
    
    if (toDate) {
      filtered = filtered.filter(order => order.date <= toDate);
    }
    
    setFilteredOrders(filtered);
  }, [myOrders, searchTerm, fromDate, toDate]);

  const getProductImage = (productId: string, color: string, items: OrderItem[]) => {
    // Find the item with this productId AND color to get the correct variant image
    const item = items.find(item => item.productId === productId && item.color === color);
    return item?.image || '/placeholder.svg';
  };

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
  };

  const handleInvoicePreview = (order: Order) => {
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .header-content { display: flex; align-items: center; justify-content: center; gap: 20px; }
          .logo { width: 60px; height: 60px; object-fit: contain; }
          .header h1 { color: #333; margin: 0; font-size: 28px; }
          .header p { color: #666; margin: 5px 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .info-section { background: #f9f9f9; padding: 20px; border-radius: 5px; }
          .info-section h3 { margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          .info-section p { margin: 5px 0; color: #555; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th { background: #333; color: white; padding: 12px; text-align: left; }
          .items-table td { padding: 12px; border-bottom: 1px solid #ddd; }
          .items-table tr:nth-child(even) { background: #f9f9f9; }
          .total-section { text-align: right; margin-top: 20px; }
          .total-section p { margin: 5px 0; font-size: 16px; }
          .total-section .total { font-size: 20px; font-weight: bold; color: #333; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
          @media print { body { background: white; } .invoice { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div class="header-content">
              <img src="/favicon.png" alt="Anand Wholesale Logo" class="logo" />
              <div>
                <h1>ANAND WHOLESALE</h1>
                <p>Tax Invoice</p>
                <p>Order #${order.orderNumber}</p>
              </div>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-section">
              <h3>Billing Details</h3>
              <p><strong>${order.customerName}</strong></p>
              <p>${order.customerEmail}</p>
              <p>${order.customerPhone}</p>
            </div>
            <div class="info-section">
              <h3>Shipping Address</h3>
              <p>${order.address}</p>
              <p>${order.city}, ${order.state} - ${order.pincode}</p>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Color/Size</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.color}${item.size ? ', ' + item.size : ''}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price}</td>
                  <td>₹${item.price * item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <p>Subtotal: ₹${order.subtotal}</p>
            <p class="total">Total Amount: ₹${order.total}</p>
            <p>Payment Status: ${order.paymentStatus}</p>
            <p>Order Status: ${order.orderStatus}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for shopping with Anand Wholesale!</p>
            <p>For any queries, contact us at support@anandwholesale.com</p>
            <p>Invoice Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(invoiceHTML);
      newWindow.document.close();
      newWindow.print();
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="container mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold mb-4">My Orders</h1>
        <p className="text-base text-muted-foreground mb-4">Login to see your order history.</p>
        <Link href="/login" className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
          Go to Login
        </Link>
      </div>
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
        @keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
        .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}
        .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}
        .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}
        .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}
        .fade-up-4{opacity:0;animation:fadeUp 0.6s ease 0.55s forwards}
        .order-card:hover{transform:translateY(-8px) scale(1.02);box-shadow:0 24px 56px hsl(var(--primary)/0.15)}
        .order-card{transition:transform 0.3s ease,box-shadow 0.3s ease}
        .filter-card:hover{transform:translateY(-4px) scale(1.01);box-shadow:0 16px 40px hsl(var(--primary)/0.12)}
        .filter-card{transition:transform 0.25s ease,box-shadow 0.25s ease}
        .logo-pulse{animation:zoomPulse 4s ease-in-out infinite}
        .spin-ring{animation:spinSlow 22s linear infinite}
        .search-input:focus{transform:scale(1.02);box-shadow:0 8px 24px hsl(var(--primary)/0.1)}
        .search-input{transition:transform 0.2s ease,box-shadow 0.2s ease}
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
              Anand Wholesale · My Orders
            </p>
            <h2 className="text-4xl font-bold mb-2">My Orders</h2>
            <p className="text-white/70 text-sm max-w-md">
              Track your orders, view purchase history, and manage your saree collection with ease.
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
              Order Management
            </div>
            <h1 className="text-5xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>
              
            </h1>
          </div>

          {/* FILTER SECTION */}
          <div className="max-w-5xl mx-auto mb-10 fade-up-2">
            <div
              className="filter-card rounded-2xl p-6 border border-border/60 shadow-xl backdrop-blur-xl"
              style={{ background: 'hsl(var(--card)/0.85)' }}
            >
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by order number or product name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      placeholder="From date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="search-input pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      placeholder="To date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="search-input pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                  </div>
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
                      fetchOrders(authToken);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* ORDERS LIST */}
          <div className="max-w-5xl mx-auto fade-up-3">
            {loading ? (
              <div className="order-card rounded-2xl border border-border/60 p-8 shadow-xl backdrop-blur-xl text-center" style={{ background: 'hsl(var(--card)/0.85)' }}>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 border-4 border-primary/20 border-t-primary/60 animate-spin" />
                <p className="text-base text-muted-foreground">Loading your orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="order-card rounded-2xl border border-border/60 p-8 shadow-xl backdrop-blur-xl text-center" style={{ background: 'hsl(var(--card)/0.85)' }}>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-primary/20" style={{ background: 'hsl(var(--primary)/0.08)' }}>
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <p className="text-base text-muted-foreground mb-4">
                  {myOrders.length === 0 ? 'You do not have any past orders yet.' : 'No orders found matching your criteria.'}
                </p>
                {myOrders.length === 0 && (
                  <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
                    Shop Now
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order, index) => (
                  <div 
                    key={order.id} 
                    className="order-card rounded-2xl border border-border/60 shadow-xl backdrop-blur-xl overflow-hidden fade-up-4"
                    style={{ 
                      background: 'hsl(var(--card)/0.85)',
                      animationDelay: `${0.6 + index * 0.1}s`,
                      borderLeft: '3px solid hsl(var(--primary)/0.5)',
                    }}
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                        <div className="lg:col-span-2">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Order No.</p>
                          <p className="font-bold text-lg" style={{ color: 'hsl(var(--primary))' }}>{order.orderNumber}</p>
                        </div>
                        <div className="lg:col-span-2">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Date</p>
                          <p className="text-sm font-medium">{order.date}</p>
                        </div>
                        <div className="lg:col-span-5">
                          <p className="text-sm font-medium text-muted-foreground mb-3">Products</p>
                          <div className="space-y-3">
                            {order.items.map((item, itemIndex) => (
                              <div key={`${item.productId}-${itemIndex}`} className="flex items-center gap-3 p-3 rounded-xl border border-border/30" style={{ background: 'hsl(var(--primary)/0.04)' }}>
                                <img 
                                  src={getProductImage(item.productId, item.color, order.items)} 
                                  alt={item.name}
                                  className="w-14 h-14 object-cover rounded-lg border border-border/50"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold truncate">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.color}{item.size ? `, ${item.size}` : ''} x{item.quantity}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>₹{item.price}</p>
                                  <p className="text-xs text-muted-foreground">each</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="lg:col-span-2">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Total</p>
                          <p className="font-bold text-lg" style={{ color: 'hsl(var(--primary))' }}>₹{order.total}</p>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" 
                              style={{ 
                                background: order.paymentStatus === 'paid' ? 'hsl(var(--success)/0.1)' : 'hsl(var(--warning)/0.1)',
                                color: order.paymentStatus === 'paid' ? 'hsl(var(--success))' : 'hsl(var(--warning))'
                              }}>
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div className="lg:col-span-1">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Actions</p>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => openOrderModal(order)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white text-sm rounded-xl hover:bg-primary/90 transition-all hover:scale-105"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleInvoicePreview(order)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground text-sm rounded-xl hover:bg-secondary/80 transition-all hover:scale-105"
                            >
                              <Download className="w-4 h-4" />
                              Preview Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-border/60" style={{ background: 'hsl(var(--card)/0.95)' }}>
            {/* Modal Header */}
            <div 
              className="p-6 border-b border-border/60 relative"
              style={{ background: 'linear-gradient(160deg, hsl(var(--primary)/0.08), transparent)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>Order Details</h2>
                  <p className="text-sm text-muted-foreground">{selectedOrder.orderNumber}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-3 hover:bg-primary/10 rounded-xl transition-all hover:scale-105"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="rounded-xl p-4 border border-border/30" style={{ background: 'hsl(var(--primary)/0.04)' }}>
                    <h3 className="font-semibold mb-3" style={{ color: 'hsl(var(--primary))' }}>Order Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Number:</span>
                        <span className="font-medium">{selectedOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{selectedOrder.date}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium" 
                          style={{ 
                            background: selectedOrder.orderStatus === 'delivered' ? 'hsl(var(--success)/0.1)' : 'hsl(var(--warning)/0.1)',
                            color: selectedOrder.orderStatus === 'delivered' ? 'hsl(var(--success))' : 'hsl(var(--warning))'
                          }}>
                          {selectedOrder.orderStatus}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Payment:</span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium" 
                          style={{ 
                            background: selectedOrder.paymentStatus === 'paid' ? 'hsl(var(--success)/0.1)' : 'hsl(var(--warning)/0.1)',
                            color: selectedOrder.paymentStatus === 'paid' ? 'hsl(var(--success))' : 'hsl(var(--warning))'
                          }}>
                          {selectedOrder.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="rounded-xl p-4 border border-border/30" style={{ background: 'hsl(var(--secondary)/0.04)' }}>
                    <h3 className="font-semibold mb-3" style={{ color: 'hsl(var(--primary))' }}>Customer Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium text-right">{selectedOrder.customerEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{selectedOrder.customerPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="rounded-xl p-4 border border-border/30" style={{ background: 'hsl(var(--primary)/0.04)' }}>
                  <h3 className="font-semibold mb-3" style={{ color: 'hsl(var(--primary))' }}>Shipping Address</h3>
                  <div className="text-sm text-muted-foreground">
                    <p>{selectedOrder.address}</p>
                    <p>{selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold mb-4" style={{ color: 'hsl(var(--primary))' }}>Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={`${item.productId}-${index}`} className="flex items-center gap-4 p-4 rounded-xl border border-border/30 hover:shadow-lg transition-all" style={{ background: 'hsl(var(--card)/0.5)' }}>
                      <img 
                        src={getProductImage(item.productId, item.color, selectedOrder.items)} 
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-xl border border-border/50"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-base">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.color}{item.size ? `, ${item.size}` : ''} x{item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg" style={{ color: 'hsl(var(--primary))' }}>₹{item.price * item.quantity}</p>
                        <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-border/60 pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Subtotal: ₹{selectedOrder.subtotal}</p>
                    <p className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>Total: ₹{selectedOrder.total}</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:scale-105 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
};

export default OrdersPage;
