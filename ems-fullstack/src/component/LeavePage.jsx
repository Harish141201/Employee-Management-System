import { useEffect, useState } from 'react'
import {
    applyForLeave, getMyLeaveRequests, getTeamLeaveRequests,
    getAllLeaveRequests, decideLeaveRequest, cancelLeaveRequest,
} from '../service/LeaveService'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import ConfirmModal from './ConfirmModal'
import LeaveDecisionModal from './LeaveDecisionModal'

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
    const { showToast } = useToast()

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
    const [cancelTarget, setCancelTarget] = useState(null)
    const [rejectTarget, setRejectTarget] = useState(null)
    const [loadingMine, setLoadingMine] = useState(true)
    const [loadingAll, setLoadingAll] = useState(false)

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
        setLoadingMine(true)
        getMyLeaveRequests().then(r => setMyRequests(r.data)).catch(() => setError('Could not load your leave requests.')).finally(() => setLoadingMine(false))
    }
    function refreshTeam() {
        getTeamLeaveRequests().then(r => setTeamRequests(r.data)).catch(() => {})
    }
    function refreshAll() {
        setLoadingAll(true)
        getAllLeaveRequests(statusFilter || undefined).then(r => setAllRequests(r.data)).catch(() => setError('Could not load org-wide leave requests.')).finally(() => setLoadingAll(false))
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
            refreshMine(); showToast('Leave request submitted successfully')
        }).catch((err) => {
            const body = err?.response?.data
            setFormError(body?.details?.[0] || body?.message || 'Could not submit request.')
        }).finally(() => setSubmitting(false))
    }

    function handleDecision(id, decision, decisionNote = '') {
        const note = decision === 'REJECTED' ? decisionNote : ''
        decideLeaveRequest(id, { decision, decisionNote: note }).then(() => {
            refreshTeam(); if (isAdminOrHr) refreshAll(); showToast(`Leave request ${decision.toLowerCase()} successfully`)
        }).catch(() => { setError('Could not record that decision.'); showToast('Unable to record leave decision', 'error') }).finally(() => setRejectTarget(null))
    }

    function handleCancel(id) {
        cancelLeaveRequest(id).then(() => { refreshMine(); showToast('Leave request cancelled') }).catch(() => { setError('Could not cancel this request.'); showToast('Unable to cancel leave request', 'error') }).finally(() => setCancelTarget(null))
    }

    const pendingTeamRequests = teamRequests.filter(r => r.status === 'PENDING')
    const approvedMine = myRequests.filter(r => r.status === 'APPROVED').length
    const pendingMine = myRequests.filter(r => r.status === 'PENDING').length
    const totalDays = myRequests.reduce((sum, request) => sum + (request.numberOfDays || 0), 0)

    return (
        <div className="ph-page">
            <div className="ph-page-header leave-page-header"><div><p className="page-kicker">Time away</p><h2>Leave management</h2><p className="page-subtitle">Plan time off, track requests, and keep your team moving.</p></div>{isAdminOrHr && <div className="leave-pending-pill"><i className="bi bi-hourglass-split"></i><strong>{allRequests.filter(r => r.status === 'PENDING').length}</strong><span>pending approvals</span></div>}</div>

            {error && <div className="alert alert-danger ph-alert mb-3">{error}</div>}

            <div className="leave-summary-grid"><div className="leave-summary-card"><i className="bi bi-calendar2-check"></i><span>Approved requests</span><strong>{approvedMine}</strong></div><div className="leave-summary-card leave-summary-card--amber"><i className="bi bi-hourglass-split"></i><span>Pending requests</span><strong>{pendingMine}</strong></div><div className="leave-summary-card leave-summary-card--violet"><i className="bi bi-calendar3"></i><span>Days requested</span><strong>{totalDays}</strong></div></div>
            <div className="ph-card leave-apply-card mb-4"><div className="leave-section-heading"><div><p className="dashboard-panel__eyebrow">New request</p><h2>Apply for leave</h2><p>Submit time away for manager review.</p></div><i className="bi bi-calendar-plus"></i></div>
                {formError && <div className="alert alert-danger ph-alert mb-3">{formError}</div>}
                <form className="leave-form" onSubmit={handleApply}>
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
                    <div className="leave-form-reason">
                        <label className="ph-label">Reason (optional)</label>
                        <input className="ph-input" value={reason} onChange={e => setReason(e.target.value)} />
                    </div>
                    <button type="submit" className="ph-btn ph-btn-primary" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>

            {/* My requests */}
            <div className="ph-table-wrap leave-table-wrap mb-4"><div className="leave-table-heading"><div><p className="dashboard-panel__eyebrow">Your history</p><h2>My requests</h2></div><span>{myRequests.length} total</span></div>
                <table className="ph-table" style={{ marginTop: 12 }}>
                    <thead>
                        <tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Reason</th><th></th></tr>
                    </thead>
                    <tbody>
                        {loadingMine ? <EmptyRow colSpan={6}><i className="bi bi-arrow-repeat dashboard-spin"></i> Loading requests…</EmptyRow> : myRequests.length === 0
                            ? <EmptyRow colSpan={6}>No leave requests yet.</EmptyRow>
                            : myRequests.map(req => (
                                <RequestRow key={req.id} req={req} actions={
                                    req.status === 'PENDING' && (
                                        <button className="ph-btn ph-btn-ghost" onClick={() => setCancelTarget(req)}>Cancel</button>
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
                                            <button className="ph-btn" style={{ background: 'var(--ph-danger-bg)', color: 'var(--ph-danger)' }} onClick={() => setRejectTarget(req)}>Reject</button>
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
                    <div className="leave-table-heading"><div><p className="dashboard-panel__eyebrow">Administration</p><h2>All requests</h2></div>
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
                            {loadingAll ? <EmptyRow colSpan={7}><i className="bi bi-arrow-repeat dashboard-spin"></i> Loading requests…</EmptyRow> : allRequests.length === 0
                                ? <EmptyRow colSpan={7}>No requests match this filter.</EmptyRow>
                                : allRequests.map(req => (
                                    <RequestRow key={req.id} req={req} showEmployee actions={
                                        req.status === 'PENDING' && (
                                            <div className="d-flex gap-2">
                                                <button className="ph-btn" style={{ background: 'var(--ph-success-bg)', color: 'var(--ph-success)' }} onClick={() => handleDecision(req.id, 'APPROVED')}>Approve</button>
                                                <button className="ph-btn" style={{ background: 'var(--ph-danger-bg)', color: 'var(--ph-danger)' }} onClick={() => setRejectTarget(req)}>Reject</button>
                                            </div>
                                        )
                                    } />
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
            <ConfirmModal open={Boolean(cancelTarget)} title="Cancel leave request?" message="This pending request will be marked as cancelled and will no longer be available for approval." confirmLabel="Cancel request" danger onCancel={() => setCancelTarget(null)} onConfirm={() => handleCancel(cancelTarget.id)} />
            <LeaveDecisionModal request={rejectTarget} onCancel={() => setRejectTarget(null)} onConfirm={note => handleDecision(rejectTarget.id, 'REJECTED', note)} />
        </div>
    )
}

export default LeavePage
