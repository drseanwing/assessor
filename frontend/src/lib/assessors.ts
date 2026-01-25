import { supabase } from './supabase'
import type { Assessor } from '../types/database'

export interface CreateAssessorData {
  name: string
  email?: string
  pin: string
}

export interface UpdateAssessorData {
  name?: string
  email?: string
  pin?: string
}

// Hash a PIN using SHA-256 (simple hash for development)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// Fetch all assessors (including inactive)
export async function fetchAllAssessors(): Promise<Assessor[]> {
  try {
    const { data, error } = await supabase
      .from('assessors')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data as Assessor[]
  } catch (error) {
    console.error('Error fetching assessors:', error)
    return []
  }
}

// Create a new assessor
export async function createAssessor(assessorData: CreateAssessorData): Promise<{ success: boolean; error?: string; assessor?: Assessor }> {
  try {
    // Hash the PIN
    const pinHash = await hashPin(assessorData.pin)

    // Insert into database
    const { data, error } = await supabase
      .from('assessors')
      .insert({
        name: assessorData.name,
        email: assessorData.email || null,
        pin_hash: pinHash,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      assessor: data as Assessor
    }
  } catch (error: any) {
    console.error('Error creating assessor:', error)
    return {
      success: false,
      error: error.message || 'Failed to create assessor'
    }
  }
}

// Update an assessor
export async function updateAssessor(
  assessorId: string,
  assessorData: UpdateAssessorData
): Promise<{ success: boolean; error?: string; assessor?: Assessor }> {
  try {
    const updateData: any = {}

    if (assessorData.name !== undefined) {
      updateData.name = assessorData.name
    }

    if (assessorData.email !== undefined) {
      updateData.email = assessorData.email || null
    }

    if (assessorData.pin !== undefined && assessorData.pin !== '') {
      updateData.pin_hash = await hashPin(assessorData.pin)
    }

    const { data, error } = await supabase
      .from('assessors')
      .update(updateData)
      .eq('assessor_id', assessorId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      assessor: data as Assessor
    }
  } catch (error: any) {
    console.error('Error updating assessor:', error)
    return {
      success: false,
      error: error.message || 'Failed to update assessor'
    }
  }
}

// Toggle assessor active status
export async function toggleAssessorStatus(
  assessorId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('assessors')
      .update({ is_active: isActive })
      .eq('assessor_id', assessorId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Error toggling assessor status:', error)
    return {
      success: false,
      error: error.message || 'Failed to update assessor status'
    }
  }
}
