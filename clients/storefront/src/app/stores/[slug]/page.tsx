import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShadcnBadge } from '@ecomsaas/ui/shadcn';
import { fetchStoreBySlug, fetchStoreProducts } from '@/lib/api';
import { STORE_TYPE_LABELS } from '@/lib/constants';
import { ProductCard } from '@/components/product-card';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const store = await fetchStoreBySlug(slug);
    return {
      title: `${store.name} — EcomSaaS Marketplace`,
      description: store.description ?? `Shop ${store.name} on EcomSaaS.`,
    };
  } catch {
    return { title: 'Store Not Found — EcomSaaS' };
  }
}

export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;

  let store;
  try {
    store = await fetchStoreBySlug(slug);
  } catch {
    notFound();
  }

  let products;
  try {
    products = await fetchStoreProducts(store.id);
  } catch {
    products = { products: [], totalCount: 0 };
  }

  const address = store.address;
  const cityLine = address
    ? [address.city, address.province, address.country].filter(Boolean).join(', ')
    : null;

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-2 text-sm text-muted">
            <Link href="/" className="hover:text-foreground">
              Marketplace
            </Link>
            <span>/</span>
            <span className="text-foreground">{store.name}</span>
          </nav>
        </div>
      </div>

      {/* Store header */}
      <section className="border-b border-border bg-gradient-to-b from-brand-50/40 to-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-3xl font-bold text-brand-600">
              {store.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                  {store.name}
                </h1>
                <ShadcnBadge variant="default">
                  {STORE_TYPE_LABELS[store.storeType] ?? store.storeType}
                </ShadcnBadge>
              </div>

              {store.description && (
                <p className="mt-2 max-w-2xl text-muted">{store.description}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
                {/* <span>
                  by <span className="font-medium text-foreground">{store.vendorName}</span>
                </span> */}
                {cityLine && <span>📍 {cityLine}</span>}
                <span>
                  Joined{' '}
                  {new Date(store.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Products ({products.totalCount})
          </h2>
        </div>

        {products.products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.products.map((product) => (
              <ProductCard key={product.id} product={product} storeSlug={slug} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-foreground">No products yet</p>
            <p className="mt-1 text-sm text-muted">
              This store hasn&apos;t listed any products yet. Check back soon!
            </p>
          </div>
        )}
      </section>
    </>
  );
}
