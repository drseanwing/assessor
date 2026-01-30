-- REdI Assessment System - Seed Data
-- REdI Multidisciplinary Resuscitation Course Template
--
-- Adapted from Supabase seed.sql:
--   - Replaced sharepoint_ref with redi_event_id

-- ============================================================================
-- COURSE TEMPLATE
-- ============================================================================

INSERT INTO course_templates (template_id, template_name, course_type, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'REdI Multidisciplinary Resuscitation',
  'FULL_COURSE',
  'REdI (Resuscitation Education Initiative) multidisciplinary course covering airway management, electrical therapies, CPR, and integrated simulation scenarios.'
)
ON CONFLICT (template_id) DO NOTHING;

-- ============================================================================
-- COMPONENT 1: Airway Management and Mask Ventilation
-- ============================================================================

INSERT INTO template_components (component_id, template_id, component_name, component_order)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'Airway Management and Mask Ventilation',
  1
)
ON CONFLICT (component_id) DO NOTHING;

-- Component 1 Outcomes
INSERT INTO template_outcomes (outcome_id, component_id, outcome_text, outcome_order, outcome_type, is_mandatory, applies_to)
VALUES
  ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000101',
   'Safely and systematically assesses the patient using a structure (such as DRSABCDE)',
   1, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000101',
   'Performs manual airway manoeuvres with consideration to spinal injury',
   2, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000001003', '00000000-0000-0000-0000-000000000101',
   'Uses suction and patient positioning to clear airway obstruction',
   3, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000001004', '00000000-0000-0000-0000-000000000101',
   'Selects and inserts appropriate oropharyngeal and nasopharyngeal airways',
   4, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000001005', '00000000-0000-0000-0000-000000000101',
   'Effectively ventilates patient using one-handed and two-handed seal with Bag Mask',
   5, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000001006', '00000000-0000-0000-0000-000000000101',
   'Selects and inserts iGel supraglottic airway',
   6, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER')
ON CONFLICT (outcome_id) DO NOTHING;

-- ============================================================================
-- COMPONENT 2: Electrical Therapies for Arrhythmias
-- ============================================================================

INSERT INTO template_components (component_id, template_id, component_name, component_order)
VALUES (
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000001',
  'Electrical Therapies for Arrhythmias',
  2
)
ON CONFLICT (component_id) DO NOTHING;

