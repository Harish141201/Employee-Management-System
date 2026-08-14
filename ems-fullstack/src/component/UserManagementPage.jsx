import { useEffect, useState } from 'react'
import { listEmployees } from '../service/EmployeeService'
import { listUsers, resetUserPassword, updateUser } from '../service/UserManagementService'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import ResetPasswordModal from './ResetPasswordModal'

function UserManagementPage() {
    const { user: currentUser } = useAuth()
    const { showToast } = useToast()
    const [users, setUsers] = useState([])
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState(null)
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')
    const [resetTarget, setResetTarget] = useState(null)
    const [resetting, setResetting] = useState(false)

    function refresh() {
        setLoading(true)
        Promise.all([listUsers(), listEmployees({ page: 0, size: 1000, sortBy: 'firstName', direction: 'asc' })])
            .then(([usersResponse, employeesResponse]) => { setUsers(usersResponse.data); setEmployees(employeesResponse.data.content || []) })
            .catch(() => setError('Could not load user accounts.'))
            .finally(() => setLoading(false))
    }
    useEffect(() => { refresh() }, [])

    function updateLocal(userId, field, value) { setUsers(items => items.map(item => item.id === userId ? { ...item, [field]: value } : item)) }
    function save(account) {
        setSavingId(account.id); setError('')
        updateUser(account.id, { role: account.role, employeeId: account.employeeId || null, enabled: account.enabled })
            .then(response => { setUsers(items => items.map(item => item.id === account.id ? response.data : item)); showToast('Account updated successfully') })
            .catch(err => { const message = err?.response?.data?.message || 'Account could not be updated.'; setError(message); showToast(message, 'error'); refresh() })
            .finally(() => setSavingId(null))
    }
    function resetPassword(password) {
        setResetting(true)
        resetUserPassword(resetTarget.id, password).then(() => { showToast('Password reset successfully'); setResetTarget(null) }).catch(err => { const message = err?.response?.data?.message || 'Password could not be reset.'; setError(message); showToast(message, 'error') }).finally(() => setResetting(false))
    }
    const visibleUsers = users.filter(account => `${account.username} ${account.employeeName || ''} ${account.role}`.toLowerCase().includes(query.toLowerCase()))

    return <div className="ph-page users-page"><div className="ph-page-header"><div><p className="page-kicker">Administration</p><h2>User management</h2><p className="page-subtitle">Manage account access, roles, and employee associations.</p></div></div>{error && <div className="alert alert-danger ph-alert mb-3">{error}</div>}<section className="ph-card users-toolbar"><div><i className="bi bi-shield-lock-fill"></i><span>Only administrators can manage system accounts.</span></div><input className="ph-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search accounts..." /></section><section className="ph-table-wrap users-table-wrap"><div className="leave-table-heading"><div><p className="dashboard-panel__eyebrow">Accounts</p><h2>Workspace access</h2></div><span>{visibleUsers.length} users</span></div><table className="ph-table"><thead><tr><th>Username</th><th>Role</th><th>Linked employee</th><th>Status</th><th></th></tr></thead><tbody>{loading ? <tr><td colSpan="5" className="ph-empty"><i className="bi bi-arrow-repeat dashboard-spin"></i> Loading accounts...</td></tr> : visibleUsers.length ? visibleUsers.map(account => { const isCurrentAccount = account.username === currentUser?.username; return <tr key={account.id}><td><strong>{account.username}</strong>{isCurrentAccount && <small className="user-current-label">Current account</small>}</td><td><select className="ph-select user-table-select" value={account.role} onChange={event => updateLocal(account.id, 'role', event.target.value)}><option value="ADMIN">ADMIN</option><option value="HR">HR</option><option value="EMPLOYEE">EMPLOYEE</option></select></td><td><select className="ph-select user-table-select" value={account.employeeId || ''} onChange={event => { const employee = employees.find(item => String(item.id) === event.target.value); updateLocal(account.id, 'employeeId', event.target.value ? Number(event.target.value) : null); updateLocal(account.id, 'employeeName', employee ? `${employee.firstName} ${employee.lastName}` : null) }}><option value="">No linked employee</option>{employees.map(employee => <option value={employee.id} key={employee.id}>{employee.firstName} {employee.lastName}</option>)}</select></td><td><button className={`user-status-toggle${account.enabled ? ' is-enabled' : ''}`} disabled={isCurrentAccount} onClick={() => updateLocal(account.id, 'enabled', !account.enabled)}>{account.enabled ? 'Enabled' : 'Disabled'}</button></td><td><div className="d-flex gap-2 justify-content-end"><button className="ph-btn ph-btn-ghost" onClick={() => setResetTarget(account)} aria-label={`Reset password for ${account.username}`}><i className="bi bi-key-fill"></i></button><button className="ph-btn ph-btn-primary" disabled={savingId === account.id} onClick={() => save(account)}>{savingId === account.id ? 'Saving...' : 'Save'}</button></div></td></tr>}) : <tr><td colSpan="5" className="ph-empty">No user accounts match your search.</td></tr>}</tbody></table></section><ResetPasswordModal account={resetTarget} saving={resetting} onCancel={() => setResetTarget(null)} onConfirm={resetPassword}/></div>
}

export default UserManagementPage
