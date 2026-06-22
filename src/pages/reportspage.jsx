import { useState, useMemo, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  BarChart2, Sparkles, X, TrendingUp, TrendingDown, IndianRupee,
  Users, CheckSquare, FolderKanban, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getProjects } from '../api/projects'
import { getFinanceSummary } from '../api/finance'
import { getRevenueTrend, getExpenseBreakdown, getAttendanceTrend, getTaskCompletionTrend } from '../api/analytics'
import { projectToRow, formatINR } from '../utils/format'

const PERIODS = ['Day', 'Week', 'Month']
const pk = p => p.toLowerCase()

const PIE_COLORS   = ['#1B4F8A', '#E07B20', '#22c55e', '#7C3AED', '#dc2626', '#2E6DA4']
const STATUS_COLORS = { 'On Track': '#22c55e', Delayed: '#E07B20', Critical: '#dc2626' }

function fmt(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}k`
  return `₹${n}`
}

function pct(a, b) { return b ? Math.round((a / b) * 100) : 0 }

// ── AI Summary generator ──────────────────────────────────────────────────────
function buildSummary(period, role, allProjects, { revenueTimeSeries, attendanceTrend, taskCompletionTrend }) {
  const p = period.toLowerCase()
  const revTS  = revenueTimeSeries  || { day: [], week: [], month: [] }
  const attTS  = attendanceTrend    || { day: [], week: [], month: [] }
  const taskTS = taskCompletionTrend|| { day: [], week: [], month: [] }

  if (role === 'Admin') {
    const onTrack  = allProjects.filter(x => x.status === 'On Track').length
    const delayed  = allProjects.filter(x => x.status === 'Delayed').length
    const critical = allProjects.filter(x => x.status === 'Critical').length

    const revData  = revTS[p] ?? []
    const totalRev = revData.reduce((s, d) => s + (d.revenue  ?? 0), 0)
    const totalExp = revData.reduce((s, d) => s + (d.expenses ?? 0), 0)
    const profit   = totalRev - totalExp
    const margin   = pct(profit, totalRev)

    const attData    = attTS[p] ?? []
    const avgPresent = attData.length ? Math.round(attData.reduce((s, d) => s + (d.present ?? 0), 0) / attData.length) : 0
    const avgAbsent  = attData.length ? Math.round(attData.reduce((s, d) => s + (d.absent  ?? 0), 0) / attData.length) : 0

    const taskData  = taskTS[p] ?? []
    const totalDone = taskData.reduce((s, d) => s + (d.completed ?? 0), 0)

    if (p === 'day') return `Today, Square Interiors generated **${fmt(totalRev)}** in revenue against **${fmt(totalExp)}** in expenses, yielding a profit of **${fmt(profit)}** (${margin}% margin). Worker attendance averaged **${avgPresent} present, ${avgAbsent} absent**. **${totalDone} tasks** completed. ${delayed > 0 ? '⚠️ Some projects showing delays — check project status.' : 'All projects are on track today.'}`

    if (p === 'week') return `This week: **${fmt(totalRev)}** revenue, **${fmt(totalExp)}** expenses, **${fmt(profit)}** profit. ${onTrack} projects on track, ${delayed} delayed, ${critical} critical. Avg attendance: **${avgPresent} workers**. **${totalDone} tasks** completed. ${critical > 0 ? '🔴 Critical projects require urgent attention.' : ''}`

    return `Portfolio: **${allProjects.length} active projects** averaging ${allProjects.length ? Math.round(allProjects.reduce((s, x) => s + x.progress, 0) / allProjects.length) : 0}% completion. ${onTrack} on track, ${delayed} delayed, ${critical} critical. ${critical > 0 ? '⚠️ Critical projects need immediate escalation.' : ''}`
  }

  const myFinance   = revTS[p] ?? []
  const totalBudget = myFinance.reduce((s, d) => s + (d.budget ?? 0), 0)
  const totalActual = myFinance.reduce((s, d) => s + (d.actual ?? 0), 0)
  const utilisation = pct(totalActual, totalBudget)

  const attData    = attTS[p] ?? []
  const avgPresent = attData.length ? Math.round(attData.reduce((s, d) => s + (d.present ?? 0), 0) / attData.length) : 0

  const taskData = taskTS[p] ?? []
  const done     = taskData.reduce((s, d) => s + (d.completed ?? 0), 0)

  if (p === 'day') return `Today: budget utilisation **${utilisation}%** (${fmt(totalActual)} of ${fmt(totalBudget)}). **${avgPresent} workers** present. **${done} tasks** completed. ${allProjects.find(x => x.status === 'Delayed') ? '⚠️ Delayed project detected — review site progress.' : 'All your projects progressing on schedule.'}`

  if (p === 'week') return `This week: **${fmt(totalActual)}** spent of **${fmt(totalBudget)}** budget (${utilisation}% utilisation). **${done} tasks** completed, ${avgPresent} avg workers daily.`

  return `Monthly: ${allProjects.length} assigned projects averaging ${allProjects.length ? Math.round(allProjects.reduce((s, x) => s + x.progress, 0) / allProjects.length) : 0}% completion. Budget utilisation: **${utilisation}%**.`
}

// ── Chart tooltip ──────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#1C2538] border border-[#EFEFEF] dark:border-[#2A3547] rounded-xl shadow-lg px-3.5 py-2.5 text-[12px]">
      <p className="font-semibold text-body dark:text-white mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: p.color }} />
          {p.name}: <strong>{typeof p.value === 'number' && p.value > 999 ? fmt(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-5">
      <p className="font-sora font-semibold text-[14px] text-body dark:text-white">{title}</p>
      {subtitle && <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  )
}

function KpiCard({ label, value, sub, Icon, color, bg, trend }) {
  return (
    <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        <Icon size={18} strokeWidth={1.75} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted dark:text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="font-sora font-bold text-[20px] text-body dark:text-white leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        trend >= 0
          ? <TrendingUp size={14} className="text-[#22c55e] shrink-0" />
          : <TrendingDown size={14} className="text-[#dc2626] shrink-0" />
      )}
    </div>
  )
}

// ── Admin Reports ─────────────────────────────────────────────────────────────
function AdminReports({ period, axisColor, gridColor, projects, revenueTimeSeries, attendanceTrend, taskCompletionTrend, expenseBreakdown, financeChart }) {
  const p = pk(period)
  const revData  = (revenueTimeSeries[p]   ?? [])
  const attData  = (attendanceTrend[p]     ?? [])
  const taskData = (taskCompletionTrend[p] ?? [])

  const totalRev  = revData.reduce((s, d) => s + d.revenue, 0)
  const totalExp  = revData.reduce((s, d) => s + d.expenses, 0)
  const profit    = totalRev - totalExp
  const margin    = pct(profit, totalRev)

  const lastAtt   = attData[attData.length - 1] ?? { present: 0, absent: 0 }
  const totalDone = taskData.reduce((s, d) => s + d.completed, 0)
  const totalPend = taskData.reduce((s, d) => s + d.pending, 0)

  const projectStatusData = [
    { name: 'On Track', value: projects.filter(x => x.status === 'On Track').length },
    { name: 'Delayed',  value: projects.filter(x => x.status === 'Delayed').length  },
    { name: 'Critical', value: projects.filter(x => x.status === 'Critical').length },
  ].filter(x => x.value > 0)

  const paymentStatus = [
    { name: 'Cleared', value: 4 },
    { name: 'Pending', value: 1 },
    { name: 'Overdue', value: 2 },
  ]

  const kpis = [
    { label: 'Revenue',          value: fmt(totalRev),  sub: `${period} total`,              Icon: IndianRupee,  color: 'text-[#15803d]',  bg: 'bg-[#F0FDF4] dark:bg-[#0A2318]',     trend: 1  },
    { label: 'Expenses',         value: fmt(totalExp),  sub: `${margin}% profit margin`,     Icon: IndianRupee,  color: 'text-[#dc2626]',  bg: 'bg-[#FEF2F2] dark:bg-[#2D0808]',     trend: -1 },
    { label: 'Net Profit',       value: fmt(profit),    sub: `${margin}% margin`,            Icon: TrendingUp,   color: 'text-primary',    bg: 'bg-light-blue/60 dark:bg-[#1B2D4A]',  trend: 1  },
    { label: 'Active Projects',  value: projects.length,sub: `${projects.filter(x=>x.status==='On Track').length} on track`, Icon: FolderKanban, color: 'text-accent', bg: 'bg-[#FFF3E8] dark:bg-[#2D1F0A]', trend: 0 },
    { label: 'Workers Present',  value: lastAtt.present,sub: `${lastAtt.absent} absent`,     Icon: Users,        color: 'text-[#7C3AED]',  bg: 'bg-[#F5F3FF] dark:bg-[#1A0E3A]',     trend: 0  },
    { label: 'Tasks Completed',  value: totalDone,      sub: `${totalPend} pending`,         Icon: CheckSquare,  color: 'text-primary',    bg: 'bg-light-blue/60 dark:bg-[#1B2D4A]',  trend: 1  },
  ]

  return (
    <>
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Row 1: Revenue trend + Project status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ChartCard title="Revenue vs Expenses" subtitle={`${period} trend — all projects`} >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="rExpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} width={50} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="revenue"  name="Revenue"  stroke="#22c55e" fill="url(#rRevGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#dc2626" fill="url(#rExpGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Project Status" subtitle="Portfolio health breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={projectStatusData} cx="50%" cy="45%" innerRadius={55} outerRadius={85}
                dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false} fontSize={10}>
                {projectStatusData.map((e, i) => (
                  <Cell key={i} fill={STATUS_COLORS[e.name] ?? PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            {projectStatusData.map(e => (
              <div key={e.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[e.name] }} />
                <span className="text-[11px] text-muted dark:text-slate-400">{e.name}: {e.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Expense Breakdown" subtitle="Cost category distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={expenseBreakdown} cx="50%" cy="45%" innerRadius={50} outerRadius={82}
                dataKey="amount" nameKey="category"
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                labelLine={false} fontSize={10}>
                {expenseBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip content={<ChartTip />} formatter={(v) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-1">
            {expenseBreakdown.map((e, i) => (
              <div key={e.category} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span className="text-[11px] text-muted dark:text-slate-400">{e.category}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Row 2: Budget vs Actual + Attendance + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Budget vs Actual Spend" subtitle={`Per project — all ${projects.length} projects`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={financeChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="project" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} width={52} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="budget" name="Budget" fill="#D6E8F7" radius={[3,3,0,0]} />
              <Bar dataKey="actual" name="Actual"  fill="#1B4F8A" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Worker Attendance" subtitle={`${period} — present vs absent`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="present" name="Present" fill="#22c55e" radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="absent"  name="Absent"  fill="#FCA5A5" radius={[3,3,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Task completion + Payment status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-1 lg:col-span-2">
          <ChartCard title="Task Completion Trend" subtitle={`${period} — completed vs pending`}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={taskData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tCompGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1B4F8A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1B4F8A" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="#1B4F8A" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="pending"   name="Pending"   stroke="#E07B20" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Invoice Payment Status" subtitle="Current billing status">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={paymentStatus} cx="50%" cy="42%" innerRadius={48} outerRadius={75}
                dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                labelLine={false} fontSize={10}>
                <Cell fill="#22c55e" />
                <Cell fill="#E07B20" />
                <Cell fill="#dc2626" />
              </Pie>
              <Tooltip content={<ChartTip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-1">
            {paymentStatus.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: ['#22c55e','#E07B20','#dc2626'][i] }} />
                <span className="text-[11px] text-muted dark:text-slate-400">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Row 4: Project progress table */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
          <p className="font-sora font-semibold text-[14px] text-body dark:text-white">Project Progress Summary</p>
          <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">All {projects.length} active projects</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F7F9FC] dark:bg-[#0F1219]">
                {['Project', 'Phase', 'Progress', 'Budget', 'Status', 'Supervisor'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p, idx) => {
                const sc = { 'On Track': 'text-[#15803d] bg-[#F0FDF4] dark:bg-[#0A2318]', Delayed: 'text-accent bg-[#FFF3E8] dark:bg-[#2D1F0A]', Critical: 'text-[#dc2626] bg-[#FEF2F2] dark:bg-[#2D0808]' }[p.status] ?? ''
                return (
                  <tr key={p.id} className={`border-t border-[#F4F4F4] dark:border-[#1A2236] hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] transition-colors ${idx % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : ''}`}>
                    <td className="px-5 py-3 text-[13px] font-semibold text-body dark:text-slate-200">{p.name}</td>
                    <td className="px-5 py-3 text-[12px] text-muted dark:text-slate-400">{p.phase}</td>
                    <td className="px-5 py-3 w-48">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#F0F2F5] dark:bg-[#2A3547] rounded-full">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-[12px] font-semibold text-body dark:text-slate-200 w-8 text-right">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-muted dark:text-slate-400">{p.budget}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${sc}`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-muted dark:text-slate-400">{p.supervisor}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ── Supervisor Reports ─────────────────────────────────────────────────────────
function SupervisorReports({ period, axisColor, gridColor, projects, attendanceTrend, taskCompletionTrend, financeChart = [] }) {
  const p = pk(period)
  const myProjects   = projects
  const attData      = (attendanceTrend[p]     ?? [])
  const taskData     = (taskCompletionTrend[p] ?? [])
  const workerCount  = 0
  const present      = 0

  const totalBudget  = financeChart.reduce((s, d) => s + (d.budget ?? 0), 0)
  const totalActual  = financeChart.reduce((s, d) => s + (d.actual ?? 0), 0)
  const utilisation  = pct(totalActual, totalBudget)
  const done         = taskData.reduce((s, d) => s + d.completed, 0)
  const pend         = taskData.reduce((s, d) => s + d.pending, 0)

  const progressData = myProjects.map(x => ({ project: x.name.split(' ')[0], progress: x.progress, remaining: 100 - x.progress }))

  const phaseBreakdown = myProjects.map(x => ({ name: x.name.split(' ')[0], phase: x.phase, progress: x.progress }))

  const kpis = [
    { label: 'My Projects',     value: myProjects.length, sub: `${myProjects.filter(x=>x.status==='On Track').length} on track`, Icon: FolderKanban, color: 'text-primary', bg: 'bg-light-blue/60 dark:bg-[#1B2D4A]'  },
    { label: 'Budget Used',     value: `${utilisation}%`, sub: `${fmt(totalActual)} of ${fmt(totalBudget)}`,                      Icon: IndianRupee,  color: utilisation > 90 ? 'text-[#dc2626]' : 'text-[#15803d]', bg: utilisation > 90 ? 'bg-[#FEF2F2] dark:bg-[#2D0808]' : 'bg-[#F0FDF4] dark:bg-[#0A2318]', trend: utilisation > 90 ? -1 : 1 },
    { label: 'Workers Today',   value: `${present}/${workerCount}`, sub: `${workerCount - present} absent`,                       Icon: Users,        color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF] dark:bg-[#1A0E3A]'    },
    { label: 'Tasks Completed', value: done, sub: `${pend} still pending`,                                                         Icon: CheckSquare,  color: 'text-accent',    bg: 'bg-[#FFF3E8] dark:bg-[#2D1F0A]', trend: done > pend ? 1 : -1 },
  ]

  return (
    <>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Row 1: Budget vs Actual + Project progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Budget vs Actual Spend" subtitle="Per project — approved budget vs actual spend">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={financeChart} barCategoryGap="30%" barGap={3} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="project" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} width={52} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="budget" name="Budget" fill="#D6E8F7" radius={[3,3,0,0]} />
              <Bar dataKey="actual" name="Actual"  fill="#1B4F8A" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Project Completion" subtitle="Progress per project">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={progressData} layout="vertical" margin={{ top: 4, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="project" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<ChartTip />} formatter={v => `${v}%`} />
              <Bar dataKey="progress"  name="Completed" fill="#1B4F8A" radius={[0,3,3,0]} stackId="a" />
              <Bar dataKey="remaining" name="Remaining" fill="#F0F2F5"  radius={[0,3,3,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Attendance + Task trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Worker Attendance" subtitle={`${period} — your site workers`}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="present" name="Present" fill="#1B4F8A" radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="absent"  name="Absent"  fill="#FCA5A5" radius={[3,3,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Task Completion Trend" subtitle={`${period} — tasks across your projects`}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={taskData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="completed" name="Completed" stroke="#1B4F8A" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="pending"   name="Pending"   stroke="#E07B20" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Project detail table */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
          <p className="font-sora font-semibold text-[14px] text-body dark:text-white">Your Project Summary</p>
          <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">{myProjects.map(p => p.name.split(' ')[0]).join(' & ')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F7F9FC] dark:bg-[#0F1219]">
                {['Project', 'Client', 'Phase', 'Progress', 'Budget', 'Status'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myProjects.map((p, idx) => {
                const sc = { 'On Track': 'text-[#15803d] bg-[#F0FDF4] dark:bg-[#0A2318]', Delayed: 'text-accent bg-[#FFF3E8] dark:bg-[#2D1F0A]', Critical: 'text-[#dc2626] bg-[#FEF2F2] dark:bg-[#2D0808]' }[p.status] ?? ''
                return (
                  <tr key={p.id} className={`border-t border-[#F4F4F4] dark:border-[#1A2236] hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] ${idx % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : ''}`}>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-body dark:text-slate-200">{p.name}</td>
                    <td className="px-5 py-3.5 text-[12px] text-muted dark:text-slate-400">{p.client}</td>
                    <td className="px-5 py-3.5 text-[12px] text-muted dark:text-slate-400">{p.phase}</td>
                    <td className="px-5 py-3.5 w-44">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#F0F2F5] dark:bg-[#2A3547] rounded-full">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-[12px] font-semibold text-body dark:text-slate-200 w-8 text-right">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-muted dark:text-slate-400">{p.budget}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${sc}`}>{p.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ── Summary panel ─────────────────────────────────────────────────────────────
function SummaryPanel({ text, onClose, loading }) {
  function renderText(t) {
    return t.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-1.5" />
      const parts = line.split(/(\*\*.*?\*\*)/)
      return (
        <p key={i} className="leading-relaxed">
          {parts.map((p, j) =>
            p.startsWith('**') && p.endsWith('**')
              ? <strong key={j} className="text-body dark:text-white">{p.slice(2,-2)}</strong>
              : <span key={j}>{p}</span>
          )}
        </p>
      )
    })
  }

  return (
    <div className="bg-gradient-to-r from-[#EBF3FB] to-[#F0FDF4] dark:from-[#1B2D4A] dark:to-[#0A2318] rounded-2xl border border-[#C8DEF2] dark:border-[#1F3A5F] shadow-sm px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-mid-blue flex items-center justify-center">
            <Sparkles size={13} strokeWidth={1.75} className="text-white" />
          </div>
          <p className="font-sora font-semibold text-[13px] text-primary dark:text-[#5B9BD5]">AI Summary</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-body transition-colors shrink-0 mt-0.5">
          <X size={14} strokeWidth={2} />
        </button>
      </div>
      <div className="mt-3 text-[12.5px] text-body dark:text-slate-300 space-y-0.5">
        {loading
          ? <div className="flex gap-1 items-center h-5">
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-[#5B9BD5] animate-bounce"
                  style={{ animationDelay: `${i*150}ms`, animationDuration: '0.8s' }} />
              ))}
            </div>
          : renderText(text)}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { user }    = useAuth()
  const { isDark }  = useTheme()
  const [period,    setPeriod]    = useState('Week')
  const [showSummary, setShowSummary] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [projects,       setProjects]       = useState([])
  const [financeSummary, setFinanceSummary] = useState({ revenuePaise: 0, pendingInvoices: 0 })
  const [expenseBreakdown, setExpenseBreakdown] = useState([])
  const [revenueTimeSeries, setRevenueTimeSeries] = useState({ day: [], week: [], month: [] })
  const [attendanceTrend,   setAttendanceTrend]   = useState({ day: [], week: [], month: [] })
  const [taskCompletionTrend, setTaskCompletionTrend] = useState({ day: [], week: [], month: [] })

  useEffect(() => {
    getProjects().then(ps => setProjects(ps.map(projectToRow))).catch(console.error)
    getFinanceSummary().then(setFinanceSummary).catch(console.error)
    getExpenseBreakdown().then(d => setExpenseBreakdown(d.map(e => ({ category: e.category, amount: Math.round((e.amountPaise ?? 0) / 100) })))).catch(console.error)
    Promise.all(['day','week','month'].map(p => getRevenueTrend(p))).then(([d,w,m]) => {
      const toRupees = arr => arr.map(x => ({ ...x, revenue: Math.round((x.revenue ?? 0) / 100), expenses: Math.round((x.expenses ?? 0) / 100) }))
      setRevenueTimeSeries({ day: toRupees(d), week: toRupees(w), month: toRupees(m) })
    }).catch(console.error)
    Promise.all(['day','week','month'].map(p => getAttendanceTrend(p))).then(([d,w,m]) => setAttendanceTrend({ day: d, week: w, month: m })).catch(console.error)
    Promise.all(['day','week','month'].map(p => getTaskCompletionTrend(p))).then(([d,w,m]) => setTaskCompletionTrend({ day: d, week: w, month: m })).catch(console.error)
  }, [])

  const axisColor = isDark ? '#475569' : '#9CA3AF'
  const gridColor = isDark ? '#1E2A3A' : '#F0F2F5'
  const myProjects = projects
  const financeChart = projects.map(p => ({ project: p.name.split(' ').slice(0,2).join(' '), budget: Math.round(p.budgetRaw/100), actual: Math.round(p.spentRaw/100) }))
  const svRevenueTimeSeries = revenueTimeSeries
  const svAttendanceTrend   = attendanceTrend
  const svTaskTrend         = taskCompletionTrend
  const supervisorData      = { name: user?.name ?? '', projectIds: [] }

  const trendData = { revenueTimeSeries, attendanceTrend, taskCompletionTrend }

  function handleSummarize() {
    setShowSummary(true)
    setSummaryLoading(true)
    setTimeout(() => {
      setSummaryText(buildSummary(period, user.role, myProjects, trendData))
      setSummaryLoading(false)
    }, 900)
  }

  function handlePeriodChange(p) {
    setPeriod(p)
    if (showSummary) {
      setSummaryLoading(true)
      setTimeout(() => {
        setSummaryText(buildSummary(p, user.role, myProjects, trendData))
        setSummaryLoading(false)
      }, 700)
    }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sora text-[20px] font-bold text-body dark:text-white leading-tight">Reports</h2>
          <p className="text-[13px] text-muted dark:text-slate-400 mt-0.5">
            {user.role === 'Admin' ? 'Company-wide analytics & performance' : 'Your project analytics & site performance'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-[#F0F2F5] dark:bg-[#0F1219] rounded-xl p-1">
            {PERIODS.map(p => (
              <button key={p} onClick={() => handlePeriodChange(p)}
                className={[
                  'px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-150',
                  period === p
                    ? 'bg-white dark:bg-[#1C2538] text-body dark:text-white shadow-sm'
                    : 'text-muted dark:text-slate-500 hover:text-body dark:hover:text-slate-300',
                ].join(' ')}>
                {p}
              </button>
            ))}
          </div>

          {/* Summarize button */}
          <button onClick={handleSummarize}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-gradient-to-r from-primary to-mid-blue hover:from-[#163f6e] hover:to-primary rounded-xl transition-all shadow-sm">
            <Sparkles size={14} strokeWidth={2} />
            Summarize {period}
          </button>
        </div>
      </div>

      {/* AI Summary panel */}
      {showSummary && (
        <SummaryPanel
          text={summaryText}
          loading={summaryLoading}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* Role-based charts */}
      {user.role === 'Admin' ? (
        <AdminReports
          period={period} axisColor={axisColor} gridColor={gridColor}
          projects={projects} revenueTimeSeries={revenueTimeSeries}
          attendanceTrend={attendanceTrend} taskCompletionTrend={taskCompletionTrend}
          expenseBreakdown={expenseBreakdown} financeChart={financeChart}
        />
      ) : user.role === 'Supervisor' ? (
        <SupervisorReports
          period={period} axisColor={axisColor} gridColor={gridColor}
          projects={myProjects} revenueTimeSeries={revenueTimeSeries}
          attendanceTrend={attendanceTrend} taskCompletionTrend={taskCompletionTrend}
          financeChart={financeChart}
        />
      ) : (
        <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-12 text-center">
          <BarChart2 size={40} className="mx-auto text-muted dark:text-slate-600 mb-3" strokeWidth={1.5} />
          <p className="font-sora font-semibold text-[15px] text-body dark:text-white">Reports not available</p>
          <p className="text-[13px] text-muted dark:text-slate-400 mt-1">Detailed analytics are available to Admin and Supervisor roles only.</p>
        </div>
      )}
    </div>
  )
}
