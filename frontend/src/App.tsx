import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import CourseListPage from './pages/CourseListPage'
import ParticipantListPage from './pages/ParticipantListPage'
import AssessmentPage from './pages/AssessmentPage'
import FeedbackReportPage from './pages/FeedbackReportPage'
import CourseDashboardPage from './pages/CourseDashboardPage'
import ProtectedRoute from './components/ProtectedRoute'
import { ErrorBoundary } from './components/common'

function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-redi-navy focus:rounded focus:shadow-lg">
        Skip to main content
      </a>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Navigate to="/courses" replace />} />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <CourseListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:courseId/dashboard"
            element={
              <ProtectedRoute>
                <CourseDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:courseId/participants"
            element={
              <ProtectedRoute>
                <ParticipantListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:courseId/participant/:participantId/assess"
            element={
              <ProtectedRoute>
                <AssessmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:courseId/participant/:participantId/report"
            element={
              <ProtectedRoute>
                <FeedbackReportPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/courses" replace />} />
          <Route path="*" element={<Navigate to="/courses" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
