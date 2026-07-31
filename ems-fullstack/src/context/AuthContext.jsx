import { useState } from 'react'
import { login as loginRequest } from '../service/AuthService'
import AuthContext from './authContextInstance'

function readStoredUser() {
    const raw = localStorage.getItem('ems_user')
    if (!raw) return null
    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(readStoredUser())

    async function login(username, password) {
        const response = await loginRequest(username, password)
        const { token, username: uname, role, employeeId } = response.data
        localStorage.setItem('ems_token', token)
        localStorage.setItem('ems_user', JSON.stringify({ username: uname, role, employeeId }))
        setUser({ username: uname, role, employeeId })
    }

    function logout() {
        localStorage.removeItem('ems_token')
        localStorage.removeItem('ems_user')
        setUser(null)
    }

    function hasRole(...roles) {
        return !!user && roles.includes(user.role)
    }

    const value = {
        user,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
