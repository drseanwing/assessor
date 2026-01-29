import { useState } from 'react'
import type { Participant, TemplateComponent } from '../../types/database'
import ComponentCell from './ComponentCell'

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

interface DashboardGridProps {
  data: ParticipantAssessmentData[]
  components: TemplateComponent[]
  onParticipantClick: (participantId: string) => void
  getEngagementEmoji: (score: number | null) => string | null
}

export default function DashboardGrid({ 
  data, 
  components, 
  onParticipantClick,
  getEngagementEmoji
}: DashboardGridProps) {
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null)
  
  const getOverallStatus = (statuses: Record<string, ComponentStatus>): 'not_started' | 'in_progress' | 'complete' | 'issues' => {
    const componentIds = Object.keys(statuses)
    if (componentIds.length === 0) return 'not_started'
    
    let hasNotStarted = false
    let hasInProgress = false
    let hasIssues = false
    let allComplete = true
    
    for (const id of componentIds) {
      const status = statuses[id].status
      if (status === 'not_started') {
        hasNotStarted = true
        allComplete = false
      } else if (status === 'in_progress') {
        hasInProgress = true
        allComplete = false
      } else if (status === 'issues') {
        hasIssues = true
      } else if (status === 'complete') {
        // Complete, continue
      }
    }
    
    if (hasIssues && allComplete) return 'issues'
    if (allComplete) return 'complete'
    if (hasInProgress || (hasNotStarted && !allComplete)) return 'in_progress'
    return 'not_started'
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'issues':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'in_progress':
        return (
          <svg className="w-5 h-5 text-redi-teal animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      default:
        return (
          <span className="w-5 h-5 block rounded-full border-2 border-gray-300"></span>
        )
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'TEAM_LEADER':
        return <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-redi-navy/10 text-redi-navy">TL</span>
      case 'TEAM_MEMBER':
        return <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-redi-teal/10 text-redi-teal">TM</span>
      case 'BOTH':
        return <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-redi-sky/10 text-redi-sky">Both</span>
      default:
        return null
    }
  }

  const abbreviateComponentName = (name: string): string => {
    if (name.includes('Airway')) return 'Airway'
    if (name.includes('Electrical')) return 'Elec Tx'
    if (name.includes('CPR')) return 'CPR/AED'
    if (name.includes('Simulation')) return 'Int Sim'
    return name.substring(0, 10)
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-redi-navy mb-2">No participants found</h3>
        <p className="text-gray-600">No participants match the current filter criteria.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden print:shadow-none print:border print:border-gray-300">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Participant
              </th>
              {components.map((component) => (
                <th 
                  key={component.component_id} 
                  scope="col" 
                  className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]"
                >
                  <span className="hidden lg:inline">{component.component_name}</span>
                  <span className="lg:hidden">{abbreviateComponentName(component.component_name)}</span>
                </th>
              ))}
              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                😊
              </th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => {
              const overallStatus = getOverallStatus(item.componentStatuses)
              const isExpanded = expandedParticipant === item.participant.participant_id
              
              return (
                <>
                  <tr 
                    key={item.participant.participant_id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onParticipantClick(item.participant.participant_id)}
                  >
                    {/* Participant Info */}
                    <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedParticipant(isExpanded ? null : item.participant.participant_id)
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors print:hidden"
                        >
                          <svg 
                            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {item.participant.candidate_name}
                            </span>
                            {getRoleBadge(item.participant.assessment_role)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.participant.payroll_number} • {item.participant.designation}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Component Cells */}
                    {components.map((component) => (
                      <td key={component.component_id} className="px-3 py-3 text-center">
                        <ComponentCell 
                          status={item.componentStatuses[component.component_id]}
                        />
                      </td>
                    ))}
                    
                    {/* Engagement */}
                    <td className="px-3 py-3 text-center">
                      <span className="text-xl">
                        {getEngagementEmoji(item.engagementScore) || '—'}
                      </span>
                    </td>
                    
                    {/* Overall Status */}
                    <td className="px-3 py-3 text-center">
                      {getStatusIcon(overallStatus)}
                    </td>
                  </tr>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <tr className="bg-gray-50 print:hidden">
                      <td colSpan={components.length + 3} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Component Details */}
                          {components.map((component) => {
                            const status = item.componentStatuses[component.component_id]
                            if (!status) return null
                            
                            return (
                              <div key={component.component_id} className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-900">{component.component_name}</span>
                                  <span className="text-sm text-gray-500">
                                    {status.scoredCount}/{status.totalCount} scored
                                  </span>
                                </div>
                                {status.feedback && (
                                  <p className="text-sm text-gray-600 italic">"{status.feedback}"</p>
                                )}
                                {status.isQuickPassed && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                                    Quick Passed
                                  </span>
                                )}
                              </div>
                            )
                          })}
                          
                          {/* Overall Feedback */}
                          {item.overallFeedback && (
                            <div className="bg-white p-3 rounded-lg border border-gray-200 md:col-span-2">
                              <span className="font-medium text-gray-900">Overall Feedback</span>
                              <p className="text-sm text-gray-600 mt-1 italic">"{item.overallFeedback}"</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 print:border-gray-300">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-green-500"></span> Complete
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-redi-teal"></span> In Progress
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-gray-300"></span> Not Started
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-orange-500"></span> Issues
          </span>
        </div>
      </div>
    </div>
  )
}
