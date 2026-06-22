import { apiFetch, apiPost, apiPatch } from './client'
import { getAccessToken } from './client'

export const getPurchaseOrders  = (p = {}) => apiFetch('/purchase-orders?' + new URLSearchParams(p))
export const getPurchaseOrder   = (id)     => apiFetch(`/purchase-orders/${id}`)
export const createPurchaseOrder= (data)   => apiPost('/purchase-orders', data)
export const updatePurchaseOrder= (id, d)  => apiPatch(`/purchase-orders/${id}`, d)

export async function deletePurchaseOrder(id) {
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  const res = await fetch(`${BASE}/purchase-orders/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error((await res.json()).message)
  return res.json()
}
