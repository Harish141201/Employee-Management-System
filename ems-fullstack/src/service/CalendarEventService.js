import axiosClient from './axiosClient'
export const getCalendarEvents = () => axiosClient.get('/calendar-events')
export const createCalendarEvent = event => axiosClient.post('/calendar-events', event)
export const deleteCalendarEvent = id => axiosClient.delete(`/calendar-events/${id}`)
