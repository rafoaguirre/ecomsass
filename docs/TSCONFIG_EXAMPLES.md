# TypeScript Configuration Examples for Different Package Types

This directory contains example TypeScript configurations for different types of packages in the monorepo.

## Root Configuration

The root `tsconfig.json` uses:

- **`"module": "NodeNext"`** - Modern Node.js standard supporting both ESM and CommonJS
- **`"moduleResolution": "NodeNext"`** - Proper resolution for Node.js packages

This provides maximum flexibility. Most packages can simply extend the root config without overriding module settings.

## Basic Package Pattern

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

## Specific Examples

### Backend Services (Node.js API)

Works great with NodeNext (no overrides needed):

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

### Web Apps (Next.js)

Next.js has its own tsconfig requirements:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "src/**/*", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Web Apps (Vite + React)

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["vite/client"],
    "outDir": "./dist",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Shared Libraries (ESM)

Perfect with NodeNext (works everywhere):

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### React Native Apps

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-native",
    "lib": ["ES2022"],
    "module": "CommonJS",
    "moduleResolution": "node",
    "types": ["react-native"],
    "allowJs": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "android", "ios"]
}
```

## When to Override Module Settings

**You DON'T need to override** for:

- Node.js backend APIs
- Shared libraries
- CLI tools
- Most server-side code

**You SHOULD override** for:

- Next.js apps (requires `bundler` resolution)
- Vite apps (requires `bundler` resolution)
- React Native (requires `node` resolution + `commonjs`)
- Specific bundler requirements

## Key Settings Explained

| Setting          | Root Default | When to Override                                          |
| ---------------- | ------------ | --------------------------------------------------------- |
| module           | NodeNext     | Only for web bundlers (esnext) or React Native (commonjs) |
| moduleResolution | NodeNext     | Only for web bundlers (bundler)                           |
| jsx              | -            | Add for React/React Native projects                       |
| lib              | ES2022       | Add DOM for web apps                                      |
| composite        | false        | Set true for packages referenced by others                |
| paths            | -            | Add for internal path aliases                             |

## Package.json Considerations

With `NodeNext`, TypeScript respects package.json `"type"` field:

- `"type": "module"` → Files are treated as ESM
- `"type": "commonjs"` → Files are treated as CommonJS
- No type field → `.js` = CommonJS, `.mjs` = ESM, `.cjs` = CommonJS

Most packages should use `"type": "module"` for modern development.
