'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShadcnButton } from '@ecomsaas/ui/shadcn';
import { useCartStore } from '@/lib/cart-store';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    if (redirectStatus === 'succeeded') {
      clearCart();
      setStatus('success');
    } else if (redirectStatus === 'failed' || redirectStatus === 'requires_payment_method') {
      setStatus('error');
    } else {
      // No redirect params — user navigated here directly
      setStatus(paymentIntentId ? 'success' : 'error');
      if (paymentIntentId) {
        clearCart();
      }
    }
  }, [redirectStatus, paymentIntentId, clearCart]);

  if (status === 'loading') {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-muted">Confirming your payment…</p>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="font-display mt-4 text-2xl font-bold text-foreground">Payment Failed</h1>
        <p className="mt-2 text-muted">Something went wrong with your payment. Please try again.</p>
        <Link href="/checkout">
          <ShadcnButton variant="primary" className="mt-6">
            Try Again
          </ShadcnButton>
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="font-display mt-4 text-2xl font-bold text-foreground">Order Confirmed!</h1>
      <p className="mt-2 text-muted">
        Your payment was successful. You&apos;ll receive a confirmation shortly.
      </p>
      {paymentIntentId && (
        <p className="mt-2 text-xs text-muted">
          Payment reference:{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5">{paymentIntentId}</code>
        </p>
      )}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link href="/orders">
          <ShadcnButton variant="primary">View My Orders</ShadcnButton>
        </Link>
        <Link href="/">
          <ShadcnButton variant="secondary">Continue Shopping</ShadcnButton>
        </Link>
      </div>
    </section>
  );
}

export default function CheckoutConfirmationPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-muted">Loading…</p>
        </section>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
