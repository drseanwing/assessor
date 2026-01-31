import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface ComponentFeedback {
  component_name: string
  component_order: number
  is_passed: boolean
  feedback: string
  applies_to: string[]
}

interface ParticipantFeedback {
  participant_id: string
  candidate_name: string
  assessment_role: 'TEAM_LEADER' | 'TEAM_MEMBER' | 'BOTH'
  course_name: string
  completion_percentage: number
  all_components_assessed: boolean
  team_member_pass: boolean | null
  team_leader_pass: boolean | null
  calculated_overall_outcome: 'PASS' | 'UNSUCCESSFUL_ATTEMPT' | null
  component_feedback: ComponentFeedback[]
  overall_feedback: string | null
  engagement_score: number | null
  recommended_action: string | null
}

export default function ParticipantFeedbackPage() {
  const { participantId } = useParams<{ participantId: string }>()
  const navigate = useNavigate()

  const [feedback, setFeedback] = useState<ParticipantFeedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFeedback()
  }, [participantId])

  const loadFeedback = async () => {
    if (!participantId) return

    try {
      setLoading(true)
      setError('')

      // Call the database function to get comprehensive feedback
      const { data, error: rpcError } = await supabase
        .rpc('get_participant_feedback', { p_participant_id: participantId })

      if (rpcError) throw rpcError

      if (data && data.length > 0) {
        setFeedback(data[0])
      } else {
        setError('Participant feedback not found')
      }
    } catch (err) {
      console.error('Error loading feedback:', err)
      setError('Failed to load feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-redi-teal mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-700">Loading feedback...</p>
        </div>
      </div>
    )
  }

  if (error || !feedback) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-redi-navy mb-2 text-center">Error</h3>
          <p className="text-gray-700 text-center mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full px-4 py-2 bg-redi-navy text-white rounded-lg hover:bg-redi-navy-light"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const teamLeaderComponents = feedback.component_feedback?.filter(c =>
    c.applies_to.includes('TEAM_LEADER')
  ) || []

  const teamMemberComponents = feedback.component_feedback?.filter(c =>
    c.applies_to.includes('TEAM_MEMBER') || c.applies_to.includes('BOTH')
  ) || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - hide on print */}
      <header className="bg-white shadow-sm border-b-2 border-redi-coral print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-redi-navy">Assessment Feedback Report</h1>
              <p className="text-sm text-gray-700 mt-1">{feedback.course_name}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-redi-teal hover:bg-redi-teal-dark text-white rounded-lg transition-colors duration-200"
              >
                Print Report
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-200"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Print header */}
      <div className="hidden print:block bg-white px-8 py-4 border-b-4 border-redi-coral">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-redi-navy">REdI Assessment Feedback</h1>
            <p className="text-lg text-gray-700 mt-2">{feedback.course_name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Queensland Health</p>
            <p className="text-sm text-gray-600">Resuscitation Education Initiative</p>
            <p className="text-sm text-gray-600 mt-1">{new Date().toLocaleDateString('en-AU', { dateStyle: 'long' })}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:px-8">
        {/* Participant Information */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6 print:shadow-none print:border print:border-gray-300">
          <h2 className="text-xl font-semibold text-redi-navy mb-4 print:text-2xl">Participant Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Candidate Name</p>
              <p className="text-lg text-gray-900">{feedback.candidate_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Assessment Role</p>
              <p className="text-lg text-gray-900">{feedback.assessment_role.replace('_', ' ')}</p>
            </div>
            {feedback.engagement_score && (
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement Score</p>
                <p className="text-lg text-gray-900">{feedback.engagement_score} / 5</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Status</p>
              <p className="text-lg text-gray-900">
                {feedback.all_components_assessed ? (
                  <span className="text-green-600 font-medium">Complete (100%)</span>
                ) : (
                  <span className="text-amber-600 font-medium">{feedback.completion_percentage}% Complete</span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Overall Outcome */}
        {feedback.all_components_assessed && (
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6 print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
            <h2 className="text-xl font-semibold text-redi-navy mb-4 print:text-2xl">Overall Outcome</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team Member Outcome */}
              {feedback.team_member_pass !== null && (
                <div className={`p-4 rounded-lg border-2 ${
                  feedback.team_member_pass
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}>
                  <h3 className="font-semibold text-gray-900 mb-2">Team Member</h3>
                  <p className={`text-2xl font-bold ${
                    feedback.team_member_pass ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {feedback.team_member_pass ? 'PASS' : 'UNSUCCESSFUL ATTEMPT'}
                  </p>
                </div>
              )}

              {/* Team Leader Outcome */}
              {feedback.team_leader_pass !== null && (
                <div className={`p-4 rounded-lg border-2 ${
                  feedback.team_leader_pass
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}>
                  <h3 className="font-semibold text-gray-900 mb-2">Team Leader</h3>
                  <p className={`text-2xl font-bold ${
                    feedback.team_leader_pass ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {feedback.team_leader_pass ? 'PASS' : 'UNSUCCESSFUL ATTEMPT'}
                  </p>
                  <p className="text-xs text-gray-600 mt-2 italic">
                    * Requires passing both Team Leader and Team Member components
                  </p>
                </div>
              )}
            </div>

            {feedback.recommended_action && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Recommended Action:</p>
                <p className="text-lg text-blue-900 font-medium">{feedback.recommended_action.replace('_', ' ')}</p>
              </div>
            )}
          </section>
        )}

        {/* Incomplete Assessment Warning */}
        {!feedback.all_components_assessed && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 print:break-inside-avoid">
            <div className="flex">
              <svg className="h-5 w-5 text-amber-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-amber-800">
                <strong>Assessment Incomplete:</strong> Overall pass/fail determination will be available once all components are assessed.
              </p>
            </div>
          </div>
        )}

        {/* Team Leader Components */}
        {teamLeaderComponents.length > 0 && (
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6 print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
            <h2 className="text-xl font-semibold text-redi-navy mb-4 print:text-2xl">Team Leader Components</h2>
            <div className="space-y-4">
              {teamLeaderComponents.map((component) => (
                <div key={component.component_order} className="border-l-4 border-redi-teal pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900">{component.component_name}</h3>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      component.is_passed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {component.is_passed ? 'PASS' : 'NOT PASSED'}
                    </span>
                  </div>
                  {component.feedback && (
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{component.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Team Member Components */}
        {teamMemberComponents.length > 0 && (
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6 print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
            <h2 className="text-xl font-semibold text-redi-navy mb-4 print:text-2xl">Team Member Components</h2>
            <div className="space-y-4">
              {teamMemberComponents.map((component) => (
                <div key={component.component_order} className="border-l-4 border-redi-coral pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900">{component.component_name}</h3>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      component.is_passed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {component.is_passed ? 'PASS' : 'NOT PASSED'}
                    </span>
                  </div>
                  {component.feedback && (
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{component.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Overall Feedback */}
        {feedback.overall_feedback && (
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6 print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
            <h2 className="text-xl font-semibold text-redi-navy mb-4 print:text-2xl">Overall Feedback</h2>
            <div className="prose max-w-none">
              <p className="text-gray-800 whitespace-pre-wrap">{feedback.overall_feedback}</p>
            </div>
          </section>
        )}

        {/* Footer for print */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300">
          <p className="text-xs text-gray-600 text-center">
            This is an official assessment record from the REdI Assessment System.
            Queensland Health - Resuscitation Education Initiative
          </p>
        </div>
      </main>
    </div>
  )
}
