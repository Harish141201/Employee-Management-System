import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { getDashboardSummary } from '../service/DashboardServiceApi'
import { useAuth } from '../context/useAuth'

function StatCard({ label, value, icon, tone = 'blue', detail }) {
    return (
        <article className={`dashboard-stat dashboard-stat--${tone}`}>
            <div className="dashboard-stat__icon"><i className={`bi ${icon}`}></i></div>
            <div className="dashboard-stat__copy">
                <span>{label}</span>
                <strong>{value}</strong>
                {detail && <small>{detail}</small>}
            </div>
        </article>
    )
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return <div className="dashboard-tooltip"><strong>{label}</strong><span>{payload[0].value} team member{payload[0].value === 1 ? '' : 's'}</span></div>
}

function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [summary, setSummary] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState(null)

    const loadDashboard = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const response = await getDashboardSummary()
            setSummary(response.data)
            setLastUpdated(new Date())
        } catch {
            setError('Could not load the dashboard. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadDashboard() }, [loadDashboard])

    const chartData = useMemo(() => (summary?.headcountByDepartment || []).map(department => ({
        name: department.departmentName,
        employees: department.employeeCount,
    })), [summary])

    const largestDepartment = chartData.reduce((largest, department) => !largest || department.employees > largest.employees ? department : largest, null)
    const assignedEmployees = Math.max(0, (summary?.totalEmployees || 0) - (summary?.employeesWithoutDepartment || 0))
    const assignmentRate = summary?.totalEmployees ? Math.round((assignedEmployees / summary.totalEmployees) * 100) : 0
    const statusBreakdown = summary?.employeeStatusBreakdown || []
    const firstName = (user?.employeeName || user?.username || 'there').split(' ')[0]

    if (loading && !summary) return <div className="ph-page dashboard-loading"><i className="bi bi-arrow-repeat"></i> Loading workspace…</div>

    return (
        <div className="ph-page dashboard-page">
            <section className="dashboard-hero">
                <div>
                    <p className="dashboard-eyebrow"><i className="bi bi-stars"></i> Workforce command center</p>
                    <h1>Good to see you, {firstName}.</h1>
                    <p>Here’s a live view of your organization and the items that need attention.</p>
                </div>
                <div className="dashboard-hero__actions">
                    {lastUpdated && <span className="dashboard-updated">Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    <button className="ph-btn ph-btn-outline" onClick={loadDashboard} disabled={loading}><i className={`bi ${loading ? 'bi-arrow-repeat dashboard-spin' : 'bi-arrow-clockwise'}`}></i> Refresh</button>
                    <button className="ph-btn ph-btn-primary" onClick={() => navigate('/add-employee')}><i className="bi bi-person-plus-fill"></i> Add employee</button>
                </div>
            </section>

            {error && <div className="alert alert-danger ph-alert mb-4">{error}</div>}

            <section className="dashboard-stats" aria-label="Organization summary">
                <StatCard label="Total employees" value={summary?.totalEmployees || 0} icon="bi-people-fill" detail={`${summary?.totalDepartments || 0} active departments`} />
                <StatCard label="Active employees" value={summary?.activeEmployees || 0} icon="bi-person-check-fill" tone="green" detail="Currently active in PeopleHub" />
                <StatCard label="Employees on leave" value={summary?.employeesOnLeave || 0} icon="bi-airplane-fill" tone="amber" detail="Approved leave today" />
                <StatCard label="New this month" value={summary?.newEmployeesThisMonth || 0} icon="bi-person-plus-fill" tone="violet" detail="Based on joining date" />
                <StatCard label="Pending leave" value={summary?.pendingLeaveRequests || 0} icon="bi-calendar2-event-fill" tone="amber" detail="Requests awaiting a decision" />
                <StatCard label="Team assignment" value={`${assignmentRate}%`} icon="bi-diagram-3-fill" tone="violet" detail={`${summary?.employeesWithoutDepartment || 0} unassigned employee${summary?.employeesWithoutDepartment === 1 ? '' : 's'}`} />
                <StatCard label="Manager coverage" value={Math.max(0, (summary?.totalEmployees || 0) - (summary?.employeesWithoutManager || 0))} icon="bi-person-check-fill" tone="green" detail={`${summary?.employeesWithoutManager || 0} without a manager`} />
            </section>

            <section className="dashboard-grid">
                <article className="ph-card dashboard-panel dashboard-panel--chart">
                    <div className="dashboard-panel__header"><div><p className="dashboard-panel__eyebrow">Organization</p><h2>Headcount by department</h2></div><span className="dashboard-chip">{chartData.length} teams</span></div>
                    {chartData.length ? <div className="dashboard-chart"><ResponsiveContainer><BarChart data={chartData} margin={{ top: 12, right: 10, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ph-border-2)" /><XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--ph-muted-2)' }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--ph-muted-2)' }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} /><Bar dataKey="employees" radius={[7, 7, 0, 0]} fill="#2563eb" /></BarChart></ResponsiveContainer></div> : <div className="dashboard-empty"><i className="bi bi-bar-chart-line"></i><p>No departments to visualize yet.</p><button className="ph-btn ph-btn-ghost" onClick={() => navigate('/departments')}>Set up departments</button></div>}
                </article>

                <aside className="ph-card dashboard-panel dashboard-panel--insights">
                    <div className="dashboard-panel__header"><div><p className="dashboard-panel__eyebrow">At a glance</p><h2>Workforce pulse</h2></div></div>
                    <div className="dashboard-pulse"><div className="dashboard-pulse__chart"><ResponsiveContainer><PieChart><Pie data={[{ value: assignedEmployees }, { value: summary?.employeesWithoutDepartment || 0 }]} dataKey="value" innerRadius="64%" outerRadius="88%" startAngle={90} endAngle={-270} stroke="none">{[0, 1].map(index => <Cell key={index} fill={index ? '#e2e8f0' : '#2563eb'} />)}</Pie></PieChart></ResponsiveContainer><div><strong>{assignmentRate}%</strong><span>assigned</span></div></div><p>Employees connected to a department</p></div>
                    <div className="dashboard-insight-list">
                        <div><i className="bi bi-building-check"></i><span><strong>{largestDepartment?.name || 'No team yet'}</strong><small>{largestDepartment ? `${largestDepartment.employees} employees · largest team` : 'Create your first department'}</small></span></div>
                        <div><i className="bi bi-person-workspace"></i><span><strong>{summary?.employeesWithoutManager || 0} need manager assignment</strong><small>Keep reporting lines up to date</small></span></div>
                    </div>
                    {statusBreakdown.length > 0 && (
                        <div className="dashboard-status-breakdown">
                            <p>Employee status</p>
                            {statusBreakdown.map((item, index) => {
                                const status = item?.status || 'Unknown'
                                const statusKey = status.toLowerCase()
                                const statusLabel = statusKey.replace(/^./, char => char.toUpperCase())
                                return (
                                    <div key={`${statusKey}-${index}`}>
                                        <span>
                                            <i className={`dashboard-status-dot dashboard-status-dot--${statusKey}`}></i>
                                            {statusLabel}
                                        </span>
                                        <strong>{item?.employeeCount ?? 0}</strong>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </aside>
            </section>

            <section className="ph-card dashboard-panel dashboard-recent-panel">
                <div className="dashboard-panel__header"><div><p className="dashboard-panel__eyebrow">Latest additions</p><h2>Recent employees</h2></div><button className="dashboard-text-button" onClick={() => navigate('/emplist')}>View directory <i className="bi bi-arrow-right"></i></button></div>
                {summary?.recentEmployees?.length ? <div className="dashboard-recent-list">{summary.recentEmployees.map(employee => <button key={employee.id} onClick={() => navigate(`/employees/${employee.id}`)}><span className="dashboard-recent-avatar">{(employee.firstName || '?').charAt(0).toUpperCase()}</span><span><strong>{employee.firstName} {employee.lastName}</strong><small>{employee.designation || 'Role not set'}{employee.departmentName ? ` · ${employee.departmentName}` : ''}</small></span><time>{employee.joiningDate}</time><i className="bi bi-chevron-right"></i></button>)}</div> : <div className="dashboard-recent-empty"><i className="bi bi-people"></i><span>No employees with joining dates yet.</span></div>}
            </section>

            <section className="ph-card dashboard-panel dashboard-on-leave-panel">
                <div className="dashboard-panel__header"><div><p className="dashboard-panel__eyebrow">Availability today</p><h2>Employees currently on leave</h2></div><button className="dashboard-text-button" onClick={() => navigate('/leave')}>View leave <i className="bi bi-arrow-right"></i></button></div>
                {summary?.employeesCurrentlyOnLeave?.length ? <div className="dashboard-recent-list">{summary.employeesCurrentlyOnLeave.map(request => <button key={request.id} onClick={() => navigate('/leave')}><span className="dashboard-recent-avatar dashboard-recent-avatar--leave">{(request.employeeName || '?').charAt(0).toUpperCase()}</span><span><strong>{request.employeeName}</strong><small>{request.leaveType} leave · returns {request.endDate}</small></span><time>{request.numberOfDays} day{request.numberOfDays === 1 ? '' : 's'}</time><i className="bi bi-chevron-right"></i></button>)}</div> : <div className="dashboard-recent-empty"><i className="bi bi-calendar2-check"></i><span>No one is on approved leave today.</span></div>}
            </section>

            <section className="dashboard-bottom-grid">
                <article className="ph-card dashboard-panel">
                    <div className="dashboard-panel__header"><div><p className="dashboard-panel__eyebrow">Focus queue</p><h2>Items needing attention</h2></div><button className="dashboard-text-button" onClick={() => navigate('/leave')}>View leave <i className="bi bi-arrow-right"></i></button></div>
                    <div className="dashboard-attention-list">
                        <button onClick={() => navigate('/leave')}><span className="dashboard-attention-icon dashboard-attention-icon--amber"><i className="bi bi-calendar2-check"></i></span><span><strong>{summary?.pendingLeaveRequests || 0} pending leave request{summary?.pendingLeaveRequests === 1 ? '' : 's'}</strong><small>Review and approve employee time off</small></span><i className="bi bi-chevron-right"></i></button>
                        <button onClick={() => navigate('/emplist')}><span className="dashboard-attention-icon dashboard-attention-icon--violet"><i className="bi bi-person-plus"></i></span><span><strong>{summary?.employeesWithoutDepartment || 0} employees without a department</strong><small>Assign teams to keep reporting accurate</small></span><i className="bi bi-chevron-right"></i></button>
                    </div>
                </article>
                <article className="dashboard-quick-actions">
                    <p className="dashboard-panel__eyebrow">Shortcuts</p><h2>Move work forward</h2><div><button onClick={() => navigate('/add-employee')}><i className="bi bi-person-plus-fill"></i><span>Add employee</span></button><button onClick={() => navigate('/departments')}><i className="bi bi-diagram-3-fill"></i><span>Manage teams</span></button><button onClick={() => navigate('/emplist')}><i className="bi bi-people-fill"></i><span>Browse people</span></button></div>
                </article>
            </section>
        </div>
    )
}

export default Dashboard