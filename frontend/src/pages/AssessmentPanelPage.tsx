import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { useDebounce } from '../hooks/useDebounce'
import ComponentTabs from '../components/assessment/ComponentTabs'
import OutcomeRow from '../components/assessment/OutcomeRow'
import FeedbackInput from '../components/assessment/FeedbackInput'
import EngagementSelector from '../components/assessment/EngagementSelector'
import QuickPassButton from '../components/assessment/QuickPassButton'
import type {
  Participant,
  TemplateComponent,
  TemplateOutcome,
  ComponentAssessment,
  OutcomeScore,
  OverallAssessment,
  BondyScore,
  BinaryScore
} from '../types/database'

interface OutcomeScoreData {
  outcomeId: string
  bondyScore: BondyScore | null
  binaryScore: BinaryScore | null
}

export default function AssessmentPanelPage() {
  const { participantId } = useParams<{ participantId: string }>()
  const navigate = useNavigate()
  const { assessor } = useAuthStore()

  const [participant, setParticipant] = useState<Participant | null>(null)
  const [components, setComponents] = useState<TemplateComponent[]>([])
  const [selectedComponentId, setSelectedComponentId] = useState<string>('')
  const [outcomes, setOutcomes] = useState<TemplateOutcome[]>([])
  const [outcomeScores, setOutcomeScores] = useState<Record<string, OutcomeScoreData>>({})
  const [componentFeedback, setComponentFeedback] = useState<string>('')
  const [overallFeedback, setOverallFeedback] = useState<string>('')
  const [engagementScore, setEngagementScore] = useState<number | null>(null)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [overallAssessmentId, setOverallAssessmentId] = useState<string | null>(null)
  
  const [loading, setLoading] = useState<boolean>(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadAssessmentData()
  }, [participantId])

  useEffect(() => {
    if (selectedComponentId) {
      loadComponentOutcomes()
      loadComponentAssessment()
    }
  }, [selectedComponentId])

  const loadAssessmentData = async () => {
    if (!participantId) return

    try {
      setLoading(true)

      // Fetch participant with course and template info
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .select(`
          *,
          course:courses(
            *,
            template:course_templates(*)
          )
        `)
        .eq('participant_id', participantId)
        .single()

      if (participantError) throw participantError

      setParticipant(participantData as any)

      // Fetch template components
      const templateId = (participantData as any).course.template_id
      const { data: componentsData, error: componentsError } = await supabase
        .from('template_components')
        .select('*')
        .eq('template_id', templateId)
        .order('component_order', { ascending: true })

      if (componentsError) throw componentsError

      setComponents(componentsData as TemplateComponent[])
      
      if (componentsData.length > 0) {
        setSelectedComponentId(componentsData[0].component_id)
      }

      // Load overall assessment
      const { data: overallData } = await supabase
        .from('overall_assessments')
        .select('*')
        .eq('participant_id', participantId)
        .single()

      if (overallData) {
        const overall = overallData as OverallAssessment
        setOverallAssessmentId(overall.overall_id)
        setOverallFeedback(overall.overall_feedback || '')
        setEngagementScore(overall.engagement_score)
      }

    } catch (err: any) {
      console.error('Error loading assessment data:', err)
      setError('Failed to load assessment data')
    } finally {
      setLoading(false)
    }
  }

  const loadComponentOutcomes = async () => {
    if (!selectedComponentId) return

    try {
      const { data, error } = await supabase
        .from('template_outcomes')
        .select('*')
        .eq('component_id', selectedComponentId)
        .order('outcome_order', { ascending: true })

      if (error) throw error

      setOutcomes(data as TemplateOutcome[])
    } catch (err) {
      console.error('Error loading outcomes:', err)
    }
  }

  const loadComponentAssessment = async () => {
    if (!participantId || !selectedComponentId) return

    try {
      // Get or create component assessment
      let { data: assessmentData, error: assessmentError } = await supabase
        .from('component_assessments')
        .select('*')
        .eq('participant_id', participantId)
        .eq('component_id', selectedComponentId)
        .single()

      if (assessmentError && assessmentError.code !== 'PGRST116') {
        throw assessmentError
      }

      if (!assessmentData) {
        // Create new assessment
        const { data: newAssessment, error: createError } = await supabase
          .from('component_assessments')
          .insert({
            participant_id: participantId,
            component_id: selectedComponentId,
            last_modified_by: assessor?.assessor_id
          })
          .select()
          .single()

        if (createError) throw createError
        assessmentData = newAssessment
      }

      const assessment = assessmentData as ComponentAssessment
      setAssessmentId(assessment.assessment_id)
      setComponentFeedback(assessment.component_feedback || '')

      // Load outcome scores
      const { data: scoresData } = await supabase
        .from('outcome_scores')
        .select('*')
        .eq('assessment_id', assessment.assessment_id)

      const scoresMap: Record<string, OutcomeScoreData> = {}
      if (scoresData) {
        (scoresData as OutcomeScore[]).forEach((score) => {
          scoresMap[score.outcome_id] = {
            outcomeId: score.outcome_id,
            bondyScore: score.bondy_score,
            binaryScore: score.binary_score
          }
        })
      }
      setOutcomeScores(scoresMap)

    } catch (err) {
      console.error('Error loading component assessment:', err)
    }
  }

  const saveOutcomeScore = async (outcomeId: string, bondyScore: BondyScore | null, binaryScore: BinaryScore | null) => {
    if (!assessmentId || !assessor) return

    try {
      setSaveStatus('saving')

      const { error } = await supabase
        .from('outcome_scores')
        .upsert({
          assessment_id: assessmentId,
          outcome_id: outcomeId,
          bondy_score: bondyScore,
          binary_score: binaryScore,
          scored_by: assessor.assessor_id
        }, {
          onConflict: 'assessment_id,outcome_id'
        })

      if (error) throw error

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Error saving outcome score:', err)
      setSaveStatus('error')
    }
  }

  const saveComponentFeedback = async (feedback: string) => {
    if (!assessmentId || !assessor) return

    try {
      setSaveStatus('saving')

      const { error } = await supabase
        .from('component_assessments')
        .update({
          component_feedback: feedback,
          last_modified_by: assessor.assessor_id,
          last_modified_at: new Date().toISOString()
        })
        .eq('assessment_id', assessmentId)

      if (error) throw error

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Error saving component feedback:', err)
      setSaveStatus('error')
    }
  }

  const saveOverallAssessment = async (feedback: string, engagement: number | null) => {
    if (!participantId || !assessor) return

    try {
      setSaveStatus('saving')

      if (overallAssessmentId) {
        // Update existing
        const { error } = await supabase
          .from('overall_assessments')
          .update({
            overall_feedback: feedback,
            engagement_score: engagement,
            last_modified_by: assessor.assessor_id,
            last_modified_at: new Date().toISOString()
          })
          .eq('overall_id', overallAssessmentId)

        if (error) throw error
      } else {
        // Create new
        const { data, error } = await supabase
          .from('overall_assessments')
          .insert({
            participant_id: participantId,
            overall_feedback: feedback,
            engagement_score: engagement,
            last_modified_by: assessor.assessor_id
          })
          .select()
          .single()

        if (error) throw error
        setOverallAssessmentId((data as OverallAssessment).overall_id)
      }

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Error saving overall assessment:', err)
      setSaveStatus('error')
    }
  }

  // Debounced save handlers
  const debouncedSaveFeedback = useDebounce(saveComponentFeedback, 300)
  const debouncedSaveOverall = useDebounce(saveOverallAssessment, 300)

  const handleBondyChange = (outcomeId: string, score: BondyScore) => {
    setOutcomeScores((prev) => ({
      ...prev,
      [outcomeId]: { outcomeId, bondyScore: score, binaryScore: null }
    }))
    saveOutcomeScore(outcomeId, score, null)
  }

  const handleBinaryChange = (outcomeId: string, score: BinaryScore) => {
    setOutcomeScores((prev) => ({
      ...prev,
      [outcomeId]: { outcomeId, bondyScore: null, binaryScore: score }
    }))
    saveOutcomeScore(outcomeId, null, score)
  }

  const handleComponentFeedbackChange = (value: string) => {
    setComponentFeedback(value)
    debouncedSaveFeedback(value)
  }

  const handleOverallFeedbackChange = (value: string) => {
    setOverallFeedback(value)
    debouncedSaveOverall(value, engagementScore)
  }

  const handleEngagementChange = (value: number) => {
    setEngagementScore(value)
    debouncedSaveOverall(overallFeedback, value)
  }

  const handleQuickPass = async () => {
    if (!assessmentId) return

    // Find all mandatory outcomes for current component
    const mandatoryOutcomes = outcomes.filter((o) => o.is_mandatory && o.outcome_type === 'BONDY_SCALE')

    // Set all to Independent
    const updates = mandatoryOutcomes.map((outcome) => ({
      assessment_id: assessmentId,
      outcome_id: outcome.outcome_id,
      bondy_score: 'INDEPENDENT' as BondyScore,
      binary_score: null,
      scored_by: assessor?.assessor_id
    }))

    try {
      setSaveStatus('saving')

      const { error } = await supabase
        .from('outcome_scores')
        .upsert(updates, {
          onConflict: 'assessment_id,outcome_id'
        })

      if (error) throw error

      // Update local state
      const newScores = { ...outcomeScores }
      mandatoryOutcomes.forEach((outcome) => {
        newScores[outcome.outcome_id] = {
          outcomeId: outcome.outcome_id,
          bondyScore: 'INDEPENDENT',
          binaryScore: null
        }
      })
      setOutcomeScores(newScores)

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Error quick passing:', err)
      setSaveStatus('error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Participant not found</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="text-center flex-1">
              <h1 className="text-lg font-bold text-gray-900">
                {participant.candidate_name}
              </h1>
              <p className="text-sm text-gray-600">
                {participant.designation} {participant.payroll_number && `• ${participant.payroll_number}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <span className="text-sm text-gray-600">Saving...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-sm text-green-600">✓ Saved</span>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm text-red-600">Error</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        {/* Component Tabs */}
        <div className="bg-white">
          <ComponentTabs
            components={components}
            selectedComponentId={selectedComponentId}
            onSelectComponent={setSelectedComponentId}
          />
        </div>

        {/* Component Content */}
        <div className="bg-white mt-2 p-6">
          {/* Component Header with Quick Pass */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {components.find((c) => c.component_id === selectedComponentId)?.component_name}
            </h2>
            <QuickPassButton onQuickPass={handleQuickPass} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Outcomes */}
          <div className="space-y-0">
            {outcomes.map((outcome) => (
              <OutcomeRow
                key={outcome.outcome_id}
                outcome={outcome}
                bondyScore={outcomeScores[outcome.outcome_id]?.bondyScore || null}
                binaryScore={outcomeScores[outcome.outcome_id]?.binaryScore || null}
                onBondyChange={(score: BondyScore) => handleBondyChange(outcome.outcome_id, score)}
                onBinaryChange={(score: BinaryScore) => handleBinaryChange(outcome.outcome_id, score)}
              />
            ))}
          </div>

          {/* Component Feedback */}
          <FeedbackInput
            value={componentFeedback}
            onChange={handleComponentFeedbackChange}
            label="Component Feedback"
            placeholder="Enter feedback for this component..."
          />
        </div>

        {/* Overall Assessment Section */}
        <div className="bg-white mt-2 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Overall Assessment</h2>

          {/* Engagement Selector */}
          <EngagementSelector
            value={engagementScore}
            onChange={handleEngagementChange}
          />

          {/* Overall Feedback */}
          <FeedbackInput
            value={overallFeedback}
            onChange={handleOverallFeedbackChange}
            label="Overall Feedback"
            placeholder="Enter overall feedback for the participant..."
          />
        </div>
      </main>
    </div>
  )
}
