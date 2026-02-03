import { useState, useRef, useEffect, useId, memo } from 'react'

interface FeedbackInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  disabled?: boolean
}

export default memo(function FeedbackInput({
  value,
  onChange,
  placeholder = 'Enter feedback...',
  label,
  disabled = false
}: FeedbackInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const id = useId()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, isExpanded ? 200 : 80)}px`
    }
  }, [value, isExpanded])

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => setIsExpanded(false)}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-redi-teal focus:border-transparent
            transition-all duration-200 resize-none
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          style={{ minHeight: '44px' }}
        />
        {value.length > 0 && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {value.length} chars
          </div>
        )}
      </div>
    </div>
  )
})
