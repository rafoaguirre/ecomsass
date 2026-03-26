import * as React from 'react';
import { cn } from '../lib/utils';
import { ShadcnButton } from './button';

export interface ShadcnModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
}

export function ShadcnModal({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  className,
}: ShadcnModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'w-full max-w-xl rounded-2xl border border-border bg-white p-5 shadow-xl',
          className
        )}
      >
        <header className="mb-3">
          <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
        </header>
        <div className="mb-4">{children}</div>
        <footer className="flex justify-end gap-2">
          <ShadcnButton variant="ghost" onClick={onClose}>
            {cancelLabel}
          </ShadcnButton>
          {onConfirm ? (
            <ShadcnButton variant="primary" onClick={onConfirm}>
              {confirmLabel}
            </ShadcnButton>
          ) : null}
        </footer>
      </section>
    </div>
  );
}
