import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getDashboardSummary } from '../service/DashboardServiceApi'

function SummaryCard({ label, value, icon }) {
    return (
        <div className="ph-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'var(--ph-gradient)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
            }}>
                <i className={`bi ${icon}`}></i>
            </div>
            <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ph-dark)', lineHeight: 1 }}>{value}</div>
                <div className="text-muted small">{label}</div>
            </div>
        </div>
    )
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: '#fff', border: '1px solid var(--ph-border)',
            borderRadius: 10, padding: '8px 14px', boxShadow: '0 8px 20px rgba(15,23,42,0.1)',
        }}>
            <strong>{label}</strong>: {payload[0].value} employee{payload[0].value === 1 ? '' : 's'}
        </div>
    )
}

function Dashboard() {
    const [summary, setSummary] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        getDashboardSummary().then((response) => {
            setSummary(response.data)
        }).catch(() => {
            setError('Could not load the dashboard.')
        })
    }, [])

    if (error) {
        return <div className="ph-page"><div className="alert alert-danger ph-alert">{error}</div></div>
    }

    if (!summary) {
        return <div className="ph-page text-muted">Loading dashboard...</div>
    }

    const chartData = summary.headcountByDepartment.map(d => ({
        name: d.departmentName,
        employees: d.employeeCount,
    }))

    return (
        <div className="ph-page">
            <div className="ph-page-header"><h2>Dashboard</h2></div>

            <div className="row row-cols-2 row-cols-md-5 g-3 mb-4">
                <div className="col"><SummaryCard label="Total Employees" value={summary.totalEmployees} icon="bi-people-fill" /></div>
                <div className="col"><SummaryCard label="Departments" value={summary.totalDepartments} icon="bi-diagram-3-fill" /></div>
                <div className="col"><SummaryCard label="Pending Leave" value={summary.pendingLeaveRequests} icon="bi-hourglass-split" /></div>
                <div className="col"><SummaryCard label="Without Department" value={summary.employeesWithoutDepartment} icon="bi-question-circle-fill" /></div>
                <div className="col"><SummaryCard label="Without Manager" value={summary.employeesWithoutManager} icon="bi-person-x-fill" /></div>
            </div>

            <div className="ph-card">
                <h5 className="mb-4" style={{ fontWeight: 700, color: 'var(--ph-dark)' }}>Headcount by Department</h5>
                {chartData.length === 0 ? (
                    <p className="text-muted mb-0">No departments yet — add one from the Departments page.</p>
                ) : (
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ph-border-2)" />
                                <XAxis dataKey="name" tick={{ fontSize: 12.5, fill: 'var(--ph-muted-2)' }} axisLine={{ stroke: 'var(--ph-border)' }} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12.5, fill: 'var(--ph-muted-2)' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--ph-bg-2)' }} />
                                <Bar dataKey="employees" fill="#2563eb" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
