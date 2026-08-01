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
import Login from './component/Login'
import ProtectedRoute from './component/ProtectedRoute'
import Dashboard from './component/Dashboard'
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