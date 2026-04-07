import { Suspense } from 'react';
import { fetchStores } from '@/lib/api';
import { StoreCard } from '@/components/store-card';
import { SearchBar } from '@/components/search-bar';
import { StoreTypeFilter } from '@/components/store-type-filter';
import { Pagination } from '@/components/pagination';

interface PageProps {
  searchParams: Promise<{ q?: string; storeType?: string; offset?: string }>;
}

export default async function MarketplacePage({ searchParams }: PageProps) {
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
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });
  } catch {
    error = 'Unable to load stores. Make sure the API is running.';
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-brand-50/60 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Discover Amazing Stores
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
            Browse our curated marketplace of vendor stores. Find unique products from independent
            sellers.
          </p>
          <div className="mt-8 flex justify-center">
            <Suspense>
              <SearchBar defaultValue={q} basePath="/" />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Filters + Listings */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Type filter */}
        <div className="mb-8">
          <Suspense>
            <StoreTypeFilter activeType={storeType} basePath="/" />
          </Suspense>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-[--radius-md] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {/* Results */}
        {stores && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted">
                {stores.totalCount} {stores.totalCount === 1 ? 'store' : 'stores'} found
                {q && (
                  <>
                    {' '}
                    for &ldquo;<span className="font-medium text-foreground">{q}</span>&rdquo;
                  </>
                )}
              </p>
            </div>

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
              basePath="/"
              q={q}
              storeType={storeType}
              offset={offset}
              hasMore={stores.hasMore}
            />
          </>
        )}
      </section>
    </>
  );
}
