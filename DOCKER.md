# Docker Setup

This directory contains Docker configuration files for running the REdI Assessment System as a self-contained 4-service containerized stack.

## Current Architecture

The Docker stack consists of 4 core services, all running on Alpine Linux for minimal image size:

1. **db** - PostgreSQL 16 (Alpine)
   - Internal port: 5432 (not exposed)
   - Handles all data persistence for the application

2. **rest** - PostgREST v12.2.3 (custom Alpine image)
   - Internal port: 3000 (not exposed)
   - Provides REST API interface to PostgreSQL
   - Custom image includes wget for health checks

3. **worker** - Node.js 20 (Alpine)
   - Internal port: 5000 (not exposed)
   - Express server handling:
     - REdI API sync operations
     - PDF report generation
     - WebSocket connections for real-time updates (MAX_CONNECTIONS=100 limit)

4. **frontend** - nginx (Alpine)
   - Internal port: 80
   - Exposed on host port: **8080** (only exposed service)
   - Serves React SPA with reverse proxy to backend services
   - Note: Uses `nginx:stable-alpine` rolling tag base image
   - Deep health check proxies to worker backend with fallback
   - Complete security headers applied on all static assets

All inter-service communication occurs on a private Docker network. Only the frontend is exposed to the host machine.

## Service Dependencies

```
db (healthy) → rest (healthy) → frontend
             ↓
             → worker (healthy) → frontend
```

Both `rest` and `worker` depend on `db` being healthy. The `frontend` depends on both `rest` and `worker` being healthy. Services use health checks to enforce these dependencies.

## Port Allocation

| Port | Type | Service | Purpose |
|------|------|---------|---------|
| **8080** | Host | frontend | Public access to React SPA and reverse proxy |
| 5432 | Internal | db | PostgreSQL (Docker network only) |
| 3000 | Internal | rest | PostgREST API (Docker network only) |
| 5000 | Internal | worker | Express server (Docker network only) |
| 80 | Internal | frontend | nginx (Docker network only) |

**Note:** Port 8080 is used instead of 80 for compatibility with rootless Docker.

## Reverse Proxy Routes (nginx in frontend)

The frontend nginx container acts as a reverse proxy, routing requests to appropriate backend services:

| Path | Destination | Service |
|------|-------------|---------|
| `/rest/v1/*` | `http://rest:3000` | PostgREST API |
| `/worker/*` | `http://worker:5000` | Worker API endpoints |
| `/ws` | `http://worker:5000/ws` | WebSocket connection (100 max concurrent) |
| `/*` | React SPA (try_files) | Static files fallback with security headers |

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- `.env.docker.example` file in the project root (or copy from `.env.example`)

### First Run

1. **Copy environment file**:
   ```bash
   cp .env.docker.example .env
   ```

   **IMPORTANT:** Edit `.env` and set these required values BEFORE starting:
   - `DB_PASSWORD` - Database password for the `redi_admin` user
   - `JWT_SECRET` - Must be at least 32 characters (used for JWT token signing)

2. **Start all services**:
   ```bash
   docker compose up -d
   ```

3. **Verify services are healthy**:
   ```bash
   docker compose ps
   ```

   All services should show status `Up (healthy)` after 10-30 seconds.

4. **View logs** (optional):
   ```bash
   docker compose logs -f
   ```

5. **Access the application**:
   - Frontend: http://localhost:8080
   - Database: `docker compose exec db psql -U redi_admin -d redi_assessment`

### Stopping Services

```bash
# Stop all services (data persists)
docker compose down

# Stop and delete all data (WARNING: data will be lost)
docker compose down -v
```

## Environment Configuration

### Required Variables

Copy `.env.docker.example` to `.env` before first run. **DO NOT use `.env.example`** — that file is for the legacy Supabase setup.

**Critical variables that must be set:**

- `DB_PASSWORD` - Database password for `redi_admin` user
  - Set BEFORE first `docker compose up`
  - If changed after initialization, the database will not update automatically
  - Recommended: At least 16 characters, mixed alphanumeric

- `JWT_SECRET` - Secret key for JWT token signing
  - Must be at least 32 characters
  - Used to sign and verify authentication tokens
  - Recommended: `openssl rand -base64 32`

### Optional Variables

- `SUPABASE_ANON_KEY` - Pre-signed JWT for anonymous access
  - Auto-generated if using `.env.docker.example` defaults
  - Must be regenerated if `JWT_SECRET` changes

- REdI API integration variables:
  - Only needed if connecting to external REdI system
  - Defaults support local-only operation

## Service Management

### Start/Stop Commands

```bash
# Start all services in background
docker compose up -d

# Start with full logging
docker compose up

# Stop all services
docker compose down

# Stop and delete volumes (WARNING: data loss)
docker compose down -v

# Restart all services
docker compose restart

# Restart specific service
docker compose restart worker
```

