const BASE        = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const SERVER_BASE = BASE.replace(/\/api$/, '')

// Turns a relative /uploads/... path into an absolute backend URL
export function resolveFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${SERVER_BASE}${url}`
}

let _accessToken = null
let _refreshPromise = null

export function setAccessToken(token) {
  _accessToken = token
}

export function getAccessToken() {
  return _accessToken
}

async function refreshToken() {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async r => {
      if (!r.ok) throw new Error('refresh_failed')
      const data = await r.json()
      _accessToken = data.accessToken
      return data.accessToken
    })
    .finally(() => { _refreshPromise = null })
  return _refreshPromise
}

export async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' })

  if (res.status === 401) {
    try {
      await refreshToken()
      headers['Authorization'] = `Bearer ${_accessToken}`
      const retry = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' })
      if (!retry.ok) throw await retry.json().catch(() => ({ message: 'Request failed' }))
      return retry.json()
    } catch {
      _accessToken = null
      window.location.href = '/login'
      return
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(err.message || 'Request failed')
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export async function apiPost(path, body) {
  return apiFetch(path, { method: 'POST', body: JSON.stringify(body) })
}

export async function apiPatch(path, body) {
  return apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) })
}

export async function apiDelete(path) {
  return apiFetch(path, { method: 'DELETE' })
}
