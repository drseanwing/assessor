/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { Assessor } from '../../types/database'
import { loginWithPin, fetchActiveAssessors } from '../auth'

describe('auth.ts', () => {
  const mockAssessor: Assessor = {
    assessor_id: 'A001',
    name: 'John Doe',
    email: 'john@example.com',
    pin_hash: 'mockedhash123',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('loginWithPin', () => {
    it('should successfully login with valid credentials', async () => {
      const credentials = {
        assessorId: 'A001',
        pin: '1234'
      }

      const mockResponse = {
        success: true,
        assessor: mockAssessor,
        token: 'mock-token-123'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await loginWithPin(credentials)

      expect(result.success).toBe(true)
      expect(result.assessor).toEqual(mockAssessor)
      expect(result.token).toBe('mock-token-123')
      expect(result.error).toBeUndefined()
      expect(global.fetch).toHaveBeenCalledWith('/worker/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessorId: 'A001',
          pin: '1234'
        })
      })
    })

    it('should fail login with invalid credentials', async () => {
      const credentials = {
        assessorId: 'A001',
        pin: 'wrong'
      }

      const mockResponse = {
        success: false,
        error: 'Invalid credentials'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => mockResponse
      } as Response)

      const result = await loginWithPin(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      expect(result.assessor).toBeUndefined()
      expect(result.token).toBeUndefined()
    })

    it('should handle network errors gracefully', async () => {
      const credentials = {
        assessorId: 'A001',
        pin: '1234'
      }

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await loginWithPin(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Login failed. Please try again.')
      expect(result.assessor).toBeUndefined()
      expect(result.token).toBeUndefined()

      consoleErrorSpy.mockRestore()
    })

    it('should handle response with success false', async () => {
      const credentials = {
        assessorId: 'A001',
        pin: '1234'
      }

      const mockResponse = {
        success: false,
        error: 'Assessor not found'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await loginWithPin(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Assessor not found')
    })

    it('should use default error message when none provided', async () => {
      const credentials = {
        assessorId: 'A001',
        pin: '1234'
      }

      const mockResponse = {
        success: false
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => mockResponse
      } as Response)

      const result = await loginWithPin(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Login failed')
    })
  })

  describe('fetchActiveAssessors', () => {
    it('should fetch and return active assessors', async () => {
      const mockAssessors = [
        {
          assessor_id: 'A001',
          name: 'Alice Smith'
        },
        {
          assessor_id: 'A002',
          name: 'Bob Jones'
        }
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssessors
      } as Response)

      const result = await fetchActiveAssessors()

      expect(result.data).toEqual(mockAssessors)
      expect(result.error).toBeNull()
      expect(global.fetch).toHaveBeenCalledWith('/worker/api/auth/assessors')
    })

    it('should handle failed response', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      global.fetch = vi.fn().mockResolvedValue({
        ok: false
      } as Response)

      const result = await fetchActiveAssessors()

      expect(result.data).toEqual([])
      expect(result.error).toBe('Failed to load assessors')

      consoleErrorSpy.mockRestore()
    })

    it('should handle network errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await fetchActiveAssessors()

      expect(result.data).toEqual([])
      expect(result.error).toBe('Failed to load assessors')

      consoleErrorSpy.mockRestore()
    })

    it('should handle JSON parse errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      } as Response)

      const result = await fetchActiveAssessors()

      expect(result.data).toEqual([])
      expect(result.error).toBe('Failed to load assessors')

      consoleErrorSpy.mockRestore()
    })
  })
})
