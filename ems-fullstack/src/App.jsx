import './App.css'
import Header from './component/Header'
import Sidebar from './component/Sidebar'
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
} from 'react-router-dom'
import { lazy, Suspense, useState } from 'react'

import ProtectedRoute from './component/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { Navigate } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { NotFoundPage } from './component/ErrorPages'
import ErrorBoundary from './component/ErrorBoundary'

const Login = lazy(() => import('./component/Login'))
const Dashboard = lazy(() => import('./component/Dashboard'))
const ListEmployeeComponent = lazy(() => import('./component/ListEmployeeComponent'))
const EmployeeComponent = lazy(() => import('./component/EmployeeComponent'))
const EmployeeDetail = lazy(() => import('./component/EmployeeDetail'))
const ProfilePage = lazy(() => import('./component/ProfilePage'))
const DepartmentsPage = lazy(() => import('./component/DepartmentsPage'))
const DepartmentDetail = lazy(() => import('./component/DepartmentDetail'))
const LeavePage = lazy(() => import('./component/LeavePage'))
const AttendancePage = lazy(() => import('./component/AttendancePage'))
const CalendarPage = lazy(() => import('./component/CalendarPage'))
const DocumentsPage = lazy(() => import('./component/DocumentsPage'))
const UserManagementPage = lazy(() => import('./component/UserManagementPage'))
const AuditLogsPage = lazy(() => import('./component/AuditLogsPage'))
const ReportsPage = lazy(() => import('./component/ReportsPage'))
const SettingsPage = lazy(() => import('./component/SettingsPage'))
const NotificationsPage = lazy(() => import('./component/NotificationsPage'))

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
      <Suspense fallback={<div className="app-route-loading"><span className="spinner-border spinner-border-sm" aria-hidden="true"></span> Loading workspace…</div>}>
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
        <Route path="/users" element={<ProtectedRoute roles={['ADMIN']}><UserManagementPage /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute roles={['ADMIN']}><AuditLogsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={['ADMIN', 'HR']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

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
      </Suspense>
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
