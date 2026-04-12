import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth';
import {
  ShadcnBadge,
  ShadcnCard,
  ShadcnCardContent,
  ShadcnCardDescription,
  ShadcnCardHeader,
  ShadcnCardTitle,
} from '@ecomsaas/ui/shadcn';

export default async function DashboardPage() {
  const user = await getAuthUser();
  const supabase = await createClient();

  const businessName = (user.user_metadata?.business_name as string) ?? 'Your Store';

  // Fetch vendor profile + store
  const { data: vendorProfile } = await supabase
    .from('vendor_profiles')
    .select('id, verification_status, onboarding_completed')
    .eq('user_id', user.id)
    .single();

  if (!vendorProfile) redirect('/onboarding');

  const { data: store } = await supabase
    .from('stores')
    .select('id, name, slug, store_type, is_active, created_at')
    .eq('vendor_profile_id', vendorProfile.id)
    .limit(1)
    .single();

  if (!store) redirect('/onboarding');

  // Count products
  const { count: productCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', store.id);

  // Count orders
  const { count: orderCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', store.id);

  // Sum revenue from completed/confirmed orders
  const { data: revenueData } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('store_id', store.id)
    .in('status', ['CONFIRMED', 'PROCESSING', 'PACKED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED']);

  const totalRevenue = (revenueData ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0);

  const formattedRevenue =
    totalRevenue > 0
      ? (totalRevenue / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      : '$0';

  const stats = [
    {
      label: 'Products',
      value: productCount ?? 0,
      description: 'Active listings',
      icon: (
        <svg
          className="h-5 w-5 text-brand-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
      ),
    },
    {
      label: 'Orders',
      value: orderCount ?? 0,
      description: 'Total orders',
      icon: (
        <svg
          className="h-5 w-5 text-brand-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121 0 2.09-.773 2.21-1.886L21 5.25H6.727"
          />
        </svg>
      ),
    },
    {
      label: 'Revenue',
      value: formattedRevenue,
      description: 'Confirmed orders',
      icon: (
        <svg
          className="h-5 w-5 text-brand-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Welcome back, {businessName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <ShadcnCard key={stat.label}>
            <ShadcnCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-muted">{stat.description}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  {stat.icon}
                </div>
              </div>
            </ShadcnCardContent>
          </ShadcnCard>
        ))}
      </div>

      {/* Store info card */}
      <ShadcnCard>
        <ShadcnCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <ShadcnCardTitle>{store.name}</ShadcnCardTitle>
              <ShadcnCardDescription>ecomsaas.com/{store.slug}</ShadcnCardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ShadcnBadge variant={store.is_active ? 'success' : 'secondary'}>
                {store.is_active ? 'Active' : 'Inactive'}
              </ShadcnBadge>
              <ShadcnBadge variant="default">{store.store_type}</ShadcnBadge>
            </div>
          </div>
        </ShadcnCardHeader>
        <ShadcnCardContent>
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="font-medium text-muted">Created</p>
              <p className="mt-0.5 text-foreground">
                {new Date(store.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="font-medium text-muted">Verification</p>
              <p className="mt-0.5">
                <ShadcnBadge
                  variant={
                    vendorProfile.verification_status === 'Verified'
                      ? 'success'
                      : vendorProfile.verification_status === 'Pending'
                        ? 'warning'
                        : 'secondary'
                  }
                >
                  {vendorProfile.verification_status}
                </ShadcnBadge>
              </p>
            </div>
            <div>
              <p className="font-medium text-muted">Products</p>
              <p className="mt-0.5 text-foreground">{productCount ?? 0} listed</p>
            </div>
          </div>
        </ShadcnCardContent>
      </ShadcnCard>
    </div>
  );
}
