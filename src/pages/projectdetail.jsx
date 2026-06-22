import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, MapPin, Calendar, HardHat,
  CheckCircle, AlertCircle, Plus, X,
  FileText, ClipboardList, Image, ChevronRight,
  FolderOpen, Camera, Palette, Maximize2, Eye,
  FileSignature, BookOpen, CreditCard, Download,
  Layers,
} from 'lucide-react'
import StatusBadge from '../components/statusbadge'
import { getProject } from '../api/projects'
import { getTasks, createTask } from '../api/tasks'
import { getDailyReports } from '../api/reports'
import { getUsers } from '../api/users'
import { getDocuments } from '../api/documents'
import { getDesignVersions, getMoodBoards } from '../api/designs'
import { getInvoices, getPayments } from '../api/finance'
import { projectToRow, formatINR } from '../utils/format'

const TASK_STATUS = {
  'Completed':   'bg-[#F0FDF4] text-[#15803d] border border-[#bbf7d0]',
  'In Progress': 'bg-light-blue/60 text-primary border border-primary/20',
  'Pending':     'bg-[#F7F9FC] text-muted border border-[#EFEFEF]',
  'Blocked':     'bg-[#FEF2F2] text-[#dc2626] border border-[#fecaca]',
}

/* ── Phase timeline ── */
function PhaseTimeline({ phases }) {
  return (
    <>
      <style>{`
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(2.4); opacity: 0;    }
        }
        .phase-pulse { animation: pulseRing 1.8s ease-out infinite; }
      `}</style>
      <div className="flex items-start">
        {phases.map((phase, i) => (
          <div key={phase.id} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div className={`flex-1 h-[2px] ${phases[i - 1].status === 'done' ? 'bg-navy' : 'border-t-2 border-dashed border-[#DDDDDD]'}`} />
                )}
                <div className="relative shrink-0">
                  {phase.status === 'done' && (
                    <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
                      <CheckCircle size={14} strokeWidth={2.5} className="text-white" />
                    </div>
                  )}
                  {phase.status === 'active' && (
                    <>
                      <div className="phase-pulse absolute inset-0 rounded-full bg-primary/30" />
                      <div className="relative w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-[0_0_16px_rgba(27,79,138,0.5)]">
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      </div>
                    </>
                  )}
                  {phase.status === 'pending' && (
                    <div className="w-8 h-8 rounded-full border-2 border-[#D5DAE4] bg-white flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#D5DAE4]" />
                    </div>
                  )}
                </div>
                {i < phases.length - 1 && (
                  <div className={`flex-1 h-[2px] ${phase.status === 'done' ? 'bg-navy' : 'border-t-2 border-dashed border-[#DDDDDD]'}`} />
                )}
              </div>
              <p className={`text-[10px] mt-2 text-center leading-tight px-0.5 ${
                phase.status === 'active'  ? 'text-primary font-bold'
                : phase.status === 'done' ? 'text-body font-medium'
                : 'text-muted'
              }`}>{phase.label}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ── Add Task modal ── */
function AddTaskModal({ isOpen, onClose, tasks, members, projectId, onAdded }) {
  const [form,    setForm]    = useState({ name: '', assignedTo: '', dueDate: '', dependsOn: '', notes: '' })
  const [saving,  setSaving]  = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.assignedTo || !form.dueDate) return
    setSaving(true)
    try {
      await createTask({ projectId, name: form.name, assignedTo: form.assignedTo, dueDate: form.dueDate, notes: form.notes, status: 'Pending', priority: 'Medium' })
      onAdded()
      onClose()
      setForm({ name: '', assignedTo: '', dueDate: '', dependsOn: '', notes: '' })
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  if (!isOpen) return null

  const field = "w-full px-3.5 py-2.5 text-sm border border-[#DDDDDD] rounded-xl focus:outline-none focus:border-primary text-body placeholder:text-muted bg-white transition-colors duration-150"
  const label = "block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.18)] w-full max-w-[500px]">

        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-light-blue flex items-center justify-center">
              <Plus size={14} strokeWidth={2.5} className="text-primary" />
            </div>
            <h2 className="font-sora font-semibold text-[15px] text-body">Add New Task</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] hover:text-body transition-colors duration-150">
            <X size={17} strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={label}>Task Name</label>
            <input type="text" placeholder="e.g. Install kitchen wall tiles" required
              value={form.name} onChange={e => set('name', e.target.value)} className={field} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Assign To</label>
              <select required value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className={field}>
                <option value="">Select member</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Due Date</label>
              <input type="date" required value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <label className={label}>
              Depends On{' '}
              <span className="normal-case text-muted font-normal tracking-normal">(optional)</span>
            </label>
            <select value={form.dependsOn} onChange={e => set('dependsOn', e.target.value)} className={field}>
              <option value="">None — no dependency</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className={label}>
              Notes{' '}
              <span className="normal-case text-muted font-normal tracking-normal">(optional)</span>
            </label>
            <textarea rows={3} placeholder="Any additional details or instructions…"
              value={form.notes} onChange={e => set('notes', e.target.value)}
              className={`${field} resize-none`} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-muted border border-[#EFEFEF] rounded-xl hover:border-[#D0D5DD] hover:text-body transition-colors duration-150">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-navy hover:bg-primary disabled:opacity-50 rounded-xl transition-colors duration-150 shadow-sm">
              {saving ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Lightbox ── */
function Lightbox({ url, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={e => e.stopPropagation()}>
        <img src={url} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" />
        <button onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors duration-150">
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

/* ── Section heading ── */
function SectionHead({ icon: Icon, label, count }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={15} className="text-muted" strokeWidth={1.75} />
      <h4 className="font-sora font-semibold text-[13px] text-body">{label}</h4>
      {count !== undefined && (
        <span className="text-[11px] font-medium text-muted bg-[#F0F2F5] px-1.5 py-0.5 rounded-md">{count}</span>
      )}
    </div>
  )
}

/* ── Main page ── */
function normTask(t) {
  return {
    ...t,
    id:         String(t._id),
    assignedTo: t.assignedTo?.name ?? String(t.assignedTo ?? ''),
    assignedId: String(t.assignedTo?._id ?? t.assignedTo ?? ''),
    dueDate:    t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    status:     t.status ?? 'Pending',
  }
}

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtAmt(p) {
  if (!p) return '—'
  return `₹${Math.round(p / 100).toLocaleString('en-IN')}`
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project,        setProject]        = useState(null)
  const [tasks,          setTasks]          = useState([])
  const [reports,        setReports]        = useState([])
  const [members,        setMembers]        = useState([])
  const [documents,      setDocuments]      = useState([])
  const [designVersions, setDesignVersions] = useState([])
  const [moodBoards,     setMoodBoards]     = useState([])
  const [invoices,       setInvoices]       = useState([])
  const [payments,       setPayments]       = useState([])
  const [activeTab,      setActiveTab]      = useState('tasks')
  const [modalOpen,      setModalOpen]      = useState(false)
  const [lightboxUrl,    setLightboxUrl]    = useState(null)

  function loadTasks() {
    getTasks({ projectId: id }).then(ts => setTasks(ts.map(normTask))).catch(console.error)
  }

  useEffect(() => {
    getProject(id).then(p => {
      const row = projectToRow(p)
      row.spent = formatINR(p.spentPaise)
      setProject(row)
    }).catch(console.error)
    loadTasks()
    getDailyReports(id).then(rs => setReports(rs.map(r => {
      // photos is [{url,publicId,originalName}], photoUrls is legacy string array
      const photoUrls = (r.photos ?? []).map(p => p.url).filter(Boolean)
        .concat((r.photoUrls ?? []).filter(Boolean))
      return {
        ...r,
        id:        String(r._id),
        date:      r.reportDate ? new Date(r.reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
        supervisor:r.supervisorId?.name ?? '',
        photoUrls,
        hasPhoto:  photoUrls.length > 0,
      }
    }))).catch(console.error)
    getUsers().then(setMembers).catch(console.error)
    getDocuments({ projectId: id }).then(setDocuments).catch(console.error)
    getDesignVersions(id).then(setDesignVersions).catch(console.error)
    getMoodBoards(id).then(setMoodBoards).catch(console.error)
    getInvoices({ projectId: id }).then(d => setInvoices(d.map(i => ({
      id: i._id ?? i.id,
      number: i.invoiceNumber ?? i.number ?? '',
      client: i.clientId?.name ?? '',
      amount: i.amountPaise,
      date:   i.issueDate ?? '',
      status: i.status ?? 'Pending',
    })))).catch(console.error)
    getPayments().then(d => setPayments(
      d.filter(p => String(p.projectId?._id ?? p.projectId) === id).map(p => ({
        id: p._id ?? p.id,
        number: p.paymentNumber ?? '',
        client: p.clientId?.name ?? '',
        amount: p.amountPaise,
        date:   p.paymentDate ?? '',
        method: p.method ?? '',
        status: p.status ?? 'Pending',
      }))
    )).catch(console.error)
  }, [id])

  const sitePhotos = useMemo(() => reports.flatMap(r => r.photoUrls ?? []), [reports])
  const docCount   = sitePhotos.length + designVersions.length + moodBoards.length + documents.length + invoices.length + payments.length

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-muted">Loading project…</p>
        <button onClick={() => navigate(-1)} className="text-sm text-primary hover:underline">Go back</button>
      </div>
    )
  }

  const progressColor =
    project.status === 'Critical' ? '#dc2626' :
    project.status === 'Delayed'  ? '#E07B20' : null

  const INVOICE_STATUS = {
    Paid:    'bg-[#F0FDF4] text-[#15803d]',
    Pending: 'bg-[#FFF3E8] text-accent',
    Overdue: 'bg-[#FEF2F2] text-[#dc2626]',
  }
  const PAY_STATUS = {
    Cleared: 'bg-[#F0FDF4] text-[#15803d]',
    Pending: 'bg-[#FFF3E8] text-accent',
    Overdue: 'bg-[#FEF2F2] text-[#dc2626]',
  }
  const DOC_TYPE_CFG = {
    Contract:      { Icon: FileSignature, bg: 'bg-[#FFF3E8]', color: 'text-accent',      label: 'Contract'      },
    Quotation:     { Icon: BookOpen,      bg: 'bg-light-blue/60', color: 'text-primary',  label: 'Quotation'     },
    Invoice:       { Icon: FileText,      bg: 'bg-[#F0FDF4]', color: 'text-[#15803d]',   label: 'Invoice'       },
    'Design Report':{ Icon: Layers,       bg: 'bg-[#F5F3FF]', color: 'text-[#7C3AED]',   label: 'Design Report' },
  }

  return (
    <div className="space-y-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-body transition-colors duration-150">
          <ArrowLeft size={14} strokeWidth={2} /> Back
        </button>
        <ChevronRight size={12} className="text-muted/40" />
        <span className="text-sm text-muted">Projects</span>
        <ChevronRight size={12} className="text-muted/40" />
        <span className="text-sm font-medium text-body truncate max-w-[240px]">{project.name}</span>
      </div>

      {/* ── Header card ── */}
      <div className="bg-navy rounded-2xl p-6" style={{ boxShadow: '0 8px 32px rgba(15,35,64,0.3)' }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] text-white/35 uppercase tracking-[0.28em] mb-2">Project Overview</p>
            <h1 className="font-sora font-bold text-[26px] text-white leading-tight mb-3">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-white/35 uppercase tracking-widest mb-1">Budget</p>
            <p className="font-sora font-bold text-[24px] text-white leading-none">{project.budget}</p>
            <p className="text-[12px] text-white/45 mt-2">
              Spent: <span className="text-white/75 font-semibold">{project.spent}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 border-t border-white/[0.07] pt-5">
          {[
            { icon: User,     label: 'Client',       value: project.client     },
            { icon: MapPin,   label: 'Site Address',  value: project.address    },
            { icon: HardHat,  label: 'Supervisor',    value: project.supervisor },
            { icon: Calendar, label: 'Timeline',      value: `${project.startDate} → ${project.endDate}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={11} className="text-white/30" />
                <p className="text-[10px] text-white/30 uppercase tracking-widest">{label}</p>
              </div>
              <p className="text-[13px] text-white/80 font-medium leading-snug">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Progress + Phase timeline ── */}
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="font-sora font-semibold text-[14px] text-body">Overall Progress</p>
          <span className="font-sora font-bold text-[22px]"
            style={{ color: progressColor ?? '#1B4F8A' }}>{project.progress}%</span>
        </div>
        <div className="relative h-3 bg-[#EEF2F7] rounded-full overflow-hidden mb-8">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${project.progress}%`,
              background: progressColor ?? 'linear-gradient(90deg, #1B4F8A 0%, #2E6DA4 100%)',
            }}
          />
        </div>

        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Phase Timeline</p>
          <div className="flex items-center gap-5 text-[10px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-navy inline-block" />Done
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-[#D5DAE4] inline-block" />Pending
            </span>
          </div>
        </div>

        <PhaseTimeline phases={project.phases} />
      </div>

      {/* ── Tasks / Daily Reports / Documents tabs ── */}
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-sm overflow-hidden">

        {/* Tab bar */}
        <div className="flex items-center border-b border-[#EFEFEF] bg-[#FAFBFC] px-2">
          {[
            { id: 'tasks',     label: 'Tasks',         count: tasks.length,   icon: ClipboardList },
            { id: 'reports',   label: 'Daily Reports', count: reports.length, icon: FileText      },
            { id: 'documents', label: 'Documents',     count: docCount,       icon: FolderOpen    },
          ].map(({ id: tid, label, count, icon: Icon }) => (
            <button key={tid} onClick={() => setActiveTab(tid)}
              className={[
                'flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium border-b-2 -mb-px transition-all duration-150',
                activeTab === tid
                  ? 'text-primary border-primary bg-white rounded-t-lg'
                  : 'text-muted border-transparent hover:text-body',
              ].join(' ')}>
              <Icon size={14} strokeWidth={1.75} />
              {label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tid ? 'bg-light-blue text-primary' : 'bg-[#EFEFEF] text-muted'
              }`}>{count}</span>
            </button>
          ))}

          {activeTab === 'tasks' && (
            <button onClick={() => setModalOpen(true)}
              className="ml-auto mr-3 my-2 flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-navy hover:bg-primary rounded-lg transition-colors duration-150">
              <Plus size={13} strokeWidth={2.5} /> Add Task
            </button>
          )}
        </div>

        {/* ── Tasks ── */}
        {activeTab === 'tasks' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy">
                  {['Task Name', 'Assigned To', 'Due Date', 'Dependency', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, i) => {
                  const dep = task.dependsOn ? tasks.find(t => String(t._id) === String(task.dependsOn?._id ?? task.dependsOn)) : null
                  return (
                    <tr key={task.id}
                      className={[
                        'border-b border-[#F4F4F4] last:border-0 transition-all duration-100',
                        'hover:[box-shadow:inset_3px_0_0_#1B4F8A] hover:bg-light-blue/20',
                        i % 2 === 1 ? 'bg-[#FAFBFC]' : 'bg-white',
                      ].join(' ')}>
                      <td className="px-5 py-3.5 font-semibold text-[13px] text-body">{task.name}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-mid-blue/15 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-mid-blue">
                              {task.assignedTo.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="text-[13px] text-body">{task.assignedTo}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-body whitespace-nowrap">{task.dueDate}</td>
                      <td className="px-5 py-3.5">
                        {dep
                          ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FFF3E8] text-accent text-[11px] font-medium border border-accent/20">
                              <AlertCircle size={10} strokeWidth={2} className="shrink-0" />
                              Blocked by: {dep.name}
                            </span>
                          : <span className="text-muted text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap ${TASK_STATUS[task.status] ?? ''}`}>
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Daily Reports ── */}
        {activeTab === 'reports' && (
          <div className="p-5 grid grid-cols-2 gap-4">
            {reports.map(report => (
              <div key={report.id}
                className="border border-[#EFEFEF] rounded-xl p-4 hover:border-[#C0C8D8] hover:shadow-md transition-all duration-200 group">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="inline-block px-2.5 py-1 text-[11px] font-semibold text-accent bg-[#FFF3E8] rounded-md border border-accent/15 mb-2.5">
                      {report.date}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-primary">
                          {report.supervisor.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-[12px] font-semibold text-body">{report.supervisor}</span>
                    </div>
                  </div>
                  {report.hasPhoto && (
                    <div className="flex gap-1.5 shrink-0">
                      {report.photoUrls.slice(0, 2).map((url, i) => (
                        <div key={i}
                          onClick={() => setLightboxUrl(url)}
                          className="w-16 h-16 rounded-xl overflow-hidden border border-[#E4E4E4] cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-200 group/img">
                          <img src={url} alt="" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                      {report.photoUrls.length > 2 && (
                        <div className="w-16 h-16 rounded-xl bg-[#F0F2F5] border border-[#E4E4E4] flex items-center justify-center text-[11px] font-semibold text-muted cursor-pointer hover:bg-light-blue/40 hover:border-primary/20 transition-all"
                          onClick={() => setLightboxUrl(report.photoUrls[2])}>
                          +{report.photoUrls.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[13px] text-muted leading-relaxed">{report.summary}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Documents ── */}
        {activeTab === 'documents' && (
          <div className="p-5 space-y-7">

            {/* Site Photos */}
            {sitePhotos.length > 0 && (
              <div>
                <SectionHead icon={Camera} label="Site Photos" count={sitePhotos.length} />
                <div className="grid grid-cols-4 gap-3">
                  {sitePhotos.map((url, i) => (
                    <div key={i}
                      className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group border border-[#EFEFEF] hover:border-primary/30 hover:shadow-md transition-all duration-200"
                      onClick={() => setLightboxUrl(url)}>
                      <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center">
                        <Maximize2 size={18} strokeWidth={2} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Design Plans */}
            {designVersions.length > 0 && (
              <div>
                <SectionHead icon={Palette} label="Design Plans" count={designVersions.length} />
                <div className="grid grid-cols-3 gap-4">
                  {designVersions.map((dv, i) => (
                    <div key={i}
                      className="rounded-xl overflow-hidden border border-[#EFEFEF] hover:border-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer"
                      onClick={() => setLightboxUrl(dv.imageUrl)}>
                      <div className="relative aspect-video">
                        <img src={dv.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center">
                          <Maximize2 size={18} strokeWidth={2} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                        </div>
                      </div>
                      <div className="p-3 bg-white border-t border-[#F0F2F5]">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold text-body">{dv.versionLabel}</p>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                            dv.status === 'Approved'           ? 'bg-[#F0FDF4] text-[#15803d]'  :
                            dv.status === 'Pending Review'     ? 'bg-light-blue/60 text-primary' :
                            dv.status === 'Changes Requested'  ? 'bg-[#FFF3E8] text-accent'      :
                            'bg-[#FEF2F2] text-[#dc2626]'
                          }`}>{dv.status}</span>
                        </div>
                        {dv.designerId?.name && (
                          <p className="text-[11px] text-muted mt-1">by {dv.designerId.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mood Boards */}
            {moodBoards.length > 0 && (
              <div>
                <SectionHead icon={Image} label="Mood Boards" count={moodBoards.length} />
                <div className="grid grid-cols-3 gap-4">
                  {moodBoards.map((mb, i) => (
                    <div key={i}
                      className="rounded-xl overflow-hidden border border-[#EFEFEF] hover:border-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer"
                      onClick={() => setLightboxUrl(mb.imageUrl)}>
                      <div className="relative aspect-video">
                        <img src={mb.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center">
                          <Maximize2 size={18} strokeWidth={2} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                        </div>
                      </div>
                      <div className="p-3 bg-white border-t border-[#F0F2F5]">
                        <p className="text-[12px] font-semibold text-body truncate">{mb.title}</p>
                        <p className="text-[11px] text-muted mt-0.5">{mb.style}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invoices */}
            {invoices.length > 0 && (
              <div>
                <SectionHead icon={FileText} label="Invoices" count={invoices.length} />
                <div className="rounded-xl border border-[#EFEFEF] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F7F9FC]">
                        {['Invoice No.', 'Amount', 'Date', 'Status', ''].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv, i) => (
                        <tr key={inv.id} className={`border-t border-[#F4F4F4] hover:bg-light-blue/10 transition-colors ${i % 2 === 1 ? 'bg-[#FAFBFC]' : 'bg-white'}`}>
                          <td className="px-4 py-3 text-[12px] font-mono text-muted">{inv.number}</td>
                          <td className="px-4 py-3 text-[13px] font-semibold text-body">{fmtAmt(inv.amount)}</td>
                          <td className="px-4 py-3 text-[12px] text-muted whitespace-nowrap">{fmtDate(inv.date)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${INVOICE_STATUS[inv.status] ?? 'bg-[#F0F2F5] text-muted'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-mid-blue transition-colors">
                              <Eye size={12} strokeWidth={2} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payments */}
            {payments.length > 0 && (
              <div>
                <SectionHead icon={CreditCard} label="Payments" count={payments.length} />
                <div className="rounded-xl border border-[#EFEFEF] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F7F9FC]">
                        {['Payment No.', 'Amount', 'Date', 'Method', 'Status'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((pay, i) => (
                        <tr key={pay.id} className={`border-t border-[#F4F4F4] hover:bg-light-blue/10 transition-colors ${i % 2 === 1 ? 'bg-[#FAFBFC]' : 'bg-white'}`}>
                          <td className="px-4 py-3 text-[12px] font-mono text-muted">{pay.number}</td>
                          <td className="px-4 py-3 text-[13px] font-semibold text-body">{fmtAmt(pay.amount)}</td>
                          <td className="px-4 py-3 text-[12px] text-muted whitespace-nowrap">{fmtDate(pay.date)}</td>
                          <td className="px-4 py-3 text-[12px] text-muted">{pay.method}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${PAY_STATUS[pay.status] ?? 'bg-[#F0F2F5] text-muted'}`}>
                              {pay.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Contracts & Other Documents */}
            {documents.length > 0 && (
              <div>
                <SectionHead icon={FileSignature} label="Contracts & Documents" count={documents.length} />
                <div className="grid grid-cols-2 gap-3">
                  {documents.map((doc, i) => {
                    const cfg = DOC_TYPE_CFG[doc.type] ?? { Icon: FileText, bg: 'bg-[#F0F2F5]', color: 'text-muted', label: doc.type }
                    const { Icon: DocIcon } = cfg
                    return (
                      <div key={i}
                        className="flex items-center gap-3.5 p-4 rounded-xl border border-[#EFEFEF] hover:border-primary/30 hover:bg-light-blue/10 hover:shadow-sm transition-all duration-200 group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                          <DocIcon size={16} strokeWidth={1.75} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-body truncate">{doc.fileName || doc.documentNumber}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                            {doc.pages && <span className="text-[10px] text-muted">{doc.pages} pages</span>}
                            {doc.issueDate && <span className="text-[10px] text-muted">{fmtDate(doc.issueDate)}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-light-blue/40 transition-colors">
                            <Eye size={13} strokeWidth={2} />
                          </button>
                          <button className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-light-blue/40 transition-colors">
                            <Download size={13} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {docCount === 0 && (
              <div className="text-center py-12">
                <FolderOpen size={40} strokeWidth={1.25} className="mx-auto text-muted/40 mb-3" />
                <p className="text-[14px] font-semibold text-muted">No documents yet</p>
                <p className="text-[12px] text-muted/70 mt-1">Site photos, design plans and contracts will appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AddTaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} tasks={tasks} members={members} projectId={id} onAdded={loadTasks} />
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  )
}
