import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    core: 'src/core/index.ts',
    entities: 'src/entities/index.ts',
    enums: 'src/enums/index.ts',
    errors: 'src/errors/index.ts',
    'value-objects': 'src/value-objects/index.ts',
    models: 'src/models/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
});
