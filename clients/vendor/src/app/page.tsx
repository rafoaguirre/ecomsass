import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  ShadcnButton,
  ShadcnCard,
  ShadcnCardContent,
  ShadcnCardHeader,
  ShadcnCardTitle,
} from '@ecomsaas/ui/shadcn';
import { logout } from './(auth)/actions';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = (user.user_metadata?.role as string) ?? 'Unknown';
  const businessName = (user.user_metadata?.business_name as string) ?? '';

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
          <form action={logout}>
            <ShadcnButton type="submit" variant="secondary" size="sm">
              Sign Out
            </ShadcnButton>
          </form>
        </div>

        <ShadcnCard className="mt-6">
          <ShadcnCardHeader>
            <ShadcnCardTitle>
              Welcome back{businessName ? `, ${businessName}` : ''}!
            </ShadcnCardTitle>
          </ShadcnCardHeader>
          <ShadcnCardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="font-medium text-muted">Email:</dt>
                <dd>{user.email}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-muted">Role:</dt>
                <dd>{role}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-muted">ID:</dt>
                <dd className="font-mono text-xs text-muted">{user.id}</dd>
              </div>
            </dl>
          </ShadcnCardContent>
        </ShadcnCard>

        <p className="mt-6 text-sm text-muted">Store management and product pages coming soon.</p>
      </div>
    </main>
  );
}
