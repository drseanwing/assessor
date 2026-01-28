import { supabase } from './supabase'
import type { Assessor } from '../types/database'

// Hash a PIN using a simple method (in production, use bcrypt on the backend)
// For now, we'll assume PINs are already hashed in the database
export async function hashPin(pin: string): Promise<string> {
  // In production, this should call a backend API that uses bcrypt
  // For development, we'll use a simple hash
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export interface LoginCredentials {
  assessorId: string
  pin: string
}

export interface LoginResult {
  success: boolean
  assessor?: Assessor
  error?: string
}

export async function loginWithPin(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    // Fetch the assessor from database
    const { data: assessor, error } = await supabase
      .from('assessors')
      .select('*')
      .eq('assessor_id', credentials.assessorId)
      .eq('is_active', true)
      .single()

    if (error || !assessor) {
      return {
        success: false,
        error: 'Assessor not found or inactive'
      }
    }

    // Hash the provided PIN and compare
    // In production, this comparison should happen on the backend
    const hashedPin = await hashPin(credentials.pin)
    if (hashedPin !== assessor.pin_hash) {
      return {
        success: false,
        error: 'Invalid PIN'
      }
    }

    return {
      success: true,
      assessor: assessor as Assessor
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'Login failed. Please try again.'
    }
  }
}

export async function fetchActiveAssessors(): Promise<Assessor[]> {
  try {
    const { data, error } = await supabase
      .from('assessors')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data as Assessor[]
  } catch (error) {
    console.error('Error fetching assessors:', error)
    return []
  }
}
