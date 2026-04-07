'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ShadcnButton,
  ShadcnCard,
  ShadcnCardContent,
  ShadcnCardDescription,
  ShadcnCardHeader,
  ShadcnCardTitle,
  ShadcnInput,
  ShadcnLabel,
  ShadcnSelect,
  ShadcnTagInput,
  ShadcnTextarea,
} from '@ecomsaas/ui/shadcn';
import { createProduct, updateProduct, type ProductState } from './actions';
import { PRODUCT_AVAILABILITY, CURRENCIES } from '@/lib/product-utils';

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_amount: number;
  price_currency: string;
  availability: string;
  is_active: boolean;
  tags: string[];
}

interface ProductFormProps {
  product?: ProductData;
}

export function ProductForm({ product }: ProductFormProps) {
  const isEdit = !!product;
  const router = useRouter();
  const [state, action, pending] = useActionState<ProductState, FormData>(
    isEdit ? updateProduct : createProduct,
    null
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      if (!isEdit) router.push('/dashboard/products');
    }
  }, [state, isEdit, router]);

  return (
    <form action={action} className="space-y-6">
      {isEdit && <input type="hidden" name="productId" value={product.id} />}

      {/* Basic Info */}
      <ShadcnCard>
        <ShadcnCardHeader>
          <ShadcnCardTitle>Product details</ShadcnCardTitle>
          <ShadcnCardDescription>Name, description and availability</ShadcnCardDescription>
        </ShadcnCardHeader>
        <ShadcnCardContent className="space-y-4">
          <div className="space-y-2">
            <ShadcnLabel htmlFor="name">Name *</ShadcnLabel>
            <ShadcnInput
              id="name"
              name="name"
              required
              defaultValue={product?.name ?? ''}
              placeholder="e.g. Organic Coffee Beans"
            />
          </div>

          {isEdit && (
            <div className="space-y-2">
              <ShadcnLabel htmlFor="slug">Slug</ShadcnLabel>
              <ShadcnInput
                id="slug"
                value={product.slug}
                readOnly
                className="bg-gray-50 text-gray-500"
              />
            </div>
          )}

          <div className="space-y-2">
            <ShadcnLabel htmlFor="description">Description</ShadcnLabel>
            <ShadcnTextarea
              id="description"
              name="description"
              rows={4}
              defaultValue={product?.description ?? ''}
              placeholder="Describe your product…"
            />
          </div>

          <div className="space-y-2">
            <ShadcnLabel htmlFor="availability">Availability</ShadcnLabel>
            <ShadcnSelect
              id="availability"
              name="availability"
              defaultValue={product?.availability ?? 'AVAILABLE'}
            >
              {PRODUCT_AVAILABILITY.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </ShadcnSelect>
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                defaultChecked={product.is_active}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <ShadcnLabel htmlFor="isActive">Active</ShadcnLabel>
            </div>
          )}

          <div className="space-y-2">
            <ShadcnLabel htmlFor="tags">Tags</ShadcnLabel>
            <ShadcnTagInput
              id="tags"
              name="tags"
              defaultValue={product?.tags?.join(', ') ?? ''}
              placeholder="Type a tag and press Enter…"
            />
          </div>
        </ShadcnCardContent>
      </ShadcnCard>

      {/* Pricing */}
      <ShadcnCard>
        <ShadcnCardHeader>
          <ShadcnCardTitle>Pricing</ShadcnCardTitle>
          <ShadcnCardDescription>Set the price for your product</ShadcnCardDescription>
        </ShadcnCardHeader>
        <ShadcnCardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <ShadcnLabel htmlFor="price">Price *</ShadcnLabel>
              <ShadcnInput
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={product ? (product.price_amount / 100).toFixed(2) : ''}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <ShadcnLabel htmlFor="currency">Currency</ShadcnLabel>
              <ShadcnSelect
                id="currency"
                name="currency"
                defaultValue={product?.price_currency ?? 'CAD'}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </ShadcnSelect>
            </div>
          </div>
        </ShadcnCardContent>
      </ShadcnCard>

      <div className="flex items-center justify-end gap-3">
        <ShadcnButton
          type="button"
          variant="ghost"
          onClick={() => router.push('/dashboard/products')}
        >
          Cancel
        </ShadcnButton>
        <ShadcnButton type="submit" disabled={pending}>
          {pending
            ? isEdit
              ? 'Saving…'
              : 'Creating…'
            : isEdit
              ? 'Save changes'
              : 'Create product'}
        </ShadcnButton>
      </div>
    </form>
  );
}
