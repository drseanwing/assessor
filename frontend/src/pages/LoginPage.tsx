import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { loginWithPin, fetchActiveAssessors } from '../lib/auth'
import type { Assessor } from '../types/database'

type AssessorOption = Pick<Assessor, 'assessor_id' | 'name'>

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000 // 12 hours

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAssessor, setToken, setSessionExpiry, isAuthenticated } = useAuthStore()

  const [assessors, setAssessors] = useState<AssessorOption[]>([])
  const [selectedAssessor, setSelectedAssessor] = useState<string>('')
  const [pin, setPin] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [assessorLoadError, setAssessorLoadError] = useState<string>('')

  const loadAssessors = useCallback(async () => {
    setAssessorLoadError('')
    const { data, error: fetchError } = await fetchActiveAssessors()
    if (fetchError) {
      setAssessorLoadError(fetchError)
      return
    }
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

    if (result.success && result.assessor) {
      // Set session expiry (default: 12 hours)
      const expiryTime = Date.now() + SESSION_DURATION_MS
      setAssessor(result.assessor)
      setToken(result.token ?? null)
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-redi-light-teal/20 to-redi-navy/10 px-4">
      <main className="max-w-md w-full">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <img
            src="/redi-logo.png"
            alt="REdI - Resuscitation EDucation Initiative"
            className="mx-auto h-32 w-auto rounded-lg mb-4"
          />
          <p className="text-lg font-semibold text-redi-navy tracking-wide">
            Competency Assessment System
          </p>
        </div>

        {/* Brand Gradient Bar */}
        <div className="h-1.5 rounded-full bg-gradient-to-r from-redi-lime via-redi-teal to-redi-navy mb-6" />

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
                Select Assessor
              </label>
              <select
                id="assessor"
                value={selectedAssessor}
                onChange={(e) => setSelectedAssessor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-redi-teal focus:border-transparent"
                disabled={loading || assessors.length === 0}
                aria-required="true"
              >
                {assessors.length === 0 && !assessorLoadError ? (
                  <option value="">Loading assessors...</option>
                ) : assessorLoadError ? (
                  <option value="">Failed to load assessors</option>
                ) : (
                  assessors.map((assessor) => (
                    <option key={assessor.assessor_id} value={assessor.assessor_id}>
                      {assessor.name}
                    </option>
                  ))
                )}
              </select>
              {assessorLoadError && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-red-600">{assessorLoadError}</span>
                  <button
                    type="button"
                    onClick={loadAssessors}
                    className="text-sm font-medium text-redi-teal hover:text-redi-teal-dark"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* PIN Input */}
            <div>
              <label
                htmlFor="pin"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                4-Digit PIN
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
                aria-required="true"
                aria-describedby={error ? 'pin-error' : undefined}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div id="pin-error" role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-redi-navy/60">
          <p>Queensland Health - Resuscitation Education Initiative</p>
        </div>
      </main>
    </div>
  )
}
