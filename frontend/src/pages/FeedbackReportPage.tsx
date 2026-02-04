import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ENGAGEMENT_OPTIONS, BONDY_SCALE_OPTIONS } from '../types/database'
import type {
  Participant,
  TemplateComponent,
  TemplateOutcome,
  BondyScore,
} from '../types/database'
import { getRoleBadgeColor, formatRole } from '../lib/formatting'

interface ComponentReport {
  component: TemplateComponent
  outcomes: Array<{
    outcome: TemplateOutcome
    bondyScore: BondyScore | null
    binaryScore: string | null
  }>
  feedback: string | null
  isQuickPassed: boolean
  scoredCount: number
  totalCount: number
}

export default function FeedbackReportPage() {
  const { courseId, participantId } = useParams<{ courseId: string; participantId: string }>()
  const navigate = useNavigate()

  const [participant, setParticipant] = useState<Participant | null>(null)
  const [courseName, setCourseName] = useState('')
  const [componentReports, setComponentReports] = useState<ComponentReport[]>([])
  const [overallFeedback, setOverallFeedback] = useState<string | null>(null)
  const [engagementScore, setEngagementScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch course, participant, components, outcomes, assessments, scores, overall - in parallel batches
      const [courseRes, participantRes] = await Promise.all([
        supabase.from('courses').select('*').eq('course_id', courseId).single(),
        supabase.from('participants').select('*').eq('participant_id', participantId).single(),
      ])

      if (courseRes.error) throw courseRes.error
      if (participantRes.error) throw participantRes.error

      setCourseName(courseRes.data.course_name)
      setParticipant(participantRes.data as Participant)

      const templateId = courseRes.data.template_id

      // Fetch components and assessments in parallel
      const [componentsRes, assessmentsRes, overallRes] = await Promise.all([
        supabase
          .from('template_components')
          .select('*')
          .eq('template_id', templateId)
          .order('component_order', { ascending: true }),
        supabase
          .from('component_assessments')
          .select('*')
          .eq('participant_id', participantId),
        supabase
          .from('overall_assessments')
          .select('*')
          .eq('participant_id', participantId)
          .maybeSingle(),
      ])

      if (componentsRes.error) throw componentsRes.error
      if (assessmentsRes.error) throw assessmentsRes.error

      const components = componentsRes.data as TemplateComponent[]
      const assessments = assessmentsRes.data || []
      const overall = overallRes.data

      setOverallFeedback(overall?.overall_feedback || null)
      setEngagementScore(overall?.engagement_score ?? null)

      // Fetch all outcomes and scores
      const componentIds = components.map(c => c.component_id)
      const assessmentIds = assessments.map(a => a.assessment_id)

      const [outcomesRes, scoresRes] = await Promise.all([
        supabase
          .from('template_outcomes')
          .select('*')
          .in('component_id', componentIds)
          .order('outcome_order', { ascending: true }),
        assessmentIds.length > 0
          ? supabase.from('outcome_scores').select('*').in('assessment_id', assessmentIds)
          : Promise.resolve({ data: [], error: null }),
      ])

      if (outcomesRes.error) throw outcomesRes.error
      if (scoresRes.error) throw scoresRes.error

      const allOutcomes = outcomesRes.data as TemplateOutcome[]
      const allScores = scoresRes.data || []

      // Build reports per component
      const reports: ComponentReport[] = components.map(component => {
        const componentOutcomes = allOutcomes.filter(o => o.component_id === component.component_id)
        const assessment = assessments.find(a => a.component_id === component.component_id)
        const assessmentScores = assessment
          ? allScores.filter(s => s.assessment_id === assessment.assessment_id)
          : []

        const applicableOutcomes = componentOutcomes.filter(o =>
          o.applies_to === 'BOTH' ||
          o.applies_to === participantRes.data.assessment_role ||
          participantRes.data.assessment_role === 'BOTH'
        )
        const mandatoryApplicable = applicableOutcomes.filter(o => o.is_mandatory)

        const outcomeResults = applicableOutcomes.map(outcome => {
          const score = assessmentScores.find(s => s.outcome_id === outcome.outcome_id)
          return {
            outcome,
            bondyScore: (score?.bondy_score as BondyScore) || null,
            binaryScore: score?.binary_score || null,
          }
        })

        const scoredCount = mandatoryApplicable.filter(o => {
          const s = assessmentScores.find(sc => sc.outcome_id === o.outcome_id)
          return s?.bondy_score || s?.binary_score
        }).length

        return {
          component,
          outcomes: outcomeResults,
          feedback: assessment?.component_feedback || null,
          isQuickPassed: assessment?.is_passed_quick || false,
          scoredCount,
          totalCount: mandatoryApplicable.length,
        }
      })

      setComponentReports(reports)
    } catch (err) {
      console.error('Error loading report:', err)
      setError('Failed to load feedback report.')
    } finally {
      setLoading(false)
    }
  }, [courseId, participantId])

  useEffect(() => {
    if (courseId && participantId) {
      loadReport()
    }
  }, [courseId, participantId, loadReport])

  const getBondyLabel = (score: BondyScore | null) => {
    if (!score) return '-'
    return BONDY_SCALE_OPTIONS.find(o => o.score === score)?.shortLabel || score
  }

  const getBondyColor = (score: BondyScore | null) => {
    switch (score) {
      case 'INDEPENDENT': return 'bg-green-500 text-white'
      case 'SUPERVISED': return 'bg-lime-600 text-white'
      case 'ASSISTED': return 'bg-yellow-500 text-gray-900'
      case 'MARGINAL': return 'bg-orange-500 text-white'
      case 'NOT_OBSERVED': return 'bg-gray-500 text-white'
      default: return 'bg-gray-100 text-gray-400'
    }
  }

  const getEngagementEmoji = (score: number | null) => {
    if (score === null) return null
    return ENGAGEMENT_OPTIONS.find(o => o.value === score)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-redi-teal mx-auto" />
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="bg-redi-coral text-white py-2 px-4 rounded-lg hover:bg-redi-coral-dark">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const engagement = getEngagementEmoji(engagementScore)

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-redi-coral print:shadow-none">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
                aria-label="Go back"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-redi-navy">Feedback Report</h1>
                <p className="text-sm text-gray-600">{courseName}</p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
              title="Print report"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Participant Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 print:shadow-none print:border print:border-gray-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-redi-navy">{participant?.candidate_name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(participant?.assessment_role || '')}`}>
                  {formatRole(participant?.assessment_role || '')}
                </span>
                <span>{participant?.designation}</span>
                <span>{participant?.work_area}</span>
                {participant?.payroll_number && <span>#{participant.payroll_number}</span>}
              </div>
            </div>
            {engagement && (
              <div className="text-center">
                <span className="text-3xl">{engagement.emoji}</span>
                <p className="text-xs text-gray-500 mt-1">{engagement.label}</p>
              </div>
            )}
          </div>
        </div>

        {/* Component Reports */}
        <div className="space-y-6">
          {componentReports.map(report => (
            <div key={report.component.component_id} className="bg-white rounded-lg shadow print:shadow-none print:border print:border-gray-300">
              {/* Component Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-redi-navy">{report.component.component_name}</h3>
                  <p className="text-sm text-gray-500">
                    {report.scoredCount}/{report.totalCount} mandatory outcomes scored
                    {report.isQuickPassed && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">Quick Passed</span>
                    )}
                  </p>
                </div>
                <div>
                  {report.scoredCount >= report.totalCount && report.totalCount > 0 ? (
                    <span className="w-5 h-5 rounded-full bg-green-500 inline-block" title="Complete" />
                  ) : report.scoredCount > 0 ? (
                    <span className="w-5 h-5 rounded-full bg-yellow-400 inline-block" title="Incomplete" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-gray-300 inline-block" title="Not started" />
                  )}
                </div>
              </div>

              {/* Outcomes Table */}
              <div className="px-6 py-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase">
                      <th className="text-left py-2 font-medium">Outcome</th>
                      <th className="text-center py-2 font-medium w-20">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.outcomes.map(({ outcome, bondyScore, binaryScore }) => (
                      <tr key={outcome.outcome_id}>
                        <td className="py-2 pr-4">
                          <span className={outcome.is_mandatory ? 'font-medium text-gray-900' : 'text-gray-600'}>
                            {outcome.outcome_text}
                          </span>
                          {!outcome.is_mandatory && <span className="text-xs text-gray-400 ml-1">(optional)</span>}
                        </td>
                        <td className="py-2 text-center">
                          {outcome.outcome_type === 'BONDY_SCALE' ? (
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded font-semibold text-sm ${getBondyColor(bondyScore)}`}>
                              {getBondyLabel(bondyScore)}
                            </span>
                          ) : (
                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium ${
                              binaryScore === 'PASS' ? 'bg-green-100 text-green-800' :
                              binaryScore === 'FAIL' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-400'
                            }`}>
                              {binaryScore || '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Component Feedback */}
              {report.feedback && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-500 font-medium mb-1">Component Feedback</p>
                  <p className="text-sm text-gray-700 italic">"{report.feedback}"</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overall Feedback */}
        {overallFeedback && (
          <div className="mt-6 bg-white rounded-lg shadow p-6 print:shadow-none print:border print:border-gray-300">
            <h3 className="font-semibold text-redi-navy mb-2">Overall Feedback</h3>
            <p className="text-sm text-gray-700 italic">"{overallFeedback}"</p>
          </div>
        )}
      </main>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
