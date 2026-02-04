import { useMemo, memo } from 'react'
import type { TemplateComponent } from '../../types/database'
import { abbreviateComponentName } from '../../lib/formatting'

interface ComponentTabsProps {
  components: TemplateComponent[]
  activeComponentId: string | null
  onSelectComponent: (componentId: string) => void
  getComponentStatus: (componentId: string) => 'not_started' | 'in_progress' | 'complete'
}

export default memo(function ComponentTabs({ 
  components, 
  activeComponentId, 
  onSelectComponent,
  getComponentStatus 
}: ComponentTabsProps) {
  const getStatusColor = (status: string, isActive: boolean) => {
    if (isActive) {
      switch (status) {
        case 'complete':
          return 'bg-green-500 text-white'
        case 'in_progress':
          return 'bg-yellow-500 text-white'
        default:
          return 'bg-redi-coral text-white'
      }
    }
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'in_progress':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const sortedComponents = useMemo(() =>
    [...components].sort((a, b) => a.component_order - b.component_order),
    [components]
  )

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex space-x-2 pb-2">
        {sortedComponents
          .map((component) => {
            const status = getComponentStatus(component.component_id)
            const isActive = activeComponentId === component.component_id
            
            return (
              <button
                key={component.component_id}
                onClick={() => onSelectComponent(component.component_id)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm
                  flex items-center space-x-2
                  transition-all duration-200
                  ${getStatusColor(status, isActive)}
                  ${isActive ? 'shadow-md' : 'hover:shadow-sm'}
                `}
              >
                {getStatusIcon(status)}
                <span className="hidden sm:inline">{component.component_name}</span>
                <span className="sm:hidden">{abbreviateComponentName(component.component_name)}</span>
              </button>
            )
          })}
      </div>
    </div>
  )
})
