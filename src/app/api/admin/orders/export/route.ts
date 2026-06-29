import { NextRequest, NextResponse } from 'next/server';
import { Db, WithId, Document } from 'mongodb';
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

function isAdminRequest(request: NextRequest) {
  const auth = (request.headers.get('authorization') || '').trim();
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token === 'admin-token';
}

async function getDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = await getMongoClient(uri);
  return { client, db: client.db(getDatabaseName()) };
}

export async function GET(request: NextRequest) {
  let client: Awaited<ReturnType<typeof getDatabase>>['client'] | null = null;
  
  try {
    // Check admin authentication
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // Validate date parameters
    if (!fromDate || !toDate) {
      return NextResponse.json(
        { success: false, error: 'From date and To date are required' },
        { status: 400 }
      );
    }

    // Parse dates
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    // Add one day to 'to' date to include the entire end date
    const toEndOfDay = new Date(to);
    toEndOfDay.setDate(toEndOfDay.getDate() + 1);
    toEndOfDay.setHours(0, 0, 0, 0);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Connect to database
    const database = await getDatabase();
    client = database.client;
    const orders = database.db.collection<OrderDoc>('orders');

    // Query orders within date range
    const query = {
      createdAt: {
        $gte: from,
        $lt: toEndOfDay
      }
    };

    const ordersData = await orders
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Transform data for export
    const transformedOrders = ordersData.map((order) => ({
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      address: order.address,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      items: order.items,
      subtotal: order.subtotal,
      total: order.total,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      date: order.date,
      createdAt: order.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: transformedOrders,
      count: transformedOrders.length,
      fromDate,
      toDate,
    });

  } catch (error) {
    console.error('Export orders error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
