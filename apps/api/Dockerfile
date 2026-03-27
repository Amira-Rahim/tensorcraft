FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/supabase/package.json packages/supabase/
COPY packages/shared/package.json packages/shared/
COPY packages/github/package.json packages/github/
RUN pnpm install --frozen-lockfile --filter @tensorcraft/api...

FROM base AS build
WORKDIR /app
COPY --from=deps /app ./
COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm --filter @tensorcraft/api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Cap V8 heap at 200MB (80% of 256MB container) to prevent OOM kills
ENV NODE_OPTIONS="--max-old-space-size=200"
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1
EXPOSE 3001
CMD ["node", "dist/index.js"]
