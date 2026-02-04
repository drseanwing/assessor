# CLAUDE.md - Agent Instructions

## Project Overview
REdI Assessment System is a competency assessment platform for Queensland Health's Resuscitation Education Initiative. It enables assessors to evaluate healthcare professionals' resuscitation competencies using the Bondy Scale across multiple components including Airway Management, Electrical Therapies, CPR & Defibrillation, and Integrated Simulation. The system supports real-time collaboration between multiple assessors with automatic synchronization.

## Tech Stack
- **Language:** TypeScript 5.9
- **Framework:** React 19 + Vite 7 (frontend), Express 4 (worker/backend)
- **Database:** PostgreSQL 16 with PostgREST 12
- **Infrastructure:** Docker, Docker Compose, nginx reverse proxy

## Development Standards

### Code Style
- Follow TypeScript/React best practices (ESLint with React Hooks rules)
- Maximum line length: 120 characters
- Use meaningful variable/function names (no abbreviations except common ones)
- All functions require JSDoc comments for complex logic

### Logging Requirements
- Use structured logging (JSON format preferred)
- Log to external files in `/var/log/app/` or `./logs/`
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Include correlation IDs for request tracing
- Never log sensitive data (credentials, PII, tokens)

### Error Handling
- Implement graceful degradation for all external dependencies
- Use custom exception classes for domain-specific errors
- Always provide meaningful error messages
- Include retry logic with exponential backoff for network operations
- Log all errors with full context (stack trace, request details)

### Testing Requirements
- Minimum 80% code coverage for new code
- Unit tests for all business logic
- Integration tests for API endpoints
- E2E tests for critical user journeys

## File Naming Conventions
- TypeScript/React: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- CSS: Tailwind CSS (no separate CSS files)
- Tests: `*.test.ts`, `*.spec.ts`

## Git Workflow
- Branch naming: `feature/`, `bugfix/`, `hotfix/`, `chore/`, `docs/`
- Commit messages: Conventional Commits format
- Always rebase before merging
- Squash commits on merge to main

## Key Files
- `docker-compose.yml` - Local development environment
- `redi-assessment-spec.md` - System specification and requirements
- `.env.example` - Required environment variables
- `PROGRESS.md` - Implementation progress tracking

## Prohibited Actions
- Do not commit secrets or credentials
- Do not modify CI/CD workflows without explicit approval
- Do not remove or weaken security configurations
- Do not bypass pre-commit hooks

## Common Commands
```bash
# Development (Docker)
docker compose up -d
docker compose logs -f

# Frontend Development
cd frontend
npm install
npm run dev
npm run build

# Testing
cd frontend
npm run test
npm run test:e2e

# Linting
cd frontend
npm run lint

# Database
docker compose exec db psql -U redi_admin -d redi_assessment
```
