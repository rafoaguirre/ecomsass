import type { ButtonVariant, ComponentSize } from '../core/types';

export type NativeComponentSize = ComponentSize;
export type NativeButtonVariant = ButtonVariant;

export interface NativeTextStyle {
  color?: string;
  fontSize?: number;
  fontWeight?: '400' | '500' | '600' | '700';
}

export interface NativeViewStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
}

export interface NativeButtonStyles {
  container: NativeViewStyle;
  text: NativeTextStyle;
}
