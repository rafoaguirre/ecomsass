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
} from '@ecomsaas/ui/shadcn';
import { PasswordInput } from '@/components/password-input';
import { resetPassword } from '../actions';

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPassword, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <ShadcnCard className="w-full max-w-sm">
        <ShadcnCardHeader className="text-center">
          <ShadcnCardTitle>Set New Password</ShadcnCardTitle>
          <ShadcnCardDescription>Enter your new password below</ShadcnCardDescription>
        </ShadcnCardHeader>
        <ShadcnCardContent className="space-y-6">
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-foreground">
                New Password
              </label>
              <PasswordInput id="password" name="password" required minLength={6} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                Confirm Password
              </label>
              <PasswordInput id="confirmPassword" name="confirmPassword" required minLength={6} />
            </div>

            <ShadcnButton type="submit" variant="primary" className="w-full" disabled={isPending}>
              {isPending ? 'Updating…' : 'Update Password'}
            </ShadcnButton>
          </form>
        </ShadcnCardContent>
      </ShadcnCard>
    </main>
  );
}
