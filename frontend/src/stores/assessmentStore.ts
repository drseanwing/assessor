import { create } from 'zustand'
import type {
  Participant,
  TemplateComponent,
  TemplateOutcome,
  BondyScore,
  BinaryScore,
  OverallOutcome,
  RecommendedAction
} from '../types/database'
import { supabase } from '../lib/supabase'

// Type for local score tracking before save
interface LocalOutcomeScore {
  outcomeId: string
  bondyScore: BondyScore | null
  binaryScore: BinaryScore | null
  isDirty: boolean
}

// Type for local component assessment tracking
interface LocalComponentAssessment {
  componentId: string
  assessmentId: string | null // null if not yet created in DB
  feedback: string
  isQuickPassed: boolean
  isDirty: boolean
  scores: Record<string, LocalOutcomeScore>
}

interface AssessmentState {
  // Current context
  participant: Participant | null
  components: TemplateComponent[]
  outcomes: Record<string, TemplateOutcome[]> // componentId -> outcomes
  
  // Local state (for editing)
  componentAssessments: Record<string, LocalComponentAssessment>
  overallAssessment: {
    overallId: string | null
    feedback: string
    engagementScore: number | null
    teamLeaderOutcome: OverallOutcome | null
    teamMemberOutcome: OverallOutcome | null
    recommendedAction: RecommendedAction | null
    isDirty: boolean
  }
  
  // UI state
  activeComponentId: string | null
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved: Date | null
  saveError: string | null

  // Actions
  setParticipant: (participant: Participant) => void
  setComponents: (components: TemplateComponent[]) => void
  setOutcomes: (componentId: string, outcomes: TemplateOutcome[]) => void
  setActiveComponent: (componentId: string) => void
  
  // Load existing assessments from DB
  loadAssessments: () => Promise<void>
  
  // Score updates
  setBondyScore: (componentId: string, outcomeId: string, score: BondyScore) => void
  setBinaryScore: (componentId: string, outcomeId: string, score: BinaryScore) => void
  
  // Quick pass
  applyQuickPass: (componentId: string) => void
  
  // Feedback updates
  setComponentFeedback: (componentId: string, feedback: string) => void
  setOverallFeedback: (feedback: string) => void
  setEngagementScore: (score: number) => void
  setTeamLeaderOutcome: (outcome: OverallOutcome | null) => void
  setTeamMemberOutcome: (outcome: OverallOutcome | null) => void
  setRecommendedAction: (action: RecommendedAction | null) => void
  
  // Save to database
  saveChanges: () => Promise<void>
  cancelPendingSave: () => void

  // Utility
  getComponentStatus: (componentId: string) => 'not_started' | 'in_progress' | 'complete'
  reset: () => void
}

const initialState = {
  participant: null,
  components: [],
  outcomes: {},
  componentAssessments: {},
  overallAssessment: {
    overallId: null,
    feedback: '',
    engagementScore: null,
    teamLeaderOutcome: null,
    teamMemberOutcome: null,
    recommendedAction: null,
    isDirty: false
  },
  activeComponentId: null,
  saveStatus: 'idle' as const,
  lastSaved: null,
  saveError: null
}

