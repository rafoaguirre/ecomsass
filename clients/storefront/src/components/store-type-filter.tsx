'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@ecomsaas/ui/shadcn';
import { STORE_TYPE_OPTIONS } from '@/lib/constants';

export function StoreTypeFilter({
  activeType,
  basePath = '/',
}: {
  activeType: string;
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleClick(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('storeType', value);
    } else {
      params.delete('storeType');
    }
    params.delete('offset');
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STORE_TYPE_OPTIONS.map((type) => (
        <button
          key={type.value}
          onClick={() => handleClick(type.value)}
          className={cn(
            'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
            activeType === type.value
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-border bg-white text-muted hover:border-brand-200 hover:text-foreground'
          )}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
