import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>No error</div>
}

// Component that throws on button click - used for testing error boundary
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ThrowOnClick = () => {
  const [shouldThrow, setShouldThrow] = React.useState(false)

  if (shouldThrow) {
    throw new Error('Click error')
  }

  return <button onClick={() => setShouldThrow(true)}>Throw Error</button>
}

// Need to import React for the component above
import React from 'react'

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Reset console.error mock
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('normal rendering', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('First child')).toBeInTheDocument()
      expect(screen.getByText('Second child')).toBeInTheDocument()
    })

    it('should not render error UI initially', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('error catching', () => {
    it('should catch errors thrown by children', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
    })

    it('should display error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('should log error to console', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should catch errors from nested children', () => {
      render(
        <ErrorBoundary>
          <div>
            <div>
              <ThrowError shouldThrow={true} />
            </div>
          </div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  describe('error UI', () => {
    it('should display error icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('text-red-500')
    })

    it('should display "Try Again" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const button = screen.getByRole('button', { name: /try again/i })
      expect(button).toBeInTheDocument()
    })

    it('should display support message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('If the problem persists, please contact support')).toBeInTheDocument()
    })

    it('should have proper styling for error container', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const container = screen.getByText('Something went wrong').closest('div')
      expect(container).toHaveClass('min-h-screen')
      expect(container).toHaveClass('bg-gray-50')
    })
  })

  describe('reset functionality', () => {
    it('should reload page when "Try Again" is clicked', () => {
      const reloadSpy = vi.spyOn(window.location, 'reload')

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const button = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(button)

      expect(reloadSpy).toHaveBeenCalled()
    })
  })

  describe('state management', () => {
    it('should update state when error occurs', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()

      // Trigger error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should store error in state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Error message should be displayed from state
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })
  })

  describe('getDerivedStateFromError', () => {
    it('should return correct state structure', () => {
      const error = new Error('Test error')
      const state = ErrorBoundary.getDerivedStateFromError(error)

      expect(state).toEqual({
        hasError: true,
        error: error
      })
    })

    it('should set hasError to true', () => {
      const error = new Error('Another error')
      const state = ErrorBoundary.getDerivedStateFromError(error)

      expect(state.hasError).toBe(true)
    })

    it('should include error object in state', () => {
      const error = new Error('Error details')
      const state = ErrorBoundary.getDerivedStateFromError(error)

      expect(state.error).toBe(error)
      expect(state.error?.message).toBe('Error details')
    })
  })

  describe('error boundary lifecycle', () => {
    it('should not show error for conditional rendering', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <div>Safe content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Safe content')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()

      // Rerender with same safe content
      rerender(
        <ErrorBoundary>
          <div>Safe content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Safe content')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have accessible button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const button = screen.getByRole('button', { name: /try again/i })
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })

    it('should display error message in readable format', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const errorMessage = screen.getByText('Test error message')
      expect(errorMessage).toHaveClass('font-mono')
      expect(errorMessage).toHaveClass('break-words')
    })
  })

  describe('visual design', () => {
    it('should use proper color scheme for error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const errorBox = screen.getByText('An unexpected error occurred').closest('div')
      expect(errorBox).toHaveClass('bg-red-50')
      expect(errorBox).toHaveClass('border-red-200')
    })

    it('should have refresh icon in button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const button = screen.getByRole('button', { name: /try again/i })
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should center content vertically and horizontally', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const container = screen.getByText('Something went wrong').closest('div.min-h-screen')
      expect(container).toHaveClass('flex')
      expect(container).toHaveClass('items-center')
      expect(container).toHaveClass('justify-center')
    })
  })
})
