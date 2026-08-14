import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function Sidebar({ open, onClose }) {
    const { hasRole, user } = useAuth()
    const location = useLocation()
    const canManage = hasRole('ADMIN', 'HR')
    const items = canManage
        ? [
            { to: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
            { to: '/emplist', label: 'Employees', icon: 'bi-people-fill' },
            { to: '/departments', label: 'Departments', icon: 'bi-diagram-3-fill' },
            { to: '/attendance', label: 'Attendance', icon: 'bi-calendar-check-fill' },
            { to: '/leave', label: 'Leave management', icon: 'bi-calendar2-week-fill' },
            { to: '/calendar', label: 'Workforce calendar', icon: 'bi-calendar3' },
            { to: '/documents', label: 'Documents', icon: 'bi-folder2-open' },
            { to: '/reports', label: 'Reports', icon: 'bi-bar-chart-line-fill' },
            { to: '/settings', label: 'Settings', icon: 'bi-sliders' },
            { to: '/notifications', label: 'Notifications', icon: 'bi-bell-fill' },
        ]
        : [{ to: '/profile', label: 'My profile', icon: 'bi-person-badge-fill' }, { to: '/attendance', label: 'My attendance', icon: 'bi-calendar-check-fill' }, { to: '/leave', label: 'My leave', icon: 'bi-calendar2-week-fill' }, { to: '/calendar', label: 'My calendar', icon: 'bi-calendar3' }, { to: '/documents', label: 'My documents', icon: 'bi-folder2-open' }, { to: '/notifications', label: 'Notifications', icon: 'bi-bell-fill' }, { to: '/settings', label: 'Settings', icon: 'bi-sliders' }]
    if (hasRole('ADMIN')) items.push({ to: '/users', label: 'User management', icon: 'bi-person-gear' }, { to: '/audit-logs', label: 'Audit logs', icon: 'bi-journal-text' })

    return <>
        <aside className={`app-sidebar ${open ? 'is-open' : ''}`}>
            <Link to="/" className="sidebar-brand" onClick={onClose}>
                <span className="sidebar-brand__icon"><i className="bi bi-buildings-fill"></i></span>
                <span><strong>People<span>Hub</span></strong><small>Workforce platform</small></span>
            </Link>
            <div className="sidebar-section-label">Workspace</div>
            <nav className="sidebar-nav" aria-label="Workspace navigation">
                {items.map(item => <Link key={item.to} to={item.to} onClick={onClose} className={`sidebar-link ${location.pathname === item.to ? 'is-active' : ''}`}><i className={`bi ${item.icon}`}></i><span>{item.label}</span></Link>)}
            </nav>
            <div className="sidebar-spacer" />
            <div className="sidebar-section-label">Account</div>
            <Link to="/profile" onClick={onClose} className={`sidebar-link ${location.pathname === '/profile' ? 'is-active' : ''}`}><i className="bi bi-person-circle"></i><span>Profile</span></Link>
            <div className="sidebar-user"><div className="avatar">{(user?.employeeName || user?.username || 'U').charAt(0).toUpperCase()}</div><div><strong>{user?.employeeName || user?.username}</strong><small>{user?.role}</small></div></div>
        </aside>
        {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose}></button>}
    </>
}

export default Sidebar
