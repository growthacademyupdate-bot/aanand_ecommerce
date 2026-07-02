"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

const OrderSuccess = () => {
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get('orderNumber');

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center">
        <CheckCircle className="h-20 w-20 text-primary mx-auto mb-6" />
        <h1 className="font-display text-3xl font-bold mb-3">Order Placed Successfully!</h1>
        {orderNumber && (
          <p className="text-lg font-semibold text-primary mb-3">
            Order Number: {orderNumber}
          </p>
        )}
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Thank you for shopping with Anand Wholesale. Your order has been confirmed and you'll receive updates via email.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/products" className="btn-primary">Continue Shopping</Link>
          <Link href="/" className="btn-outline-primary">Go Home</Link>
        </div>
      </div>
    </PublicLayout>
  );
};

export default OrderSuccess;
