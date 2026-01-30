import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { loginWithPin, fetchActiveAssessors } from '../lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAssessor, setToken, setSessionExpiry, isAuthenticated } = useAuthStore()

  const [assessors, setAssessors] = useState<Array<{ assessor_id: string; name: string }>>([])
  const [selectedAssessor, setSelectedAssessor] = useState<string>('')
  const [pin, setPin] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const loadAssessors = useCallback(async () => {
    const data = await fetchActiveAssessors()
    setAssessors(data)
    if (data.length > 0) {
      setSelectedAssessor(data[0].assessor_id)
    }
  }, [])

  useEffect(() => {
    // If already authenticated, redirect to courses
    if (isAuthenticated()) {
      navigate('/courses')
    }

    // Load assessors - this is safe because loadAssessors is memoized with useCallback
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAssessors()
  }, [isAuthenticated, navigate, loadAssessors])

  const handlePinChange = (value: string) => {
    // Only allow digits and max 4 characters
    const digitsOnly = value.replace(/\D/g, '').slice(0, 4)
    setPin(digitsOnly)
    setError('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!selectedAssessor) {
      setError('Please select an assessor')
      return
    }

    if (pin.length !== 4) {
      setError('PIN must be 4 digits')
      return
    }

    setLoading(true)
    setError('')

    const result = await loginWithPin({
      assessorId: selectedAssessor,
      pin
    })

    if (result.success && result.assessor && result.token) {
      // Set session expiry (default: 12 hours)
      const expiryTime = Date.now() + (12 * 60 * 60 * 1000)
      setAssessor(result.assessor)
      setToken(result.token)
      setSessionExpiry(expiryTime)

      // Navigate to courses
      navigate('/courses')
    } else {
      setError(result.error || 'Login failed')
      setPin('')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-redi-light-teal/20 to-redi-navy/10 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-display text-redi-navy mb-2 tracking-wide">
            REdI Assess
          </h1>
          <p className="text-redi-navy/70">
            Competency Assessment System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-redi-navy mb-6">
            Assessor Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Assessor Selection */}
            <div>
              <label
                htmlFor="assessor"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Assessor <span className="text-red-500" aria-label="required">*</span>
              </label>
              <select
                id="assessor"
                value={selectedAssessor}
                onChange={(e) => setSelectedAssessor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-redi-teal focus:border-transparent"
                disabled={loading || assessors.length === 0}
                required
                aria-required="true"
                aria-invalid={error && !selectedAssessor ? 'true' : 'false'}
                aria-describedby={error ? 'login-error' : undefined}
              >
                {assessors.length === 0 ? (
                  <option value="">Loading assessors...</option>
                ) : (
                  assessors.map((assessor) => (
                    <option key={assessor.assessor_id} value={assessor.assessor_id}>
                      {assessor.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* PIN Input */}
            <div>
              <label
                htmlFor="pin"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                4-Digit PIN <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-redi-teal focus:border-transparent text-center text-2xl tracking-widest"
                disabled={loading}
                maxLength={4}
                autoComplete="off"
                required
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'login-error' : 'pin-help'}
              />
              <p id="pin-help" className="mt-1 text-xs text-gray-600">
                Enter your 4-digit numeric PIN
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                id="login-error"
                role="alert"
                aria-live="polite"
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedAssessor || pin.length !== 4}
              className="w-full bg-redi-coral hover:bg-redi-coral-dark disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Development Note */}
          {import.meta.env.DEV && (
            <div className="mt-6 p-4 bg-redi-yellow/20 border border-redi-yellow/40 rounded-lg">
              <p className="text-xs text-redi-navy">
                <strong>Development Mode:</strong> Any 4-digit PIN will work for demo purposes.
              </p>
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="mt-4 px-2">
          <p className="text-xs text-redi-navy/50 leading-relaxed">
            This system processes personal and health-related education data in accordance with
            the <em>Information Privacy Act 2009</em> (Qld) and Queensland Health information
            security policies. Data entered is used solely for competency assessment purposes
            and is stored securely within Queensland Health infrastructure. By logging in, you
            acknowledge your responsibility to handle participant data in accordance with
            Queensland Health privacy obligations.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-redi-navy/60">
          <p>Queensland Health - Resuscitation Education Initiative</p>
        </div>
      </div>
    </main>
  )
}
