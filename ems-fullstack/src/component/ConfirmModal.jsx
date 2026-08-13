function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
    if (!open) return null
    return <div className="modal-backdrop-custom" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onCancel() }}><section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title"><div className={`confirm-modal-icon ${danger ? 'is-danger' : ''}`}><i className={`bi ${danger ? 'bi-exclamation-triangle' : 'bi-question-circle'}`}></i></div><h2 id="confirm-modal-title">{title}</h2><p>{message}</p><div className="confirm-modal-actions"><button className="ph-btn ph-btn-ghost" onClick={onCancel}>Cancel</button><button className={`ph-btn ${danger ? 'ph-btn-danger' : 'ph-btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button></div></section></div>
}

export default ConfirmModal
