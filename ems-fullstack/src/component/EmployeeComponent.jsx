import { useState, useEffect } from 'react'
import { savedEmployee, updateDataEmployee, editEmployee, listEmployees } from '../service/EmployeeService'
import { listDepartments } from '../service/DepartmentService'
import { registerAccount } from '../service/AuthService'
import { useNavigate, useParams } from 'react-router-dom'

const LOGIN_ROLES = ['EMPLOYEE', 'HR', 'ADMIN']
const GENDERS = ['MALE', 'FEMALE', 'OTHER']
const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']
const STATUSES = ['ACTIVE', 'INACTIVE', 'TERMINATED']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function FormSection({ title, children }) {
    return (
        <div className="mb-4">
            <h6 style={{ fontWeight: 700, color: 'var(--ph-blue)', textTransform: 'uppercase', fontSize: 12.5, letterSpacing: '0.04em', marginBottom: 14 }}>
                {title}
            </h6>
            <div className="row g-3">
                {children}
            </div>
        </div>
    )
}

function EmployeeComponent() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [dateOfBirth, setDateOfBirth] = useState('')
    const [gender, setGender] = useState('')
    const [bloodGroup, setBloodGroup] = useState('')
    const [emergencyContactName, setEmergencyContactName] = useState('')
    const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
    const [departmentId, setDepartmentId] = useState('')
    const [managerId, setManagerId] = useState('')
    const [designation, setDesignation] = useState('')
    const [employmentType, setEmploymentType] = useState('')
    const [status, setStatus] = useState('ACTIVE')
    const [salary, setSalary] = useState('')
    const [joiningDate, setJoiningDate] = useState('')

    const [departments, setDepartments] = useState([])
    const [potentialManagers, setPotentialManagers] = useState([])
    const [errors, setErrors] = useState([])

    const [createLogin, setCreateLogin] = useState(false)
    const [loginUsername, setLoginUsername] = useState('')
    const [loginPassword, setLoginPassword] = useState('')
    const [loginRole, setLoginRole] = useState('EMPLOYEE')
    const [submitting, setSubmitting] = useState(false)

    const navigate = useNavigate()
    const { id } = useParams()
    const isEditing = Boolean(id)

    useEffect(() => {
        listDepartments().then((response) => setDepartments(response.data)).catch(() => {})
        listEmployees({ size: 1000, sortBy: 'firstName', direction: 'asc' }).then((response) => {
            setPotentialManagers(response.data.content)
        }).catch(() => {})
    }, [])

    useEffect(() => {
        if (id) {
            editEmployee(id).then((response) => {
                const d = response.data
                setFirstName(d.firstName || '')
                setLastName(d.lastName || '')
                setEmail(d.email || '')
                setPhone(d.phone || '')
                setAddress(d.address || '')
                setDateOfBirth(d.dateOfBirth || '')
                setGender(d.gender || '')
                setBloodGroup(d.bloodGroup || '')
                setEmergencyContactName(d.emergencyContactName || '')
                setEmergencyContactPhone(d.emergencyContactPhone || '')
                setDepartmentId(d.departmentId || '')
                setManagerId(d.managerId || '')
                setDesignation(d.designation || '')
                setEmploymentType(d.employmentType || '')
                setStatus(d.status || 'ACTIVE')
                setSalary(d.salary != null ? String(d.salary) : '')
                setJoiningDate(d.joiningDate || '')
            })
        }
    }, [id])

    function extractErrorMessages(error) {
        const body = error?.response?.data
        if (body?.details?.length) return body.details
        if (body?.message) return [body.message]
        return ['Something went wrong. Please try again.']
    }

    async function saveEmployee(e) {
        e.preventDefault()
        setErrors([])

        if (firstName === "" || lastName === "" || email === "") {
            setErrors(['First name, last name, and email are required.'])
            return
        }
        if (!isEditing && createLogin && (!loginUsername || !loginPassword)) {
            setErrors(['Username and password are required to create a login account.'])
            return
        }

        const employee = {
            firstName, lastName, email,
            departmentId: departmentId ? Number(departmentId) : null,
            managerId: managerId ? Number(managerId) : null,
            phone: phone || null,
            address: address || null,
            dateOfBirth: dateOfBirth || null,
            gender: gender || null,
            bloodGroup: bloodGroup || null,
            emergencyContactName: emergencyContactName || null,
            emergencyContactPhone: emergencyContactPhone || null,
            designation: designation || null,
            employmentType: employmentType || null,
            status: status || null,
            salary: salary !== '' ? Number(salary) : null,
            joiningDate: joiningDate || null,
        }

        setSubmitting(true)
        try {
            if (isEditing) {
                await updateDataEmployee(id, employee)
                navigate('/')
                return
            }

            const created = await savedEmployee(employee)

            if (createLogin) {
                try {
                    await registerAccount({
                        username: loginUsername,
                        password: loginPassword,
                        role: loginRole,
                        employeeId: created.data.id,
                    })
                } catch (loginErr) {
                    const msg = loginErr?.response?.data?.message || 'Could not create the login account.'
                    window.alert(`Employee created successfully, but the login account failed: ${msg}`)
                }
            }

            navigate('/')
        } catch (error) {
            setErrors(extractErrorMessages(error))
        } finally {
            setSubmitting(false)
        }
    }

    const managerOptions = potentialManagers.filter(m => String(m.id) !== String(id))

    return (
        <div className="ph-page" style={{ maxWidth: 760 }}>
            <div className="ph-page-header">
                <h2>{isEditing ? 'Update Employee' : 'Add Employee'}</h2>
            </div>

            <div className="ph-card">
                {errors.length > 0 && (
                    <div className="alert alert-danger ph-alert mb-3" role="alert">
                        <ul className="mb-0 ps-3">
                            {errors.map((msg, idx) => <li key={idx}>{msg}</li>)}
                        </ul>
                    </div>
                )}
                <form onSubmit={saveEmployee}>

                    <FormSection title="Basic Information">
                        <div className="col-md-6">
                            <label className="ph-label">First Name *</label>
                            <input type="text" className="ph-input" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Last Name *</label>
                            <input type="text" className="ph-input" value={lastName} onChange={e => setLastName(e.target.value)} required />
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Email *</label>
                            <input type="email" className="ph-input" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Date of Birth</label>
                            <input type="date" className="ph-input" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Gender</label>
                            <select className="ph-select" value={gender} onChange={e => setGender(e.target.value)}>
                                <option value=''>Not specified</option>
                                {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Blood Group</label>
                            <select className="ph-select" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                                <option value=''>Not specified</option>
                                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                        </div>
                    </FormSection>

                    <FormSection title="Contact Information">
                        <div className="col-md-6">
                            <label className="ph-label">Phone</label>
                            <input type="text" className="ph-input" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Address</label>
                            <input type="text" className="ph-input" value={address} onChange={e => setAddress(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Emergency Contact Name</label>
                            <input type="text" className="ph-input" value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Emergency Contact Phone</label>
                            <input type="text" className="ph-input" value={emergencyContactPhone} onChange={e => setEmergencyContactPhone(e.target.value)} />
                        </div>
                    </FormSection>

                    <FormSection title="Employment Details">
                        <div className="col-md-6">
                            <label className="ph-label">Department</label>
                            <select className="ph-select" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
                                <option value=''>No Department</option>
                                {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Manager</label>
                            <select className="ph-select" value={managerId} onChange={e => setManagerId(e.target.value)}>
                                <option value=''>No Manager</option>
                                {managerOptions.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Designation</label>
                            <input type="text" className="ph-input" placeholder="e.g. Software Engineer" value={designation} onChange={e => setDesignation(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Employment Type</label>
                            <select className="ph-select" value={employmentType} onChange={e => setEmploymentType(e.target.value)}>
                                <option value=''>Not specified</option>
                                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="ph-label">Status</label>
                            <select className="ph-select" value={status} onChange={e => setStatus(e.target.value)}>
                                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="ph-label">Salary (Annual)</label>
                            <input type="number" min="0" className="ph-input" value={salary} onChange={e => setSalary(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="ph-label">Joining Date</label>
                            <input type="date" className="ph-input" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} />
                        </div>
                    </FormSection>

                    {!isEditing && (
                        <div className="mb-4" style={{ background: 'var(--ph-bg-2)', borderRadius: 'var(--ph-radius-sm)', padding: 16 }}>
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="createLoginCheck"
                                    checked={createLogin}
                                    onChange={(e) => setCreateLogin(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="createLoginCheck" style={{ fontWeight: 600, color: 'var(--ph-dark)' }}>
                                    Also create a login account for this employee
                                </label>
                            </div>

                            {createLogin && (
                                <div className="row g-3 mt-1">
                                    <div className="col-md-4">
                                        <label className="ph-label">Username</label>
                                        <input type="text" className="ph-input" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="ph-label">Temporary Password</label>
                                        <input type="text" className="ph-input" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="At least 8 characters" />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="ph-label">Account Role</label>
                                        <select className="ph-select" value={loginRole} onChange={(e) => setLoginRole(e.target.value)}>
                                            {LOGIN_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="d-flex gap-2">
                        <button type="submit" className="ph-btn ph-btn-primary" disabled={submitting}>
                            <i className="bi bi-check-lg"></i> {submitting ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" className="ph-btn ph-btn-ghost" onClick={() => navigate('/')}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EmployeeComponent
