/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hashPin, loginWithPin, fetchActiveAssessors } from '../auth'
import { supabase } from '../supabase'
import type { Assessor } from '../../types/database'

// Mock supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

describe('auth.ts', () => {
  describe('hashPin', () => {
    it('should hash a PIN using SHA-256', async () => {
      const pin = '1234'
      const hash = await hashPin(pin)

      expect(hash).toBeTruthy()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should produce consistent hashes for the same PIN', async () => {
      const pin = '5678'
      const hash1 = await hashPin(pin)
      const hash2 = await hashPin(pin)

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different PINs', async () => {
      const pin1 = '1234'
      const pin2 = '5678'
      const hash1 = await hashPin(pin1)
      const hash2 = await hashPin(pin2)

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty PIN', async () => {
      const pin = ''
      const hash = await hashPin(pin)

      expect(hash).toBeTruthy()
      expect(typeof hash).toBe('string')
    })

    it('should return hexadecimal string', async () => {
      const pin = '9999'
      const hash = await hashPin(pin)

      // Check if hash contains only hex characters (0-9, a-f)
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true)
    })
  })

  describe('loginWithPin', () => {
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

    it('should successfully login with valid credentials', async () => {
      const credentials = {
        assessorId: 'A001',
        pin: '1234'
      }

      // Mock hashPin to return the expected hash
      const hashedPin = 'mockedhash123'
      vi.spyOn(require('../auth'), 'hashPin').mockResolvedValue(hashedPin)

      // Mock supabase query
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockAssessor,
        error: null
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      })

      mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      })

      const result = await loginWithPin(credentials)

      expect(result.success).toBe(true)
      expect(result.assessor).toEqual(mockAssessor)
      expect(result.error).toBeUndefined()
      expect(supabase.from).toHaveBeenCalledWith('assessors')
    })

    it('should fail login when assessor not found', async () => {
      const credentials = {
        assessorId: 'A999',
        pin: '1234'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      })

      mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      })

      const result = await loginWithPin(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Assessor not found or inactive')
      expect(result.assessor).toBeUndefined()
    })

    it('should fail login with invalid PIN', async () => {
      const credentials = {
        assessorId: 'A001',
        pin: 'wrong'
      }

      // Mock hashPin to return a different hash
      const hashedPin = 'differenthash456'
      vi.spyOn(require('../auth'), 'hashPin').mockResolvedValue(hashedPin)

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockAssessor,
        error: null
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      })

      mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      })

      const result = await loginWithPin(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid PIN')
      expect(result.assessor).toBeUndefined()
    })

    it('should handle database errors gracefully', async () => {
      const credentials = {
        assessorId: 'A001',
        pin: '1234'
      }

      const mockSelect = vi.fn().mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any)

      const result = await loginWithPin(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Login failed. Please try again.')
      expect(result.assessor).toBeUndefined()
    })

    it('should verify assessor is active', async () => {
      const credentials = {
        assessorId: 'A001',
        pin: '1234'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      })

      mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      })

      const result = await loginWithPin(credentials)

      expect(result.success).toBe(false)
      expect(mockEq).toHaveBeenCalledWith('is_active', true)
    })
  })

  describe('fetchActiveAssessors', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should fetch and return active assessors', async () => {
      const mockAssessors: Assessor[] = [
        {
          assessor_id: 'A001',
          name: 'Alice Smith',
          email: 'alice@example.com',
          pin_hash: 'hash1',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          assessor_id: 'A002',
          name: 'Bob Jones',
          email: 'bob@example.com',
          pin_hash: 'hash2',
          is_active: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ]

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: mockAssessors,
        error: null
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder
      } as any)

      mockSelect.mockReturnValue({
        eq: mockEq,
        order: mockOrder
      })

      mockEq.mockReturnValue({
        order: mockOrder
      })

      const result = await fetchActiveAssessors()

      expect(result).toEqual(mockAssessors)
      expect(supabase.from).toHaveBeenCalledWith('assessors')
      expect(mockEq).toHaveBeenCalledWith('is_active', true)
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('should return empty array on error', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder
      } as any)

      mockSelect.mockReturnValue({
        eq: mockEq,
        order: mockOrder
      })

      mockEq.mockReturnValue({
        order: mockOrder
      })

      const result = await fetchActiveAssessors()

      expect(result).toEqual([])
    })

    it('should handle exceptions and return empty array', async () => {
      const mockSelect = vi.fn().mockImplementation(() => {
        throw new Error('Network error')
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any)

      const result = await fetchActiveAssessors()

      expect(result).toEqual([])
    })

    it('should order assessors by name ascending', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder
      } as any)

      mockSelect.mockReturnValue({
        eq: mockEq,
        order: mockOrder
      })

      mockEq.mockReturnValue({
        order: mockOrder
      })

      await fetchActiveAssessors()

      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true })
    })
  })
})
