import type { Assessor } from '../types/database'

export interface LoginCredentials {
  assessorId: string
  pin: string
}

export interface LoginResult {
  success: boolean
  assessor?: Assessor
  token?: string
  error?: string
}

const API_BASE = '/worker/api'

export async function loginWithPin(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessorId: credentials.assessorId,
        pin: credentials.pin,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Login failed',
      }
    }

    return {
      success: true,
      assessor: data.assessor as Assessor,
      token: data.token,
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'Login failed. Please try again.',
    }
  }
}

export async function fetchActiveAssessors(): Promise<Pick<Assessor, 'assessor_id' | 'name'>[]> {
  try {
    const response = await fetch(`${API_BASE}/auth/assessors`)
    if (!response.ok) throw new Error('Failed to fetch assessors')
    return await response.json()
  } catch (error) {
    console.error('Error fetching assessors:', error)
    return []
  }
}
