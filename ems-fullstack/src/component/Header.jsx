import '../style/header.css'
import { useAuth } from '../context/useAuth'
import { useNavigate, Link } from 'react-router-dom'

function Header() {
    const { user, isAuthenticated, hasRole, logout } = useAuth()
    const navigate = useNavigate()

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <>
            <nav className='navbar bg-body-primary col'>
                <div className="container d-flex justify-content-between align-items-center">
                    <a className="navbar-brand navi" href='/'>Employee Management System</a>
                    {isAuthenticated && (
                        <div className="d-flex align-items-center gap-3">
                            {hasRole('ADMIN', 'HR') && (
                                <Link to="/dashboard" className="text-decoration-none">Dashboard</Link>
                            )}
                            <span className="text-muted small">{user.username} ({user.role})</span>
                            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
                        </div>
                    )}
                </div>
            </nav>
        </>
    )
}

export default Header
