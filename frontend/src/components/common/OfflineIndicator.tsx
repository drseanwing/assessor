interface OfflineIndicatorProps {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  onSync?: () => void
}

export default function OfflineIndicator({ 
  isOnline, 
  pendingCount, 
  isSyncing,
  onSync 
}: OfflineIndicatorProps) {
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null // Don't show anything when online with no pending changes
  }

  return (
    <div
      role="alert"
      className={`
        fixed bottom-4 left-4 z-50
        flex items-center gap-2
        px-4 py-2 rounded-lg shadow-lg
        ${isOnline ? 'bg-blue-600' : 'bg-orange-600'}
        text-white text-sm font-medium
        transition-all duration-300
      `}
    >
      {/* Status Icon */}
      {!isOnline ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
      ) : isSyncing ? (
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}

      {/* Status Text */}
      <span>
        {!isOnline 
          ? 'Offline - Changes saved locally' 
          : isSyncing 
          ? 'Syncing...' 
          : `${pendingCount} pending change${pendingCount !== 1 ? 's' : ''}`
        }
      </span>

      {/* Pending Count Badge */}
      {pendingCount > 0 && !isSyncing && (
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
          {pendingCount}
        </span>
      )}

      {/* Manual Sync Button */}
      {isOnline && pendingCount > 0 && !isSyncing && onSync && (
        <button
          onClick={onSync}
          className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
          title="Sync now"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    </div>
  )
}
