'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { CartSidebar } from '@/components/cart-sidebar';

export function CartButton() {
  const count = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — localStorage cart loads after mount
  useEffect(() => setMounted(true), []);

  const displayCount = mounted ? count : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative rounded-md p-2 text-muted transition-colors hover:text-foreground"
        aria-label={`Shopping cart, ${displayCount} items`}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          />
        </svg>
        {displayCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {displayCount > 99 ? '99+' : displayCount}
          </span>
        )}
      </button>

      <CartSidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
}
