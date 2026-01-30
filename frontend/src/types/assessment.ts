import type { Participant } from './database'

export interface ComponentStatus {
  componentId: string
  status: 'not_started' | 'in_progress' | 'complete' | 'issues'
  scoredCount: number
  totalCount: number
  feedback: string | null
  isQuickPassed: boolean
}

export interface ParticipantAssessmentData {
  participant: Participant
  componentStatuses: Record<string, ComponentStatus>
  overallFeedback: string | null
  engagementScore: number | null
}
