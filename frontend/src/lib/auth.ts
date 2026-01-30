import type { Assessor } from '../types/database'

export interface LoginCredentials {
  assessorId: string
  pin: string
}

export interface LoginResult {
  success: boolean
  assessor?: Omit<Assessor, 'pin_hash'>
  token?: string
  error?: string
}

export async function loginWithPin(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    const response = await fetch('/worker/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessorId: credentials.assessorId,
        pin: credentials.pin
      })
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Login failed'
      }
    }

    return {
      success: true,
      assessor: data.assessor,
      token: data.token
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'Login failed. Please try again.'
    }
  }
}

export async function fetchActiveAssessors(): Promise<Array<{ assessor_id: string; name: string }>> {
  try {
    const response = await fetch('/worker/api/auth/assessors')
    const data = await response.json()
    if (!response.ok) return []
    return data.assessors || []
  } catch (error) {
    console.error('Error fetching assessors:', error)
    return []
  }
}
