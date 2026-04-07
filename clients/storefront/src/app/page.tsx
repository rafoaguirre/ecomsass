import { createClient } from '@/lib/supabase/server';
import { ShadcnButton } from '@ecomsaas/ui/shadcn';
import { logout } from './(auth)/actions';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold">EcomSaaS Marketplace</h1>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted">{user.email}</span>
              <form action={logout}>
                <ShadcnButton type="submit" variant="secondary" size="sm">
                  Sign Out
                </ShadcnButton>
              </form>
            </div>
          ) : (
            <div className="flex gap-2">
              <a href="/login">
                <ShadcnButton variant="secondary" size="sm">
                  Sign In
                </ShadcnButton>
              </a>
              <a href="/register">
                <ShadcnButton variant="primary" size="sm">
                  Register
                </ShadcnButton>
              </a>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-3xl font-bold">Discover Stores</h2>
        <p className="mt-2 text-muted">
          Browse our marketplace of vendor stores. Store listings coming soon.
        </p>
      </div>
    </main>
  );
}
