import { useEffect, useState } from 'react'
import { getDashboardSummary } from '../service/DashboardServiceApi'

function SummaryCard({ label, value }) {
    return (
        <div className="col">
            <div className="card text-center h-100">
                <div className="card-body">
                    <div className="fs-2 fw-bold">{value}</div>
                    <div className="text-muted small">{label}</div>
                </div>
            </div>
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
        return <div className="container mt-3"><div className="alert alert-danger">{error}</div></div>
    }

    if (!summary) {
        return <div className="container mt-3 text-muted">Loading dashboard...</div>
    }

    const maxCount = Math.max(1, ...summary.headcountByDepartment.map(d => d.employeeCount))

    return (
        <div className="container mt-3">
            <h3 className="text-center mb-3">Dashboard</h3>

            <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
                <SummaryCard label="Total Employees" value={summary.totalEmployees} />
                <SummaryCard label="Departments" value={summary.totalDepartments} />
                <SummaryCard label="Without Department" value={summary.employeesWithoutDepartment} />
                <SummaryCard label="Without Manager" value={summary.employeesWithoutManager} />
            </div>

            <div className="card">
                <div className="card-header">Headcount by Department</div>
                <div className="card-body">
                    {summary.headcountByDepartment.length === 0 && (
                        <p className="text-muted mb-0">No departments yet.</p>
                    )}
                    {summary.headcountByDepartment.map((dept) => (
                        <div key={dept.departmentName} className="mb-2">
                            <div className="d-flex justify-content-between">
                                <span>{dept.departmentName}</span>
                                <span className="text-muted">{dept.employeeCount}</span>
                            </div>
                            <div className="progress" style={{ height: 8 }}>
                                <div
                                    className="progress-bar bg-success"
                                    style={{ width: `${(dept.employeeCount / maxCount) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
