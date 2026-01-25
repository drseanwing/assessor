import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import {
  fetchAllAssessors,
  createAssessor,
  updateAssessor,
  toggleAssessorStatus
} from '../lib/assessors'
import type { Assessor } from '../types/database'

export default function AssessorManagementPage() {
  const { assessor: currentAssessor } = useAuthStore()
  const navigate = useNavigate()

  const [assessors, setAssessors] = useState<Assessor[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [showForm, setShowForm] = useState<boolean>(false)
  const [editingAssessor, setEditingAssessor] = useState<Assessor | null>(null)

  // Form state
  const [formName, setFormName] = useState<string>('')
  const [formEmail, setFormEmail] = useState<string>('')
  const [formPin, setFormPin] = useState<string>('')
  const [formError, setFormError] = useState<string>('')
  const [formLoading, setFormLoading] = useState<boolean>(false)

  useEffect(() => {
    loadAssessors()
  }, [])

  const loadAssessors = async () => {
    setLoading(true)
    setError('')

    const data = await fetchAllAssessors()
    setAssessors(data)
    setLoading(false)
  }

  const handleAddNew = () => {
    setEditingAssessor(null)
    setFormName('')
    setFormEmail('')
    setFormPin('')
    setFormError('')
    setShowForm(true)
  }

  const handleEdit = (assessor: Assessor) => {
    setEditingAssessor(assessor)
    setFormName(assessor.name)
    setFormEmail(assessor.email || '')
    setFormPin('') // Don't pre-fill PIN for security
    setFormError('')
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingAssessor(null)
    setFormName('')
    setFormEmail('')
    setFormPin('')
    setFormError('')
  }

  const validateForm = (): boolean => {
    if (!formName.trim()) {
      setFormError('Name is required')
      return false
    }

    if (formEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
      setFormError('Invalid email format')
      return false
    }

    // PIN is required for new assessors
    if (!editingAssessor && !formPin) {
      setFormError('PIN is required for new assessors')
      return false
    }

    // PIN validation if provided
    if (formPin && (formPin.length !== 4 || !/^\d{4}$/.test(formPin))) {
      setFormError('PIN must be exactly 4 digits')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!validateForm()) {
      return
    }

    setFormLoading(true)

    try {
      let result
      
      if (editingAssessor) {
        // Update existing assessor
        result = await updateAssessor(editingAssessor.assessor_id, {
          name: formName.trim(),
          email: formEmail.trim() || undefined,
          pin: formPin || undefined
        })
      } else {
        // Create new assessor
        result = await createAssessor({
          name: formName.trim(),
          email: formEmail.trim() || undefined,
          pin: formPin
        })
      }

      if (result.success) {
        await loadAssessors()
        handleCancelForm()
      } else {
        setFormError(result.error || 'Operation failed')
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleStatus = async (assessor: Assessor) => {
    const newStatus = !assessor.is_active
    const action = newStatus ? 'activate' : 'deactivate'

    if (!confirm(`Are you sure you want to ${action} ${assessor.name}?`)) {
      return
    }

    const result = await toggleAssessorStatus(assessor.assessor_id, newStatus)

    if (result.success) {
      await loadAssessors()
    } else {
      setError(result.error || `Failed to ${action} assessor`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Assessor Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage assessor accounts and access
              </p>
            </div>
            <button
              onClick={() => navigate('/courses')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Add New Button */}
        <div className="mb-6">
          <button
            onClick={handleAddNew}
            disabled={showForm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
          >
            + Add New Assessor
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingAssessor ? 'Edit Assessor' : 'Add New Assessor'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={formLoading}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  id="email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={formLoading}
                />
              </div>

              {/* PIN */}
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                  4-Digit PIN {editingAssessor ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={formLoading}
                  maxLength={4}
                  required={!editingAssessor}
                />
              </div>

              {/* Form Error */}
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  {formLoading ? 'Saving...' : (editingAssessor ? 'Update' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  disabled={formLoading}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : assessors.length === 0 ? (
          /* No Assessors */
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No assessors found
            </h3>
            <p className="text-gray-600">
              Click "Add New Assessor" to create the first assessor account
            </p>
          </div>
        ) : (
          /* Assessor Table */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assessors.map((assessor) => (
                  <tr key={assessor.assessor_id} className={!assessor.is_active ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {assessor.name}
                        {assessor.assessor_id === currentAssessor?.assessor_id && (
                          <span className="ml-2 text-xs text-blue-600">(You)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {assessor.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          assessor.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {assessor.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assessor.created_at).toLocaleDateString('en-AU', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleEdit(assessor)}
                        disabled={showForm}
                        className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(assessor)}
                        className={`${
                          assessor.is_active
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {assessor.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
