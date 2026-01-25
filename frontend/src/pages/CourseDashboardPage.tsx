import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useRealtime } from '../hooks/useRealtime'
import { supabase } from '../lib/supabase'
import type { 
  Course, 
  Participant, 
  TemplateComponent, 
  TemplateOutcome 
} from '../types/database'
import { ENGAGEMENT_OPTIONS } from '../types/database'

import DashboardGrid from '../components/dashboard/DashboardGrid'
import StatsBar from '../components/dashboard/StatsBar'
import FeedbackPanel from '../components/dashboard/FeedbackPanel'
import SyncIndicator from '../components/common/SyncIndicator'

interface ParticipantAssessmentData {
  participant: Participant
  componentStatuses: Record<string, ComponentStatus>
  overallFeedback: string | null
  engagementScore: number | null
}

interface ComponentStatus {
  componentId: string
  status: 'not_started' | 'in_progress' | 'complete' | 'issues'
  scoredCount: number
  totalCount: number
  feedback: string | null
  isQuickPassed: boolean
}

interface ComponentFeedback {
  participantName: string
  componentName: string
  feedback: string
  assessorName: string | null
  timestamp: string
}

export default function CourseDashboardPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { assessor } = useAuthStore()
  const navigate = useNavigate()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [components, setComponents] = useState<TemplateComponent[]>([])
  const [outcomes, setOutcomes] = useState<Record<string, TemplateOutcome[]>>({})
  const [assessmentData, setAssessmentData] = useState<ParticipantAssessmentData[]>([])
  const [allFeedback, setAllFeedback] = useState<ComponentFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false)
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'complete'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'progress'>('name')
  
  // Get participant IDs for realtime subscription
  const participantIds = useMemo(() => 
    participants.map(p => p.participant_id), 
    [participants]
  )
  
  // Realtime updates
  const { connectionStatus } = useRealtime({
    courseId,
    participantIds,
    onAssessmentChange: useCallback(() => {
      loadAssessmentData()
    }, []),
    onScoreChange: useCallback(() => {
      loadAssessmentData()
    }, [])
  })
  
  // Initial data load
  useEffect(() => {
    if (courseId) {
      loadCourseData()
    }
  }, [courseId])
  
  // Reload assessment data when participants or components change
  useEffect(() => {
    if (participants.length > 0 && components.length > 0) {
      loadAssessmentData()
    }
  }, [participants, components])
  
  const loadCourseData = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Fetch course
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
      
      // Fetch template components
      const { data: componentsData, error: componentsError } = await supabase
        .from('template_components')
        .select('*')
        .eq('template_id', courseData.template_id)
        .order('component_order', { ascending: true })
      
      if (componentsError) throw componentsError
      setComponents(componentsData || [])
      
      // Fetch outcomes for each component
      const outcomesMap: Record<string, TemplateOutcome[]> = {}
      for (const component of componentsData || []) {
        const { data: outcomesData } = await supabase
          .from('template_outcomes')
          .select('*')
          .eq('component_id', component.component_id)
          .order('outcome_order', { ascending: true })
        
        if (outcomesData) {
          outcomesMap[component.component_id] = outcomesData
        }
      }
      setOutcomes(outcomesMap)
      
    } catch (err) {
      console.error('Error loading course data:', err)
      setError('Failed to load dashboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const loadAssessmentData = async () => {
    if (participants.length === 0 || components.length === 0) return
    
    try {
      const assessmentResults: ParticipantAssessmentData[] = []
      const feedbackItems: ComponentFeedback[] = []
      
      for (const participant of participants) {
        // Fetch component assessments for this participant
        const { data: assessments } = await supabase
          .from('component_assessments')
          .select('*, assessors(name)')
          .eq('participant_id', participant.participant_id)
        
        // Fetch overall assessment
        const { data: overall } = await supabase
          .from('overall_assessments')
          .select('*')
          .eq('participant_id', participant.participant_id)
          .maybeSingle()
        
        const componentStatuses: Record<string, ComponentStatus> = {}
        
        for (const component of components) {
          const assessment = assessments?.find(a => a.component_id === component.component_id)
          const componentOutcomes = outcomes[component.component_id] || []
          
          // Count applicable outcomes for this participant's role
          const applicableOutcomes = componentOutcomes.filter(o => {
            return o.applies_to === 'BOTH' || 
                   o.applies_to === participant.assessment_role ||
                   participant.assessment_role === 'BOTH'
          })
          
          const mandatoryOutcomes = applicableOutcomes.filter(o => o.is_mandatory)
          
          let scoredCount = 0
          let hasIssues = false
          
          if (assessment) {
            // Fetch outcome scores
            const { data: scores } = await supabase
              .from('outcome_scores')
              .select('*')
              .eq('assessment_id', assessment.assessment_id)
            
            for (const outcome of mandatoryOutcomes) {
              const score = scores?.find(s => s.outcome_id === outcome.outcome_id)
              if (score?.bondy_score || score?.binary_score) {
                scoredCount++
                // Check for issues (marginal or not observed on mandatory)
                if (score.bondy_score === 'MARGINAL' || score.bondy_score === 'NOT_OBSERVED') {
                  hasIssues = true
                }
              }
            }
            
            // Collect feedback
            if (assessment.component_feedback) {
              feedbackItems.push({
                participantName: participant.candidate_name,
                componentName: component.component_name,
                feedback: assessment.component_feedback,
                assessorName: (assessment as { assessors?: { name: string } }).assessors?.name || null,
                timestamp: assessment.last_modified_at
              })
            }
          }
          
          let status: ComponentStatus['status'] = 'not_started'
          if (scoredCount > 0) {
            if (scoredCount >= mandatoryOutcomes.length) {
              status = hasIssues ? 'issues' : 'complete'
            } else {
              status = 'in_progress'
            }
          }
          
          componentStatuses[component.component_id] = {
            componentId: component.component_id,
            status,
            scoredCount,
            totalCount: mandatoryOutcomes.length,
            feedback: assessment?.component_feedback || null,
            isQuickPassed: assessment?.is_passed_quick || false
          }
        }
        
        // Add overall feedback
        if (overall?.overall_feedback) {
          feedbackItems.push({
            participantName: participant.candidate_name,
            componentName: 'Overall',
            feedback: overall.overall_feedback,
            assessorName: null,
            timestamp: overall.last_modified_at
          })
        }
        
        assessmentResults.push({
          participant,
          componentStatuses,
          overallFeedback: overall?.overall_feedback || null,
          engagementScore: overall?.engagement_score || null
        })
      }
      
      setAssessmentData(assessmentResults)
      setAllFeedback(feedbackItems.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ))
      
    } catch (err) {
      console.error('Error loading assessment data:', err)
    }
  }
  
  const handleParticipantClick = (participantId: string) => {
    navigate(`/course/${courseId}/participant/${participantId}/assess`)
  }
  
  const handleBack = () => {
    navigate('/courses')
  }
  
  // Calculate stats
  const stats = useMemo(() => {
    const totalParticipants = assessmentData.length
    const totalComponents = components.length
    
    let completedAssessments = 0
    const totalAssessments = totalParticipants * totalComponents
    let participantsComplete = 0
    let participantsWithIssues = 0
    
    for (const data of assessmentData) {
      let participantComplete = true
      let hasIssues = false
      
      for (const component of components) {
        const status = data.componentStatuses[component.component_id]
        if (status?.status === 'complete' || status?.status === 'issues') {
          completedAssessments++
        }
        if (status?.status !== 'complete' && status?.status !== 'issues') {
          participantComplete = false
        }
        if (status?.status === 'issues') {
          hasIssues = true
        }
      }
      
      if (participantComplete) {
        participantsComplete++
      }
      if (hasIssues) {
        participantsWithIssues++
      }
    }
    
    return {
      totalParticipants,
      totalComponents,
      completedAssessments,
      totalAssessments,
      participantsComplete,
      participantsWithIssues,
      progressPercent: totalAssessments > 0 
        ? Math.round((completedAssessments / totalAssessments) * 100) 
        : 0,
      passRate: participantsComplete > 0 
        ? Math.round(((participantsComplete - participantsWithIssues) / participantsComplete) * 100) 
        : 0
    }
  }, [assessmentData, components])
  
  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...assessmentData]
    
    // Apply filter
    if (filter === 'complete') {
      result = result.filter(d => {
        return components.every(c => {
          const status = d.componentStatuses[c.component_id]
          return status?.status === 'complete' || status?.status === 'issues'
        })
      })
    } else if (filter === 'incomplete') {
      result = result.filter(d => {
        return components.some(c => {
          const status = d.componentStatuses[c.component_id]
          return status?.status !== 'complete' && status?.status !== 'issues'
        })
      })
    }
    
    // Apply sort
    if (sortBy === 'name') {
      result.sort((a, b) => a.participant.candidate_name.localeCompare(b.participant.candidate_name))
    } else if (sortBy === 'progress') {
      result.sort((a, b) => {
        const aComplete = components.filter(c => {
          const s = a.componentStatuses[c.component_id]
          return s?.status === 'complete' || s?.status === 'issues'
        }).length
        const bComplete = components.filter(c => {
          const s = b.componentStatuses[c.component_id]
          return s?.status === 'complete' || s?.status === 'issues'
        }).length
        return bComplete - aComplete
      })
    }
    
    return result
  }, [assessmentData, filter, sortBy, components])
  
  const getEngagementEmoji = (score: number | null) => {
    if (!score) return null
    const option = ENGAGEMENT_OPTIONS.find(o => o.value === score)
    return option?.emoji || null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm print:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
                aria-label="Go back"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {course?.course_name}
                </h1>
                <p className="text-sm text-gray-600">
                  {course?.course_date} • {course?.course_coordinator}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 print:hidden">
              <SyncIndicator status={connectionStatus} />
              <span className="text-sm text-gray-600">{assessor?.name}</span>
              <button
                onClick={() => window.print()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Print dashboard"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Stats Bar */}
      <StatsBar stats={stats} />
      
      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Participants</option>
              <option value="incomplete">Incomplete</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          
          {/* Sort */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="progress">Progress</option>
            </select>
          </div>
          
          {/* Feedback Panel Toggle */}
          <button
            onClick={() => setShowFeedbackPanel(!showFeedbackPanel)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showFeedbackPanel ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span>Feedback ({allFeedback.length})</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className={`grid gap-6 ${showFeedbackPanel ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Dashboard Grid */}
          <div className={showFeedbackPanel ? 'lg:col-span-2' : ''}>
            <DashboardGrid
              data={filteredData}
              components={components}
              onParticipantClick={handleParticipantClick}
              getEngagementEmoji={getEngagementEmoji}
            />
          </div>
          
          {/* Feedback Panel */}
          {showFeedbackPanel && (
            <div className="lg:col-span-1">
              <FeedbackPanel feedback={allFeedback} />
            </div>
          )}
        </div>
      </main>
      
      {/* Print Styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}
