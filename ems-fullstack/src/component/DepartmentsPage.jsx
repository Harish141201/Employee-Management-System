import { useEffect, useState } from 'react'
import { listDepartments, createDepartment, deleteDepartment } from '../service/DepartmentService'
import { useAuth } from '../context/useAuth'

function DepartmentsPage() {
    const { hasRole } = useAuth()
    const canDelete = hasRole('ADMIN')

    const [departments, setDepartments] = useState([])
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => { refresh() }, [])

    function refresh() {
        listDepartments().then((response) => setDepartments(response.data)).catch(() => {
            setError('Could not load departments.')
        })
    }

    function handleCreate(e) {
        e.preventDefault()
        setError('')
        if (!name.trim()) {
            setError('Department name is required.')
            return
        }
        setSubmitting(true)
        createDepartment({ name, description }).then(() => {
            setName('')
            setDescription('')
            refresh()
        }).catch((err) => {
            setError(err?.response?.data?.message || 'Could not create department.')
        }).finally(() => setSubmitting(false))
    }

    function handleDelete(id) {
        if (!window.confirm('Delete this department? Employees assigned to it will keep their record but lose the department link.')) return
        deleteDepartment(id).then(refresh).catch(() => {
            setError('Could not delete this department.')
        })
    }

    return (
        <div className="ph-page">
            <div className="ph-page-header"><h2>Departments</h2></div>

            {error && <div className="alert alert-danger ph-alert mb-3">{error}</div>}

            <div className="ph-card mb-4">
                <h5 className="mb-3" style={{ fontWeight: 700, color: 'var(--ph-dark)' }}>
                    <i className="bi bi-plus-circle-fill me-2" style={{ color: 'var(--ph-blue)' }}></i>
                    Add a Department
                </h5>
                <form className="d-flex gap-2 flex-wrap align-items-end" onSubmit={handleCreate}>
                    <div style={{ flex: '1 1 180px' }}>
                        <label className="ph-label">Name</label>
                        <input className="ph-input" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div style={{ flex: '2 1 260px' }}>
                        <label className="ph-label">Description (optional)</label>
                        <input className="ph-input" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <button type="submit" className="ph-btn ph-btn-primary" disabled={submitting}>
                        {submitting ? 'Adding...' : 'Add Department'}
                    </button>
                </form>
            </div>

            <div className="ph-table-wrap">
                {departments.length === 0 ? (
                    <div className="ph-empty">No departments yet — add your first one above.</div>
                ) : (
                    <table className="ph-table">
                        <thead>
                            <tr><th>Name</th><th>Description</th><th></th></tr>
                        </thead>
                        <tbody>
                            {departments.map(dept => (
                                <tr key={dept.id}>
                                    <td style={{ fontWeight: 600 }}>{dept.name}</td>
                                    <td className="text-muted">{dept.description || '—'}</td>
                                    <td className="text-end">
                                        {canDelete && (
                                            <button className="ph-btn" style={{ background: 'var(--ph-danger-bg)', color: 'var(--ph-danger)' }} onClick={() => handleDelete(dept.id)}>
                                                <i className="bi bi-trash-fill"></i>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default DepartmentsPage
