import { apiFetch, apiPost } from './client'
import { getAccessToken } from './client'

export const getDocuments   = (p = {}) => apiFetch('/documents?' + new URLSearchParams(p))
export const getDownloadUrl = (id)     => apiFetch(`/documents/${id}/download`)

// E-signature
export const initiateESign      = (docId)         => apiPost(`/esign/initiate/${docId}`, {})
export const verifyESign        = (sigId, otp)    => apiPost(`/esign/verify/${sigId}`, { otp })
export const getESignStatus     = (docId)         => apiFetch(`/esign/status/${docId}`)
export const getESignCertificate = (sigId)        => apiFetch(`/esign/certificate/${sigId}`)
export const getAllESignatures   = ()              => apiFetch('/esign/all')

export async function uploadDocument(data, file) {
  const form = new FormData()
  Object.entries(data).forEach(([k, v]) => form.append(k, v))
  if (file) form.append('file', file)
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  const res = await fetch(`${BASE}/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    body: form,
    credentials: 'include',
  })
  if (!res.ok) throw new Error((await res.json()).message)
  return res.json()
}
