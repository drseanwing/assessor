interface QuickPassButtonProps {
  onQuickPass: () => void
  disabled?: boolean
}

export default function QuickPassButton({ onQuickPass, disabled = false }: QuickPassButtonProps) {
  return (
    <button
      type="button"
      onClick={onQuickPass}
      disabled={disabled}
      className={`
        px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg
        transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
      `}
    >
      ✓ QUICK PASS
    </button>
  )
}
