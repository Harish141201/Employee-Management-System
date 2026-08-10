import './App.css'
import Header from './component/Header'
import ListEmployeeComponent from './component/ListEmployeeComponent'
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
} from 'react-router-dom'

import EmployeeComponent from './component/EmployeeComponent'
import EmployeeDetail from './component/EmployeeDetail'
import ProfilePage from './component/ProfilePage'
import Login from './component/Login'
import ProtectedRoute from './component/ProtectedRoute'
import Dashboard from './component/Dashboard'
import DepartmentsPage from './component/DepartmentsPage'
import LeavePage from './component/LeavePage'
import { AuthProvider } from './context/AuthContext'

function AppRoutes() {

  const location = useLocation()

  return (
    <>
      {/* Hide Header on Login Page */}
      {location.pathname !== '/login' && <Header />}

      <Routes>

        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ListEmployeeComponent />
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
          path="/leave"
          element={
            <ProtectedRoute>
              <LeavePage />
            </ProtectedRoute>
          }
        />

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

      </Routes>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App