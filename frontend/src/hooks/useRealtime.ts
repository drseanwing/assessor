import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

interface UseRealtimeOptions {
  participantIds?: string[]
  courseId?: string
  onAssessmentChange?: (payload: RealtimePayload) => void
  onScoreChange?: (payload: RealtimePayload) => void
  onPresenceChange?: (state: PresenceState) => void
}

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, unknown>
  old: Record<string, unknown>
}

interface PresenceState {
  [key: string]: PresenceInfo[]
}

interface PresenceInfo {
  assessorId: string
  assessorName: string
  participantId: string
  componentId: string | null
  lastSeen: string
}

interface UseRealtimeReturn {
  connectionStatus: ConnectionStatus
  activeAssessors: PresenceInfo[]
  trackPresence: (participantId: string, componentId: string | null) => void
  isOtherAssessorEditing: (participantId: string, componentId?: string) => boolean
}

// Helper function to get assessor info from localStorage (outside component)
function getAssessorInfoFromStorage(): { assessor_id: string; name: string } | null {
  try {
    const stored = localStorage.getItem('redi-auth-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.state?.assessor
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

export function useRealtime({
  participantIds = [],
  courseId,
  onAssessmentChange,
  onScoreChange,
  onPresenceChange
}: UseRealtimeOptions = {}): UseRealtimeReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [activeAssessors, setActiveAssessors] = useState<PresenceInfo[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const presenceRef = useRef<{ participantId: string; componentId: string | null }>({
    participantId: '',
    componentId: null
  })
  
  // Memoize participantIds to create a stable dependency
  const participantIdsKey = useMemo(() => participantIds.join(','), [participantIds])

  // Set up realtime channel
  useEffect(() => {
    if (!courseId) return

    const channelName = `course-${courseId}-assessments`
    
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: getAssessorInfoFromStorage()?.assessor_id || 'anonymous',
        },
      },
    })

    // Handle connection status
    channel.on('system', { event: 'connected' }, () => {
      setConnectionStatus('connected')
    })

    channel.on('system', { event: 'disconnected' }, () => {
      setConnectionStatus('disconnected')
    })

    // Subscribe to component_assessments changes
    if (participantIds.length > 0) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'component_assessments',
          filter: `participant_id=in.(${participantIds.join(',')})`
        },
        (payload) => {
          if (onAssessmentChange) {
            onAssessmentChange({
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new as Record<string, unknown>,
              old: payload.old as Record<string, unknown>
            })
          }
        }
      )

      // Subscribe to outcome_scores changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'outcome_scores'
        },
        (payload) => {
          if (onScoreChange) {
            onScoreChange({
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new as Record<string, unknown>,
              old: payload.old as Record<string, unknown>
            })
          }
        }
      )
    }

    // Handle presence sync
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as PresenceState
      const assessors: PresenceInfo[] = []
      
      for (const [, presences] of Object.entries(state)) {
        for (const presence of presences) {
          assessors.push(presence as unknown as PresenceInfo)
        }
      }
      
      setActiveAssessors(assessors)
      if (onPresenceChange) {
        onPresenceChange(state)
      }
    })

    // Presence join/leave events are handled by the sync callback above
    channel.on('presence', { event: 'join' }, () => {})
    channel.on('presence', { event: 'leave' }, () => {})

    // Subscribe and track status - use queueMicrotask to avoid sync setState in effect
    queueMicrotask(() => setConnectionStatus('connecting'))
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected')
        
        // Track initial presence
        const assessor = getAssessorInfoFromStorage()
        if (assessor) {
          await channel.track({
            assessorId: assessor.assessor_id,
            assessorName: assessor.name,
            participantId: presenceRef.current.participantId,
            componentId: presenceRef.current.componentId,
            lastSeen: new Date().toISOString()
          })
        }
      } else if (status === 'CHANNEL_ERROR') {
        setConnectionStatus('reconnecting')
      } else if (status === 'CLOSED') {
        setConnectionStatus('disconnected')
      }
    })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- participantIdsKey is a memoized version of participantIds
  }, [courseId, participantIdsKey, onAssessmentChange, onScoreChange, onPresenceChange])

  // Function to update presence tracking
  const trackPresence = useCallback(async (participantId: string, componentId: string | null) => {
    presenceRef.current = { participantId, componentId }
    
    if (channelRef.current) {
      const assessor = getAssessorInfoFromStorage()
      if (assessor) {
        await channelRef.current.track({
          assessorId: assessor.assessor_id,
          assessorName: assessor.name,
          participantId,
          componentId,
          lastSeen: new Date().toISOString()
        })
      }
    }
  }, [])

  // Check if another assessor is currently editing
  const isOtherAssessorEditing = useCallback((participantId: string, componentId?: string): boolean => {
    const assessor = getAssessorInfoFromStorage()
    const currentAssessorId = assessor?.assessor_id
    
    return activeAssessors.some(a => {
      if (a.assessorId === currentAssessorId) return false
      if (a.participantId !== participantId) return false
      if (componentId && a.componentId !== componentId) return false
      
      // Check if last seen is within last 30 seconds (active)
      const lastSeen = new Date(a.lastSeen)
      const now = new Date()
      const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000
      return diffSeconds < 30
    })
  }, [activeAssessors])

  return {
    connectionStatus,
    activeAssessors,
    trackPresence,
    isOtherAssessorEditing
  }
}
