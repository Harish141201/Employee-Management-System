import { useEffect, useMemo, useState } from 'react'
import { listAuditLogs } from '../service/AuditLogService'

function AuditLogsPage() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')
    const [action, setAction] = useState('')

    useEffect(() => { listAuditLogs().then(response => setLogs(response.data)).catch(() => setError('Could not load audit history.')).finally(() => setLoading(false)) }, [])
    const actions = useMemo(() => [...new Set(logs.map(log => log.action))], [logs])
    const visibleLogs = logs.filter(log => (!action || log.action === action) && `${log.username} ${log.description} ${log.entityType}`.toLowerCase().includes(query.toLowerCase()))

    return <div className="ph-page audit-page"><div className="ph-page-header"><div><p className="page-kicker">Administration</p><h2>Audit logs</h2><p className="page-subtitle">A read-only record of important administrative actions.</p></div></div>{error && <div className="alert alert-danger ph-alert mb-3">{error}</div>}<section className="ph-card audit-toolbar"><div><i className="bi bi-shield-check"></i><span>Audit records cannot be edited or removed.</span></div><div><input className="ph-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search activity..."/><select className="ph-select" value={action} onChange={event => setAction(event.target.value)}><option value="">All actions</option>{actions.map(value => <option value={value} key={value}>{value.replaceAll('_', ' ')}</option>)}</select></div></section><section className="ph-table-wrap audit-table-wrap"><div className="leave-table-heading"><div><p className="dashboard-panel__eyebrow">Activity</p><h2>Recent history</h2></div><span>{visibleLogs.length} events</span></div><table className="ph-table"><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Description</th></tr></thead><tbody>{loading ? <tr><td colSpan="5" className="ph-empty"><i className="bi bi-arrow-repeat dashboard-spin"></i> Loading audit logs...</td></tr> : visibleLogs.length ? visibleLogs.map(log => <tr key={log.id}><td>{new Date(log.createdAt).toLocaleString()}</td><td><strong>{log.username}</strong></td><td><span className="ph-badge ph-badge-role-hr">{log.action.replaceAll('_', ' ')}</span></td><td>{log.entityType} #{log.entityId}</td><td>{log.description}</td></tr>) : <tr><td colSpan="5" className="ph-empty">No audit records match your filters.</td></tr>}</tbody></table></section></div>
}

export default AuditLogsPage
