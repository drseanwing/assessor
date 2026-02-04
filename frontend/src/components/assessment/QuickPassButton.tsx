import { useState, useRef, useEffect } from 'react'

interface QuickPassButtonProps {
  onQuickPass: () => void
  isQuickPassed: boolean
  disabled?: boolean
}

export default function QuickPassButton({
  onQuickPass,
  isQuickPassed,
  disabled = false
}: QuickPassButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleClick = () => {
    if (disabled) return
    setIsAnimating(true)
    onQuickPass()
    timeoutRef.current = setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-lg font-semibold text-sm
        flex items-center space-x-2
        transition-all duration-200
        ${isQuickPassed 
          ? 'bg-green-500 text-white' 
          : 'bg-green-100 text-green-700 hover:bg-green-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isAnimating ? 'scale-105' : ''}
      `}
      title="Mark all mandatory outcomes as Independent"
    >
      <svg 
        className={`w-5 h-5 ${isAnimating ? 'animate-bounce' : ''}`} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 13l4 4L19 7" 
        />
      </svg>
      <span>{isQuickPassed ? 'PASSED' : 'QUICK PASS'}</span>
    </button>
  )
}
