import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/build/**',
      '**/next-env.d.ts',
      '**/.next/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/*.config.ts', '**/.storybook/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettier,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
  {
    files: ['**/*.config.ts', '**/*.config.js'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettier,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/.storybook/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettier,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // ── Clean Architecture boundary enforcement ────────────────────────
  //
  // Domain (innermost): zero @ecomsaas/* imports, no framework deps
  {
    files: ['packages/domain/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@ecomsaas/*'],
              message: 'Domain must not import any other @ecomsaas package.',
            },
            {
              group: [
                '@nestjs/*',
                '@supabase/*',
                'express',
                'next',
                'next/*',
                'react',
                'react-dom',
              ],
              message: 'Domain must not import framework or infrastructure libraries.',
            },
          ],
        },
      ],
    },
  },
  // Contracts: may import @ecomsaas/domain only
  {
    files: ['packages/contracts/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@ecomsaas/application',
                '@ecomsaas/application/*',
                '@ecomsaas/infrastructure',
                '@ecomsaas/infrastructure/*',
                '@ecomsaas/validation',
                '@ecomsaas/validation/*',
                '@ecomsaas/contracts',
                '@ecomsaas/contracts/*',
                '@ecomsaas/ui',
                '@ecomsaas/ui/*',
                '@ecomsaas/api',
              ],
              message: 'Contracts may only import from @ecomsaas/domain.',
            },
            {
              group: [
                '@nestjs/*',
                '@supabase/*',
                'express',
                'next',
                'next/*',
                'react',
                'react-dom',
              ],
              message: 'Contracts must not import framework or infrastructure libraries.',
            },
          ],
        },
      ],
    },
  },
  // Application: may import @ecomsaas/domain only (defines ports, never adapters)
  {
    files: ['packages/application/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@ecomsaas/infrastructure',
                '@ecomsaas/infrastructure/*',
                '@ecomsaas/contracts',
                '@ecomsaas/contracts/*',
                '@ecomsaas/validation',
                '@ecomsaas/validation/*',
                '@ecomsaas/ui',
                '@ecomsaas/ui/*',
                '@ecomsaas/api',
              ],
              message: 'Application may only import from @ecomsaas/domain.',
            },
            {
              group: [
                '@nestjs/*',
                '@supabase/*',
                'express',
                'next',
                'next/*',
                'react',
                'react-dom',
              ],
              message: 'Application must not import framework or infrastructure libraries.',
            },
          ],
        },
      ],
    },
  },
  // Infrastructure: may import @ecomsaas/application (and transitively domain) + third-party
  {
    files: ['packages/infrastructure/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@ecomsaas/contracts',
                '@ecomsaas/contracts/*',
                '@ecomsaas/validation',
                '@ecomsaas/validation/*',
                '@ecomsaas/ui',
                '@ecomsaas/ui/*',
                '@ecomsaas/api',
                '@nestjs/*',
                'express',
                'next',
                'next/*',
                'react',
                'react-dom',
              ],
              message:
                'Infrastructure may import @ecomsaas/application, @ecomsaas/domain, and third-party libs only.',
            },
          ],
        },
      ],
    },
  },
];