### Rebuilding Services After Code Changes

Frontend:
```bash
docker compose up -d --build frontend
```

Worker:
```bash
docker compose up -d --build worker
```

Both:
```bash
docker compose up -d --build frontend worker
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f db
docker compose logs -f rest
docker compose logs -f worker
docker compose logs -f frontend

# Last N lines
docker compose logs -f --tail=50 worker

# Follow specific pattern
docker compose logs -f worker | grep ERROR
```

## Database Access

### Interactive PostgreSQL Shell

```bash
docker compose exec db psql -U redi_admin -d redi_assessment
```

### SQL Query Execution

```bash
# Execute single query
docker compose exec db psql -U redi_admin -d redi_assessment -c "SELECT * FROM assessors LIMIT 5;"

# Execute from file
docker compose exec -T db psql -U redi_admin -d redi_assessment < query.sql
```

### Backup and Restore

**Backup:**
```bash
docker compose exec db pg_dump -U redi_admin redi_assessment > backup.sql
```

**Restore:**
```bash
docker compose exec -T db psql -U redi_admin redi_assessment < backup.sql
```

**Backup with compression:**
```bash
docker compose exec db pg_dump -U redi_admin -Fc redi_assessment > backup.dump
```

**Restore from compressed backup:**
```bash
docker compose exec -T db pg_restore -U redi_admin -d redi_assessment backup.dump
```

## Data Persistence

Two Docker volumes persist data:

- `pgdata` - PostgreSQL database files
  - Contains all application data
  - Survives container restarts and recreations

- `reports` - Generated PDF reports
  - Worker service writes generated reports here
  - Can grow large; monitor space usage

### Volume Management

```bash
# List volumes
docker volume ls | grep assessor

# Inspect volume (shows filesystem location)
docker volume inspect assessor_pgdata

# Delete volume (WARNING: data loss)
docker volume rm assessor_pgdata
```

### Backup Data Directory

On the host machine, volumes are typically stored at:
- Linux/Mac: `/var/lib/docker/volumes/assessor_pgdata/_data/`
- Windows: `\\wsl$\docker-desktop-data\version-pack-data\community\docker\volumes\`

## Health Checks

Each service includes health checks that verify it's functioning correctly. The Docker Compose file defines these checks:

| Service | Check Method | Interval | Timeout | Start Period | Max Retries |
|---------|--------------|----------|---------|--------------|------------|
| **db** | `pg_isready -U redi_admin` | 10s | 5s | - | 5 |
| **rest** | `wget --spider --quiet http://localhost:3000/` | 10s | 5s | 15s | 5 |
| **worker** | `wget --spider --quiet http://localhost:5000/api/health` | 15s | 5s | 10s | 3 |
| **frontend** | `wget --spider --quiet http://localhost:80/` (proxies to worker backend with fallback) | 10s | 5s | - | 3 |

### Checking Health Status

```bash
# View health status for all services
docker compose ps

# Example output:
# NAME              STATUS
# db                Up 2 minutes (healthy)
# rest              Up 2 minutes (healthy)
# worker            Up 2 minutes (healthy)
# frontend          Up 2 minutes (healthy)

# Inspect specific service health
docker inspect assessor-rest-1 | grep -A 10 '"Health"'
```

## Architecture Diagram

```
                            ┌─────────────┐
                            │   Browser   │
                            └──────┬──────┘
                                   │ :8080
                            ┌──────▼──────┐
                            │  Frontend   │
                            │  (nginx)    │
                            │   :80 int   │
                            └──────┬──────┘
              ┌────────────────────┼────────────────────┐
              │                    │                    │
       ┌──────▼──────┐      ┌─────▼─────┐      ┌──────▼──────┐
       │  PostgREST  │      │  Worker   │      │  WebSocket  │
       │  (rest)     │      │  Express  │      │  Connection │
       │  :3000 int  │      │  :5000 int│      │  :5000 int  │
       └──────┬──────┘      └─────┬─────┘      └──────┬──────┘
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  │
                           ┌──────▼──────┐
                           │ PostgreSQL  │
                           │ (db)        │
                           │ :5432 int   │
                           └─────────────┘

Internal Docker Network:
- All services except frontend port 80 are internal
- Frontend exposes port 8080 on host
- Services communicate via Docker DNS (service name resolution)
```

## Troubleshooting

### PostgREST Service Unhealthy

**Symptoms:** `docker compose ps` shows `rest` with status `Unhealthy` or `Exit(1)`

**Diagnosis:**
```bash
docker compose logs rest
```

**Common causes and solutions:**

1. **JWT_SECRET too short or invalid**
   - Verify `JWT_SECRET` in `.env` is at least 32 characters
   - Regenerate: `openssl rand -base64 32`
   - Update `.env` and restart: `docker compose restart rest`

