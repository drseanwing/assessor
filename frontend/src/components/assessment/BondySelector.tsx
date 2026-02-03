import { BONDY_SCALE_OPTIONS, type BondyScore } from '../../types/database'

interface BondySelectorProps {
  value: BondyScore | null
  onChange: (score: BondyScore) => void
  disabled?: boolean
}

export default function BondySelector({ value, onChange, disabled = false }: BondySelectorProps) {
  const getScoreColor = (score: BondyScore, isSelected: boolean) => {
    if (!isSelected) return 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    
    switch (score) {
      case 'INDEPENDENT':
        return 'bg-green-500 text-white'
      case 'SUPERVISED':
        return 'bg-lime-500 text-white'
      case 'ASSISTED':
        return 'bg-yellow-500 text-white'
      case 'MARGINAL':
        return 'bg-orange-500 text-white'
      case 'NOT_OBSERVED':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="flex space-x-1">
      {BONDY_SCALE_OPTIONS.map((option) => {
        const isSelected = value === option.score
        return (
          <button
            key={option.score}
            type="button"
            onClick={() => !disabled && onChange(option.score)}
            disabled={disabled}
            className={`
              w-11 h-11 rounded-lg font-semibold text-sm
              flex items-center justify-center
              transition-all duration-150
              ${getScoreColor(option.score, isSelected)}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isSelected ? 'ring-2 ring-offset-2 ring-redi-teal' : ''}
            `}
            title={`${option.label}: ${option.description}`}
            aria-label={option.label}
          >
            {option.shortLabel}
          </button>
        )
      })}
    </div>
  )
}
