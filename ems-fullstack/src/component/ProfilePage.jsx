import { useEffect, useState } from 'react'
import { getMyProfile, updateMyProfile } from '../service/EmployeeService'
import { changePassword } from '../service/AuthService'
import { useToast } from '../context/useToast'

const GENDERS = ['MALE', 'FEMALE', 'OTHER']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function ReadOnlyField({ label, value }) {
    return (
        <div className="col-md-6">
            <div className="ph-label" style={{ marginBottom: 2 }}>{label}</div>
            <div style={{ fontWeight: 500, color: 'var(--ph-dark)' }}>{value || '—'}</div>
        </div>
    )
}

function ProfilePage() {
    const { showToast } = useToast()
    const [profile, setProfile] = useState(null)
    const [loadError, setLoadError] = useState('')

    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [dateOfBirth, setDateOfBirth] = useState('')
    const [gender, setGender] = useState('')
    const [bloodGroup, setBloodGroup] = useState('')
    const [emergencyContactName, setEmergencyContactName] = useState('')
    const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
    const [profileError, setProfileError] = useState('')
    const [profileSuccess, setProfileSuccess] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState('')
    const [savingPassword, setSavingPassword] = useState(false)

    useEffect(() => {
        getMyProfile().then((response) => {
            const d = response.data
            setProfile(d)
            setPhone(d.phone || '')
            setAddress(d.address || '')
            setDateOfBirth(d.dateOfBirth || '')
            setGender(d.gender || '')
            setBloodGroup(d.bloodGroup || '')
            setEmergencyContactName(d.emergencyContactName || '')
            setEmergencyContactPhone(d.emergencyContactPhone || '')
        }).catch(() => {
            setLoadError('Could not load your profile. If your account was just created, it may not be linked to an employee record yet — ask an Admin to check.')
        })
    }, [])

    function handleSaveProfile(e) {
        e.preventDefault()
        setProfileError('')
        setProfileSuccess('')
        setSavingProfile(true)
        updateMyProfile({
            phone: phone || null,
            address: address || null,
            dateOfBirth: dateOfBirth || null,
            gender: gender || null,
            bloodGroup: bloodGroup || null,
            emergencyContactName: emergencyContactName || null,
            emergencyContactPhone: emergencyContactPhone || null,
        }).then((response) => {
            setProfile(response.data)
            setProfileSuccess('Profile updated.')
            showToast('Profile updated successfully')
        }).catch((err) => {
            setProfileError(err?.response?.data?.message || 'Could not update your profile.')
        }).finally(() => setSavingProfile(false))
    }

    function handleChangePassword(e) {
        e.preventDefault()
        setPasswordError('')
        setPasswordSuccess('')

        if (newPassword !== confirmPassword) {
            setPasswordError('New password and confirmation do not match.')
            return
        }

        setSavingPassword(true)
        changePassword({ currentPassword, newPassword }).then(() => {
            setPasswordSuccess('Password changed successfully.')
            showToast('Password changed successfully')
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
        }).catch((err) => {
            setPasswordError(err?.response?.data?.message || 'Could not change your password.')
        }).finally(() => setSavingPassword(false))
    }

    if (loadError) {
        return <div className="ph-page"><div className="alert alert-danger ph-alert">{loadError}</div></div>
    }

    if (!profile) {
        return <div className="ph-page text-muted">Loading profile...</div>
    }

    return (
        <div className="ph-page profile-page">
            <div className="ph-page-header"><div><p className="page-kicker">Account settings</p><h2>My profile</h2><p className="page-subtitle">Keep your personal details current and your account secure.</p></div></div>

            <div className="ph-card profile-account-hero mb-4">
                <div className="profile-account-identity">
                    <div style={{
                        width: 60, height: 60, borderRadius: '50%',
                        background: 'var(--ph-gradient)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontWeight: 700,
                    }}>
                        {profile.firstName.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-account-copy">
                        <p className="dashboard-panel__eyebrow">Signed-in account</p>
                        <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--ph-dark)' }}>{profile.firstName} {profile.lastName}</div>
                        <div className="text-muted small">{profile.designation || 'No designation set'}{profile.departmentName ? ` · ${profile.departmentName}` : ''}</div>
                    </div><span className="ph-badge ph-badge-role-employee">{profile.status || 'ACTIVE'}</span>
                </div>

                <h6 className="profile-card-kicker">
                    Employment Details <span className="text-muted" style={{ textTransform: 'none', fontWeight: 400 }}>(managed by HR/Admin)</span>
                </h6>
                <div className="row g-3 mb-2">
                    <ReadOnlyField label="Email" value={profile.email} />
                    <ReadOnlyField label="Manager" value={profile.managerName} />
                    <ReadOnlyField label="Department" value={profile.departmentName} />
                    <ReadOnlyField label="Employment Type" value={profile.employmentType} />
                    <ReadOnlyField label="Status" value={profile.status} />
                    <ReadOnlyField label="Joining Date" value={profile.joiningDate} />
                </div>
            </div>

            <div className="ph-card profile-edit-card mb-4">
                <div className="profile-section-heading"><div><p className="dashboard-panel__eyebrow">Self-service</p><h2>Personal & contact information</h2></div><i className="bi bi-person-vcard"></i></div>
                {profileError && <div className="alert alert-danger ph-alert mb-3">{profileError}</div>}
                {profileSuccess && <div className="alert alert-success mb-3" style={{ borderRadius: 'var(--ph-radius-sm)' }}>{profileSuccess}</div>}
                <form onSubmit={handleSaveProfile}>
                    <div className="row g-3 mb-3">
                        <div className="col-md-6">
                            <label className="ph-label">Phone</label>
                            <input type="text" className="ph-input" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Address</label>
                            <input type="text" className="ph-input" value={address} onChange={e => setAddress(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="ph-label">Date of Birth</label>
                            <input type="date" className="ph-input" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="ph-label">Gender</label>
                            <select className="ph-select" value={gender} onChange={e => setGender(e.target.value)}>
                                <option value=''>Not specified</option>
                                {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="ph-label">Blood Group</label>
                            <select className="ph-select" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                                <option value=''>Not specified</option>
                                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Emergency Contact Name</label>
                            <input type="text" className="ph-input" value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="ph-label">Emergency Contact Phone</label>
                            <input type="text" className="ph-input" value={emergencyContactPhone} onChange={e => setEmergencyContactPhone(e.target.value)} />
                        </div>
                    </div>
                    <button type="submit" className="ph-btn ph-btn-primary" disabled={savingProfile}>
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            <div className="ph-card profile-password-card">
                <div className="profile-section-heading"><div><p className="dashboard-panel__eyebrow">Security</p><h2>Change password</h2></div><i className="bi bi-shield-lock"></i></div>
                {passwordError && <div className="alert alert-danger ph-alert mb-3">{passwordError}</div>}
                {passwordSuccess && <div className="alert alert-success mb-3" style={{ borderRadius: 'var(--ph-radius-sm)' }}>{passwordSuccess}</div>}
                <form onSubmit={handleChangePassword}>
                    <div className="row g-3 mb-3">
                        <div className="col-md-4">
                            <label className="ph-label">Current Password</label>
                            <input type="password" className="ph-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                        </div>
                        <div className="col-md-4">
                            <label className="ph-label">New Password</label>
                            <input type="password" className="ph-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
                            <small className={`password-strength password-strength--${newPassword.length >= 12 ? 'strong' : newPassword.length >= 8 ? 'good' : 'weak'}`}>{newPassword ? (newPassword.length >= 12 ? 'Strong password' : newPassword.length >= 8 ? 'Good password' : 'Use at least 8 characters') : 'Use at least 8 characters'}</small>
                        </div>
                        <div className="col-md-4">
                            <label className="ph-label">Confirm New Password</label>
                            <input type="password" className="ph-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
                        </div>
                    </div>
                    <button type="submit" className="ph-btn ph-btn-primary" disabled={savingPassword}>
                        {savingPassword ? 'Updating...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ProfilePage
