import { NextRequest, NextResponse } from 'next/server';
import { Db, WithId, Document, ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

interface OrderItem {
  productId: string;
  name: string;
  image?: string;
  color: string;
  size?: string;
  quantity: number;
  price: number;
}

interface OrderDoc {
  userId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

let db: Db | null = null;

function isAdminRequest(request: NextRequest) {
  const auth = (request.headers.get('authorization') || '').trim();
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token === 'admin-token';
}

async function getDatabase() {
  if (!db) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = await getMongoClient(uri);
    db = client.db(getDatabaseName());
  }
  return db;
}

async function sendStatusUpdateEmail(order: OrderDoc): Promise<boolean> {
  try {
    console.log('📧 Attempting to send status update email to:', order.customerEmail);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: process.env.EMAIL_USE_SSL === 'true',
      auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD,
      },
      logger: true,
      debug: true,
    });

    // Verify SMTP Connection
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully');

    const statusMessages = {
      pending: { title: 'Order Pending', message: 'Your order is being processed. We will update you soon.', color: '#f59e0b' },
      confirmed: { title: 'Order Confirmed', message: 'Your order has been confirmed and is being prepared.', color: '#10b981' },
      shipped: { title: 'Order Shipped', message: 'Your order has been shipped! You will receive tracking details soon.', color: '#3b82f6' },
      delivered: { title: 'Order Delivered', message: 'Your order has been successfully delivered. Thank you for shopping with us!', color: '#10b981' },
      cancelled: { title: 'Order Cancelled', message: 'Your order has been cancelled. Please contact support for more information.', color: '#ef4444' },
    };

    const statusInfo = statusMessages[order.orderStatus as keyof typeof statusMessages] || { title: 'Order Update', message: 'Your order status has been updated.', color: '#6b7280' };

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.color}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.size || 'N/A'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toLocaleString()}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
        </tr>
      `
      )
      .join('');

    const mailOptions = {
      from: `"Morpankh Saree" <${process.env.EMAIL_HOST_USER}>`,
      to: order.customerEmail,
      subject: `Order Status Update - ${order.orderNumber} | Morpankh Saree`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #dbeafe; padding-bottom: 20px;">
              <h1 style="margin: 0; color: #1f2937; font-size: 28px;">Morpankh Saree</h1>
              <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">Celebrating Indian Tradition</p>
            </div>

            <!-- Order Status -->
            <div style="background-color: #ecfdf5; border-left: 4px solid ${statusInfo.color}; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
              <h2 style="margin: 0 0 8px; color: ${statusInfo.color}; font-size: 18px;">${statusInfo.title}</h2>
              <p style="margin: 0; color: #047857;">${statusInfo.message}</p>
            </div>

            <!-- Order Details -->
            <div style="margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold; width: 50%;">Order Number:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${order.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Order Date:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${order.date}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Status:</td>
                  <td style="padding: 8px 0; color: ${statusInfo.color}; font-weight: bold;">${order.orderStatus}</td>
                </tr>
              </table>
            </div>

            <!-- Customer Details -->
            <div style="margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Delivery Address</h3>
              <p style="margin: 0; color: #1f2937; font-weight: bold;">${order.customerName}</p>
              <p style="margin: 5px 0; color: #4b5563;">${order.address}</p>
              <p style="margin: 5px 0; color: #4b5563;">${order.city}, ${order.state} ${order.pincode}</p>
              <p style="margin: 5px 0; color: #4b5563;">Phone: ${order.customerPhone}</p>
            </div>

            <!-- Order Items -->
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
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <!-- Order Summary -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; text-align: right;">Subtotal:</td>
                  <td style="padding: 10px 15px; text-align: right; color: #1f2937;">₹${order.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: bold; font-size: 18px; text-align: right;">Total Amount:</td>
                  <td style="padding: 10px 15px; background-color: #dbeafe; color: #1e40af; font-weight: bold; font-size: 18px; text-align: right; border-radius: 4px;">₹${order.total.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Thank you for shopping with Morpankh Saree!</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated email. Please do not reply. For any queries, contact us at support@morpankh.com
              </p>
            </div>

          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Status update email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('✗ Failed to send status update email:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Admin orders API called');
    
    if (!isAdminRequest(request)) {
      console.log('❌ Unauthorized request');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search')?.trim() || '';
    const customerName = searchParams.get('customerName')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const paymentStatus = searchParams.get('paymentStatus')?.trim() || '';
    const date = searchParams.get('date')?.trim() || '';
    const product = searchParams.get('product')?.trim() || '';
    const skip = (page - 1) * pageSize;

    console.log(`📄 Fetching orders: page=${page}, pageSize=${pageSize}, search="${search}", customerName="${customerName}", status="${status}", date="${date}", product="${product}"`);

    const database = await getDatabase();
    
    if (!database) {
      throw new Error('Database connection failed');
    }

    console.log('✅ Database connected, fetching orders collection');
    
    // Build query with filters
    const query: Record<string, unknown> = {};
    const orConditions: Record<string, unknown>[] = [];
    
    // Search across order number, customer name, and product name
    if (search) {
      orConditions.push(
        { customerName: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } }
      );
    }
    
    // Customer name filter (separate from search)
    if (customerName) {
      orConditions.push({ customerName: { $regex: customerName, $options: 'i' } });
    }
    
    // Add OR conditions if any exist
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }
    
    // Status filter
    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    // Payment status filter
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }
    
    // Date filter
    if (date) {
      const filterDate = new Date(date);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = {
        $gte: filterDate.toISOString().split('T')[0],
        $lt: nextDay.toISOString().split('T')[0]
      };
    }
    
    // Product filter
    if (product && product !== 'all') {
      query['items.productId'] = product;
    }
    
    console.log(`🔍 Search query:`, JSON.stringify(query));
    
    // Get total count for pagination with search filter
    const total = await database.collection('orders').countDocuments(query);
    console.log(`📈 Total orders found: ${total}`);
    
    // Get paginated orders with search filter
    const orders = await database
      .collection('orders')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    console.log(`📦 Retrieved ${orders.length} orders`);

    const transformed = (orders as WithId<Document>[]).map((o) => ({
      ...o,
      _id: o._id.toString(),
      id: o._id.toString(),
    }));

    const totalPages = Math.ceil(total / pageSize);

    console.log(`✅ Successfully fetched orders: page ${page} of ${totalPages}`);

    return NextResponse.json({ 
      success: true, 
      data: transformed,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error fetching admin orders:', msg);
    console.error('❌ Full error:', error);
    
    // Check if it's a connection error
    if (msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('ECONNREFUSED')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed. Please check your MongoDB connection.',
        details: msg
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch orders',
      details: msg 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, orderStatus } = body;

    if (!id || !orderStatus) {
      return NextResponse.json({ success: false, error: 'id and orderStatus are required' }, { status: 400 });
    }

    const database = await getDatabase();
    const orders = database!.collection('orders');

    const result = await orders.updateOne(
      { _id: new ObjectId(id) },
      { $set: { orderStatus, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Fetch the updated order to send email
    const updatedOrder = await orders.findOne({ _id: new ObjectId(id) });
    if (updatedOrder) {
      sendStatusUpdateEmail(updatedOrder as unknown as OrderDoc).catch(err => console.error('Email sending error:', err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating order status:', msg);
    return NextResponse.json({ success: false, error: 'Failed to update order status' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const database = await getDatabase();
    const orders = database!.collection('orders');

    const result = await orders.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting order:', msg);
    return NextResponse.json({ success: false, error: 'Failed to delete order' }, { status: 500 });
  }
}
