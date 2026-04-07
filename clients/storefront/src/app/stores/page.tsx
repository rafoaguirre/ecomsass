import type { Metadata } from 'next';
import { Suspense } from 'react';
import { fetchStores } from '@/lib/api';
import { StoreCard } from '@/components/store-card';
import { SearchBar } from '@/components/search-bar';
import { StoreTypeFilter } from '@/components/store-type-filter';
import { Pagination } from '@/components/pagination';

export const metadata: Metadata = {
  title: 'All Stores — EcomSaaS Marketplace',
  description: 'Browse all vendor stores on EcomSaaS.',
};

interface PageProps {
  searchParams: Promise<{ q?: string; storeType?: string; offset?: string }>;
}

export default async function AllStoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q ?? '';
  const storeType = params.storeType ?? '';
  const offset = Number(params.offset) || 0;

  let stores;
  let error: string | null = null;

  try {
    stores = await fetchStores({
      q: q || undefined,
      storeType: storeType || undefined,
      offset,
      limit: 20,
      sortBy: 'name',
      sortDirection: 'asc',
    });
  } catch {
    error = 'Unable to load stores. Make sure the API is running.';
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">All Stores</h1>
        <p className="mt-1 text-muted">Browse our full directory of vendor stores.</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Suspense>
          <StoreTypeFilter activeType={storeType} basePath="/stores" />
        </Suspense>
        <Suspense>
          <SearchBar defaultValue={q} basePath="/stores" />
        </Suspense>
      </div>

      {error && (
        <div className="rounded-[--radius-md] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {stores && (
        <>
          <p className="mb-4 text-sm text-muted">
            {stores.totalCount} {stores.totalCount === 1 ? 'store' : 'stores'}
          </p>

          {stores.stores.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {stores.stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-lg font-medium text-foreground">No stores found</p>
              <p className="mt-1 text-sm text-muted">
                {q ? 'Try a different search term.' : 'Check back soon for new stores.'}
              </p>
            </div>
          )}

          <Pagination
            basePath="/stores"
            q={q}
            storeType={storeType}
            offset={offset}
            hasMore={stores.hasMore}
          />
        </>
      )}
    </section>
  );
}