-- Component 2 Outcomes
INSERT INTO template_outcomes (outcome_id, component_id, outcome_text, outcome_order, outcome_type, is_mandatory, applies_to)
VALUES
  ('00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000000102',
   'Safely and systematically assesses the patient using a structure (such as DRSABCDE)',
   1, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000000102',
   'Identifies clinical features of poor perfusion or haemodynamic instability',
   2, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000002003', '00000000-0000-0000-0000-000000000102',
   'Selects, prepares and performs appropriate therapy for peri-arrest bradyarrhythmia',
   3, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000002004', '00000000-0000-0000-0000-000000000102',
   'Selects, prepares and performs appropriate therapy for peri-arrest tachyarrhythmia',
   4, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER')
ON CONFLICT (outcome_id) DO NOTHING;

-- ============================================================================
-- COMPONENT 3: Quality CPR and COACHED Defibrillation
-- ============================================================================

INSERT INTO template_components (component_id, template_id, component_name, component_order)
VALUES (
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000001',
  'Quality CPR and COACHED Defibrillation',
  3
)
ON CONFLICT (component_id) DO NOTHING;

-- Component 3 Outcomes
INSERT INTO template_outcomes (outcome_id, component_id, outcome_text, outcome_order, outcome_type, is_mandatory, applies_to)
VALUES
  ('00000000-0000-0000-0000-000000003001', '00000000-0000-0000-0000-000000000103',
   'Safely and systematically assesses the patient using a structure (such as DRSABCDE)',
   1, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000003002', '00000000-0000-0000-0000-000000000103',
   'Demonstrates effective chest compressions',
   2, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000003003', '00000000-0000-0000-0000-000000000103',
   'Demonstrates appropriate placement of adhesive defibrillation pads',
   3, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000003004', '00000000-0000-0000-0000-000000000103',
   'Prepares and performs ''charge and check'' using COACHED (including disarm/defib on Lifepak)',
   4, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000003005', '00000000-0000-0000-0000-000000000103',
   'Promptly and confidently recognises shockable and non-shockable cardiac rhythms',
   5, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000003006', '00000000-0000-0000-0000-000000000103',
   'Maintains situational awareness and ensures safe defibrillator operation at all times',
   6, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER')
ON CONFLICT (outcome_id) DO NOTHING;

-- ============================================================================
-- COMPONENT 4: Integrated Simulation - Summative Assessment
-- ============================================================================

INSERT INTO template_components (component_id, template_id, component_name, component_order)
VALUES (
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000001',
  'Integrated Simulation - Summative Assessment',
  4
)
ON CONFLICT (component_id) DO NOTHING;

-- Component 4 Outcomes - Team Member
INSERT INTO template_outcomes (outcome_id, component_id, outcome_text, outcome_order, outcome_type, is_mandatory, applies_to)
VALUES
  ('00000000-0000-0000-0000-000000004001', '00000000-0000-0000-0000-000000000104',
   'Patient assessment (DRSABCDE or equivalent)',
   1, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000004002', '00000000-0000-0000-0000-000000000104',
   'Airway and breathing management',
   2, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000004003', '00000000-0000-0000-0000-000000000104',
   'Circulation (chest compressions, defibrillation, pacing, cardioversion)',
   3, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000004004', '00000000-0000-0000-0000-000000000104',
   'Rhythm recognition and interpretation',
   4, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000004005', '00000000-0000-0000-0000-000000000104',
   'Medications (preparation, administration, documentation)',
   5, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000004006', '00000000-0000-0000-0000-000000000104',
   'Identification and management of reversible causes',
   6, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000004007', '00000000-0000-0000-0000-000000000104',
   'Post-ROSC care',
   7, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER'),
  ('00000000-0000-0000-0000-000000004008', '00000000-0000-0000-0000-000000000104',
   'Communication and teamwork',
   8, 'BONDY_SCALE', TRUE, 'TEAM_MEMBER')
ON CONFLICT (outcome_id) DO NOTHING;

-- Component 4 Outcomes - Team Leader
INSERT INTO template_outcomes (outcome_id, component_id, outcome_text, outcome_order, outcome_type, is_mandatory, applies_to)
VALUES
  ('00000000-0000-0000-0000-000000004101', '00000000-0000-0000-0000-000000000104',
   'Leadership and role allocation',
   9, 'BONDY_SCALE', TRUE, 'TEAM_LEADER'),
  ('00000000-0000-0000-0000-000000004102', '00000000-0000-0000-0000-000000000104',
   'Situational awareness and oversight',
   10, 'BONDY_SCALE', TRUE, 'TEAM_LEADER'),
  ('00000000-0000-0000-0000-000000004103', '00000000-0000-0000-0000-000000000104',
   'Prioritisation and decision-making',
   11, 'BONDY_SCALE', TRUE, 'TEAM_LEADER'),
  ('00000000-0000-0000-0000-000000004104', '00000000-0000-0000-0000-000000000104',
   'Consideration of reversible causes',
   12, 'BONDY_SCALE', TRUE, 'TEAM_LEADER'),
  ('00000000-0000-0000-0000-000000004105', '00000000-0000-0000-0000-000000000104',
   'Medication management and oversight',
   13, 'BONDY_SCALE', TRUE, 'TEAM_LEADER')
ON CONFLICT (outcome_id) DO NOTHING;

-- ============================================================================
-- SAMPLE ASSESSORS (for development/testing)
-- ============================================================================

-- Development seed PINs: all assessors use PIN "1234"
-- These are valid bcrypt hashes (cost 10). Production must use unique PINs.

INSERT INTO assessors (assessor_id, name, email, pin_hash, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000011', 'Dr. Sarah Chen', 'sarah.chen@health.qld.gov.au',
   '$2a$10$rDkOlz0AKFXII4Hm1TdOC.4WFBQ/dHfMwPBz5RJ8J7o6MZl1XOi6', TRUE),
  ('00000000-0000-0000-0000-000000000012', 'Dr. Michael O''Connor', 'michael.oconnor@health.qld.gov.au',
   '$2a$10$rDkOlz0AKFXII4Hm1TdOC.4WFBQ/dHfMwPBz5RJ8J7o6MZl1XOi6', TRUE),
  ('00000000-0000-0000-0000-000000000013', 'Nurse Emma Wilson', 'emma.wilson@health.qld.gov.au',
   '$2a$10$rDkOlz0AKFXII4Hm1TdOC.4WFBQ/dHfMwPBz5RJ8J7o6MZl1XOi6', TRUE)
ON CONFLICT (assessor_id) DO NOTHING;

-- ============================================================================
-- SAMPLE COURSE (for development/testing)
-- ============================================================================

-- NOTE: redi_event_id replaces the old sharepoint_ref column
INSERT INTO courses (course_id, template_id, course_name, course_date, course_coordinator, redi_event_id)
VALUES (
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000001',
  'REdI Course - January 2026',
  '2026-01-25',
  'Dr. Sarah Chen',
  NULL
)
ON CONFLICT (course_id) DO NOTHING;

-- Sample participants (redi_participant_id is NULL for dev seed data)
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role, redi_participant_id)
VALUES
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000021',
   'Alex Thompson', 'P123456', 'Registered Nurse', 'Emergency Department', 'BOTH', NULL),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000021',
   'Jordan Lee', 'P234567', 'Clinical Nurse', 'Intensive Care Unit', 'TEAM_MEMBER', NULL),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000021',
   'Casey Martinez', 'P345678', 'Medical Officer', 'Emergency Department', 'BOTH', NULL)
ON CONFLICT (participant_id) DO NOTHING;
