import { useCallback, useEffect, useMemo, useState } from 'react'
import { checkIn, checkOut, getAllAttendance, getMyAttendance } from '../service/AttendanceService'
import { listEmployees } from '../service/EmployeeService'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'

function formatTime(value) {
    return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
}

function formatDuration(minutes) {
    if (!minutes) return 'In progress'
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function dateKey(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function monthDays(month) {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const leadingDays = (first.getDay() + 6) % 7
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return Array.from({ length: leadingDays + count }, (_, index) => {
        if (index < leadingDays) return null
        const day = index - leadingDays + 1
        return new Date(month.getFullYear(), month.getMonth(), day)
    })
}

function AttendanceCalendar({ records, month }) {
    const recordsByDate = useMemo(() => new Map(records.map(record => [record.attendanceDate, record])), [records])
    const today = dateKey(new Date())

    return <section className="ph-card attendance-calendar-card">
        <div className="leave-table-heading">
            <div><p className="dashboard-panel__eyebrow">Monthly view</p><h2>{month.toLocaleDateString([], { month: 'long', year: 'numeric' })}</h2></div>
            <span className="attendance-calendar-key"><i></i> Attendance recorded</span>
        </div>
        <div className="attendance-calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}</div>
        <div className="attendance-calendar-grid">
            {monthDays(month).map((date, index) => {
                if (!date) return <span className="attendance-calendar-blank" key={`blank-${index}`}></span>
                const currentDateKey = dateKey(date)
                const record = recordsByDate.get(currentDateKey)
                return <div className={`attendance-calendar-day${currentDateKey === today ? ' is-today' : ''}${record ? ' has-record' : ''}`} key={currentDateKey}>
                    <strong>{date.getDate()}</strong>
                    {record && <small title={`${formatTime(record.checkInAt)} - ${formatTime(record.checkOutAt)}`}>{record.checkOutAt ? formatDuration(record.workedMinutes) : 'Checked in'}</small>}
                </div>
            })}
        </div>
    </section>
}

function AttendancePage() {
    const { hasRole } = useAuth()
    const { showToast } = useToast()
    const isAdminOrHr = hasRole('ADMIN', 'HR')
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    const [employees, setEmployees] = useState([])
    const [employeeId, setEmployeeId] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')

    const refresh = useCallback(() => {
        setLoading(true)
        setError('')
        const request = isAdminOrHr ? getAllAttendance({ employeeId: employeeId || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined }) : getMyAttendance()
        request.then(response => setRecords(response.data))
            .catch(() => setError('Could not load attendance records.'))
            .finally(() => setLoading(false))
    }, [isAdminOrHr, employeeId, fromDate, toDate])

    useEffect(() => { refresh() }, [refresh])
    useEffect(() => {
        if (isAdminOrHr) listEmployees({ page: 0, size: 1000, sortBy: 'firstName', direction: 'asc' })
            .then(response => setEmployees(response.data.content || []))
            .catch(() => {})
    }, [isAdminOrHr])

    const today = dateKey(new Date())
    const todayRecord = records.find(record => record.attendanceDate === today)
    const changeMonth = offset => setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1))

    const handleAction = action => {
        setBusy(true)
        setError('')
        action()
            .then(() => { showToast(action === checkIn ? 'Checked in successfully' : 'Checked out successfully'); refresh() })
            .catch(err => {
                const message = err?.response?.data?.message || 'Attendance action could not be completed.'
                setError(message)
                showToast(message, 'error')
            })
            .finally(() => setBusy(false))
    }

    return <div className="ph-page attendance-page">
        <div className="ph-page-header"><div><p className="page-kicker">Workday</p><h2>{isAdminOrHr ? 'Attendance' : 'My attendance'}</h2><p className="page-subtitle">Track check-ins, check-outs, and working time.</p></div></div>
        {!isAdminOrHr && <section className="ph-card attendance-action-card"><div><p className="dashboard-panel__eyebrow">Today</p><h2>{todayRecord ? (todayRecord.checkOutAt ? 'Workday complete' : 'You are checked in') : 'Ready to start your day?'}</h2><p>{todayRecord ? `Checked in at ${formatTime(todayRecord.checkInAt)}` : 'Record your check-in when your workday begins.'}</p></div>{!todayRecord ? <button className="ph-btn ph-btn-primary" disabled={busy} onClick={() => handleAction(checkIn)}><i className="bi bi-box-arrow-in-right"></i> Check in</button> : !todayRecord.checkOutAt ? <button className="ph-btn ph-btn-primary" disabled={busy} onClick={() => handleAction(checkOut)}><i className="bi bi-box-arrow-right"></i> Check out</button> : <span className="ph-badge ph-badge-approved"><i className="bi bi-check-lg"></i> Completed</span>}</section>}
        {error && <div className="alert alert-danger ph-alert mb-3">{error}</div>}
        {isAdminOrHr && <div className="ph-card attendance-filters"><div className="attendance-filter-heading"><div><p className="dashboard-panel__eyebrow">Filter records</p><span>Refine the organization attendance history.</span></div><button className="ph-btn ph-btn-ghost" onClick={() => { setEmployeeId(''); setFromDate(''); setToDate('') }}><i className="bi bi-arrow-counterclockwise"></i> Clear</button></div><div className="attendance-filter-fields"><select className="ph-select" value={employeeId} onChange={event => setEmployeeId(event.target.value)}><option value="">All employees</option>{employees.map(employee => <option value={employee.id} key={employee.id}>{employee.firstName} {employee.lastName}</option>)}</select><input className="ph-input" type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} aria-label="Attendance from date"/><input className="ph-input" type="date" value={toDate} onChange={event => setToDate(event.target.value)} aria-label="Attendance to date"/></div></div>}
        {!isAdminOrHr && <><div className="attendance-calendar-controls"><button className="ph-btn ph-btn-ghost" onClick={() => changeMonth(-1)}><i className="bi bi-chevron-left"></i> Previous</button><button className="ph-btn ph-btn-ghost" onClick={() => setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Current month</button><button className="ph-btn ph-btn-ghost" onClick={() => changeMonth(1)}>Next <i className="bi bi-chevron-right"></i></button></div><AttendanceCalendar records={records} month={calendarMonth} /></>}
        <section className="ph-table-wrap attendance-table-wrap"><div className="leave-table-heading"><div><p className="dashboard-panel__eyebrow">History</p><h2>{isAdminOrHr ? 'Organization attendance' : 'My attendance history'}</h2></div><span>{records.length} records</span></div><table className="ph-table"><thead><tr>{isAdminOrHr && <th>Employee</th>}<th>Date</th><th>Check-in</th><th>Check-out</th><th>Worked time</th><th>Status</th></tr></thead><tbody>{loading ? <tr><td colSpan={isAdminOrHr ? 6 : 5} className="ph-empty"><i className="bi bi-arrow-repeat dashboard-spin"></i> Loading attendance...</td></tr> : records.length ? records.map(record => <tr key={record.id}>{isAdminOrHr && <td style={{ fontWeight: 600 }}>{record.employeeName}</td>}<td>{record.attendanceDate}</td><td>{formatTime(record.checkInAt)}</td><td>{formatTime(record.checkOutAt)}</td><td>{formatDuration(record.workedMinutes)}</td><td><span className="ph-badge ph-badge-approved">{record.status}</span></td></tr>) : <tr><td colSpan={isAdminOrHr ? 6 : 5} className="ph-empty">No attendance records yet.</td></tr>}</tbody></table></section>
    </div>
}

export default AttendancePage
