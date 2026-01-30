import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { ErrorBoundary } from './components/common'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CourseListPage = lazy(() => import('./pages/CourseListPage'))
const ParticipantListPage = lazy(() => import('./pages/ParticipantListPage'))
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'))
const CourseDashboardPage = lazy(() => import('./pages/CourseDashboardPage'))

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-redi-navy focus:shadow-lg">
          Skip to main content
        </a>
        <Suspense fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center" role="status" aria-label="Loading">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-redi-teal mx-auto" aria-hidden="true"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
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
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
