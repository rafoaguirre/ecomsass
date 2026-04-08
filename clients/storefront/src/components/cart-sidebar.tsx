'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShadcnButton, ShadcnSeparator } from '@ecomsaas/ui/shadcn';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/formatting';

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function CartSidebar({ open, onClose }: CartSidebarProps) {
  const items = useCartStore((s) => s.items);
  const groupedByStore = useCartStore((s) => s.groupedByStore);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotalsByCurrency = useCartStore((s) => s.subtotalsByCurrency);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const groups = groupedByStore();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const currencySubtotals = subtotalsByCurrency();

  const modal = (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      {/* Backdrop — full screen */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Centering wrapper */}
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8 pointer-events-none">
        {/* Modal panel */}
        <div
          ref={panelRef}
          className="pointer-events-auto relative flex w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl"
          style={{ maxHeight: 'calc(100vh - 4rem)' }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-display text-xl font-bold text-foreground">
              Your Cart ({count} {count === 1 ? 'item' : 'items'})
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted hover:bg-neutral-100 hover:text-foreground"
              aria-label="Close cart"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg
                  className="h-20 w-20 text-neutral-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
                <p className="mt-4 text-lg font-medium text-foreground">Your cart is empty</p>
                <p className="mt-1 text-sm text-muted">
                  Browse stores and add products to get started.
                </p>
                <ShadcnButton variant="primary" className="mt-6" onClick={onClose}>
                  Continue Shopping
                </ShadcnButton>
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map((group) => (
                  <div key={group.storeId}>
                    {/* Store header */}
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-100 text-sm font-bold text-brand-600">
                        {group.storeName.charAt(0).toUpperCase()}
                      </div>
                      <Link
                        href={`/stores/${group.storeSlug}`}
                        className="font-semibold text-foreground hover:text-brand-600"
                        onClick={onClose}
                      >
                        {group.storeName}
                      </Link>
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                      {group.items.map((item) => (
                        <div
                          key={item.productId}
                          className="flex gap-4 rounded-lg border border-border bg-neutral-50/50 p-3"
                        >
                          {/* Thumbnail */}
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-white">
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
                                className="font-medium text-foreground hover:text-brand-600 line-clamp-1"
                                onClick={onClose}
                              >
                                {item.productName}
                              </Link>
                              <span className="text-sm text-muted">
                                {formatPrice(item.price)} each
                              </span>
                            </div>

                            {/* Quantity + line total */}
                            <div className="mt-2 flex items-center gap-3 sm:mt-0">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded border border-border bg-white text-sm text-muted hover:text-foreground"
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
                                  className="flex h-7 w-7 items-center justify-center rounded border border-border bg-white text-sm text-muted hover:text-foreground"
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
                                className="ml-1 text-xs text-muted hover:text-red-500"
                                aria-label={`Remove ${item.productName} from cart`}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <ShadcnSeparator className="mt-4" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer — always visible */}
          {items.length > 0 && (
            <div className="shrink-0 rounded-b-xl border-t border-border bg-neutral-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted">Subtotal</span>
                  <p className="mt-0.5 text-xs text-muted">
                    Taxes and delivery calculated at checkout.
                  </p>
                </div>
                <div className="text-right">
                  {currencySubtotals.map((s) => (
                    <span key={s.currency} className="block text-xl font-bold text-foreground">
                      {formatPrice(s)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-sm text-muted hover:text-red-500"
                >
                  Clear cart
                </button>
                <ShadcnButton
                  variant="primary"
                  className="flex-1"
                  size="lg"
                  onClick={() => {
                    onClose();
                    router.push('/checkout');
                  }}
                >
                  Proceed to Checkout
                </ShadcnButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
