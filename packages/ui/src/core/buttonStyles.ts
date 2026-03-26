import type { ButtonVariant, ComponentSize } from './types';
import { cx } from './cx';

const sizeClasses: Record<ComponentSize, string> = {
  sm: 'ui-btn-sm',
  md: 'ui-btn-md',
  lg: 'ui-btn-lg',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'ui-btn-primary',
  secondary: 'ui-btn-secondary',
  ghost: 'ui-btn-ghost',
};

export function getButtonClassName(variant: ButtonVariant, size: ComponentSize): string {
  return cx('ui-btn', sizeClasses[size], variantClasses[variant]);
}
