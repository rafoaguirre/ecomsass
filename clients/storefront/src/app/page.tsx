import { createClient } from '@/lib/supabase/server';
import { logout } from './(auth)/actions';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold">EcomSaaS Marketplace</h1>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex gap-2">
              <a
                href="/login"
                className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign In
              </a>
              <a
                href="/register"
                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Register
              </a>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-3xl font-bold">Discover Stores</h2>
        <p className="mt-2 text-gray-600">
          Browse our marketplace of vendor stores. Store listings coming soon.
        </p>
      </div>
    </main>
  );
}
