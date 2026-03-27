FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/supabase/package.json packages/supabase/
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY packages/themes/package.json packages/themes/
COPY packages/content/package.json packages/content/
COPY packages/config/package.json packages/config/
COPY packages/github/package.json packages/github/
RUN pnpm install --frozen-lockfile --filter @tensorcraft/web...

FROM base AS build
WORKDIR /app
COPY --from=deps /app ./
COPY . .
RUN pnpm --filter @tensorcraft/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
# Cap V8 heap at 400MB (80% of 512MB container) to prevent OOM kills
ENV NODE_OPTIONS="--max-old-space-size=400"

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
