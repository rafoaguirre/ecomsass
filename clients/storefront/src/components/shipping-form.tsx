'use client';

import { useState } from 'react';
import { ShadcnButton, ShadcnInput } from '@ecomsaas/ui/shadcn';

export interface ShippingInfo {
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface ShippingFormProps {
  onSubmit: (info: ShippingInfo) => void;
  isLoading?: boolean;
}

export function ShippingForm({ onSubmit, isLoading }: ShippingFormProps) {
  const [form, setForm] = useState<ShippingInfo>({
    fullName: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'CA',
  });

  const update = (field: keyof ShippingInfo, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const isValid =
    form.fullName.trim() &&
    form.street.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.postalCode.trim() &&
    form.country.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-display text-lg font-semibold text-foreground">Shipping Address</h3>

      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-foreground">
          Full Name
        </label>
        <ShadcnInput
          id="fullName"
          value={form.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          placeholder="John Doe"
          required
        />
      </div>

      <div>
        <label htmlFor="street" className="mb-1 block text-sm font-medium text-foreground">
          Street Address
        </label>
        <ShadcnInput
          id="street"
          value={form.street}
          onChange={(e) => update('street', e.target.value)}
          placeholder="123 Main St"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-medium text-foreground">
            City
          </label>
          <ShadcnInput
            id="city"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder="Toronto"
            required
          />
        </div>
        <div>
          <label htmlFor="state" className="mb-1 block text-sm font-medium text-foreground">
            Province / State
          </label>
          <ShadcnInput
            id="state"
            value={form.state}
            onChange={(e) => update('state', e.target.value)}
            placeholder="ON"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="postalCode" className="mb-1 block text-sm font-medium text-foreground">
            Postal / Zip Code
          </label>
          <ShadcnInput
            id="postalCode"
            value={form.postalCode}
            onChange={(e) => update('postalCode', e.target.value)}
            placeholder="M5V 2T6"
            required
          />
        </div>
        <div>
          <label htmlFor="country" className="mb-1 block text-sm font-medium text-foreground">
            Country
          </label>
          <ShadcnInput
            id="country"
            value={form.country}
            onChange={(e) => update('country', e.target.value)}
            placeholder="CA"
            required
          />
        </div>
      </div>

      <ShadcnButton
        type="submit"
        variant="primary"
        className="mt-2 w-full"
        size="lg"
        disabled={!isValid || isLoading}
      >
        {isLoading ? 'Creating order…' : 'Continue to Payment'}
      </ShadcnButton>
    </form>
  );
}
