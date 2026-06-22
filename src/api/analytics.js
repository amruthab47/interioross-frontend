import { apiFetch } from './client'

export const getRevenueTrend        = (period = 'month') => apiFetch(`/analytics/revenue?period=${period}`)
export const getExpenseBreakdown    = ()                  => apiFetch('/analytics/expense-breakdown')
export const getAttendanceTrend     = (period = 'month') => apiFetch(`/analytics/attendance-trend?period=${period}`)
export const getTaskCompletionTrend = (period = 'month') => apiFetch(`/analytics/task-completion-trend?period=${period}`)
export const getRecentActivity      = ()                  => apiFetch('/analytics/activity')
