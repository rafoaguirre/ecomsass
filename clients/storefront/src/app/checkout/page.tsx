'use client';

import Link from 'next/link';
import { ShadcnButton, ShadcnSeparator } from '@ecomsaas/ui/shadcn';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/formatting';

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const groupedByStore = useCartStore((s) => s.groupedByStore);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotalsByCurrency = useCartStore((s) => s.subtotalsByCurrency);

  const groups = groupedByStore();
  const subtotals = subtotalsByCurrency();

  if (items.length === 0) {
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

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-muted">Review your order before proceeding to payment.</p>
      </div>

      {/* Items grouped by store */}
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.storeId} className="rounded-lg border border-border bg-white p-4 sm:p-6">
            {/* Store header */}
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

            {/* Items */}
            <div className="space-y-4">
              {group.items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  {/* Thumbnail */}
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

                  {/* Details */}
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

                    {/* Quantity */}
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

      {/* Order summary */}
      <div className="mt-8 rounded-lg border border-border bg-white p-4 sm:p-6">
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
            <span className="text-muted">Calculated at next step</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Delivery</span>
            <span className="text-muted">Calculated at next step</span>
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

        <ShadcnButton variant="primary" className="mt-6 w-full" size="lg" disabled>
          Place Order (Coming Soon)
        </ShadcnButton>
        <p className="mt-2 text-center text-xs text-muted">
          Payment integration will be available in the next release.
        </p>
      </div>

      {/* Back link */}
      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          &larr; Continue Shopping
        </Link>
      </div>
    </section>
  );
}
