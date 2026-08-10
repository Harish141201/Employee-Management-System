import { useEffect, useState } from 'react'
import {
    applyForLeave, getMyLeaveRequests, getTeamLeaveRequests,
    getAllLeaveRequests, decideLeaveRequest, cancelLeaveRequest,
} from '../service/LeaveService'
import { useAuth } from '../context/useAuth'

const LEAVE_TYPES = ['SICK', 'CASUAL', 'EARNED', 'UNPAID']
const STATUS_BADGE = {
    PENDING: 'ph-badge-pending',
    APPROVED: 'ph-badge-approved',
    REJECTED: 'ph-badge-rejected',
    CANCELLED: 'ph-badge-cancelled',
}

function StatusBadge({ status }) {
    return <span className={`ph-badge ${STATUS_BADGE[status] || 'ph-badge-cancelled'}`}>{status}</span>
}

function RequestRow({ req, showEmployee, actions }) {
    return (
        <tr>
            {showEmployee && <td style={{ fontWeight: 600 }}>{req.employeeName}</td>}
            <td>{req.leaveType}</td>
            <td className="text-muted small">{req.startDate} → {req.endDate}</td>
            <td>{req.numberOfDays}d</td>
            <td><StatusBadge status={req.status} /></td>
            <td className="text-muted small">{req.reason || '—'}</td>
            <td>{actions}</td>
        </tr>
    )
}

function EmptyRow({ colSpan, children }) {
    return <tr><td colSpan={colSpan} className="ph-empty">{children}</td></tr>
}

