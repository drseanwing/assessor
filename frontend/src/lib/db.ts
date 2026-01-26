/**
 * IndexedDB Database Module for Offline Support
 * 
 * This module provides:
 * - Local storage of assessment data for offline use
 * - Queue for pending changes when offline
 * - Automatic sync when connection is restored
 */

const DB_NAME = 'redi-assessment-db'
const DB_VERSION = 1

// Store names
const STORES = {
  ASSESSMENTS: 'assessments',
  SCORES: 'scores',
  PENDING_CHANGES: 'pending_changes'
} as const

interface PendingChange {
  id: string
  type: 'assessment' | 'score' | 'overall'
  action: 'create' | 'update'
  data: Record<string, unknown>
  timestamp: number
  retryCount: number
}

let db: IDBDatabase | null = null

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('IndexedDB error:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Assessments store
      if (!database.objectStoreNames.contains(STORES.ASSESSMENTS)) {
        const assessmentStore = database.createObjectStore(STORES.ASSESSMENTS, { keyPath: 'id' })
        assessmentStore.createIndex('participantId', 'participantId', { unique: false })
        assessmentStore.createIndex('componentId', 'componentId', { unique: false })
      }

      // Scores store
      if (!database.objectStoreNames.contains(STORES.SCORES)) {
        const scoresStore = database.createObjectStore(STORES.SCORES, { keyPath: 'id' })
        scoresStore.createIndex('assessmentId', 'assessmentId', { unique: false })
        scoresStore.createIndex('outcomeId', 'outcomeId', { unique: false })
      }

      // Pending changes queue
      if (!database.objectStoreNames.contains(STORES.PENDING_CHANGES)) {
        const pendingStore = database.createObjectStore(STORES.PENDING_CHANGES, { keyPath: 'id' })
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false })
        pendingStore.createIndex('type', 'type', { unique: false })
      }
    }
  })
}

/**
 * Add a pending change to the queue (for offline sync)
 */
export async function addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
  const database = await initDB()
  
  const pendingChange: PendingChange = {
    ...change,
    id: `${change.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    retryCount: 0
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.PENDING_CHANGES, 'readwrite')
    const store = transaction.objectStore(STORES.PENDING_CHANGES)
    const request = store.add(pendingChange)

    request.onsuccess = () => resolve(pendingChange.id)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all pending changes
 */
export async function getPendingChanges(): Promise<PendingChange[]> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.PENDING_CHANGES, 'readonly')
    const store = transaction.objectStore(STORES.PENDING_CHANGES)
    const request = store.getAll()

    request.onsuccess = () => {
      const changes = request.result as PendingChange[]
      // Sort by timestamp
      changes.sort((a, b) => a.timestamp - b.timestamp)
      resolve(changes)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get count of pending changes
 */
export async function getPendingChangeCount(): Promise<number> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.PENDING_CHANGES, 'readonly')
    const store = transaction.objectStore(STORES.PENDING_CHANGES)
    const request = store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Remove a pending change after successful sync
 */
export async function removePendingChange(id: string): Promise<void> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.PENDING_CHANGES, 'readwrite')
    const store = transaction.objectStore(STORES.PENDING_CHANGES)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Update retry count for a pending change
 */
export async function incrementRetryCount(id: string): Promise<void> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.PENDING_CHANGES, 'readwrite')
    const store = transaction.objectStore(STORES.PENDING_CHANGES)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const change = getRequest.result as PendingChange
      if (change) {
        change.retryCount++
        const updateRequest = store.put(change)
        updateRequest.onsuccess = () => resolve()
        updateRequest.onerror = () => reject(updateRequest.error)
      } else {
        resolve()
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

/**
 * Cache assessment data locally
 */
export async function cacheAssessment(assessment: Record<string, unknown>): Promise<void> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.ASSESSMENTS, 'readwrite')
    const store = transaction.objectStore(STORES.ASSESSMENTS)
    const request = store.put(assessment)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get cached assessment by participant and component
 */
export async function getCachedAssessment(participantId: string, componentId: string): Promise<Record<string, unknown> | null> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.ASSESSMENTS, 'readonly')
    const store = transaction.objectStore(STORES.ASSESSMENTS)
    const index = store.index('participantId')
    const request = index.getAll(participantId)

    request.onsuccess = () => {
      const assessments = request.result
      const match = assessments.find((a: Record<string, unknown>) => a.componentId === componentId)
      resolve(match || null)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [STORES.ASSESSMENTS, STORES.SCORES, STORES.PENDING_CHANGES], 
      'readwrite'
    )

    transaction.objectStore(STORES.ASSESSMENTS).clear()
    transaction.objectStore(STORES.SCORES).clear()
    transaction.objectStore(STORES.PENDING_CHANGES).clear()

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}
