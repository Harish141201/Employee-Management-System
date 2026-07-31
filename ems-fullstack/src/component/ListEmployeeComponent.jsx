import { useState, useEffect } from 'react'
import { listEmployees, deleteEmployee, getMyProfile } from '../service/EmployeeService.js'
import { listDepartments } from '../service/DepartmentService.js'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const PAGE_SIZE = 10

function ListEmployeeComponent() {
    const navigate = useNavigate()
    const { hasRole } = useAuth()
    const canManage = hasRole('ADMIN', 'HR')
    const canDelete = hasRole('ADMIN')

    const [employee, setEmployee] = useState([])
    const [myProfile, setMyProfile] = useState(null)
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
        } else {
            getMyProfile().then((response) => {
                setMyProfile(response.data)
            }).catch(() => {
                setError('Could not load your profile.')
            })
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
    function updatehandler(id) {
        navigate(`/update-employee/${id}`)
    }
    function deletehandler(id) {
        deleteEmployee(id).then(() => {
            fetchEmployees()
        }).catch(() => {
            setError('Could not delete this employee.')
        })
    }

    // EMPLOYEE-role accounts only ever see their own profile — the backend
    // rejects a full-list request from this role anyway (403), so we don't
    // even attempt it.
    if (!canManage) {
        return (
            <div className='container'>
                <h3 className='text-center mt-3'>My Profile</h3>
                {error && <div className="alert alert-danger">{error}</div>}
                {myProfile && (
                    <table className='table table-success table-striped table-bordered'>
                        <tbody>
                            <tr><th>First Name</th><td>{myProfile.firstName}</td></tr>
                            <tr><th>Last Name</th><td>{myProfile.lastName}</td></tr>
                            <tr><th>Email</th><td>{myProfile.email}</td></tr>
                            <tr><th>Department</th><td>{myProfile.departmentName || '—'}</td></tr>
                            <tr><th>Manager</th><td>{myProfile.managerName || '—'}</td></tr>
                        </tbody>
                    </table>
                )}
            </div>
        )
    }

    return (
        <>
            <div className='container'>
                <h3 className='text-center mt-3'>List Of Employees</h3>
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-2">
                    <form className="d-flex gap-2 flex-wrap" onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ minWidth: 220 }}
                        />
                        <select
                            className="form-control"
                            value={departmentId}
                            onChange={(e) => { setDepartmentId(e.target.value); setPage(0) }}
                        >
                            <option value=''>All Departments</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                        <button type="submit" className="btn btn-outline-primary">Search</button>
                    </form>
                    <button className='btn btn-danger' onClick={addNewEmployee}>Add Employee</button>
                </div>

                <table className='table table-success table-striped table-bordered table-hover'>
                    <thead>
                        <tr className='text-center'>
                            <th scope="col">Id</th>
                            <th scope="col">First Name</th>
                            <th scope="col">Last Name</th>
                            <th scope="col">Email</th>
                            <th scope="col">Department</th>
                            <th scope="col">Manager</th>
                            <th scope='col'>Update</th>
                            {canDelete && <th scope='col'>Delete</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {
                            employee.map(item =>
                                <tr key={item.id} className='text-center'>
                                    <td>{item.id}</td>
                                    <td>{item.firstName}</td>
                                    <td>{item.lastName}</td>
                                    <td>{item.email}</td>
                                    <td>{item.departmentName || '—'}</td>
                                    <td>{item.managerName || '—'}</td>
                                    <td><button className='btn btn-success' onClick={() => updatehandler(item.id)}>Update</button></td>
                                    {canDelete && (
                                        <td><button className='btn btn-primary' onClick={() => deletehandler(item.id)}>Delete</button></td>
                                    )}
                                </tr>
                            )
                        }
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <span className="text-muted small">
                            Page {page + 1} of {totalPages} ({totalElements} total)
                        </span>
                        <div className="btn-group">
                            <button
                                className="btn btn-outline-secondary"
                                disabled={page === 0}
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                            >Previous</button>
                            <button
                                className="btn btn-outline-secondary"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                            >Next</button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default ListEmployeeComponent
