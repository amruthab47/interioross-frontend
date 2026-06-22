import { apiFetch, apiPost, apiPatch, apiDelete } from './client'

export const getProjects      = ()       => apiFetch('/projects')
export const getProject       = (id)     => apiFetch(`/projects/${id}`)
export const createProject    = (data)   => apiPost('/projects', data)
export const updateProject    = (id, d)  => apiPatch(`/projects/${id}`, d)
export const deleteProject    = (id)     => apiDelete(`/projects/${id}`)
export const updatePhase      = (id, slug, status) => apiPatch(`/projects/${id}/phases/${slug}`, { status })
export const getGantt         = (id)     => apiFetch(`/projects/${id}/gantt`)
export const getProjectPnL    = (id)     => apiFetch(`/projects/${id}/pnl`)
export const setSiteLocation  = (id, lat, lng, radius) => apiPatch(`/projects/${id}`, { siteLat: lat, siteLng: lng, siteRadius: radius })
