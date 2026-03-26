import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { getButtonClassName } from '../core';
import { cx } from '../core';
import type { BaseComponentProps, ButtonVariant, ComponentSize } from '../core';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>, BaseComponentProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ComponentSize;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  testId,
  ...props
}: ButtonProps) {
  return (
    <button
      data-testid={testId}
      className={cx(getButtonClassName(variant, size), className)}
      {...props}
    >
      {children}
    </button>
  );
}
