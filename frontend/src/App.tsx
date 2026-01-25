import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CourseListPage from './pages/CourseListPage'
import ParticipantListPage from './pages/ParticipantListPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
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
          path="/course/:courseId/participants" 
          element={
            <ProtectedRoute>
              <ParticipantListPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/courses" replace />} />
        <Route path="*" element={<Navigate to="/courses" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
