FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/infrastructure/package.json packages/infrastructure/
COPY packages/application/package.json packages/application/
COPY packages/domain/package.json packages/domain/
COPY backends/worker/package.json backends/worker/
RUN pnpm install --frozen-lockfile --filter @ecomsaas/worker...

# Build
FROM deps AS build
COPY tsconfig.json turbo.json ./
COPY packages/ packages/
COPY backends/worker/ backends/worker/
RUN pnpm --filter @ecomsaas/worker... build

# Production
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/ ./packages/
COPY --from=build /app/backends/worker/dist ./backends/worker/dist
COPY --from=build /app/backends/worker/package.json ./backends/worker/

WORKDIR /app/backends/worker
CMD ["node", "dist/main.js"]
