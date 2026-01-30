# Deployment Guide - REdI Assessment System

This guide covers deploying the REdI Assessment System using Docker Compose. The system is fully self-contained and runs on your own infrastructure with no external dependencies (except optional REdI API integration).

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start (Development)](#quick-start-development)
- [Configuration](#configuration)
- [Production Deployment](#production-deployment)
- [Health Checks](#health-checks)
- [Upgrading](#upgrading)
- [Troubleshooting](#troubleshooting)
- [Security Checklist](#security-checklist)

---

## Architecture

The system runs as a 4-service Docker Compose stack:

```
┌─────────────────────────────────────────────────────┐
│             nginx Frontend (Port 8080)               │
│  • Serves React SPA (compiled frontend)              │
│  • Reverse proxy for backend services                │
│  • TLS/HTTPS termination (optional)                  │
└────────┬──────────────┬──────────────┬──────────────┘
         │              │              │
    /rest/v1/*      /worker/*         /ws
         │              │              │
    ┌────▼──┐      ┌────▼──┐     ┌────▼──┐
    │        │      │       │     │        │
    │PostgREST     │Node.js │     │Worker  │
    │(Port 3000)   │Express │     │WebSocket
    │              │(5000)  │     │        │
    └────┬─────────┴────┬───┴─────┴────┬───┘
         │              │              │
         └──────┬───────┴──────┬───────┘
                │              │
            ┌───▼──────────────▼──┐
            │  PostgreSQL 16      │
            │  (Port 5432, internal
            │                     │
            └─────────────────────┘
```

### Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **db** | postgres:16-alpine | 5432 (internal) | PostgreSQL 16 with WAL logical replication |
| **rest** | PostgREST v12.2.3 | 3000 (internal) | Auto-generated REST API from database schema |
| **worker** | Node.js 20 | 5000 (internal) | Backend for sync, reports, WebSocket, auth |
| **frontend** | nginx:alpine | 8080 (exposed) | React SPA server + reverse proxy |

### Network

- **Single Docker network** - All services communicate via service names (e.g., `http://rest:3000`)
- **Port 8080 is the only exposed port** - All external traffic goes through nginx
- **Internal services are isolated** - Database, PostgREST, and worker are not directly accessible from the host

### Data Persistence

- **pgdata volume** - PostgreSQL data persists across container restarts
- **reports volume** - Generated reports stored in `/app/data/reports`

---

## Prerequisites

### System Requirements

- **Docker** 20.10+ (or Docker Desktop 4.10+)
- **Docker Compose** 2.0+ (included with Docker Desktop)
- **4GB RAM minimum** - For comfortable development (8GB+ for production)
- **2GB disk space minimum** - For base images and volumes

### Verify Installation

```bash
docker --version
docker compose version
```

### For Production

- **Domain name** with DNS pointing to your server
- **TLS certificate** (self-signed or from Let's Encrypt)
- **Firewall** allowing inbound on ports 80 and 443

---

## Quick Start (Development)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/assessor.git
cd assessor
```

### 2. Create Environment File

```bash
cp .env.docker.example .env
```

### 3. Configure Essential Variables

Edit `.env` and set these minimum values:

```env
# Generate a strong password (at least 16 characters)
DB_PASSWORD=your_strong_db_password_here

# Generate a JWT secret (at least 32 characters)
JWT_SECRET=your_super_secret_jwt_token_minimum_32_characters

# Use the pre-generated default (or regenerate if you changed JWT_SECRET)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24iLCJpc3MiOiJyZWRpLWFzc2Vzc21lbnQiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.0kvCzSN2-C1ixi73OJsue5ktCYCKNbt7P0G7mLtk__g
```

### 4. Start the Stack

```bash
docker compose up -d
```

The system is now running:
- **Frontend:** http://localhost:8080
- **PostgREST API:** http://localhost:8080/rest/v1/ (via proxy)
- **Worker API:** http://localhost:8080/worker/ (via proxy)

### 5. Verify Services

```bash
docker compose ps
```

All four services should show status `Up (healthy)`.

### 6. View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f worker
docker compose logs -f rest
docker compose logs -f db
docker compose logs -f frontend
```

### 7. Access the Application

Open your browser to http://localhost:8080

**Test Login:**
- Check `db/init/02-seed.sql` for test assessor PINs
- Or create a new assessor through the admin interface

---

## Configuration

### Environment Variables

All configuration is via `.env` file (copied from `.env.docker.example`).

#### Database Section

```env
# PostgreSQL superuser password (redi_admin role)
# CRITICAL: Set this BEFORE first `docker compose up`
# If changed after initial setup, you must update authenticator role or delete volume
DB_PASSWORD=your_production_password

# Optional: PostgREST authenticator role password
# If not set, defaults to DB_PASSWORD
DB_AUTHENTICATOR_PASSWORD=separate_authenticator_password

# Optional: Worker service password
# If not set, defaults to DB_PASSWORD
DB_WORKER_PASSWORD=separate_worker_password
```

#### JWT / Authentication

```env
# CRITICAL: JWT signing secret for PostgREST and worker service
# Must be at least 32 characters long!
# PostgREST will refuse to start if this is too short
# Use: openssl rand -base64 48
JWT_SECRET=your_64_char_random_secret_here_minimum_32_chars

# Anon key: JWT token with {"role":"web_anon"} signed by JWT_SECRET
# IMPORTANT: Regenerate this if you change JWT_SECRET
# See "Regenerating SUPABASE_ANON_KEY" section below
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### REdI API Integration (Optional)

These are only needed if you're integrating with the REdI system via Azure Logic Apps:

```env
# Base URL for Azure Logic Apps endpoints
REDI_API_BASE_URL=https://prod-xx.australiaeast.logic.azure.com

# Individual endpoint URLs (leave empty for development)
REDI_PARTICIPANT_LOOKUP_URL=https://prod-xx.logic.azure.com/...
REDI_EVENT_AVAILABILITY_URL=https://prod-xx.logic.azure.com/...
REDI_FACULTY_AVAILABILITY_URL=https://prod-xx.logic.azure.com/...
REDI_PARTICIPANT_UPSERT_URL=https://prod-xx.logic.azure.com/...
REDI_EVENT_UPSERT_URL=https://prod-xx.logic.azure.com/...
REDI_SEND_EMAIL_URL=https://prod-xx.logic.azure.com/...
REDI_CALENDAR_EVENT_URL=https://prod-xx.logic.azure.com/...
REDI_EMAIL_CERTIFICATE_URL=https://prod-xx.logic.azure.com/...

# Email recipient for generated reports
REPORT_EMAIL_TO=redi@health.qld.gov.au
```

For **development without REdI integration**, leave all `REDI_*_URL` variables empty.

### Regenerating SUPABASE_ANON_KEY

If you change `JWT_SECRET`, you must regenerate the anon key. This is a JWT token with the role "web_anon".

**Option 1: Using Node.js**

Replace `YOUR_JWT_SECRET` with your actual `JWT_SECRET`:

```bash
node -e "
const crypto = require('crypto');
const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
const payload = Buffer.from(JSON.stringify({role:'web_anon',iss:'redi-assessment',iat:1700000000,exp:2000000000})).toString('base64url');
const signature = crypto.createHmac('sha256', 'YOUR_JWT_SECRET').update(header + '.' + payload).digest('base64url');
console.log(header + '.' + payload + '.' + signature);
"
```

**Option 2: Using jwt.io**

1. Go to https://jwt.io
2. Set Algorithm to **HS256**
3. Set Payload to:
   ```json
   {
     "role": "web_anon",
     "iss": "redi-assessment",
     "iat": 1700000000,
     "exp": 2000000000
   }
   ```
4. Set Secret to your `JWT_SECRET`
5. Copy the generated token from the left panel

---

## Production Deployment

### 1. Generate Strong Secrets

Never use default passwords in production.

**Database Password:**

```bash
# 32-character random password
openssl rand -base64 32
```

**JWT Secret (CRITICAL):**

```bash
# Must be at least 32 characters. 64 is recommended.
openssl rand -base64 48
```

Example output: `aBc1XyZ2qW3eRtYuIoP4aSdFgHjKlMnOpQrStUvWxYz/+==`

### 2. Update Environment File

```bash
cp .env.docker.example .env
```

Edit `.env` with production values:

```env
DB_PASSWORD=<output from openssl rand above>
DB_AUTHENTICATOR_PASSWORD=<different strong password>
DB_WORKER_PASSWORD=<different strong password>
JWT_SECRET=<64-character secret from openssl rand>
SUPABASE_ANON_KEY=<regenerated token using JWT_SECRET>

# If using REdI integration
REDI_API_BASE_URL=https://prod-xx.australiaeast.logic.azure.com
REDI_PARTICIPANT_LOOKUP_URL=https://prod-xx.logic.azure.com/triggers/manual/paths/invoke...
# ... other REdI URLs
```

### 3. TLS/HTTPS Setup

The stack runs HTTP on port 8080. For HTTPS, use one of these approaches:

#### Option A: Let's Encrypt with Certbot (Recommended)

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate for your domain
sudo certbot certonly --standalone -d yourdomain.com

# Certificates saved to: /etc/letsencrypt/live/yourdomain.com/
```

Then update `nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Mount the certificates into the nginx container in `docker-compose.yml`:

```yaml
frontend:
  volumes:
    - /etc/letsencrypt/live/yourdomain.com:/etc/letsencrypt/live/yourdomain.com:ro
```

Change port mapping:

```yaml
frontend:
  ports:
    - "80:80"
    - "443:443"
```

#### Option B: Self-Signed Certificate (Testing Only)

```bash
# Generate self-signed cert (valid for 365 days)
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes
```

#### Option C: Reverse Proxy (Traefik, HAProxy)

If you prefer not to modify nginx.conf, run nginx on port 8080 internally and place a reverse proxy in front that handles TLS. Examples:

- **Traefik** - Automated certificate management with Let's Encrypt
- **HAProxy** - High-performance reverse proxy with SSL
- **Caddy** - Simple setup with automatic HTTPS

### 4. Database Backups

**Automated Daily Backup:**

Create `/home/user/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/user/db-backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/redi_assessment_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose -f /path/to/assessor/docker-compose.yml exec -T db \
  pg_dump -U redi_admin redi_assessment | gzip > "$BACKUP_FILE"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "redi_assessment_*.sql.gz" -mtime +30 -delete

echo "Backup saved to $BACKUP_FILE"
```

Make executable and add to crontab:

```bash
chmod +x /home/user/backup-db.sh

# Run daily at 2 AM
crontab -e
# Add: 0 2 * * * /home/user/backup-db.sh
```

**Manual Backup:**

```bash
docker compose exec -T db pg_dump -U redi_admin redi_assessment > backup.sql
docker compose exec -T db pg_dump -U redi_admin redi_assessment | gzip > backup.sql.gz
```

**Restore from Backup:**

```bash
# Stop the stack
docker compose down

# Remove old volume
docker volume rm assessor_pgdata

# Start database
docker compose up -d db

# Wait for it to be healthy
docker compose exec -T db pg_isready -U redi_admin

# Restore from backup
gunzip -c backup.sql.gz | docker compose exec -T db psql -U redi_admin redi_assessment
```

### 5. Container Resource Limits

Edit `docker-compose.yml` to set resource limits:

```yaml
services:
  db:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  rest:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  worker:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
```

Then recreate containers:

```bash
docker compose up -d --force-recreate
```

### 6. Start Stack in Production

```bash
# Pull latest images
docker compose pull

# Start in background with logging to file
docker compose up -d

# Verify all services are healthy
docker compose ps

# Check logs
docker compose logs --tail=50 -f
```

---

## Health Checks

Each service has a built-in health check. View status:

```bash
docker compose ps
```

Look for `(healthy)` or `(unhealthy)` status.

### Individual Service Checks

**Database:**

```bash
docker compose exec db pg_isready -U redi_admin
```

Expected: `accepting connections`

**PostgREST:**

```bash
docker compose exec rest wget --spider --quiet http://localhost:3000/
echo $?  # Should output 0 (success)
```

**Worker:**

```bash
docker compose exec worker wget --spider --quiet http://localhost:5000/api/health
echo $?  # Should output 0 (success)
```

**Frontend:**

```bash
curl -I http://localhost:8080
```

Expected: `200 OK`

### Application-Level Health Check

```bash
# Verify all services respond through nginx
curl -I http://localhost:8080/rest/v1/assessors
curl -I http://localhost:8080/worker/api/health
curl -I http://localhost:8080/
```

All should return 200 or 3xx status (not 5xx).

---

## Upgrading

### 1. Backup Database

```bash
docker compose exec -T db pg_dump -U redi_admin redi_assessment | gzip > backup-pre-upgrade.sql.gz
```

### 2. Pull Latest Images

```bash
docker compose pull
```

### 3. Rebuild and Restart

```bash
docker compose up -d --build
```

### 4. Verify Services

```bash
docker compose ps
docker compose logs --tail=20 -f
```

### 5. Test Functionality

- Open http://localhost:8080 in browser
- Verify login works
- Check assessment forms render correctly
- Test data sync if applicable

### Rollback (if needed)

```bash
# Stop stack
docker compose down

# Remove broken volume
docker volume rm assessor_pgdata

# Start with old images (ensure you have them tagged)
docker compose up -d

# Restore from backup
gunzip -c backup-pre-upgrade.sql.gz | docker compose exec -T db psql -U redi_admin redi_assessment
```

---

## Troubleshooting

### PostgREST Won't Start

**Error:** Container exits immediately with no error

**Cause:** `JWT_SECRET` is too short (must be 32+ chars)

**Fix:**

```bash
# Check if JWT_SECRET is set and long enough
grep JWT_SECRET .env

# Update to 32+ character secret
JWT_SECRET=$(openssl rand -base64 48)
echo "JWT_SECRET=$JWT_SECRET" >> .env

# Restart
docker compose restart rest
```

### Database Authentication Failed

**Error:** `FATAL: password authentication failed for user "authenticator"`

**Cause:** `DB_PASSWORD` changed after initial setup

**Fix:**

Option 1: Reset and recreate (loses data):

```bash
docker compose down
docker volume rm assessor_pgdata
docker compose up -d db
# Wait 10 seconds
docker compose up -d rest worker frontend
```

Option 2: Update password in database:

```bash
docker compose exec db psql -U redi_admin -d redi_assessment -c \
  "ALTER ROLE authenticator WITH PASSWORD 'new_password';"
```

### "Invalid JWT" Errors in Frontend

**Error:** Browser console shows `Invalid JWT` or `Authentication failed`

**Cause:** `SUPABASE_ANON_KEY` doesn't match `JWT_SECRET`

**Fix:**

1. Get current `JWT_SECRET`:
   ```bash
   grep JWT_SECRET .env
   ```

2. Regenerate anon key using this secret (see [Regenerating SUPABASE_ANON_KEY](#regenerating-supabase_anon_key))

3. Update `.env`:
   ```bash
   SUPABASE_ANON_KEY=<new_token>
   ```

4. Restart frontend:
   ```bash
   docker compose restart frontend
   ```

### WebSocket Connection Fails

**Error:** Browser console shows `WebSocket connection failed`

**Cause:** Reverse proxy not forwarding WebSocket headers

**Fix:** Verify `nginx.conf` has WebSocket configuration:

```nginx
location /ws {
    proxy_pass http://worker:5000/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # ... other headers
}
```

### Worker Container Keeps Restarting

**Error:** `docker compose logs worker` shows repeated crashes

**Causes:**

1. Missing `REDI_*_URL` variables (if integration enabled)
2. REdI API endpoint unreachable
3. Database connection issue

**Fix:**

```bash
# Check logs for specific error
docker compose logs worker

# Verify database is healthy
docker compose exec db pg_isready -U redi_admin

# If using REdI integration, verify all URLs are set
grep REDI_ .env

# For development without REdI, ensure all REDI_*_URL variables are empty
```

### Slow Performance / High CPU

**Cause:** Database queries inefficient or volume performance poor

**Fix:**

```bash
# Check database load
docker compose exec db psql -U redi_admin -d redi_assessment -c \
  "SELECT pid, query FROM pg_stat_activity WHERE state != 'idle';"

# Check disk I/O (Linux)
iotop

# Check memory usage
docker stats

# Review logs for slow query warnings
docker compose logs db | grep slow
```

### "Port Already in Use"

**Error:** `Address already in use` when starting stack

**Fix:**

```bash
# Find process using port 8080
lsof -i :8080

# Kill process or use different port
docker compose down

# Or change port mapping in docker-compose.yml:
ports:
  - "8081:80"  # Maps container port 80 to host port 8081
```

---

## Security Checklist

- [ ] **Secrets**: All passwords changed from defaults in `.env`
- [ ] **JWT Secret**: At least 32 characters (64+ recommended)
- [ ] **HTTPS**: TLS certificate installed and valid (for production)
- [ ] **Firewall**: Only ports 80/443 exposed (or 8080 if internal network)
- [ ] **Database Password**: Strong, unique per environment
- [ ] **Authenticator/Worker Passwords**: Separate from DB password
- [ ] **REdI URLs**: Correct endpoints with valid authentication tokens
- [ ] **Backups**: Automated backup process configured and tested
- [ ] **Logs**: Review logs regularly for errors or suspicious activity
- [ ] **Updates**: Docker images pulled regularly for security patches
- [ ] **.env file**: In `.gitignore` and never committed to version control
- [ ] **Health checks**: All services returning healthy status
- [ ] **CSP Headers**: Verified in browser (F12 → Network → Response Headers)

### Environment Variable Security

**Never commit `.env` to git:**

```bash
# Verify .gitignore includes .env
cat .gitignore | grep "^.env"

# Check if accidentally committed
git log --all --full-history -- ".env"

# If committed, remove from history:
git filter-branch --tree-filter 'rm -f .env' HEAD
```

**Protect .env file permissions:**

```bash
chmod 600 .env
ls -la .env  # Should show: -rw------- 1 user user
```

---

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL 16 Docker Image](https://hub.docker.com/_/postgres)
- [PostgREST Documentation](https://postgrest.org/)
- [nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt / Certbot](https://certbot.eff.org/)
- [REdI Assessment System README](../README.md)

