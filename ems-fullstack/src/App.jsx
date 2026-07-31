import './App.css'
import Header from './component/Header'
import ListEmployeeComponent from './component/ListEmployeeComponent'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import EmployeeComponent from './component/EmployeeComponent'
import Login from './component/Login'
import ProtectedRoute from './component/ProtectedRoute'
import Dashboard from './component/Dashboard'
import { AuthProvider } from './context/AuthContext'

function App() {

  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <Header></Header>
          <Routes>
            <Route path='/login' element={<Login />}></Route>

            <Route path='/' element={
              <ProtectedRoute><ListEmployeeComponent /></ProtectedRoute>
            }></Route>
            <Route path='/emplist' element={
              <ProtectedRoute><ListEmployeeComponent /></ProtectedRoute>
            }></Route>
            <Route path='/dashboard' element={
              <ProtectedRoute roles={['ADMIN', 'HR']}><Dashboard /></ProtectedRoute>
            }></Route>

            {/* Only ADMIN/HR can create or edit employee records —
                mirrors the backend's @PreAuthorize rules. */}
            <Route path='/add-employee' element={
              <ProtectedRoute roles={['ADMIN', 'HR']}><EmployeeComponent /></ProtectedRoute>
            }></Route>
            <Route path='/update-employee/:id' element={
              <ProtectedRoute roles={['ADMIN', 'HR']}><EmployeeComponent /></ProtectedRoute>
            }></Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  )
}

export default App
