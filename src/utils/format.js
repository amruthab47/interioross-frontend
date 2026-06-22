export function formatINR(paise) {
  if (!paise && paise !== 0) return '₹0'
  const rupees = Math.round(paise / 100)
  return '₹' + rupees.toLocaleString('en-IN')
}

export function formatINRCompact(paise) {
  const r = Math.round(paise / 100)
  if (r >= 10000000) return `₹${(r / 10000000).toFixed(1)}Cr`
  if (r >= 100000)   return `₹${(r / 100000).toFixed(1)}L`
  if (r >= 1000)     return `₹${(r / 1000).toFixed(0)}k`
  return '₹' + r.toLocaleString('en-IN')
}

export function projectToRow(p) {
  return {
    id:         p._id,
    name:       p.name,
    client:     p.clientId?.name ?? '',
    supervisor: p.supervisorId?.name ?? '',
    phase:      p.currentPhase ?? '',
    progress:   p.progress ?? 0,
    status:     p.status ?? 'On Track',
    budget:     formatINR(p.budgetPaise),
    spent:      formatINR(p.spentPaise),
    budgetRaw:  p.budgetPaise,
    spentRaw:   p.spentPaise,
    address:    p.address,
    startDate:  p.startDate,
    endDate:    p.endDate,
    phases:     p.phases ?? [],
    members:    p.members ?? [],
    ganttItems: p.ganttItems ?? [],
    style:      p.style,
    areaSqft:   p.areaSqft,
  }
}
