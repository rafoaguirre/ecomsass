import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    tokens: 'src/tokens.ts',
    'core/index': 'src/core/index.ts',
    'web/index': 'src/web/index.ts',
    'native/index': 'src/native/index.ts',
    'shadcn/index': 'src/shadcn/index.ts',
    'lib/order-utils': 'src/lib/order-utils.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom'],
});
