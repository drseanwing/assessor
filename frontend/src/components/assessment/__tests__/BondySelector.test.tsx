import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BondySelector from '../BondySelector'
import { BONDY_SCALE_OPTIONS } from '../../../types/database'
import type { BondyScore } from '../../../types/database'

describe('BondySelector', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render all Bondy scale options', () => {
      render(<BondySelector value={null} onChange={mockOnChange} />)

      // Verify all 5 options are rendered
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(5)

      // Verify each option has correct label
      BONDY_SCALE_OPTIONS.forEach(option => {
        const button = screen.getByLabelText(option.label)
        expect(button).toBeInTheDocument()
        expect(button).toHaveTextContent(option.shortLabel)
      })
    })

    it('should render with no selection', () => {
      render(<BondySelector value={null} onChange={mockOnChange} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('bg-gray-100')
        expect(button).not.toHaveClass('ring-2')
      })
    })

    it('should render with INDEPENDENT selected', () => {
      render(<BondySelector value="INDEPENDENT" onChange={mockOnChange} />)

      const independentButton = screen.getByLabelText('Independent')
      expect(independentButton).toHaveClass('bg-green-500')
      expect(independentButton).toHaveClass('ring-2')
      expect(independentButton).toHaveClass('ring-blue-400')
    })

    it('should render with SUPERVISED selected', () => {
      render(<BondySelector value="SUPERVISED" onChange={mockOnChange} />)

      const supervisedButton = screen.getByLabelText('Supervised')
      expect(supervisedButton).toHaveClass('bg-lime-500')
      expect(supervisedButton).toHaveClass('ring-2')
    })

    it('should render with ASSISTED selected', () => {
      render(<BondySelector value="ASSISTED" onChange={mockOnChange} />)

      const assistedButton = screen.getByLabelText('Assisted')
      expect(assistedButton).toHaveClass('bg-yellow-500')
      expect(assistedButton).toHaveClass('ring-2')
    })

    it('should render with MARGINAL selected', () => {
      render(<BondySelector value="MARGINAL" onChange={mockOnChange} />)

      const marginalButton = screen.getByLabelText('Marginal/Dependent')
      expect(marginalButton).toHaveClass('bg-orange-500')
      expect(marginalButton).toHaveClass('ring-2')
    })

    it('should render with NOT_OBSERVED selected', () => {
      render(<BondySelector value="NOT_OBSERVED" onChange={mockOnChange} />)

      const notObservedButton = screen.getByLabelText('Not Observed')
      expect(notObservedButton).toHaveClass('bg-gray-500')
      expect(notObservedButton).toHaveClass('ring-2')
    })
  })

  describe('interaction', () => {
    it('should call onChange when a button is clicked', () => {
      render(<BondySelector value={null} onChange={mockOnChange} />)

      const independentButton = screen.getByLabelText('Independent')
      fireEvent.click(independentButton)

      expect(mockOnChange).toHaveBeenCalledTimes(1)
      expect(mockOnChange).toHaveBeenCalledWith('INDEPENDENT')
    })

    it('should allow changing selection', () => {
      const { rerender } = render(
        <BondySelector value="INDEPENDENT" onChange={mockOnChange} />
      )

      const supervisedButton = screen.getByLabelText('Supervised')
      fireEvent.click(supervisedButton)

      expect(mockOnChange).toHaveBeenCalledWith('SUPERVISED')

      // Simulate state update
      rerender(<BondySelector value="SUPERVISED" onChange={mockOnChange} />)

      const supervisedButtonAfter = screen.getByLabelText('Supervised')
      expect(supervisedButtonAfter).toHaveClass('bg-lime-500')
      expect(supervisedButtonAfter).toHaveClass('ring-2')
    })

    it('should call onChange for each different score', () => {
      render(<BondySelector value={null} onChange={mockOnChange} />)

      const scores: BondyScore[] = ['INDEPENDENT', 'SUPERVISED', 'ASSISTED', 'MARGINAL', 'NOT_OBSERVED']

      scores.forEach((score, index) => {
        const option = BONDY_SCALE_OPTIONS.find(opt => opt.score === score)
        const button = screen.getByLabelText(option!.label)
        fireEvent.click(button)

        expect(mockOnChange).toHaveBeenNthCalledWith(index + 1, score)
      })

      expect(mockOnChange).toHaveBeenCalledTimes(5)
    })
  })

  describe('disabled state', () => {
    it('should not call onChange when disabled', () => {
      render(<BondySelector value={null} onChange={mockOnChange} disabled={true} />)

      const independentButton = screen.getByLabelText('Independent')
      fireEvent.click(independentButton)

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('should apply disabled styling', () => {
      render(<BondySelector value={null} onChange={mockOnChange} disabled={true} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('opacity-50')
        expect(button).toHaveClass('cursor-not-allowed')
        expect(button).toBeDisabled()
      })
    })

    it('should show disabled cursor class', () => {
      render(<BondySelector value={null} onChange={mockOnChange} disabled={true} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button.className).toContain('cursor-not-allowed')
        expect(button.className).not.toContain('cursor-pointer')
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper aria-labels', () => {
      render(<BondySelector value={null} onChange={mockOnChange} />)

      BONDY_SCALE_OPTIONS.forEach(option => {
        const button = screen.getByLabelText(option.label)
        expect(button).toHaveAttribute('aria-label', option.label)
      })
    })

    it('should have descriptive titles', () => {
      render(<BondySelector value={null} onChange={mockOnChange} />)

      BONDY_SCALE_OPTIONS.forEach(option => {
        const button = screen.getByLabelText(option.label)
        expect(button).toHaveAttribute('title', `${option.label}: ${option.description}`)
      })
    })

    it('should be keyboard accessible', () => {
      render(<BondySelector value={null} onChange={mockOnChange} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })
  })

  describe('visual feedback', () => {
    it('should show ring around selected option', () => {
      render(<BondySelector value="INDEPENDENT" onChange={mockOnChange} />)

      const independentButton = screen.getByLabelText('Independent')
      expect(independentButton.className).toContain('ring-2')
      expect(independentButton.className).toContain('ring-offset-2')
      expect(independentButton.className).toContain('ring-blue-400')
    })

    it('should not show ring around unselected options', () => {
      render(<BondySelector value="INDEPENDENT" onChange={mockOnChange} />)

      const supervisedButton = screen.getByLabelText('Supervised')
      expect(supervisedButton.className).not.toContain('ring-2')
    })

    it('should show hover state on unselected buttons', () => {
      render(<BondySelector value={null} onChange={mockOnChange} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button.className).toContain('hover:bg-gray-200')
      })
    })
  })

  describe('color coding', () => {
    it('should apply correct color for INDEPENDENT', () => {
      render(<BondySelector value="INDEPENDENT" onChange={mockOnChange} />)

      const button = screen.getByLabelText('Independent')
      expect(button).toHaveClass('bg-green-500')
      expect(button).toHaveClass('text-white')
    })

    it('should apply correct color for SUPERVISED', () => {
      render(<BondySelector value="SUPERVISED" onChange={mockOnChange} />)

      const button = screen.getByLabelText('Supervised')
      expect(button).toHaveClass('bg-lime-500')
      expect(button).toHaveClass('text-white')
    })

    it('should apply correct color for ASSISTED', () => {
      render(<BondySelector value="ASSISTED" onChange={mockOnChange} />)

      const button = screen.getByLabelText('Assisted')
      expect(button).toHaveClass('bg-yellow-500')
      expect(button).toHaveClass('text-white')
    })

    it('should apply correct color for MARGINAL', () => {
      render(<BondySelector value="MARGINAL" onChange={mockOnChange} />)

      const button = screen.getByLabelText('Marginal/Dependent')
      expect(button).toHaveClass('bg-orange-500')
      expect(button).toHaveClass('text-white')
    })

    it('should apply correct color for NOT_OBSERVED', () => {
      render(<BondySelector value="NOT_OBSERVED" onChange={mockOnChange} />)

      const button = screen.getByLabelText('Not Observed')
      expect(button).toHaveClass('bg-gray-500')
      expect(button).toHaveClass('text-white')
    })

    it('should apply gray background for unselected buttons', () => {
      render(<BondySelector value={null} onChange={mockOnChange} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('bg-gray-100')
        expect(button).toHaveClass('text-gray-600')
      })
    })
  })
})
