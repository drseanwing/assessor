// Database Types - Generated from schema

export type CourseType = 'FULL_COURSE' | 'REFRESHER' | 'ASSESSMENT_ONLY'
export type AssessmentRole = 'TEAM_LEADER' | 'TEAM_MEMBER' | 'BOTH'
export type OutcomeType = 'BONDY_SCALE' | 'BINARY'
export type BondyScore = 'INDEPENDENT' | 'SUPERVISED' | 'ASSISTED' | 'MARGINAL' | 'NOT_OBSERVED'
export type BinaryScore = 'PASS' | 'FAIL'
export type OverallOutcome = 'PASS' | 'UNSUCCESSFUL_ATTEMPT'
export type RecommendedAction = 
  | 'RESTART_LEARNING' 
  | 'REATTEMPT_COURSE' 
  | 'REASSESSMENT_ONLY' 
  | 'REFER_EDUCATOR'

export interface Assessor {
  assessor_id: string
  name: string
  email: string | null
  pin_hash: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CourseTemplate {
  template_id: string
  template_name: string
  course_type: CourseType
  description: string | null
  created_at: string
  updated_at: string
}

export interface TemplateComponent {
  component_id: string
  template_id: string
  component_name: string
  component_order: number
  created_at: string
}

export interface TemplateOutcome {
  outcome_id: string
  component_id: string
  outcome_text: string
  outcome_order: number
  outcome_type: OutcomeType
  is_mandatory: boolean
  applies_to: AssessmentRole
  created_at: string
}

export interface Course {
  course_id: string
  template_id: string
  course_name: string
  course_date: string
  course_coordinator: string | null
  redi_event_id: number | null
  created_at: string
  updated_at: string
}

export interface Participant {
  participant_id: string
  course_id: string
  candidate_name: string
  payroll_number: string | null
  designation: string | null
  work_area: string | null
  assessment_role: AssessmentRole
  engagement_rating: number | null
  redi_participant_id: number | null
  created_at: string
  updated_at: string
}

export interface ComponentAssessment {
  assessment_id: string
  participant_id: string
  component_id: string
  component_feedback: string | null
  is_passed_quick: boolean
  last_modified_by: string | null
  last_modified_at: string
  created_at: string
}

export interface OutcomeScore {
  outcome_score_id: string
  assessment_id: string
  outcome_id: string
  bondy_score: BondyScore | null
  binary_score: BinaryScore | null
  scored_by: string | null
  scored_at: string
  created_at: string
}

export interface OverallAssessment {
  overall_id: string
  participant_id: string
  overall_feedback: string | null
  engagement_score: number | null
  team_leader_outcome: OverallOutcome | null
  team_member_outcome: OverallOutcome | null
  recommended_action: RecommendedAction | null
  last_modified_by: string | null
  last_modified_at: string
  created_at: string
}

// UI Helper Types

export interface BondyScaleOption {
  value: number
  score: BondyScore
  label: string
  shortLabel: string
  color: string
  description: string
}

export const BONDY_SCALE_OPTIONS: BondyScaleOption[] = [
  {
    value: 5,
    score: 'INDEPENDENT',
    label: 'Independent',
    shortLabel: 'I',
    color: 'green',
    description: 'Safe, accurate, and proficient; no supporting cues required'
  },
  {
    value: 4,
    score: 'SUPERVISED',
    label: 'Supervised',
    shortLabel: 'S',
    color: 'light-green',
    description: 'Safe, accurate; occasional supportive cues required'
  },
  {
    value: 3,
    score: 'ASSISTED',
    label: 'Assisted',
    shortLabel: 'A',
    color: 'yellow',
    description: 'Safe but requires frequent verbal/physical directive cues'
  },
  {
    value: 2,
    score: 'MARGINAL',
    label: 'Marginal/Dependent',
    shortLabel: 'M',
    color: 'orange',
    description: 'Unsafe; continuous verbal/physical cues required'
  },
  {
    value: 1,
    score: 'NOT_OBSERVED',
    label: 'Not Observed',
    shortLabel: 'N',
    color: 'gray',
    description: 'Not demonstrated/observed during assessment'
  }
]

export interface EngagementOption {
  value: number
  emoji: string
  label: string
}

export const ENGAGEMENT_OPTIONS: EngagementOption[] = [
  { value: 5, emoji: '😁', label: 'Excellent engagement' },
  { value: 4, emoji: '🙂', label: 'Good engagement' },
  { value: 3, emoji: '😐', label: 'Adequate engagement' },
  { value: 2, emoji: '🙁', label: 'Poor engagement' },
  { value: 1, emoji: '😞', label: 'Very poor engagement' }
]
