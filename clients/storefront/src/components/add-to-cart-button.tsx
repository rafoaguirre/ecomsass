'use client';

import { ShadcnButton } from '@ecomsaas/ui/shadcn';
import { useCartStore } from '@/lib/cart-store';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: { amount: string; currency: string };
    image?: string;
  };
  store: {
    id: string;
    name: string;
    slug: string;
  };
  disabled?: boolean;
  disabledLabel?: string;
}

export function AddToCartButton({ product, store, disabled, disabledLabel }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const inCart = useCartStore(
    (s) => s.items.find((i) => i.productId === product.id)?.quantity ?? 0
  );
  const [added, setAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleClick() {
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      storeId: store.id,
      storeName: store.name,
      storeSlug: store.slug,
      price: product.price,
      image: product.image,
    });

    setAdded(true);
    toast.success(`${product.name} added to cart`);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 1500);
  }

  if (disabled) {
    return (
      <ShadcnButton variant="primary" size="lg" className="w-full sm:w-auto" disabled>
        {disabledLabel ?? 'Unavailable'}
      </ShadcnButton>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ShadcnButton variant="primary" size="lg" className="w-full sm:w-auto" onClick={handleClick}>
        {added ? 'Added!' : 'Add to Cart'}
      </ShadcnButton>
      {inCart > 0 && !added && <p className="text-sm text-muted">{inCart} already in cart</p>}
    </div>
  );
}
