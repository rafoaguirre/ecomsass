import * as React from 'react';
import { cn } from '../lib/utils';

export interface ShadcnBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'secondary';
}

const variantClasses: Record<NonNullable<ShadcnBadgeProps['variant']>, string> = {
  default: 'bg-brand-50 text-brand-700 border-brand-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  secondary: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

export function ShadcnBadge({ className, variant = 'default', ...props }: ShadcnBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
