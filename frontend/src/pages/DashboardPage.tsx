import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to course list page
    navigate('/courses', { replace: true })
  }, [navigate])

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-redi-teal mx-auto" aria-hidden="true"></div>
        <p className="mt-4 text-gray-700">Loading...</p>
      </div>
    </main>
  )
}
