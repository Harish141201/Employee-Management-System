import axiosClient from './axiosClient'

export const listUsers = () => axiosClient.get('/users')
export const updateUser = (userId, payload) => axiosClient.put(`/users/${userId}`, payload)
export const resetUserPassword = (userId, newPassword) => axiosClient.put(`/users/${userId}/reset-password`, { newPassword })
