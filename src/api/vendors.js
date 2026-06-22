import { apiFetch, apiPost, apiPatch } from './client'

export const getVendors    = ()       => apiFetch('/vendors')
export const createVendor  = (data)   => apiPost('/vendors', data)
export const updateVendor  = (id, d)  => apiPatch(`/vendors/${id}`, d)

export const getVendorLogs   = (id)               => apiFetch(`/vendors/${id}/logs`)
export const addVendorLog    = (id, d)             => apiPost(`/vendors/${id}/logs`, d)
export const updateVendorLog = (vendorId, logId, d) => apiPatch(`/vendors/${vendorId}/logs/${logId}`, d)
export const getVendorIssues = ()                   => apiFetch('/vendors/issues')
