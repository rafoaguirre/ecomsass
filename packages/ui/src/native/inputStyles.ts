import { tokens } from '../tokens';
import type { NativeTextStyle, NativeViewStyle } from './types';

export interface NativeInputStyles {
  container: NativeViewStyle;
  input: NativeTextStyle;
  label: NativeTextStyle;
  feedback: NativeTextStyle;
  error: NativeTextStyle;
}

export function getNativeInputStyles(): NativeInputStyles {
  return {
    container: {
      borderColor: tokens.color.border,
      borderWidth: 1,
      borderRadius: Number.parseInt(tokens.radius.sm, 10),
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    input: {
      color: tokens.color.foreground,
      fontSize: 14,
      fontWeight: '500',
    },
    label: {
      color: tokens.color.neutral[700],
      fontSize: 13,
      fontWeight: '600',
    },
    feedback: {
      color: tokens.color.muted,
      fontSize: 12,
      fontWeight: '500',
    },
    error: {
      color: tokens.color.danger,
      fontSize: 12,
      fontWeight: '500',
    },
  };
}
