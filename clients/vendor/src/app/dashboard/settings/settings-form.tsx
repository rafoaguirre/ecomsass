'use client';

import { useActionState, useEffect } from 'react';
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
  ShadcnSeparator,
  ShadcnTextarea,
} from '@ecomsaas/ui/shadcn';
import { updateStore } from './actions';

const STORE_TYPES = [
  { value: 'GENERAL', label: 'General Store' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'SCHOOL', label: 'School Store' },
  { value: 'CAFETERIA', label: 'Cafeteria' },
  { value: 'EVENTS', label: 'Events' },
  { value: 'MARKETPLACE', label: 'Marketplace' },
];

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  email: string | null;
  phone_number: string | null;
  store_type: string;
  is_active: boolean;
  address: {
    street?: string;
    city?: string;
    province?: string;
    country?: string;
    postalCode?: string;
  } | null;
}

export function SettingsForm({ store }: { store: Store }) {
  const [state, formAction, isPending] = useActionState(updateStore, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  const addr = store.address ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="storeId" value={store.id} />

      {/* General */}
      <ShadcnCard>
        <ShadcnCardHeader>
          <ShadcnCardTitle>General</ShadcnCardTitle>
          <ShadcnCardDescription>
            Basic store information visible to customers.
          </ShadcnCardDescription>
        </ShadcnCardHeader>
        <ShadcnCardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <ShadcnLabel htmlFor="name">Store name</ShadcnLabel>
              <ShadcnInput id="name" name="name" defaultValue={store.name} required />
            </div>
            <div className="space-y-2">
              <ShadcnLabel>Store URL</ShadcnLabel>
              <div className="flex h-10 items-center rounded-[--radius-md] border border-border bg-neutral-50 px-3 text-sm text-muted">
                ecomsaas.com/{store.slug}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <ShadcnLabel htmlFor="description">Description</ShadcnLabel>
            <ShadcnTextarea
              id="description"
              name="description"
              defaultValue={store.description ?? ''}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <ShadcnLabel htmlFor="storeType">Store type</ShadcnLabel>
              <ShadcnSelect id="storeType" name="storeType" defaultValue={store.store_type}>
                {STORE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </ShadcnSelect>
            </div>
            <div className="flex items-end space-x-3 pb-0.5">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={store.is_active}
                  className="h-4 w-4 rounded border-border text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm font-semibold text-foreground">Store is active</span>
              </label>
            </div>
          </div>
        </ShadcnCardContent>
      </ShadcnCard>

      {/* Contact */}
      <ShadcnCard>
        <ShadcnCardHeader>
          <ShadcnCardTitle>Contact</ShadcnCardTitle>
          <ShadcnCardDescription>How customers can reach your store.</ShadcnCardDescription>
        </ShadcnCardHeader>
        <ShadcnCardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <ShadcnLabel htmlFor="email">Email</ShadcnLabel>
              <ShadcnInput id="email" name="email" type="email" defaultValue={store.email ?? ''} />
            </div>
            <div className="space-y-2">
              <ShadcnLabel htmlFor="phone">Phone</ShadcnLabel>
              <ShadcnInput
                id="phone"
                name="phone"
                type="tel"
                defaultValue={store.phone_number ?? ''}
              />
            </div>
          </div>
        </ShadcnCardContent>
      </ShadcnCard>

      {/* Address */}
      <ShadcnCard>
        <ShadcnCardHeader>
          <ShadcnCardTitle>Address</ShadcnCardTitle>
          <ShadcnCardDescription>
            Physical location for local customers. Optional for online-only.
          </ShadcnCardDescription>
        </ShadcnCardHeader>
        <ShadcnCardContent className="space-y-4">
          <div className="space-y-2">
            <ShadcnLabel htmlFor="street">Street</ShadcnLabel>
            <ShadcnInput id="street" name="street" defaultValue={addr.street ?? ''} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <ShadcnLabel htmlFor="city">City</ShadcnLabel>
              <ShadcnInput id="city" name="city" defaultValue={addr.city ?? ''} />
            </div>
            <div className="space-y-2">
              <ShadcnLabel htmlFor="province">State / Province</ShadcnLabel>
              <ShadcnInput id="province" name="province" defaultValue={addr.province ?? ''} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <ShadcnLabel htmlFor="postalCode">Postal code</ShadcnLabel>
              <ShadcnInput id="postalCode" name="postalCode" defaultValue={addr.postalCode ?? ''} />
            </div>
            <div className="space-y-2">
              <ShadcnLabel htmlFor="country">Country</ShadcnLabel>
              <ShadcnInput id="country" name="country" defaultValue={addr.country ?? ''} />
            </div>
          </div>
        </ShadcnCardContent>
      </ShadcnCard>

      <ShadcnSeparator />

      <div className="flex justify-end">
        <ShadcnButton type="submit" variant="primary" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save changes'}
        </ShadcnButton>
      </div>
    </form>
  );
}
