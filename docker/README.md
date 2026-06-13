# Docker Setup – AI Growth Manager

All Docker and infrastructure config lives here, separate from application code.

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Base compose file (postgres + redis + optional app) |
| `docker-compose.prod.yml` | Production overrides (no exposed ports, resource limits) |
| `Dockerfile` | Multi-stage backend image (non-root, health check) |
| `.env.docker` | Docker-specific env overrides (service hostnames) |

---

## Quick Start (Local Dev — Infra Only)

This is the recommended approach: run Postgres and Redis in Docker, run the backend with `npm run dev` for hot reload.

```bash
# From project root
docker compose -f docker/docker-compose.yml up postgres redis -d
```

Then in a separate terminal:
```bash
cd backend
npm run dev
```

---

## Full Stack in Docker

Runs everything (postgres + redis + backend app) in containers.

```bash
docker compose -f docker/docker-compose.yml --profile full up -d
```

---

## Credentials (Local Dev)

| Service | Host | Port | User | Password | Database |
|---------|------|------|------|----------|----------|
| PostgreSQL | localhost | 5432 | postgres | Newdelhi2025 | ai_growth_manager |
| Redis | localhost | 6379 | — | — | — |

---

## Useful Commands

```bash
# View running containers
docker compose -f docker/docker-compose.yml ps

# View logs
docker compose -f docker/docker-compose.yml logs -f postgres
docker compose -f docker/docker-compose.yml logs -f redis

# Stop containers (keep data)
docker compose -f docker/docker-compose.yml down

# Stop and wipe all data volumes
docker compose -f docker/docker-compose.yml down -v

# Connect to PostgreSQL directly
docker exec -it ai_growth_postgres psql -U postgres -d ai_growth_manager

# Connect to Redis CLI
docker exec -it ai_growth_redis redis-cli
```

---

## Production Deployment

```bash
# Build and start with production overrides
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.prod.yml \
  up -d --build
```

Set real secrets via environment variables or a secrets manager — never commit production credentials.