// Module-level variables for saveChanges debounce (accessible by reset for cleanup)
let saveTimeoutId: ReturnType<typeof setTimeout> | null = null
let saveInProgress = false

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  ...initialState,
  
  setParticipant: (participant) => set({ participant }),
  
  setComponents: (components) => {
    set({ components })
    // Auto-select first component
    if (components.length > 0 && !get().activeComponentId) {
      set({ activeComponentId: components[0].component_id })
    }
  },
  
  setOutcomes: (componentId, outcomes) => {
    set((state) => ({
      outcomes: { ...state.outcomes, [componentId]: outcomes }
    }))
  },
  
  setActiveComponent: (componentId) => set({ activeComponentId: componentId }),
  
  loadAssessments: async () => {
    const { participant, components } = get()
    if (!participant) return

    try {
      // Load component assessments (single query)
      const { data: assessments } = await supabase
        .from('component_assessments')
        .select('*')
        .eq('participant_id', participant.participant_id)

      // Batch load ALL outcome scores in a single query
      const assessmentIds = (assessments || []).map(a => a.assessment_id)
      let allScores: Array<{ assessment_id: string; outcome_id: string; bondy_score: string | null; binary_score: string | null }> = []

      if (assessmentIds.length > 0) {
        const { data: scoresData } = await supabase
          .from('outcome_scores')
          .select('*')
          .in('assessment_id', assessmentIds)
        allScores = scoresData || []
      }

      // Build scores map: assessment_id -> scores[]
      const scoresByAssessment = new Map<string, typeof allScores>()
      for (const score of allScores) {
        const existing = scoresByAssessment.get(score.assessment_id) || []
        existing.push(score)
        scoresByAssessment.set(score.assessment_id, existing)
      }

      // Build component assessments in memory
      const componentAssessments: Record<string, LocalComponentAssessment> = {}

      for (const component of components) {
        const existingAssessment = assessments?.find(a => a.component_id === component.component_id)

        const scores: Record<string, LocalOutcomeScore> = {}

        if (existingAssessment) {
          const scoreData = scoresByAssessment.get(existingAssessment.assessment_id) || []
          for (const score of scoreData) {
            scores[score.outcome_id] = {
              outcomeId: score.outcome_id,
              bondyScore: score.bondy_score as BondyScore | null,
              binaryScore: score.binary_score as BinaryScore | null,
              isDirty: false
            }
          }
        }

        componentAssessments[component.component_id] = {
          componentId: component.component_id,
          assessmentId: existingAssessment?.assessment_id || null,
          feedback: existingAssessment?.component_feedback || '',
          isQuickPassed: existingAssessment?.is_passed_quick || false,
          isDirty: false,
          scores
        }
      }

      // Load overall assessment
      const { data: overall } = await supabase
        .from('overall_assessments')
        .select('*')
        .eq('participant_id', participant.participant_id)
        .maybeSingle()

      set({
        componentAssessments,
        overallAssessment: {
          overallId: overall?.overall_id ?? null,
          feedback: overall?.overall_feedback ?? '',
          engagementScore: overall?.engagement_score ?? null,
          teamLeaderOutcome: overall?.team_leader_outcome ?? null,
          teamMemberOutcome: overall?.team_member_outcome ?? null,
          recommendedAction: overall?.recommended_action ?? null,
          isDirty: false
        }
      })
    } catch (error) {
      console.error('Error loading assessments:', error)
      set({ saveStatus: 'error' })
    }
  },
  
  setBondyScore: (componentId, outcomeId, score) => {
    set((state) => {
      const component = state.componentAssessments[componentId] || {
        componentId,
        assessmentId: null,
        feedback: '',
        isQuickPassed: false,
        isDirty: true,
        scores: {}
      }
      
      return {
        componentAssessments: {
          ...state.componentAssessments,
          [componentId]: {
            ...component,
            isDirty: true,
            isQuickPassed: false, // Clear quick pass if manually changing
            scores: {
              ...component.scores,
              [outcomeId]: {
                outcomeId,
                bondyScore: score,
                binaryScore: null,
                isDirty: true
              }
            }
          }
        }
      }
    })
    
    // Trigger debounced save
    get().saveChanges()
  },
  
  setBinaryScore: (componentId, outcomeId, score) => {
    set((state) => {
      const component = state.componentAssessments[componentId] || {
        componentId,
        assessmentId: null,
        feedback: '',
        isQuickPassed: false,
        isDirty: true,
        scores: {}
      }
      
      return {
        componentAssessments: {
          ...state.componentAssessments,
          [componentId]: {
            ...component,
            isDirty: true,
            scores: {
              ...component.scores,
              [outcomeId]: {
                outcomeId,
                bondyScore: null,
                binaryScore: score,
                isDirty: true
              }
            }
          }
        }
      }
    })
    
    // Trigger debounced save
    get().saveChanges()
  },
  
  applyQuickPass: (componentId) => {
    const { outcomes, participant } = get()
    const componentOutcomes = outcomes[componentId] || []
    
    set((state) => {
      const component = state.componentAssessments[componentId] || {
        componentId,
        assessmentId: null,
        feedback: '',
        isQuickPassed: false,
        isDirty: true,
        scores: {}
      }
      
      // Set all mandatory outcomes applicable to participant's role to INDEPENDENT
      const newScores = { ...component.scores }
      for (const outcome of componentOutcomes) {
        // Check if outcome applies to participant's role
        const applies = 
          outcome.applies_to === 'BOTH' || 
          outcome.applies_to === participant?.assessment_role ||
          participant?.assessment_role === 'BOTH'
        
        if (outcome.is_mandatory && applies && outcome.outcome_type === 'BONDY_SCALE') {
          newScores[outcome.outcome_id] = {
            outcomeId: outcome.outcome_id,
            bondyScore: 'INDEPENDENT',
            binaryScore: null,
            isDirty: true
          }
        }
      }
      
      return {
        componentAssessments: {
          ...state.componentAssessments,
          [componentId]: {
            ...component,
            isQuickPassed: true,
            isDirty: true,
            scores: newScores
          }
        }
      }
    })
    
    // Trigger debounced save
    get().saveChanges()
  },
  
  setComponentFeedback: (componentId, feedback) => {
    set((state) => {
      const component = state.componentAssessments[componentId] || {
        componentId,
        assessmentId: null,
        feedback: '',
        isQuickPassed: false,
        isDirty: true,
        scores: {}
      }
      
      return {
        componentAssessments: {
          ...state.componentAssessments,
          [componentId]: {
            ...component,
            feedback,
            isDirty: true
          }
        }
      }
    })
    
    // Trigger debounced save
    get().saveChanges()
  },
  
  setOverallFeedback: (feedback) => {
    set((state) => ({
      overallAssessment: {
        ...state.overallAssessment,
        feedback,
        isDirty: true
      }
    }))
    
    // Trigger debounced save
    get().saveChanges()
  },
  
  setEngagementScore: (score) => {
    set((state) => ({
      overallAssessment: {
        ...state.overallAssessment,
        engagementScore: score,
        isDirty: true
      }
    }))

    // Trigger debounced save
    get().saveChanges()
  },

  setTeamLeaderOutcome: (outcome) => {
    set((state) => ({
      overallAssessment: {
        ...state.overallAssessment,
        teamLeaderOutcome: outcome,
        isDirty: true
      }
    }))
    get().saveChanges()
  },

  setTeamMemberOutcome: (outcome) => {
    set((state) => ({
      overallAssessment: {
        ...state.overallAssessment,
        teamMemberOutcome: outcome,
        isDirty: true
      }
    }))
    get().saveChanges()
  },

  setRecommendedAction: (action) => {
    set((state) => ({
      overallAssessment: {
        ...state.overallAssessment,
        recommendedAction: action,
        isDirty: true
      }
    }))
    get().saveChanges()
  },
  
  saveChanges: async () => {
    // Helper to get current assessor from localStorage
    const getCurrentAssessorId = (): string | null => {
      try {
        const stored = localStorage.getItem('redi-auth-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          return parsed.state?.assessor?.assessor_id || null
        }
      } catch {
        // Ignore parse errors
      }
      return null
    }

    // Debounce saves using module-level variable
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId)
    }

    saveTimeoutId = setTimeout(async () => {
        if (saveInProgress) return

        const { participant, componentAssessments, overallAssessment } = get()
        if (!participant) return

        const assessorId = getCurrentAssessorId()

        saveInProgress = true
        set({ saveStatus: 'saving' })

        try {
          // Save component assessments
          for (const [componentId, assessment] of Object.entries(componentAssessments)) {
            if (!assessment.isDirty) continue
            
            // Upsert component assessment
            let assessmentId = assessment.assessmentId
            
            if (!assessmentId) {
              // Create new assessment
              const { data, error } = await supabase
                .from('component_assessments')
                .insert({
                  participant_id: participant.participant_id,
                  component_id: componentId,
                  component_feedback: assessment.feedback,
                  is_passed_quick: assessment.isQuickPassed,
                  last_modified_by: assessorId
                })
                .select()
                .single()
              
              if (error) throw error
              assessmentId = data.assessment_id
              
              // Update local state with new ID
              set((state) => ({
                componentAssessments: {
                  ...state.componentAssessments,
                  [componentId]: {
                    ...state.componentAssessments[componentId],
                    assessmentId
                  }
                }
              }))
            } else {
              // Update existing assessment
              const { error } = await supabase
                .from('component_assessments')
                .update({
                  component_feedback: assessment.feedback,
                  is_passed_quick: assessment.isQuickPassed,
                  last_modified_by: assessorId,
                  last_modified_at: new Date().toISOString()
                })
                .eq('assessment_id', assessmentId)
              
              if (error) throw error
            }
            
            // Save outcome scores
            for (const [outcomeId, score] of Object.entries(assessment.scores)) {
              if (!score.isDirty) continue
              
              const { error } = await supabase
                .from('outcome_scores')
                .upsert({
                  assessment_id: assessmentId,
                  outcome_id: outcomeId,
                  bondy_score: score.bondyScore,
                  binary_score: score.binaryScore,
                  scored_by: assessorId,
                  scored_at: new Date().toISOString()
                }, {
                  onConflict: 'assessment_id,outcome_id'
                })
              
              if (error) throw error
            }
            
            // Mark as clean
            set((state) => ({
              componentAssessments: {
                ...state.componentAssessments,
                [componentId]: {
                  ...state.componentAssessments[componentId],
                  isDirty: false,
                  scores: Object.fromEntries(
                    Object.entries(state.componentAssessments[componentId].scores).map(
                      ([id, s]) => [id, { ...s, isDirty: false }]
                    )
                  )
                }
              }
            }))
          }
          
          // Save overall assessment if dirty
          if (overallAssessment.isDirty) {
            if (!overallAssessment.overallId) {
              const { data, error } = await supabase
                .from('overall_assessments')
                .insert({
                  participant_id: participant.participant_id,
                  overall_feedback: overallAssessment.feedback,
                  engagement_score: overallAssessment.engagementScore,
                  team_leader_outcome: overallAssessment.teamLeaderOutcome,
                  team_member_outcome: overallAssessment.teamMemberOutcome,
                  recommended_action: overallAssessment.recommendedAction,
                  last_modified_by: assessorId
                })
                .select()
                .single()
              
              if (error) throw error
              
              set((state) => ({
                overallAssessment: {
                  ...state.overallAssessment,
                  overallId: data.overall_id,
                  isDirty: false
                }
              }))
            } else {
              const { error } = await supabase
                .from('overall_assessments')
                .update({
                  overall_feedback: overallAssessment.feedback,
                  engagement_score: overallAssessment.engagementScore,
                  team_leader_outcome: overallAssessment.teamLeaderOutcome,
                  team_member_outcome: overallAssessment.teamMemberOutcome,
                  recommended_action: overallAssessment.recommendedAction,
                  last_modified_by: assessorId,
                  last_modified_at: new Date().toISOString()
                })
                .eq('overall_id', overallAssessment.overallId)
              
              if (error) throw error
              
              set((state) => ({
                overallAssessment: {
                  ...state.overallAssessment,
                  isDirty: false
                }
              }))
            }
          }
          
          set({ saveStatus: 'saved', lastSaved: new Date(), saveError: null })

          // Reset status after delay
          setTimeout(() => {
            set({ saveStatus: 'idle' })
          }, 2000)

        } catch (error) {
          console.error('Error saving assessments:', error)
          const errorMessage = error instanceof Error ? error.message : 'Failed to save changes'
          set({ saveStatus: 'error', saveError: errorMessage })

          // Keep error visible longer (5 seconds) to ensure user sees it
          setTimeout(() => {
            set({ saveStatus: 'idle', saveError: null })
          }, 5000)
        } finally {
          saveInProgress = false
        }
      }, 1000) // 1 second debounce
  },

  cancelPendingSave: () => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId)
      saveTimeoutId = null
    }
    saveInProgress = false
  },
  
  getComponentStatus: (componentId) => {
    const { outcomes, componentAssessments, participant } = get()
    const componentOutcomes = outcomes[componentId] || []
    const assessment = componentAssessments[componentId]
    
    if (!assessment || Object.keys(assessment.scores).length === 0) {
      return 'not_started'
    }
    
    // Check if all applicable mandatory outcomes are scored
    const applicableOutcomes = componentOutcomes.filter(o => {
      const applies = 
        o.applies_to === 'BOTH' || 
        o.applies_to === participant?.assessment_role ||
        participant?.assessment_role === 'BOTH'
      return o.is_mandatory && applies
    })
    
    const scoredCount = applicableOutcomes.filter(o => 
      assessment.scores[o.outcome_id]?.bondyScore !== null ||
      assessment.scores[o.outcome_id]?.binaryScore !== null
    ).length
    
    if (scoredCount >= applicableOutcomes.length) {
      return 'complete'
    }
    
    return 'in_progress'
  },
  
  reset: () => {
    // Cancel any pending saves before resetting
    get().cancelPendingSave()
    set(initialState)
  }
}))
