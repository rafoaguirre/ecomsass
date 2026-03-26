# @ecomsaas/ui

Shared UI package for EcomSaaS with a token-first architecture.

## Architecture

- `tokens`: shared brand and design tokens (web + native friendly)
- `core`: shared component contracts and style decisions
- `web`: React web components for immediate use
- `native`: React Native-friendly style helpers built from the same tokens
- `shadcn`: Tailwind + shadcn-compatible component primitives

This structure keeps DRY boundaries clear:

- shared visual language and behavior live in `tokens` + `core`
- platform rendering lives in adapters (`web` and `native`)

## Components (web)

- `Button`
- `Input`
- `Card`
- `Modal`

## Theme usage

1. Import `@ecomsaas/ui/styles.css` in your app global styles.
2. Use components from `@ecomsaas/ui/web`.

## Tailwind + shadcn usage

1. Import `@ecomsaas/ui/tailwind.css` in your app globals to load shared Tailwind tokens.
2. Use `@ecomsaas/ui/shadcn` for shadcn-style primitives.
3. `components.json` is included in this package to align with shadcn conventions.

Example:

```tsx
import { ShadcnButton, ShadcnInput } from '@ecomsaas/ui/shadcn';

export function CheckoutForm() {
  return (
    <div className="space-y-3">
      <ShadcnInput placeholder="Email" />
      <ShadcnButton>Continue</ShadcnButton>
    </div>
  );
}
```

## Native usage

Use native helpers from `@ecomsaas/ui/native` to keep variants/sizing aligned with web:

```tsx
import { Pressable, Text } from 'react-native';
import { getNativeButtonStyles } from '@ecomsaas/ui/native';

const styles = getNativeButtonStyles('primary', 'md');

export function BuyButton() {
  return (
    <Pressable style={styles.container}>
      <Text style={styles.text}>Buy now</Text>
    </Pressable>
  );
}
```

## Storybook

Run Storybook for `@ecomsaas/ui`:

```bash
pnpm --filter @ecomsaas/ui storybook
```

Build static Storybook:

```bash
pnpm --filter @ecomsaas/ui build-storybook
```

## Example

```tsx
import { Button, Card, Input, Modal } from '@ecomsaas/ui/web';

export function Demo() {
  return (
    <Card title="Create Product" subtitle="Simple and focused">
      <Input label="Name" placeholder="Summer T-Shirt" />
      <Button variant="primary">Save</Button>
      <Modal open title="Done" onClose={() => {}}>
        Product saved.
      </Modal>
    </Card>
  );
}
```
