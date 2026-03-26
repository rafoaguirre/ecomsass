export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface DesignTokens {
  color: {
    brand: ColorScale;
    accent: ColorScale;
    neutral: ColorScale;
    success: string;
    warning: string;
    danger: string;
    background: string;
    surface: string;
    foreground: string;
    muted: string;
    border: string;
  };
  spacing: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', string>;
  radius: Record<'sm' | 'md' | 'lg' | 'xl' | 'pill', string>;
  shadow: Record<'sm' | 'md' | 'lg', string>;
  typography: {
    fontSans: string;
    fontDisplay: string;
    size: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', string>;
    weight: Record<'regular' | 'medium' | 'semibold' | 'bold', number>;
  };
}

export const tokens: DesignTokens = {
  color: {
    brand: {
      50: '#edf7ff',
      100: '#d7ecff',
      200: '#b5dcff',
      300: '#84c4ff',
      400: '#4ca3ff',
      500: '#1b80f2',
      600: '#0d63c7',
      700: '#0f4f9d',
      800: '#134381',
      900: '#16396b',
    },
    accent: {
      50: '#fff4ea',
      100: '#ffe6cd',
      200: '#ffcca1',
      300: '#ffad6b',
      400: '#ff8741',
      500: '#f76819',
      600: '#dd4d0d',
      700: '#b73b0f',
      800: '#923215',
      900: '#772d14',
    },
    neutral: {
      50: '#f7f8fa',
      100: '#eef1f5',
      200: '#dde3eb',
      300: '#c5ced9',
      400: '#9eabbb',
      500: '#7f8ea2',
      600: '#65758a',
      700: '#4f5c6f',
      800: '#3b4554',
      900: '#272e39',
    },
    success: '#168a56',
    warning: '#ad7a0a',
    danger: '#c0392b',
    background: '#f7f8fa',
    surface: '#ffffff',
    foreground: '#171a1f',
    muted: '#5d6776',
    border: '#dde3eb',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '22px',
    pill: '999px',
  },
  shadow: {
    sm: '0 1px 2px rgba(23,26,31,0.08)',
    md: '0 6px 16px rgba(23,26,31,0.1)',
    lg: '0 12px 32px rgba(23,26,31,0.14)',
  },
  typography: {
    fontSans: "'Manrope', 'Inter', 'Segoe UI', sans-serif",
    fontDisplay: "'Sora', 'Inter', sans-serif",
    size: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '24px',
      '2xl': '32px',
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

export function createCssVariables(theme: DesignTokens = tokens): string {
  return `:root {
  --ui-color-background: ${theme.color.background};
  --ui-color-surface: ${theme.color.surface};
  --ui-color-foreground: ${theme.color.foreground};
  --ui-color-muted: ${theme.color.muted};
  --ui-color-border: ${theme.color.border};
  --ui-color-brand-500: ${theme.color.brand[500]};
  --ui-color-brand-600: ${theme.color.brand[600]};
  --ui-color-accent-500: ${theme.color.accent[500]};
  --ui-color-accent-600: ${theme.color.accent[600]};
  --ui-radius-md: ${theme.radius.md};
  --ui-radius-pill: ${theme.radius.pill};
  --ui-shadow-md: ${theme.shadow.md};
  --ui-font-sans: ${theme.typography.fontSans};
  --ui-font-display: ${theme.typography.fontDisplay};
}`;
}
