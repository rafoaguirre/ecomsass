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
import { PasswordInput } from '@/components/password-input';
import { login } from '../actions';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <ShadcnCard className="w-full max-w-sm">
        <ShadcnCardHeader className="text-center">
          <ShadcnCardTitle>Vendor Login</ShadcnCardTitle>
          <ShadcnCardDescription>Sign in to manage your store</ShadcnCardDescription>
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Password
                </label>
                <a href="/forgot-password" className="text-xs text-brand-500 hover:underline">
                  Forgot password?
                </a>
              </div>
              <PasswordInput id="password" name="password" required minLength={6} />
            </div>

            <ShadcnButton type="submit" variant="primary" className="w-full" disabled={isPending}>
              {isPending ? 'Signing in…' : 'Sign In'}
            </ShadcnButton>
          </form>

          <p className="text-center text-sm text-muted">
            Don&apos;t have an account?{' '}
            <a href="/register" className="font-medium text-brand-500 hover:underline">
              Register
            </a>
          </p>
        </ShadcnCardContent>
      </ShadcnCard>
    </main>
  );
}
