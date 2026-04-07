import { createClient } from '@/lib/supabase/server';
import { ShadcnButton } from '@ecomsaas/ui/shadcn';
import Link from 'next/link';
import { logout } from '@/app/(auth)/actions';
import { Logo } from '@/components/logo';

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        {/* Nav links */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Marketplace
          </Link>
          <Link
            href="/stores"
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            All Stores
          </Link>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
              <form action={logout}>
                <ShadcnButton type="submit" variant="secondary" size="sm">
                  Sign Out
                </ShadcnButton>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <ShadcnButton variant="secondary" size="sm">
                  Sign In
                </ShadcnButton>
              </Link>
              <Link href="/register">
                <ShadcnButton variant="primary" size="sm">
                  Register
                </ShadcnButton>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
