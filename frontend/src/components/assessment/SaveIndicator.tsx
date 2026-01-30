interface SaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date | null
  error?: string | null
}

export default function SaveIndicator({ status, lastSaved, error }: SaveIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return (
          <>
            <svg className="w-4 h-4 animate-spin text-redi-teal" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-redi-teal">Saving...</span>
          </>
        )
      case 'saved':
        return (
          <>
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-600">
              Saved {lastSaved && `at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </>
        )
      case 'error':
        return (
          <>
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-600" title={error || undefined}>
              {error || 'Save failed'}
            </span>
          </>
        )
      default:
        return (
          <>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span className="text-gray-500">Auto-save enabled</span>
          </>
        )
    }
  }

  return (
    <div className="flex items-center space-x-1.5 text-xs" role="status" aria-live="polite">
      {getStatusDisplay()}
    </div>
  )
}
