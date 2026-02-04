import type { ConnectionStatus } from '../../hooks/useRealtime'

interface SyncIndicatorProps {
  status: ConnectionStatus
}

export default function SyncIndicator({ status }: SyncIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'connected':
        return (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-green-600 text-xs font-medium">Live</span>
          </>
        )
      case 'connecting':
        return (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
            <span className="text-yellow-600 text-xs font-medium">Connecting...</span>
          </>
        )
      case 'reconnecting':
        return (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span className="text-orange-600 text-xs font-medium">Reconnecting...</span>
          </>
        )
      case 'disconnected':
        return (
          <>
            <span className="relative flex h-2 w-2">
              <span className="inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-red-600 text-xs font-medium">Offline</span>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex items-center space-x-1.5" title={`Connection status: ${status}`} role="status" aria-live="polite">
      {getStatusDisplay()}
    </div>
  )
}
