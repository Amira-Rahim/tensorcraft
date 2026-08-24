FROM node:26-alpine AS base
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
# Was `build`, whose dist/ output the runner stage never copied: a full tsc
# emit produced and thrown away on every deploy. `typecheck` is the same tsc
# invocation with --noEmit, so the image still fails on a type error without
# paying for output nothing consumes.
RUN pnpm --filter @tensorcraft/api typecheck
RUN pnpm --filter @tensorcraft/api deploy /app/deployed --prod --legacy

FROM node:26-alpine AS runner
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
# tsx, not `node dist/index.js`, and this is STRUCTURAL rather than an
# oversight. The workspace packages export raw TypeScript
# (packages/shared/package.json: "exports": {".": "./src/index.ts"}), which
# plain node cannot load at all, and apps/api's own emit uses extensionless
# relative imports that fail ESM resolution. Verified 2026-08-23: running
# `node dist/index.js` exits 1 with ERR_MODULE_NOT_FOUND.
#
# The cost is real (TypeScript is transpiled at container start, on the
# payment path) and closing it is a project, not a line: either the workspace
# packages build to JS and apps/api gains import extensions, or the API is
# bundled to a single file at build time. Tracked in docs/launch-blockers.md.
CMD ["tsx", "src/index.ts"]
