import { tokens } from '../tokens';
import type { ButtonVariant, ComponentSize } from '../core/types';
import type { NativeButtonStyles } from './types';

const sizeStyles: Record<
  ComponentSize,
  { paddingVertical: number; paddingHorizontal: number; fontSize: number }
> = {
  sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 13 },
  md: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14 },
  lg: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15 },
};

const variantStyles: Record<
  ButtonVariant,
  { backgroundColor: string; borderColor: string; borderWidth: number; textColor: string }
> = {
  primary: {
    backgroundColor: tokens.color.brand[500],
    borderColor: tokens.color.brand[600],
    borderWidth: 1,
    textColor: '#ffffff',
  },
  secondary: {
    backgroundColor: tokens.color.brand[50],
    borderColor: tokens.color.brand[200],
    borderWidth: 1,
    textColor: tokens.color.brand[700],
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: tokens.color.border,
    borderWidth: 1,
    textColor: tokens.color.foreground,
  },
};

export function getNativeButtonStyles(
  variant: ButtonVariant = 'primary',
  size: ComponentSize = 'md'
): NativeButtonStyles {
  const sizeStyle = sizeStyles[size];
  const variantStyle = variantStyles[variant];

  return {
    container: {
      backgroundColor: variantStyle.backgroundColor,
      borderColor: variantStyle.borderColor,
      borderWidth: variantStyle.borderWidth,
      borderRadius: Number.parseInt(tokens.radius.pill, 10),
      paddingVertical: sizeStyle.paddingVertical,
      paddingHorizontal: sizeStyle.paddingHorizontal,
    },
    text: {
      color: variantStyle.textColor,
      fontSize: sizeStyle.fontSize,
      fontWeight: '600',
    },
  };
}
