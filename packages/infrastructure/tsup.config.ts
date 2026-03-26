import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'id-generator/index': 'src/id-generator/index.ts',
    'logger/index': 'src/logger/index.ts',
    'secrets/index': 'src/secrets/index.ts',
    'http/index': 'src/http/index.ts',
    'cache/index': 'src/cache/index.ts',
    'queue/index': 'src/queue/index.ts',
    'database/index': 'src/database/index.ts',
    'storage/index': 'src/storage/index.ts',
    'tracing/index': 'src/tracing/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
});
