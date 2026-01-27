import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { loginWithPin, fetchActiveAssessors } from '../lib/auth'
import type { Assessor } from '../types/database'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAssessor, setSessionExpiry, isAuthenticated } = useAuthStore()
  
  const [assessors, setAssessors] = useState<Assessor[]>([])
  const [selectedAssessor, setSelectedAssessor] = useState<string>('')
  const [pin, setPin] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // If already authenticated, redirect to courses
    if (isAuthenticated()) {
      navigate('/courses')
    }

    // Load assessors
    const loadAssessors = async () => {
      const data = await fetchActiveAssessors()
      setAssessors(data)
      if (data.length > 0) {
        setSelectedAssessor(data[0].assessor_id)
      }
    }
    loadAssessors()
  }, [isAuthenticated, navigate])

  const handlePinChange = (value: string) => {
    // Only allow digits and max 4 characters
    const digitsOnly = value.replace(/\D/g, '').slice(0, 4)
    setPin(digitsOnly)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
      const expiryTime = Date.now() + (12 * 60 * 60 * 1000)
      setAssessor(result.assessor)
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            REdI Assess
          </h1>
          <p className="text-gray-600">
            Competency Assessment System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading || assessors.length === 0}
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
                4-Digit PIN
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                disabled={loading}
                maxLength={4}
                autoComplete="off"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedAssessor || pin.length !== 4}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Development Note */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Development Mode:</strong> Any 4-digit PIN will work for demo purposes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Queensland Health - Resuscitation Education Initiative</p>
        </div>
      </div>
    </div>
  )
}
