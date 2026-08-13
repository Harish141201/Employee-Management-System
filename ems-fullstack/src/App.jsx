import './App.css'
import Header from './component/Header'
import Sidebar from './component/Sidebar'
import ListEmployeeComponent from './component/ListEmployeeComponent'
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
} from 'react-router-dom'
import { useState } from 'react'

import EmployeeComponent from './component/EmployeeComponent'
import EmployeeDetail from './component/EmployeeDetail'
import ProfilePage from './component/ProfilePage'
import Login from './component/Login'
import ProtectedRoute from './component/ProtectedRoute'
import Dashboard from './component/Dashboard'
import DepartmentsPage from './component/DepartmentsPage'
import DepartmentDetail from './component/DepartmentDetail'
import LeavePage from './component/LeavePage'
import AttendancePage from './component/AttendancePage'
import DocumentsPage from './component/DocumentsPage'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { Navigate } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { NotFoundPage } from './component/ErrorPages'
import ErrorBoundary from './component/ErrorBoundary'

function HomeRedirect() {
  const { hasRole } = useAuth()
  return <Navigate to={hasRole('ADMIN', 'HR') ? '/dashboard' : '/profile'} replace />
}

function AppRoutes() {

  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isLogin = location.pathname === '/login'

  return (
    <>
      {/* Hide Header on Login Page */}
      {!isLogin && isAuthenticated && <><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><Header onToggleSidebar={() => setSidebarOpen(open => !open)} /></>}

      <main className={isLogin || !isAuthenticated ? '' : 'app-shell'}>
      <Routes>

        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeRedirect />
            </ProtectedRoute>
          }
        />

        <Route
          path="/emplist"
          element={
            <ProtectedRoute>
              <ListEmployeeComponent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['ADMIN', 'HR']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments"
          element={
            <ProtectedRoute roles={['ADMIN', 'HR']}>
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments/:id"
          element={<ProtectedRoute roles={['ADMIN', 'HR']}><DepartmentDetail /></ProtectedRoute>}
        />

        <Route
          path="/leave"
          element={
            <ProtectedRoute>
              <LeavePage />
            </ProtectedRoute>
          }
        />
        <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />

        <Route
          path="/add-employee"
          element={
            <ProtectedRoute roles={['ADMIN', 'HR']}>
              <EmployeeComponent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/update-employee/:id"
          element={
            <ProtectedRoute roles={['ADMIN', 'HR']}>
              <EmployeeComponent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees/:id"
          element={
            <ProtectedRoute roles={['ADMIN', 'HR']}>
              <EmployeeDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />

      </Routes>
      </main>
    </>
  )
}

function App() {
  return <ErrorBoundary>
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  </ErrorBoundary>
}

export default App
