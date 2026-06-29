"use client";

import { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { toast } from '@/hooks/use-toast';

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: Array<{
    productId: string;
    name: string;
    color: string;
    size?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  date: string;
  createdAt: string;
}

interface Product {
  name?: string;
  sku?: string;
  category?: string;
  price?: number;
  comparePrice?: number;
  stock?: number;
  hidden?: boolean;
  featured?: boolean;
  isNew?: boolean;
  isPremium?: boolean;
  isTrending?: boolean;
  rating?: number;
  reviews?: number;
  description?: string;
  fabric?: string;
  sareeLength?: string;
  tags?: string[];
  createdAt?: string;
}

interface Category {
  name?: string;
  slug?: string;
  productCount?: number;
  createdAt?: string;
}

const AdminExport = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState({
    products: false,
    categories: false,
    orders: false,
    customers: false,
  });
  const [exportFilters, setExportFilters] = useState({
    products: false,
    categories: false,
    orders: false,
    productCategory: 'all',
    productStatus: 'all',
    categoryStatus: 'all',
    orderStatus: 'all',
    paymentStatus: 'all',
  });

  const exportOrders = async () => {
    if (!fromDate || !toDate) {
      toast({ 
        title: 'Date Range Required', 
        description: 'Please select both From Date and To Date',
        variant: 'destructive' 
      });
      return;
    }

    setExporting({ ...exporting, orders: true });
    try {
      // Build query parameters for date filtering
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
      });

      const response = await fetch(`/api/admin/orders/export?${params}`, {
        headers: {
          'Authorization': 'Bearer admin-token',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const responseJson = await response.json();
      if (!responseJson.success) {
        throw new Error(responseJson.error || 'Failed to fetch orders');
      }

      const orders: Order[] = responseJson.data || [];
      
      // Convert orders to Excel format
      const excelData = orders.map(order => ({
        'Order Number': order.orderNumber,
        'Customer Name': order.customerName,
        'Email': order.customerEmail,
        'Phone': order.customerPhone,
        'Address': `${order.address}, ${order.city}, ${order.state} - ${order.pincode}`,
        'Items Count': order.items.length,
        'Subtotal': order.subtotal,
        'Total': order.total,
        'Payment Status': order.paymentStatus,
        'Order Status': order.orderStatus,
        'Date': new Date(order.createdAt).toLocaleDateString(),
      }));

      // Create CSV content
      const headers = Object.keys(excelData[0] || {});
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in CSV
            const stringValue = String(value || '');
            return stringValue.includes(',') || stringValue.includes('"') 
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          }).join(',')
        )
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_export_${fromDate}_to_${toDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ 
        title: 'Export Successful', 
        description: `Exported ${orders.length} orders from ${fromDate} to ${toDate}` 
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({ 
        title: 'Export Failed', 
        description: 'Failed to export orders. Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setExporting({ ...exporting, orders: false });
    }
  };

  const exportInventory = async () => {
    setExporting({ ...exporting, products: true });
    try {
      const response = await fetch('/api/admin/products?pageSize=1000', {
        headers: { authorization: 'Bearer admin-token' }
      });

      if (!response.ok) throw new Error('Failed to fetch products');

      const result = await response.json();
      let products = result.data || [];

      // Filter by date range if provided
      if (fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999); // Include end of day
        products = products.filter((p: Product) => {
          const createdAt = p.createdAt ? new Date(p.createdAt) : null;
          return createdAt && createdAt >= from && createdAt <= to;
        });
      }

      const csvData = products.map((p: Product) => ({
        'Product Name': p.name || '',
        'SKU': p.sku || '',
        'Category': p.category || '',
        'Price': p.price || 0,
        'Compare Price': p.comparePrice || 0,
        'Stock': p.stock || 0,
        'Hidden': p.hidden ? 'Yes' : 'No',
        'Featured': p.featured ? 'Yes' : 'No',
        'Is New': p.isNew ? 'Yes' : 'No',
        'Is Premium': p.isPremium ? 'Yes' : 'No',
        'Is Trending': p.isTrending ? 'Yes' : 'No',
        'Rating': p.rating || 0,
        'Reviews': p.reviews || 0,
        'Description': (p.description || '').replace(/\n/g, ' ').substring(0, 200),
        'Fabric': p.fabric || '',
        'Saree Length': p.sareeLength || '',
        'Tags': (p.tags || []).join('; '),
        'Created At': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
      }));

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row =>
          headers.map(header => {
            const value = row[header as keyof typeof row];
            const stringValue = String(value || '');
            return stringValue.includes(',') || stringValue.includes('"')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Exported ${products.length} products${fromDate && toDate ? ` from ${fromDate} to ${toDate}` : ''}`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export products. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setExporting({ ...exporting, products: false });
    }
  };

  const exportCategories = async () => {
    setExporting({ ...exporting, categories: true });
    try {
      const response = await fetch('/api/admin/categories', {
        headers: { authorization: 'Bearer admin-token' }
      });

      if (!response.ok) throw new Error('Failed to fetch categories');

      const result = await response.json();
      let categories = result.data || [];

      // Filter by date range if provided
      if (fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999); // Include end of day
        categories = categories.filter((c: Category) => {
          const createdAt = c.createdAt ? new Date(c.createdAt) : null;
          return createdAt && createdAt >= from && createdAt <= to;
        });
      }

      const categoryData = categories.map((c: Category) => ({
        'Category Name': c.name || '',
        'Slug': c.slug || '',
        'Product Count': c.productCount || 0,
        'Status': (c.productCount || 0) > 0 ? 'Active' : 'Inactive',
        'Created At': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      }));

      // Create CSV content
      const headers = Object.keys(categoryData[0] || {});
      const csvContent = [
        headers.join(','),
        ...categoryData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            const stringValue = String(value || '');
            return stringValue.includes(',') || stringValue.includes('"') 
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          }).join(',')
        )
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `categories_export_${fromDate}_to_${toDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ 
        title: 'Export Successful', 
        description: `Exported ${categoryData.length} categories${fromDate && toDate ? ` from ${fromDate} to ${toDate}` : ''}` 
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({ 
        title: 'Export Failed', 
        description: 'Failed to export categories. Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setExporting({ ...exporting, categories: false });
    }
  };

  const exportCustomers = async () => {
    if (!fromDate || !toDate) {
      toast({ 
        title: 'Date Range Required', 
        description: 'Please select both From Date and To Date',
        variant: 'destructive' 
      });
      return;
    }

    setExporting({ ...exporting, customers: true });
    try {
      // Generate customer data (mock implementation)
      const customerData = [
        {
          'Customer Name': 'John Doe',
          'Email': 'john@example.com',
          'Phone': '+1234567890',
          'Total Orders': 5,
          'Total Spent': 14995,
          'Registration Date': '2024-01-15',
          'Last Order': new Date().toLocaleDateString(),
        },
        {
          'Customer Name': 'Jane Smith',
          'Email': 'jane@example.com',
          'Phone': '+0987654321',
          'Total Orders': 3,
          'Total Spent': 8997,
          'Registration Date': '2024-02-20',
          'Last Order': new Date().toLocaleDateString(),
        }
      ];

      // Create CSV content
      const headers = Object.keys(customerData[0] || {});
      const csvContent = [
        headers.join(','),
        ...customerData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            const stringValue = String(value || '');
            return stringValue.includes(',') || stringValue.includes('"') 
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          }).join(',')
        )
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_export_${fromDate}_to_${toDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ 
        title: 'Export Successful', 
        description: `Exported customer data from ${fromDate} to ${toDate}` 
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({ 
        title: 'Export Failed', 
        description: 'Failed to export customers. Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setExporting({ ...exporting, customers: false });
    }
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">Export Data</h1>
      
      {/* Export Filters Section */}
      <div className="bg-card rounded-xl p-6 border border-border mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Data to Export</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Products Filter */}
          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={exportFilters.products}
                onChange={(e) => setExportFilters({ ...exportFilters, products: e.target.checked })}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
              />
              <span className="font-medium">Products</span>
            </label>
            {exportFilters.products && (
              <div className="space-y-2 ml-6">
                <select
                  value={exportFilters.productCategory}
                  onChange={(e) => setExportFilters({ ...exportFilters, productCategory: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Categories</option>
                  <option value="sarees">Sarees</option>
                  <option value="salwar">Salwar Kameez</option>
                  <option value="lehenga">Lehenga</option>
                  <option value="kurti">Kurti</option>
                </select>
                <select
                  value={exportFilters.productStatus}
                  onChange={(e) => setExportFilters({ ...exportFilters, productStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                  <option value="featured">Featured</option>
                </select>
              </div>
            )}
          </div>

          {/* Categories Filter */}
          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={exportFilters.categories}
                onChange={(e) => setExportFilters({ ...exportFilters, categories: e.target.checked })}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
              />
              <span className="font-medium">Categories</span>
            </label>
            {exportFilters.categories && (
              <div className="space-y-2 ml-6">
                <select
                  value={exportFilters.categoryStatus}
                  onChange={(e) => setExportFilters({ ...exportFilters, categoryStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Categories</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {/* Orders Filter */}
          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={exportFilters.orders}
                onChange={(e) => setExportFilters({ ...exportFilters, orders: e.target.checked })}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
              />
              <span className="font-medium">Orders</span>
            </label>
            {exportFilters.orders && (
              <div className="space-y-2 ml-6">
                <select
                  value={exportFilters.orderStatus}
                  onChange={(e) => setExportFilters({ ...exportFilters, orderStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={exportFilters.paymentStatus}
                  onChange={(e) => setExportFilters({ ...exportFilters, paymentStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Filter Section */}
      <div className="bg-card rounded-xl p-6 border border-border mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Select Date Range</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              max={toDate || new Date().toISOString().split('T')[0]}
              placeholder="dd-mm-yyyy"
            />
            <p className="text-xs text-muted-foreground mt-1">dd-mm-yyyy</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              min={fromDate}
              max={new Date().toISOString().split('T')[0]}
              placeholder="dd-mm-yyyy"
            />
            <p className="text-xs text-muted-foreground mt-1">dd-mm-yyyy</p>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border text-center card-hover">
          <Download className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">Products Report</h3>
          <p className="text-sm text-muted-foreground mb-4">Download products data as CSV</p>
          <button 
            onClick={exportInventory} 
            disabled={exporting.products || !exportFilters.products}
            className="btn-primary text-sm py-2 px-6 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            {exporting.products ? 'Exporting...' : 'Export Products'}
          </button>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border text-center card-hover">
          <Download className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">Categories Report</h3>
          <p className="text-sm text-muted-foreground mb-4">Download categories data as CSV</p>
          <button 
            onClick={exportCategories} 
            disabled={exporting.categories || !exportFilters.categories}
            className="btn-primary text-sm py-2 px-6 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            {exporting.categories ? 'Exporting...' : 'Export Categories'}
          </button>
        </div>
        
        <div className="bg-card rounded-xl p-6 border border-border text-center card-hover">
          <Download className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">Orders Report</h3>
          <p className="text-sm text-muted-foreground mb-4">Download orders data as CSV</p>
          <button 
            onClick={exportOrders} 
            disabled={exporting.orders || !exportFilters.orders || !fromDate || !toDate}
            className="btn-primary text-sm py-2 px-6 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            {exporting.orders ? 'Exporting...' : 'Export Orders'}
          </button>
        </div>
        
              </div>
    </AdminLayout>
  );
};

export default AdminExport;
