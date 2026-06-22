import { useState, useEffect, useMemo } from 'react'
import {
  AlertTriangle, CheckCircle2, Clock, Wrench,
  MapPin, Calendar, Camera, ChevronDown, ChevronUp,
  ClipboardList, ShieldCheck,
} from 'lucide-react'
import { getSnags } from '../api/snags'
import { getProjects } from '../api/projects'
import { projectToRow } from '../utils/format'

/* ── helpers ─────────────────────────────────────────────────────────────── */
const fmtDate = s => {
  if (!s) return '—'
  try { return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return s }
}

const SEV_CFG = {
  Critical: { border: 'border-l-[#dc2626]', badge: 'bg-[#FEF2F2] text-[#dc2626]', dot: 'bg-[#dc2626]' },
  Major:    { border: 'border-l-[#E07B20]', badge: 'bg-[#FFF3E8] text-[#E07B20]', dot: 'bg-[#E07B20]' },
  Minor:    { border: 'border-l-[#AAAAAA]', badge: 'bg-[#F7F9FC] text-[#777777]', dot: 'bg-[#AAAAAA]' },
}

const STATUS_CFG = {
  'Open':        { bg: 'bg-[#FEF2F2]',  text: 'text-[#dc2626]', dot: 'bg-[#dc2626]',  icon: AlertTriangle },
  'In Progress': { bg: 'bg-[#D6E8F7]',  text: 'text-[#1B4F8A]', dot: 'bg-[#1B4F8A]',  icon: Wrench        },
  'Fixed':       { bg: 'bg-[#FFF3E8]',  text: 'text-[#E07B20]', dot: 'bg-[#E07B20]',  icon: Clock         },
  'Verified':    { bg: 'bg-[#F0FDF4]',  text: 'text-[#15803d]', dot: 'bg-[#15803d]',  icon: CheckCircle2  },
  'Rejected':    { bg: 'bg-[#FEF2F2]',  text: 'text-[#dc2626]', dot: 'bg-[#dc2626]',  icon: AlertTriangle },
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] ?? { bg: 'bg-[#F7F9FC]', text: 'text-muted', dot: 'bg-muted' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>{status}
    </span>
  )
}

function SeverityBadge({ severity }) {
  const c = SEV_CFG[severity] ?? SEV_CFG.Minor
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${c.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>{severity}
    </span>
  )
}

