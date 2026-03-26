import type { ReactNode } from 'react';
import { Button } from './Button';
import { cx } from '../core';
import type { BaseComponentProps } from '../core';

export interface ModalProps extends BaseComponentProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}

export function Modal({
  open,
  title,
  children,
  onClose,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  className,
  testId,
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="ui-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid={testId}
    >
      <div className={cx('ui-modal', className)}>
        <div className="ui-modal-header">
          <h3 className="ui-modal-title">{title}</h3>
        </div>
        <div className="ui-modal-content">{children}</div>
        <div className="ui-modal-actions">
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          {onConfirm ? (
            <Button variant="primary" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
