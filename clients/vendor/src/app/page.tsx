import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
          <form action={logout}>
            <button
              type="submit"
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold">
            Welcome back{businessName ? `, ${businessName}` : ''}!
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium text-gray-500">Email:</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-gray-500">Role:</dt>
              <dd>{role}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-gray-500">ID:</dt>
              <dd className="font-mono text-xs text-gray-400">{user.id}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Store management and product pages coming soon.
        </p>
      </div>
    </main>
  );
}
