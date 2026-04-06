import {
  ShadcnButton,
  ShadcnCard,
  ShadcnCardContent,
  ShadcnCardDescription,
  ShadcnCardHeader,
  ShadcnCardTitle,
  ShadcnInput,
} from '@ecomsaas/ui/shadcn';
import { login } from '../actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <ShadcnCard className="w-full max-w-sm">
        <ShadcnCardHeader className="text-center">
          <ShadcnCardTitle>Sign In</ShadcnCardTitle>
          <ShadcnCardDescription>Welcome back to EcomSaaS</ShadcnCardDescription>
        </ShadcnCardHeader>
        <ShadcnCardContent className="space-y-6">
          {error && (
            <div className="rounded-[--radius-md] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form action={login} className="space-y-4">
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

            <ShadcnButton type="submit" variant="primary" className="w-full">
              Sign In
            </ShadcnButton>
          </form>

          <p className="text-center text-sm text-muted">
            Don&apos;t have an account?{' '}
            <a href="/register" className="font-medium text-brand-500 hover:underline">
              Create one
            </a>
          </p>
        </ShadcnCardContent>
      </ShadcnCard>
    </main>
  );
}
