import axiosClient from './axiosClient'

export const listAuditLogs = () => axiosClient.get('/audit-logs')
