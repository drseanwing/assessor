import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error'

interface RealtimeSubscriptionOptions {
  table: string
  filter?: string
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
}

export function useRealtimeSubscription(
  options: RealtimeSubscriptionOptions,
  enabled: boolean = true
) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) {
      setStatus('disconnected')
      return
    }

    const channelName = `${options.table}_${Date.now()}`
    
    let realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: options.table,
          filter: options.filter
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && options.onInsert) {
            options.onInsert(payload.new)
          } else if (payload.eventType === 'UPDATE' && options.onUpdate) {
            options.onUpdate(payload.new)
          } else if (payload.eventType === 'DELETE' && options.onDelete) {
            options.onDelete(payload.old)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected')
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('error')
        } else if (status === 'TIMED_OUT') {
          setStatus('error')
        } else if (status === 'CLOSED') {
          setStatus('disconnected')
        }
      })

    setChannel(realtimeChannel)

    return () => {
      realtimeChannel.unsubscribe()
      setChannel(null)
      setStatus('disconnected')
    }
  }, [
    enabled,
    options.table,
    options.filter,
    // Note: callbacks are not in dependency array to avoid re-subscriptions
  ])

  return { status, channel }
}

// Specialized hook for assessment updates
export function useAssessmentRealtime(
  participantId: string,
  onUpdate: () => void,
  enabled: boolean = true
) {
  // Subscribe to component assessments
  const componentAssessmentStatus = useRealtimeSubscription(
    {
      table: 'component_assessments',
      filter: `participant_id=eq.${participantId}`,
      onUpdate: onUpdate,
      onInsert: onUpdate
    },
    enabled
  )

  // Subscribe to outcome scores (no direct filter, will need to check in callback)
  const outcomeScoresStatus = useRealtimeSubscription(
    {
      table: 'outcome_scores',
      onUpdate: onUpdate,
      onInsert: onUpdate
    },
    enabled
  )

  // Subscribe to overall assessments
  const overallStatus = useRealtimeSubscription(
    {
      table: 'overall_assessments',
      filter: `participant_id=eq.${participantId}`,
      onUpdate: onUpdate,
      onInsert: onUpdate
    },
    enabled
  )

  // Return the worst status (error > disconnected > connecting > connected)
  const getOverallStatus = (): ConnectionStatus => {
    const statuses = [
      componentAssessmentStatus.status,
      outcomeScoresStatus.status,
      overallStatus.status
    ]

    if (statuses.includes('error')) return 'error'
    if (statuses.includes('disconnected')) return 'disconnected'
    if (statuses.includes('connecting')) return 'connecting'
    return 'connected'
  }

  return {
    status: getOverallStatus()
  }
}
