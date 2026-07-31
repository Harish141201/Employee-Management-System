import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

/**
 * Wraps a route. Redirects to /login if not authenticated.
 * If `roles` is given, also requires the user's role to be in that list —
 * otherwise redirects to "/" (this mirrors, but does not replace, the
 * real enforcement which happens server-side via @PreAuthorize).
 */
function ProtectedRoute({ children, roles }) {
    const { isAuthenticated, hasRole } = useAuth()
    const location = useLocation()

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (roles && !hasRole(...roles)) {
        return <Navigate to="/" replace />
    }

    return children
}

export default ProtectedRoute
