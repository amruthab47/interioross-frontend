import { apiFetch, apiPost } from './client'

export const getMaterials      = (p = {}) => apiFetch('/catalog/materials?' + new URLSearchParams(p))
export const getFurniture      = (p = {}) => apiFetch('/catalog/furniture?' + new URLSearchParams(p))
export const getMarketplace    = (p = {}) => apiFetch('/catalog/marketplace?' + new URLSearchParams(p))
export const getColorPalettes  = ()       => apiFetch('/designs/colorpalettes')
export const createMaterial    = (data)   => apiPost('/catalog/materials', data)
