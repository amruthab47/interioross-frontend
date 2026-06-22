import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban, CheckSquare, Users, FileText,
  ArrowRight, AlertTriangle, Info, X, Plus, ClipboardCheck,
  CheckCircle2, Camera, RefreshCw,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import StatusBadge from '../components/statusbadge'
import FileUploadZone from '../components/FileUploadZone'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getProjects } from '../api/projects'
import { projectToRow, formatINR } from '../utils/format'
import { submitReport } from '../api/reports'

const PIE_COLORS  = ['#1B4F8A', '#E07B20', '#2E6DA4', '#15803d']
const CHART_TYPES = ['Bar', 'Area', 'Pie']

const BORDER_L = {
  blue:   'border-l-primary',
  green:  'border-l-[#15803d]',
  orange: 'border-l-accent',
  purple: 'border-l-[#7C3AED]',
}
const ICON_CFG = {
  blue:   { bg: 'bg-light-blue dark:bg-[#1B2D4A]',  txt: 'text-primary dark:text-[#5B9BD5]'   },
  green:  { bg: 'bg-[#F0FDF4] dark:bg-[#0A2318]',   txt: 'text-[#15803d] dark:text-[#22c55e]' },
  orange: { bg: 'bg-[#FFF3E8] dark:bg-[#2D1F0A]',   txt: 'text-accent'                        },
  purple: { bg: 'bg-[#F5F3FF] dark:bg-[#1A0E3A]',   txt: 'text-[#7C3AED] dark:text-[#A78BFA]' },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ── Horizontal stat card (left-border accent) ─────────────────── */
function SvStat({ title, value, sub, icon: Icon, variant, badge }) {
  const ic = ICON_CFG[variant]
  return (
    <div className={`bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] border-l-4 ${BORDER_L[variant]} shadow-sm p-4 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-200 group`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${ic.bg} group-hover:scale-105 transition-transform duration-200`}>
        <Icon size={20} strokeWidth={1.75} className={ic.txt}/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-[0.1em] leading-none">{title}</p>
        <p className="font-sora text-[22px] font-bold text-body dark:text-white mt-1.5 leading-none">{value}</p>
        {sub && <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 whitespace-nowrap ${badge.ok ? 'text-[#15803d] bg-[#F0FDF4] dark:bg-[#0A2318]' : 'text-[#dc2626] bg-[#FEF2F2] dark:bg-[#2D0808]'}`}>
          {badge.text}
        </span>
      )}
    </div>
  )
}

