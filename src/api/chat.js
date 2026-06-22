import { apiFetch, apiPost, getAccessToken } from './client'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const getChatThreads  = ()              => apiFetch('/chat/threads')
export const getChatMessages = (withId, opts = {}) => {
  const p = new URLSearchParams({ with: withId, ...opts })
  return apiFetch(`/chat/messages?${p}`)
}
export const sendMessage = (toUserId, content) => apiPost('/chat/messages', { toUserId, content })

export async function uploadChatFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${BASE}/chat/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    credentials: 'include',
    body: fd,
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Upload failed')
  return res.json()
}

export async function clearChat(withId) {
  const res = await fetch(`${BASE}/chat/messages?with=${withId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error((await res.json()).message)
  return res.json()
}
