import type { ComponentStatus } from '../../types/shared'

interface ComponentCellProps {
  status?: ComponentStatus
}

export default function ComponentCell({ status }: ComponentCellProps) {
  if (!status || status.status === 'not_started') {
    return (
      <div className="flex items-center justify-center" title="Not started">
        <span className="w-4 h-4 rounded-full bg-gray-300 inline-block" />
      </div>
    )
  }

  const getColor = () => {
    switch (status.status) {
      case 'complete':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-yellow-400'
      case 'issues':
        return 'bg-red-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getLabel = () => {
    switch (status.status) {
      case 'complete':
        return 'Pass'
      case 'in_progress':
        return 'Incomplete'
      case 'issues':
        return 'Fail'
      default:
        return 'Not started'
    }
  }

  return (
    <div
      className="flex items-center justify-center"
      title={`${getLabel()} - ${status.scoredCount}/${status.totalCount} scored`}
    >
      <span className={`w-4 h-4 rounded-full inline-block ${getColor()}`} />
    </div>
  )
}
