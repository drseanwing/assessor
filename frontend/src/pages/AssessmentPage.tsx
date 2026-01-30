import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAssessmentStore } from '../stores/assessmentStore'
import { useRealtime } from '../hooks/useRealtime'
import { supabase } from '../lib/supabase'
import type { Participant, TemplateComponent, TemplateOutcome, RecommendedAction } from '../types/database'

import ComponentTabs from '../components/assessment/ComponentTabs'
import OutcomeRow from '../components/assessment/OutcomeRow'
import QuickPassButton from '../components/assessment/QuickPassButton'
import FeedbackInput from '../components/assessment/FeedbackInput'
import EngagementSelector from '../components/assessment/EngagementSelector'
import SaveIndicator from '../components/assessment/SaveIndicator'
import SyncIndicator from '../components/common/SyncIndicator'
import ActiveAssessorsBadge from '../components/common/ActiveAssessorsBadge'

export default function AssessmentPage() {
  const { courseId, participantId } = useParams<{ courseId: string; participantId: string }>()
  const { assessor } = useAuthStore()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const {
    participant,
    components,
    outcomes,
    componentAssessments,
    overallAssessment,
    activeComponentId,
    saveStatus,
    lastSaved,
    saveError,
    setParticipant,
    setComponents,
    setOutcomes,
    setActiveComponent,
    loadAssessments,
    setBondyScore,
    setBinaryScore,
    applyQuickPass,
    setComponentFeedback,
    setOverallFeedback,
    setEngagementScore,
    setTeamLeaderOutcome,
    setTeamMemberOutcome,
    setRecommendedAction,
    getComponentStatus,
    reset
  } = useAssessmentStore()

  // Memoize participantIds to prevent infinite reconnects
  const participantIds = useMemo(
    () => participantId ? [participantId] : [],
    [participantId]
  )

  // Realtime hook for multi-assessor sync
  const {
    connectionStatus,
    activeAssessors,
    trackPresence
  } = useRealtime({
    courseId,
    participantIds,
    onAssessmentChange: useCallback(() => {
      // Reload assessments when changes come from other assessors
      loadAssessments()
    }, [loadAssessments]),
    onScoreChange: useCallback(() => {
      // Reload assessments when scores change from other assessors
      loadAssessments()
    }, [loadAssessments])
  })
  
  // Track presence when component changes
  useEffect(() => {
    if (participantId && activeComponentId) {
      trackPresence(participantId, activeComponentId)
    }
  }, [participantId, activeComponentId, trackPresence])
  
  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      // Fetch course to get template_id
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('course_id', courseId)
        .single()
      
      if (courseError) throw courseError
      
      // Fetch participant
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .select('*')
        .eq('participant_id', participantId)
        .single()
      
      if (participantError) throw participantError
      setParticipant(participantData as Participant)
      
      // Fetch template components for this course's template
      const { data: componentsData, error: componentsError } = await supabase
        .from('template_components')
        .select('*')
        .eq('template_id', courseData.template_id)
        .order('component_order', { ascending: true })
      
      if (componentsError) throw componentsError
      setComponents(componentsData as TemplateComponent[])
      
      // Fetch outcomes for each component
      for (const component of componentsData) {
        const { data: outcomesData, error: outcomesError } = await supabase
          .from('template_outcomes')
          .select('*')
          .eq('component_id', component.component_id)
          .order('outcome_order', { ascending: true })
        
        if (outcomesError) throw outcomesError
        setOutcomes(component.component_id, outcomesData as TemplateOutcome[])
      }
      
      // Load existing assessments
      await loadAssessments()
      
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load assessment data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [courseId, participantId, setParticipant, setComponents, setOutcomes, loadAssessments])
  
  useEffect(() => {
    if (courseId && participantId) {
      loadData()
    }

    return () => {
      // Clean up on unmount
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, participantId])
  
  const handleBack = () => {
    navigate(`/course/${courseId}/participants`)
  }
  
  const activeOutcomes = activeComponentId ? outcomes[activeComponentId] || [] : []
  const activeAssessment = activeComponentId ? componentAssessments[activeComponentId] : null
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'TEAM_LEADER':
        return 'bg-redi-navy/10 text-redi-navy'
      case 'TEAM_MEMBER':
        return 'bg-redi-teal/10 text-redi-teal'
      case 'BOTH':
        return 'bg-redi-sky/10 text-redi-sky'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center" role="status" aria-label="Loading">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-redi-teal mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-700">Loading assessment...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-center text-redi-navy mb-2">Error</h2>
          <p className="text-gray-700 text-center mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="w-full bg-redi-coral text-white py-2 px-4 rounded-lg hover:bg-redi-coral-dark"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-redi-coral sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-redi-navy truncate">
                  {participant?.candidate_name}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(participant?.assessment_role || '')}`}>
                    {formatRole(participant?.assessment_role || '')}
                  </span>
                  <span className="hidden sm:inline">{participant?.designation}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{participant?.work_area}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <SyncIndicator status={connectionStatus} />
              <ActiveAssessorsBadge 
                assessors={activeAssessors} 
                currentParticipantId={participantId}
                currentComponentId={activeComponentId || undefined}
              />
              <SaveIndicator status={saveStatus} lastSaved={lastSaved} error={saveError} />
            </div>
          </div>
        </div>
      </header>
      
      {/* Component Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-10">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <ComponentTabs
            components={components}
            activeComponentId={activeComponentId}
            onSelectComponent={setActiveComponent}
            getComponentStatus={getComponentStatus}
          />
        </div>
      </div>

      {/* Main Content */}
      <main id="main-content" className="max-w-4xl mx-auto px-4 py-4">
        {activeComponentId && (
          <>
            {/* Component Header with Quick Pass */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-redi-navy">
                {components.find(c => c.component_id === activeComponentId)?.component_name}
              </h2>
              <QuickPassButton
                onQuickPass={() => applyQuickPass(activeComponentId)}
                isQuickPassed={activeAssessment?.isQuickPassed || false}
              />
            </div>
            
            {/* Bondy Scale Legend */}
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <div className="flex flex-wrap gap-3 text-xs text-gray-700">
                <span className="flex items-center gap-1">
                  <span className="w-6 h-6 rounded bg-green-500 text-white flex items-center justify-center font-semibold">I</span>
                  Independent
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-6 h-6 rounded bg-lime-600 text-white flex items-center justify-center font-semibold">S</span>
                  Supervised
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-6 h-6 rounded bg-amber-500 text-white flex items-center justify-center font-semibold">A</span>
                  Assisted
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-6 h-6 rounded bg-orange-500 text-white flex items-center justify-center font-semibold">M</span>
                  Marginal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-6 h-6 rounded bg-gray-500 text-white flex items-center justify-center font-semibold">N</span>
                  Not Observed
                </span>
              </div>
            </div>
            
            {/* Outcomes List */}
            <div className="space-y-2 mb-6">
              {activeOutcomes
                .sort((a, b) => a.outcome_order - b.outcome_order)
                .map((outcome) => (
                  <OutcomeRow
                    key={outcome.outcome_id}
                    outcome={outcome}
                    bondyScore={activeAssessment?.scores[outcome.outcome_id]?.bondyScore || null}
                    binaryScore={activeAssessment?.scores[outcome.outcome_id]?.binaryScore || null}
                    participantRole={participant?.assessment_role || 'TEAM_MEMBER'}
                    onBondyChange={(score) => setBondyScore(activeComponentId, outcome.outcome_id, score)}
                    onBinaryChange={(score) => setBinaryScore(activeComponentId, outcome.outcome_id, score)}
                  />
                ))}
            </div>
            
            {/* Component Feedback */}
            <div className="mb-6">
              <FeedbackInput
                value={activeAssessment?.feedback || ''}
                onChange={(value) => setComponentFeedback(activeComponentId, value)}
                label="Component Feedback"
                placeholder="Enter feedback for this component..."
              />
            </div>
          </>
        )}
        
        {/* Overall Assessment Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-redi-navy mb-4">Overall Assessment</h2>
          
          {/* Engagement Score */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Engagement Level
            </label>
            <EngagementSelector
              value={overallAssessment.engagementScore}
              onChange={setEngagementScore}
            />
          </div>

          {/* Outcome Selectors */}
          {(participant?.assessment_role === 'TEAM_LEADER' || participant?.assessment_role === 'BOTH') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Leader Outcome
              </label>
              <div className="flex gap-3">
                {(['PASS', 'UNSUCCESSFUL_ATTEMPT'] as const).map((outcome) => (
                  <button
                    key={outcome}
                    type="button"
                    onClick={() => setTeamLeaderOutcome(
                      overallAssessment.teamLeaderOutcome === outcome ? null : outcome
                    )}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                      overallAssessment.teamLeaderOutcome === outcome
                        ? outcome === 'PASS'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {outcome === 'PASS' ? 'Pass' : 'Unsuccessful Attempt'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(participant?.assessment_role === 'TEAM_MEMBER' || participant?.assessment_role === 'BOTH') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Member Outcome
              </label>
              <div className="flex gap-3">
                {(['PASS', 'UNSUCCESSFUL_ATTEMPT'] as const).map((outcome) => (
                  <button
                    key={outcome}
                    type="button"
                    onClick={() => setTeamMemberOutcome(
                      overallAssessment.teamMemberOutcome === outcome ? null : outcome
                    )}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                      overallAssessment.teamMemberOutcome === outcome
                        ? outcome === 'PASS'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {outcome === 'PASS' ? 'Pass' : 'Unsuccessful Attempt'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Action - only show if any outcome is UNSUCCESSFUL_ATTEMPT */}
          {(overallAssessment.teamLeaderOutcome === 'UNSUCCESSFUL_ATTEMPT' || overallAssessment.teamMemberOutcome === 'UNSUCCESSFUL_ATTEMPT') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommended Action
              </label>
              <select
                value={overallAssessment.recommendedAction || ''}
                onChange={(e) => setRecommendedAction(
                  e.target.value ? e.target.value as RecommendedAction : null
                )}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-redi-teal focus:border-transparent"
              >
                <option value="">Select recommended action...</option>
                <option value="RESTART_LEARNING">Restart Learning</option>
                <option value="REATTEMPT_COURSE">Reattempt Course</option>
                <option value="REASSESSMENT_ONLY">Reassessment Only</option>
                <option value="REFER_EDUCATOR">Refer to Educator</option>
              </select>
            </div>
          )}

          {/* Overall Feedback */}
          <FeedbackInput
            value={overallAssessment.feedback}
            onChange={setOverallFeedback}
            label="Overall Feedback"
            placeholder="Enter overall feedback for this participant..."
          />
        </div>
      </main>
      
      {/* Bottom Navigation (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:hidden">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <SyncIndicator status={connectionStatus} />
            <span className="text-sm text-gray-600">{assessor?.name}</span>
          </div>
          <SaveIndicator status={saveStatus} lastSaved={lastSaved} error={saveError} />
        </div>
      </div>
    </div>
  )
}
