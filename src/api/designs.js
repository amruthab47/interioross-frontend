import { apiFetch, apiPost, apiPatch } from './client'
import { getAccessToken } from './client'

export const getDesignVersions  = (projectId) => apiFetch(`/designs/versions?projectId=${projectId}`)
export const getAllVersions      = ()           => apiFetch('/designs/versions')
export const updateVersionStatus = (id, status, reviewerNote = '') =>
  apiPatch(`/designs/versions/${id}/status`, { status, reviewerNote })
export const getVersionComments = (id)    => apiFetch(`/designs/versions/${id}/comments`)
export const addComment         = (id, comment) => apiPost(`/designs/versions/${id}/comments`, { comment })
export const resolveComment     = (id)    => apiPatch(`/designs/comments/${id}/resolve`, {})
export const getMoodBoards      = (projectId) => apiFetch(`/designs/moodboards?projectId=${projectId}`)
export const getAllMoodBoards    = ()          => apiFetch('/designs/moodboards')
export const getColorPalettes   = ()          => apiFetch('/designs/colorpalettes')
export const createMoodBoard    = (data)      => apiPost('/designs/moodboards', data)
export const createColorPalette = (data)      => apiPost('/designs/colorpalettes', data)

export const getLatestStudioDesign = (projectId) => apiFetch(`/designs/versions/studio?projectId=${projectId}`)
export const saveStudioDesign = (data) => apiPost('/designs/versions/studio', data)

export async function uploadDesignVersion(projectId, versionLabel, changes, file) {
  const form = new FormData()
  form.append('projectId', projectId)
  form.append('versionLabel', versionLabel)
  form.append('changes', JSON.stringify(changes))
  if (file) form.append('image', file)
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  const res = await fetch(`${BASE}/designs/versions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    body: form,
    credentials: 'include',
  })
  if (!res.ok) throw new Error((await res.json()).message)
  return res.json()
}
