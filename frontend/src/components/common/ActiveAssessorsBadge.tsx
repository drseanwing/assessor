import type { PresenceInfo } from '../../types/shared'
import { useAuthStore } from '../../stores/authStore'

interface ActiveAssessorsBadgeProps {
  assessors: PresenceInfo[]
  currentParticipantId?: string
  currentComponentId?: string
}

export default function ActiveAssessorsBadge({
  assessors,
  currentParticipantId,
  currentComponentId
}: ActiveAssessorsBadgeProps) {
  const currentAssessorId = useAuthStore(state => state.assessor?.assessor_id)

  // Filter to only show assessors actively editing this participant/component
  const activeHere = assessors.filter(a => {
    if (currentParticipantId && a.participantId !== currentParticipantId) return false
    if (currentComponentId && a.componentId && a.componentId !== currentComponentId) return false
    if (a.assessorId === currentAssessorId) return false

    // Check if active in last 30 seconds
    const lastSeen = new Date(a.lastSeen)
    const now = new Date()
    const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000
    return diffSeconds < 30
  })

  if (activeHere.length === 0) return null

  // Get unique assessor names
  const uniqueNames = [...new Set(activeHere.map(a => a.assessorName))]

  return (
    <div 
      className="flex items-center space-x-1.5 px-2 py-1 bg-redi-navy/10 rounded-full text-xs text-redi-navy"
      title={`Also editing: ${uniqueNames.join(', ')}`}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
      <span>
        {uniqueNames.length === 1 
          ? uniqueNames[0]
          : `${uniqueNames.length} others`}
      </span>
    </div>
  )
}
