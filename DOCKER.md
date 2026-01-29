# Docker Setup

This directory contains Docker configuration files for running the REdI Assessment System as a containerized stack.

## Overview

The Docker setup includes:
- **PostgreSQL**: Database with the Supabase extensions
- **PostgREST**: REST API for the database
- **Realtime**: WebSocket server for real-time updates
- **Storage API**: File storage service
- **Kong**: API Gateway routing requests to appropriate services
- **Supabase Studio**: Web-based database management UI
- **Frontend**: React application served via nginx

## Port Allocation (7385-7395)

The following ports are used to avoid conflicts with other services:

- **7385**: Frontend (nginx)
- **7386**: PostgreSQL
- **7387**: Kong HTTP (API Gateway)
- **7388**: Kong HTTPS (API Gateway)
- **7389**: Supabase Studio

## Quick Start

1. **Copy the environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Review and customize .env**:
   - Update `POSTGRES_PASSWORD` for security
   - Keep other settings as-is for local development

3. **Start all services**:
   ```bash
   docker-compose up -d
   ```

4. **Check service health**:
   ```bash
   docker-compose ps
   ```

5. **View logs**:
   ```bash
   docker-compose logs -f
   ```

## Accessing Services

- **Frontend Application**: http://localhost:7385
- **Supabase Studio**: http://localhost:7389
- **API Gateway**: http://localhost:7387
- **PostgreSQL**: localhost:7386 (use psql or any database client)

### Database Connection

```bash
psql -h localhost -p 7386 -U postgres -d redi_assessment
```

Password: Value of `POSTGRES_PASSWORD` from `.env`

## Service Management

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes (WARNING: Deletes all data)
```bash
docker-compose down -v
```

### Restart a specific service
```bash
docker-compose restart frontend
```

### View logs for a specific service
```bash
docker-compose logs -f postgres
docker-compose logs -f frontend
```

### Rebuild the frontend after code changes
```bash
docker-compose up -d --build frontend
```

## Initial Setup

The database schema and seed data are automatically loaded when the PostgreSQL container starts for the first time. The initialization scripts are:

1. `/docker-entrypoint-initdb.d/01-schema.sql` - Database schema
2. `/docker-entrypoint-initdb.d/02-seed.sql` - Seed data

### Test Credentials

The seed data includes sample assessors. Default test PIN: 1234

## Production Considerations

Before deploying to production:

1. **Security**:
   - Change `POSTGRES_PASSWORD` to a strong password
   - Generate new JWT_SECRET: `openssl rand -base64 32`
   - Generate proper JWT tokens for ANON_KEY and SERVICE_ROLE_KEY
   - Enable HTTPS on Kong
   - Configure proper CORS settings

2. **Performance**:
   - Use persistent volumes for production data
   - Configure PostgreSQL connection pooling
   - Set appropriate resource limits

3. **Monitoring**:
   - Set up health checks
   - Configure logging aggregation
   - Monitor resource usage

## Troubleshooting

### Services fail to start

Check logs for specific service:
```bash
docker-compose logs postgres
docker-compose logs kong
```

### Database connection errors

1. Ensure PostgreSQL is healthy:
   ```bash
   docker-compose ps postgres
   ```

2. Check PostgreSQL logs:
   ```bash
   docker-compose logs postgres
   ```

### Frontend build issues

Rebuild with no cache:
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Port conflicts

If ports 7385-7395 are in use, update the port mappings in `.env`:
```
FRONTEND_PORT=8385
POSTGRES_PORT=8386
# etc.
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

## Architecture

```
                                    ┌─────────────┐
                                    │   Browser   │
                                    └──────┬──────┘
                                           │
                                    ┌──────▼──────┐
                                    │  Frontend   │
                                    │   (nginx)   │
                                    │   :7385     │
                                    └──────┬──────┘
                                           │
                                    ┌──────▼──────┐
                                    │    Kong     │
                                    │  Gateway    │
                                    │   :7387     │
                                    └──────┬──────┘
                         ┌─────────────────┼─────────────────┐
                         │                 │                 │
                  ┌──────▼──────┐   ┌─────▼─────┐   ┌──────▼──────┐
                  │  PostgREST  │   │ Realtime  │   │   Storage   │
                  │   (REST)    │   │   (WS)    │   │    (API)    │
                  └──────┬──────┘   └─────┬─────┘   └──────┬──────┘
                         │                 │                 │
                         └─────────────────┼─────────────────┘
                                           │
                                    ┌──────▼──────┐
                                    │ PostgreSQL  │
                                    │   :7386     │
                                    └─────────────┘
```

## Data Persistence

Data is persisted in Docker volumes:
- `postgres_data`: Database files
- `storage_data`: Uploaded files

To back up the database:
```bash
docker-compose exec postgres pg_dump -U postgres redi_assessment > backup.sql
```

To restore from backup:
```bash
docker-compose exec -T postgres psql -U postgres redi_assessment < backup.sql
```

## Development Workflow

1. Make code changes in `frontend/`
2. Rebuild and restart frontend:
   ```bash
   docker-compose up -d --build frontend
   ```
3. Test changes at http://localhost:7385

For database schema changes:
1. Update migration files in `supabase/migrations/`
2. Recreate database:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

## Support

For issues or questions:
- Check the logs: `docker-compose logs -f`
- Review the main README.md for application documentation
- Open an issue on GitHub
