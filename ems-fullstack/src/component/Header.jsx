import '../style/header.css'
import { useAuth } from '../context/useAuth'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from '../service/NotificationService'

function Header({ onToggleSidebar }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const titles = { '/dashboard': 'Dashboard', '/emplist': 'Employees', '/departments': 'Departments', '/attendance': 'Attendance', '/leave': 'Leave management', '/calendar': 'Calendar', '/documents': 'Documents', '/reports': 'Reports', '/users': 'User management', '/audit-logs': 'Audit logs', '/notifications': 'Notifications', '/settings': 'Settings', '/profile': 'My profile' }

    async function handleLogout() { await logout(); navigate('/login') }
    const refreshUnreadCount = useCallback(() => { getUnreadNotificationCount().then(response => setUnreadCount(response.data.count)).catch(() => {}) }, [])
    function openNotifications() { setNotificationsOpen(open => !open); getNotifications().then(response => setNotifications(response.data)).catch(() => {}) }
    function markRead(notification) { if (notification.read) return; markNotificationRead(notification.id).then(() => { setNotifications(items => items.map(item => item.id === notification.id ? { ...item, read: true } : item)); setUnreadCount(count => Math.max(0, count - 1)) }).catch(() => {}) }
    function markAllRead() { markAllNotificationsRead().then(() => { setNotifications(items => items.map(item => ({ ...item, read: true }))); setUnreadCount(0) }).catch(() => {}) }

    useEffect(() => { refreshUnreadCount() }, [refreshUnreadCount])

    return <header className="top-header">
        <div className="topbar-container">
            <button className="sidebar-toggle" type="button" onClick={onToggleSidebar} aria-label="Open navigation"><i className="bi bi-list"></i></button>
            <div className="topbar-heading"><span><i className="bi bi-grid-1x2-fill"></i> PeopleHub workspace</span><h1>{titles[location.pathname] || 'Workspace'}</h1></div>
            <div className="topbar-actions"><div className="topbar-presence"><i className="bi bi-circle-fill"></i> Online</div><div className="notification-menu"><button className="topbar-notification" onClick={openNotifications} aria-label="Notifications" aria-expanded={notificationsOpen}><i className="bi bi-bell"></i>{unreadCount > 0 && <span>{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>{notificationsOpen && <div className="notification-popover"><div className="notification-popover-header"><div><p>Notifications</p><small>{unreadCount ? `${unreadCount} unread` : 'All caught up'}</small></div>{unreadCount > 0 && <button onClick={markAllRead}>Mark all read</button>}</div><div className="notification-list">{notifications.length ? notifications.map(notification => <button className={`notification-item${notification.read ? '' : ' is-unread'}`} key={notification.id} onClick={() => markRead(notification)}><i className={`bi ${notification.type === 'SUCCESS' ? 'bi-check-circle-fill' : notification.type === 'WARNING' ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill'}`}></i><span><strong>{notification.title}</strong><small>{notification.message}</small><time>{new Date(notification.createdAt).toLocaleDateString()}</time></span></button>) : <div className="notification-empty"><i className="bi bi-bell-slash"></i><span>No notifications yet.</span></div>}</div></div>}</div><Link to="/profile" className="topbar-user"><span className="avatar">{(user?.employeeName || user?.username || 'U').charAt(0).toUpperCase()}</span><span><strong>{user?.employeeName || user?.username}</strong><small>{user?.role} account</small></span><i className="bi bi-chevron-right"></i></Link><button className="topbar-logout" onClick={handleLogout} aria-label="Log out"><i className="bi bi-box-arrow-right"></i></button></div>
        </div>
    </header>
}

export default Header
