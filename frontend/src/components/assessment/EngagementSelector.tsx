import { memo } from 'react'
import { ENGAGEMENT_OPTIONS } from '../../types/database'

interface EngagementSelectorProps {
  value: number | null
  onChange: (score: number) => void
  disabled?: boolean
}

export default memo(function EngagementSelector({ value, onChange, disabled = false }: EngagementSelectorProps) {
  return (
    <div className="flex space-x-2">
      {ENGAGEMENT_OPTIONS.map((option) => {
        const isSelected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={`
              w-12 h-12 rounded-lg text-2xl
              flex items-center justify-center
              transition-all duration-150
              ${isSelected
                ? 'bg-redi-teal/20 ring-2 ring-redi-teal ring-offset-2'
                : 'bg-gray-100 hover:bg-gray-200'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={option.label}
            aria-label={option.label}
            aria-pressed={isSelected}
          >
            {option.emoji}
          </button>
        )
      })}
    </div>
  )
})
