import { useEffect, useMemo, useState } from 'react'
import { listDepartments, createDepartment, deleteDepartment } from '../service/DepartmentService'
import { useAuth } from '../context/useAuth'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/useToast'
import ConfirmModal from './ConfirmModal'

function DepartmentsPage() {
    const { hasRole } = useAuth()
    const canDelete = hasRole('ADMIN')
    const navigate = useNavigate()
    const { showToast } = useToast()
    const [departments, setDepartments] = useState([])
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [query, setQuery] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)

    function refresh() {
        setLoading(true)
        listDepartments().then(response => setDepartments(response.data)).catch(() => setError('Could not load departments.')).finally(() => setLoading(false))
    }

    useEffect(() => { refresh() }, [])

    function handleCreate(event) {
        event.preventDefault()
        setError('')
        if (!name.trim()) return setError('Department name is required.')
        setSubmitting(true)
        createDepartment({ name: name.trim(), description: description.trim() }).then(() => {
            setName(''); setDescription(''); refresh(); showToast('Department created successfully')
        }).catch(err => setError(err?.response?.data?.message || 'Could not create department.')).finally(() => setSubmitting(false))
    }

    function handleDelete(id) {
        deleteDepartment(id).then(() => { refresh(); showToast('Department deleted successfully') }).catch(() => { setError('Could not delete this department.'); showToast('Unable to delete department', 'error') })
        setDeleteTarget(null)
    }

    const filteredDepartments = useMemo(() => departments.filter(department => `${department.name} ${department.description || ''}`.toLowerCase().includes(query.toLowerCase())), [departments, query])

    return <div className="ph-page department-page">
        <div className="ph-page-header department-header"><div><p className="page-kicker">Organization structure</p><h2>Departments</h2><p className="page-subtitle">Create and organize the teams that power your workforce.</p></div><div className="department-header-stat"><strong>{departments.length}</strong><span>{departments.length === 1 ? 'department' : 'departments'} configured</span></div></div>
        {error && <div className="alert alert-danger ph-alert mb-3">{error}</div>}
        <section className="department-create ph-card"><div className="department-create-heading"><div className="department-create-icon"><i className="bi bi-plus-lg"></i></div><div><h2>Add a department</h2><p>Give your team a clear home in PeopleHub.</p></div></div><form className="department-form" onSubmit={handleCreate}><div><label className="ph-label" htmlFor="department-name">Department name</label><input id="department-name" className="ph-input" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Product & Design" /></div><div><label className="ph-label" htmlFor="department-description">Description <span>(optional)</span></label><input id="department-description" className="ph-input" value={description} onChange={event => setDescription(event.target.value)} placeholder="What does this team own?" /></div><button type="submit" className="ph-btn ph-btn-primary" disabled={submitting}><i className="bi bi-plus-circle"></i>{submitting ? 'Adding…' : 'Add department'}</button></form></section>
        <div className="department-list-header"><div><p className="dashboard-panel__eyebrow">Your organization</p><h2>All departments</h2></div><div className="department-search"><i className="bi bi-search"></i><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search departments" aria-label="Search departments" /></div></div>
        {loading ? <div className="department-grid"><div className="department-skeleton"></div><div className="department-skeleton"></div><div className="department-skeleton"></div></div> : filteredDepartments.length === 0 ? <div className="ph-card ph-empty department-empty"><i className="bi bi-diagram-3"></i><p>{departments.length ? 'No departments match your search.' : 'No departments yet.'}</p><small>{departments.length ? 'Try a different search term.' : 'Create your first department above to get started.'}</small></div> : <div className="department-grid">{filteredDepartments.map(department => <article className="department-card" key={department.id} onClick={() => navigate(`/departments/${department.id}`)}><div className="department-card-top"><div className="department-card-icon">{department.name.charAt(0).toUpperCase()}</div>{canDelete && <button className="department-delete" onClick={event => { event.stopPropagation(); setDeleteTarget(department) }} aria-label={`Delete ${department.name}`}><i className="bi bi-trash3"></i></button>}</div><h3>{department.name}</h3><p>{department.description || 'No description added for this department.'}</p><div className="department-card-metrics"><span><i className="bi bi-people-fill"></i>{department.employeeCount} total</span><span><i className="bi bi-person-check-fill"></i>{department.activeEmployeeCount} active</span>{department.employeesOnLeave > 0 && <span><i className="bi bi-airplane-fill"></i>{department.employeesOnLeave} away</span>}</div><div className="department-card-footer"><span><i className="bi bi-people"></i> View employee roster</span><small><i className="bi bi-arrow-right"></i></small></div></article>)}</div>}
        <ConfirmModal open={Boolean(deleteTarget)} title="Delete department?" message={deleteTarget ? `Employees assigned to ${deleteTarget.name} will lose their department link.` : ''} confirmLabel="Delete department" danger onCancel={() => setDeleteTarget(null)} onConfirm={() => handleDelete(deleteTarget.id)} />
    </div>
}

export default DepartmentsPage
