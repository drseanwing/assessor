import BondySelector from './BondySelector'
import type { TemplateOutcome, BondyScore, BinaryScore } from '../../types/database'

interface OutcomeRowProps {
  outcome: TemplateOutcome
  bondyScore: BondyScore | null
  binaryScore: BinaryScore | null
  onBondyChange: (score: BondyScore) => void
  onBinaryChange: (score: BinaryScore) => void
  disabled?: boolean
}

export default function OutcomeRow({
  outcome,
  bondyScore,
  binaryScore,
  onBondyChange,
  onBinaryChange,
  disabled = false
}: OutcomeRowProps) {
  const roleLabel = 
    outcome.applies_to === 'TEAM_LEADER' ? 'TL' :
    outcome.applies_to === 'TEAM_MEMBER' ? 'TM' :
    'BOTH'

  const roleColor =
    outcome.applies_to === 'TEAM_LEADER' ? 'bg-purple-100 text-purple-800' :
    outcome.applies_to === 'TEAM_MEMBER' ? 'bg-blue-100 text-blue-800' :
    'bg-gray-100 text-gray-800'

  return (
    <div className="py-4 border-b border-gray-100 last:border-b-0">
      {/* Outcome Text */}
      <div className="mb-3 flex items-start gap-2">
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${roleColor}`}>
          {roleLabel}
        </span>
        <span className="flex-1 text-sm text-gray-900">
          {outcome.outcome_text}
          {outcome.is_mandatory && (
            <span className="ml-1 text-red-600 font-bold">*</span>
          )}
        </span>
      </div>

      {/* Selector */}
      {outcome.outcome_type === 'BONDY_SCALE' ? (
        <BondySelector
          value={bondyScore}
          onChange={onBondyChange}
          disabled={disabled}
        />
      ) : (
        /* Binary Pass/Fail Toggle */
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onBinaryChange('PASS')}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2 rounded font-semibold transition-all
              focus:outline-none focus:ring-2 focus:ring-green-500
              ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105'}
              ${
                binaryScore === 'PASS'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }
            `}
          >
            ✓ PASS
          </button>
          <button
            type="button"
            onClick={() => onBinaryChange('FAIL')}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2 rounded font-semibold transition-all
              focus:outline-none focus:ring-2 focus:ring-red-500
              ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105'}
              ${
                binaryScore === 'FAIL'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }
            `}
          >
            ✗ FAIL
          </button>
        </div>
      )}
    </div>
  )
}
