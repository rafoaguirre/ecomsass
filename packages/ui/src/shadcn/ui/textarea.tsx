import * as React from 'react';
import { cn } from '../lib/utils';

export type ShadcnTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function ShadcnTextarea({ className, ...props }: ShadcnTextareaProps) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-[--radius-md] border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}
