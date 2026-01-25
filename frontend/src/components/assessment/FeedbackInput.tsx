interface FeedbackInputProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  disabled?: boolean
}

export default function FeedbackInput({
  value,
  onChange,
  label,
  placeholder = 'Enter your feedback here...',
  disabled = false
}: FeedbackInputProps) {
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        📝 {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-y"
      />
    </div>
  )
}
