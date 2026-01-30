# Worker API Reference

## Authentication
All endpoints except `/api/health` and `/api/auth/*` require a JWT Bearer token.

## Endpoints

### Health
- `GET /api/health` - Health check (no auth)
  - Returns: `{ status: "healthy", timestamp: "..." }`

### Authentication
- `POST /api/auth/login` - Authenticate assessor
  - Body: `{ assessorId: string, pin: string }`
  - Returns: `{ success: true, assessor: {...}, token: string }`
- `GET /api/auth/assessors` - List active assessors (no auth)
  - Returns: `{ assessors: [{ assessor_id, name }] }`

### Sync (requires auth, rate limited: 20/15min)
- `POST /api/sync/courses` - Sync courses from REdI
- `POST /api/sync/participants/:courseId` - Sync participants for course
- `POST /api/sync/all` - Full sync
- `GET /api/sync/status` - Get sync status

### Reports (requires auth, rate limited: 10/15min)
- `POST /api/reports/generate/:courseId` - Generate report
- `POST /api/reports/generate-and-send/:courseId` - Generate and email
- `POST /api/reports/daily` - Generate all daily reports
- `GET /api/reports/list` - List generated reports

### WebSocket
- `ws://host/ws?token=JWT` - Real-time updates
  - Client messages: `subscribe`, `presence`, `ping`
  - Server messages: `subscribed`, `change`, `presence_state`, `pong`
