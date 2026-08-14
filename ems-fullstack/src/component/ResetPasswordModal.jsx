import { useState } from 'react'

function ResetPasswordModal({ account, onCancel, onConfirm, saving }) {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    if (!account) return null
    function submit(event) {
        event.preventDefault()
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(password)) { setError('Use at least 8 characters with uppercase, lowercase, and a number.'); return }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return }
        onConfirm(password)
    }
    return <div className="modal-backdrop-custom" role="presentation"><form className="confirm-modal reset-password-modal" onSubmit={submit}><div className="confirm-modal-icon"><i className="bi bi-key-fill"></i></div><h2>Reset password</h2><p>Set a new password for <strong>{account.username}</strong>. They should change it after their next sign-in.</p>{error && <div className="alert alert-danger ph-alert mb-3">{error}</div>}<input className="ph-input mb-2" type="password" autoFocus placeholder="New password" value={password} onChange={event => setPassword(event.target.value)} /><input className="ph-input mb-3" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /><div className="confirm-modal-actions"><button type="button" className="ph-btn ph-btn-ghost" onClick={onCancel}>Cancel</button><button type="submit" className="ph-btn ph-btn-primary" disabled={saving}>{saving ? 'Resetting...' : 'Reset password'}</button></div></form></div>
}

export default ResetPasswordModal
