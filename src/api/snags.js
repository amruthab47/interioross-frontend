import { apiFetch, apiPatch, apiDelete } from './client'
import { getAccessToken } from './client'

export const getSnags     = (p = {}) => apiFetch('/snags?' + new URLSearchParams(p))
export const getSnag      = (id)     => apiFetch(`/snags/${id}`)
export const updateSnag   = (id, d)  => apiPatch(`/snags/${id}`, d)
export const deleteSnag   = (id)     => apiDelete(`/snags/${id}`)

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export async function createSnag(data, photos = []) {
  const form = new FormData()
  Object.entries(data).forEach(([k, v]) => { if (v != null && v !== '') form.append(k, v) })
  photos.forEach(f => form.append('photos', f))
  const res = await fetch(`${BASE}/snags`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    body: form,
    credentials: 'include',
  })
  if (!res.ok) throw new Error((await res.json()).message)
  return res.json()
}

// photoSource: File object (new upload) OR URL string (existing Cloudinary photo)
export async function analyzeSnagPhoto(photoSource) {
  const key = import.meta.env.VITE_GROQ_API_KEY
  if (!key) throw new Error('VITE_GROQ_API_KEY not set in .env')

  let imageUrl
  if (typeof photoSource === 'string') {
    imageUrl = photoSource
  } else {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(photoSource)
    })
    imageUrl = `data:${photoSource.type || 'image/jpeg'};base64,${base64}`
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          {
            type: 'text',
            text: `You are a construction site inspector. Analyze this photo and return ONLY a JSON object — no prose, no markdown.
Fields:
- "title": short defect title, max 80 chars
- "description": 1–2 sentence description of the defect
- "severity": exactly one of "Critical", "Major", or "Minor"
  (Critical = structural/safety risk; Major = significant defect; Minor = cosmetic)
- "location": room or area if visible, else ""

Return only the JSON.`,
          },
        ],
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Groq error ${res.status}`)
  }

  const raw = (await res.json()).choices[0].message.content.trim()
  const cleaned = raw.replace(/```[a-z]*\n?/gi, '').trim()
  const parsed = JSON.parse(cleaned)

  const { title = '', description = '', severity = 'Minor', location = '' } = parsed
  const validSeverity = ['Critical', 'Major', 'Minor'].includes(severity) ? severity : 'Minor'
  return { title: String(title).slice(0, 120), description: String(description), severity: validSeverity, location: String(location) }
}

export async function uploadFixPhotos(id, photos = []) {
  const form = new FormData()
  photos.forEach(f => form.append('photos', f))
  const res = await fetch(`${BASE}/snags/${id}/fix-photos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    body: form,
    credentials: 'include',
  })
  if (!res.ok) throw new Error((await res.json()).message)
  return res.json()
}
