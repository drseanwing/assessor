# REdI Assessment System

A web-based application for real-time, multi-assessor competency evaluation during clinical education courses.

## Overview

The REdI Assessment System enables multiple assessors to simultaneously evaluate participants during resuscitation education courses. Built for Queensland Health's Resuscitation Education Initiative (REdI), it replaces paper-based assessment forms with a modern, real-time digital solution.

### Key Features

- **Multi-Assessor Support** - Multiple assessors can enter data simultaneously without conflicts
- **Real-time Updates** - Dashboard updates within 5 seconds of any data change
- **Quick Pass Workflow** - Complete assessment in under 3 minutes for passing candidates
- **Bondy Scale Assessment** - 5-point competency scale (Independent → Not Observed)
- **Mobile-First Design** - Optimized for tablets and mobile devices
- **Offline Support** - Continue working without internet (implemented)

## Current Status

**Phase 6: Polish & Deploy - COMPLETE** ✅

See [PROGRESS.md](PROGRESS.md) for detailed implementation status.

## Quick Start

### Option 1: Docker (Recommended)

The fastest way to get started is using Docker Compose:

```bash
# Copy environment template
cp .env.docker .env

# Start all services (PostgreSQL, API, Frontend, etc.)
docker compose up -d

# Check service health
docker compose ps

# View logs
docker compose logs -f
```

The application will be available at:
- **Frontend**: http://localhost:7385

See [DOCKER.md](DOCKER.md) for detailed Docker setup instructions.

### Option 2: Prerequisites for Manual Setup

- Node.js 20+
- PostgreSQL 14+ (or Supabase account)
- npm or yarn

### Automated Setup (Recommended)

The easiest way to set up the application is using the automated setup script:

```bash
# Make the script executable
chmod +x setup.sh

# Run interactive setup
./setup.sh

# Or run unattended setup with Supabase
./setup.sh --yes --skip-db --supabase-url 'YOUR_SUPABASE_URL' --supabase-key 'YOUR_SUPABASE_KEY'

# Or run unattended setup with local PostgreSQL
./setup.sh --yes --db-name redi_assessment --db-user postgres
```

The setup script will:
- ✅ Check for required dependencies (Node.js, npm, PostgreSQL)
- ✅ Install frontend dependencies
- ✅ Configure the database (create, migrate, seed)
- ✅ Set up environment variables
- ✅ Verify the build

Run `./setup.sh --help` for all available options.

### Manual Setup

If you prefer manual setup, follow these steps:

#### Database Setup

1. **Option A: Docker Compose** (Recommended)
   ```bash
   # Use Docker Compose for easiest setup
   docker compose up -d
   # See DOCKER.md for detailed instructions
   ```

2. **Option B: Using Supabase** (Legacy/Alternative)
   ```bash
   # Create project at https://supabase.com
   # Copy your project URL and anon key
   ```

3. **Option C: Self-hosted PostgreSQL**
   ```bash
   createdb redi_assessment
   psql -d redi_assessment -f supabase/migrations/20260125_initial_schema.sql
   psql -d redi_assessment -f supabase/seed.sql
   ```

See [supabase/README.md](supabase/README.md) for detailed database setup instructions.

#### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

The application will be available at http://localhost:5173

See [frontend/README.md](frontend/README.md) for detailed frontend setup instructions.

## Usage

### For Assessors

1. **Login** - Select your name and enter your 4-digit PIN
2. **Select Course** - Choose the course you're assessing from today's courses
3. **Select Participant** - Choose the participant to assess
4. **Assess** - Enter scores for each outcome using the Bondy scale
5. **Save** - Changes auto-save as you work

### For Administrators

- Use SQL to manage assessors, courses, and participants
- Admin UI coming in future phase

## Architecture

### Technology Stack

**Backend/Database:**
- PostgreSQL 16 with PostgREST 12
- Express 4 worker for auth, WebSocket, and custom endpoints
- Row Level Security for data access control

