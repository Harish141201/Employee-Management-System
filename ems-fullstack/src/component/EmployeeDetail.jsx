import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { editEmployee } from '../service/EmployeeService'

function Field({ label, value }) {
    return (
        <div className="col-md-6">
            <div className="ph-label" style={{ marginBottom: 2 }}>{label}</div>
            <div style={{ fontWeight: 500, color: 'var(--ph-dark)' }}>{value ?? '—'}</div>
        </div>
    )
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

    useEffect(() => {
        editEmployee(id).then((response) => setEmployee(response.data)).catch(() => {
            setError('Could not load this employee.')
        })
    }, [id])

    if (error) {
        return <div className="ph-page"><div className="alert alert-danger ph-alert">{error}</div></div>
    }
    if (!employee) {
        return <div className="ph-page text-muted">Loading...</div>
    }

    return (
        <div className="ph-page" style={{ maxWidth: 760 }}>
            <div className="ph-page-header">
                <h2>{employee.firstName} {employee.lastName}</h2>
                <div className="d-flex gap-2">
                    <button className="ph-btn ph-btn-primary" onClick={() => navigate(`/update-employee/${id}`)}>
                        <i className="bi bi-pencil-fill"></i> Edit
                    </button>
                    <button className="ph-btn ph-btn-ghost" onClick={() => navigate('/')}>Back</button>
                </div>
            </div>

            <div className="ph-card mb-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                    <div style={{
                        width: 60, height: 60, borderRadius: '50%',
                        background: 'var(--ph-gradient)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontWeight: 700,
                    }}>
                        {employee.firstName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--ph-dark)' }}>{employee.firstName} {employee.lastName}</div>
                        <div className="text-muted small">{employee.designation || 'No designation set'}{employee.departmentName ? ` · ${employee.departmentName}` : ''}</div>
                    </div>
                    {employee.status && (
                        <span className={`ph-badge ${employee.status === 'ACTIVE' ? 'ph-badge-approved' : employee.status === 'TERMINATED' ? 'ph-badge-rejected' : 'ph-badge-pending'}`} style={{ marginLeft: 'auto' }}>
                            {employee.status}
                        </span>
                    )}
                </div>

                <h6 style={{ fontWeight: 700, color: 'var(--ph-blue)', textTransform: 'uppercase', fontSize: 12.5, letterSpacing: '0.04em', marginBottom: 14 }}>Basic Information</h6>
                <div className="row g-3 mb-4">
                    <Field label="Employee ID" value={employee.id} />
                    <Field label="Email" value={employee.email} />
                    <Field label="Date of Birth" value={employee.dateOfBirth} />
                    <Field label="Gender" value={employee.gender} />
                    <Field label="Blood Group" value={employee.bloodGroup} />
                </div>

                <h6 style={{ fontWeight: 700, color: 'var(--ph-blue)', textTransform: 'uppercase', fontSize: 12.5, letterSpacing: '0.04em', marginBottom: 14 }}>Contact</h6>
                <div className="row g-3 mb-4">
                    <Field label="Phone" value={employee.phone} />
                    <Field label="Address" value={employee.address} />
                    <Field label="Emergency Contact" value={employee.emergencyContactName} />
                    <Field label="Emergency Phone" value={employee.emergencyContactPhone} />
                </div>

                <h6 style={{ fontWeight: 700, color: 'var(--ph-blue)', textTransform: 'uppercase', fontSize: 12.5, letterSpacing: '0.04em', marginBottom: 14 }}>Employment</h6>
                <div className="row g-3">
                    <Field label="Department" value={employee.departmentName} />
                    <Field label="Manager" value={employee.managerName} />
                    <Field label="Employment Type" value={employee.employmentType} />
                    <Field label="Joining Date" value={employee.joiningDate} />
                    <Field label="Annual Salary" value={formatSalary(employee.salary)} />
                </div>
            </div>
        </div>
    )
}

export default EmployeeDetail
