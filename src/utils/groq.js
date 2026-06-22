const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function callGroq(messages) {
  const key = import.meta.env.VITE_GROQ_API_KEY
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.65,
      max_tokens: 900,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `Groq API error ${res.status}`)
  }
  return (await res.json()).choices[0].message.content
}

export function buildSystemPrompt(user, {
  projects, financeSummary, expenseBreakdown, invoices,
  supervisorData, recentActivity, notifications: notifs,
}) {
  let ctx = ''

  if (user.role === 'Admin') {
    const overdue = invoices.filter(i => i.status === 'Overdue')
    const unread  = (notifs.Admin ?? []).filter(n => n.unread)
    ctx = `
ACTIVE PROJECTS (${projects.length} total):
${projects.map(p =>
  `• **${p.name}** — ${p.status}, ${p.progress}% done, ${p.phase} phase, Budget: ${p.budget}, Supervisor: ${p.supervisor}`
).join('\n')}

FINANCE SUMMARY (FY 2025-26):
• Revenue: ${financeSummary.revenue} | Expenses: ${financeSummary.expenses} | Net Profit: ${financeSummary.profit}
• Pending invoices: ${financeSummary.pendingInvoices} | Profit margin: ~${Math.round((financeSummary.profitRaw / financeSummary.revenueRaw) * 100)}%
• Expense breakdown: ${expenseBreakdown.map(e => `${e.category} ₹${(e.amount / 1000).toFixed(0)}k`).join(' | ')}

OVERDUE / PENDING PAYMENTS:
${overdue.length ? overdue.map(i => `• ${i.id} — ${i.client}, ₹${i.amount.toLocaleString()}, Project: ${i.project}`).join('\n') : '• None outstanding'}

RECENT ACTIVITY:
${recentActivity.slice(0, 5).map(a => `• ${a.actor} ${a.action} ${a.target}: ${a.detail} (${a.time})`).join('\n')}

UNREAD NOTIFICATIONS (${unread.length}):
${unread.length ? unread.map(n => `• ${n.title}: ${n.body}`).join('\n') : '• None'}`

  } else if (user.role === 'Supervisor') {
    const myProjects = projects.filter(p => supervisorData.projectIds.includes(p.id))
    const unread     = (notifs.Supervisor ?? []).filter(n => n.unread)
    ctx = `
YOUR ASSIGNED PROJECTS:
${myProjects.map(p =>
  `• **${p.name}** — ${p.status}, ${p.progress}% done, ${p.phase} phase, Budget: ${p.budget}`
).join('\n')}

TODAY'S TASKS:
${supervisorData.todayTasks.map(t =>
  `• [${t.done ? 'DONE' : 'TODO'}] ${t.task} — ${t.project} (${t.priority} priority)`
).join('\n')}

YOUR WORKERS TODAY:
${supervisorData.workers.map(w => `• ${w.name} (${w.role}): ${w.present ? 'Present' : 'Absent'}`).join('\n')}

ACTIVE ALERTS:
${supervisorData.alerts.map(a => `• [${a.type.toUpperCase()}] ${a.text}`).join('\n')}

UNREAD NOTIFICATIONS (${unread.length}):
${unread.length ? unread.map(n => `• ${n.title}: ${n.body}`).join('\n') : '• None'}`

  } else if (user.role === 'Designer') {
    const unread = (notifs.Designer ?? []).filter(n => n.unread)
    ctx = `
ALL ACTIVE PROJECTS (for design context):
${projects.map(p =>
  `• **${p.name}** — ${p.status}, ${p.progress}% done, ${p.phase} phase, Client: ${p.client}`
).join('\n')}

YOUR NOTIFICATIONS (${unread.length} unread):
${(notifs.Designer ?? []).map(n => `• [${n.unread ? 'UNREAD' : 'read'}] ${n.title}: ${n.body}`).join('\n') || '• None'}`

  } else if (user.role === 'Client') {
    const myProject  = projects.find(p => p.client === user.name || p.clientId?.name === user.name)
    const myInvoices = invoices.filter(i => i.client === user.name)
    const unread     = (notifs.Client ?? []).filter(n => n.unread)
    ctx = `
YOUR PROJECT:
${myProject
  ? `• **${myProject.name}** — ${myProject.status}, ${myProject.progress}% complete, Current phase: ${myProject.phase}, Budget: ${myProject.budget}`
  : '• No active project found'}

YOUR INVOICES:
${myInvoices.length
  ? myInvoices.map(i => `• ${i.id}: ₹${i.amount.toLocaleString()} — ${i.status}, Date: ${i.date}`).join('\n')
  : '• No invoices found'}

UNREAD NOTIFICATIONS (${unread.length}):
${unread.length ? unread.map(n => `• ${n.title}: ${n.body}`).join('\n') : '• None'}`
  }

  return `You are the AI assistant embedded in InteriorOS, a professional interior design project management platform used by Square Interiors, Coimbatore, India.

TODAY: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
CURRENT USER: ${user.name} (${user.role})

YOUR JOB:
You help the user with their work in InteriorOS. Answer questions about projects, finance, tasks, schedules, team, cost estimates, and interior design. Be direct, concise, and professional. Use the live data below when answering.

FORMATTING (strictly follow):
• Use **bold** with double asterisks for important values and key terms
• Start bullet lists with • (bullet character, not -)
• For multi-column data, use markdown tables: | Header | Value |
• Use ₹ for all Indian Rupee amounts
• Do NOT use # headings — use **bold** instead
• Do NOT write long preambles — get to the answer quickly
• If the user asks something you don't have data for, use standard interior design industry knowledge for Tamil Nadu / South India market
${ctx}

When giving cost estimates, use current (2025-26) market rates for Coimbatore / Tamil Nadu. When the user asks general design questions, give practical, expert advice.`
}
