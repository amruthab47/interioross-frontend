import { apiFetch, apiPost, apiPatch, apiDelete } from './client'

const BASE = '/vendor-quotes'

// Quote requests
export const getQuotes    = (p = {}) => apiFetch(`${BASE}?` + new URLSearchParams(p))
export const createQuote  = (data)   => apiPost(BASE, data)
export const updateQuote  = (id, d)  => apiPatch(`${BASE}/${id}`, d)
export const deleteQuote  = (id)     => apiDelete(`${BASE}/${id}`)

// Bids
export const addBid       = (id, data)        => apiPost(`${BASE}/${id}/bids`, data)
export const updateBid    = (id, bidId, data) => apiPatch(`${BASE}/${id}/bids/${bidId}`, data)
export const deleteBid    = (id, bidId)       => apiDelete(`${BASE}/${id}/bids/${bidId}`)
export const awardBid     = (id, bidId)       => apiPost(`${BASE}/${id}/award/${bidId}`, {})
export const reopenQuote  = (id)              => apiPost(`${BASE}/${id}/reopen`, {})

// Rate cards
export const getAllRateCards = ()             => apiFetch(`${BASE}/ratecards/all`)
export const getRateCard    = (vendorId)     => apiFetch(`${BASE}/ratecards/${vendorId}`)
export const saveRateCard   = (vendorId, rates) =>
  apiFetch(`${BASE}/ratecards/${vendorId}`, { method: 'PUT', body: JSON.stringify({ rates }) })
