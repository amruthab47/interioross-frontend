import { apiFetch, apiPost, apiPatch } from './client'

export const getClients   = ()      => apiFetch('/clients')
export const getClient    = (id)    => apiFetch(`/clients/${id}`)
export const createClient = (data)  => apiPost('/clients', data)
export const updateClient = (id, d) => apiPatch(`/clients/${id}`, d)
