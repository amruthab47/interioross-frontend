import { apiFetch, apiPost, apiPatch } from './client'

export const getAttendance         = (p = {}) => apiFetch('/attendance?' + new URLSearchParams(p))
export const getEmployeeAttendance = (userId, month) => apiFetch(`/attendance?userId=${userId}${month ? `&month=${month}` : ''}`)
export const submitAttendance   = (records, location) => apiPost('/attendance', { records, location })
export const getAttendanceCalendar = (month, year) => apiFetch(`/attendance/calendar?month=${month}&year=${year}`)
export const getLeaveRequests   = ()       => apiFetch('/attendance/leave-requests')
import { getAccessToken as _getToken } from './client'

export async function applyLeave(data, proofFile) {
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  const getAccessToken = _getToken
  const form = new FormData()
  form.append('leaveType', data.leaveType)
  form.append('fromDate',  data.fromDate)
  form.append('toDate',    data.toDate)
  form.append('days',      String(data.days))
  form.append('reason',    data.reason)
  if (proofFile) form.append('proof', proofFile)
  const res = await fetch(`${BASE}/attendance/leave-requests`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    body: form,
    credentials: 'include',
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed')
  return res.json()
}
export const updateLeaveStatus  = (id, status) => apiPatch(`/attendance/leave-requests/${id}`, { status })