**Frontend:**
- React 19 + TypeScript
- Vite 7 (build tool)
- Tailwind CSS (styling)
- Zustand (state management)
- React Router v7 (navigation)

### Project Structure

```
assessor/
├── supabase/          # Database schema and seed data
│   ├── migrations/    # SQL migration files
│   ├── seed.sql       # Sample data
│   └── README.md
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── lib/
│   │   └── types/
│   └── README.md
├── worker/            # Express backend server
│   └── src/
│       ├── routes/    # API endpoints
│       ├── services/  # Business logic
│       └── middleware/ # Auth, CORS, etc.
├── db/                # Database configuration
│   └── init/          # Initialization scripts
├── docs/              # Documentation
├── docker-compose.yml # Docker orchestration
├── nginx.conf         # Reverse proxy config
├── redi-assessment-spec.md  # Complete specification
└── PROGRESS.md        # Implementation progress
```

## Development Roadmap

### Phase 1: Foundation ✅ COMPLETE
- Database schema and seed data
- React project setup
- PIN authentication
- Course and participant listing

### Phase 2: Assessment Entry ✅ COMPLETE
- Assessment panel layout
- Bondy scale selector
- Quick pass button
- Auto-save functionality

### Phase 3: Real-Time Sync ✅ COMPLETE
- Realtime subscriptions
- Presence indicators
- Conflict resolution

### Phase 4: Dashboard ✅ COMPLETE
- Dashboard grid view
- Progress visualization
- Feedback aggregation

### Phase 5: SharePoint Integration (Partial)
- Course import from SharePoint (placeholder removed)
- Participant sync
- OAuth authentication

### Phase 6: Polish & Deploy ✅ COMPLETE
- Offline support ✅
- End-to-end tests ✅
- Production deployment ✅

See [redi-assessment-spec.md](redi-assessment-spec.md) for complete specifications.

## Database Schema

### Core Entities

- **assessors** - Users who perform assessments
- **course_templates** - Reusable course structures
- **template_components** - Components within templates
- **template_outcomes** - Specific skills to assess
- **courses** - Actual course instances
- **participants** - Participants in courses
- **component_assessments** - Assessment data per component
- **outcome_scores** - Individual outcome scores
- **overall_assessments** - Final assessment summary

### Bondy Scale

| Value | Label | Description |
|-------|-------|-------------|
| 5 | Independent | Safe, accurate, proficient; no cues required |
| 4 | Supervised | Safe, accurate; occasional cues required |
| 3 | Assisted | Safe but requires frequent cues |
| 2 | Marginal | Unsafe; continuous cues required |
| 1 | Not Observed | Not demonstrated during assessment |

## Testing

### Running Tests

**Unit Tests (Vitest)**
```bash
cd frontend
npm test           # Run all tests
npm test:ui        # Interactive UI
npm test:coverage  # With coverage
```

**End-to-End Tests (Playwright)**
```bash
cd frontend
npx playwright install  # First time only
npm run test:e2e        # Run e2e tests
npm run test:e2e:ui     # With Playwright UI
```

### Sample Data

The seed file includes:
- 3 sample assessors
- 1 REdI course (January 25, 2026)
- 3 sample participants
- Complete REdI template with 4 components and 27 outcomes

### Test Credentials

Use the PIN hashes from seed.sql. Default test PIN: 1234

## Security

### Current Implementation
- PIN authentication with bcrypt hashing
- Session tokens in localStorage
- Row Level Security enabled
- Content-Security-Policy header enforcement

### Production Requirements
- HTTPS required
- Secure session management
- Refine RLS policies
- Regular credential rotation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Documentation

- [Complete Specification](redi-assessment-spec.md) - Full system specification
- [Implementation Progress](PROGRESS.md) - Current status and completed work
- [Database Setup](supabase/README.md) - Database installation guide
- [Frontend Guide](frontend/README.md) - Frontend development guide

## License

Copyright © 2026 Queensland Health

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Project Status:** Phase 6 Complete - 90.8% Overall
**Last Updated:** February 4, 2026
