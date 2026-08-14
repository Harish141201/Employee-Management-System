import { useEffect, useState } from 'react'
import { listEmployees } from '../service/EmployeeService'
import { listDepartments } from '../service/DepartmentService'
import { getAllAttendance } from '../service/AttendanceService'
import { getAllLeaveRequests } from '../service/LeaveService'
import { useToast } from '../context/useToast'

function downloadCsv(name, headers, rows) {
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${name}.csv`; anchor.click(); URL.revokeObjectURL(url)
}

function ReportsPage() {
    const { showToast } = useToast()
    const [departments, setDepartments] = useState([])
    const [departmentId, setDepartmentId] = useState('')
    const [status, setStatus] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [busy, setBusy] = useState('')
    const [error, setError] = useState('')

    useEffect(() => { listDepartments().then(response => setDepartments(response.data)).catch(() => {}) }, [])
    function run(name, request, headers, toRows) {
        setBusy(name); setError('')
        request().then(response => { downloadCsv(`peoplehub-${name}`, headers, toRows(response.data)); showToast(`${name.replace('-', ' ')} exported successfully`) }).catch(() => setError(`Could not generate the ${name.replace('-', ' ')}.`)).finally(() => setBusy(''))
    }
    const employeeReport = () => run('employee-report', () => listEmployees({ page: 0, size: 1000, departmentId: departmentId || undefined, status: status || undefined, sortBy: 'firstName', direction: 'asc' }), ['ID', 'Name', 'Email', 'Department', 'Designation', 'Manager', 'Status', 'Joining date'], data => data.content.map(item => [item.id, `${item.firstName} ${item.lastName}`, item.email, item.departmentName, item.designation, item.managerName, item.status, item.joiningDate]))
    const attendanceReport = () => run('attendance-report', () => getAllAttendance({ fromDate: fromDate || undefined, toDate: toDate || undefined }), ['Employee', 'Date', 'Check-in', 'Check-out', 'Worked minutes', 'Status'], data => data.map(item => [item.employeeName, item.attendanceDate, item.checkInAt, item.checkOutAt, item.workedMinutes, item.status]))
    const leaveReport = () => run('leave-report', () => getAllLeaveRequests(), ['Employee', 'Type', 'Start', 'End', 'Days', 'Status', 'Reason'], data => data.filter(item => (!fromDate || item.startDate >= fromDate) && (!toDate || item.endDate <= toDate)).map(item => [item.employeeName, item.leaveType, item.startDate, item.endDate, item.numberOfDays, item.status, item.reason]))

    return <div className="ph-page reports-page"><div className="ph-page-header"><div><p className="page-kicker">Insights</p><h2>Reports</h2><p className="page-subtitle">Export live workforce data for analysis and sharing.</p></div></div>{error && <div className="alert alert-danger ph-alert mb-3">{error}</div>}<section className="ph-card report-filters"><div><p className="dashboard-panel__eyebrow">Export filters</p><span>Department and employment status apply to employee exports. Dates apply to attendance and leave exports.</span></div><select className="ph-select" value={departmentId} onChange={event => setDepartmentId(event.target.value)}><option value="">All departments</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select><select className="ph-select" value={status} onChange={event => setStatus(event.target.value)}><option value="">All employee statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="TERMINATED">Terminated</option></select><input className="ph-input" type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} aria-label="Report from date"/><input className="ph-input" type="date" value={toDate} onChange={event => setToDate(event.target.value)} aria-label="Report to date"/></section><section className="report-grid"><article className="ph-card report-card"><i className="bi bi-people-fill"></i><p className="dashboard-panel__eyebrow">People</p><h2>Employee report</h2><p>Employee directory, department, reporting line, and employment status.</p><button className="ph-btn ph-btn-primary" disabled={Boolean(busy)} onClick={employeeReport}>{busy === 'employee-report' ? 'Preparing...' : <><i className="bi bi-download"></i> Export CSV</>}</button></article><article className="ph-card report-card"><i className="bi bi-calendar-check-fill"></i><p className="dashboard-panel__eyebrow">Work time</p><h2>Attendance report</h2><p>Check-in, check-out, worked minutes, and attendance status.</p><button className="ph-btn ph-btn-primary" disabled={Boolean(busy)} onClick={attendanceReport}>{busy === 'attendance-report' ? 'Preparing...' : <><i className="bi bi-download"></i> Export CSV</>}</button></article><article className="ph-card report-card"><i className="bi bi-calendar2-week-fill"></i><p className="dashboard-panel__eyebrow">Time away</p><h2>Leave report</h2><p>Leave type, dates, requested days, status, and reason.</p><button className="ph-btn ph-btn-primary" disabled={Boolean(busy)} onClick={leaveReport}>{busy === 'leave-report' ? 'Preparing...' : <><i className="bi bi-download"></i> Export CSV</>}</button></article></section></div>
}

export default ReportsPage
