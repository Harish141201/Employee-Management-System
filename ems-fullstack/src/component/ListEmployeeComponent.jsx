import { useState, useEffect } from 'react'
import { listEmployees, deleteEmployee } from '../service/EmployeeService.js'
import { listDepartments } from '../service/DepartmentService.js'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import ConfirmModal from './ConfirmModal'

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
    const { showToast } = useToast()

    const [employee, setEmployee] = useState([])
    const [error, setError] = useState('')

    const [search, setSearch] = useState('')
    const [departmentId, setDepartmentId] = useState('')
    const [status, setStatus] = useState('')
    const [designation, setDesignation] = useState('')
    const [managerId, setManagerId] = useState('')
    const [joiningFrom, setJoiningFrom] = useState('')
    const [joiningTo, setJoiningTo] = useState('')
    const [sort, setSort] = useState('firstName:asc')
    const [departments, setDepartments] = useState([])
    const [managers, setManagers] = useState([])
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(false)
    const [selectedIds, setSelectedIds] = useState([])
    const [deleteTarget, setDeleteTarget] = useState(null)

    useEffect(() => {
        if (canManage) {
            listDepartments().then((response) => setDepartments(response.data)).catch(() => {})
            listEmployees({ page: 0, size: 1000, sortBy: 'firstName', direction: 'asc' }).then(response => {
                const managerMap = new Map()
                response.data.content.forEach(item => { if (item.id && item.firstName) managerMap.set(item.id, item) })
                setManagers(Array.from(managerMap.values()))
            }).catch(() => {})
        }
    }, [canManage])

    useEffect(() => {
        if (canManage) {
            fetchEmployees()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canManage, page, departmentId, status, designation, managerId, joiningFrom, joiningTo, sort])

    function fetchEmployees(requestedPage = page, filters = {}) {
        setLoading(true)
        listEmployees({
            search: (filters.searchValue ?? search) || undefined,
            departmentId: (filters.departmentValue ?? departmentId) || undefined,
            status: (filters.statusValue ?? status) || undefined,
            designation: (filters.designationValue ?? designation) || undefined,
            managerId: (filters.managerValue ?? managerId) || undefined,
            joiningFrom: (filters.joiningFromValue ?? joiningFrom) || undefined,
            joiningTo: (filters.joiningToValue ?? joiningTo) || undefined,
            page: requestedPage,
            size: PAGE_SIZE,
            sortBy: (filters.sortValue ?? sort).split(':')[0],
            direction: (filters.sortValue ?? sort).split(':')[1],
        }).then((response) => {
            setEmployee(response.data.content)
            setTotalPages(response.data.totalPages)
            setTotalElements(response.data.totalElements)
            setSelectedIds([])
        }).catch(() => {
            setError('Could not load the employee list.')
        }).finally(() => setLoading(false))
    }

    function handleSearchSubmit(e) {
        e.preventDefault()
        if (joiningFrom && joiningTo && joiningFrom > joiningTo) {
            setError('Joining date from must be on or before the joining date to.')
            return
        }
        setError('')
        setPage(0)
        fetchEmployees(0)
    }

    function clearFilters() {
        setSearch('')
        setDepartmentId('')
        setStatus('')
        setDesignation('')
        setManagerId('')
        setJoiningFrom('')
        setJoiningTo('')
        setSort('firstName:asc')
        setPage(0)
        setSelectedIds([])
        fetchEmployees(0, { searchValue: '', departmentValue: '', statusValue: '', designationValue: '', managerValue: '', joiningFromValue: '', joiningToValue: '', sortValue: 'firstName:asc' })
    }

    function toggleSelected(id) {
        setSelectedIds(ids => ids.includes(id) ? ids.filter(selectedId => selectedId !== id) : [...ids, id])
    }

    function toggleAll() {
        setSelectedIds(selectedIds.length === employee.length ? [] : employee.map(item => item.id))
    }

    function exportCsv() {
        const rows = employee.filter(item => selectedIds.length === 0 || selectedIds.includes(item.id))
        const headers = ['Employee ID', 'Name', 'Email', 'Designation', 'Department', 'Manager', 'Status']
        const values = rows.map(item => [item.id, `${item.firstName} ${item.lastName}`, item.email || '', item.designation || '', item.departmentName || '', item.managerName || '', item.status || ''])
        const csv = [headers, ...values].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'peoplehub-employees.csv'
        anchor.click()
        URL.revokeObjectURL(url)
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
        deleteEmployee(id).then(() => {
            fetchEmployees(); showToast('Employee deleted successfully')
        }).catch(() => {
            setError('Could not delete this employee.')
            showToast('Unable to delete employee', 'error')
        }).finally(() => setDeleteTarget(null))
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
            <div className="ph-page-header employee-page-header">
                <div><p className="page-kicker">People directory</p><h2>Employees</h2><p className="page-subtitle">Manage your people, reporting lines, and employee records.</p></div>
                <button className="ph-btn ph-btn-primary" onClick={addNewEmployee}>
                    <i className="bi bi-person-plus-fill"></i> Add Employee
                </button>
            </div>

            {error && <div className="alert alert-danger ph-alert mb-3">{error}</div>}

            <div className="employee-toolbar ph-card">
            <form className="employee-filters" onSubmit={handleSearchSubmit}>
                <input
                    type="text"
                    className="ph-input"
                    placeholder="Search name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: 300 }}
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
                <select className="ph-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} aria-label="Filter by status" style={{ maxWidth: 180 }}>
                    <option value=''>All statuses</option>
                    <option value='ACTIVE'>Active</option>
                    <option value='INACTIVE'>Inactive</option>
                    <option value='TERMINATED'>Terminated</option>
                </select>
                <input type="text" className="ph-input" placeholder="Designation" value={designation} onChange={e => setDesignation(e.target.value)} style={{ maxWidth: 180 }} aria-label="Filter by designation" />
                <select className="ph-select" value={managerId} onChange={e => { setManagerId(e.target.value); setPage(0) }} aria-label="Filter by manager" style={{ maxWidth: 200 }}>
                    <option value=''>All managers</option>
                    {managers.map(manager => <option key={manager.id} value={manager.id}>{manager.firstName} {manager.lastName}</option>)}
                </select>
                <input type="date" className="ph-input" value={joiningFrom} onChange={e => { setJoiningFrom(e.target.value); setPage(0) }} aria-label="Joining date from" title="Joining date from" style={{ maxWidth: 170 }} />
                <input type="date" className="ph-input" value={joiningTo} onChange={e => { setJoiningTo(e.target.value); setPage(0) }} aria-label="Joining date to" title="Joining date to" style={{ maxWidth: 170 }} />
                <select className="ph-select" value={sort} onChange={e => { setSort(e.target.value); setPage(0) }} aria-label="Sort employees" style={{ maxWidth: 190 }}>
                    <option value="firstName:asc">Name A–Z</option>
                    <option value="firstName:desc">Name Z–A</option>
                    <option value="joiningDate:desc">Newest joining date</option>
                    <option value="joiningDate:asc">Oldest joining date</option>
                    <option value="status:asc">Status</option>
                </select>
                <button type="submit" className="ph-btn ph-btn-primary">
                    <i className="bi bi-search"></i> Search
                </button>
                <button type="button" className="ph-btn ph-btn-ghost" onClick={clearFilters}><i className="bi bi-arrow-counterclockwise"></i> Clear</button>
            </form>
            <div className="employee-toolbar-footer"><span><strong>{totalElements}</strong> employees found{selectedIds.length > 0 && <em> · {selectedIds.length} selected</em>}</span><button className="ph-btn ph-btn-outline" onClick={exportCsv} disabled={!employee.length}><i className="bi bi-download"></i> Export CSV</button></div>
            </div>

            <div className="ph-table-wrap employee-directory-table">
                {loading ? (
                    <div className="ph-empty"><i className="bi bi-arrow-repeat dashboard-spin"></i><p>Loading employees…</p></div>
                ) : employee.length === 0 ? (
                    <div className="ph-empty">No employees match your filters.</div>
                ) : (
                    <table className="ph-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" aria-label="Select all employees" checked={employee.length > 0 && selectedIds.length === employee.length} onChange={toggleAll} /></th>
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
                                    <td><input type="checkbox" aria-label={`Select ${item.firstName} ${item.lastName}`} checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} /></td>
                                    <td className="text-muted">{item.id}</td>
                                    <td>
                                        <div className="employee-identity" onClick={() => viewhandler(item.id)}>
                                            <div className="employee-identity__avatar">
                                                {item.firstName.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{item.firstName} {item.lastName}</span>
                                        </div>
                                    </td>
                                    <td className="text-muted">{item.designation || '—'}</td>
                                    <td>{item.departmentName ? <span className="employee-department">{item.departmentName}</span> : '—'}</td>
                                    <td>{item.managerName ? <span className="employee-manager"><span className="ph-chain">↳</span>{item.managerName}</span> : '—'}</td>
                                    <td>
                                        {item.status
                                            ? <span className={`ph-badge ${STATUS_BADGE[item.status] || 'ph-badge-cancelled'}`}>{item.status}</span>
                                            : '—'}
                                    </td>
                                    <td>
                                        <div className="employee-row-actions">
                                            <button className="ph-btn ph-btn-ghost" aria-label={`View ${item.firstName} ${item.lastName}`} onClick={() => viewhandler(item.id)}>
                                                <i className="bi bi-eye-fill"></i>
                                            </button>
                                            <button className="ph-btn ph-btn-ghost" onClick={() => updatehandler(item.id)}>
                                                <i className="bi bi-pencil-fill"></i>
                                            </button>
                                            {canDelete && (
                                                    <button className="ph-btn" style={{ background: 'var(--ph-danger-bg)', color: 'var(--ph-danger)' }} onClick={() => setDeleteTarget(item)}>
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
                <div className="employee-pagination d-flex justify-content-between align-items-center mt-3">
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
            <ConfirmModal open={Boolean(deleteTarget)} title="Delete employee?" message={deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName} will be permanently removed if no records depend on this employee.` : ''} confirmLabel="Delete employee" danger onCancel={() => setDeleteTarget(null)} onConfirm={() => deletehandler(deleteTarget.id)} />
        </div>
    )
}

export default ListEmployeeComponent
