import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import type { Participant, Course, TemplateComponent, TemplateOutcome } from '../types/database'
import { ENGAGEMENT_OPTIONS } from '../types/database'
import { getRoleBadgeColor, formatRole } from '../lib/formatting'

interface ComponentStatusInfo {
  componentId: string
  componentName: string
  status: 'not_started' | 'in_progress' | 'complete' | 'issues'
}

export default function ParticipantListPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { assessor } = useAuthStore()
  const navigate = useNavigate()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [engagementScores, setEngagementScores] = useState<Record<string, number>>({})
  const [componentNames, setComponentNames] = useState<Array<{ id: string; name: string }>>([])
  const [participantStatuses, setParticipantStatuses] = useState<Record<string, ComponentStatusInfo[]>>({})

  const loadCourseData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('course_id', courseId)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('course_id', courseId)
        .order('candidate_name', { ascending: true })

      if (participantsError) throw participantsError
      setParticipants(participantsData || [])
      setFilteredParticipants(participantsData || [])

      // Fetch engagement scores and component statuses for all participants
      const participantIds = (participantsData || []).map(p => p.participant_id)
      if (participantIds.length > 0) {
        // Fetch components, outcomes, assessments, scores, and overall in parallel
        const [overallRes, componentsRes] = await Promise.all([
          supabase.from('overall_assessments').select('participant_id, engagement_score').in('participant_id', participantIds),
          supabase.from('template_components').select('*').eq('template_id', courseData.template_id).order('component_order', { ascending: true }),
        ])

        // Set engagement scores
        if (overallRes.data) {
          const scores: Record<string, number> = {}
          for (const row of overallRes.data) {
            if (row.engagement_score != null) {
              scores[row.participant_id] = row.engagement_score
            }
          }
          setEngagementScores(scores)
        }

        const components = (componentsRes.data || []) as TemplateComponent[]
        setComponentNames(components.map(c => ({ id: c.component_id, name: c.component_name })))

        if (components.length > 0) {
          const componentIds = components.map(c => c.component_id)

          // Fetch outcomes and assessments in parallel
          const [outcomesRes, assessmentsRes] = await Promise.all([
            supabase.from('template_outcomes').select('*').in('component_id', componentIds),
            supabase.from('component_assessments').select('*').in('participant_id', participantIds),
          ])

          const allOutcomes = (outcomesRes.data || []) as TemplateOutcome[]
          const allAssessments = assessmentsRes.data || []

          // Fetch scores for all assessments
          const assessmentIds = allAssessments.map(a => a.assessment_id)
          const allScores = assessmentIds.length > 0
            ? (await supabase.from('outcome_scores').select('*').in('assessment_id', assessmentIds)).data || []
            : []

          // Compute statuses per participant
          const statuses: Record<string, ComponentStatusInfo[]> = {}
          for (const p of participantsData || []) {
            statuses[p.participant_id] = components.map(component => {
              const componentOutcomes = allOutcomes.filter(o => o.component_id === component.component_id)
              const applicableOutcomes = componentOutcomes.filter(o =>
                o.applies_to === 'BOTH' || o.applies_to === p.assessment_role || p.assessment_role === 'BOTH'
              )
              const mandatoryOutcomes = applicableOutcomes.filter(o => o.is_mandatory)

              const assessment = allAssessments.find(a => a.participant_id === p.participant_id && a.component_id === component.component_id)
              const scores = assessment ? allScores.filter(s => s.assessment_id === assessment.assessment_id) : []

              let scoredCount = 0
              let hasIssues = false
              for (const outcome of mandatoryOutcomes) {
                const score = scores.find(s => s.outcome_id === outcome.outcome_id)
                if (score?.bondy_score || score?.binary_score) {
                  scoredCount++
                  if (score.bondy_score === 'MARGINAL' || score.bondy_score === 'NOT_OBSERVED') {
                    hasIssues = true
                  }
                }
              }

              let status: ComponentStatusInfo['status'] = 'not_started'
              if (scoredCount > 0) {
                if (scoredCount >= mandatoryOutcomes.length) {
                  status = hasIssues ? 'issues' : 'complete'
                } else {
                  status = 'in_progress'
                }
              }

              return { componentId: component.component_id, componentName: component.component_name, status }
            })
          }
          setParticipantStatuses(statuses)
        }
      }
    } catch (err) {
      console.error('Error loading course data:', err)
      setError('Failed to load participants. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (courseId) {
      loadCourseData()
    }
  }, [courseId, loadCourseData])

  useEffect(() => {
    // Filter participants based on search term
    if (searchTerm.trim() === '') {
      setFilteredParticipants(participants)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = participants.filter(p =>
        p.candidate_name.toLowerCase().includes(term) ||
        p.payroll_number?.toLowerCase().includes(term) ||
        p.designation?.toLowerCase().includes(term) ||
        p.work_area?.toLowerCase().includes(term)
      )
      setFilteredParticipants(filtered)
    }
  }, [searchTerm, participants])

  const handleParticipantClick = (participantId: string) => {
    navigate(`/course/${courseId}/participant/${participantId}/assess`)
  }

  const handleBack = () => {
    navigate('/courses')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-redi-coral">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-redi-navy">
                  {course?.course_name || 'Course Participants'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Assessor: {assessor?.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {filteredParticipants.length} of {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, payroll, designation, or work area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-redi-teal focus:border-transparent"
            />
            <div className="absolute left-3 top-3.5">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-redi-teal"></div>
          </div>
        ) : filteredParticipants.length === 0 ? (
          /* No Participants */
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching participants' : 'No participants'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `No participants match "${searchTerm}"`
                : 'No participants enrolled in this course yet'}
            </p>
          </div>
        ) : (
          /* Participant List */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payroll
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Area
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParticipants.map((participant) => (
                    <tr
                      key={participant.participant_id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleParticipantClick(participant.participant_id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleParticipantClick(participant.participant_id) } }}
                      tabIndex={0}
                      role="button"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {participant.candidate_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {participant.payroll_number || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {participant.designation || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {participant.work_area || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(participant.assessment_role)}`}>
                          {formatRole(participant.assessment_role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5" title={
                          (participantStatuses[participant.participant_id] || []).map(s => `${s.componentName}: ${s.status.replace('_', ' ')}`).join(', ')
                        }>
                          {(participantStatuses[participant.participant_id] || []).map(s => {
                            const color = s.status === 'complete' ? 'bg-green-500'
                              : s.status === 'in_progress' ? 'bg-yellow-400'
                              : s.status === 'issues' ? 'bg-red-500'
                              : 'bg-gray-300'
                            return <span key={s.componentId} className={`w-3.5 h-3.5 rounded-full ${color} inline-block`} />
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {engagementScores[participant.participant_id] != null ? (
                          <span className="text-xl" title={ENGAGEMENT_OPTIONS.find(o => o.value === engagementScores[participant.participant_id])?.label}>
                            {ENGAGEMENT_OPTIONS.find(o => o.value === engagementScores[participant.participant_id])?.emoji}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            className="text-redi-coral hover:text-redi-coral-dark font-medium"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleParticipantClick(participant.participant_id)
                            }}
                          >
                            Assess
                          </button>
                          <button
                            className="text-redi-teal hover:text-redi-teal-dark font-medium"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/course/${courseId}/participant/${participant.participant_id}/report`)
                            }}
                          >
                            Report
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
