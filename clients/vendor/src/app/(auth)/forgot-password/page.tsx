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
} from '@ecomsaas/ui/shadcn';
import { forgotPassword } from '../actions';

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.error === '') {
      setSent(true);
    } else {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <ShadcnCard className="w-full max-w-sm">
        <ShadcnCardHeader className="text-center">
          <ShadcnCardTitle>Reset Password</ShadcnCardTitle>
          <ShadcnCardDescription>
            {sent
              ? 'Check your email for a reset link'
              : 'Enter your email to receive a password reset link'}
          </ShadcnCardDescription>
        </ShadcnCardHeader>
        <ShadcnCardContent className="space-y-6">
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm text-muted">
                If an account exists for that email, you&apos;ll receive a reset link shortly.
              </p>
              <a href="/login" className="text-sm font-medium text-brand-500 hover:underline">
                Back to Sign In
              </a>
            </div>
          ) : (
            <>
              <form action={formAction} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Email
                  </label>
                  <ShadcnInput id="email" name="email" type="email" required />
                </div>

                <ShadcnButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isPending}
                >
                  {isPending ? 'Sending…' : 'Send Reset Link'}
                </ShadcnButton>
              </form>

              <p className="text-center text-sm text-muted">
                Remember your password?{' '}
                <a href="/login" className="font-medium text-brand-500 hover:underline">
                  Sign In
                </a>
              </p>
            </>
          )}
        </ShadcnCardContent>
      </ShadcnCard>
    </main>
  );
}
