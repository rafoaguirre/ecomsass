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
} from '@ecomsaas/ui/shadcn';
import { register } from '../actions';

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <ShadcnCard className="w-full max-w-sm">
        <ShadcnCardHeader className="text-center">
          <ShadcnCardTitle>Create Account</ShadcnCardTitle>
          <ShadcnCardDescription>Join EcomSaaS marketplace</ShadcnCardDescription>
        </ShadcnCardHeader>
        <ShadcnCardContent className="space-y-6">
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email
              </label>
              <ShadcnInput id="email" name="email" type="email" required />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-foreground">
                Password
              </label>
              <ShadcnInput id="password" name="password" type="password" required minLength={6} />
            </div>

            <ShadcnButton type="submit" variant="primary" className="w-full" disabled={isPending}>
              {isPending ? 'Creating account…' : 'Create Account'}
            </ShadcnButton>
          </form>

          <p className="text-center text-sm text-muted">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-brand-500 hover:underline">
              Sign In
            </a>
          </p>
        </ShadcnCardContent>
      </ShadcnCard>
    </main>
  );
}
