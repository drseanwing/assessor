import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { 
  initDB, 
  getPendingChanges, 
  getPendingChangeCount,
  removePendingChange,
  incrementRetryCount,
  addPendingChange
} from '../lib/db'

interface PendingChange {
  id: string
  type: 'assessment' | 'score' | 'overall'
  action: 'create' | 'update'
  data: Record<string, unknown>
  timestamp: number
  retryCount: number
}

interface UseOfflineSyncReturn {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  lastSyncTime: Date | null
  syncError: string | null
  syncPendingChanges: () => Promise<void>
  queueChange: (type: PendingChange['type'], action: PendingChange['action'], data: Record<string, unknown>) => Promise<void>
}

const MAX_RETRIES = 3

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const syncInProgress = useRef(false)

  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingChangeCount()
      setPendingCount(count)
    } catch (error) {
      console.error('Error getting pending count:', error)
    }
  }, [])

  const syncPendingChanges = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncError('Cannot sync while offline')
      return
    }

    if (syncInProgress.current) {
      return
    }

    syncInProgress.current = true
    setIsSyncing(true)
    setSyncError(null)

    try {
      const changes = await getPendingChanges()
      
      for (const change of changes) {
        if (change.retryCount >= MAX_RETRIES) {
          console.warn(`Change ${change.id} exceeded max retries, skipping`)
          continue
        }

        try {
          await processChange(change)
          await removePendingChange(change.id)
        } catch (error) {
          console.error(`Error syncing change ${change.id}:`, error)
          await incrementRetryCount(change.id)
        }
      }

      setLastSyncTime(new Date())
      await updatePendingCount()
    } catch (error) {
      console.error('Error during sync:', error)
      setSyncError('Failed to sync pending changes')
    } finally {
      setIsSyncing(false)
      syncInProgress.current = false
    }
  }, [updatePendingCount])

  // Initialize IndexedDB on mount
  useEffect(() => {
    initDB().catch(console.error)
    updatePendingCount()
  }, [updatePendingCount])

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-sync when coming back online
      syncPendingChanges()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncPendingChanges])

  const processChange = async (change: PendingChange): Promise<void> => {
    const { type, action, data } = change

    switch (type) {
      case 'assessment': {
        if (action === 'create') {
          const { error } = await supabase
            .from('component_assessments')
            .insert(data)
          if (error) throw error
        } else {
          const { assessment_id, ...updateData } = data
          const { error } = await supabase
            .from('component_assessments')
            .update(updateData)
            .eq('assessment_id', assessment_id)
          if (error) throw error
        }
        break
      }
      case 'score': {
        const { error } = await supabase
          .from('outcome_scores')
          .upsert(data, { onConflict: 'assessment_id,outcome_id' })
        if (error) throw error
        break
      }
      case 'overall': {
        if (action === 'create') {
          const { error } = await supabase
            .from('overall_assessments')
            .insert(data)
          if (error) throw error
        } else {
          const { overall_id, ...updateData } = data
          const { error } = await supabase
            .from('overall_assessments')
            .update(updateData)
            .eq('overall_id', overall_id)
          if (error) throw error
        }
        break
      }
    }
  }

  const queueChange = useCallback(async (
    type: PendingChange['type'], 
    action: PendingChange['action'], 
    data: Record<string, unknown>
  ) => {
    try {
      await addPendingChange({ type, action, data })
      await updatePendingCount()
      
      // If online, try to sync immediately
      if (navigator.onLine) {
        syncPendingChanges()
      }
    } catch (error) {
      console.error('Error queuing change:', error)
      throw error
    }
  }, [updatePendingCount, syncPendingChanges])

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    syncError,
    syncPendingChanges,
    queueChange
  }
}
