FROM node:22-bookworm-slim AS dependencies

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@11.10.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/participant/package.json apps/participant/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/database/package.json packages/database/package.json

RUN pnpm install --frozen-lockfile

FROM dependencies AS migration
COPY packages ./packages
COPY scripts/init_mariadb.ts scripts/migrate_sqlite_to_mariadb.ts ./scripts/
COPY tsconfig.scripts.json ./
CMD ["pnpm", "db:migrate:sqlite"]

FROM dependencies AS builder
COPY apps ./apps
COPY packages ./packages

ARG APP_NAME
RUN test "$APP_NAME" = "admin" || test "$APP_NAME" = "participant"
RUN pnpm --filter @mast/$APP_NAME build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ARG APP_NAME
ENV NODE_ENV=production
ENV APP_NAME=$APP_NAME
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV TZ=Asia/Kolkata
ENV GUJARATI_FONT_PATH=/app/fonts/NotoSansGujarati-Regular.ttf
ENV GUJARATI_BOLD_FONT_PATH=/app/fonts/NotoSansGujarati-Bold.ttf

COPY --from=builder --chown=node:node /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=builder --chown=node:node /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public
COPY --from=builder --chown=node:node /app/packages/core/fonts ./fonts
COPY --chown=node:node scripts/start-container.sh ./start-container.sh

USER node
EXPOSE 3000 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e 'fetch("http://127.0.0.1:"+(process.env.PORT || (process.env.APP_NAME === "admin" ? "3001" : "3000"))+"/api/health").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'

CMD ["sh", "/app/start-container.sh"]
