-- REdI Assessment System - Initial Database Schema
-- Generated from specification v1.0

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
CREATE TABLE courses (
  course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES course_templates(template_id),
  course_name VARCHAR(255) NOT NULL,
  course_date DATE NOT NULL,
  course_coordinator VARCHAR(255),
  sharepoint_ref VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants in courses
CREATE TABLE participants (
  participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  candidate_name VARCHAR(255) NOT NULL,
  payroll_number VARCHAR(50),
  designation VARCHAR(255),
  work_area VARCHAR(255),
  assessment_role assessment_role NOT NULL DEFAULT 'BOTH',
  engagement_rating INTEGER CHECK (engagement_rating >= 1 AND engagement_rating <= 5),
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
CREATE INDEX idx_participants_course ON participants(course_id);

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
-- ROW LEVEL SECURITY (Basic - All authenticated users)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE assessors ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE overall_assessments ENABLE ROW LEVEL SECURITY;

-- Basic policies (allow all authenticated users for now)
-- These can be refined later with proper role-based access

CREATE POLICY "Allow all for authenticated users" ON assessors
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON course_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON template_components
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON template_outcomes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON courses
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON participants
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON component_assessments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON outcome_scores
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON overall_assessments
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================

-- Enable realtime for tables that need live updates
-- Note: This is Supabase-specific. For vanilla Postgres, use logical replication.

-- Tables to enable for realtime:
-- - component_assessments
-- - outcome_scores
-- - overall_assessments

-- In Supabase, this is done via the dashboard or CLI:
-- supabase realtime on public:component_assessments
-- supabase realtime on public:outcome_scores
-- supabase realtime on public:overall_assessments

-- For vanilla Postgres, create publication:
-- CREATE PUBLICATION assessment_updates FOR TABLE 
--   component_assessments, outcome_scores, overall_assessments;
