import { apiFetch, apiPost, apiPatch } from './client'

export const getPayroll       = (month)  => apiFetch(`/payroll?month=${month}`)
export const getPayrollMonths = ()       => apiFetch('/payroll/months')
export const generatePayroll  = (month)  => apiPost('/payroll/generate', { month })
export const recordPayment    = (id, d)  => apiPatch(`/payroll/${id}/pay`, d)
export const updatePayroll    = (id, d)  => apiPatch(`/payroll/${id}`, d)
