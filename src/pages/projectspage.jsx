import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, FolderKanban, CheckCircle, AlertTriangle, Clock, ArrowRight, Plus, X, Loader2,
} from 'lucide-react'
import StatusBadge from '../components/statusbadge'
import { useAuth } from '../context/AuthContext'
import { getProjects, createProject } from '../api/projects'
import { getUsers } from '../api/users'
import { projectToRow } from '../utils/format'

function NewProjectModal({ onClose, onCreated, supervisors = [] }) {
  const [form, setForm] = useState({ name: '', client: '', supervisor: '', budget: '', phase: 'Design' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const field = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-muted transition-colors'
  const lbl   = 'block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const budgetNum = parseInt((form.budget || '0').replace(/[₹,\s]/g, ''), 10) || 0
      const sup = supervisors.find(s => (s._id ?? s.id) === form.supervisor)
      const payload = {
        name:         form.name.trim(),
        currentPhase: form.phase,
        budgetPaise:  budgetNum * 100,
        ...(sup && { supervisorId: sup._id ?? sup.id }),
      }
      const created = await createProject(payload)
      onCreated(projectToRow(created))
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-2xl w-full max-w-[520px]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-light-blue flex items-center justify-center">
              <Plus size={14} strokeWidth={2.5} className="text-primary" />
            </div>
            <h3 className="font-sora font-semibold text-[15px] text-body dark:text-white">New Project</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] transition-colors">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={lbl}>Project Name <span className="text-[#dc2626]">*</span></label>
            <input required type="text" placeholder="e.g. Raj Nagar Villa Phase 2"
              value={form.name} onChange={e => set('name', e.target.value)} className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Client Name <span className="text-[#dc2626]">*</span></label>
              <input required type="text" placeholder="Client name"
                value={form.client} onChange={e => set('client', e.target.value)} className={field} />
            </div>
            <div>
              <label className={lbl}>Supervisor</label>
              <select value={form.supervisor} onChange={e => set('supervisor', e.target.value)} className={field}>
                <option value="">— Select —</option>
                {supervisors.map(m => <option key={m._id ?? m.id} value={m._id ?? m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Budget (₹)</label>
              <input type="text" placeholder="e.g. ₹18,00,000"
                value={form.budget} onChange={e => set('budget', e.target.value)} className={field} />
            </div>
            <div>
              <label className={lbl}>Starting Phase</label>
              <select value={form.phase} onChange={e => set('phase', e.target.value)} className={field}>
                {['Design','Civil','Electrical','Plumbing','Carpentry','Finishing','Handover'].map(p => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] px-3 py-2 rounded-xl">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-navy hover:bg-primary rounded-xl transition-colors disabled:opacity-60">
              {loading ? <><Loader2 size={13} className="animate-spin" /> Creating…</> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STATUS_FILTERS = ['All', 'On Track', 'Delayed', 'Critical']

function ProgressBar({ value, status }) {
  const color =
    status === 'Critical' ? '#dc2626' :
    status === 'Delayed'  ? '#E07B20' : '#1B4F8A'
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-1.5 bg-[#F0F2F5] dark:bg-[#2A3547] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold tabular-nums" style={{ color, minWidth: 28, textAlign: 'right' }}>
        {value}%
      </span>
    </div>
  )
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const canSeeBudget = user?.role === 'Admin' || user?.role === 'Supervisor'
  const canSeeClient = user?.role !== 'Designer'
  const isAdmin = user?.role === 'Admin'
  const [projects, setProjects] = useState([])
  const [team,     setTeam]     = useState([])
  const [query, setQuery]         = useState('')
  const [activeFilter, setFilter] = useState('All')
  const [showNewProject, setShowNewProject] = useState(false)

  useEffect(() => {
    getProjects().then(ps => setProjects(ps.map(projectToRow))).catch(console.error)
    getUsers('Supervisor').then(setTeam).catch(console.error)
  }, [])

  const visibleProjects = useMemo(() => projects, [projects])

  const stats = useMemo(() => ({
    total:    visibleProjects.length,
    onTrack:  visibleProjects.filter(p => p.status === 'On Track').length,
    delayed:  visibleProjects.filter(p => p.status === 'Delayed').length,
    critical: visibleProjects.filter(p => p.status === 'Critical').length,
  }), [visibleProjects])

  const filtered = useMemo(() => {
    let list = visibleProjects
    if (activeFilter !== 'All') list = list.filter(p => p.status === activeFilter)
    const q = query.trim().toLowerCase()
    if (q) list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.client.toLowerCase().includes(q) ||
      p.supervisor.toLowerCase().includes(q)
    )
    return list
  }, [visibleProjects, query, activeFilter])

  return (
    <div className="space-y-5">

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: stats.total,    icon: FolderKanban,   bar: 'bg-primary',    iconBg: 'bg-light-blue dark:bg-[#1B2D4A]',  iconColor: 'text-primary dark:text-[#5B9BD5]'  },
          { label: 'On Track',       value: stats.onTrack,  icon: CheckCircle,    bar: 'bg-[#15803d]',  iconBg: 'bg-[#F0FDF4] dark:bg-[#0A2318]',   iconColor: 'text-[#15803d] dark:text-[#22c55e]'},
          { label: 'Delayed',        value: stats.delayed,  icon: Clock,          bar: 'bg-accent',     iconBg: 'bg-[#FFF3E8] dark:bg-[#2D1F0A]',   iconColor: 'text-accent'                       },
          { label: 'Critical',       value: stats.critical, icon: AlertTriangle,  bar: 'bg-[#dc2626]',  iconBg: 'bg-[#FEF2F2] dark:bg-[#2D0808]',   iconColor: 'text-[#dc2626]'                    },
        ].map(({ label, value, icon: Icon, bar, iconBg, iconColor }) => (
          <div key={label} className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all duration-200">
            <div className={`h-[3px] ${bar}`} />
            <div className="p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-[0.1em]">{label}</p>
                <p className="font-sora text-[26px] font-bold text-body dark:text-white mt-2 leading-none">{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon size={18} strokeWidth={1.75} className={iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
          <div className="flex items-center gap-1.5">
            {STATUS_FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={[
                  'px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all duration-150',
                  activeFilter === f
                    ? 'bg-navy text-white dark:bg-primary'
                    : 'text-muted dark:text-slate-400 hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body dark:hover:text-white',
                ].join(' ')}>
                {f}
                {f !== 'All' && (
                  <span className={`ml-1.5 text-[10px] font-bold ${activeFilter === f ? 'text-white/70' : 'text-muted dark:text-slate-500'}`}>
                    {visibleProjects.filter(p => p.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input type="text" placeholder="Search projects…" value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-8 pr-3 py-2 text-sm border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-muted w-52 transition-colors duration-150" />
            </div>
            {isAdmin && (
              <button onClick={() => setShowNewProject(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-white bg-navy hover:bg-primary rounded-xl transition-colors whitespace-nowrap">
                <Plus size={13} strokeWidth={2.5} /> New Project
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy">
                {['Project', ...(canSeeClient ? ['Client'] : []), 'Supervisor', 'Phase', ...(canSeeBudget ? ['Budget'] : []), 'Progress', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap last:w-16">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted dark:text-slate-500">
                    No projects match your search.
                  </td>
                </tr>
              ) : filtered.map((row, i) => (
                <tr key={row.id}
                  className={[
                    'border-b border-[#F4F4F4] dark:border-[#1A2236] last:border-0',
                    'transition-all duration-100',
                    'hover:[box-shadow:inset_3px_0_0_#1B4F8A] hover:bg-light-blue/20 dark:hover:bg-[#1A2236]',
                    i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : 'bg-white dark:bg-[#141B27]',
                  ].join(' ')}>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Link to={`/projects/${row.id}`}
                      className="font-semibold text-[13px] text-body dark:text-white hover:text-primary dark:hover:text-[#5B9BD5] transition-colors duration-150">
                      {row.name}
                    </Link>
                  </td>
                  {canSeeClient && <td className="px-5 py-3.5 text-[13px] text-body dark:text-slate-300 whitespace-nowrap">{row.client}</td>}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-mid-blue/15 dark:bg-mid-blue/25 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-mid-blue">
                          {row.supervisor.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-[13px] text-body dark:text-slate-300 whitespace-nowrap">{row.supervisor}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] text-muted dark:text-slate-400 bg-[#F0F2F5] dark:bg-[#1F2937] px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
                      {row.phase}
                    </span>
                  </td>
                  {canSeeBudget && <td className="px-5 py-3.5 text-[13px] text-body dark:text-slate-300 whitespace-nowrap font-medium">{row.budget}</td>}
                  <td className="px-5 py-3.5">
                    <ProgressBar value={row.progress} status={row.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <Link to={`/projects/${row.id}`}
                      className="flex items-center gap-1 text-[12px] font-semibold text-primary dark:text-[#5B9BD5] hover:text-mid-blue dark:hover:text-white transition-colors duration-150 whitespace-nowrap">
                      View <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNewProject && <NewProjectModal
        onClose={() => setShowNewProject(false)}
        onCreated={p => { setProjects(prev => [p, ...prev]); setShowNewProject(false) }}
        supervisors={team}
      />}
    </div>
  )
}
