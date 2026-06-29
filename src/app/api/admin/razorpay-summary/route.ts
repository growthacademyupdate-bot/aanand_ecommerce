import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function isAdminRequest(request: NextRequest) {
  const auth = (request.headers.get('authorization') || '').trim();
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token === 'admin-token';
}

function getTimeZoneOffsetString(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    timeZoneName: 'shortOffset',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);

  const tzPart = parts.find((part) => part.type === 'timeZoneName')?.value || '';
  const match = tzPart.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);
  if (!match) {
    return '+00:00';
  }

  const sign = match[1].startsWith('-') ? '-' : '+';
  const hours = match[1].replace(/[+-]/, '').padStart(2, '0');
  const minutes = match[2]?.padStart(2, '0') || '00';
  return `${sign}${hours}:${minutes}`;
}

function getTodayRangeSeconds(timeZone: string) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const values = parts.reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {} as Record<string, string>);

  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  const offset = getTimeZoneOffsetString(timeZone, now);
  const start = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00${offset}`);
  const to = Math.floor(now.getTime() / 1000);

  return {
    from: Math.floor(start.getTime() / 1000),
    to,
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const key = process.env.RAZORPAY_KEY;
  const secret = process.env.RAZORPAY_SECRET;
  const timeZone = process.env.RAZORPAY_TIMEZONE || 'Asia/Kolkata';

  if (!key || !secret) {
    return NextResponse.json({ success: false, error: 'Missing Razorpay credentials' }, { status: 500 });
  }

  const { from, to } = getTodayRangeSeconds(timeZone);
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const apiUrl = 'https://api.razorpay.com/v1/payments';

  interface RazorpayPayment {
    id?: string;
    order_id?: string;
    amount?: number;
    status?: string;
    created_at?: number;
  }

  try {
    const payments: RazorpayPayment[] = [];
    let skip = 0;
    let totalCount: number | null = null;

    while (true) {
      const params = new URLSearchParams({
        status: 'captured',
        count: '100',
        from: String(from),
        to: String(to),
        skip: String(skip),
      });

      const response = await fetch(`${apiUrl}?${params.toString()}`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ success: false, error: `Razorpay API error: ${errorText}` }, { status: response.status });
      }

      const data = await response.json();
      const items = Array.isArray(data.items) ? (data.items as RazorpayPayment[]) : [];
      payments.push(...items);

      if (typeof data.total_count === 'number') {
        totalCount = data.total_count;
      }

      if (items.length < 100 || (totalCount !== null && payments.length >= totalCount)) {
        break;
      }

      skip += items.length;
    }

    const revenue = payments.reduce((sum: number, payment: RazorpayPayment) => sum + (Number(payment.amount) || 0), 0) / 100;
    const captured = totalCount !== null ? totalCount : payments.length;

    return NextResponse.json({
      success: true,
      count: captured,
      revenue,
      range: { from, to },
      payments: payments.slice(0, 10).map((payment: RazorpayPayment) => ({
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        status: payment.status,
        created_at: payment.created_at,
      })),
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
