/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Web Crypto API for testing
if (!globalThis.crypto) {
  globalThis.crypto = {
    subtle: {
      digest: async (_algorithm: string, data: BufferSource) => {
        // Simple mock implementation for testing
        const encoder = new TextEncoder()
        const text = new TextDecoder().decode(data)
        const hash = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return encoder.encode(hash.toString(16).padStart(64, '0')).buffer
      }
    }
  } as any
}

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    reload: vi.fn()
  },
  writable: true
})
