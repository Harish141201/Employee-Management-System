import axiosClient from './axiosClient'

export const listDocuments = employeeId => axiosClient.get(`/documents/employee/${employeeId}`)
export const uploadDocument = (employeeId, documentType, file) => {
    const formData = new FormData()
    formData.append('documentType', documentType)
    formData.append('file', file)
    return axiosClient.post(`/documents/employee/${employeeId}`, formData)
}
export const downloadDocument = documentId => axiosClient.get(`/documents/${documentId}/download`, { responseType: 'blob' })
export const deleteDocument = documentId => axiosClient.delete(`/documents/${documentId}`)
