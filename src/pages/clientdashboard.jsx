import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle, Clock, Phone, Calendar, User, Layers,
  AlertTriangle, ChevronRight, MessageCircle, Loader,
  Banknote, Package, Camera, FileText, AlertCircle,
  CircleDollarSign, Palette, CheckSquare, Image, ClipboardList,
} from 'lucide-react'
import { getProjects }    from '../api/projects'
import { getAllVersions, getMoodBoards } from '../api/designs'
import { getMilestones }  from '../api/finance'
import { getMaterials }   from '../api/catalog'
import { getDailyReports } from '../api/reports'
import { projectToRow, formatINRCompact } from '../utils/format'

/* ── helpers ──────────────────────────────────────────────────────────────── */
function fmtDate(s) {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtINR(p) {
  if (!p) return '₹0'
  return '₹' + Math.round(p / 100).toLocaleString('en-IN')
}
function daysFromToday(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000)
}

/* ── CircularProgress ─────────────────────────────────────────────────────── */
function CircularProgress({ value }) {
  const r = 50, circ = 2 * Math.PI * r
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={120} height={120} className="-rotate-90">
        <circle cx={60} cy={60} r={r} stroke="#D6E8F7" strokeWidth={10} fill="none" />
        <circle cx={60} cy={60} r={r} stroke="#1B4F8A" strokeWidth={10} fill="none"
          strokeDasharray={circ} strokeDashoffset={circ - (value / 100) * circ} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold font-sora text-[#1B4F8A]">{value}%</span>
        <span className="text-[10px] text-[#777777]">Complete</span>
      </div>
    </div>
  )
}

/* ── MilestoneStatus badge ────────────────────────────────────────────────── */
function MilestoneStatus({ status, days }) {
  if (status === 'Paid')    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16a34a]">Paid</span>
  if (status === 'Overdue') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#dc2626]">Overdue</span>
  if (days !== null && days <= 7)  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF3E8] text-[#E07B20]">Due soon</span>
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F7F9FC] text-[#777777]">Upcoming</span>
}

