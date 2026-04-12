'use client';

import Link from 'next/link';
import { cn } from '@ecomsaas/ui/shadcn';
import { ORDER_STATUS_CONFIG, FILTERABLE_STATUSES } from './order-utils';

interface StatusFilterProps {
  currentStatus?: string;
}

export function StatusFilter({ currentStatus }: StatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/dashboard/orders"
        className={cn(
          'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
          !currentStatus ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        )}
      >
        All
      </Link>
      {FILTERABLE_STATUSES.map((value) => {
        const isActive = currentStatus === value;
        return (
          <Link
            key={value}
            href={`?status=${value}`}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              isActive ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {ORDER_STATUS_CONFIG[value]?.label ?? value}
          </Link>
        );
      })}
    </div>
  );
}
