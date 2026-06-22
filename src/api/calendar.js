import { apiFetch, apiPost, apiPatch, apiDelete } from './client'

export const getCalendarEvents = (from, to) => apiFetch(`/calendar/events?from=${from}&to=${to}`)
export const createEvent       = (data)      => apiPost('/calendar/events', data)
export const updateEvent       = (id, data)  => apiPatch(`/calendar/events/${id}`, data)
export const deleteEvent       = (id)        => apiDelete(`/calendar/events/${id}`)
