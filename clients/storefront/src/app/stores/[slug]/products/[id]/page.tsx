import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShadcnBadge, ShadcnButton } from '@ecomsaas/ui/shadcn';
import { fetchProduct, fetchStoreBySlug } from '@/lib/api';
import { AVAILABILITY } from '@/lib/constants';
import { formatPrice } from '@/lib/formatting';

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await fetchProduct(id);
    return {
      title: `${product.name} — EcomSaaS`,
      description: product.description ?? `Buy ${product.name} on EcomSaaS.`,
    };
  } catch {
    return { title: 'Product Not Found — EcomSaaS' };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug, id } = await params;

  let product;
  try {
    product = await fetchProduct(id);
  } catch {
    notFound();
  }

  let store;
  try {
    store = await fetchStoreBySlug(slug);
  } catch {
    store = null;
  }

  const availability = AVAILABILITY[product.availability] ?? {
    label: product.availability,
    variant: 'secondary' as const,
    canBuy: false,
  };
  const mainImage = product.images.find((img) => img.main) ?? product.images[0];
  const hasComparePrice =
    product.compareAtPrice && Number(product.compareAtPrice.amount) > Number(product.price.amount);

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
            <Link href={`/stores/${slug}`} className="hover:text-foreground">
              {store?.name ?? slug}
            </Link>
            <span>/</span>
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product detail */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Image */}
          <div className="flex items-center justify-center rounded-[--radius-lg] border border-border bg-neutral-50">
            {mainImage ? (
              <img
                src={mainImage.src}
                alt={mainImage.alt ?? product.name}
                className="max-h-[500px] w-full rounded-[--radius-lg] object-contain p-4"
              />
            ) : (
              <div className="flex h-80 w-full items-center justify-center">
                <svg
                  className="h-24 w-24 text-neutral-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={0.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                {product.name}
              </h1>
              <ShadcnBadge variant={availability.variant}>{availability.label}</ShadcnBadge>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">
                {formatPrice(product.price)}
              </span>
              {hasComparePrice && product.compareAtPrice && (
                <span className="text-lg text-muted line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-6 border-t border-border pt-6">
                <h2 className="text-sm font-semibold text-foreground">Description</h2>
                <p className="mt-2 whitespace-pre-line text-muted">{product.description}</p>
              </div>
            )}

            {/* Add to cart */}
            <div className="mt-8">
              <ShadcnButton
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                disabled={!availability.canBuy}
              >
                {availability.canBuy ? 'Add to Cart' : availability.label}
              </ShadcnButton>
              {!availability.canBuy && (
                <p className="mt-2 text-sm text-muted">
                  This product is currently not available for purchase.
                </p>
              )}
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="mt-6 border-t border-border pt-6">
                <h2 className="text-sm font-semibold text-foreground">Tags</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-neutral-50 px-2.5 py-0.5 text-xs text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Store info */}
            {store && (
              <div className="mt-6 rounded-[--radius-md] border border-border bg-neutral-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-600">
                    {store.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Link
                      href={`/stores/${slug}`}
                      className="text-sm font-semibold text-foreground hover:text-brand-600"
                    >
                      {store.name}
                    </Link>
                    {/* <p className="text-xs text-muted">by {store.vendorName}</p> */}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
