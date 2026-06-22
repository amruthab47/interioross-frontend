import { apiFetch, apiPost, getAccessToken, setAccessToken } from './client'

export const getDailyReports = (projectId) => apiFetch(`/reports?projectId=${projectId}`)
export const getAllReports    = ()           => apiFetch('/reports')

export function getGalleryPhotos(params = {}) {
  const q = new URLSearchParams()
  if (params.projectId) q.set('projectId', params.projectId)
  if (params.startDate) q.set('startDate', params.startDate)
  if (params.endDate)   q.set('endDate',   params.endDate)
  const qs = q.toString()
  return apiFetch(`/reports/photos${qs ? `?${qs}` : ''}`)
}

export async function submitReport(projectId, reportDate, summary, photos = []) {
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

  function buildForm() {
    const fd = new FormData()
    fd.append('projectId',  projectId)
    fd.append('reportDate', reportDate)
    fd.append('summary',    summary)
    photos.forEach(f => fd.append('photos', f))
    return fd
  }

  async function attempt(token) {
    return fetch(`${BASE}/reports`, {
      method:      'POST',
      headers:     { Authorization: `Bearer ${token}` },
      body:        buildForm(),
      credentials: 'include',
    })
  }

  let res = await attempt(getAccessToken())

  // Access token expired — try to refresh once and retry
  if (res.status === 401) {
    try {
      const r = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
      if (r.ok) {
        const { accessToken } = await r.json()
        setAccessToken(accessToken)
        res = await attempt(accessToken)
      }
    } catch { /* ignore refresh failure; fall through to error below */ }
  }

  if (!res.ok) {
    let msg = 'Submission failed'
    try { msg = (await res.json()).message || msg } catch {}
    throw new Error(msg)
  }
  return res.json()
}

export const sendProgressSummary = (projectId, note = '', date = '', overrideEmail = '') =>
  apiPost('/progress-summary/send', {
    projectId,
    note,
    ...(date          && { date }),
    ...(overrideEmail && { overrideEmail }),
  })
