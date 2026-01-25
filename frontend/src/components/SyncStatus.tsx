import type { ConnectionStatus } from '../hooks/useRealtime'

interface SyncStatusProps {
  status: ConnectionStatus
}

export default function SyncStatus({ status }: SyncStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: '●',
          label: 'Connected'
        }
      case 'connecting':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: '◐',
          label: 'Connecting'
        }
      case 'disconnected':
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: '○',
          label: 'Offline'
        }
      case 'error':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: '✕',
          label: 'Error'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded ${config.bgColor}`}>
      <span className={`${config.color} font-bold text-sm`}>{config.icon}</span>
      <span className={`${config.color} text-xs font-medium`}>{config.label}</span>
    </div>
  )
}
