-- REdI Assessment System - Row-Level Security & Grant Restrictions
--
-- Principle of least privilege:
--   - web_anon (PostgREST) can only read template/course/participant data
--   - web_anon can read/write assessment data (scores, feedback)
--   - web_anon NEVER sees pin_hash or assessor email
--   - redi_admin (worker) retains full access as table owner

-- ============================================================================
-- STEP 1: REVOKE overly broad grants from 01-schema.sql
-- ============================================================================

REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM web_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM web_anon;

-- ============================================================================
-- STEP 2: ASSESSORS - column-level SELECT only (hide pin_hash and email)
-- ============================================================================

GRANT SELECT (assessor_id, name, is_active) ON assessors TO web_anon;

-- ============================================================================
-- STEP 3: READ-ONLY tables for web_anon (templates, courses, participants)
-- ============================================================================

GRANT SELECT ON course_templates TO web_anon;
GRANT SELECT ON template_components TO web_anon;
GRANT SELECT ON template_outcomes TO web_anon;
GRANT SELECT ON courses TO web_anon;
GRANT SELECT ON participants TO web_anon;

-- ============================================================================
-- STEP 4: READ-WRITE tables for web_anon (assessment data)
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON component_assessments TO web_anon;
GRANT SELECT, INSERT, UPDATE ON outcome_scores TO web_anon;
GRANT SELECT, INSERT, UPDATE ON overall_assessments TO web_anon;

-- Sequences needed for UUID generation in inserts
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO web_anon;

-- ============================================================================
-- STEP 5: ENABLE ROW-LEVEL SECURITY on all tables
-- ============================================================================

ALTER TABLE assessors ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE overall_assessments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: RLS POLICIES
-- ============================================================================

-- Assessors: web_anon can only see active assessors
CREATE POLICY assessors_select ON assessors
  FOR SELECT TO web_anon
  USING (is_active = TRUE);

-- Templates: read-only, all rows visible
CREATE POLICY templates_select ON course_templates
  FOR SELECT TO web_anon
  USING (TRUE);

CREATE POLICY components_select ON template_components
  FOR SELECT TO web_anon
  USING (TRUE);

CREATE POLICY outcomes_select ON template_outcomes
  FOR SELECT TO web_anon
  USING (TRUE);

-- Courses: read-only, all rows visible
CREATE POLICY courses_select ON courses
  FOR SELECT TO web_anon
  USING (TRUE);

-- Participants: read-only, all rows visible
CREATE POLICY participants_select ON participants
  FOR SELECT TO web_anon
  USING (TRUE);

-- Component assessments: full CRUD (no DELETE - assessments are permanent)
CREATE POLICY comp_assessments_select ON component_assessments
  FOR SELECT TO web_anon
  USING (TRUE);

CREATE POLICY comp_assessments_insert ON component_assessments
  FOR INSERT TO web_anon
  WITH CHECK (TRUE);

CREATE POLICY comp_assessments_update ON component_assessments
  FOR UPDATE TO web_anon
  USING (TRUE)
  WITH CHECK (TRUE);

-- Outcome scores: full CRUD (no DELETE)
CREATE POLICY outcome_scores_select ON outcome_scores
  FOR SELECT TO web_anon
  USING (TRUE);

CREATE POLICY outcome_scores_insert ON outcome_scores
  FOR INSERT TO web_anon
  WITH CHECK (TRUE);

CREATE POLICY outcome_scores_update ON outcome_scores
  FOR UPDATE TO web_anon
  USING (TRUE)
  WITH CHECK (TRUE);

-- Overall assessments: full CRUD (no DELETE)
CREATE POLICY overall_assessments_select ON overall_assessments
  FOR SELECT TO web_anon
  USING (TRUE);

CREATE POLICY overall_assessments_insert ON overall_assessments
  FOR INSERT TO web_anon
  WITH CHECK (TRUE);

CREATE POLICY overall_assessments_update ON overall_assessments
  FOR UPDATE TO web_anon
  USING (TRUE)
  WITH CHECK (TRUE);
