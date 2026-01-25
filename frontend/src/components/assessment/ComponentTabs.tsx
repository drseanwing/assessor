import type { TemplateComponent } from '../../types/database'

interface ComponentTabsProps {
  components: TemplateComponent[]
  selectedComponentId: string
  onSelectComponent: (componentId: string) => void
}

export default function ComponentTabs({
  components,
  selectedComponentId,
  onSelectComponent
}: ComponentTabsProps) {
  return (
    <div className="border-b border-gray-200 overflow-x-auto">
      <div className="flex min-w-max">
        {components.map((component) => {
          const isSelected = component.component_id === selectedComponentId
          
          return (
            <button
              key={component.component_id}
              onClick={() => onSelectComponent(component.component_id)}
              className={`
                px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors
                border-b-2 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                  isSelected
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {component.component_name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
