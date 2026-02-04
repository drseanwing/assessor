import { create } from 'zustand'
import type {
  Participant,
  TemplateComponent,
  TemplateOutcome,
  BondyScore,
  BinaryScore
} from '../types/database'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'

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
    isDirty: boolean
  }
  
  // UI state
  activeComponentId: string | null
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved: Date | null
  loadError: string | null
  
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
  
  // Save to database
  saveChanges: () => Promise<void>
  
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
    isDirty: false
  },
  activeComponentId: null,
  saveStatus: 'idle' as const,
  lastSaved: null,
  loadError: null
}

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

    set({ loadError: null })

    try {
      // Load component assessments
      const { data: assessments } = await supabase
        .from('component_assessments')
        .select('*')
        .eq('participant_id', participant.participant_id)

      // Batch-load all outcome scores in a single query
      const assessmentIds = (assessments || []).map(a => a.assessment_id)
      let allScores: Record<string, unknown>[] = []
      if (assessmentIds.length > 0) {
        const { data: scoreData } = await supabase
          .from('outcome_scores')
          .select('*')
          .in('assessment_id', assessmentIds)
        allScores = scoreData || []
      }

      // Build component assessments with scores grouped by assessment_id
      const componentAssessments: Record<string, LocalComponentAssessment> = {}

      for (const component of components) {
        const existingAssessment = assessments?.find(a => a.component_id === component.component_id)
        const scores: Record<string, LocalOutcomeScore> = {}

        if (existingAssessment) {
          const assessmentScores = allScores.filter(
            (s: Record<string, unknown>) => s.assessment_id === existingAssessment.assessment_id
          )
          for (const score of assessmentScores) {
            const s = score as Record<string, unknown>
            scores[s.outcome_id as string] = {
              outcomeId: s.outcome_id as string,
              bondyScore: s.bondy_score as BondyScore | null,
              binaryScore: s.binary_score as BinaryScore | null,
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
          overallId: overall?.overall_id || null,
          feedback: overall?.overall_feedback || '',
          engagementScore: overall?.engagement_score ?? null,
          isDirty: false
        }
      })
    } catch (error) {
      console.error('Error loading assessments:', error)
      set({ loadError: error instanceof Error ? error.message : 'Failed to load assessments' })
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
  
  saveChanges: (() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    return async () => {
      // Debounce saves
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(async () => {
        const { participant, componentAssessments, overallAssessment } = get()
        if (!participant) return

        const assessorId = useAuthStore.getState().assessor?.assessor_id || null
        
        set({ saveStatus: 'saving' })
        
        try {
          // Save component assessments
          const savedComponentIds: string[] = []
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

            savedComponentIds.push(componentId)
          }

          // Mark all saved components as clean after entire loop succeeds
          if (savedComponentIds.length > 0) {
            set((state) => {
              const updated = { ...state.componentAssessments }
              for (const componentId of savedComponentIds) {
                updated[componentId] = {
                  ...updated[componentId],
                  isDirty: false,
                  scores: Object.fromEntries(
                    Object.entries(updated[componentId].scores).map(
                      ([id, s]) => [id, { ...s, isDirty: false }]
                    )
                  )
                }
              }
              return { componentAssessments: updated }
            })
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
          
          set({ saveStatus: 'saved', lastSaved: new Date() })
          
          // Reset status after delay
          setTimeout(() => {
            set({ saveStatus: 'idle' })
          }, 2000)
          
        } catch (error) {
          console.error('Error saving assessments:', error)
          set({ saveStatus: 'error' })
        }
      }, 1000) // 1 second debounce
    }
  })(),
  
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
  
  reset: () => set(initialState)
}))
