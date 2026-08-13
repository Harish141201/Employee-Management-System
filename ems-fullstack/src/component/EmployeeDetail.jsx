import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { editEmployee } from '../service/EmployeeService'

const STATUS_BADGE = { ACTIVE: 'ph-badge-approved', INACTIVE: 'ph-badge-pending', TERMINATED: 'ph-badge-rejected' }

function Field({ label, value, icon }) {
    return <div className="profile-field"><span>{icon && <i className={`bi ${icon}`}></i>}{label}</span><strong>{value || 'Not provided'}</strong></div>
}

function formatSalary(salary) {
    if (salary == null) return null
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(salary)
}

function EmployeeDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [employee, setEmployee] = useState(null)
    const [error, setError] = useState('')
    const [tab, setTab] = useState('overview')

    useEffect(() => {
        editEmployee(id).then(response => setEmployee(response.data)).catch(() => setError('Could not load this employee.'))
    }, [id])

    if (error) return <div className="ph-page"><div className="alert alert-danger ph-alert">{error}</div><button className="ph-btn ph-btn-ghost" onClick={() => navigate('/emplist')}>Back to employees</button></div>
    if (!employee) return <div className="ph-page profile-loading"><i className="bi bi-arrow-repeat dashboard-spin"></i> Loading employee profile…</div>

    const fullName = `${employee.firstName} ${employee.lastName}`
    return <div className="ph-page employee-profile-page">
        <div className="profile-breadcrumb"><button onClick={() => navigate('/emplist')}><i className="bi bi-arrow-left"></i> Employees</button><span>/</span><span>{fullName}</span></div>
        <section className="profile-hero ph-card">
            <div className="profile-identity"><div className="profile-avatar">{employee.firstName.charAt(0).toUpperCase()}</div><div><p className="page-kicker">Employee profile</p><h1>{fullName}</h1><p>{employee.designation || 'Role not set'}{employee.departmentName ? ` · ${employee.departmentName}` : ''}</p><div className="profile-meta"><span><i className="bi bi-hash"></i> ID {employee.id}</span>{employee.joiningDate && <span><i className="bi bi-calendar3"></i> Joined {employee.joiningDate}</span>}</div></div></div>
            <div className="profile-hero-actions"><span className={`ph-badge ${STATUS_BADGE[employee.status] || 'ph-badge-cancelled'}`}>{employee.status || 'STATUS UNKNOWN'}</span><button className="ph-btn ph-btn-primary" onClick={() => navigate(`/update-employee/${id}`)}><i className="bi bi-pencil-fill"></i> Edit profile</button></div>
        </section>
        <nav className="profile-tabs" aria-label="Employee profile sections">{[['overview', 'Overview', 'bi-grid-1x2'], ['personal', 'Personal', 'bi-person'], ['employment', 'Employment', 'bi-briefcase']].map(([key, label, icon]) => <button key={key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}><i className={`bi ${icon}`}></i>{label}</button>)}</nav>
        {tab === 'overview' && <div className="profile-content-grid"><section className="ph-card profile-section"><div className="profile-section-heading"><div><p className="dashboard-panel__eyebrow">At a glance</p><h2>Contact information</h2></div><i className="bi bi-chat-square-text"></i></div><div className="profile-fields"><Field label="Email address" value={employee.email} icon="bi-envelope" /><Field label="Phone number" value={employee.phone} icon="bi-telephone" /><Field label="Address" value={employee.address} icon="bi-geo-alt" /><Field label="Emergency contact" value={employee.emergencyContactName ? `${employee.emergencyContactName}${employee.emergencyContactPhone ? ` · ${employee.emergencyContactPhone}` : ''}` : null} icon="bi-shield-check" /></div></section><section className="ph-card profile-section"><div className="profile-section-heading"><div><p className="dashboard-panel__eyebrow">Organization</p><h2>Reporting line</h2></div><i className="bi bi-diagram-3"></i></div><div className="profile-fields"><Field label="Department" value={employee.departmentName} icon="bi-building" /><Field label="Manager" value={employee.managerName} icon="bi-person-workspace" /><Field label="Employment type" value={employee.employmentType} icon="bi-clock-history" /><Field label="Joining date" value={employee.joiningDate} icon="bi-calendar3" /></div></section></div>}
        {tab === 'personal' && <section className="ph-card profile-section profile-single-section"><div className="profile-section-heading"><div><p className="dashboard-panel__eyebrow">Personal details</p><h2>About {employee.firstName}</h2></div><i className="bi bi-person-vcard"></i></div><div className="profile-fields profile-fields--three"><Field label="Date of birth" value={employee.dateOfBirth} icon="bi-cake2" /><Field label="Gender" value={employee.gender} icon="bi-person" /><Field label="Blood group" value={employee.bloodGroup} icon="bi-droplet" /><Field label="Email address" value={employee.email} icon="bi-envelope" /><Field label="Phone number" value={employee.phone} icon="bi-telephone" /><Field label="Emergency phone" value={employee.emergencyContactPhone} icon="bi-telephone-forward" /></div></section>}
        {tab === 'employment' && <section className="ph-card profile-section profile-single-section"><div className="profile-section-heading"><div><p className="dashboard-panel__eyebrow">Employment details</p><h2>Role and compensation</h2></div><i className="bi bi-briefcase"></i></div><div className="profile-fields profile-fields--three"><Field label="Designation" value={employee.designation} icon="bi-award" /><Field label="Department" value={employee.departmentName} icon="bi-building" /><Field label="Manager" value={employee.managerName} icon="bi-person-workspace" /><Field label="Employment type" value={employee.employmentType} icon="bi-clock-history" /><Field label="Joining date" value={employee.joiningDate} icon="bi-calendar3" /><Field label="Annual salary" value={formatSalary(employee.salary)} icon="bi-cash-stack" /></div></section>}
    </div>
}

export default EmployeeDetail
