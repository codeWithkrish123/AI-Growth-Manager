# ─────────────────────────────────────────────────────────────────────────────
# AI Growth Manager – Backend Dockerfile
# Multi-stage build: smaller production image, non-root user
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install production dependencies ──────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser

# Copy installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Set correct ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Runtime environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check so Docker/Compose knows when the app is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/ping || exit 1

CMD ["node", "src/server.js"]
