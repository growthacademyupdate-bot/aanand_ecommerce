import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getString(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : undefined;
}

function getNumber(obj: unknown, key: string): number | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === 'number' ? v : undefined;
}

function getNestedString(obj: unknown, path: string[]): string | undefined {
  let cur: unknown = obj;
  for (const p of path) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

function toPaise(amountRupees: number): number {
  return Math.round(amountRupees * 100);
}

export async function POST(req: NextRequest) {
  try {
    const keyId = getEnv('RAZORPAY_KEY');
    const keySecret = getEnv('RAZORPAY_SECRET');

    const body = (await req.json().catch(() => ({}))) as { amount?: unknown; receipt?: unknown };

    const amountRupees = Number(body.amount);
    if (!Number.isFinite(amountRupees) || amountRupees <= 0) {
      return NextResponse.json({ success: false, error: 'Valid amount is required' }, { status: 400 });
    }

    const receipt = typeof body.receipt === 'string' && body.receipt.trim() ? body.receipt.trim() : `rcpt_${Date.now()}`;

    const amount = toPaise(amountRupees);

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
      }),
    });

    const rpData: unknown = await rpRes.json().catch(() => null);
    if (!rpRes.ok) {
      const msg =
        getNestedString(rpData, ['error', 'description']) ||
        getString(rpData, 'message') ||
        'Failed to create Razorpay order';
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }

    const id = getString(rpData, 'id');
    const rpAmount = getNumber(rpData, 'amount');
    const rpCurrency = getString(rpData, 'currency');
    const rpReceipt = getString(rpData, 'receipt');
    if (!id || !rpAmount || !rpCurrency) {
      return NextResponse.json({ success: false, error: 'Invalid Razorpay order response' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: id,
        amount: rpAmount,
        currency: rpCurrency,
        receipt: rpReceipt,
        keyId,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
