'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ShadcnButton, ShadcnSeparator } from '@ecomsaas/ui/shadcn';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/formatting';
import { api } from '@/lib/api-client';
import { ShippingForm, type ShippingInfo } from '@/components/shipping-form';
import { StripeProvider } from '@/components/stripe-provider';
import { PaymentForm } from '@/components/payment-form';

type Step = 'review' | 'shipping' | 'payment' | 'success';

interface CheckoutSessionResponse {
  clientSecret: string;
  paymentIntentId: string;
  orderId: string;
  amount: string;
  currency: string;
}

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const groupedByStore = useCartStore((s) => s.groupedByStore);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotalsByCurrency = useCartStore((s) => s.subtotalsByCurrency);
  const clearCart = useCartStore((s) => s.clearCart);

  const [step, setStep] = useState<Step>('review');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [checkoutSessions, setCheckoutSessions] = useState<CheckoutSessionResponse[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [completedOrderIds, setCompletedOrderIds] = useState<string[]>([]);

  const groups = groupedByStore();
  const subtotals = subtotalsByCurrency();

  if (items.length === 0 && step !== 'success') {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-muted">Add some products before checking out.</p>
        <Link href="/">
          <ShadcnButton variant="primary" className="mt-6">
            Browse Marketplace
          </ShadcnButton>
        </Link>
      </section>
    );
  }

  // After successful payment
  if (step === 'success') {
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
        {completedOrderIds.length > 0 && (
          <div className="mt-4 space-y-1">
            {completedOrderIds.map((id) => (
              <p key={id} className="text-sm text-muted">
                Order ID: <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">{id}</code>
              </p>
            ))}
          </div>
        )}
        <Link href="/">
          <ShadcnButton variant="primary" className="mt-6">
            Continue Shopping
          </ShadcnButton>
        </Link>
      </section>
    );
  }

  const handleShippingSubmit = async (shipping: ShippingInfo) => {
    setIsCreatingOrder(true);
    try {
      // Create a checkout session per store group
      const sessions: CheckoutSessionResponse[] = [];

      for (const group of groups) {
        const session = await api.post<CheckoutSessionResponse>(
          `/api/v1/stores/${group.storeId}/checkout`,
          {
            items: group.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            payment: { method: 'STRIPE' },
            fulfillment: {
              type: 'SHIPPING',
              address: {
                street: shipping.street,
                city: shipping.city,
                province: shipping.state,
                postalCode: shipping.postalCode,
                country: shipping.country,
              },
            },
          }
        );
        sessions.push(session);
      }

      setCheckoutSessions(sessions);
      setCurrentSessionIndex(0);
      setStep('payment');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create checkout session';
      toast.error(message);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaymentSuccess = () => {
    const currentSession = checkoutSessions[currentSessionIndex];
    if (!currentSession) return;
    const newCompleted = [...completedOrderIds, currentSession.orderId];
    setCompletedOrderIds(newCompleted);

    if (currentSessionIndex < checkoutSessions.length - 1) {
      // Move to next store's payment
      setCurrentSessionIndex(currentSessionIndex + 1);
    } else {
      // All payments done
      clearCart();
      setStep('success');
    }
  };

  const handlePaymentError = (message: string) => {
    toast.error(message);
  };

  const currentSession = checkoutSessions[currentSessionIndex];

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Header with step indicator */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Checkout</h1>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <StepIndicator label="Review" active={step === 'review'} completed={step !== 'review'} />
          <StepDivider />
          <StepIndicator
            label="Shipping"
            active={step === 'shipping'}
            completed={step === 'payment'}
          />
          <StepDivider />
          <StepIndicator label="Payment" active={step === 'payment'} completed={false} />
        </div>
      </div>

      {/* Step: Review */}
      {step === 'review' && (
        <>
          <div className="space-y-8">
            {groups.map((group) => (
              <div
                key={group.storeId}
                className="rounded-lg border border-border bg-white p-4 sm:p-6"
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-100 text-sm font-bold text-brand-600">
                    {group.storeName.charAt(0).toUpperCase()}
                  </div>
                  <Link
                    href={`/stores/${group.storeSlug}`}
                    className="font-semibold text-foreground hover:text-brand-600"
                  >
                    {group.storeName}
                  </Link>
                </div>

                <ShadcnSeparator className="mb-4" />

                <div className="space-y-4">
                  {group.items.map((item) => (
                    <div key={item.productId} className="flex gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-neutral-50">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="h-full w-full rounded-md object-cover"
                          />
                        ) : (
                          <svg
                            className="h-8 w-8 text-neutral-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"
                            />
                          </svg>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <Link
                            href={`/stores/${group.storeSlug}/products/${item.productId}`}
                            className="font-medium text-foreground hover:text-brand-600"
                          >
                            {item.productName}
                          </Link>
                          <p className="text-sm text-muted">{formatPrice(item.price)} each</p>
                        </div>

                        <div className="mt-2 flex items-center gap-3 sm:mt-0">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded border border-border text-sm text-muted hover:text-foreground"
                              aria-label={`Decrease quantity of ${item.productName}`}
                            >
                              &minus;
                            </button>
                            <span className="min-w-[2rem] text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded border border-border text-sm text-muted hover:text-foreground"
                              aria-label={`Increase quantity of ${item.productName}`}
                            >
                              +
                            </button>
                          </div>

                          <span className="min-w-[5rem] text-right font-semibold text-foreground">
                            {formatPrice({
                              amount: String(Number(item.price.amount) * item.quantity),
                              currency: item.price.currency,
                            })}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="ml-2 text-xs text-muted hover:text-red-500"
                            aria-label={`Remove ${item.productName}`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <OrderSummary subtotals={subtotals} />

          <ShadcnButton
            variant="primary"
            className="mt-6 w-full"
            size="lg"
            onClick={() => setStep('shipping')}
          >
            Continue to Shipping
          </ShadcnButton>
        </>
      )}

      {/* Step: Shipping */}
      {step === 'shipping' && (
        <div className="space-y-6">
          <OrderSummary subtotals={subtotals} compact />
          <div className="rounded-lg border border-border bg-white p-4 sm:p-6">
            <ShippingForm onSubmit={handleShippingSubmit} isLoading={isCreatingOrder} />
          </div>
          <button
            type="button"
            onClick={() => setStep('review')}
            className="text-sm text-muted hover:text-foreground"
          >
            &larr; Back to Review
          </button>
        </div>
      )}

      {/* Step: Payment */}
      {step === 'payment' && currentSession && (
        <div className="space-y-6">
          {checkoutSessions.length > 1 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              Payment {currentSessionIndex + 1} of {checkoutSessions.length} —{' '}
              {groups[currentSessionIndex]?.storeName ?? 'Store'}
            </div>
          )}

          <div className="rounded-lg border border-border bg-white p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Payment Details
              </h3>
              <span className="text-sm font-medium text-muted">
                {formatPrice({
                  amount: currentSession.amount,
                  currency: currentSession.currency,
                })}
              </span>
            </div>
            <StripeProvider
              key={currentSession.clientSecret}
              clientSecret={currentSession.clientSecret}
            >
              <PaymentForm onSuccess={handlePaymentSuccess} onError={handlePaymentError} />
            </StripeProvider>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <strong>Test Mode:</strong> Use card number{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">4242 4242 4242 4242</code>{' '}
            with any future expiry and any CVC.
          </div>
        </div>
      )}

      {/* Back link */}
      {step === 'review' && (
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted hover:text-foreground">
            &larr; Continue Shopping
          </Link>
        </div>
      )}
    </section>
  );
}

// ── Subcomponents ──────────────────────────────────────────────

function StepIndicator({
  label,
  active,
  completed,
}: {
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? 'bg-brand-600 text-white'
          : completed
            ? 'bg-green-100 text-green-700'
            : 'bg-neutral-100 text-muted'
      }`}
    >
      {completed ? `✓ ${label}` : label}
    </span>
  );
}

function StepDivider() {
  return <span className="text-neutral-300">→</span>;
}

function OrderSummary({
  subtotals,
  compact,
}: {
  subtotals: { amount: string; currency: string }[];
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-white p-4 sm:p-6 ${compact ? 'mt-0' : 'mt-8'}`}
    >
      <h2 className="font-display text-lg font-bold text-foreground">Order Summary</h2>
      <ShadcnSeparator className="my-4" />
      <div className="space-y-2">
        {subtotals.map((s) => (
          <div key={s.currency} className="flex items-center justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="font-semibold text-foreground">{formatPrice(s)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Taxes</span>
          <span className="text-muted">Included</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Shipping</span>
          <span className="text-muted">Free</span>
        </div>
      </div>
      <ShadcnSeparator className="my-4" />
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-foreground">Total</span>
        <div className="text-right">
          {subtotals.map((s) => (
            <span key={s.currency} className="block text-xl font-bold text-foreground">
              {formatPrice(s)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