2. **Database not ready**
   - Check if `db` service is healthy: `docker compose ps db`
   - Wait 10-15 seconds for database initialization
   - Check db logs: `docker compose logs db`

3. **Custom image build failed**
   - The custom PostgREST image in `docker/postgrest/Dockerfile` may have errors
   - Rebuild: `docker compose up -d --build rest`

### Worker Service Not Starting

**Symptoms:** Worker container exits immediately or stays unhealthy

**Diagnosis:**
```bash
docker compose logs worker
```

**Common causes:**

1. **Dependencies not ready**
   - Worker depends on both `db` and `rest` being healthy
   - If `rest` is unhealthy, worker won't start
   - Fix rest first, then wait 10-15 seconds
   - Restart worker: `docker compose restart worker`

2. **Node.js or npm errors**
   - Check for build errors in logs
   - Dependencies may not have installed correctly
   - Rebuild: `docker compose build --no-cache worker`

3. **Port conflict**
   - Worker uses internal port 5000
   - Check: `docker compose ps worker`
   - If showing port binding conflict, stop all containers and retry

### Frontend Not Starting or Showing Error Page

**Symptoms:** Browser shows error or blank page when accessing http://localhost:8080

**Diagnosis:**
```bash
docker compose logs frontend
# Also check if backend services are healthy
docker compose ps
```

**Common causes:**

1. **Backend services unhealthy**
   - Frontend depends on `rest` and `worker` being healthy
   - Check: `docker compose ps`
   - If `rest` or `worker` show unhealthy, fix them first
   - Restart frontend after dependencies are ready: `docker compose restart frontend`

2. **Reverse proxy misconfiguration**
   - Check nginx logs: `docker compose logs frontend`
   - Verify service names in nginx config match docker-compose.yml
   - Rebuild: `docker compose up -d --build frontend`

3. **React build errors**
   - Check frontend build logs during startup
   - May indicate code errors in React application
   - Review: `docker compose logs frontend | grep -i error`

4. **Port 8080 already in use**
   - Check: `lsof -i :8080` (Mac/Linux) or `netstat -ano | findstr :8080` (Windows)
   - Change port in `docker-compose.yml`: `8080:80` → `8081:80`
   - Restart: `docker compose down && docker compose up -d`

### Database Connection Errors

**Symptoms:** Application shows database connection errors; cannot connect via psql

**Diagnosis:**
```bash
docker compose ps db
docker compose logs db
```

**Common causes:**

1. **DB_PASSWORD not set before first run**
   - If `.env` was not properly configured on first startup, database initialized with wrong password
   - Solution: Delete volume and reinitialize
   - ```bash
     docker compose down -v
     # Edit .env with correct DB_PASSWORD
     docker compose up -d
     ```

2. **Password changed but not updated in running containers**
   - Other services cache database password on startup
   - After changing `DB_PASSWORD` in `.env`:
   - ```bash
     docker compose down
     # Edit .env
     docker compose up -d
     ```

3. **PostgreSQL data corruption**
   - Check disk space: `docker compose exec db df -h`
   - Review logs: `docker compose logs db | tail -50`
   - If corrupted, reinitialize (data loss):
   - ```bash
     docker compose down -v
     docker compose up -d
     ```

### Container Networking Errors

**Symptoms:** Services can't reach each other; DNS resolution failures

**Common causes:**

1. **Custom network bridge**
   - Services communicate via internal Docker network
   - Use service names, not localhost
   - Correct: `http://rest:3000/`
   - Incorrect: `http://localhost:3000/`

2. **Docker daemon networking issues**
   - Restart Docker daemon
   - Linux: `sudo systemctl restart docker`
   - Mac/Windows: Restart Docker Desktop

3. **Rootless Docker limitations**
   - Host ports must be >= 1024 (hence 8080, not 80)
   - Service-to-service communication not affected
   - If running rootless Docker, ensure port 8080 is available

### Memory or Resource Issues

**Symptoms:** Containers killed unexpectedly; slow performance; Out of Memory errors

**Check resource usage:**
```bash
docker stats
```

**Common causes:**

1. **Insufficient host memory**
   - Each service requires ~100-200MB
   - Total stack: ~800MB-1GB recommended
   - Add more host memory or stop other containers

2. **Large database queries**
   - Worker performing memory-intensive operations
   - Check worker logs: `docker compose logs -f worker | grep -i memory`
   - Optimize queries or add host memory

3. **Unbounded volume growth**
   - `pgdata` volume getting very large
   - Check: `docker volume inspect assessor_pgdata`
   - Review database for unused data
   - Consider: `docker system prune` to free space (loses unused images/containers)

### Logs and Debugging

**Enable debug logging:**

Add to `.env`:
```
LOG_LEVEL=DEBUG
NODE_ENV=development
```

Restart: `docker compose restart`

