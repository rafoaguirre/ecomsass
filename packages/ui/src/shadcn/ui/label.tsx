import * as React from 'react';
import { cn } from '../lib/utils';

export type ShadcnLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function ShadcnLabel({ className, ...props }: ShadcnLabelProps) {
  return (
    <label
      className={cn('text-sm font-semibold leading-none text-foreground', className)}
      {...props}
    />
  );
}
