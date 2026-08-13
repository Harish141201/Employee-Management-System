import axiosClient from './axiosClient'

export const getNotifications = () => axiosClient.get('/notifications')
export const getUnreadNotificationCount = () => axiosClient.get('/notifications/unread-count')
export const markNotificationRead = notificationId => axiosClient.put(`/notifications/${notificationId}/read`)
export const markAllNotificationsRead = () => axiosClient.put('/notifications/read-all')
