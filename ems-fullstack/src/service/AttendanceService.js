import axiosClient from './axiosClient'

export const checkIn = () => axiosClient.post('/attendance/check-in')
export const checkOut = () => axiosClient.post('/attendance/check-out')
export const getMyAttendance = () => axiosClient.get('/attendance/me')
export const getAllAttendance = (params) => axiosClient.get('/attendance', { params })
