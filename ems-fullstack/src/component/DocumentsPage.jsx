import { useCallback, useEffect, useState } from 'react'
import { listEmployees } from '../service/EmployeeService'
import { deleteDocument, downloadDocument, listDocuments, uploadDocument } from '../service/DocumentService'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import ConfirmModal from './ConfirmModal'

const DOCUMENT_TYPES = ['RESUME', 'OFFER_LETTER', 'ID_PROOF', 'CERTIFICATE', 'CONTRACT', 'OTHER']
const MAX_SIZE = 10 * 1024 * 1024

function readableType(type) { return type.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()) }
function readableSize(bytes) { return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB` }

function DocumentsPage() {
    const { hasRole, user } = useAuth()
    const { showToast } = useToast()
    const canManage = hasRole('ADMIN', 'HR')
    const [employees, setEmployees] = useState([])
    const [employeeId, setEmployeeId] = useState(user?.employeeId ? String(user.employeeId) : '')
    const [documents, setDocuments] = useState([])
    const [file, setFile] = useState(null)
    const [documentType, setDocumentType] = useState('OTHER')
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [deleteTarget, setDeleteTarget] = useState(null)

    const refresh = useCallback(() => {
        if (!employeeId) { setDocuments([]); return }
        setLoading(true); setError('')
        listDocuments(employeeId).then(response => setDocuments(response.data)).catch(() => setError('Could not load documents for this employee.')).finally(() => setLoading(false))
    }, [employeeId])

    useEffect(() => { refresh() }, [refresh])
    useEffect(() => {
        if (canManage) listEmployees({ page: 0, size: 1000, sortBy: 'firstName', direction: 'asc' })
            .then(response => setEmployees(response.data.content || []))
            .catch(() => setError('Could not load employees.'))
    }, [canManage])

    function handleUpload(event) {
        event.preventDefault()
        if (!employeeId) { setError('Choose an employee before uploading a document.'); return }
        if (!file) { setError('Select a PDF, PNG, or JPEG document to upload.'); return }
        if (file.size > MAX_SIZE) { setError('Document must be 10 MB or smaller.'); return }
        setUploading(true); setError('')
        uploadDocument(employeeId, documentType, file).then(() => { setFile(null); event.target.reset(); showToast('Document uploaded successfully'); refresh() })
            .catch(err => { const message = err?.response?.data?.message || 'Document could not be uploaded.'; setError(message); showToast(message, 'error') })
            .finally(() => setUploading(false))
    }

    function handleDownload(employeeDocument) {
        downloadDocument(employeeDocument.id).then(response => {
            const url = URL.createObjectURL(response.data)
            const link = document.createElement('a')
            link.href = url; link.download = employeeDocument.fileName; link.click()
            URL.revokeObjectURL(url)
        }).catch(() => { setError('Document could not be downloaded.'); showToast('Unable to download document', 'error') })
    }

    function handleDelete() {
        deleteDocument(deleteTarget.id).then(() => { showToast('Document deleted'); refresh() })
            .catch(() => { setError('Document could not be deleted.'); showToast('Unable to delete document', 'error') })
            .finally(() => setDeleteTarget(null))
    }

    return <div className="ph-page documents-page"><div className="ph-page-header"><div><p className="page-kicker">Records vault</p><h2>{canManage ? 'Employee documents' : 'My documents'}</h2><p className="page-subtitle">Store and retrieve employment documents securely.</p></div></div>
        {error && <div className="alert alert-danger ph-alert mb-3">{error}</div>}
        {canManage && <div className="ph-card documents-employee-select"><label className="ph-label">Employee</label><select className="ph-select" value={employeeId} onChange={event => setEmployeeId(event.target.value)}><option value="">Select an employee</option>{employees.map(employee => <option value={employee.id} key={employee.id}>{employee.firstName} {employee.lastName} - {employee.designation || 'Employee'}</option>)}</select></div>}
        <section className="ph-card document-upload-card"><div><p className="dashboard-panel__eyebrow">New document</p><h2>Upload securely</h2><p>PDF, PNG, or JPEG files only. Maximum size: 10 MB.</p></div><form onSubmit={handleUpload} className="document-upload-form"><select className="ph-select" value={documentType} onChange={event => setDocumentType(event.target.value)}>{DOCUMENT_TYPES.map(type => <option value={type} key={type}>{readableType(type)}</option>)}</select><input className="ph-input" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={event => setFile(event.target.files?.[0] || null)} /><button className="ph-btn ph-btn-primary" disabled={uploading || !employeeId}>{uploading ? 'Uploading...' : 'Upload document'}</button></form></section>
        <section className="ph-table-wrap documents-table-wrap"><div className="leave-table-heading"><div><p className="dashboard-panel__eyebrow">Document library</p><h2>{employeeId ? 'Available documents' : 'Choose an employee to view documents'}</h2></div><span>{documents.length} files</span></div><table className="ph-table"><thead><tr><th>Document</th>{canManage && <th>Employee</th>}<th>Type</th><th>Size</th><th>Uploaded</th><th></th></tr></thead><tbody>{loading ? <tr><td colSpan={canManage ? 6 : 5} className="ph-empty"><i className="bi bi-arrow-repeat dashboard-spin"></i> Loading documents...</td></tr> : !employeeId ? <tr><td colSpan={canManage ? 6 : 5} className="ph-empty">Select an employee to view their documents.</td></tr> : documents.length ? documents.map(item => <tr key={item.id}><td><span className="document-file-icon"><i className={`bi ${item.contentType === 'application/pdf' ? 'bi-file-earmark-pdf-fill' : 'bi-file-earmark-image-fill'}`}></i></span><strong>{item.fileName}</strong></td>{canManage && <td>{item.employeeName}</td>}<td><span className="ph-badge ph-badge-role-hr">{readableType(item.documentType)}</span></td><td>{readableSize(item.fileSize)}</td><td>{new Date(item.uploadedAt).toLocaleDateString()}</td><td><div className="d-flex gap-2 justify-content-end"><button className="ph-btn ph-btn-ghost" aria-label={`Download ${item.fileName}`} onClick={() => handleDownload(item)}><i className="bi bi-download"></i></button><button className="ph-btn document-delete-button" aria-label={`Delete ${item.fileName}`} onClick={() => setDeleteTarget(item)}><i className="bi bi-trash-fill"></i></button></div></td></tr>) : <tr><td colSpan={canManage ? 6 : 5} className="ph-empty">No documents have been uploaded yet.</td></tr>}</tbody></table></section>
        <ConfirmModal open={Boolean(deleteTarget)} title="Delete document?" message={deleteTarget ? `${deleteTarget.fileName} will be permanently deleted.` : ''} confirmLabel="Delete document" danger onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}/>
    </div>
}

export default DocumentsPage
