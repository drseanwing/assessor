import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { assessor, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                REdI Assessment Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, {assessor?.name}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Dashboard Coming Soon
          </h2>
          <p className="text-gray-600">
            This is a placeholder for the dashboard. The following features will be implemented:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700">
            <li>Course selection</li>
            <li>Participant listing</li>
            <li>Assessment entry panel</li>
            <li>Real-time progress tracking</li>
            <li>Feedback aggregation</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
