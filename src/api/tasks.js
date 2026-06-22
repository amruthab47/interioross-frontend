import { apiFetch, apiPost, apiPatch, apiDelete } from './client'

export const getTasks    = (params = {}) => apiFetch('/tasks?' + new URLSearchParams(params))
export const createTask  = (data)        => apiPost('/tasks', data)
export const updateTask  = (id, data)    => apiPatch(`/tasks/${id}`, data)
export const deleteTask  = (id)          => apiDelete(`/tasks/${id}`)
