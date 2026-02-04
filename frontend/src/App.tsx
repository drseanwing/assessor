import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import CourseListPage from './pages/CourseListPage'
import ParticipantListPage from './pages/ParticipantListPage'
import AssessmentPage from './pages/AssessmentPage'
import CourseDashboardPage from './pages/CourseDashboardPage'
import ProtectedRoute from './components/ProtectedRoute'
import { ErrorBoundary } from './components/common'

function App() {
  return (
    <BrowserRouter>
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
          <Route path="/" element={<Navigate to="/courses" replace />} />
          <Route path="*" element={<Navigate to="/courses" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