**Persist logs to files:**
```bash
docker compose logs --no-color > docker.log 2>&1 &
# or tail in real-time
docker compose logs -f > docker.log 2>&1 &
```

**Clean up logs (if consuming disk space):**
```bash
docker system prune --volumes
```

## Development Workflow

### Making Frontend Changes

1. Edit React code in `frontend/src/`
2. Rebuild and restart frontend:
   ```bash
   docker compose up -d --build frontend
   ```
3. Changes appear at http://localhost:8080 after rebuild (usually 10-30 seconds)
4. Check logs for build errors:
   ```bash
   docker compose logs -f frontend
   ```

### Making Backend Changes

**For Worker API changes:**
1. Edit Express code in `worker/src/`
2. Rebuild:
   ```bash
   docker compose up -d --build worker
   ```
3. Service restarts automatically
4. Changes reflect in logs and requests to `/worker/*`

**For Database Schema Changes:**
1. Run migrations through the PostgreSQL schema
2. For local development, connect directly:
   ```bash
   docker compose exec db psql -U redi_admin -d redi_assessment
   ```
3. Execute SQL changes
4. Verify schema with `\dt` and `\d table_name`

### Testing Services Individually

**Test PostgREST API:**
```bash
curl http://localhost:8080/rest/v1/assessors
```

**Test Worker API:**
```bash
curl http://localhost:8080/worker/api/health
```

**Test WebSocket:**
```bash
# Requires WebSocket client; example using websocat tool:
websocat ws://localhost:8080/ws
```

## Security Architecture

### Database Row-Level Security (RLS)

All 9 tables have RLS enabled. Access is controlled per PostgreSQL role:

| Role | Reference Tables | Course/Participant | Assessment Tables |
|------|-----------------|-------------------|-------------------|
| `redi_admin` | Full (owner) | Full (owner) | Full (owner) |
| `web_anon` | SELECT only | SELECT only | Full CRUD |
| `redi_worker` | SELECT only | SELECT, INSERT, UPDATE | SELECT only |

### Worker API Authentication

All worker API endpoints (except `/api/health`) require a JWT Bearer token:
```
Authorization: Bearer <jwt-token>
```

WebSocket connections require a token query parameter:
```
ws://localhost:8080/ws?token=<jwt-token>
```

**WebSocket Security:**
- Maximum 100 concurrent connections enforced
- Exceeding limit results in code 1013 rejection ("Try Again Later")

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/sync/*` | 20 requests | 15 minutes |
| `/api/reports/*` | 10 requests | 15 minutes |

### Static Asset Security Headers

All static assets served by nginx include comprehensive security headers:
- `Content-Security-Policy` (CSP) - Restricts resource loading
- `Permissions-Policy` - Disables unnecessary browser features
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

### CORS

CORS is disabled by default (same-origin via nginx proxy). Set `CORS_ORIGIN` in `.env` for development:
```
CORS_ORIGIN=http://localhost:5173
```

### Fail-Fast Secrets

Docker Compose will refuse to start if `DB_PASSWORD` or `JWT_SECRET` are not set in `.env`.

### Seed Data Security

Seed data includes valid bcrypt password hashes for development:
- Default assessor PIN: "1234" (pre-hashed with bcrypt)
- Never use default seed data in production environments

## Production Deployment Notes

**This Docker configuration is designed for development/testing.** Before deploying to production:

1. **Security Hardening**
   - Generate strong `DB_PASSWORD` and `JWT_SECRET`
   - Use secrets management system (AWS Secrets Manager, Kubernetes Secrets, etc.)
   - Enable HTTPS/TLS for nginx
   - Review and tighten RLS policies for your access requirements

2. **Performance Optimization**
   - Configure PostgreSQL connection pooling
   - Set appropriate resource limits on containers
   - Use managed database service if possible (avoid database in containers)

3. **Monitoring & Logging**
   - Integrate with centralized logging (ELK, CloudWatch, etc.)
   - Set up alerting for unhealthy services
   - Monitor resource usage and database performance
   - Enable application performance monitoring (APM)

4. **Data Backup Strategy**
   - Automated daily backups
   - Test restore procedures regularly
   - Store backups in separate location from production

5. **High Availability**
   - Run multiple instances of application stack
   - Use load balancer for frontend traffic
   - Configure database replication
   - Document failover procedures

## Docker Compose File Structure

Key files:

- `docker-compose.yml` - Main service definitions and configuration
- `docker/postgrest/Dockerfile` - Custom PostgREST image with health check support
- `.env.docker.example` - Default environment variables for development (copy to `.env`)
- `.dockerignore` - Files excluded from builds

## Support and Resources

- Check logs: `docker compose logs -f`
- Verify service health: `docker compose ps`
- Review main [README.md](./README.md) for application documentation
- For issues: Check troubleshooting section above or open an issue on GitHub
