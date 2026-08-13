import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDepartment } from '../service/DepartmentService'
import { listEmployees } from '../service/EmployeeService'

function DepartmentDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [department, setDepartment] = useState(null)
    const [employees, setEmployees] = useState([])
    const [error, setError] = useState('')

    useEffect(() => {
        Promise.all([getDepartment(id), listEmployees({ departmentId: id, page: 0, size: 100, sortBy: 'firstName', direction: 'asc' })])
            .then(([departmentResponse, employeeResponse]) => { setDepartment(departmentResponse.data); setEmployees(employeeResponse.data.content) })
            .catch(() => setError('Could not load this department.'))
    }, [id])

    if (error) return <div className="ph-page"><div className="alert alert-danger ph-alert">{error}</div><button className="ph-btn ph-btn-ghost" onClick={() => navigate('/departments')}>Back to departments</button></div>
    if (!department) return <div className="ph-page profile-loading"><i className="bi bi-arrow-repeat dashboard-spin"></i> Loading department…</div>

    return <div className="ph-page department-detail-page"><div className="profile-breadcrumb"><button onClick={() => navigate('/departments')}><i className="bi bi-arrow-left"></i> Departments</button><span>/</span><span>{department.name}</span></div><section className="ph-card department-detail-hero"><div className="department-card-icon">{department.name.charAt(0).toUpperCase()}</div><div><p className="page-kicker">Department overview</p><h1>{department.name}</h1><p>{department.description || 'No description has been added for this department.'}</p></div></section><section className="department-detail-stats"><div><i className="bi bi-people-fill"></i><span>Total employees</span><strong>{department.employeeCount}</strong></div><div><i className="bi bi-person-check-fill"></i><span>Active employees</span><strong>{department.activeEmployeeCount}</strong></div><div><i className="bi bi-airplane-fill"></i><span>On leave today</span><strong>{department.employeesOnLeave}</strong></div></section><section className="ph-card dashboard-panel"><div className="dashboard-panel__header"><div><p className="dashboard-panel__eyebrow">Team roster</p><h2>Department employees</h2></div><button className="dashboard-text-button" onClick={() => navigate(`/emplist`)}>Open directory <i className="bi bi-arrow-right"></i></button></div>{employees.length ? <div className="department-roster">{employees.map(employee => <button key={employee.id} onClick={() => navigate(`/employees/${employee.id}`)}><span className="dashboard-recent-avatar">{employee.firstName.charAt(0).toUpperCase()}</span><span><strong>{employee.firstName} {employee.lastName}</strong><small>{employee.designation || 'Role not set'}{employee.managerName ? ` · Reports to ${employee.managerName}` : ''}</small></span><span className={`ph-badge ${employee.status === 'ACTIVE' ? 'ph-badge-approved' : employee.status === 'TERMINATED' ? 'ph-badge-rejected' : 'ph-badge-pending'}`}>{employee.status}</span><i className="bi bi-chevron-right"></i></button>)}</div> : <div className="dashboard-recent-empty"><i className="bi bi-people"></i><span>No employees are assigned to this department.</span></div>}</section></div>
}

export default DepartmentDetail
