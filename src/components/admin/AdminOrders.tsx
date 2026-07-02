"use client";

import AdminLayout from '@/components/AdminLayout';
import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import { Eye, Printer, Trash2, X, RefreshCw, Loader2, Search, Truck } from 'lucide-react';
import { initialOrders } from '@/data/mockData';

type Order = {
  id?: string;
  _id?: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  alternatePhone?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  items?: Array<{ productId: string; name: string; color: string; size?: string; quantity: number; price: number; image?: string; isPrebooking?: boolean; prebookingDeliveryDays?: number }>;
  subtotal?: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  date: string;
  isPrebookingOrder?: boolean;
  expectedDeliveryDate?: string;
};

const AdminOrders = () => {
  const { updateOrderStatus, products } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [paginatingLoading, setPaginatingLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filter states
  const [orderNumberFilter, setOrderNumberFilter] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  
  // Multi-select states
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

  const statusColor = (status: string) => {
    const map: Record<string, string> = { pending: 'bg-gold/20 text-gold', paid: 'bg-primary/20 text-primary', confirmed: 'bg-primary/20 text-primary', shipped: 'bg-secondary/20 text-secondary', delivered: 'bg-peacock-green/20 text-peacock-green', cancelled: 'bg-destructive/20 text-destructive', failed: 'bg-destructive/20 text-destructive' };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  const displayPaymentStatus = (status: string) => {
    if (status === 'paid') return 'Payment Successful';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getOrderImage = (order: Order) => {
    const firstItem = order.items?.[0];
    const placeholder = 'https://via.placeholder.com/100?text=No+Image&bg=ddd';
    if (!firstItem) return placeholder;
    if (firstItem.image) return firstItem.image;
    const product = products.find((p) => p.id === firstItem.productId);
    if (product?.images?.[0]) return product.images[0];
    return placeholder;
  };

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
  };

  const handlePrintOrder = (order: Order) => {
    if (typeof window !== 'undefined') {
      console.log(`Print order ${order.orderNumber}`);
      
      // Find the full order data
      const orderData = orders.find(o => (o.id || o._id) === (order.id || order._id)) || order;
      
      // Create print content for the specific order
      const printContent = `
        <div style="font-family: Arial, sans-serif; margin: 20px;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #dbeafe; padding-bottom: 20px;">
            <h1 style="margin: 0; color: #1f2937; font-size: 28px;">Anand Wholesale</h1>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">Celebrating Indian Tradition</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold; width: 50%;">Order Number:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${orderData.orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Order Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${orderData.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Status:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-transform: capitalize;">${orderData.orderStatus}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Payment Status:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-transform: capitalize;">${orderData.paymentStatus === 'paid' ? 'Payment Successful' : orderData.paymentStatus}</td>
              </tr>
              ${orderData.isPrebookingOrder ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Order Type:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold; color: #7c3aed;">Prebooking Order</td>
              </tr>` : ''}
              ${orderData.expectedDeliveryDate ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Expected Delivery:</td>
                <td style="padding: 8px 0; color: #1f2937;">${orderData.expectedDeliveryDate}</td>
              </tr>` : ''}
              ${orderData.razorpayOrderId ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Razorpay Order ID:</td>
                <td style="padding: 8px 0; color: #1f2937;">${orderData.razorpayOrderId}</td>
              </tr>` : ''}
              ${orderData.razorpayPaymentId ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Razorpay Payment ID:</td>
                <td style="padding: 8px 0; color: #1f2937;">${orderData.razorpayPaymentId}</td>
              </tr>` : ''}
            </table>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Customer Details</h3>
            <p style="margin: 0; color: #1f2937; font-weight: bold;">${orderData.customerName}</p>
            ${orderData.customerEmail ? `<p style="margin: 5px 0; color: #4b5563;">Email: ${orderData.customerEmail}</p>` : ''}
            ${orderData.customerPhone ? `<p style="margin: 5px 0; color: #4b5563;">Phone: ${orderData.customerPhone}</p>` : ''}
            ${orderData.alternatePhone ? `<p style="margin: 5px 0; color: #4b5563;">Alternate Phone: ${orderData.alternatePhone}</p>` : ''}
            <p style="margin: 5px 0; color: #4b5563;">
              ${orderData.address || 'Address not available'}
              ${orderData.city || orderData.state || orderData.pincode ? '<br>' : ''}
              ${orderData.city || ''}${orderData.city && orderData.state ? ', ' : ''}${orderData.state || ''} ${orderData.pincode || ''}
            </p>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151;">Product</th>
                  <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Color</th>
                  <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Size</th>
                  <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-weight: bold; color: #374151;">Price</th>
                  <th style="padding: 12px; text-align: right; font-weight: bold; color: #374151;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderData.items?.map(item => `<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}${item.isPrebooking ? '<div style="font-size: 11px; color: #7c3aed; margin-top: 2px;">Prebook (' + (item.prebookingDeliveryDays || 10) + '-' + ((item.prebookingDeliveryDays || 10) + 5) + ' days)</div>' : ''}</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.color}</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.size || '-'}</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">Rs${item.price.toLocaleString()}</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">Rs${(item.price * item.quantity).toLocaleString()}</td></tr>`).join('')} || '<tr><td colspan="6" style="padding: 12px; text-align: center;">No items found</td></tr>'}
              </tbody>
            </table>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #1f2937; font-weight: bold; font-size: 18px; text-align: right;">Total Amount:</td>
                <td style="padding: 10px 15px; background-color: #dbeafe; color: #1e40af; font-weight: bold; font-size: 18px; text-align: right; border-radius: 4px;">₹${orderData.total.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Thank you for shopping with Anand Wholesale!</p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              This is a computer-generated invoice. For any queries, contact us at support@anandwholesale.com
            </p>
          </div>
        </div>
      `;
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Order Invoice - ${orderData.orderNumber} | Anand Wholesale</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                @media print { body { margin: 0; } }
                @page { margin: 20mm; }
              </style>
            </head>
            <body>
              ${printContent}
              <script>
                window.onload = function() {
                  setTimeout(() => {
                    window.print();
                    window.close();
                  }, 500);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handlePrintDeliveryOrder = (order: Order) => {
    if (typeof window !== 'undefined') {
      console.log(`Print delivery order ${order.orderNumber}`);
      
      // Find the full order data
      const orderData = orders.find(o => (o.id || o._id) === (order.id || order._id)) || order;
      
      // Create print content for delivery address
      const printContent = `
        <div class="print-page" style="font-family: Arial, Helvetica, sans-serif; color: #333; font-size: 30px; background: white; width: 210mm; height: 297mm; padding: 20px; box-sizing: border-box; position: relative;">
          <div class="" style="position: absolute;  pointer-events: none;"></div>
          
          <div class="customer-section" style="position: absolute; top: 40px; left: 40px; width: 550px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 100px; padding: 8px 0; color: #666; font-weight: bold; font-size: 28px;">To:-</td>
                <td style="padding: 8px 0; color: #333; font-size: 28px; border-bottom: 1px solid #333;">${orderData.customerName}</td>
              </tr>
              <tr>
                <td style="width: 100px; padding: 8px 0; color: #666; font-weight: bold; font-size: 28px; vertical-align: top;">Add:-</td>
                <td style="padding: 8px 0; color: #333; font-size: 28px; border-bottom: 1px solid #333;">${orderData.address || 'Not provided'}${orderData.city || orderData.state ? '<br>' : ''}${orderData.city || ''}${orderData.city && orderData.state ? ', ' : ''}${orderData.state || ''} ${orderData.pincode || ''}</td>
              </tr>
              <tr>
                <td style="width: 100px; padding: 8px 0; color: #666; font-weight: bold; font-size: 28px;">Ph:-</td>
                <td style="padding: 8px 0; color: #333; font-size: 28px; border-bottom: 1px solid #333;">${orderData.customerPhone || 'Not provided'}</td>
              </tr>
              ${orderData.alternatePhone ? `
              <tr>
                <td style="width: 100px; padding: 8px 0; color: #666; font-weight: bold; font-size: 28px;">Alt Ph:-</td>
                <td style="padding: 8px 0; color: #333; font-size: 28px; border-bottom: 1px solid #333;">${orderData.alternatePhone}</td>
              </tr>` : ''}
            </table>
          </div>
          
          <div class="branding-section" style="position: absolute; right: 40px; bottom: 40px; width: 320px; text-align: right;">
            <div class="logo-section" style="margin-bottom: 20px; text-align: right;">
              <img src="/blacklogo.png" alt="Anand Wholesale Logo" style="width: 400px; height: auto; display: inline-block;" />
            </div>
            <div class="shop-section" style="font-size: 30px; line-height: 1.35; color: #333; text-align: right;">
              <p style="margin: 0;">Add - Shop No 48/3, Baba Pathare Patil Complex,Chatrapati Shivaji Maharaj Chowk, Kharadi Road,</p>
              <p style="margin: 0;">Chandan Nagar, Pune - 411014</p>
              <p style="margin: 0;">Mob. 9960621199</p>
              <p style="margin: 0;">9309886564</p>
            </div>
          </div>
        </div>
      `;
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Delivery Order - ${orderData.orderNumber} | Anand Wholesale</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                @media print { body { margin: 0; } }
                @page { margin: 20mm; }
              </style>
            </head>
            <body>
              ${printContent}
              <script>
                window.onload = function() {
                  setTimeout(() => {
                    window.print();
                    window.close();
                  }, 500);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleDeleteOrder = (id?: string) => {
    if (!id) return;
    setOrders((prev) => prev.filter((order) => order.id !== id && order._id !== id));
  };

  const resetFilters = () => {
    setOrderNumberFilter('');
    setCustomerNameFilter('');
    setProductFilter('all');
    setDateFilter('');
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setCurrentPage(1);
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id || order._id || '')));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.size === 0) return;
    
    if (bulkAction === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedOrders.size} order(s)? This action cannot be undone.`)) {
        return;
      }
      await handleBulkDelete();
    } else if (bulkAction === 'print') {
      handleBulkPrint();
    } else {
      await handleBulkStatusUpdate();
    }
  };

  const handleBulkStatusUpdate = async () => {
    setBulkUpdating(true);
    try {
      const promises = Array.from(selectedOrders).map(orderId => 
        fetch('/api/admin/orders', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer admin-token',
          },
          body: JSON.stringify({ id: orderId, orderStatus: bulkAction }),
        })
      );
      
      const results = await Promise.all(promises);
      const allSuccessful = results.every(res => res.ok);
      
      if (allSuccessful) {
        // Update local state
        selectedOrders.forEach(orderId => {
          updateOrderStatus(orderId, bulkAction as OrderStatus);
        });
        setTimeout(() => fetchOrders(), 500);
        setSelectedOrders(new Set());
        setBulkAction('');
      } else {
        console.error('Some bulk actions failed');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkUpdating(true);
    try {
      const promises = Array.from(selectedOrders).map(orderId => 
        fetch('/api/admin/orders', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer admin-token',
          },
          body: JSON.stringify({ id: orderId }),
        })
      );
      
      const results = await Promise.all(promises);
      const allSuccessful = results.every(res => res.ok);
      
      if (allSuccessful) {
        // Update local state - remove deleted orders
        setOrders(prev => prev.filter(order => {
          const orderId = order.id || order._id || '';
          return !selectedOrders.has(orderId);
        }));
        setTimeout(() => fetchOrders(), 500);
        setSelectedOrders(new Set());
        setBulkAction('');
      } else {
        console.error('Some deletions failed');
      }
    } catch (error) {
      console.error('Error performing bulk delete:', error);
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkPrint = () => {
    const selectedOrdersData = filteredOrders.filter(order => {
      const orderId = order.id || order._id || '';
      return selectedOrders.has(orderId);
    });
    
    // Create print content for all selected orders in delivery format
    const printContent = selectedOrdersData.map((order, index) => `
      <div class="print-page" style="font-family: Arial, Helvetica, sans-serif; color: #333; font-size: 30px; background: white; width: 210mm; height: 297mm; padding: 20px; box-sizing: border-box; position: relative; ${index < selectedOrdersData.length - 1 ? 'page-break-after: always;' : ''}">
        <div class="" style="position: absolute;  pointer-events: none;"></div>
        
        <div class="customer-section" style="position: absolute; top: 40px; left: 40px; width: 550px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 100px; padding: 8px 0; color: #666; font-weight: bold; font-size: 28px;">To:-</td>
              <td style="padding: 8px 0; color: #333; font-size: 28px; border-bottom: 1px solid #333;">${order.customerName}</td>
            </tr>
            <tr>
              <td style="width: 100px; padding: 8px 0; color: #666; font-weight: bold; font-size: 28px; vertical-align: top;">Add:-</td>
              <td style="padding: 8px 0; color: #333; font-size: 28px; border-bottom: 1px solid #333;">${order.address || 'Not provided'}${order.city || order.state ? '<br>' : ''}${order.city || ''}${order.city && order.state ? ', ' : ''}${order.state || ''} ${order.pincode || ''}</td>
            </tr>
            <tr>
              <td style="width: 100px; padding: 8px 0; color: #666; font-weight: bold; font-size: 28px;">Ph:-</td>
              <td style="padding: 8px 0; color: #333; font-size: 28px; border-bottom: 1px solid #333;">${order.customerPhone || 'Not provided'}</td>
            </tr>
            ${order.alternatePhone ? `
            <tr>
              <td style="width: 100px; padding: 8px 0; color: #666; font-weight: bold; font-size: 28px;">Alt Ph:-</td>
              <td style="padding: 8px 0; color: #333; font-size: 28px; border-bottom: 1px solid #333;">${order.alternatePhone}</td>
            </tr>` : ''}
          </table>
        </div>
        
        <div class="branding-section" style="position: absolute; right: 40px; bottom: 40px; width: 320px; text-align: right;">
          <div class="logo-section" style="margin-bottom: 20px; text-align: right;">
            <img src="/blacklogo.png" alt="Anand Wholesale Logo" style="width: 400px; height: auto; display: inline-block;" />
          </div>
          <div class="shop-section" style="font-size: 30px; line-height: 1.35; color: #333; text-align: right;">
            <p style="margin: 0;">Add - Shop No 48/3, Baba Pathare Patil Complex,Chatrapati Shivaji Maharaj Chowk, Kharadi Road,</p>
            <p style="margin: 0;">Chandan Nagar, Pune - 411014</p>
            <p style="margin: 0;">Mob. 9960621199</p>
            <p style="margin: 0;">9309886564</p>
          </div>
        </div>
      </div>
    `).join('');
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Delivery Orders - Anand Wholesale</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              @media print { body { margin: 0; } }
              @page { margin: 20mm; }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const applyFilters = (ordersList: Order[]) => {
    // Note: Filtering is now handled at the backend API level
    // This function is kept for potential future client-side filtering needs
    return ordersList.filter(order => {
      // Product filter (still needed for dropdown selection)
      if (productFilter !== 'all') {
        const hasProduct = order.items?.some(item => item.productId === productFilter);
        if (!hasProduct) return false;
      }
      
      return true;
    });
  };

  const fetchOrders = async (isPagination = false) => {
    if (isPagination) {
      setPaginatingLoading(true);
    } else {
      setLoading(true);
    }
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '10',
      });
      
      // Add search parameter if present (searches order number, customer name, and product name)
      if (orderNumberFilter) {
        params.append('search', orderNumberFilter.trim());
      }
      
      // Add customer name filter if present
      if (customerNameFilter) {
        params.append('customerName', customerNameFilter.trim());
      }
      
      // Add status filter if present
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      // Add payment status filter if present
      if (paymentStatusFilter && paymentStatusFilter !== 'all') {
        params.append('paymentStatus', paymentStatusFilter);
      }
      
      // Add date filter if present
      if (dateFilter) {
        params.append('date', dateFilter);
      }
      
      // Add product filter if present
      if (productFilter && productFilter !== 'all') {
        params.append('product', productFilter);
      }
      
      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { authorization: 'Bearer admin-token' },
      });
      const data = await res.json();
      let ordersList: Order[] = [];
      let totalOrders = 0;
      
      if (res.ok && data?.success && Array.isArray(data.data)) {
        ordersList = data.data;
        totalOrders = data.pagination?.total || data.data.length;
        setTotalPages(data.pagination?.totalPages || Math.ceil(totalOrders / 10));
      } else {
        console.log('Using mock data fallback for orders page');
        ordersList = initialOrders;
        totalOrders = initialOrders.length;
        setTotalPages(Math.ceil(totalOrders / 10));
      }
      
      setOrders(ordersList);
      setTotal(totalOrders);
      setFilteredOrders(ordersList); // No longer filtering locally, API handles search
    } catch (error) {
      console.log('API error, using mock data fallback for orders page:', error);
      setOrders(initialOrders);
      setTotal(initialOrders.length);
      setTotalPages(Math.ceil(initialOrders.length / 10));
      setFilteredOrders(initialOrders); // No longer filtering locally
    } finally {
      if (isPagination) {
        setPaginatingLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Reset to page 1 when search changes and fetch orders
    setCurrentPage(1);
    fetchOrders();
  }, [orderNumberFilter]);

  useEffect(() => {
    // Reset to page 1 when customer name filter changes and fetch orders
    setCurrentPage(1);
    fetchOrders();
  }, [customerNameFilter]);

  useEffect(() => {
    // Reset to page 1 when other filters change and fetch orders
    setCurrentPage(1);
    fetchOrders();
  }, [productFilter, dateFilter, statusFilter, paymentStatusFilter]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchOrders(true);
    }
  }, [currentPage]);

  useEffect(() => {
    const handleFocus = () => {
      fetchOrders();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, []);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <button
          onClick={() => fetchOrders()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      {/* Bulk Actions Section */}
      {selectedOrders.size > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Bulk Actions</option>
                <option value="pending">Mark as Pending</option>
                <option value="confirmed">Mark as Confirmed</option>
                <option value="shipped">Mark as Shipped</option>
                <option value="delivered">Mark as Delivered</option>
                <option value="cancelled">Cancel Orders</option>
                <option value="print">🖨️ Print Selected Delivery Order</option>
                <option value="delete">🗑️ Delete Selected</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction || bulkUpdating}
                className="px-4 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkUpdating ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Applying...
                  </span>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            <button
              onClick={() => setSelectedOrders(new Set())}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
      
      {/* Filters Section */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Order Number Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Search Order # or Product Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search order number or product name..."
                value={orderNumberFilter}
                onChange={(e) => setOrderNumberFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          
          {/* Customer Name Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Customer Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search customer..."
                value={customerNameFilter}
                onChange={(e) => setCustomerNameFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          
          {/* Product Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Product</label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              placeholder="dd-mm-yyyy"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Payment Status</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Payments</option>
              <option value="paid">Payment Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        
        {/* Reset Filters Button */}
        <div className="mt-4">
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>
      {loading && orders.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-4 text-sm text-muted-foreground">Loading orders...</div>
      ) : null}
      <div className="bg-card rounded-xl border border-border overflow-x-auto relative">
        {paginatingLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="text-left p-4 w-12">
                <input
                  type="checkbox"
                  checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-border text-primary focus:ring-primary/20"
                />
              </th>
              <th className="text-left p-4">Image</th>
              <th className="text-left p-4">Order</th>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Amount</th>
              <th className="text-left p-4">Payment</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Date</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const firstItem = order.items?.[0];
              const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
              const orderId = order.id || order._id || '';
              const isSelected = selectedOrders.has(orderId);
              
              return (
                <tr key={orderId} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isSelected ? 'bg-muted/20' : ''}`}>
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOrder(orderId)}
                      className="rounded border-border text-primary focus:ring-primary/20"
                    />
                  </td>
                  <td className="p-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-border/60">
                      <img src={getOrderImage(order)} alt={firstItem?.name || order.orderNumber} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-4">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, itemIndex) => (
                          <div key={`${item.productId}-${itemIndex}`} className="space-y-1">
                            <div className="font-medium">{order.orderNumber}</div>
                            <div className="text-sm text-muted-foreground">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.quantity} Quantity</div>
                            <div className="text-sm text-muted-foreground">Color: {item.color}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">No items available</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">{order.customerName}</td>
                  <td className="p-4">₹{order.total.toLocaleString()}</td>
                  <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${statusColor(order.paymentStatus)}`}>{displayPaymentStatus(order.paymentStatus)}</span></td>
                  <td className="p-4 flex flex-col gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor(order.orderStatus)}`}>{order.orderStatus}</span>
                    <select
                      aria-label="Change order status"
                      value={order.orderStatus}
                      disabled={Boolean(updatingId)}
                      onChange={async (e) => {
                        const id = order.id || order._id;
                        if (!id) return;
                        const newStatus = e.target.value as OrderStatus;
                        setUpdatingId(id);
                        try {
                          const res = await fetch('/api/admin/orders', {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              authorization: 'Bearer admin-token',
                            },
                            body: JSON.stringify({ id, orderStatus: newStatus }),
                          });
                          if (res.ok) {
                            updateOrderStatus(id, newStatus);
                            setTimeout(() => fetchOrders(), 500);
                          } else {
                            console.error('Failed to update order status');
                          }
                        } catch (error) {
                          console.error('Error updating order status:', error);
                        } finally {
                          setUpdatingId(null);
                        }
                      }}
                      className="text-xs border border-border rounded px-2 py-1 bg-background w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {updatingId === (order.id || order._id) ? (
                      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Updating...
                      </span>
                    ) : null}
                  </td>
                  <td className="p-4 text-muted-foreground">{order.date}</td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <button type="button" title="View order" aria-label="View order" onClick={() => openOrderModal(order)} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button type="button" title="Print delivery order" aria-label="Print delivery order" onClick={() => handlePrintDeliveryOrder(order)} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                        <Truck className="h-4 w-4" />
                      </button>
                      <button type="button" title="Delete order" aria-label="Delete order" onClick={() => handleDeleteOrder(order.id || order._id)} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, total)} of {total} orders
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || paginatingLoading}
              className="px-3 py-1 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || paginatingLoading}
              className="px-3 py-1 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-3xl overflow-hidden border border-border/60 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border/60">
              <div>
                <h2 className="text-2xl font-bold">Order Details</h2>
                <p className="text-sm text-muted-foreground">{selectedOrder.orderNumber}</p>
              </div>
              <button type="button" title="Close order details" aria-label="Close order details" onClick={closeOrderModal} className="p-3 rounded-xl hover:bg-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/50 p-4 bg-muted/30">
                  <h3 className="font-semibold mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground"><span>Order Number</span><span>{selectedOrder.orderNumber}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Date</span><span>{selectedOrder.date}</span></div>
                    {selectedOrder.isPrebookingOrder && (
                      <div className="flex justify-between text-muted-foreground"><span>Type</span><span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">Prebooking</span></div>
                    )}
                    {selectedOrder.expectedDeliveryDate && (
                      <div className="flex justify-between text-muted-foreground"><span>Expected Delivery</span><span>{selectedOrder.expectedDeliveryDate}</span></div>
                    )}
                    <div className="flex justify-between text-muted-foreground"><span>Status</span><span className={`text-xs px-2 py-1 rounded-full ${statusColor(selectedOrder.orderStatus)}`}>{selectedOrder.orderStatus}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Payment</span><span className={`text-xs px-2 py-1 rounded-full ${statusColor(selectedOrder.paymentStatus)}`}>{selectedOrder.paymentStatus}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Razorpay Order ID</span><span className="max-w-[180px] truncate" title={selectedOrder.razorpayOrderId || ''}>{selectedOrder.razorpayOrderId || '—'}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Razorpay Payment ID</span><span className="max-w-[180px] truncate" title={selectedOrder.razorpayPaymentId || ''}>{selectedOrder.razorpayPaymentId || '—'}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Total</span><span className="font-medium">₹{selectedOrder.total.toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/50 p-4 bg-muted/30">
                  <h3 className="font-semibold mb-3">Customer</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between"><span>Name</span><span>{selectedOrder.customerName}</span></div>
                    <div className="flex justify-between"><span>Email</span><span>{selectedOrder.customerEmail || '—'}</span></div>
                    <div className="flex justify-between"><span>Phone</span><span>{selectedOrder.customerPhone || '—'}</span></div>
                    <div className="flex justify-between"><span>Alternate Phone</span><span>{selectedOrder.alternatePhone || '—'}</span></div>
                    <div className="block"><span className="text-muted-foreground">Address</span><p className="text-sm font-medium">{selectedOrder.address || '—'}</p><p className="text-sm font-medium">{selectedOrder.city || ''}{selectedOrder.city && selectedOrder.state ? ', ' : ''}{selectedOrder.state || ''} {selectedOrder.pincode || ''}</p></div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 p-4 bg-muted/30">
                <h3 className="font-semibold mb-4">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={`${item.productId}-${index}`} className="flex items-center gap-4 rounded-2xl border border-border/50 p-4 bg-background">
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-border/60">
                        <img src={item.image || getOrderImage(selectedOrder)} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Color: {item.color}{item.size ? ` · Size: ${item.size}` : ''}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        {item.isPrebooking && (
                          <p className="text-xs text-purple-600 font-medium">
                            Prebook ({item.prebookingDeliveryDays || 10}-{(item.prebookingDeliveryDays || 10) + 5} days)
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;
