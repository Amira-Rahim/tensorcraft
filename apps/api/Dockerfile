FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/supabase/package.json packages/supabase/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @tensorcraft/api...

FROM base AS build
WORKDIR /app
COPY --from=deps /app ./
COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm --filter @tensorcraft/api build
RUN pnpm --filter @tensorcraft/api deploy /app/deployed --prod --legacy

FROM node:22-alpine AS runner
WORKDIR /app
RUN npm install -g tsx
ENV NODE_ENV=production
# Cap V8 heap at 200MB (80% of 256MB container) to prevent OOM kills
ENV NODE_OPTIONS="--max-old-space-size=200"
COPY --from=build /app/deployed/node_modules ./node_modules
COPY --from=build /app/apps/api/src ./src
COPY --from=build /app/deployed/package.json ./package.json
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1
EXPOSE 3001
CMD ["tsx", "src/index.ts"]