/* ── Payment Panel ────────────────────────────────────────────────────────── */
function PaymentPanel({ milestones }) {
  const sorted      = [...milestones].sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
  const next        = sorted.find(m => m.status !== 'Paid') ?? null
  const totalPaise  = milestones.reduce((s, m) => s + (m.amountPaise ?? 0), 0)
  const paidPaise   = milestones.filter(m => m.status === 'Paid').reduce((s, m) => s + (m.amountPaise ?? 0), 0)
  const paidPct     = totalPaise ? Math.round((paidPaise / totalPaise) * 100) : 0

  const nextDays = next ? daysFromToday(next.dueDate) : null

  let urgencyBg   = 'bg-[#D6E8F7]'
  let urgencyText = 'text-[#1B4F8A]'
  let urgencyMsg  = ''
  if (next) {
    if (next.status === 'Overdue' || (nextDays !== null && nextDays < 0)) {
      urgencyBg = 'bg-[#FEF2F2]'; urgencyText = 'text-[#dc2626]'
      urgencyMsg = `${Math.abs(nextDays ?? next.daysOverdue ?? 0)} day${Math.abs(nextDays ?? 1) !== 1 ? 's' : ''} overdue`
    } else if (nextDays !== null && nextDays === 0) {
      urgencyBg = 'bg-[#FEF2F2]'; urgencyText = 'text-[#dc2626]'; urgencyMsg = 'Due today'
    } else if (nextDays !== null && nextDays <= 7) {
      urgencyBg = 'bg-[#FFF3E8]'; urgencyText = 'text-[#E07B20]'; urgencyMsg = `Due in ${nextDays} day${nextDays !== 1 ? 's' : ''}`
    } else if (nextDays !== null) {
      urgencyMsg = `Due in ${nextDays} days`
    }
  }

  if (milestones.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5 flex flex-col items-center justify-center gap-2 min-h-[180px]">
        <Banknote size={28} strokeWidth={1.25} className="text-muted/40" />
        <p className="text-[13px] font-medium text-[#777777]">No payment milestones set yet</p>
        <p className="text-[11px] text-[#777777] text-center max-w-[220px]">Your designer will add milestones once the project plan is finalised.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#F0F4F8]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-sora font-bold text-[15px] text-[#0F2340]">Payment Milestones</h2>
          <Link to="/client-documents" className="text-[12px] text-[#2E6DA4] hover:text-[#1B4F8A] flex items-center gap-0.5">
            Invoices <ChevronRight size={12} />
          </Link>
        </div>

        {/* Progress bar: paid vs total */}
        <div className="mb-2">
          <div className="flex justify-between text-[11px] text-[#777777] mb-1.5">
            <span>Paid: <span className="font-semibold text-[#16a34a]">{fmtINR(paidPaise)}</span></span>
            <span>Total: <span className="font-semibold text-[#0F2340]">{fmtINR(totalPaise)}</span></span>
          </div>
          <div className="w-full bg-[#F0F4F8] rounded-full h-2">
            <div className="bg-[#16a34a] h-2 rounded-full transition-all" style={{ width: `${paidPct}%` }} />
          </div>
          <p className="text-[10px] text-[#777777] mt-1">{paidPct}% of total project cost settled</p>
        </div>

        {/* Next due hero */}
        {next && (
          <div className={`mt-3 rounded-xl p-3.5 ${urgencyBg}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${urgencyText} mb-1`}>Next Payment Due</p>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`text-[15px] font-bold font-sora ${urgencyText}`}>{fmtINR(next.amountPaise)}</p>
                <p className="text-[12px] text-[#333333] mt-0.5">{next.label}</p>
                <p className={`text-[11px] mt-0.5 font-medium ${urgencyText}`}>
                  {next.dueDate ? fmtDate(next.dueDate) : 'Date TBD'}
                  {urgencyMsg && ` · ${urgencyMsg}`}
                </p>
              </div>
              {(next.status === 'Overdue' || (nextDays !== null && nextDays <= 7)) && (
                <AlertCircle size={18} className={urgencyText} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Milestone list */}
      <div className="px-5 py-3 space-y-0 divide-y divide-[#F0F4F8]">
        {sorted.map((m, i) => {
          const days = daysFromToday(m.dueDate)
          const isPaid = m.status === 'Paid'
          return (
            <div key={String(m._id)} className={`flex items-center gap-3 py-2.5 ${m._id === next?._id ? 'opacity-100' : isPaid ? 'opacity-70' : 'opacity-100'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isPaid ? 'bg-[#F0FDF4]' : 'bg-[#F7F9FC]'}`}>
                {isPaid
                  ? <CheckCircle size={13} className="text-[#16a34a]" />
                  : <Clock size={12} className="text-[#777777]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-medium truncate ${isPaid ? 'text-[#777777] line-through decoration-[#aaa]' : 'text-[#333333]'}`}>{m.label}</p>
                <p className="text-[10px] text-[#777777]">{m.dueDate ? fmtDate(m.dueDate) : '—'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-[13px] font-bold font-sora ${isPaid ? 'text-[#777777]' : 'text-[#0F2340]'}`}>{fmtINR(m.amountPaise)}</p>
                <MilestoneStatus status={m.status} days={days} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Materials & Stock Panel ──────────────────────────────────────────────── */
function MaterialsPanel({ moodBoards, catalogMaterials }) {
  const projectMaterials = useMemo(() => {
    const names = [...new Set(moodBoards.flatMap(mb => mb.materials ?? []))]
    return names.map(name => {
      const match = catalogMaterials.find(m =>
        m.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(m.name.toLowerCase())
      )
      return { name, match }
    })
  }, [moodBoards, catalogMaterials])

  if (moodBoards.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5">
        <h2 className="font-sora font-bold text-[15px] text-[#0F2340] mb-3">Materials & Stock</h2>
        <div className="flex flex-col items-center py-6 gap-2">
          <Palette size={28} strokeWidth={1.25} className="text-muted/40" />
          <p className="text-[13px] text-[#777777] font-medium">No mood boards yet</p>
          <p className="text-[11px] text-[#777777] text-center max-w-[220px]">Your designer will add material selections once your mood board is ready.</p>
        </div>
      </div>
    )
  }

  const inStock    = projectMaterials.filter(m => m.match?.inStock === true).length
  const outOfStock = projectMaterials.filter(m => m.match?.inStock === false).length

  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-sora font-bold text-[15px] text-[#0F2340]">Materials & Stock</h2>
        <Link to="/client-designs" className="text-[12px] text-[#2E6DA4] hover:text-[#1B4F8A] flex items-center gap-0.5">
          Mood Boards <ChevronRight size={12} />
        </Link>
      </div>
      <p className="text-[11px] text-[#777777] mb-3">
        {inStock > 0 && <span className="text-[#16a34a] font-medium">{inStock} in stock</span>}
        {inStock > 0 && outOfStock > 0 && ' · '}
        {outOfStock > 0 && <span className="text-[#dc2626] font-medium">{outOfStock} out of stock</span>}
        {inStock === 0 && outOfStock === 0 && 'From your project mood boards'}
      </p>

      {outOfStock > 0 && (
        <div className="mb-3 flex items-start gap-2 p-2.5 bg-[#FEF2F2] rounded-lg border border-[#dc2626]/15">
          <AlertTriangle size={13} className="text-[#dc2626] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#dc2626]">
            {outOfStock} material{outOfStock !== 1 ? 's are' : ' is'} currently out of stock. Contact your designer for alternatives.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {projectMaterials.map(({ name, match }) => (
          <div key={name} className="flex items-center justify-between gap-3 py-2 border-b border-[#F0F4F8] last:border-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                match === undefined ? 'bg-[#D6E8F7]' :
                match.inStock ? 'bg-[#16a34a]' : 'bg-[#dc2626]'
              }`} />
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-[#333333] truncate">{name}</p>
                {match && <p className="text-[10px] text-[#777777]">{match.category}{match.brand ? ` · ${match.brand}` : ''}</p>}
              </div>
            </div>
            {match !== undefined ? (
              match.inStock
                ? <span className="text-[10px] font-semibold text-[#16a34a] bg-[#F0FDF4] px-2 py-0.5 rounded-full shrink-0">In Stock</span>
                : <span className="text-[10px] font-semibold text-[#dc2626] bg-[#FEF2F2] px-2 py-0.5 rounded-full shrink-0">Out of Stock</span>
            ) : (
              <span className="text-[10px] text-[#777777] bg-[#F7F9FC] px-2 py-0.5 rounded-full shrink-0">Check with designer</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Reminders Panel ──────────────────────────────────────────────────────── */
function RemindersPanel({ milestones, pendingVersions, recentReports }) {
  const reminders = useMemo(() => {
    const items = []

    // Overdue payments
    milestones.filter(m => m.status === 'Overdue').forEach(m => {
      items.push({
        type: 'overdue',
        icon: AlertCircle,
        color: 'text-[#dc2626]',
        bg: 'bg-[#FEF2F2]',
        title: `Payment overdue: ${m.label}`,
        sub: `${fmtINR(m.amountPaise)} was due ${fmtDate(m.dueDate)}`,
      })
    })

    // Pending design approvals
    if (pendingVersions.length > 0) {
      items.push({
        type: 'approval',
        icon: CheckSquare,
        color: 'text-[#E07B20]',
        bg: 'bg-[#FFF3E8]',
        title: `${pendingVersions.length} design version${pendingVersions.length !== 1 ? 's' : ''} waiting for your approval`,
        sub: `Latest: ${pendingVersions[0]?.versionLabel ?? ''}`,
        to: '/client-collaboration',
      })
    }

    // Upcoming milestone within 14 days
    const upcoming = milestones
      .filter(m => m.status === 'Pending')
      .map(m => ({ ...m, days: daysFromToday(m.dueDate) }))
      .filter(m => m.days !== null && m.days >= 0 && m.days <= 14)
      .sort((a, b) => a.days - b.days)[0]
    if (upcoming) {
      items.push({
        type: 'upcoming',
        icon: Banknote,
        color: 'text-[#1B4F8A]',
        bg: 'bg-[#D6E8F7]',
        title: `Payment due in ${upcoming.days} day${upcoming.days !== 1 ? 's' : ''}`,
        sub: `${upcoming.label} · ${fmtINR(upcoming.amountPaise)}`,
      })
    }

    return items
  }, [milestones, pendingVersions])

  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5 flex flex-col gap-4">
      {/* Reminders */}
      <div>
        <h2 className="font-sora font-bold text-[15px] text-[#0F2340] mb-3">Reminders</h2>
        {reminders.length === 0 ? (
          <div className="flex items-center gap-2.5 p-3 bg-[#F0FDF4] rounded-xl">
            <CheckCircle size={15} className="text-[#16a34a] shrink-0" />
            <p className="text-[12px] text-[#15803d] font-medium">You're all caught up — no pending actions.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reminders.map((r, i) => {
              const Icon = r.icon
              const inner = (
                <div className={`flex gap-3 p-3 rounded-xl ${r.bg}`}>
                  <div className="shrink-0 mt-0.5"><Icon size={14} className={r.color} /></div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-semibold ${r.color} leading-snug`}>{r.title}</p>
                    {r.sub && <p className="text-[11px] text-[#777777] mt-0.5">{r.sub}</p>}
                  </div>
                  {r.to && <ChevronRight size={13} className={r.color + ' shrink-0 mt-0.5'} />}
                </div>
              )
              return r.to
                ? <Link key={i} to={r.to}>{inner}</Link>
                : <div key={i}>{inner}</div>
            })}
          </div>
        )}
      </div>

      {/* Recent site activity */}
      {recentReports.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-sora font-semibold text-[13px] text-[#0F2340]">Recent Site Activity</h3>
            <Link to="/client-gallery" className="text-[12px] text-[#2E6DA4] hover:text-[#1B4F8A] flex items-center gap-0.5">
              Gallery <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentReports.map(r => (
              <div key={String(r._id)} className="flex gap-3 p-3 bg-[#F7F9FC] rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-[#D6E8F7] flex items-center justify-center shrink-0">
                  {r.photos?.length > 0
                    ? <Camera size={13} className="text-[#1B4F8A]" />
                    : <ClipboardList size={13} className="text-[#1B4F8A]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#333333] truncate">
                    {r.summary || 'Site report submitted'}
                  </p>
                  <p className="text-[10px] text-[#777777] mt-0.5">
                    {fmtDate(r.reportDate)}
                    {r.photos?.length > 0 && ` · ${r.photos.length} photo${r.photos.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div>
        <h3 className="font-sora font-semibold text-[13px] text-[#0F2340] mb-2">Quick Access</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'My Designs',    icon: Layers,     to: '/client-designs',       bg: 'bg-[#EFF6FF]', color: 'text-[#1B4F8A]' },
            { label: 'Documents',     icon: FileText,   to: '/client-documents',     bg: 'bg-[#F5F3FF]', color: 'text-[#7C3AED]' },
            { label: 'Site Gallery',  icon: Camera,     to: '/client-gallery',       bg: 'bg-[#FFF3E8]', color: 'text-[#E07B20]' },
            { label: 'Timeline',      icon: CheckSquare,to: '/client-timeline',      bg: 'bg-[#F0FDF4]', color: 'text-[#16a34a]' },
          ].map(({ label, icon: Icon, to, bg, color }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${bg} hover:opacity-80 transition-opacity`}>
              <Icon size={14} className={color} />
              <span className={`text-[12px] font-medium ${color}`}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── TimelineItem ─────────────────────────────────────────────────────────── */
function TimelineItem({ item }) {
  const done = item.status === 'done', active = item.status === 'in-progress'
  let Icon = Clock, iconColor = '#777777'
  if (done)   { Icon = CheckCircle; iconColor = '#16a34a' }
  if (active) { Icon = Loader;      iconColor = '#1B4F8A' }
  const displayDate = item.date ?? item.start ?? ''
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#F0F4F8] last:border-0">
      <Icon size={16} style={{ color: iconColor }} className="mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium ${done ? 'text-[#777777] line-through decoration-[#aaa]' : 'text-[#333333]'}`}>{item.task}</p>
        {item.label && <p className="text-[11px] text-[#2E6DA4] mt-0.5">{item.label}</p>}
      </div>
      <span className="text-[11px] text-[#777777] whitespace-nowrap flex-shrink-0">
        {displayDate ? new Date(displayDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
      </span>
    </div>
  )
}

/* ── Main Dashboard ───────────────────────────────────────────────────────── */
export default function ClientDashboard() {
  const [project,        setProject]  = useState({ name: '', phase: '', progress: 0, budget: '₹0', spent: '₹0', status: 'On Track', budgetRaw: 0, spentRaw: 0, phases: [], ganttItems: [] })
  const [milestones,     setMilestones]   = useState([])
  const [pendingVersions,setPending]      = useState([])
  const [totalVersions,  setTotal]        = useState(0)
  const [moodBoards,     setMoodBoards]   = useState([])
  const [catalogMaterials, setCatalogMaterials] = useState([])
  const [recentReports,  setReports]      = useState([])
  const [chatClicked,    setChatClicked]  = useState(false)

  // Load project-independent data
  useEffect(() => {
    getAllVersions()
      .then(vs => { setTotal(vs.length); setPending(vs.filter(v => v.status === 'Pending Review')) })
      .catch(console.error)
    getMaterials()
      .then(setCatalogMaterials)
      .catch(console.error)
    getProjects()
      .then(ps => { if (ps?.[0]) setProject(projectToRow(ps[0])) })
      .catch(console.error)
  }, [])

  // Load project-scoped data once we have the project id
  useEffect(() => {
    const pid = project.id ?? project._id
    if (!pid) return
    getMilestones({ projectId: pid }).then(setMilestones).catch(console.error)
    getMoodBoards(pid).then(setMoodBoards).catch(console.error)
    getDailyReports(pid).then(rs => setReports((rs ?? []).slice(0, 4))).catch(console.error)
  }, [project.id, project._id])

  const pendingApprovals = pendingVersions.length
  const budgetPct   = project.budgetRaw ? Math.round((project.spentRaw / project.budgetRaw) * 100) : 0
  const ganttItems  = project.ganttItems ?? []
  const overdueMilestones = milestones.filter(m => m.status === 'Overdue')

  return (
    <div className="space-y-5">

      {/* ── Alert banners ─────────────────────────────────────────────── */}
      {overdueMilestones.length > 0 && (
        <div className="bg-[#dc2626] text-white rounded-xl px-5 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} />
            <span className="text-[13px] font-medium">
              {overdueMilestones.length > 1
                ? `${overdueMilestones.length} payment milestones are overdue.`
                : `Payment overdue: ${overdueMilestones[0].label} — ${fmtINR(overdueMilestones[0].amountPaise)}`}
            </span>
          </div>
          <Link to="/client-documents" className="flex items-center gap-1 text-[13px] font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity">
            View Invoices <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {pendingApprovals > 0 && (
        <div className="bg-[#E07B20] text-white rounded-xl px-5 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} />
            <span className="text-[13px] font-medium">
              {pendingApprovals} design version{pendingApprovals !== 1 ? 's' : ''} waiting for your approval.
            </span>
          </div>
          <Link to="/client-collaboration" className="flex items-center gap-1 text-[13px] font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity">
            Review Now <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Row 1: Project overview + Payment milestones ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Project Overview */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h1 className="text-[20px] font-bold font-sora text-[#0F2340] leading-tight">{project.name || 'Your Project'}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {project.area && <span className="text-[12px] text-[#777777]">{project.area}</span>}
              {project.area && project.style && <span className="w-1 h-1 rounded-full bg-[#D6E8F7]" />}
              {project.style && <span className="text-[12px] text-[#777777]">{project.style}</span>}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                project.status === 'On Track'  ? 'bg-[#F0FDF4] text-[#16a34a]' :
                project.status === 'Delayed'   ? 'bg-[#FEF2F2] text-[#dc2626]' :
                project.status === 'Critical'  ? 'bg-[#FEF2F2] text-[#dc2626]' :
                project.status === 'Completed' ? 'bg-[#F0FDF4] text-[#16a34a]' :
                                                 'bg-[#FFF3E8] text-[#E07B20]'
              }`}>{project.status}</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <CircularProgress value={project.progress ?? 0} />
            <div className="flex-1 space-y-3">
              {[
                { label: 'Phase',    value: project.phase      || '—', icon: CheckSquare },
                { label: 'Designer', value: project.designer   || '—', icon: User        },
                { label: 'Deadline', value: project.endDate ? fmtDate(project.endDate) : '—', icon: Calendar },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#D6E8F7] flex items-center justify-center shrink-0">
                    <Icon size={12} className="text-[#1B4F8A]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#777777]">{label}</p>
                    <p className="text-[12px] font-medium text-[#333333]">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget bar */}
          <div className="bg-[#F7F9FC] rounded-xl p-3.5 border border-[#E0E0E0]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] font-medium text-[#333333]">Budget Overview</span>
              <span className="text-[10px] text-[#777777]">{budgetPct}% used</span>
            </div>
            <div className="w-full bg-[#D6E8F7] rounded-full h-2">
              <div className="bg-[#1B4F8A] h-2 rounded-full transition-all" style={{ width: `${Math.min(budgetPct, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              <div>
                <p className="text-[10px] text-[#777777]">Spent</p>
                <p className="text-[13px] font-bold font-sora text-[#E07B20]">{formatINRCompact(project.spentRaw ?? 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#777777]">Total Budget</p>
                <p className="text-[13px] font-bold font-sora text-[#1B4F8A]">{formatINRCompact(project.budgetRaw ?? 0)}</p>
              </div>
            </div>
          </div>

          {/* Designer contact strip */}
          <div className="flex items-center justify-between pt-1 border-t border-[#F0F4F8]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1B4F8A] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">{project.designerInitials ?? 'KM'}</span>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#333333]">{project.designer || 'Your Designer'}</p>
                <p className="text-[10px] text-[#777777] flex items-center gap-1"><Phone size={9}/> {project.designerPhone ?? '+91 98400 00007'}</p>
              </div>
            </div>
            <Link to="/chat"
              onClick={() => setChatClicked(true)}
              className="flex items-center gap-1.5 bg-[#1B4F8A] hover:bg-[#2E6DA4] text-white text-[12px] font-medium px-3 py-2 rounded-lg transition-colors">
              <MessageCircle size={13} />
              {chatClicked ? 'Opening…' : 'Message'}
            </Link>
          </div>
        </div>

        {/* Payment Milestones */}
        <PaymentPanel milestones={milestones} />
      </div>

      {/* ── Row 2: Materials + Reminders ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MaterialsPanel moodBoards={moodBoards} catalogMaterials={catalogMaterials} />
        <RemindersPanel milestones={milestones} pendingVersions={pendingVersions} recentReports={recentReports} />
      </div>

      {/* ── Row 3: Timeline + KPI cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Timeline Overview */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sora font-bold text-[15px] text-[#0F2340]">Timeline Overview</h2>
            <Link to="/client-timeline" className="text-[12px] text-[#2E6DA4] hover:text-[#1B4F8A] flex items-center gap-0.5">
              Full Timeline <ChevronRight size={12} />
            </Link>
          </div>
          {ganttItems.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <Clock size={24} strokeWidth={1.25} className="text-[#777777]/40" />
              <p className="text-[13px] text-[#777777]">Timeline not set up yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0F4F8]">
              {ganttItems.slice(0, 6).map(item => <TimelineItem key={item.id} item={item} />)}
            </div>
          )}
        </div>

        {/* KPI summary */}
        <div className="grid grid-cols-2 gap-4 content-start">
          {[
            { icon: Layers,        label: 'Design Versions',   value: totalVersions,          color: '#1B4F8A', to: '/client-designs'       },
            { icon: AlertTriangle, label: 'Pending Approval',  value: pendingApprovals,        color: '#E07B20', to: '/client-collaboration'  },
            { icon: CheckCircle,   label: 'Milestones Paid',   value: milestones.filter(m => m.status === 'Paid').length, color: '#16a34a', to: undefined },
            { icon: Image,         label: 'Site Photos',       value: recentReports.reduce((s, r) => s + (r.photos?.length ?? 0), 0) + (recentReports.length < 4 ? '' : '+'), color: '#2E6DA4', to: '/client-gallery' },
          ].map(({ icon: Icon, label, value, color, to }) => {
            const cls = "bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all"
            const inner = (
              <>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '22' }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p className="text-xl font-bold font-sora" style={{ color: '#1B4F8A' }}>{value}</p>
                  <p className="text-[11px] text-[#777777] leading-tight">{label}</p>
                </div>
              </>
            )
            return to ? <Link key={label} to={to} className={cls}>{inner}</Link> : <div key={label} className={cls}>{inner}</div>
          })}
        </div>
      </div>
    </div>
  )
}
