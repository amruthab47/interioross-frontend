import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Link } from 'react-router-dom'
import {
  FolderKanban, IndianRupee, FileText, Users, CheckSquare,
  AlertTriangle, TrendingUp, Palette, ArrowRight, ArrowUpRight, ClipboardList,
} from 'lucide-react'
import StatusBadge from '../components/statusbadge'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getProjects } from '../api/projects'
import { getFinanceSummary } from '../api/finance'
import { getRevenueTrend, getRecentActivity } from '../api/analytics'
import { getAllReports } from '../api/reports'
import { projectToRow, formatINR } from '../utils/format'

const CHART_TYPES  = ['Bar', 'Line', 'Area', 'Pie']
const PIE_COLORS   = ['#1B4F8A', '#E07B20', '#2E6DA4', '#15803d', '#7C3AED', '#0F2340']
const PERIODS      = ['Day', 'Week', 'Month']

const TYPE_CFG = {
  task:    { Icon: CheckSquare,   dot: '#1B4F8A', iconBg: 'bg-light-blue/60 dark:bg-[#1B2D4A]', iconColor: 'text-primary dark:text-[#5B9BD5]'   },
  invoice: { Icon: FileText,      dot: '#E07B20', iconBg: 'bg-[#FFF3E8] dark:bg-[#2D1F0A]',     iconColor: 'text-accent'                         },
  finance: { Icon: IndianRupee,   dot: '#15803d', iconBg: 'bg-[#F0FDF4] dark:bg-[#0A2318]',     iconColor: 'text-[#15803d] dark:text-[#22c55e]'  },
  alert:   { Icon: AlertTriangle, dot: '#dc2626', iconBg: 'bg-[#FEF2F2] dark:bg-[#2D0808]',     iconColor: 'text-[#dc2626]'                      },
  payment: { Icon: TrendingUp,    dot: '#15803d', iconBg: 'bg-[#F0FDF4] dark:bg-[#0A2318]',     iconColor: 'text-[#15803d] dark:text-[#22c55e]'  },
  design:  { Icon: Palette,       dot: '#7C3AED', iconBg: 'bg-[#F5F3FF] dark:bg-[#1A0E3A]',     iconColor: 'text-[#7C3AED] dark:text-[#A78BFA]'  },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function ProgressBar({ value, status }) {
  const color = status === 'Critical' ? '#dc2626' : status === 'Delayed' ? '#E07B20' : '#1B4F8A'
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-1.5 bg-[#F0F2F5] dark:bg-[#2A3547] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold tabular-nums" style={{ color, minWidth: 28, textAlign: 'right' }}>{value}%</span>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#1C2538] border border-[#EFEFEF] dark:border-[#2A3547] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[10px] font-semibold text-muted dark:text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px] text-body dark:text-slate-200 mt-1">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.fill || p.stroke }} />
          <span className="text-muted dark:text-slate-400">{p.name}:</span>
          <span className="font-semibold">₹{Number(p.value).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const { isDark } = useTheme()
  const { user }   = useAuth()
  const [chartType,      setChartType]      = useState('Bar')
  const [period,         setPeriod]         = useState('Week')
  const [projects,       setProjects]       = useState([])
  const [financeSummary, setFinanceSummary] = useState({ revenue: '₹0', expenses: '₹0', profit: '₹0', pendingInvoices: 0, revenueRaw: 0, expensesRaw: 0, profitRaw: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [trendData,      setTrendData]      = useState([])
  const [recentReports,  setRecentReports]  = useState([])

  useEffect(() => {
    getProjects().then(ps => setProjects(ps.map(projectToRow))).catch(console.error)
    getFinanceSummary().then(s => setFinanceSummary({
      revenue:         formatINR(s.revenuePaise),
      expenses:        formatINR(s.expensesEstPaise ?? 0),
      profit:          formatINR(s.revenuePaise - (s.expensesEstPaise ?? 0)),
      pendingInvoices: s.pendingInvoices ?? 0,
      revenueRaw:      Math.round((s.revenuePaise ?? 0) / 100),
      expensesRaw:     Math.round((s.expensesEstPaise ?? 0) / 100),
      profitRaw:       Math.round(((s.revenuePaise ?? 0) - (s.expensesEstPaise ?? 0)) / 100),
    })).catch(console.error)
    getRecentActivity().then(setRecentActivity).catch(console.error)
    getAllReports().then(reports => setRecentReports(reports.slice(0, 5))).catch(console.error)
  }, [])

  useEffect(() => {
    getRevenueTrend(period.toLowerCase()).then(data => setTrendData(data.map(d => ({
      time: d.time,
      revenue: Math.round(d.revenue / 100),
      expenses: Math.round((d.expenses ?? 0) / 100),
    })))).catch(console.error)
  }, [period])

  const financeChart = projects.map(p => ({ project: p.name.split(' ').slice(0, 2).join(' '), budget: Math.round(p.budgetRaw / 100), actual: Math.round(p.spentRaw / 100) }))
  const pieData      = financeChart.map(p => ({ name: p.project, value: p.budget }))
  const gridColor    = isDark ? '#1F2937' : '#F0F2F5'
  const axisColor    = isDark ? '#4B5563' : '#AAAAAA'
  const budgetFill   = isDark ? '#1E2D44' : '#D6E8F7'

  return (
    <div className="space-y-5">

      {/* ── Greeting ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest">Square Interiors — Admin</p>
          <h2 className="font-sora text-[22px] font-bold text-body dark:text-white mt-1 leading-tight">
            {getGreeting()}, {user.name.split(' ')[0]}
          </h2>
          <p className="text-[13px] text-muted dark:text-slate-400 mt-1">Here's your business overview for today.</p>
        </div>
      </div>

      {/* ── Budget Alerts ──────────────────────────────────────── */}
      {(() => {
        const alerts = projects.filter(p => p.budgetRaw > 0 && (p.spentRaw / p.budgetRaw) >= 0.8)
        if (!alerts.length) return null
        return (
          <div className="bg-[#FEF2F2] dark:bg-[#2D0808]/40 border border-[#dc2626]/25 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#dc2626]/15">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={15} className="text-[#dc2626]" />
                <span className="font-sora font-semibold text-[14px] text-[#dc2626]">Budget Alerts</span>
                <span className="text-[10px] font-bold bg-[#dc2626] text-white px-2 py-0.5 rounded-full">
                  {alerts.length}
                </span>
              </div>
              <Link to="/projects" className="text-[12px] text-[#dc2626] hover:text-[#b91c1c] font-medium flex items-center gap-0.5">
                View Projects <ArrowRight size={12} />
              </Link>
            </div>
            <div className="px-5 py-3 space-y-2">
              {alerts.map(p => {
                const pct     = Math.round((p.spentRaw / p.budgetRaw) * 100)
                const isOver  = pct >= 100
                const remaining = p.budgetRaw - p.spentRaw
                return (
                  <Link key={p.id} to="/projects" className="flex items-center gap-4 bg-white dark:bg-[#141B27] rounded-xl px-4 py-3 hover:shadow-sm transition-shadow">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-body dark:text-white truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-[#F0F2F5] dark:bg-[#2A3547] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-[width]"
                            style={{ width: `${Math.min(pct, 100)}%`, background: isOver ? '#dc2626' : '#E07B20' }} />
                        </div>
                        <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: isOver ? '#dc2626' : '#E07B20' }}>
                          {pct}% used
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-muted dark:text-slate-400">{isOver ? 'Over by' : 'Remaining'}</p>
                      <p className="text-[13px] font-bold" style={{ color: isOver ? '#dc2626' : '#E07B20' }}>
                        {isOver
                          ? `₹${Math.abs(remaining).toLocaleString('en-IN')}`
                          : `₹${remaining.toLocaleString('en-IN')}`}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Active Projects',  value: String(projects.length),          sub: 'Across all sites',     icon: FolderKanban, color: '#1B4F8A', bg: '#D6E8F7', to: '/projects'  },
          { label: 'Total Revenue',    value: financeSummary.revenue,            sub: 'FY 2025–26',           icon: IndianRupee,  color: '#15803d', bg: '#F0FDF4', to: '/finance'   },
          { label: 'Total Expenses',   value: financeSummary.expenses,           sub: 'FY 2025–26',           icon: TrendingUp,   color: '#dc2626', bg: '#FEF2F2', to: '/finance'   },
          { label: 'Net Profit',       value: financeSummary.profit,             sub: `${Math.round(financeSummary.profitRaw / (financeSummary.revenueRaw || 1) * 100)}% margin`, icon: ArrowUpRight, color: '#1B4F8A', bg: '#D6E8F7', to: '/finance' },
          { label: 'Pending Invoices', value: financeSummary.pendingInvoices,    sub: 'Awaiting payment',     icon: FileText,     color: '#E07B20', bg: '#FFF3E8', to: '/finance'   },
          { label: 'Team Present',     value: '—',                               sub: 'View attendance',      icon: Users,        color: '#15803d', bg: '#F0FDF4', to: '/attendance'},
        ].map(({ label, value, sub, icon: Icon, color, bg, to }) => (
          <Link key={label} to={to} className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-6 py-5 flex items-center gap-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-200">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Icon size={26} strokeWidth={1.75} style={{ color }} />
            </div>
            <div>
              <p className="font-sora text-[28px] font-bold text-body dark:text-white leading-none">{value}</p>
              <p className="text-[12px] text-muted dark:text-slate-400 mt-1.5">{label}</p>
              {sub && <p className="text-[11px] font-medium mt-0.5" style={{ color }}>{sub}</p>}
            </div>
          </Link>
        ))}
      </div>

      {/* ── Revenue Trend ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Revenue Trend</h3>
            <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">Income vs expenses — {period.toLowerCase()} view</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#15803d]" />
                <span className="text-muted dark:text-slate-400">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#dc2626]" />
                <span className="text-muted dark:text-slate-400">Expenses</span>
              </div>
            </div>
            <div className="flex gap-0.5 bg-[#F0F2F5] dark:bg-[#0F1219] rounded-lg p-0.5">
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={[
                    'text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors duration-150',
                    period === p
                      ? 'bg-white dark:bg-[#1C2538] text-primary dark:text-[#5B9BD5] shadow-sm'
                      : 'text-muted dark:text-slate-500 hover:text-body dark:hover:text-slate-300',
                  ].join(' ')}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#15803d" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#15803d" stopOpacity={0.02}/>
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
            <XAxis dataKey="time" tick={{ fontSize:11, fill:axisColor }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:10, fill:axisColor }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={46}/>
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: gridColor, strokeWidth:1 }}/>
            <Area type="monotone" dataKey="revenue"  name="Revenue"  stroke="#15803d" fill="url(#revGrad)" strokeWidth={2}/>
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#dc2626" fill="url(#expGrad)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Main 3-col grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* LEFT 2-col — Finance chart */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Finance Summary</h3>
                <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">Budget vs actual — May 2026</p>
              </div>
              <div className="flex items-center gap-3">
                {chartType !== 'Pie' && (
                  <div className="flex gap-3 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: budgetFill }}/>
                      <span className="text-muted dark:text-slate-400">Budget</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-primary"/>
                      <span className="text-muted dark:text-slate-400">Actual</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-0.5 bg-[#F0F2F5] dark:bg-[#0F1219] rounded-lg p-0.5">
                  {CHART_TYPES.map(type => (
                    <button key={type} onClick={() => setChartType(type)}
                      className={[
                        'text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors duration-150',
                        chartType === type
                          ? 'bg-white dark:bg-[#1C2538] text-primary dark:text-[#5B9BD5] shadow-sm'
                          : 'text-muted dark:text-slate-500 hover:text-body dark:hover:text-slate-300',
                      ].join(' ')}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metric chips */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Revenue',  value: financeSummary.revenue,  color: '#15803d' },
                { label: 'Expenses', value: financeSummary.expenses, color: '#dc2626' },
                { label: 'Profit',   value: financeSummary.profit,   color: '#1B4F8A' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#F7F9FC] dark:bg-[#0F1219] rounded-xl px-4 py-3 hover:shadow-sm transition-shadow duration-150">
                  <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-[0.08em]">{label}</p>
                  <p className="font-sora text-[15px] font-bold mt-1 leading-none" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={200}>
              {chartType === 'Bar' ? (
                <BarChart data={financeChart} barCategoryGap="32%" barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                  <XAxis dataKey="project" tick={{ fontSize:11, fill:axisColor }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:axisColor }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={46}/>
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)' }}/>
                  <Bar dataKey="budget" name="Budget" fill={budgetFill} radius={[4,4,0,0]}/>
                  <Bar dataKey="actual"  name="Actual"  fill="#1B4F8A"   radius={[4,4,0,0]}/>
                </BarChart>
              ) : chartType === 'Line' ? (
                <LineChart data={financeChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                  <XAxis dataKey="project" tick={{ fontSize:11, fill:axisColor }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:axisColor }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={46}/>
                  <Tooltip content={<ChartTooltip />}/>
                  <Line type="monotone" dataKey="budget" name="Budget" stroke={isDark ? '#5B9BD5' : '#D6E8F7'} strokeWidth={2.5} dot={{ r:4, fill: isDark ? '#5B9BD5' : '#D6E8F7' }}/>
                  <Line type="monotone" dataKey="actual"  name="Actual"  stroke="#1B4F8A" strokeWidth={2.5} dot={{ r:4, fill:'#1B4F8A' }}/>
                </LineChart>
              ) : chartType === 'Area' ? (
                <AreaChart data={financeChart}>
                  <defs>
                    <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={budgetFill} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={budgetFill} stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1B4F8A" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#1B4F8A" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                  <XAxis dataKey="project" tick={{ fontSize:11, fill:axisColor }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:axisColor }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={46}/>
                  <Tooltip content={<ChartTooltip />}/>
                  <Area type="monotone" dataKey="budget" name="Budget" stroke={budgetFill} fill="url(#budgetGrad)" strokeWidth={2}/>
                  <Area type="monotone" dataKey="actual"  name="Actual"  stroke="#1B4F8A" fill="url(#actualGrad)"  strokeWidth={2}/>
                </AreaChart>
              ) : (
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize:11, color:axisColor }}/>
                  <Tooltip formatter={v => `₹${Number(v).toLocaleString('en-IN')}`}/>
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT 1-col — Activity feed */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm sticky top-0 max-h-[calc(100vh-130px)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937] shrink-0">
              <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Recent Activity</h3>
              <span className="text-[10px] font-semibold text-white bg-accent px-2 py-0.5 rounded-full">Today</span>
            </div>
            <div className="flex-1 overflow-y-auto py-2 px-2">
              {recentActivity.map((item, idx) => {
                const cfg  = TYPE_CFG[item.type] ?? TYPE_CFG.task
                const { Icon } = cfg
                return (
                  <div key={item.id}>
                    <div className="flex gap-3 px-3 py-3 rounded-xl hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] transition-colors duration-150 cursor-default group">
                      <div className={`w-8 h-8 rounded-lg ${cfg.iconBg} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform duration-150`}>
                        <Icon size={14} strokeWidth={1.75} className={cfg.iconColor}/>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] leading-snug text-body dark:text-slate-300">
                          <span className="font-semibold text-body dark:text-white">{item.actor}</span>{' '}
                          <span className="text-muted dark:text-slate-400">{item.action}</span>{' '}
                          <span className="font-medium text-primary dark:text-[#5B9BD5]">{item.target}</span>
                        </p>
                        <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5 truncate">{item.detail}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }}/>
                          <span className="text-[10px] text-muted dark:text-slate-600">{item.time}</span>
                        </div>
                      </div>
                    </div>
                    {idx < recentActivity.length - 1 && <div className="mx-4 h-px bg-[#F4F4F4] dark:bg-[#1A2236]"/>}
                  </div>
                )
              })}
            </div>
            <div className="shrink-0 border-t border-[#F0F2F5] dark:border-[#1F2937] px-5 py-3">
              <button className="w-full flex items-center justify-center gap-1.5 text-[12px] font-medium text-primary dark:text-[#5B9BD5] hover:text-mid-blue dark:hover:text-white hover:bg-light-blue/30 dark:hover:bg-[#1B2D4A]/40 py-1.5 rounded-lg transition-colors duration-150">
                View all activity <ArrowRight size={13}/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Project Health (full-width, bottom) ──────────────── */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
          <div className="flex items-center gap-2.5">
            <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Project Health</h3>
            <span className="text-[10px] font-bold text-primary dark:text-[#5B9BD5] bg-light-blue/60 dark:bg-[#1B2D4A] px-2 py-0.5 rounded-full">
              {projects.length} active
            </span>
          </div>
          <Link to="/projects"
            className="flex items-center gap-1 text-[11px] font-medium text-primary dark:text-[#5B9BD5] hover:text-mid-blue dark:hover:text-white bg-light-blue/40 dark:bg-[#1B2D4A]/50 hover:bg-light-blue dark:hover:bg-[#1B2D4A] px-3 py-1.5 rounded-lg transition-all duration-150">
            View all <ArrowUpRight size={12}/>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy">
                {['Project', 'Client', 'Supervisor', 'Phase', 'Progress', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((row, i) => (
                <tr key={row.id} className={[
                  'border-b border-[#F4F4F4] dark:border-[#1A2236] last:border-0 transition-all duration-100',
                  'hover:[box-shadow:inset_3px_0_0_#1B4F8A] hover:bg-light-blue/20 dark:hover:bg-[#1A2236]',
                  i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : 'bg-white dark:bg-[#141B27]',
                ].join(' ')}>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Link to={`/projects/${row.id}`}
                      className="font-semibold text-[13px] text-body dark:text-white hover:text-primary dark:hover:text-[#5B9BD5] transition-colors duration-150">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-body dark:text-slate-300 whitespace-nowrap">{row.client}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-mid-blue/15 dark:bg-mid-blue/25 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-mid-blue">{row.supervisor.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <span className="text-[13px] text-body dark:text-slate-300 whitespace-nowrap">{row.supervisor}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] text-muted dark:text-slate-400 bg-[#F0F2F5] dark:bg-[#1F2937] px-2 py-0.5 rounded-md font-medium whitespace-nowrap">{row.phase}</span>
                  </td>
                  <td className="px-5 py-3.5"><ProgressBar value={row.progress} status={row.status}/></td>
                  <td className="px-5 py-3.5"><StatusBadge status={row.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Supervisor Reports ─────────────────────────── */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
          <div className="flex items-center gap-2.5">
            <ClipboardList size={16} strokeWidth={1.75} className="text-primary dark:text-[#5B9BD5]" />
            <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Supervisor Daily Reports</h3>
            <span className="text-[10px] font-bold text-primary dark:text-[#5B9BD5] bg-light-blue/60 dark:bg-[#1B2D4A] px-2 py-0.5 rounded-full">
              Recent
            </span>
          </div>
          <Link to="/reports"
            className="flex items-center gap-1 text-[11px] font-medium text-primary dark:text-[#5B9BD5] hover:text-mid-blue dark:hover:text-white bg-light-blue/40 dark:bg-[#1B2D4A]/50 hover:bg-light-blue dark:hover:bg-[#1B2D4A] px-3 py-1.5 rounded-lg transition-all duration-150">
            View all <ArrowUpRight size={12}/>
          </Link>
        </div>
        {recentReports.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-muted dark:text-slate-500">No reports submitted yet.</div>
        ) : (
          <div className="divide-y divide-[#F4F4F4] dark:divide-[#1A2236]">
            {recentReports.map((report, i) => {
              const initials = report.supervisorId?.initials || report.supervisorId?.name?.split(' ').map(n => n[0]).join('') || '?'
              const supervisorName = report.supervisorId?.name || 'Supervisor'
              return (
                <div key={report._id} className={`flex items-start gap-4 px-5 py-4 hover:bg-light-blue/10 dark:hover:bg-[#1A2236] transition-colors duration-100 ${i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-mid-blue/15 dark:bg-mid-blue/25 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-mid-blue">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-body dark:text-white">{supervisorName}</span>
                      <span className="text-[11px] text-muted dark:text-slate-500">·</span>
                      <span className="text-[11px] text-muted dark:text-slate-400">{report.reportDate}</span>
                    </div>
                    <p className="text-[12px] text-body dark:text-slate-300 mt-1 leading-relaxed line-clamp-2">{report.summary}</p>
                    {report.photos?.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary dark:text-[#5B9BD5] bg-light-blue/60 dark:bg-[#1B2D4A] px-2 py-0.5 rounded-md mt-1.5">
                        {report.photos.length} photo{report.photos.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
