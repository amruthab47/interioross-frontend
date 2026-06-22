import { apiFetch, apiPatch } from './client'

export const getNotifications = (unreadOnly = false) =>
  apiFetch(`/notifications${unreadOnly ? '?unread=true' : ''}`)
export const markRead    = (id) => apiPatch(`/notifications/${id}/read`, {})
export const markAllRead = ()   => apiPatch('/notifications/read-all', {})
