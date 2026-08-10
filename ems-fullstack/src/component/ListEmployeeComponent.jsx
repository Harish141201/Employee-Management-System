import { useState, useEffect } from 'react'
import { listEmployees, deleteEmployee } from '../service/EmployeeService.js'
import { listDepartments } from '../service/DepartmentService.js'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const PAGE_SIZE = 10

const STATUS_BADGE = {
    ACTIVE: 'ph-badge-approved',
    INACTIVE: 'ph-badge-pending',
    TERMINATED: 'ph-badge-rejected',
}

function ListEmployeeComponent() {
    const navigate = useNavigate()
    const { hasRole } = useAuth()
    const canManage = hasRole('ADMIN', 'HR')
    const canDelete = hasRole('ADMIN')

    const [employee, setEmployee] = useState([])
    const [error, setError] = useState('')

    const [search, setSearch] = useState('')
    const [departmentId, setDepartmentId] = useState('')
    const [departments, setDepartments] = useState([])
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)

    useEffect(() => {
        if (canManage) {
            listDepartments().then((response) => setDepartments(response.data)).catch(() => {})
        }
    }, [canManage])

    useEffect(() => {
        if (canManage) {
            fetchEmployees()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canManage, page, departmentId])

    function fetchEmployees() {
        listEmployees({
            search: search || undefined,
            departmentId: departmentId || undefined,
            page,
            size: PAGE_SIZE,
            sortBy: 'firstName',
            direction: 'asc',
        }).then((response) => {
            setEmployee(response.data.content)
            setTotalPages(response.data.totalPages)
            setTotalElements(response.data.totalElements)
        }).catch(() => {
            setError('Could not load the employee list.')
        })
    }

    function handleSearchSubmit(e) {
        e.preventDefault()
        setPage(0)
        fetchEmployees()
    }

    function addNewEmployee() {
        navigate('/add-employee')
    }
    function viewhandler(id) {
        navigate(`/employees/${id}`)
    }
    function updatehandler(id) {
        navigate(`/update-employee/${id}`)
    }
    function deletehandler(id) {
        if (!window.confirm('Delete this employee? This cannot be undone.')) return
        deleteEmployee(id).then(() => {
            fetchEmployees()
        }).catch(() => {
            setError('Could not delete this employee.')
        })
    }

    // EMPLOYEE-role accounts don't get a roster view at all — the backend
    // rejects it (403) anyway. Send them straight to their own profile,
    // which is now a full page (view + edit + change password), not a
    // second, weaker read-only view living here too.
    if (!canManage) {
        return <Navigate to="/profile" replace />
    }

    return (
        <div className="ph-page">
            <div className="ph-page-header">
                <h2>Employees</h2>
                <button className="ph-btn ph-btn-primary" onClick={addNewEmployee}>
                    <i className="bi bi-person-plus-fill"></i> Add Employee
                </button>
            </div>

            {error && <div className="alert alert-danger ph-alert mb-3">{error}</div>}

            <form className="d-flex gap-2 flex-wrap mb-3" onSubmit={handleSearchSubmit}>
                <input
                    type="text"
                    className="ph-input"
                    placeholder="Search name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: 260 }}
                />
                <select
                    className="ph-select"
                    value={departmentId}
                    onChange={(e) => { setDepartmentId(e.target.value); setPage(0) }}
                    style={{ maxWidth: 220 }}
                >
                    <option value=''>All Departments</option>
                    {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </select>
                <button type="submit" className="ph-btn ph-btn-outline">
                    <i className="bi bi-search"></i> Search
                </button>
            </form>

            <div className="ph-table-wrap">
                {employee.length === 0 ? (
                    <div className="ph-empty">No employees match your filters.</div>
                ) : (
                    <table className="ph-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Designation</th>
                                <th>Department</th>
                                <th>Manager</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {employee.map(item => (
                                <tr key={item.id}>
                                    <td className="text-muted">{item.id}</td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => viewhandler(item.id)}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: 'var(--ph-gradient)', color: '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 13, fontWeight: 700, flexShrink: 0,
                                            }}>
                                                {item.firstName.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ color: 'var(--ph-blue)', fontWeight: 500 }}>{item.firstName} {item.lastName}</span>
                                        </div>
                                    </td>
                                    <td className="text-muted">{item.designation || '—'}</td>
                                    <td>{item.departmentName || '—'}</td>
                                    <td>{item.managerName ? <><span className="ph-chain">↳</span>{item.managerName}</> : '—'}</td>
                                    <td>
                                        {item.status
                                            ? <span className={`ph-badge ${STATUS_BADGE[item.status] || 'ph-badge-cancelled'}`}>{item.status}</span>
                                            : '—'}
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2 justify-content-end">
                                            <button className="ph-btn ph-btn-ghost" onClick={() => updatehandler(item.id)}>
                                                <i className="bi bi-pencil-fill"></i>
                                            </button>
                                            {canDelete && (
                                                <button className="ph-btn" style={{ background: 'var(--ph-danger-bg)', color: 'var(--ph-danger)' }} onClick={() => deletehandler(item.id)}>
                                                    <i className="bi bi-trash-fill"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="text-muted small">
                        Page {page + 1} of {totalPages} ({totalElements} total)
                    </span>
                    <div className="d-flex gap-2">
                        <button
                            className="ph-btn ph-btn-ghost"
                            disabled={page === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                        >Previous</button>
                        <button
                            className="ph-btn ph-btn-ghost"
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                        >Next</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ListEmployeeComponent
