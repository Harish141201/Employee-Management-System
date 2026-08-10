import { useState } from 'react'
import { login as loginRequest, logoutRequest } from '../service/AuthService'
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
        const { token, refreshToken, username: uname, role, employeeId, employeeName } = response.data
        localStorage.setItem('ems_token', token)
        localStorage.setItem('ems_refresh_token', refreshToken)
        localStorage.setItem('ems_user', JSON.stringify({ username: uname, role, employeeId, employeeName }))
        const loggedInUser = { username: uname, role, employeeId, employeeName }
        setUser(loggedInUser)
        return loggedInUser
    }

    async function logout() {
        const refreshToken = localStorage.getItem('ems_refresh_token')
        // Best-effort: tell the server to invalidate the refresh token so
        // it can't be used again, but don't let a failed network call
        // (or an already-expired session) block clearing local state —
        // the user should always be able to "feel" logged out locally.
        if (refreshToken) {
            try {
                await logoutRequest(refreshToken)
            } catch {
                // ignore — clearing local state below is what actually matters here
            }
        }
        localStorage.removeItem('ems_token')
        localStorage.removeItem('ems_refresh_token')
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