/* ── Snag Card (client read-only) ────────────────────────────────────────── */
function ClientSnagCard({ snag }) {
  const [expanded, setExpanded] = useState(false)
  const sc  = SEV_CFG[snag.severity] ?? SEV_CFG.Minor
  const allPhotos    = snag.photos    ?? []
  const allFixPhotos = snag.fixPhotos ?? []

  return (
    <div className={`bg-white rounded-2xl border-l-4 border border-[#EFEFEF] shadow-sm ${sc.border} ${snag.status === 'Verified' ? 'opacity-80' : ''}`}>

      {/* Header */}
      <div className="px-5 py-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <SeverityBadge severity={snag.severity}/>
              <StatusBadge status={snag.status}/>
              {snag.location && (
                <span className="flex items-center gap-1 text-[10px] text-muted">
                  <MapPin size={10} strokeWidth={1.75}/>{snag.location}
                </span>
              )}
            </div>
            <p className="text-[14px] font-semibold text-body">{snag.title}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px] text-muted">
              {snag.assignedTo && (
                <span className="flex items-center gap-1">
                  Assigned to <span className="font-medium text-body">{snag.assignedTo.name}</span>
                </span>
              )}
              {snag.dueDate && (
                <span className="flex items-center gap-1"><Calendar size={10}/>Due {fmtDate(snag.dueDate)}</span>
              )}
              {allPhotos.length > 0 && (
                <span className="flex items-center gap-1"><Camera size={10}/>{allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''}</span>
              )}
              {allFixPhotos.length > 0 && (
                <span className="flex items-center gap-1 text-[#15803d]">
                  <Camera size={10}/>{allFixPhotos.length} fix photo{allFixPhotos.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-muted">{expanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}</div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#F0F2F5] px-5 py-4 space-y-4">
          {snag.description && (
            <p className="text-[13px] text-body leading-relaxed">{snag.description}</p>
          )}
          {snag.status === 'Rejected' && snag.rejectedNote && (
            <div className="bg-[#FEF2F2] border border-[#dc2626]/20 rounded-xl px-3.5 py-3 text-[12px] text-[#dc2626]">
              <span className="font-semibold">Rejected: </span>{snag.rejectedNote}
            </div>
          )}
          {snag.status === 'Verified' && (
            <div className="flex items-center gap-2 text-[#15803d] text-[12px] font-semibold">
              <CheckCircle2 size={14}/> Verified by {snag.verifiedBy?.name ?? 'Supervisor'}
            </div>
          )}
          {allPhotos.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2">Defect Photos</p>
              <div className="flex gap-2 flex-wrap">
                {allPhotos.map((p, i) => (
                  <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    className="w-20 h-20 rounded-xl overflow-hidden border border-[#EFEFEF] hover:opacity-90 transition-opacity shrink-0">
                    <img src={p.url} alt="" className="w-full h-full object-cover"/>
                  </a>
                ))}
              </div>
            </div>
          )}
          {allFixPhotos.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[#15803d] uppercase tracking-widest mb-2">Fix Evidence Photos</p>
              <div className="flex gap-2 flex-wrap">
                {allFixPhotos.map((p, i) => (
                  <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    className="w-20 h-20 rounded-xl overflow-hidden border border-[#15803d]/30 hover:opacity-90 transition-opacity shrink-0">
                    <img src={p.url} alt="" className="w-full h-full object-cover"/>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
const STATUS_TABS = ['All', 'Open', 'In Progress', 'Fixed', 'Verified', 'Rejected']

export default function ClientSnags() {
  const [snags,    setSnags]    = useState([])
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [project,  setProject]  = useState('all')
  const [statusTab,setStatusTab]= useState('All')

  useEffect(() => {
    Promise.all([getProjects(), getSnags()])
      .then(([ps, ss]) => {
        setProjects((ps ?? []).map(projectToRow))
        setSnags(ss ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const displayed = useMemo(() => {
    let list = [...snags]
    if (project    !== 'all') list = list.filter(s => String(s.projectId?._id ?? s.projectId) === project)
    if (statusTab  !== 'All') list = list.filter(s => s.status === statusTab)
    return list
  }, [snags, project, statusTab])

  const counts = useMemo(() => {
    const base = project !== 'all' ? snags.filter(s => String(s.projectId?._id ?? s.projectId) === project) : snags
    return {
      total:        base.length,
      Open:         base.filter(s => s.status === 'Open').length,
      'In Progress':base.filter(s => s.status === 'In Progress').length,
      Fixed:        base.filter(s => s.status === 'Fixed').length,
      Verified:     base.filter(s => s.status === 'Verified').length,
      Rejected:     base.filter(s => s.status === 'Rejected').length,
    }
  }, [snags, project])

  const readyPct = counts.total ? Math.round((counts.Verified / counts.total) * 100) : 0

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="font-sora text-[20px] font-bold text-body leading-tight">Snag List</h2>
        <p className="text-[13px] text-muted mt-0.5">Defects and fixes logged on your project — updated in real time by the site team</p>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-sm p-5">
        <div className="flex items-center gap-4 flex-wrap mb-4">
          {projects.length > 1 && (
            <select value={project} onChange={e => setProject(e.target.value)}
              className="px-3 py-1.5 text-[13px] border border-[#EFEFEF] rounded-xl focus:outline-none focus:border-primary bg-white text-body appearance-none cursor-pointer">
              <option value="all">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <div className="ml-auto flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#15803d]"/>
            <span className="text-[12px] font-semibold text-[#15803d]">{readyPct}% Handover Ready</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {[
            { label: 'Total',       val: counts.total,          color: '#333333' },
            { label: 'Open',        val: counts.Open,           color: '#dc2626' },
            { label: 'In Progress', val: counts['In Progress'], color: '#1B4F8A' },
            { label: 'Fixed',       val: counts.Fixed,          color: '#E07B20' },
            { label: 'Verified',    val: counts.Verified,       color: '#15803d' },
            { label: 'Rejected',    val: counts.Rejected,       color: '#dc2626' },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center p-2.5 bg-[#F7F9FC] rounded-xl">
              <p className="font-sora font-bold text-[20px]" style={{ color }}>{val}</p>
              <p className="text-[10px] text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[11px] text-muted mb-1.5">
            <span>{counts.Verified} of {counts.total} issues verified as fixed</span>
            <span>{readyPct}% complete</span>
          </div>
          <div className="w-full h-3 bg-[#F0F4F8] rounded-full overflow-hidden">
            <div className="h-3 bg-[#15803d] rounded-full transition-all duration-700" style={{ width: `${readyPct}%` }}/>
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setStatusTab(s)}
            className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
              statusTab === s ? 'bg-navy text-white' : 'bg-white text-muted border border-[#EFEFEF] hover:text-body'
            }`}>
            {s}{s !== 'All' && counts[s] !== undefined ? ` (${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {/* Snag list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-[#EFEFEF] p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="h-4 bg-[#F0F2F5] rounded w-48"/>
                <div className="h-4 bg-[#F0F2F5] rounded w-20 ml-auto"/>
              </div>
              <div className="h-3 bg-[#F0F2F5] rounded w-64 mt-2"/>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center py-20 bg-white rounded-2xl border border-[#EFEFEF] gap-3">
          <ClipboardList size={36} strokeWidth={1.25} className="text-muted/40"/>
          <p className="text-[14px] font-semibold text-muted">
            {snags.length === 0 ? 'No snags have been logged yet' : 'No snags match this filter'}
          </p>
          {snags.length === 0 && (
            <p className="text-[12px] text-muted text-center max-w-xs">
              Your site team will log any defects here during the final inspection phase.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(s => (
            <ClientSnagCard key={String(s._id)} snag={s}/>
          ))}
        </div>
      )}
    </div>
  )
}
