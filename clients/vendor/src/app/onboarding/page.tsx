'use client';

import { useActionState, useEffect, useState } from 'react';
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
  ShadcnTextarea,
  ShadcnSeparator,
} from '@ecomsaas/ui/shadcn';
import { createStore } from './actions';

const STORE_TYPES = [
  { value: 'GENERAL', label: 'General Store' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'SCHOOL', label: 'School Store' },
  { value: 'CAFETERIA', label: 'Cafeteria' },
  { value: 'EVENTS', label: 'Events' },
  { value: 'MARKETPLACE', label: 'Marketplace' },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export default function OnboardingPage() {
  const [state, formAction, isPending] = useActionState(createStore, null);
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [storeType, setStoreType] = useState('GENERAL');

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  useEffect(() => {
    if (!slugManual && storeName) {
      setSlug(slugify(storeName));
    }
  }, [storeName, slugManual]);

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress indicator */}
        <div className="text-center">
          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-brand-500">
            <span className="text-sm font-bold text-white">E</span>
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
            Set up your store
          </h1>
          <p className="mt-1 text-sm text-muted">
            Step {step} of 2 &mdash; {step === 1 ? 'Store details' : 'Address & contact'}
          </p>
          <div className="mx-auto mt-4 flex max-w-xs gap-2">
            <div
              className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-brand-500' : 'bg-border'}`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-brand-500' : 'bg-border'}`}
            />
          </div>
        </div>

        <form action={formAction}>
          {/* Hidden fields for values from previous step */}
          {step === 2 && (
            <>
              <input type="hidden" name="name" value={storeName} />
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="description" value={description} />
              <input type="hidden" name="storeType" value={storeType} />
            </>
          )}

          {/* Step 1: Store details */}
          {step === 1 && (
            <ShadcnCard>
              <ShadcnCardHeader>
                <ShadcnCardTitle>Store details</ShadcnCardTitle>
                <ShadcnCardDescription>
                  Tell us about your business. You can always change this later.
                </ShadcnCardDescription>
              </ShadcnCardHeader>
              <ShadcnCardContent className="space-y-5">
                <div className="space-y-2">
                  <ShadcnLabel htmlFor="name">Store name</ShadcnLabel>
                  <ShadcnInput
                    id="name"
                    name="name"
                    placeholder="My Awesome Store"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <ShadcnLabel htmlFor="slug">Store URL</ShadcnLabel>
                  <div className="flex items-center gap-0">
                    <span className="flex h-10 items-center rounded-l-[--radius-md] border border-r-0 border-border bg-neutral-50 px-3 text-sm text-muted">
                      ecomsaas.com/
                    </span>
                    <ShadcnInput
                      id="slug"
                      name="slug"
                      className="rounded-l-none"
                      placeholder="my-awesome-store"
                      required
                      minLength={3}
                      maxLength={50}
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      title="Only lowercase letters, numbers, and hyphens"
                      value={slug}
                      onChange={(e) => {
                        setSlugManual(true);
                        setSlug(e.target.value);
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted">
                    Only lowercase letters, numbers, and hyphens.
                  </p>
                </div>

                <div className="space-y-2">
                  <ShadcnLabel htmlFor="storeType">Store type</ShadcnLabel>
                  <ShadcnSelect
                    id="storeType"
                    name="storeType"
                    value={storeType}
                    onChange={(e) => setStoreType(e.target.value)}
                  >
                    {STORE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </ShadcnSelect>
                </div>

                <div className="space-y-2">
                  <ShadcnLabel htmlFor="description">Description</ShadcnLabel>
                  <ShadcnTextarea
                    id="description"
                    name="description"
                    placeholder="Tell customers what makes your store special..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <ShadcnButton
                    type="button"
                    variant="primary"
                    onClick={() => {
                      if (!storeName.trim() || !slug.trim()) {
                        toast.error('Please fill in store name and URL.');
                        return;
                      }
                      setStep(2);
                    }}
                  >
                    Continue
                  </ShadcnButton>
                </div>
              </ShadcnCardContent>
            </ShadcnCard>
          )}

          {/* Step 2: Address & contact */}
          {step === 2 && (
            <ShadcnCard>
              <ShadcnCardHeader>
                <ShadcnCardTitle>Address &amp; contact</ShadcnCardTitle>
                <ShadcnCardDescription>
                  Help customers find and reach you. Optional for online-only stores.
                </ShadcnCardDescription>
              </ShadcnCardHeader>
              <ShadcnCardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <ShadcnLabel htmlFor="email">Store email</ShadcnLabel>
                    <ShadcnInput
                      id="email"
                      name="email"
                      type="email"
                      placeholder="hello@store.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <ShadcnLabel htmlFor="phone">Phone number</ShadcnLabel>
                    <ShadcnInput
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <ShadcnSeparator />

                <div className="space-y-2">
                  <ShadcnLabel htmlFor="street">Street address</ShadcnLabel>
                  <ShadcnInput id="street" name="street" placeholder="123 Main St" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <ShadcnLabel htmlFor="city">City</ShadcnLabel>
                    <ShadcnInput id="city" name="city" placeholder="San Francisco" />
                  </div>
                  <div className="space-y-2">
                    <ShadcnLabel htmlFor="province">State / Province</ShadcnLabel>
                    <ShadcnInput id="province" name="province" placeholder="CA" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <ShadcnLabel htmlFor="postalCode">Postal code</ShadcnLabel>
                    <ShadcnInput id="postalCode" name="postalCode" placeholder="94105" />
                  </div>
                  <div className="space-y-2">
                    <ShadcnLabel htmlFor="country">Country</ShadcnLabel>
                    <ShadcnInput id="country" name="country" placeholder="US" />
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <ShadcnButton type="button" variant="ghost" onClick={() => setStep(1)}>
                    Back
                  </ShadcnButton>
                  <ShadcnButton type="submit" variant="primary" disabled={isPending}>
                    {isPending ? 'Creating store…' : 'Create store'}
                  </ShadcnButton>
                </div>
              </ShadcnCardContent>
            </ShadcnCard>
          )}
        </form>
      </div>
    </div>
  );
}
