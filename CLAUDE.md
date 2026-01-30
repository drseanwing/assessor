# CLAUDE.md - Agent Instructions

## Project Overview
REdI (Resuscitation Education Initiative) Assessment System - a real-time, multi-assessor competency assessment platform for Queensland Health. Replaces paper-based assessment forms with a digital solution supporting simultaneous scoring by multiple assessors with live synchronization.

## Tech Stack
- **Language:** TypeScript 5.7+
- **Frontend:** React 19 + Vite 7 + Tailwind CSS 3.4 + Zustand 5 (state) + React Router 7
- **Backend:** Node.js 20 + Express 4 + WebSocket (ws 8)
- **Database:** PostgreSQL 16 + PostgREST v12.2.3 (auto-REST API)
- **Infrastructure:** Docker Compose (4 services), nginx reverse proxy

## Development Standards

### Code Style
- Follow TypeScript strict mode conventions
- Maximum line length: 120 characters
- Use meaningful variable/function names
- Frontend: React functional components with hooks only
- Backend: Express routes with typed request/response

### Logging Requirements
- Worker uses console.log/console.error (migration to pino planned)
- Slow query warnings (>1000ms) in db.ts
- Cron job execution logged with [CRON] prefix
- Never log sensitive data (credentials, PII, tokens)

### Error Handling
- Frontend: ErrorBoundary component wraps routes
- Backend: try/catch with JSON error responses
- Database: PostgREST returns standard error format
- WebSocket: Graceful error handling with reconnection

### Testing Requirements
- Frontend: Vitest for unit tests, Playwright for E2E
- Run: `cd frontend && npm test` or `npm run test:e2e`
- Coverage: `npm run test:coverage`

## File Naming Conventions
- TypeScript: `camelCase.ts` / `camelCase.tsx`
- Components: `PascalCase.tsx`
- CSS: Tailwind utility classes (no separate CSS files)
- Tests: `*.test.ts`, `*.spec.ts`
- SQL: `NN-descriptive-name.sql` (numbered for execution order)

## Git Workflow
- Branch naming: `feature/`, `bugfix/`, `hotfix/`, `chore/`, `docs/`
- Commit messages: Conventional Commits format
- Main branch: `main`

## Key Files
- `docker-compose.yml` - Full stack orchestration (4 services)
- `db/init/00-roles.sh` - PostgreSQL role creation
- `db/init/01-schema.sql` - Database schema with RLS, triggers, grants
- `db/init/02-seed.sql` - REdI course template and sample data
- `nginx.conf` - Reverse proxy + security headers
- `.env.docker.example` - All environment variables documented
- `worker/src/websocket.ts` - WebSocket server + PG LISTEN bridge
- `worker/src/routes/auth.ts` - Server-side PIN authentication
- `frontend/src/stores/assessmentStore.ts` - Core assessment state management
- `frontend/src/hooks/useRealtime.ts` - WebSocket client hook

## Prohibited Actions
- Do not commit secrets or credentials
- Do not modify RLS policies without security review
- Do not expose pin_hash to frontend (server-side auth only)
- Do not remove security headers from nginx.conf
- Do not bypass JWT authentication on protected routes

## Common Commands
```bash
# Development (full stack)
cp .env.docker.example .env   # Configure environment
docker compose up -d            # Start all services
docker compose logs -f          # View logs

# Frontend only
cd frontend && npm run dev      # Vite dev server

# Worker only
cd worker && npm run dev        # tsx watch mode

# Testing
cd frontend && npm test         # Vitest
cd frontend && npm run test:e2e # Playwright

# Database access
docker compose exec db psql -U redi_admin -d redi_assessment
```
