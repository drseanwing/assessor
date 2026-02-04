import { memo } from 'react'
import type { TemplateOutcome, BondyScore, BinaryScore, AssessmentRole } from '../../types/database'
import BondySelector from './BondySelector'
import { getRoleBadgeColor } from '../../lib/formatting'

interface OutcomeRowProps {
  outcome: TemplateOutcome
  bondyScore: BondyScore | null
  binaryScore: BinaryScore | null
  participantRole: AssessmentRole
  onBondyChange: (score: BondyScore) => void
  onBinaryChange: (score: BinaryScore) => void
  disabled?: boolean
}

export default memo(function OutcomeRow({
  outcome,
  bondyScore,
  binaryScore,
  participantRole,
  onBondyChange,
  onBinaryChange,
  disabled = false
}: OutcomeRowProps) {
  // Check if this outcome applies to the participant's role
  const isApplicable =
    outcome.applies_to === 'BOTH' ||
    outcome.applies_to === participantRole ||
    participantRole === 'BOTH'

  const getRoleBadgeText = (role: AssessmentRole) => {
    switch (role) {
      case 'TEAM_LEADER':
        return 'TL'
      case 'TEAM_MEMBER':
        return 'TM'
      case 'BOTH':
        return 'Both'
    }
  }

  if (!isApplicable) {
    return null // Don't render outcomes that don't apply to this participant
  }

  return (
    <div 
      className={`
        py-3 px-4 rounded-lg mb-2
        ${outcome.is_mandatory ? 'bg-white border border-gray-200' : 'bg-gray-50 border border-gray-100'}
        ${disabled ? 'opacity-60' : ''}
      `}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Outcome Text with Role Badge */}
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <span 
              className={`
                flex-shrink-0 px-1.5 py-0.5 text-xs font-medium rounded
                ${getRoleBadgeColor(outcome.applies_to)}
              `}
            >
              {getRoleBadgeText(outcome.applies_to)}
            </span>
            <div className="flex-1">
              <span className={`text-sm ${outcome.is_mandatory ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                {outcome.outcome_text}
              </span>
              {outcome.is_mandatory && (
                <span className="ml-1 text-red-500 font-bold" title="Mandatory">*</span>
              )}
            </div>
          </div>
        </div>

        {/* Score Selector */}
        <div className="flex-shrink-0">
          {outcome.outcome_type === 'BONDY_SCALE' ? (
            <BondySelector
              value={bondyScore}
              onChange={onBondyChange}
              disabled={disabled}
            />
          ) : (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => !disabled && onBinaryChange('PASS')}
                disabled={disabled}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-150
                  ${binaryScore === 'PASS'
                    ? 'bg-green-500 text-white ring-2 ring-offset-2 ring-green-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
                aria-pressed={binaryScore === 'PASS'}
              >
                Pass
              </button>
              <button
                type="button"
                onClick={() => !disabled && onBinaryChange('FAIL')}
                disabled={disabled}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-150
                  ${binaryScore === 'FAIL'
                    ? 'bg-red-500 text-white ring-2 ring-offset-2 ring-red-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
                aria-pressed={binaryScore === 'FAIL'}
              >
                Fail
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
