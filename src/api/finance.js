import { apiFetch, apiPost, apiPatch } from './client'

export const getFinanceSummary  = ()       => apiFetch('/finance/summary')
export const getInvoices        = (p = {}) => apiFetch('/finance/invoices?' + new URLSearchParams(p))
export const createInvoice      = (data)   => apiPost('/finance/invoices', data)
export const updateInvoice      = (id, d)  => apiPatch(`/finance/invoices/${id}`, d)
export const getQuotations      = (p = {}) => apiFetch('/finance/quotations?' + new URLSearchParams(p))
export const createQuotation    = (data)   => apiPost('/finance/quotations', data)
export const updateQuotationStatus = (id, status) => apiPatch(`/finance/quotations/${id}/status`, { status })
export const getPayments        = (p = {}) => apiFetch('/finance/payments?' + new URLSearchParams(p))
export const createPayment      = (data)   => apiPost('/finance/payments', data)
export const getMilestones      = (p = {}) => apiFetch('/finance/milestones?' + new URLSearchParams(p))
export const getFinancePnL      = ()       => apiFetch('/finance/pnl')

// Razorpay sandbox
export const createPaymentOrder = (invoiceId) => apiPost('/payment/create-order', { invoiceId })
export const verifyPayment      = (data)       => apiPost('/payment/verify', data)