function ProgressBar({ value, status }) {
  const color = status === 'Critical' ? '#dc2626' : status === 'Delayed' ? '#E07B20' : '#1B4F8A'
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-1.5 bg-[#F0F2F5] dark:bg-[#2A3547] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width:`${value}%`, background:color }}/>
      </div>
      <span className="text-[11px] font-semibold tabular-nums" style={{ color, minWidth:28, textAlign:'right' }}>{value}%</span>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#1C2538] border border-[#EFEFEF] dark:border-[#2A3547] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px] mt-1">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.fill || p.stroke }}/>
          <span className="text-muted">{p.name}:</span>
          <span className="font-semibold text-body dark:text-white">₹{Number(p.value).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Daily Report Modal ──────────────────────────────────────────── */
function DailyReportModal({ isOpen, onClose, myProjects }) {
  const today = new Date().toISOString().split('T')[0]

  const blankForm = (firstId = '') => ({ projectId: firstId, date: today, summary: '' })
  const firstId   = String(myProjects[0]?.id ?? '')

  const [form,      setForm]      = useState(blankForm(firstId))
  const [photos,    setPhotos]    = useState([])          // File objects selected by user
  const [previews,  setPreviews]  = useState([])          // local object-URLs for preview
  const [saving,    setSaving]    = useState(false)
  const [submitted, setSubmitted] = useState(null)        // saved report object from API
  const [error,     setError]     = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // keep firstId in sync when projects load
  useEffect(() => {
    if (firstId && !form.projectId) setForm(f => ({ ...f, projectId: firstId }))
  }, [firstId])

  function handlePhotosChange(files) {
    setPhotos(files)
    // Create local preview URLs so we can show thumbnails immediately
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  function resetForm() {
    setForm(blankForm(firstId))
    setPhotos([])
    setPreviews(prev => { prev.forEach(URL.revokeObjectURL); return [] })
    setError('')
    setSubmitted(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.projectId || !form.summary.trim()) return
    setError('')
    setSaving(true)
    try {
      const report = await submitReport(form.projectId, form.date, form.summary, photos)
      setSubmitted(report)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Submission failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  const field = 'w-full px-3.5 py-2.5 text-sm border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-muted transition-colors duration-150'
  const lbl   = 'block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5'

  const projectName = myProjects.find(p => String(p.id) === String(form.projectId))?.name ?? ''
  const displayDate = form.date ? new Date(form.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  /* ── Success screen ── */
  if (submitted) {
    // Use Cloudinary URLs from the saved report if available, else fall back to local previews
    const savedUrls = (submitted.photos ?? []).map(p => p.url).filter(Boolean)
    const photoDisplay = savedUrls.length ? savedUrls : previews

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose}/>
        <div className="relative z-10 bg-white dark:bg-[#141B27] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.2)] w-full max-w-[540px] border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">

          {/* Green success header */}
          <div className="bg-[#15803d] px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} strokeWidth={2.5} className="text-white"/>
              </div>
              <div>
                <p className="font-sora font-bold text-[16px] text-white leading-tight">Report Submitted!</p>
                <p className="text-[12px] text-white/70 mt-0.5">{projectName} · {displayDate}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/15 transition-colors">
              <X size={17} strokeWidth={1.75}/>
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">

            {/* Photo grid */}
            {photoDisplay.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Camera size={13} strokeWidth={1.75} className="text-muted"/>
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-widest">
                    {photoDisplay.length} site photo{photoDisplay.length !== 1 ? 's' : ''} uploaded
                  </p>
                  <span className="text-[10px] font-semibold text-[#15803d] bg-[#F0FDF4] px-2 py-0.5 rounded-full">Saved to database</span>
                </div>
                <div className={`grid gap-2 ${photoDisplay.length === 1 ? 'grid-cols-1' : photoDisplay.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {photoDisplay.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-[#F0F2F5] border border-[#EFEFEF] group">
                      <img src={url} alt={`Site photo ${i + 1}`} className="w-full h-full object-cover"/>
                      {/* Saved badge overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"/>
                      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-[#15803d] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                        <CheckCircle2 size={9} strokeWidth={2.5}/> Saved
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3.5 bg-[#F0FDF4] dark:bg-[#0A2318]/60 rounded-xl border border-[#bbf7d0]/60">
                <CheckCircle2 size={18} className="text-[#15803d] shrink-0"/>
                <p className="text-[13px] text-[#15803d] font-medium">Report saved to database — no photos attached.</p>
              </div>
            )}

            {/* Summary preview */}
            <div className="bg-[#F7F9FC] dark:bg-[#0F1219] rounded-xl px-4 py-3 border border-[#EFEFEF] dark:border-[#1F2937]">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5">Work Summary</p>
              <p className="text-[13px] text-body dark:text-slate-300 leading-relaxed line-clamp-3">{form.summary}</p>
            </div>

            {/* Visibility note */}
            <div className="flex items-start gap-2.5 p-3.5 bg-light-blue/30 dark:bg-[#1B2D4A]/40 rounded-xl border border-primary/15">
              <CheckCircle2 size={14} strokeWidth={2} className="text-primary shrink-0 mt-0.5"/>
              <p className="text-[12px] text-primary dark:text-[#5B9BD5] leading-relaxed">
                This report and its photos are now visible to the <strong>project client</strong> and <strong>admin</strong> under the project's Documents → Site Photos.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { resetForm() }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-primary border-2 border-primary/30 hover:border-primary hover:bg-light-blue/30 rounded-xl transition-colors">
                <RefreshCw size={13} strokeWidth={2.5}/> Submit Another
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-xl transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Form screen ── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose}/>
      <div className="relative z-10 bg-white dark:bg-[#141B27] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.2)] w-full max-w-[540px] max-h-[90vh] flex flex-col border border-[#EFEFEF] dark:border-[#1F2937]">

        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF] dark:border-[#1F2937] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FFF3E8] dark:bg-[#2D1F0A] flex items-center justify-center">
              <ClipboardCheck size={14} strokeWidth={2} className="text-accent"/>
            </div>
            <h2 className="font-sora font-semibold text-[15px] text-body dark:text-white">Submit Daily Report</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1C2538] hover:text-body dark:hover:text-white transition-colors duration-150">
            <X size={17} strokeWidth={1.75}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Project</label>
              <select required value={form.projectId} onChange={e => set('projectId', e.target.value)} className={field}>
                <option value="">— Select project —</option>
                {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Date</label>
              <input type="date" required value={form.date} onChange={e => set('date', e.target.value)} className={field}/>
            </div>
          </div>

          <div>
            <label className={lbl}>Work Summary <span className="text-[#dc2626]">*</span></label>
            <textarea rows={4} required placeholder="Work done today, materials used, issues faced…"
              value={form.summary} onChange={e => set('summary', e.target.value)} className={`${field} resize-none`}/>
          </div>

          <div>
            <label className={lbl}>
              Site Photos
              <span className="normal-case font-normal text-muted tracking-normal ml-1">(optional)</span>
            </label>
            <FileUploadZone
              label="Upload site photos"
              hint="JPEG, PNG, WebP — drag & drop or click · max 10 photos"
              maxFiles={10}
              accept="image/*"
              onChange={handlePhotosChange}
            />
            {photos.length > 0 && (
              <p className="text-[11px] text-[#15803d] mt-1.5 flex items-center gap-1">
                <CheckCircle2 size={11} strokeWidth={2.5}/>
                {photos.length} photo{photos.length !== 1 ? 's' : ''} selected — will be saved to database on submit
              </p>
            )}
          </div>

          {error && (
            <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] dark:bg-[#2D0808]/60 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#F0F2F5] dark:border-[#1F2937]">
            <button type="button" onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-muted border border-[#EFEFEF] dark:border-[#2A3547] rounded-xl hover:border-[#D0D5DD] hover:text-body transition-colors duration-150">
              Cancel
            </button>
            <button type="submit" disabled={saving || !form.projectId || !form.summary.trim()}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-navy hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors duration-150 shadow-sm flex items-center gap-2">
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"/>
                  Uploading…
                </>
              ) : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function SupervisorDashboard() {
  const { user }   = useAuth()
  const { isDark } = useTheme()
  const [projects,   setProjects]   = useState([])
  const [reportOpen, setReportOpen] = useState(false)
  const [chartType,  setChartType]  = useState('Bar')
  const [tasksDone,  setTasksDone]  = useState({})

  useEffect(() => {
    getProjects().then(ps => setProjects(ps.map(projectToRow))).catch(console.error)
  }, [])

  const myProjects   = projects
  const pendingCount = 0
  const presentCount = 0
  const firstName    = user?.name?.split(' ')[0] ?? ''

  const myChartData = projects.map(p => ({ project: p.name.split(' ').slice(0, 2).join(' '), budget: Math.round(p.budgetRaw / 100), actual: Math.round(p.spentRaw / 100) }))
  const pieData     = myChartData.map(p => ({ name: p.project, value: p.budget }))
  const gridColor   = isDark ? '#1F2937' : '#F0F2F5'
  const axisColor   = isDark ? '#4B5563' : '#AAAAAA'
  const budgetFill  = isDark ? '#1E2D44' : '#D6E8F7'
  // Fallback until workers/tasks API is wired
  const supervisorData = { workers: [], todayTasks: [], alerts: [] }

  const toggleTask = (id) => setTasksDone(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-5">

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div className="bg-[#0F2340] dark:bg-[#080E1A] rounded-2xl overflow-hidden shadow-lg">
        <div className="px-7 py-6 flex items-center justify-between gap-6 flex-wrap">
          <div>
            <p className="text-white/50 text-[11px] uppercase tracking-[0.15em] font-semibold">
              Square Interiors — Site Supervisor
            </p>
            <h2 className="font-sora text-[24px] font-bold text-white mt-1 leading-tight">
              {getGreeting()}, {firstName}
            </h2>
            <p className="text-white/55 text-[13px] mt-1">Here's your site overview for today.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: 'My Projects',     value: String(myProjects.length),                              bg: 'bg-[#1B4F8A]',       to: '/projects'   },
              { label: 'Tasks Pending',   value: String(pendingCount),                                   bg: pendingCount > 0 ? 'bg-[#E07B20]/75' : 'bg-[#15803d]/70', to: '/tasks' },
              { label: 'Workers Present', value: `${presentCount}/${supervisorData.workers.length}`,     bg: 'bg-white/10',        to: '/attendance' },
              { label: 'Reports Due',     value: '1',                                                    bg: 'bg-[#dc2626]/60',    to: null          },
            ].map(({ label, value, bg, to }) => (
              to
                ? <Link key={label} to={to} className={`${bg} rounded-xl px-4 py-3 min-w-[88px] text-center hover:brightness-110 transition-all duration-150 cursor-pointer`}>
                    <p className="font-sora text-[20px] font-bold text-white leading-none">{value}</p>
                    <p className="text-[10px] text-white/75 mt-1 leading-tight">{label}</p>
                  </Link>
                : <div key={label} className={`${bg} rounded-xl px-4 py-3 min-w-[88px] text-center cursor-default`}>
                    <p className="font-sora text-[20px] font-bold text-white leading-none">{value}</p>
                    <p className="text-[10px] text-white/75 mt-1 leading-tight">{label}</p>
                  </div>
            ))}
            <button onClick={() => setReportOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold text-white bg-accent hover:bg-[#c96d18] rounded-xl transition-colors duration-150 shadow-sm shrink-0">
              <Plus size={13} strokeWidth={2.5}/> Submit Report
            </button>
          </div>
        </div>
        <div className="h-[3px] bg-gradient-to-r from-[#1B4F8A] via-[#E07B20] to-[#1B4F8A]" />
      </div>

      {/* ── Project Health Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {myProjects.map((p, i) => {
          const activePhase = p.phases?.find(ph => ph.status === 'active')
          const doneTasks   = 0
          const allTasks    = []
          const chartEntry  = myChartData[i]
          const spentPct    = chartEntry ? Math.round(chartEntry.actual / chartEntry.budget * 100) : 0
          const progColor   = p.status === 'Critical' ? '#dc2626' : p.status === 'Delayed' ? '#E07B20' : '#1B4F8A'
          const budgetColor = spentPct >= 90 ? '#dc2626' : spentPct >= 75 ? '#E07B20' : '#15803d'
          return (
            <Link key={p.id} to={`/projects/${p.id}`} className="block bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-5 hover:shadow-md hover:border-primary/30 transition-all duration-150">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-sora font-semibold text-[15px] text-body dark:text-white leading-tight">{p.name}</p>
                  <p className="text-[12px] text-muted dark:text-slate-400 mt-0.5">{p.client}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>

              {/* Site progress */}
              <div className="mb-3.5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">Site Progress</span>
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: progColor }}>{p.progress}%</span>
                </div>
                <div className="h-2 bg-[#F0F2F5] dark:bg-[#1F2937] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width:`${p.progress}%`, background: progColor }}/>
                </div>
              </div>

              {/* Budget spend */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">Budget Used</span>
                  <span className="text-[11px] font-medium text-muted dark:text-slate-400">
                    {chartEntry ? `₹${(chartEntry.actual/1000).toFixed(0)}k of ₹${(chartEntry.budget/1000).toFixed(0)}k` : p.budget}
                  </span>
                </div>
                <div className="h-1.5 bg-[#F0F2F5] dark:bg-[#1F2937] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width:`${spentPct}%`, background: budgetColor }}/>
                </div>
              </div>

              {/* Footer chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-muted dark:text-slate-400 bg-[#F0F2F5] dark:bg-[#1F2937] px-2.5 py-1 rounded-lg">
                  {activePhase?.label ?? p.phase}
                </span>
                <span className="text-[11px] font-medium text-[#15803d] bg-[#F0FDF4] dark:bg-[#0A2318] px-2.5 py-1 rounded-lg">
                  {doneTasks}/{allTasks.length} tasks done
                </span>
                <span className="text-[11px] font-medium text-primary dark:text-[#5B9BD5] bg-light-blue/50 dark:bg-[#1B2D4A] px-2.5 py-1 rounded-lg">
                  {spentPct}% budget spent
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Main grid: Tasks | Projects ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* LEFT 1-col — Today's Tasks checklist */}
        <div className="lg:col-span-1 space-y-5">

          <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
              <div className="flex items-center gap-2.5">
                <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Today's Tasks</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pendingCount > 0 ? 'text-accent bg-[#FFF3E8] dark:bg-[#2D1F0A]' : 'text-[#15803d] bg-[#F0FDF4] dark:bg-[#0A2318]'}`}>
                  {pendingCount > 0 ? `${pendingCount} pending` : 'All done!'}
                </span>
              </div>
            </div>
            <div className="py-1">
              {supervisorData.todayTasks.map((t, idx) => {
                const done  = tasksDone[t.id]
                const pClr  = t.priority === 'high'   ? 'text-[#dc2626] bg-[#FEF2F2] dark:bg-[#2D0808]'
                            : t.priority === 'medium' ? 'text-accent bg-[#FFF3E8] dark:bg-[#2D1F0A]'
                            : 'text-muted bg-[#F7F9FC] dark:bg-[#1F2937]'
                return (
                  <div key={t.id}>
                    <div className={`flex items-start gap-3 px-5 py-3.5 hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] transition-colors duration-100 cursor-default ${done ? 'opacity-55' : ''}`}>
                      <button onClick={() => toggleTask(t.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150 hover:scale-110 ${done ? 'bg-[#15803d] border-[#15803d]' : 'border-[#D0D5DD] dark:border-[#3A4558] hover:border-primary'}`}>
                        {done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium ${done ? 'line-through text-muted dark:text-slate-600' : 'text-body dark:text-slate-200'}`}>{t.task}</p>
                        <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">{t.project}</p>
                      </div>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide shrink-0 ${pClr}`}>{t.priority}</span>
                    </div>
                    {idx < supervisorData.todayTasks.length - 1 && <div className="mx-5 h-px bg-[#F4F4F4] dark:bg-[#1A2236]"/>}
                  </div>
                )
              })}
            </div>
            <div className="px-5 py-3 border-t border-[#F0F2F5] dark:border-[#1F2937]">
              <button onClick={() => setReportOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 text-[12px] font-medium text-accent hover:text-[#c96d18] hover:bg-[#FFF3E8] dark:hover:bg-[#2D1F0A] py-1.5 rounded-lg transition-colors duration-150">
                Submit today's report <ArrowRight size={13}/>
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT 2-col — My Projects table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
              <div className="flex items-center gap-2.5">
                <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">My Projects</h3>
                <span className="text-[10px] font-bold text-primary dark:text-[#5B9BD5] bg-light-blue/60 dark:bg-[#1B2D4A] px-2 py-0.5 rounded-full">
                  {myProjects.length} active
                </span>
              </div>
              <Link to="/projects"
                className="flex items-center gap-1 text-[11px] font-medium text-primary dark:text-[#5B9BD5] hover:text-mid-blue dark:hover:text-white bg-light-blue/40 dark:bg-[#1B2D4A]/50 hover:bg-light-blue dark:hover:bg-[#1B2D4A] px-3 py-1.5 rounded-lg transition-all duration-150">
                View all <ArrowRight size={12}/>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy">
                    {['Project','Client','Phase','Progress','Status',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap last:w-14">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myProjects.map((row, i) => {
                    const activePhase = row.phases?.find(ph => ph.status === 'active')
                    return (
                      <tr key={row.id} className={[
                        'border-b border-[#F4F4F4] dark:border-[#1A2236] last:border-0 transition-all duration-100',
                        'hover:[box-shadow:inset_3px_0_0_#1B4F8A] hover:bg-light-blue/20 dark:hover:bg-[#1A2236]',
                        i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : 'bg-white dark:bg-[#141B27]',
                      ].join(' ')}>
                        <td className="px-4 py-3.5 font-semibold text-[13px] text-body dark:text-white whitespace-nowrap">{row.name}</td>
                        <td className="px-4 py-3.5 text-[13px] text-body dark:text-slate-300 whitespace-nowrap">{row.client}</td>
                        <td className="px-4 py-3.5">
                          <span className="text-[11px] text-muted dark:text-slate-400 bg-[#F0F2F5] dark:bg-[#1F2937] px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
                            {activePhase?.label ?? row.phase}
                          </span>
                        </td>
                        <td className="px-4 py-3.5"><ProgressBar value={row.progress} status={row.status}/></td>
                        <td className="px-4 py-3.5"><StatusBadge status={row.status}/></td>
                        <td className="px-4 py-3.5">
                          <Link to={`/projects/${row.id}`}
                            className="flex items-center gap-1 text-[12px] font-semibold text-primary dark:text-[#5B9BD5] hover:text-mid-blue dark:hover:text-white transition-colors duration-150">
                            View <ArrowRight size={12}/>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Workers grid ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
          <div className="flex items-center gap-2.5">
            <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Workers Today</h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${presentCount >= Math.ceil(supervisorData.workers.length * 0.8) ? 'bg-[#15803d]' : 'bg-[#dc2626]'}`}>
              {presentCount}/{supervisorData.workers.length} present
            </span>
          </div>
          {supervisorData.alerts.length > 0 && (
            <span className="text-[10px] font-semibold text-[#dc2626] bg-[#FEF2F2] dark:bg-[#2D0808] px-2 py-0.5 rounded-full">
              {supervisorData.alerts.length} alert{supervisorData.alerts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-5">
            {supervisorData.workers.map(w => (
              <div key={w.id} className={[
                'rounded-xl border p-3 flex flex-col items-center gap-2 text-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm',
                w.present
                  ? 'bg-[#F0FDF4] dark:bg-[#0A2318]/60 border-[#bbf7d0] dark:border-[#15803d]/30'
                  : 'bg-[#FAFBFC] dark:bg-[#111620] border-[#F0F0F0] dark:border-[#1A2236]',
              ].join(' ')}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${w.present ? 'bg-[#22c55e] text-white' : 'bg-[#E0E0E0] dark:bg-[#2A3547] text-muted dark:text-slate-500'}`}>
                  {w.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="min-w-0 w-full">
                  <p className={`text-[11px] font-semibold truncate ${w.present ? 'text-body dark:text-slate-200' : 'text-muted dark:text-slate-500'}`}>{w.name}</p>
                  <p className={`text-[9px] mt-0.5 font-medium ${w.present ? 'text-[#15803d]' : 'text-muted dark:text-slate-600'}`}>
                    {w.present ? 'Present' : 'Absent'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {supervisorData.alerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-3">Alerts & Notes</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {supervisorData.alerts.map(a => (
                  <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border ${a.type === 'warning' ? 'bg-[#FEF9F9] dark:bg-[#2D0808]/30 border-[#dc2626]/15' : 'bg-light-blue/20 dark:bg-[#1B2D4A]/30 border-primary/10'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${a.type === 'warning' ? 'bg-[#FEF2F2] dark:bg-[#2D0808]' : 'bg-light-blue/60 dark:bg-[#1B2D4A]'}`}>
                      {a.type === 'warning'
                        ? <AlertTriangle size={13} strokeWidth={2} className="text-[#dc2626]"/>
                        : <Info size={13} strokeWidth={2} className="text-primary dark:text-[#5B9BD5]"/>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-body dark:text-slate-300 leading-snug">{a.text}</p>
                      <p className="text-[10px] text-muted dark:text-slate-600 mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Finance chart (bottom) ────────────────────────────── */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Finance Overview</h3>
            <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">Budget vs actual — my projects</p>
          </div>
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

        <ResponsiveContainer width="100%" height={200}>
          {chartType === 'Bar' ? (
            <BarChart data={myChartData} barCategoryGap="32%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
              <XAxis dataKey="project" tick={{ fontSize:11, fill:axisColor }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:axisColor }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={46}/>
              <Tooltip content={<ChartTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)' }}/>
              <Bar dataKey="budget" name="Budget" fill={budgetFill} radius={[4,4,0,0]}/>
              <Bar dataKey="actual"  name="Actual"  fill="#1B4F8A"   radius={[4,4,0,0]}/>
            </BarChart>
          ) : chartType === 'Area' ? (
            <AreaChart data={myChartData}>
              <defs>
                <linearGradient id="svBG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={budgetFill} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={budgetFill} stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="svAG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1B4F8A" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#1B4F8A" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
              <XAxis dataKey="project" tick={{ fontSize:11, fill:axisColor }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:axisColor }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={46}/>
              <Tooltip content={<ChartTooltip />}/>
              <Area type="monotone" dataKey="budget" name="Budget" stroke={budgetFill} fill="url(#svBG)" strokeWidth={2}/>
              <Area type="monotone" dataKey="actual"  name="Actual"  stroke="#1B4F8A" fill="url(#svAG)"  strokeWidth={2}/>
            </AreaChart>
          ) : (
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
              </Pie>
              <Legend wrapperStyle={{ fontSize:11, color:axisColor }}/>
              <Tooltip formatter={v => `₹${Number(v).toLocaleString('en-IN')}`}/>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      <DailyReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} myProjects={myProjects}/>
    </div>
  )
}
