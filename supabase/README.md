# Database Setup

This directory contains the database schema and seed data for the REdI Assessment System.

## Files

- `migrations/20260125_initial_schema.sql` - Complete database schema with tables, indexes, RLS policies, and triggers
- `seed.sql` - Seed data including the REdI course template, sample assessors, and test course

## Setup Instructions

### Option 1: Supabase (Recommended)

1. Create a new Supabase project at https://supabase.com

2. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

5. Run seed data:
   ```bash
   psql -h your-db-host -U postgres -d postgres -f supabase/seed.sql
   ```
   Or use the Supabase SQL editor to run the seed.sql file.

6. Enable Realtime for assessment tables in Supabase dashboard:
   - Navigate to Database → Replication
   - Enable realtime for: `component_assessments`, `outcome_scores`, `overall_assessments`

### Option 2: Self-Hosted PostgreSQL

1. Ensure PostgreSQL 14+ is installed

2. Create database:
   ```bash
   createdb redi_assessment
   ```

3. Run schema migration:
   ```bash
   psql -d redi_assessment -f supabase/migrations/20260125_initial_schema.sql
   ```

4. Run seed data:
   ```bash
   psql -d redi_assessment -f supabase/seed.sql
   ```

5. For realtime functionality, set up logical replication:
   ```sql
   CREATE PUBLICATION assessment_updates FOR TABLE 
     component_assessments, outcome_scores, overall_assessments;
   ```

## Schema Overview

### Core Entities

- **assessors** - Users who perform assessments (PIN-based auth)
- **course_templates** - Reusable course structures (e.g., REdI template)
- **template_components** - Components within a template (e.g., "Airway Management")
- **template_outcomes** - Specific skills/outcomes to assess
- **courses** - Actual course instances
- **participants** - Participants in specific courses
- **component_assessments** - Assessment data for participant × component
- **outcome_scores** - Individual outcome scores (Bondy scale or binary)
- **overall_assessments** - Final assessment summary per participant

### Key Features

- **Bondy Scale**: 5-point competency scale (Independent → Not Observed)
- **Binary Scoring**: Simple Pass/Fail for certain outcomes
- **Role-Based Outcomes**: Different outcomes for Team Leader vs Team Member
- **Real-time Updates**: Configured for multi-assessor concurrent access
- **Audit Trail**: last_modified_by and timestamps on all assessment data

## Sample Data

The seed file includes:

1. **REdI Template**: Complete course template with 4 components and 27 outcomes
2. **Sample Assessors**: 3 test assessors (development only)
3. **Sample Course**: One test course with 3 participants

### Test Credentials

For development, sample assessors are included with placeholder PIN hashes. In production:

- Use bcrypt to hash PINs before storage
- Never commit real PIN values
- Rotate credentials regularly

## Row Level Security

Basic RLS policies are enabled that allow all authenticated users full access. This should be refined for production based on your specific requirements:

- Consider adding assessor-specific policies
- Restrict data access by course
- Implement audit logging for sensitive operations

## Next Steps

After database setup:

1. Configure frontend environment variables with database connection details
2. Generate TypeScript types from database schema
3. Test database connection from application
4. Verify realtime subscriptions work correctly
