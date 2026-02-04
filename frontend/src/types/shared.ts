/**
 * Shared type definitions used across multiple modules
 */

/**
 * Presence information for real-time collaboration
 */
export interface PresenceInfo {
  assessorId: string
  assessorName: string
  participantId: string
  componentId: string | null
  lastSeen: string
}

/**
 * Pending change for offline sync queue
 */
export interface PendingChange {
  id: string
  type: 'assessment' | 'score' | 'overall'
  action: 'create' | 'update'
  data: Record<string, unknown>
  timestamp: number
  retryCount: number
}

/**
 * Component status for dashboard display
 */
export interface ComponentStatus {
  componentId: string
  status: 'not_started' | 'in_progress' | 'complete' | 'issues'
  scoredCount: number
  totalCount: number
  feedback: string | null
  isQuickPassed: boolean
}
