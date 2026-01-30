-- REdI Assessment System - Database Schema
-- Adapted from Supabase migration for self-hosted PostgreSQL 16 + PostgREST
--
-- Changes from Supabase version:
--   - Added Row-Level Security policies for web_anon and redi_worker roles
--   - Removed Supabase-specific realtime publication comments
--   - Changed courses.sharepoint_ref VARCHAR(500) -> redi_event_id INTEGER
--   - Added participants.redi_participant_id INTEGER
--   - Added GRANT permissions for web_anon role
--   - Added NOTIFY triggers for real-time assessment changes
--   - Added logical replication publication

-- ============================================================================
-- ENUMERATIONS
-- ============================================================================

-- Course types
CREATE TYPE course_type AS ENUM ('FULL_COURSE', 'REFRESHER', 'ASSESSMENT_ONLY');

-- Assessment roles
CREATE TYPE assessment_role AS ENUM ('TEAM_LEADER', 'TEAM_MEMBER', 'BOTH');

-- Outcome types
CREATE TYPE outcome_type AS ENUM ('BONDY_SCALE', 'BINARY');

-- Bondy scale values
CREATE TYPE bondy_score AS ENUM ('INDEPENDENT', 'SUPERVISED', 'ASSISTED', 'MARGINAL', 'NOT_OBSERVED');

-- Binary scores
CREATE TYPE binary_score AS ENUM ('PASS', 'FAIL');

-- Overall outcomes
CREATE TYPE overall_outcome AS ENUM ('PASS', 'UNSUCCESSFUL_ATTEMPT');

