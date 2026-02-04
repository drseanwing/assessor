import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import type { PresenceInfo } from '../types/shared'

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

interface UseRealtimeReturn {
  connectionStatus: ConnectionStatus
  activeAssessors: PresenceInfo[]
  trackPresence: (participantId: string, componentId: string | null) => void
  isOtherAssessorEditing: (participantId: string, componentId?: string) => boolean
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
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const presenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const presenceRef = useRef<{ participantId: string; componentId: string | null }>({
    participantId: '',
    componentId: null
  })
  const reconnectAttemptsRef = useRef(0)

  // Store callbacks in refs to avoid reconnection on callback change
  const callbacksRef = useRef({ onAssessmentChange, onScoreChange, onPresenceChange })
  useEffect(() => {
    callbacksRef.current = { onAssessmentChange, onScoreChange, onPresenceChange }
  })

  // Serialize participantIds for stable comparison
  const participantIdsKey = JSON.stringify(participantIds)

  useEffect(() => {
    if (!courseId) return

    // Parse back the participantIds for use in the effect
    const currentParticipantIds = JSON.parse(participantIdsKey)

    const connect = () => {
      const token = useAuthStore.getState().token
      if (!token) {
        setConnectionStatus('disconnected')
        return
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`)

      ws.onopen = () => {
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0

        // Subscribe to course changes
        ws.send(JSON.stringify({
          type: 'subscribe',
          courseId,
          participantIds: currentParticipantIds
        }))

        // Start presence tracking
        const assessor = useAuthStore.getState().assessor
        if (assessor) {
          const sendPresence = () => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'presence',
                courseId,
                assessorId: assessor.assessor_id,
                assessorName: assessor.name,
                participantId: presenceRef.current.participantId,
                componentId: presenceRef.current.componentId
              }))
            }
          }
          sendPresence()
          presenceIntervalRef.current = setInterval(sendPresence, 15000)
        }
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)

          if (msg.type === 'change') {
            const payload: RealtimePayload = {
              eventType: msg.action as 'INSERT' | 'UPDATE' | 'DELETE',
              new: msg.record || {},
              old: msg.old_record || {}
            }

            if (msg.table === 'component_assessments') {
              callbacksRef.current.onAssessmentChange?.(payload)
            } else if (msg.table === 'outcome_scores') {
              callbacksRef.current.onScoreChange?.(payload)
            }
          } else if (msg.type === 'presence_state') {
            setActiveAssessors(msg.assessors || [])
            if (callbacksRef.current.onPresenceChange) {
              const state: PresenceState = {}
              for (const a of msg.assessors || []) {
                if (!state[a.assessorId]) state[a.assessorId] = []
                state[a.assessorId].push(a)
              }
              callbacksRef.current.onPresenceChange(state)
            }
          }
        } catch {
          // Ignore parse errors
        }
      }

      ws.onclose = (event) => {
        if (presenceIntervalRef.current) {
          clearInterval(presenceIntervalRef.current)
        }

        // Don't retry on auth failures
        if (event.code === 4001 || event.code === 4003) {
          setConnectionStatus('disconnected')
          return
        }

        // Stop reconnecting after 10 failed attempts
        if (reconnectAttemptsRef.current >= 10) {
          setConnectionStatus('disconnected')
          return
        }

        setConnectionStatus('reconnecting')

        // Exponential backoff reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++
        reconnectTimeoutRef.current = setTimeout(connect, delay)
      }

      ws.onerror = () => {
        ws.close()
      }

      wsRef.current = ws
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: reset status when dependencies change
    setConnectionStatus('connecting')
    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current)
      }
    }
  }, [courseId, participantIdsKey])

  const trackPresence = useCallback((participantId: string, componentId: string | null) => {
    presenceRef.current = { participantId, componentId }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const assessor = useAuthStore.getState().assessor
      if (assessor) {
        wsRef.current.send(JSON.stringify({
          type: 'presence',
          courseId,
          assessorId: assessor.assessor_id,
          assessorName: assessor.name,
          participantId,
          componentId
        }))
      }
    }
  }, [courseId])

  const isOtherAssessorEditing = useCallback((participantId: string, componentId?: string): boolean => {
    const currentAssessorId = useAuthStore.getState().assessor?.assessor_id

    return activeAssessors.some(a => {
      if (a.assessorId === currentAssessorId) return false
      if (a.participantId !== participantId) return false
      if (componentId && a.componentId !== componentId) return false

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
