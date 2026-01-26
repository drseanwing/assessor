interface ComponentStatus {
  componentId: string
  status: 'not_started' | 'in_progress' | 'complete' | 'issues'
  scoredCount: number
  totalCount: number
  feedback: string | null
  isQuickPassed: boolean
}

interface ComponentCellProps {
  status?: ComponentStatus
}

export default function ComponentCell({ status }: ComponentCellProps) {
  if (!status) {
    return (
      <div className="w-full h-6 bg-gray-100 rounded" title="Not started">
        <div className="w-0 h-full rounded"></div>
      </div>
    )
  }
  
  const getStatusColor = () => {
    switch (status.status) {
      case 'complete':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-blue-500'
      case 'issues':
        return 'bg-orange-500'
      default:
        return 'bg-gray-300'
    }
  }
  
  const getBackgroundColor = () => {
    switch (status.status) {
      case 'complete':
        return 'bg-green-100'
      case 'in_progress':
        return 'bg-blue-100'
      case 'issues':
        return 'bg-orange-100'
      default:
        return 'bg-gray-100'
    }
  }
  
  const progressPercent = status.totalCount > 0 
    ? Math.round((status.scoredCount / status.totalCount) * 100) 
    : 0
  
  const getStatusIcon = () => {
    switch (status.status) {
      case 'complete':
        return (
          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'issues':
        return (
          <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'in_progress':
        return (
          <span className="text-xs font-medium text-blue-600">{progressPercent}%</span>
        )
      default:
        return null
    }
  }
  
  return (
    <div 
      className={`relative w-full h-6 rounded overflow-hidden ${getBackgroundColor()}`}
      title={`${status.scoredCount}/${status.totalCount} scored - ${status.status.replace('_', ' ')}`}
    >
      <div 
        className={`h-full rounded transition-all duration-300 ${getStatusColor()}`}
        style={{ width: `${progressPercent}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        {getStatusIcon()}
      </div>
      {status.isQuickPassed && (
        <div 
          className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full" 
          title="Quick Passed"
        />
      )}
    </div>
  )
}