-- Recommended actions
CREATE TYPE recommended_action AS ENUM (
  'RESTART_LEARNING',
  'REATTEMPT_COURSE',
  'REASSESSMENT_ONLY',
  'REFER_EDUCATOR'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Assessors table
CREATE TABLE assessors (
  assessor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  pin_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course templates
CREATE TABLE course_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  course_type course_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template components (e.g., "Airway Management")
CREATE TABLE template_components (
  component_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES course_templates(template_id) ON DELETE CASCADE,
  component_name VARCHAR(255) NOT NULL,
  component_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, component_order)
);

-- Template outcomes (e.g., specific skills to assess)
CREATE TABLE template_outcomes (
  outcome_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES template_components(component_id) ON DELETE CASCADE,
  outcome_text TEXT NOT NULL,
  outcome_order INTEGER NOT NULL,
  outcome_type outcome_type NOT NULL DEFAULT 'BONDY_SCALE',
  is_mandatory BOOLEAN DEFAULT TRUE,
  applies_to assessment_role NOT NULL DEFAULT 'BOTH',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(component_id, outcome_order)
);

-- Courses (actual instances)
-- NOTE: sharepoint_ref replaced with redi_event_id for REdI API integration
CREATE TABLE courses (
  course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES course_templates(template_id),
  course_name VARCHAR(255) NOT NULL,
  course_date DATE NOT NULL,
  course_coordinator VARCHAR(255),
  redi_event_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants in courses
-- NOTE: redi_participant_id added for REdI API integration
CREATE TABLE participants (
  participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  candidate_name VARCHAR(255) NOT NULL,
  payroll_number VARCHAR(50),
  designation VARCHAR(255),
  work_area VARCHAR(255),
  assessment_role assessment_role NOT NULL DEFAULT 'BOTH',
  engagement_rating INTEGER CHECK (engagement_rating >= 1 AND engagement_rating <= 5),
  redi_participant_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Component assessments (participant x component)
CREATE TABLE component_assessments (
  assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES template_components(component_id),
  component_feedback TEXT,
  is_passed_quick BOOLEAN DEFAULT FALSE,
  last_modified_by UUID REFERENCES assessors(assessor_id),
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, component_id)
);

-- Outcome scores
CREATE TABLE outcome_scores (
  outcome_score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES component_assessments(assessment_id) ON DELETE CASCADE,
  outcome_id UUID NOT NULL REFERENCES template_outcomes(outcome_id),
  bondy_score bondy_score,
  binary_score binary_score,
  scored_by UUID REFERENCES assessors(assessor_id),
  scored_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id, outcome_id)
);

-- Overall assessments (per participant)
CREATE TABLE overall_assessments (
  overall_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
  overall_feedback TEXT,
  engagement_score INTEGER CHECK (engagement_score >= 1 AND engagement_score <= 5),
  team_leader_outcome overall_outcome,
  team_member_outcome overall_outcome,
  recommended_action recommended_action,
  last_modified_by UUID REFERENCES assessors(assessor_id),
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Assessors
CREATE INDEX idx_assessors_email ON assessors(email);
CREATE INDEX idx_assessors_active ON assessors(is_active);

-- Template relationships
CREATE INDEX idx_template_components_template ON template_components(template_id);
CREATE INDEX idx_template_outcomes_component ON template_outcomes(component_id);

-- Course relationships
CREATE INDEX idx_courses_template ON courses(template_id);
CREATE INDEX idx_courses_date ON courses(course_date);
CREATE UNIQUE INDEX idx_courses_redi_event ON courses(redi_event_id);
CREATE INDEX idx_participants_course ON participants(course_id);
CREATE UNIQUE INDEX idx_participants_redi_id ON participants(redi_participant_id);

-- Assessment relationships
CREATE INDEX idx_component_assessments_participant ON component_assessments(participant_id);
CREATE INDEX idx_component_assessments_component ON component_assessments(component_id);
CREATE INDEX idx_outcome_scores_assessment ON outcome_scores(assessment_id);
CREATE INDEX idx_outcome_scores_outcome ON outcome_scores(outcome_id);
CREATE INDEX idx_overall_assessments_participant ON overall_assessments(participant_id);

-- Modified timestamps for real-time queries
CREATE INDEX idx_component_assessments_modified ON component_assessments(last_modified_at);
CREATE INDEX idx_outcome_scores_scored ON outcome_scores(scored_at);
CREATE INDEX idx_overall_assessments_modified ON overall_assessments(last_modified_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assessors_updated_at
  BEFORE UPDATE ON assessors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_templates_updated_at
  BEFORE UPDATE ON course_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- NOTIFY TRIGGERS (for worker WebSocket bridge)
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_assessment_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('assessment_changes', json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'record', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END
  )::text);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_component_assessments_change
  AFTER INSERT OR UPDATE OR DELETE ON component_assessments
  FOR EACH ROW
  EXECUTE FUNCTION notify_assessment_change();

CREATE TRIGGER notify_outcome_scores_change
  AFTER INSERT OR UPDATE OR DELETE ON outcome_scores
  FOR EACH ROW
  EXECUTE FUNCTION notify_assessment_change();

CREATE TRIGGER notify_overall_assessments_change
  AFTER INSERT OR UPDATE OR DELETE ON overall_assessments
  FOR EACH ROW
  EXECUTE FUNCTION notify_assessment_change();

-- ============================================================================
-- GRANTS FOR PostgREST (web_anon role)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO web_anon;

-- Read-only on reference and operational data
GRANT SELECT ON assessors, course_templates, template_components, template_outcomes,
  courses, participants TO web_anon;

-- Full CRUD on assessment workflow tables only
GRANT SELECT, INSERT, UPDATE, DELETE ON component_assessments, outcome_scores,
  overall_assessments TO web_anon;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO web_anon;

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================
-- RLS restricts row access per role. The table owner (redi_admin) bypasses RLS.
-- web_anon: permissive read/write for assessment workflow (API auth is at app layer)
-- redi_worker: permissive access for sync and report operations

ALTER TABLE assessors ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE overall_assessments ENABLE ROW LEVEL SECURITY;

-- web_anon: read-only access to reference/config data
CREATE POLICY web_anon_select_assessors ON assessors FOR SELECT TO web_anon USING (true);
CREATE POLICY web_anon_select_templates ON course_templates FOR SELECT TO web_anon USING (true);
CREATE POLICY web_anon_select_components ON template_components FOR SELECT TO web_anon USING (true);
CREATE POLICY web_anon_select_outcomes ON template_outcomes FOR SELECT TO web_anon USING (true);

-- web_anon: read-only access to course/participant data
CREATE POLICY web_anon_select_courses ON courses FOR SELECT TO web_anon USING (true);
CREATE POLICY web_anon_select_participants ON participants FOR SELECT TO web_anon USING (true);

-- web_anon: full CRUD on assessment data (the core workflow)
CREATE POLICY web_anon_all_assessments ON component_assessments FOR ALL TO web_anon USING (true) WITH CHECK (true);
CREATE POLICY web_anon_all_scores ON outcome_scores FOR ALL TO web_anon USING (true) WITH CHECK (true);
CREATE POLICY web_anon_all_overall ON overall_assessments FOR ALL TO web_anon USING (true) WITH CHECK (true);

-- ============================================================================
-- GRANTS FOR Worker Service (redi_worker role)
-- ============================================================================
-- Least-privilege: SELECT on all tables, write only to sync targets.
-- No DROP, ALTER, CREATE, or superuser privileges.

GRANT USAGE ON SCHEMA public TO redi_worker;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO redi_worker;
GRANT INSERT, UPDATE ON courses, participants TO redi_worker;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO redi_worker;

-- RLS policies for redi_worker (permissive — worker is a trusted internal service)
CREATE POLICY worker_select_assessors ON assessors FOR SELECT TO redi_worker USING (true);
CREATE POLICY worker_select_templates ON course_templates FOR SELECT TO redi_worker USING (true);
CREATE POLICY worker_select_components ON template_components FOR SELECT TO redi_worker USING (true);
CREATE POLICY worker_select_outcomes ON template_outcomes FOR SELECT TO redi_worker USING (true);
CREATE POLICY worker_select_courses ON courses FOR SELECT TO redi_worker USING (true);
CREATE POLICY worker_insert_courses ON courses FOR INSERT TO redi_worker WITH CHECK (true);
CREATE POLICY worker_update_courses ON courses FOR UPDATE TO redi_worker USING (true) WITH CHECK (true);
CREATE POLICY worker_select_participants ON participants FOR SELECT TO redi_worker USING (true);
CREATE POLICY worker_insert_participants ON participants FOR INSERT TO redi_worker WITH CHECK (true);
CREATE POLICY worker_update_participants ON participants FOR UPDATE TO redi_worker USING (true) WITH CHECK (true);
CREATE POLICY worker_select_assessments ON component_assessments FOR SELECT TO redi_worker USING (true);
CREATE POLICY worker_select_scores ON outcome_scores FOR SELECT TO redi_worker USING (true);
CREATE POLICY worker_select_overall ON overall_assessments FOR SELECT TO redi_worker USING (true);

-- ============================================================================
-- LOGICAL REPLICATION PUBLICATION
-- ============================================================================

CREATE PUBLICATION assessment_changes FOR TABLE
  component_assessments, outcome_scores, overall_assessments;
