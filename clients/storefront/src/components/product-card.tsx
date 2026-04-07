import Link from 'next/link';
import type { ProductResponse } from '@/lib/api';
import { ShadcnBadge } from '@ecomsaas/ui/shadcn';
import { AVAILABILITY } from '@/lib/constants';
import { formatPrice } from '@/lib/formatting';

export function ProductCard({
  product,
  storeSlug,
}: {
  product: ProductResponse;
  storeSlug: string;
}) {
  const availability = AVAILABILITY[product.availability] ?? {
    label: product.availability,
    variant: 'secondary' as const,
  };
  const mainImage = product.images.find((img) => img.main) ?? product.images[0];

  return (
    <Link
      href={`/stores/${storeSlug}/products/${product.id}`}
      className="group block rounded-[--radius-md] border border-border bg-white shadow-sm transition-all hover:shadow-md hover:border-brand-200"
    >
      {/* Image / placeholder */}
      <div className="flex h-48 items-center justify-center rounded-t-[--radius-md] bg-neutral-50">
        {mainImage ? (
          <img
            src={mainImage.src}
            alt={mainImage.alt ?? product.name}
            className="h-full w-full rounded-t-[--radius-md] object-cover"
          />
        ) : (
          <svg
            className="h-12 w-12 text-neutral-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"
            />
          </svg>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-medium text-foreground group-hover:text-brand-600 transition-colors line-clamp-1">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">
            {formatPrice(product.price)}
          </span>
          <ShadcnBadge variant={availability.variant} className="text-[11px]">
            {availability.label}
          </ShadcnBadge>
        </div>

        {product.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
