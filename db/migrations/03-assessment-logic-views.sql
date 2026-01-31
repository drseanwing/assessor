-- Assessment Logic Views and Functions
-- Implements business rules:
-- 1. Team Leader pass requires passing BOTH Team Leader AND Team Member components
-- 2. Team Member pass requires passing only Team Member components
-- 3. Pass/fail only shown when ALL applicable components are completed

-- Drop existing views if they exist
DROP VIEW IF EXISTS participant_assessment_summary CASCADE;

-- Create view that calculates assessment completion and pass/fail status
CREATE OR REPLACE VIEW participant_assessment_summary AS
WITH participant_template AS (
  -- Get the template for each participant's course
  SELECT
    p.participant_id,
    p.candidate_name,
    p.assessment_role,
    c.template_id,
    c.course_id,
    c.course_name
  FROM participants p
  JOIN courses c ON p.course_id = c.course_id
),
component_requirements AS (
  -- Get all components that apply to each participant based on their role
  SELECT
    pt.participant_id,
    pt.assessment_role,
    tc.component_id,
    tc.component_name,
    tc.component_order,
    -- Component applies to this participant if:
    -- - Role is TEAM_LEADER and component has any TEAM_LEADER or BOTH outcomes
    -- - Role is TEAM_MEMBER and component has any TEAM_MEMBER or BOTH outcomes
    -- - Role is BOTH and component has any outcomes
    CASE
      WHEN pt.assessment_role = 'TEAM_LEADER' THEN
        EXISTS (
          SELECT 1 FROM template_outcomes to2
          WHERE to2.component_id = tc.component_id
          AND to2.applies_to IN ('TEAM_LEADER', 'BOTH')
        )
      WHEN pt.assessment_role = 'TEAM_MEMBER' THEN
        EXISTS (
          SELECT 1 FROM template_outcomes to2
          WHERE to2.component_id = tc.component_id
          AND to2.applies_to IN ('TEAM_MEMBER', 'BOTH')
        )
      ELSE -- BOTH
        EXISTS (
          SELECT 1 FROM template_outcomes to2
          WHERE to2.component_id = tc.component_id
        )
    END AS applies_to_participant,
    -- Determine if this is a Team Leader component
    EXISTS (
      SELECT 1 FROM template_outcomes to2
      WHERE to2.component_id = tc.component_id
      AND to2.applies_to = 'TEAM_LEADER'
    ) AS is_team_leader_component,
    -- Determine if this is a Team Member component
    EXISTS (
      SELECT 1 FROM template_outcomes to2
      WHERE to2.component_id = tc.component_id
      AND to2.applies_to IN ('TEAM_MEMBER', 'BOTH')
    ) AS is_team_member_component
  FROM participant_template pt
  JOIN template_components tc ON pt.template_id = tc.template_id
),
component_statuses AS (
  -- Get assessment status for each component
  SELECT
    cr.participant_id,
    cr.component_id,
    cr.is_team_leader_component,
    cr.is_team_member_component,
    ca.is_passed_quick,
    ca.assessment_id IS NOT NULL AS is_assessed
  FROM component_requirements cr
  LEFT JOIN component_assessments ca
    ON cr.participant_id = ca.participant_id
    AND cr.component_id = ca.component_id
  WHERE cr.applies_to_participant = true
),
participant_stats AS (
  -- Calculate statistics for each participant
  SELECT
    pt.participant_id,
    pt.candidate_name,
    pt.assessment_role,
    pt.course_id,
    pt.course_name,
    -- Total components
    COUNT(*) AS total_components,
    -- Assessed components
    SUM(CASE WHEN cs.is_assessed THEN 1 ELSE 0 END) AS assessed_components,
    -- Team Member component stats
    SUM(CASE WHEN cs.is_team_member_component THEN 1 ELSE 0 END) AS total_team_member_components,
    SUM(CASE WHEN cs.is_team_member_component AND cs.is_assessed THEN 1 ELSE 0 END) AS assessed_team_member_components,
    SUM(CASE WHEN cs.is_team_member_component AND cs.is_passed_quick THEN 1 ELSE 0 END) AS passed_team_member_components,
    -- Team Leader component stats
    SUM(CASE WHEN cs.is_team_leader_component THEN 1 ELSE 0 END) AS total_team_leader_components,
    SUM(CASE WHEN cs.is_team_leader_component AND cs.is_assessed THEN 1 ELSE 0 END) AS assessed_team_leader_components,
    SUM(CASE WHEN cs.is_team_leader_component AND cs.is_passed_quick THEN 1 ELSE 0 END) AS passed_team_leader_components
  FROM participant_template pt
  LEFT JOIN component_statuses cs ON pt.participant_id = cs.participant_id
  GROUP BY pt.participant_id, pt.candidate_name, pt.assessment_role, pt.course_id, pt.course_name
)
SELECT
  ps.participant_id,
  ps.candidate_name,
  ps.assessment_role,
  ps.course_id,
  ps.course_name,
  ps.total_components,
  ps.assessed_components,
  -- Completion status
  ps.assessed_components = ps.total_components AS all_components_assessed,
  ROUND(100.0 * ps.assessed_components / NULLIF(ps.total_components, 0), 1) AS completion_percentage,
  -- Team Member stats
  ps.total_team_member_components,
  ps.assessed_team_member_components,
  ps.passed_team_member_components,
  -- Team Member pass status (only if all TM components assessed)
  CASE
    WHEN ps.total_team_member_components = 0 THEN NULL
    WHEN ps.assessed_team_member_components < ps.total_team_member_components THEN NULL
    WHEN ps.passed_team_member_components = ps.total_team_member_components THEN true
    ELSE false
  END AS team_member_pass,
  -- Team Leader stats
  ps.total_team_leader_components,
  ps.assessed_team_leader_components,
  ps.passed_team_leader_components,
  -- Team Leader pass status
  -- CRITICAL: To pass as Team Leader, must pass ALL Team Leader components AND ALL Team Member components
  CASE
    WHEN ps.total_team_leader_components = 0 THEN NULL
    WHEN ps.assessed_team_leader_components < ps.total_team_leader_components THEN NULL
    WHEN ps.assessed_team_member_components < ps.total_team_member_components THEN NULL
    WHEN ps.passed_team_leader_components = ps.total_team_leader_components
         AND ps.passed_team_member_components = ps.total_team_member_components THEN true
    ELSE false
  END AS team_leader_pass,
  -- Overall pass determination (based on participant's role)
  CASE
    -- If role is TEAM_LEADER, must pass both TL and TM
    WHEN ps.assessment_role = 'TEAM_LEADER' THEN
      CASE
        WHEN ps.assessed_components < ps.total_components THEN NULL
        WHEN ps.passed_team_leader_components = ps.total_team_leader_components
             AND ps.passed_team_member_components = ps.total_team_member_components THEN 'PASS'::overall_outcome
        ELSE 'UNSUCCESSFUL_ATTEMPT'::overall_outcome
      END
    -- If role is TEAM_MEMBER, must pass TM only
    WHEN ps.assessment_role = 'TEAM_MEMBER' THEN
      CASE
        WHEN ps.assessed_components < ps.total_components THEN NULL
        WHEN ps.passed_team_member_components = ps.total_team_member_components THEN 'PASS'::overall_outcome
        ELSE 'UNSUCCESSFUL_ATTEMPT'::overall_outcome
      END
    -- If role is BOTH, can pass either TL (requires both TL+TM) or TM only
    WHEN ps.assessment_role = 'BOTH' THEN
      CASE
        WHEN ps.assessed_components < ps.total_components THEN NULL
        WHEN ps.passed_team_leader_components = ps.total_team_leader_components
             AND ps.passed_team_member_components = ps.total_team_member_components THEN 'PASS'::overall_outcome
        WHEN ps.passed_team_member_components = ps.total_team_member_components THEN 'PASS'::overall_outcome
        ELSE 'UNSUCCESSFUL_ATTEMPT'::overall_outcome
      END
    ELSE NULL
  END AS calculated_overall_outcome
FROM participant_stats ps;

-- Grant permissions
GRANT SELECT ON participant_assessment_summary TO web_anon;
GRANT SELECT ON participant_assessment_summary TO redi_worker;

-- Create helper function to get participant feedback summary
CREATE OR REPLACE FUNCTION get_participant_feedback(p_participant_id UUID)
RETURNS TABLE (
  participant_id UUID,
  candidate_name VARCHAR,
  assessment_role assessment_role,
  course_name VARCHAR,
  completion_percentage NUMERIC,
  all_components_assessed BOOLEAN,
  team_member_pass BOOLEAN,
  team_leader_pass BOOLEAN,
  calculated_overall_outcome overall_outcome,
  component_feedback JSONB,
  overall_feedback TEXT,
  engagement_score INTEGER,
  recommended_action recommended_action
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pas.participant_id,
    pas.candidate_name,
    pas.assessment_role,
    pas.course_name,
    pas.completion_percentage,
    pas.all_components_assessed,
    pas.team_member_pass,
    pas.team_leader_pass,
    pas.calculated_overall_outcome,
    -- Aggregate all component feedback
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'component_name', tc.component_name,
          'component_order', tc.component_order,
          'is_passed', ca.is_passed_quick,
          'feedback', COALESCE(ca.component_feedback, ''),
          'applies_to', (
            SELECT array_agg(DISTINCT to2.applies_to::text)
            FROM template_outcomes to2
            WHERE to2.component_id = tc.component_id
          )
        ) ORDER BY tc.component_order
      )
      FROM component_assessments ca
      JOIN template_components tc ON ca.component_id = tc.component_id
      WHERE ca.participant_id = p_participant_id
    ) AS component_feedback,
    oa.overall_feedback,
    oa.engagement_score,
    oa.recommended_action
  FROM participant_assessment_summary pas
  LEFT JOIN overall_assessments oa ON pas.participant_id = oa.participant_id
  WHERE pas.participant_id = p_participant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_participant_feedback(UUID) TO web_anon;
GRANT EXECUTE ON FUNCTION get_participant_feedback(UUID) TO redi_worker;

COMMENT ON VIEW participant_assessment_summary IS
  'Calculates assessment completion and pass/fail status for each participant.
   Team Leader pass requires passing BOTH Team Leader AND Team Member components.
   Pass/fail only shown when ALL applicable components are completed.';

COMMENT ON FUNCTION get_participant_feedback(UUID) IS
  'Returns comprehensive feedback summary for a participant including all component feedback,
   overall feedback, and calculated pass/fail status. Used for end-of-day 1:1 feedback sessions.';
