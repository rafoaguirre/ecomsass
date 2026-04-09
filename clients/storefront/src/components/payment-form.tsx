'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { ShadcnButton } from '@ecomsaas/ui/shadcn';

interface PaymentFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function PaymentForm({ onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation`,
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message ?? 'Payment failed. Please try again.');
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <ShadcnButton
        type="submit"
        variant="primary"
        className="w-full"
        size="lg"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing…' : 'Pay Now'}
      </ShadcnButton>
    </form>
  );
}