function LeavePage() {
    const { hasRole } = useAuth()
    const isAdminOrHr = hasRole('ADMIN', 'HR')

    const [myRequests, setMyRequests] = useState([])
    const [teamRequests, setTeamRequests] = useState([])
    const [allRequests, setAllRequests] = useState([])
    const [statusFilter, setStatusFilter] = useState('')

    const [leaveType, setLeaveType] = useState('CASUAL')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [reason, setReason] = useState('')

    const [error, setError] = useState('')
    const [formError, setFormError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        refreshMine()
        refreshTeam()
        if (isAdminOrHr) refreshAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (isAdminOrHr) refreshAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter])

    function refreshMine() {
        getMyLeaveRequests().then(r => setMyRequests(r.data)).catch(() => setError('Could not load your leave requests.'))
    }
    function refreshTeam() {
        getTeamLeaveRequests().then(r => setTeamRequests(r.data)).catch(() => {})
    }
    function refreshAll() {
        getAllLeaveRequests(statusFilter || undefined).then(r => setAllRequests(r.data)).catch(() => setError('Could not load org-wide leave requests.'))
    }

    function handleApply(e) {
        e.preventDefault()
        setFormError('')
        if (!startDate || !endDate) {
            setFormError('Start and end dates are required.')
            return
        }
        setSubmitting(true)
        applyForLeave({ leaveType, startDate, endDate, reason }).then(() => {
            setStartDate(''); setEndDate(''); setReason('')
            refreshMine()
        }).catch((err) => {
            const body = err?.response?.data
            setFormError(body?.details?.[0] || body?.message || 'Could not submit request.')
        }).finally(() => setSubmitting(false))
    }

    function handleDecision(id, decision) {
        const note = decision === 'REJECTED' ? window.prompt('Optional note for the employee:') || '' : ''
        decideLeaveRequest(id, { decision, decisionNote: note }).then(() => {
            refreshTeam(); if (isAdminOrHr) refreshAll()
        }).catch(() => setError('Could not record that decision.'))
    }

    function handleCancel(id) {
        if (!window.confirm('Cancel this leave request?')) return
        cancelLeaveRequest(id).then(refreshMine).catch(() => setError('Could not cancel this request.'))
    }

    const pendingTeamRequests = teamRequests.filter(r => r.status === 'PENDING')

    return (
        <div className="ph-page">
            <div className="ph-page-header"><h2>Leave</h2></div>

            {error && <div className="alert alert-danger ph-alert mb-3">{error}</div>}

            {/* Apply */}
            <div className="ph-card mb-4">
                <h5 className="mb-3" style={{ fontWeight: 700, color: 'var(--ph-dark)' }}>
                    <i className="bi bi-calendar-plus-fill me-2" style={{ color: 'var(--ph-blue)' }}></i>
                    Apply for Leave
                </h5>
                {formError && <div className="alert alert-danger ph-alert mb-3">{formError}</div>}
                <form className="d-flex gap-3 flex-wrap align-items-end" onSubmit={handleApply}>
                    <div>
                        <label className="ph-label">Type</label>
                        <select className="ph-select" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                            {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="ph-label">Start Date</label>
                        <input type="date" className="ph-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="ph-label">End Date</label>
                        <input type="date" className="ph-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div style={{ flex: '1 1 220px' }}>
                        <label className="ph-label">Reason (optional)</label>
                        <input className="ph-input" value={reason} onChange={e => setReason(e.target.value)} />
                    </div>
                    <button type="submit" className="ph-btn ph-btn-primary" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>

            {/* My requests */}
            <div className="ph-table-wrap mb-4">
                <div style={{ padding: '20px 20px 0' }}>
                    <h5 style={{ fontWeight: 700, color: 'var(--ph-dark)' }}>My Requests</h5>
                </div>
                <table className="ph-table" style={{ marginTop: 12 }}>
                    <thead>
                        <tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Reason</th><th></th></tr>
                    </thead>
                    <tbody>
                        {myRequests.length === 0
                            ? <EmptyRow colSpan={6}>No leave requests yet.</EmptyRow>
                            : myRequests.map(req => (
                                <RequestRow key={req.id} req={req} actions={
                                    req.status === 'PENDING' && (
                                        <button className="ph-btn ph-btn-ghost" onClick={() => handleCancel(req.id)}>Cancel</button>
                                    )
                                } />
                            ))}
                    </tbody>
                </table>
            </div>

            {/* Team requests — only shown when there's something to show */}
            {teamRequests.length > 0 && (
                <div className="ph-table-wrap mb-4">
                    <div style={{ padding: '20px 20px 0' }}>
                        <h5 style={{ fontWeight: 700, color: 'var(--ph-dark)' }}>
                            Your Team {pendingTeamRequests.length > 0 && `(${pendingTeamRequests.length} pending)`}
                        </h5>
                    </div>
                    <table className="ph-table" style={{ marginTop: 12 }}>
                        <thead>
                            <tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Reason</th><th></th></tr>
                        </thead>
                        <tbody>
                            {teamRequests.map(req => (
                                <RequestRow key={req.id} req={req} showEmployee actions={
                                    req.status === 'PENDING' && (
                                        <div className="d-flex gap-2">
                                            <button className="ph-btn" style={{ background: 'var(--ph-success-bg)', color: 'var(--ph-success)' }} onClick={() => handleDecision(req.id, 'APPROVED')}>Approve</button>
                                            <button className="ph-btn" style={{ background: 'var(--ph-danger-bg)', color: 'var(--ph-danger)' }} onClick={() => handleDecision(req.id, 'REJECTED')}>Reject</button>
                                        </div>
                                    )
                                } />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Org-wide — Admin/HR only */}
            {isAdminOrHr && (
                <div className="ph-table-wrap">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ padding: '20px 20px 0' }}>
                        <h5 style={{ fontWeight: 700, color: 'var(--ph-dark)' }}>All Requests</h5>
                        <select className="ph-select" style={{ width: 170 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value=''>All statuses</option>
                            <option value='PENDING'>Pending</option>
                            <option value='APPROVED'>Approved</option>
                            <option value='REJECTED'>Rejected</option>
                            <option value='CANCELLED'>Cancelled</option>
                        </select>
                    </div>
                    <table className="ph-table" style={{ marginTop: 12 }}>
                        <thead>
                            <tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Reason</th><th></th></tr>
                        </thead>
                        <tbody>
                            {allRequests.length === 0
                                ? <EmptyRow colSpan={7}>No requests match this filter.</EmptyRow>
                                : allRequests.map(req => (
                                    <RequestRow key={req.id} req={req} showEmployee actions={
                                        req.status === 'PENDING' && (
                                            <div className="d-flex gap-2">
                                                <button className="ph-btn" style={{ background: 'var(--ph-success-bg)', color: 'var(--ph-success)' }} onClick={() => handleDecision(req.id, 'APPROVED')}>Approve</button>
                                                <button className="ph-btn" style={{ background: 'var(--ph-danger-bg)', color: 'var(--ph-danger)' }} onClick={() => handleDecision(req.id, 'REJECTED')}>Reject</button>
                                            </div>
                                        )
                                    } />
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default LeavePage
