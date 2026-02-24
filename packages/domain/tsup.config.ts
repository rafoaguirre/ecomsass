import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    entities: 'src/entities/index.ts',
    enums: 'src/enums/index.ts',
    'value-objects': 'src/value-objects/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
});
