import { useState } from 'react'

function LeaveDecisionModal({ request, onConfirm, onCancel }) {
    const [note, setNote] = useState('')
    if (!request) return null
    return <div className="modal-backdrop-custom" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onCancel() }}><section className="confirm-modal leave-decision-modal" role="dialog" aria-modal="true" aria-labelledby="leave-decision-title"><div className="confirm-modal-icon is-danger"><i className="bi bi-calendar-x"></i></div><h2 id="leave-decision-title">Reject leave request?</h2><p>Share an optional note so {request.employeeName || 'the employee'} understands the decision.</p><textarea className="ph-input leave-decision-note" value={note} onChange={event => setNote(event.target.value)} placeholder="Reason for rejection (optional)" rows="3" /><div className="confirm-modal-actions"><button className="ph-btn ph-btn-ghost" onClick={onCancel}>Keep request</button><button className="ph-btn ph-btn-danger" onClick={() => onConfirm(note)}>Reject request</button></div></section></div>
}

export default LeaveDecisionModal
