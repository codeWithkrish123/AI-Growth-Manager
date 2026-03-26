# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Only the app user can read files
RUN chown -R appuser:appgroup /app
USER appuser

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]