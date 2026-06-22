import { apiFetch, apiPost, apiPatch } from './client'

export const getUsers      = (role)    => apiFetch(`/users${role ? '?role=' + role : ''}`)
export const getMe         = ()        => apiFetch('/users/me')
export const updateMe      = (data)    => apiPatch('/users/me', data)
export const createUser    = (data)    => apiPost('/users', data)
export const updateUser    = (id, d)   => apiPatch(`/users/${id}`, d)
