import { ENGAGEMENT_OPTIONS } from '../../types/database'

interface EngagementSelectorProps {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
}

export default function EngagementSelector({ value, onChange, disabled = false }: EngagementSelectorProps) {
  return (
    <div className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Overall Engagement
      </label>
      <div className="flex gap-2">
        {ENGAGEMENT_OPTIONS.map((option) => {
          const isSelected = value === option.value
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={`
                flex-1 px-4 py-4 rounded-lg text-3xl transition-all
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'}
                ${
                  isSelected
                    ? 'bg-blue-100 border-2 border-blue-600'
                    : 'bg-gray-50 border-2 border-gray-200'
                }
              `}
              title={option.label}
            >
              {option.emoji}
            </button>
          )
        })}
      </div>
      {value && (
        <p className="text-sm text-gray-600 mt-2 text-center">
          {ENGAGEMENT_OPTIONS.find(o => o.value === value)?.label}
        </p>
      )}
    </div>
  )
}
