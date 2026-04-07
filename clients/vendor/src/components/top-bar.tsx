'use client';

import { ShadcnButton } from '@ecomsaas/ui/shadcn';
import { logout } from '@/app/(auth)/actions';

export function TopBar({ email, businessName }: { email: string; businessName: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{businessName || 'My Store'}</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted">{email}</span>
        <form action={logout}>
          <ShadcnButton type="submit" variant="ghost" size="sm">
            Sign Out
          </ShadcnButton>
        </form>
      </div>
    </header>
  );
}
