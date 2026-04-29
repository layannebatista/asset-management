FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY public ./public

RUN npm run build

# ─── Production image ─────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
# schema.sql must be available at runtime for schema initialization
COPY src/storage/schema.sql ./dist/storage/schema.sql

RUN useradd --uid 1001 --create-home appuser
USER appuser

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3100/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/api/server.js"]
