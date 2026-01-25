import { BONDY_SCALE_OPTIONS, type BondyScore } from '../../types/database'

interface BondySelectorProps {
  value: BondyScore | null
  onChange: (score: BondyScore) => void
  disabled?: boolean
}

export default function BondySelector({ value, onChange, disabled = false }: BondySelectorProps) {
  return (
    <div className="flex gap-1">
      {BONDY_SCALE_OPTIONS.map((option) => {
        const isSelected = value === option.score
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.score)}
            disabled={disabled}
            className={`
              flex-1 px-2 py-2 rounded text-sm font-semibold transition-all
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105'}
              ${
                isSelected
                  ? option.color === 'green'
                    ? 'bg-green-600 text-white'
                    : option.color === 'light-green'
                    ? 'bg-green-500 text-white'
                    : option.color === 'yellow'
                    ? 'bg-yellow-500 text-white'
                    : option.color === 'orange'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-500 text-white'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }
            `}
            title={option.description}
          >
            {option.shortLabel}
          </button>
        )
      })}
    </div>
  )
}
