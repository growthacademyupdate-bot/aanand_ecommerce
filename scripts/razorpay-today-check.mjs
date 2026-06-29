import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';

const envPath = process.cwd() + '/.env';
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([^#=]+)=(.*)$/);
  if (!m) continue;
  process.env[m[1].trim()] = m[2].trim();
}

const keyId = 'rzp_live_Sx8kpzc6YxNbC6';
const keySecret = 'uAWjvptrUBPjhSDtTmaD8HVj';
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI missing');
  process.exit(1);
}
const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

function utcDayRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { from: Math.floor(start.getTime() / 1000), to: Math.floor(now.getTime() / 1000) };
}

async function main() {
  const { from, to } = utcDayRange();
  const paymentsRes = await fetch(`https://api.razorpay.com/v1/payments?from=${from}&to=${to}&count=100&status=captured`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!paymentsRes.ok) {
    console.error('Razorpay fetch failed', paymentsRes.status, await paymentsRes.text());
    process.exit(1);
  }
  const data = await paymentsRes.json();
  const payments = Array.isArray(data.items) ? data.items : data;
  const captured = payments.filter((p) => p.status === 'captured');
  console.log('razorpay_captured_today_count', captured.length);

  const client = new MongoClient(mongoUri);
  await client.connect();
  try {
    const dbName = mongoUri.split('/').pop().split('?')[0] || 'test';
    const db = client.db(dbName);
    const orders = db.collection('orders');

    const paidOrdersCount = await orders.countDocuments({ paymentStatus: 'paid' });
    const pendingOrdersCount = await orders.countDocuments({ paymentStatus: 'pending' });
    console.log('db_paid_orders_count', paidOrdersCount);
    console.log('db_pending_orders_count', pendingOrdersCount);

    const matched = [];
    const unmatched = [];
    for (const payment of captured) {
      const orderId = payment.order_id || '';
      const paymentId = payment.id || '';
      const notesOrderNumber = payment.notes?.orderNumber || '';
      const filter = { $or: [] };
      if (orderId) filter.$or.push({ razorpayOrderId: orderId });
      if (paymentId) filter.$or.push({ razorpayPaymentId: paymentId });
      if (notesOrderNumber) filter.$or.push({ orderNumber: notesOrderNumber });
      const order = filter.$or.length ? await orders.findOne(filter) : null;
      if (order) {
        matched.push({
          paymentId,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: order.razorpayPaymentId,
        });
      } else {
        unmatched.push({ paymentId, orderId, notesOrderNumber, amount: payment.amount, created_at: payment.created_at });
      }
    }

    console.log('matched_capture_count', matched.length);
    console.log('unmatched_capture_count', unmatched.length);
    if (unmatched.length > 0) {
      console.log('unmatched_capture_samples', JSON.stringify(unmatched.slice(0, 20), null, 2));
    }

    const capturedPaidCount = matched.filter((m) => m.paymentStatus === 'paid').length;
    const capturedPendingCount = matched.filter((m) => m.paymentStatus !== 'paid').length;
    console.log('matched_paid_count', capturedPaidCount);
    console.log('matched_nonpaid_count', capturedPendingCount);

    const pendingMatched = matched.filter((m) => m.paymentStatus !== 'paid');
    console.log('matched_pending_payment_status_count', pendingMatched.length);
    if (pendingMatched.length > 0) {
      console.log('matched_pending_payment_status_samples', JSON.stringify(pendingMatched.slice(0, 20), null, 2));
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
