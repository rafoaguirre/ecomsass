export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce scope for better commit organization
    'scope-empty': [2, 'never'], // Error if scope is missing
    'scope-case': [2, 'always', 'kebab-case'],

    // Define allowed scopes for this monorepo
    'scope-enum': [
      2,
      'always',
      [
        // Workspace-level
        'workspace',
        'monorepo',
        'deps',
        'ci',
        'config',

        // Backend services
        'api',
        'worker',
        'backend',
        'auth',
        'payments',

        // Frontend apps
        'web',
        'mobile',
        'admin',
        'client',

        // Blockchain
        'contracts',
        'blockchain',
        'web3',

        // Shared packages
        'domain',
        'types',
        'utils',
        'shared',
        'ui',
        'components',

        // Infrastructure
        'infra',
        'docker',
        'k8s',
        'terraform',

        // Documentation
        'docs',
      ],
    ],

    // Allow multiple scopes like "feat(api, web):"
    'scope-max-length': [2, 'always', 50],
  },
};
