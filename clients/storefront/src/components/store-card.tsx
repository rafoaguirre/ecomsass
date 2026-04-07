import Link from 'next/link';
import { ShadcnBadge } from '@ecomsaas/ui/shadcn';
import type { StoreListItem } from '@/lib/api';
import { STORE_TYPE_LABELS } from '@/lib/constants';

export function StoreCard({ store }: { store: StoreListItem }) {
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="group block rounded-[--radius-md] border border-border bg-white shadow-sm transition-all hover:shadow-md hover:border-brand-200"
    >
      {/* Placeholder banner */}
      <div className="flex h-32 items-center justify-center rounded-t-[--radius-md] bg-gradient-to-br from-brand-50 to-brand-100">
        <span className="text-4xl font-bold text-brand-300">
          {store.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-foreground group-hover:text-brand-600 transition-colors">
            {store.name}
          </h3>
          <ShadcnBadge variant="secondary" className="shrink-0 text-[11px]">
            {STORE_TYPE_LABELS[store.storeType] ?? store.storeType}
          </ShadcnBadge>
        </div>

        {store.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{store.description}</p>
        )}

        {/* <p className="mt-3 text-xs text-muted">
          by <span className="font-medium text-foreground">{store.vendorName}</span>
        </p> */}
      </div>
    </Link>
  );
}
