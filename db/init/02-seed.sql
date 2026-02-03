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
-- ASSESSORS
-- ============================================================================

-- All PINs: 1234
-- Hash: bcrypt(1234, 10 rounds)

INSERT INTO assessors (assessor_id, name, email, pin_hash, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000011', 'Darren McMillan', 'darren.mcmillan@health.qld.gov.au',
   '$2b$10$//oZAICfK3ZoVKVbFzYjUO7NGi0sr/CNGagzxLZ1k5xo7/DygClWO', TRUE),
  ('00000000-0000-0000-0000-000000000012', 'Hannah Gossage', 'hannah.gossage@health.qld.gov.au',
   '$2b$10$//oZAICfK3ZoVKVbFzYjUO7NGi0sr/CNGagzxLZ1k5xo7/DygClWO', TRUE),
  ('00000000-0000-0000-0000-000000000013', 'Sean Wing', 'sean.wing@health.qld.gov.au',
   '$2b$10$//oZAICfK3ZoVKVbFzYjUO7NGi0sr/CNGagzxLZ1k5xo7/DygClWO', TRUE)
ON CONFLICT (assessor_id) DO NOTHING;

-- ============================================================================
-- COURSES - 21 days starting 2026-02-04
-- ============================================================================

INSERT INTO courses (course_id, template_id, course_name, course_date, course_coordinator, redi_event_id)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'REdI Course - 4 Feb 2026',  '2026-02-04', 'Darren McMillan', NULL),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'REdI Course - 5 Feb 2026',  '2026-02-05', 'Darren McMillan', NULL),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'REdI Course - 6 Feb 2026',  '2026-02-06', 'Hannah Gossage', NULL),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'REdI Course - 7 Feb 2026',  '2026-02-07', 'Hannah Gossage', NULL),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'REdI Course - 8 Feb 2026',  '2026-02-08', 'Sean Wing', NULL),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'REdI Course - 9 Feb 2026',  '2026-02-09', 'Sean Wing', NULL),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'REdI Course - 10 Feb 2026', '2026-02-10', 'Darren McMillan', NULL),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'REdI Course - 11 Feb 2026', '2026-02-11', 'Darren McMillan', NULL),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'REdI Course - 12 Feb 2026', '2026-02-12', 'Hannah Gossage', NULL),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001', 'REdI Course - 13 Feb 2026', '2026-02-13', 'Hannah Gossage', NULL),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000001', 'REdI Course - 14 Feb 2026', '2026-02-14', 'Sean Wing', NULL),
  ('10000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000001', 'REdI Course - 15 Feb 2026', '2026-02-15', 'Sean Wing', NULL),
  ('10000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000001', 'REdI Course - 16 Feb 2026', '2026-02-16', 'Darren McMillan', NULL),
  ('10000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000001', 'REdI Course - 17 Feb 2026', '2026-02-17', 'Darren McMillan', NULL),
  ('10000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000001', 'REdI Course - 18 Feb 2026', '2026-02-18', 'Hannah Gossage', NULL),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'REdI Course - 19 Feb 2026', '2026-02-19', 'Hannah Gossage', NULL),
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'REdI Course - 20 Feb 2026', '2026-02-20', 'Sean Wing', NULL),
  ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'REdI Course - 21 Feb 2026', '2026-02-21', 'Sean Wing', NULL),
  ('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'REdI Course - 22 Feb 2026', '2026-02-22', 'Darren McMillan', NULL),
  ('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'REdI Course - 23 Feb 2026', '2026-02-23', 'Darren McMillan', NULL),
  ('10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'REdI Course - 24 Feb 2026', '2026-02-24', 'Hannah Gossage', NULL)
ON CONFLICT (course_id) DO NOTHING;

-- ============================================================================
-- PARTICIPANTS - 5 per course
--   2 Doctors (BOTH = team leader + team member assessment)
--   3 Nurses  (TEAM_MEMBER only)
-- ============================================================================

-- Participant name pools
-- Doctors: Dr. Anika Patel, Dr. James Whitfield, Dr. Priya Sharma, Dr. Tom Henderson,
--          Dr. Lucy Chen, Dr. Mark O'Brien, Dr. Fatima Al-Rashid, Dr. Ben Cooper,
--          Dr. Rachel Kim, Dr. David Nguyen
-- Nurses:  RN Sarah Brooks, RN Michael Tran, RN Emily Watson, RN Daniel Park,
--          RN Chloe Adams, RN Ryan Mitchell, RN Jasmine Huang, RN Connor O'Neill,
--          RN Olivia Scott, RN Liam Foster, RN Megan Clarke, RN Sam Perera,
--          RN Kate Sullivan, RN Josh Murray, RN Zara Khan

-- Course 1: 4 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0001-000000000001', '10000000-0000-0000-0000-000000000001', 'Dr. Anika Patel',    'P100001', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0001-000000000002', '10000000-0000-0000-0000-000000000001', 'Dr. James Whitfield', 'P100002', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0001-000000000003', '10000000-0000-0000-0000-000000000001', 'RN Sarah Brooks',     'P100003', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0001-000000000004', '10000000-0000-0000-0000-000000000001', 'RN Michael Tran',     'P100004', 'Registered Nurse',   'Coronary Care Unit',     'TEAM_MEMBER'),
  ('20000000-0000-0000-0001-000000000005', '10000000-0000-0000-0000-000000000001', 'RN Emily Watson',     'P100005', 'Clinical Nurse',     'Medical Ward',           'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 2: 5 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0002-000000000001', '10000000-0000-0000-0000-000000000002', 'Dr. Priya Sharma',    'P100006', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0002-000000000002', '10000000-0000-0000-0000-000000000002', 'Dr. Tom Henderson',   'P100007', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0002-000000000003', '10000000-0000-0000-0000-000000000002', 'RN Daniel Park',      'P100008', 'Registered Nurse',   'Surgical Ward',          'TEAM_MEMBER'),
  ('20000000-0000-0000-0002-000000000004', '10000000-0000-0000-0000-000000000002', 'RN Chloe Adams',      'P100009', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0002-000000000005', '10000000-0000-0000-0000-000000000002', 'RN Ryan Mitchell',    'P100010', 'Clinical Nurse',     'Coronary Care Unit',     'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 3: 6 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0003-000000000001', '10000000-0000-0000-0000-000000000003', 'Dr. Lucy Chen',       'P100011', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0003-000000000002', '10000000-0000-0000-0000-000000000003', 'Dr. Mark O''Brien',   'P100012', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0003-000000000003', '10000000-0000-0000-0000-000000000003', 'RN Jasmine Huang',    'P100013', 'Registered Nurse',   'Medical Ward',           'TEAM_MEMBER'),
  ('20000000-0000-0000-0003-000000000004', '10000000-0000-0000-0000-000000000003', 'RN Connor O''Neill',  'P100014', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0003-000000000005', '10000000-0000-0000-0000-000000000003', 'RN Olivia Scott',     'P100015', 'Clinical Nurse',     'Surgical Ward',          'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 4: 7 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0004-000000000001', '10000000-0000-0000-0000-000000000004', 'Dr. Fatima Al-Rashid', 'P100016', 'Medical Officer',   'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0004-000000000002', '10000000-0000-0000-0000-000000000004', 'Dr. Ben Cooper',      'P100017', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0004-000000000003', '10000000-0000-0000-0000-000000000004', 'RN Liam Foster',      'P100018', 'Registered Nurse',   'Coronary Care Unit',     'TEAM_MEMBER'),
  ('20000000-0000-0000-0004-000000000004', '10000000-0000-0000-0000-000000000004', 'RN Megan Clarke',     'P100019', 'Registered Nurse',   'Medical Ward',           'TEAM_MEMBER'),
  ('20000000-0000-0000-0004-000000000005', '10000000-0000-0000-0000-000000000004', 'RN Sam Perera',       'P100020', 'Clinical Nurse',     'Emergency Department',   'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 5: 8 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0005-000000000001', '10000000-0000-0000-0000-000000000005', 'Dr. Rachel Kim',      'P100021', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0005-000000000002', '10000000-0000-0000-0000-000000000005', 'Dr. David Nguyen',    'P100022', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0005-000000000003', '10000000-0000-0000-0000-000000000005', 'RN Kate Sullivan',    'P100023', 'Registered Nurse',   'Surgical Ward',          'TEAM_MEMBER'),
  ('20000000-0000-0000-0005-000000000004', '10000000-0000-0000-0000-000000000005', 'RN Josh Murray',      'P100024', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0005-000000000005', '10000000-0000-0000-0000-000000000005', 'RN Zara Khan',        'P100025', 'Clinical Nurse',     'Medical Ward',           'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 6: 9 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0006-000000000001', '10000000-0000-0000-0000-000000000006', 'Dr. Anika Patel',     'P100026', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0006-000000000002', '10000000-0000-0000-0000-000000000006', 'Dr. Tom Henderson',   'P100027', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0006-000000000003', '10000000-0000-0000-0000-000000000006', 'RN Sarah Brooks',     'P100028', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0006-000000000004', '10000000-0000-0000-0000-000000000006', 'RN Chloe Adams',      'P100029', 'Registered Nurse',   'Coronary Care Unit',     'TEAM_MEMBER'),
  ('20000000-0000-0000-0006-000000000005', '10000000-0000-0000-0000-000000000006', 'RN Jasmine Huang',    'P100030', 'Clinical Nurse',     'Surgical Ward',          'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 7: 10 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0007-000000000001', '10000000-0000-0000-0000-000000000007', 'Dr. James Whitfield', 'P100031', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0007-000000000002', '10000000-0000-0000-0000-000000000007', 'Dr. Lucy Chen',       'P100032', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0007-000000000003', '10000000-0000-0000-0000-000000000007', 'RN Michael Tran',     'P100033', 'Registered Nurse',   'Medical Ward',           'TEAM_MEMBER'),
  ('20000000-0000-0000-0007-000000000004', '10000000-0000-0000-0000-000000000007', 'RN Connor O''Neill',  'P100034', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0007-000000000005', '10000000-0000-0000-0000-000000000007', 'RN Liam Foster',      'P100035', 'Clinical Nurse',     'Coronary Care Unit',     'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 8: 11 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0008-000000000001', '10000000-0000-0000-0000-000000000008', 'Dr. Priya Sharma',    'P100036', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0008-000000000002', '10000000-0000-0000-0000-000000000008', 'Dr. Ben Cooper',      'P100037', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0008-000000000003', '10000000-0000-0000-0000-000000000008', 'RN Emily Watson',     'P100038', 'Registered Nurse',   'Surgical Ward',          'TEAM_MEMBER'),
  ('20000000-0000-0000-0008-000000000004', '10000000-0000-0000-0000-000000000008', 'RN Olivia Scott',     'P100039', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0008-000000000005', '10000000-0000-0000-0000-000000000008', 'RN Megan Clarke',     'P100040', 'Clinical Nurse',     'Medical Ward',           'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 9: 12 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0009-000000000001', '10000000-0000-0000-0000-000000000009', 'Dr. Mark O''Brien',   'P100041', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0009-000000000002', '10000000-0000-0000-0000-000000000009', 'Dr. Fatima Al-Rashid', 'P100042', 'Medical Officer',   'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0009-000000000003', '10000000-0000-0000-0000-000000000009', 'RN Daniel Park',      'P100043', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0009-000000000004', '10000000-0000-0000-0000-000000000009', 'RN Ryan Mitchell',    'P100044', 'Registered Nurse',   'Coronary Care Unit',     'TEAM_MEMBER'),
  ('20000000-0000-0000-0009-000000000005', '10000000-0000-0000-0000-000000000009', 'RN Sam Perera',       'P100045', 'Clinical Nurse',     'Surgical Ward',          'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 10: 13 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-000a-000000000001', '10000000-0000-0000-0000-00000000000a', 'Dr. Rachel Kim',      'P100046', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-000a-000000000002', '10000000-0000-0000-0000-00000000000a', 'Dr. David Nguyen',    'P100047', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-000a-000000000003', '10000000-0000-0000-0000-00000000000a', 'RN Kate Sullivan',    'P100048', 'Registered Nurse',   'Medical Ward',           'TEAM_MEMBER'),
  ('20000000-0000-0000-000a-000000000004', '10000000-0000-0000-0000-00000000000a', 'RN Josh Murray',      'P100049', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-000a-000000000005', '10000000-0000-0000-0000-00000000000a', 'RN Zara Khan',        'P100050', 'Clinical Nurse',     'Coronary Care Unit',     'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 11: 14 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-000b-000000000001', '10000000-0000-0000-0000-00000000000b', 'Dr. Anika Patel',     'P100051', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-000b-000000000002', '10000000-0000-0000-0000-00000000000b', 'Dr. James Whitfield', 'P100052', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-000b-000000000003', '10000000-0000-0000-0000-00000000000b', 'RN Sarah Brooks',     'P100053', 'Registered Nurse',   'Surgical Ward',          'TEAM_MEMBER'),
  ('20000000-0000-0000-000b-000000000004', '10000000-0000-0000-0000-00000000000b', 'RN Michael Tran',     'P100054', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-000b-000000000005', '10000000-0000-0000-0000-00000000000b', 'RN Emily Watson',     'P100055', 'Clinical Nurse',     'Medical Ward',           'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 12: 15 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-000c-000000000001', '10000000-0000-0000-0000-00000000000c', 'Dr. Priya Sharma',    'P100056', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-000c-000000000002', '10000000-0000-0000-0000-00000000000c', 'Dr. Tom Henderson',   'P100057', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-000c-000000000003', '10000000-0000-0000-0000-00000000000c', 'RN Daniel Park',      'P100058', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-000c-000000000004', '10000000-0000-0000-0000-00000000000c', 'RN Chloe Adams',      'P100059', 'Registered Nurse',   'Coronary Care Unit',     'TEAM_MEMBER'),
  ('20000000-0000-0000-000c-000000000005', '10000000-0000-0000-0000-00000000000c', 'RN Jasmine Huang',    'P100060', 'Clinical Nurse',     'Medical Ward',           'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 13: 16 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-000d-000000000001', '10000000-0000-0000-0000-00000000000d', 'Dr. Lucy Chen',       'P100061', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-000d-000000000002', '10000000-0000-0000-0000-00000000000d', 'Dr. Mark O''Brien',   'P100062', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-000d-000000000003', '10000000-0000-0000-0000-00000000000d', 'RN Connor O''Neill',  'P100063', 'Registered Nurse',   'Surgical Ward',          'TEAM_MEMBER'),
  ('20000000-0000-0000-000d-000000000004', '10000000-0000-0000-0000-00000000000d', 'RN Olivia Scott',     'P100064', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-000d-000000000005', '10000000-0000-0000-0000-00000000000d', 'RN Ryan Mitchell',    'P100065', 'Clinical Nurse',     'Coronary Care Unit',     'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 14: 17 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-000e-000000000001', '10000000-0000-0000-0000-00000000000e', 'Dr. Fatima Al-Rashid', 'P100066', 'Medical Officer',   'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-000e-000000000002', '10000000-0000-0000-0000-00000000000e', 'Dr. Ben Cooper',      'P100067', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-000e-000000000003', '10000000-0000-0000-0000-00000000000e', 'RN Liam Foster',      'P100068', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-000e-000000000004', '10000000-0000-0000-0000-00000000000e', 'RN Megan Clarke',     'P100069', 'Registered Nurse',   'Medical Ward',           'TEAM_MEMBER'),
  ('20000000-0000-0000-000e-000000000005', '10000000-0000-0000-0000-00000000000e', 'RN Sam Perera',       'P100070', 'Clinical Nurse',     'Surgical Ward',          'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 15: 18 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-000f-000000000001', '10000000-0000-0000-0000-00000000000f', 'Dr. Rachel Kim',      'P100071', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-000f-000000000002', '10000000-0000-0000-0000-00000000000f', 'Dr. David Nguyen',    'P100072', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-000f-000000000003', '10000000-0000-0000-0000-00000000000f', 'RN Kate Sullivan',    'P100073', 'Registered Nurse',   'Coronary Care Unit',     'TEAM_MEMBER'),
  ('20000000-0000-0000-000f-000000000004', '10000000-0000-0000-0000-00000000000f', 'RN Josh Murray',      'P100074', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-000f-000000000005', '10000000-0000-0000-0000-00000000000f', 'RN Zara Khan',        'P100075', 'Clinical Nurse',     'Medical Ward',           'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 16: 19 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0010-000000000001', '10000000-0000-0000-0000-000000000010', 'Dr. Anika Patel',     'P100076', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0010-000000000002', '10000000-0000-0000-0000-000000000010', 'Dr. James Whitfield', 'P100077', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0010-000000000003', '10000000-0000-0000-0000-000000000010', 'RN Sarah Brooks',     'P100078', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0010-000000000004', '10000000-0000-0000-0000-000000000010', 'RN Michael Tran',     'P100079', 'Registered Nurse',   'Medical Ward',           'TEAM_MEMBER'),
  ('20000000-0000-0000-0010-000000000005', '10000000-0000-0000-0000-000000000010', 'RN Emily Watson',     'P100080', 'Clinical Nurse',     'Surgical Ward',          'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 17: 20 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0011-000000000001', '10000000-0000-0000-0000-000000000011', 'Dr. Priya Sharma',    'P100081', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0011-000000000002', '10000000-0000-0000-0000-000000000011', 'Dr. Tom Henderson',   'P100082', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0011-000000000003', '10000000-0000-0000-0000-000000000011', 'RN Daniel Park',      'P100083', 'Registered Nurse',   'Coronary Care Unit',     'TEAM_MEMBER'),
  ('20000000-0000-0000-0011-000000000004', '10000000-0000-0000-0000-000000000011', 'RN Chloe Adams',      'P100084', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0011-000000000005', '10000000-0000-0000-0000-000000000011', 'RN Jasmine Huang',    'P100085', 'Clinical Nurse',     'Medical Ward',           'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 18: 21 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0012-000000000001', '10000000-0000-0000-0000-000000000012', 'Dr. Lucy Chen',       'P100086', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0012-000000000002', '10000000-0000-0000-0000-000000000012', 'Dr. Mark O''Brien',   'P100087', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0012-000000000003', '10000000-0000-0000-0000-000000000012', 'RN Connor O''Neill',  'P100088', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0012-000000000004', '10000000-0000-0000-0000-000000000012', 'RN Olivia Scott',     'P100089', 'Registered Nurse',   'Surgical Ward',          'TEAM_MEMBER'),
  ('20000000-0000-0000-0012-000000000005', '10000000-0000-0000-0000-000000000012', 'RN Liam Foster',      'P100090', 'Clinical Nurse',     'Coronary Care Unit',     'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 19: 22 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0013-000000000001', '10000000-0000-0000-0000-000000000013', 'Dr. Fatima Al-Rashid', 'P100091', 'Medical Officer',   'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0013-000000000002', '10000000-0000-0000-0000-000000000013', 'Dr. Ben Cooper',      'P100092', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0013-000000000003', '10000000-0000-0000-0000-000000000013', 'RN Megan Clarke',     'P100093', 'Registered Nurse',   'Medical Ward',           'TEAM_MEMBER'),
  ('20000000-0000-0000-0013-000000000004', '10000000-0000-0000-0000-000000000013', 'RN Sam Perera',       'P100094', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0013-000000000005', '10000000-0000-0000-0000-000000000013', 'RN Ryan Mitchell',    'P100095', 'Clinical Nurse',     'Coronary Care Unit',     'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 20: 23 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0014-000000000001', '10000000-0000-0000-0000-000000000014', 'Dr. Rachel Kim',      'P100096', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0014-000000000002', '10000000-0000-0000-0000-000000000014', 'Dr. David Nguyen',    'P100097', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0014-000000000003', '10000000-0000-0000-0000-000000000014', 'RN Kate Sullivan',    'P100098', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0014-000000000004', '10000000-0000-0000-0000-000000000014', 'RN Josh Murray',      'P100099', 'Registered Nurse',   'Surgical Ward',          'TEAM_MEMBER'),
  ('20000000-0000-0000-0014-000000000005', '10000000-0000-0000-0000-000000000014', 'RN Zara Khan',        'P100100', 'Clinical Nurse',     'Medical Ward',           'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;

-- Course 21: 24 Feb 2026
INSERT INTO participants (participant_id, course_id, candidate_name, payroll_number, designation, work_area, assessment_role)
VALUES
  ('20000000-0000-0000-0015-000000000001', '10000000-0000-0000-0000-000000000015', 'Dr. Anika Patel',     'P100101', 'Medical Officer',    'Emergency Department',   'BOTH'),
  ('20000000-0000-0000-0015-000000000002', '10000000-0000-0000-0000-000000000015', 'Dr. Priya Sharma',    'P100102', 'Medical Officer',    'Intensive Care Unit',    'BOTH'),
  ('20000000-0000-0000-0015-000000000003', '10000000-0000-0000-0000-000000000015', 'RN Sarah Brooks',     'P100103', 'Registered Nurse',   'Coronary Care Unit',     'TEAM_MEMBER'),
  ('20000000-0000-0000-0015-000000000004', '10000000-0000-0000-0000-000000000015', 'RN Daniel Park',      'P100104', 'Registered Nurse',   'Emergency Department',   'TEAM_MEMBER'),
  ('20000000-0000-0000-0015-000000000005', '10000000-0000-0000-0000-000000000015', 'RN Chloe Adams',      'P100105', 'Clinical Nurse',     'Medical Ward',           'TEAM_MEMBER')
ON CONFLICT (participant_id) DO NOTHING;
