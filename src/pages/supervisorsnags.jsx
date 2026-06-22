import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Plus, X, AlertTriangle, CheckCircle2, Clock, Wrench,
  MapPin, User, Calendar, Camera, ChevronDown, ChevronUp,
  Trash2, RotateCcw, ThumbsUp, ThumbsDown, Upload,
  FolderKanban, ClipboardList, Sparkles, Loader2,
} from 'lucide-react'
import { getSnags, createSnag, updateSnag, deleteSnag, uploadFixPhotos, analyzeSnagPhoto } from '../api/snags'
import { getProjects } from '../api/projects'
import { getUsers }    from '../api/users'
import { projectToRow } from '../utils/format'
import { resolveFileUrl } from '../api/client'

/* ── helpers ─────────────────────────────────────────────────────────────── */
const fmtDate = s => { if (!s) return '—'; try { return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return s } }

const SEV_CFG = {
  Critical: { border: 'border-l-[#dc2626]', dot: 'bg-[#dc2626]', badge: 'bg-[#FEF2F2] text-[#dc2626]', icon: AlertTriangle },
  Major:    { border: 'border-l-[#E07B20]', dot: 'bg-[#E07B20]', badge: 'bg-[#FFF3E8] text-[#E07B20]', icon: AlertTriangle },
  Minor:    { border: 'border-l-[#777777]', dot: 'bg-[#777777]', badge: 'bg-[#F7F9FC]  text-[#777777]', icon: AlertTriangle },
}
const STATUS_CFG = {
  'Open':        { bg: 'bg-[#FEF2F2]',  text: 'text-[#dc2626]',  dot: 'bg-[#dc2626]'  },
  'In Progress': { bg: 'bg-[#D6E8F7]',  text: 'text-[#1B4F8A]',  dot: 'bg-[#1B4F8A]'  },
  'Fixed':       { bg: 'bg-[#FFF3E8]',  text: 'text-[#E07B20]',  dot: 'bg-[#E07B20]'  },
  'Verified':    { bg: 'bg-[#F0FDF4]',  text: 'text-[#15803d]',  dot: 'bg-[#15803d]'  },
  'Rejected':    { bg: 'bg-[#FEF2F2]',  text: 'text-[#dc2626]',  dot: 'bg-[#dc2626]'  },
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
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${c.badge}`}>
      {severity}
    </span>
  )
}

function Initials({ name, initials }) {
  const letters = initials || (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-7 h-7 rounded-full bg-[#1B4F8A] flex items-center justify-center shrink-0">
      <span className="text-white text-[10px] font-bold">{letters}</span>
    </div>
  )
}

/* ── Reject Modal ─────────────────────────────────────────────────────────── */
function RejectModal({ snag, onClose, onRejected }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateSnag(snag._id, { status: 'Rejected', rejectedNote: note })
      onRejected(updated); onClose()
    } catch(e) { console.error(e) } finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-2xl w-full max-w-[420px]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F2F5]">
          <p className="font-sora font-semibold text-[15px] text-body">Reject Fix</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] transition-colors"><X size={16}/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <p className="text-[13px] text-body bg-[#F7F9FC] rounded-xl px-3.5 py-3">{snag.title}</p>
          <div>
            <label className="block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5">Rejection Note</label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
              placeholder="What needs to be redone?"
              className="w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] rounded-xl focus:outline-none focus:border-primary text-body bg-white resize-none transition-colors"/>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] rounded-xl hover:border-primary hover:text-primary transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Create Snag Modal ────────────────────────────────────────────────────── */
function CreateSnagModal({ projects, workers, onClose, onCreated }) {
  const [form, setForm] = useState({
    projectId: projects[0]?.id ?? '', title: '', description: '',
    location: '', severity: 'Minor', assignedTo: '', dueDate: '',
  })
  const [photos, setPhotos]     = useState([])
  const [previews, setPreviews] = useState([])
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiUsed, setAiUsed]     = useState(false)
  const fileRef                 = useRef()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleFiles(files) {
    const arr = Array.from(files)
    setPhotos(p => [...p, ...arr])
    arr.forEach(f => { const r = new FileReader(); r.onload = e => setPreviews(p => [...p, e.target.result]); r.readAsDataURL(f) })
  }

  function removePhoto(i) {
    setPhotos(p => p.filter((_, idx) => idx !== i))
    setPreviews(p => p.filter((_, idx) => idx !== i))
    if (i === 0) setAiUsed(false)
  }

  async function handleAnalyze() {
    if (!photos[0]) return
    setAnalyzing(true)
    setErr('')
    try {
      const result = await analyzeSnagPhoto(photos[0])
      setForm(f => ({
        ...f,
        title:       result.title       || f.title,
        description: result.description || f.description,
        severity:    result.severity    || f.severity,
        location:    result.location    || f.location,
      }))
      setAiUsed(true)
    } catch (e) {
      setErr(e.message || 'AI analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setErr('Title is required'); return }
    if (!form.projectId)    { setErr('Select a project'); return }
    setSaving(true); setErr('')
    try {
      const snag = await createSnag({ ...form, assignedTo: form.assignedTo || undefined }, photos)
      onCreated(snag); onClose()
    } catch (e) { setErr(e.message || 'Failed to create'); setSaving(false) }
  }

  const fi = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] rounded-xl focus:outline-none focus:border-primary text-body bg-white placeholder:text-muted transition-colors'
  const lb = 'block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-2xl w-full max-w-[540px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F2F5] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FEF2F2] flex items-center justify-center">
              <AlertTriangle size={14} className="text-[#dc2626]" />
            </div>
            <p className="font-sora font-semibold text-[15px] text-body">Log Snag</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] transition-colors"><X size={16}/></button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={lb}>Title <span className="text-[#dc2626]">*</span></label>
              <input type="text" required placeholder="e.g. Water stain on bedroom ceiling"
                value={form.title} onChange={e => set('title', e.target.value)} className={fi}/>
            </div>
            <div>
              <label className={lb}>Project <span className="text-[#dc2626]">*</span></label>
              <select value={form.projectId} onChange={e => set('projectId', e.target.value)} className={fi}>
                <option value="">— Select —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lb}>Location / Room</label>
              <input type="text" placeholder="e.g. Master Bedroom" value={form.location}
                onChange={e => set('location', e.target.value)} className={fi}/>
            </div>
          </div>

          {/* Severity selector */}
          <div>
            <label className={lb}>Severity</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Critical', 'Major', 'Minor']).map(s => {
                const c = SEV_CFG[s]
                return (
                  <button key={s} type="button" onClick={() => set('severity', s)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-semibold transition-all ${
                      form.severity === s ? `${c.badge} border-current` : 'border-[#EFEFEF] text-muted hover:border-[#DDDDDD]'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${c.dot}`}/>{s}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className={lb}>Description</label>
            <textarea rows={2} placeholder="Describe the defect…" value={form.description}
              onChange={e => set('description', e.target.value)}
              className={`${fi} resize-none`}/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lb}>Assign to Worker</label>
              <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className={fi}>
                <option value="">— Unassigned —</option>
                {workers.map(w => <option key={w._id ?? w.id} value={w._id ?? w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lb}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} className={fi}/>
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`${lb} mb-0`}>Defect Photos</label>
              {photos.length > 0 && (
                <button type="button" onClick={handleAnalyze} disabled={analyzing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                    aiUsed
                      ? 'bg-[#F0FDF4] text-[#15803d] border border-[#15803d]/30'
                      : 'bg-navy hover:bg-primary text-white'
                  } disabled:opacity-60`}>
                  {analyzing
                    ? <><Loader2 size={11} className="animate-spin"/> Analyzing…</>
                    : aiUsed
                    ? <><CheckCircle2 size={11}/> AI filled form</>
                    : <><Sparkles size={11}/> Analyze with AI</>
                  }
                </button>
              )}
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
              className="border-2 border-dashed border-[#DDDDDD] rounded-xl p-4 text-center cursor-pointer hover:border-primary hover:bg-[#D6E8F7]/10 transition-colors">
              <Camera size={20} className="text-muted mx-auto mb-1.5"/>
              <p className="text-[12px] text-muted">Click or drag photos here</p>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => handleFiles(e.target.files)}/>
            </div>
            {previews.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className={`relative w-16 h-16 rounded-lg overflow-hidden border ${i === 0 && aiUsed ? 'border-[#15803d]' : 'border-[#EFEFEF]'}`}>
                    <img src={src} className="w-full h-full object-cover"/>
                    {i === 0 && aiUsed && (
                      <div className="absolute bottom-0 left-0 right-0 bg-[#15803d]/80 flex items-center justify-center py-0.5">
                        <Sparkles size={9} className="text-white"/>
                      </div>
                    )}
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#dc2626] text-white flex items-center justify-center">
                      <X size={9}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length > 0 && !aiUsed && !analyzing && (
              <p className="text-[11px] text-muted mt-1.5 flex items-center gap-1">
                <Sparkles size={10}/>Tip: click "Analyze with AI" to auto-fill the form from the first photo
              </p>
            )}
          </div>

          {err && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] px-3 py-2 rounded-xl">{err}</p>}
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-[#F0F2F5] shrink-0">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] rounded-xl hover:border-primary hover:text-primary transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"/>Logging…</> : 'Log Snag'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Snag Card ────────────────────────────────────────────────────────────── */
function SnagCard({ snag, workers, onUpdate, onDelete }) {
  const [expanded,   setExpanded]  = useState(false)
  const [rejecting,  setRejecting] = useState(false)
  const [assigning,    setAssigning]    = useState(false)
  const [assignSel,    setAssignSel]    = useState('')   // controlled select value
  const [assignLoading,setAssignLoading]= useState(false)
  const [assignErr,    setAssignErr]    = useState('')
  const [fixFiles,     setFixFiles]     = useState([])
  const [uploading,    setUploading]    = useState(false)
  const [analyzing,    setAnalyzing]    = useState(false)
  const [aiResult,     setAiResult]     = useState(null)
  const [aiError,      setAiError]      = useState('')
  const [applying,     setApplying]     = useState(false)
  const fixRef = useRef()

  const sc  = SEV_CFG[snag.severity]  ?? SEV_CFG.Minor
  const stc = STATUS_CFG[snag.status] ?? STATUS_CFG.Open

  function openAssign() {
    // Pre-select current assignee so the dropdown shows who is assigned
    setAssignSel(snag.assignedTo?._id ?? snag.assignedTo ?? '')
    setAssignErr('')
    setAssigning(true)
  }

  async function confirmAssign() {
    setAssignLoading(true)
    setAssignErr('')
    try {
      const payload = { assignedTo: assignSel || null }
      if (assignSel && snag.status === 'Open') payload.status = 'In Progress'
      const updated = await updateSnag(snag._id, payload)
      onUpdate(updated)
      setAssigning(false)
    } catch (e) {
      setAssignErr(e.message || 'Failed to assign')
    } finally {
      setAssignLoading(false)
    }
  }

  async function setStatus(status) {
    const updated = await updateSnag(snag._id, { status })
    onUpdate(updated)
  }

  async function submitFixPhotos() {
    if (!fixFiles.length) return
    setUploading(true)
    try {
      const updated = await uploadFixPhotos(snag._id, fixFiles)
      onUpdate(updated)
      setFixFiles([])
    } catch(e) { console.error(e) } finally { setUploading(false) }
  }

  async function handleAnalyze() {
    const photos = snag.photos ?? []
    if (!photos.length) return
    setAnalyzing(true); setAiResult(null); setAiError('')
    try {
      const result = await analyzeSnagPhoto(photos[0].url)
      setAiResult(result)
    } catch (e) {
      setAiError(e.message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  async function applyAiSuggestions() {
    if (!aiResult) return
    setApplying(true)
    try {
      const updated = await updateSnag(snag._id, {
        title:       aiResult.title,
        description: aiResult.description,
        severity:    aiResult.severity,
        ...(aiResult.location && { location: aiResult.location }),
      })
      onUpdate(updated)
      setAiResult(null)
    } catch(e) { console.error(e) } finally { setApplying(false) }
  }

  const allPhotos    = snag.photos    ?? []
  const allFixPhotos = snag.fixPhotos ?? []

  return (
    <>
      <div className={`bg-white rounded-2xl border-l-4 border border-[#EFEFEF] shadow-sm transition-all ${sc.border} ${snag.status === 'Verified' ? 'opacity-70' : ''} ${expanded ? 'shadow-md' : 'hover:shadow-md'}`}>

        {/* ── Header ── */}
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
                {snag.assignedTo ? (
                  <span className="flex items-center gap-1.5">
                    <Initials name={snag.assignedTo.name} initials={snag.assignedTo.initials}/>
                    {snag.assignedTo.name}
                  </span>
                ) : (
                  <span className="text-[#dc2626] font-medium">Unassigned</span>
                )}
                {snag.dueDate && (
                  <span className="flex items-center gap-1"><Calendar size={10}/>Due {fmtDate(snag.dueDate)}</span>
                )}
                {allPhotos.length > 0 && (
                  <span className="flex items-center gap-1"><Camera size={10}/>{allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''}</span>
                )}
                {allFixPhotos.length > 0 && (
                  <span className="flex items-center gap-1 text-[#15803d]"><Camera size={10}/>{allFixPhotos.length} fix photo{allFixPhotos.length !== 1 ? 's' : ''}</span>
                )}
                <span className="text-[10px]">Logged {fmtDate(snag.createdAt?.split?.('T')?.[0] ?? '')}</span>
              </div>
            </div>
            <div className="shrink-0 text-muted">{expanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}</div>
          </div>
        </div>

        {/* ── Expanded ── */}
        {expanded && (
          <div className="border-t border-[#F0F2F5] px-5 py-4 space-y-4">

            {/* Description */}
            {snag.description && (
              <p className="text-[13px] text-body leading-relaxed">{snag.description}</p>
            )}

            {/* Notes */}
            {snag.notes && (
              <div className="bg-[#F7F9FC] rounded-xl px-3.5 py-3 text-[12px] text-muted">
                <span className="font-semibold text-body">Notes: </span>{snag.notes}
              </div>
            )}

            {/* Rejection note */}
            {snag.status === 'Rejected' && snag.rejectedNote && (
              <div className="bg-[#FEF2F2] border border-[#dc2626]/20 rounded-xl px-3.5 py-3 text-[12px] text-[#dc2626]">
                <span className="font-semibold">Rejected: </span>{snag.rejectedNote}
              </div>
            )}

            {/* Defect photos + AI analysis */}
            {allPhotos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Defect Photos</p>
                  <button onClick={handleAnalyze} disabled={analyzing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-navy hover:bg-primary text-white rounded-lg transition-colors disabled:opacity-60">
                    {analyzing
                      ? <><Loader2 size={11} className="animate-spin"/> Analyzing…</>
                      : <><Sparkles size={11}/> Analyze with AI</>}
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {allPhotos.map((p, i) => (
                    <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                      className="w-20 h-20 rounded-xl overflow-hidden border border-[#EFEFEF] hover:opacity-90 transition-opacity shrink-0">
                      <img src={p.url} alt="" className="w-full h-full object-cover"/>
                    </a>
                  ))}
                </div>

                {aiError && (
                  <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] px-3 py-2 rounded-xl">{aiError}</p>
                )}

                {aiResult && (
                  <div className="rounded-xl border border-[#1B4F8A]/20 bg-[#D6E8F7]/20 px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                        <Sparkles size={11}/> AI Analysis
                      </span>
                      <button onClick={() => setAiResult(null)} className="text-muted hover:text-body p-0.5">
                        <X size={12}/>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[13px] font-semibold text-body">{aiResult.title}</p>
                      <p className="text-[12px] text-muted leading-relaxed">{aiResult.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${SEV_CFG[aiResult.severity]?.badge}`}>
                          AI: {aiResult.severity}
                        </span>
                        {aiResult.severity !== snag.severity && (
                          <span className="text-[10px] text-[#E07B20] font-medium">
                            ⚠ Differs from logged severity ({snag.severity})
                          </span>
                        )}
                        {aiResult.severity === snag.severity && (
                          <span className="text-[10px] text-[#15803d] font-medium">
                            ✓ Matches logged severity
                          </span>
                        )}
                        {aiResult.location && (
                          <span className="text-[10px] text-muted flex items-center gap-1">
                            <MapPin size={9}/>{aiResult.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button onClick={applyAiSuggestions} disabled={applying}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-lg transition-colors disabled:opacity-50">
                        {applying ? 'Applying…' : 'Apply to snag'}
                      </button>
                      <button onClick={() => setAiResult(null)}
                        className="px-3 py-1.5 text-[11px] font-medium text-muted border border-[#DDDDDD] rounded-lg hover:text-body transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fix photos */}
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

            {/* Upload fix photos */}
            {['In Progress', 'Fixed', 'Rejected'].includes(snag.status) && (
              <div>
                <input ref={fixRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => setFixFiles(Array.from(e.target.files))}/>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => fixRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-primary border border-[#D6E8F7] bg-[#D6E8F7] hover:bg-primary hover:text-white rounded-lg transition-colors">
                    <Upload size={12}/> {fixFiles.length ? `${fixFiles.length} selected` : 'Attach Fix Photos'}
                  </button>
                  {fixFiles.length > 0 && (
                    <button onClick={submitFixPhotos} disabled={uploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-lg transition-colors disabled:opacity-50">
                      {uploading ? 'Uploading…' : 'Upload'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Assign worker inline */}
            {assigning && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={assignSel}
                    onChange={e => setAssignSel(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-[12px] border border-[#DDDDDD] rounded-xl focus:outline-none focus:border-primary bg-white text-body">
                    <option value="">— Unassigned —</option>
                    {workers.map(w => <option key={w._id ?? w.id} value={w._id ?? w.id}>{w.name}</option>)}
                  </select>
                  <button
                    onClick={confirmAssign}
                    disabled={assignLoading}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-lg transition-colors disabled:opacity-50">
                    {assignLoading ? <><Loader2 size={11} className="animate-spin"/>Saving…</> : 'Assign'}
                  </button>
                  <button onClick={() => setAssigning(false)} className="p-1.5 text-muted hover:text-body transition-colors">
                    <X size={14}/>
                  </button>
                </div>
                {assignErr && (
                  <p className="text-[11px] text-[#dc2626]">{assignErr}</p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {snag.status === 'Open' && (
                <>
                  <button onClick={() => setStatus('In Progress')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#1B4F8A] hover:bg-primary rounded-lg transition-colors">
                    <Wrench size={11}/> In Progress
                  </button>
                  <button onClick={openAssign}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-primary border border-[#D6E8F7] bg-[#D6E8F7] rounded-lg hover:bg-primary hover:text-white transition-colors">
                    <User size={11}/> Assign
                  </button>
                </>
              )}
              {snag.status === 'In Progress' && (
                <>
                  <button onClick={() => setStatus('Fixed')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#E07B20] hover:bg-[#c96d18] rounded-lg transition-colors">
                    <CheckCircle2 size={11}/> Mark Fixed
                  </button>
                  <button onClick={() => setAssigning(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-primary border border-[#D6E8F7] bg-[#D6E8F7] rounded-lg hover:bg-primary hover:text-white transition-colors">
                    <User size={11}/> Reassign
                  </button>
                </>
              )}
              {snag.status === 'Fixed' && (
                <>
                  <button onClick={() => setStatus('Verified')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-lg transition-colors">
                    <ThumbsUp size={11}/> Verify
                  </button>
                  <button onClick={() => setRejecting(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-lg transition-colors">
                    <ThumbsDown size={11}/> Reject
                  </button>
                </>
              )}
              {snag.status === 'Verified' && (
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#15803d]">
                  <CheckCircle2 size={14}/> Verified by {snag.verifiedBy?.name ?? '—'}
                </span>
              )}
              {snag.status === 'Rejected' && (
                <button onClick={() => setStatus('In Progress')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#1B4F8A] hover:bg-primary rounded-lg transition-colors">
                  <RotateCcw size={11}/> Retry
                </button>
              )}
              <button onClick={() => onDelete(snag._id)} className="ml-auto text-muted hover:text-[#dc2626] transition-colors p-1" title="Delete snag">
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {rejecting && (
        <RejectModal snag={snag} onClose={() => setRejecting(false)} onRejected={s => { onUpdate(s); setRejecting(false) }}/>
      )}
    </>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
const STATUS_TABS = ['All', 'Open', 'In Progress', 'Fixed', 'Verified', 'Rejected']
const SEV_TABS    = ['All', 'Critical', 'Major', 'Minor']

export default function SupervisorSnags() {
  const [snags,     setSnags]     = useState([])
  const [projects,  setProjects]  = useState([])
  const [workers,   setWorkers]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [project,   setProject]   = useState('all')
  const [statusTab, setStatusTab] = useState('All')
  const [sevTab,    setSevTab]    = useState('All')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    Promise.all([getProjects(), getUsers(), getSnags()])
      .then(([ps, ws, ss]) => {
        setProjects((ps ?? []).map(projectToRow))
        setWorkers((ws ?? []).filter(u => u.role !== 'Client'))
        setSnags(ss ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const displayed = useMemo(() => {
    let list = [...snags]
    if (project   !== 'all') list = list.filter(s => String(s.projectId?._id ?? s.projectId) === project)
    if (statusTab !== 'All') list = list.filter(s => s.status    === statusTab)
    if (sevTab    !== 'All') list = list.filter(s => s.severity  === sevTab)
    return list
  }, [snags, project, statusTab, sevTab])

  const counts = useMemo(() => {
    const base = project !== 'all' ? snags.filter(s => String(s.projectId?._id ?? s.projectId) === project) : snags
    return {
      total:      base.length,
      Open:       base.filter(s => s.status === 'Open').length,
      'In Progress': base.filter(s => s.status === 'In Progress').length,
      Fixed:      base.filter(s => s.status === 'Fixed').length,
      Verified:   base.filter(s => s.status === 'Verified').length,
      Rejected:   base.filter(s => s.status === 'Rejected').length,
    }
  }, [snags, project])

  const readyPct = counts.total ? Math.round((counts.Verified / counts.total) * 100) : 0

  function handleUpdate(updated) { setSnags(prev => prev.map(s => String(s._id) === String(updated._id) ? updated : s)) }
  async function handleDelete(id) { await deleteSnag(id); setSnags(prev => prev.filter(s => String(s._id) !== String(id))) }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-sora text-[20px] font-bold text-body leading-tight">Snagging / Punchlist</h2>
          <p className="text-[13px] text-muted mt-0.5">Track every defect before handover — assign, verify, and close out</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-[13px] font-semibold rounded-xl transition-colors">
          <Plus size={14} strokeWidth={2.5}/> Log Snag
        </button>
      </div>

      {/* Project selector + progress */}
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-sm p-5">
        <div className="flex items-center gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <FolderKanban size={14} className="text-muted shrink-0"/>
            <select value={project} onChange={e => setProject(e.target.value)}
              className="px-3 py-1.5 text-[13px] border border-[#EFEFEF] rounded-xl focus:outline-none focus:border-primary bg-white text-body appearance-none cursor-pointer">
              <option value="all">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11px] text-muted">Handover Readiness</p>
            <p className="font-sora font-bold text-[18px] text-[#15803d]">{readyPct}%</p>
          </div>
        </div>

        {/* Stats row */}
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
            <span>{counts.Verified} of {counts.total} verified</span>
            <span>{readyPct}% ready for handover</span>
          </div>
          <div className="w-full h-3 bg-[#F0F4F8] rounded-full overflow-hidden">
            <div className="h-3 bg-[#15803d] rounded-full transition-all duration-700" style={{ width: `${readyPct}%` }}/>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => setStatusTab(s)}
              className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${statusTab === s ? 'bg-navy text-white' : 'bg-white text-muted border border-[#EFEFEF] hover:text-body'}`}>
              {s}{s !== 'All' && counts[s] !== undefined ? ` (${counts[s]})` : ''}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {SEV_TABS.map(s => (
            <button key={s} onClick={() => setSevTab(s)}
              className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${sevTab === s ? (s === 'Critical' ? 'bg-[#dc2626] text-white' : s === 'Major' ? 'bg-[#E07B20] text-white' : 'bg-navy text-white') : 'bg-white text-muted border border-[#EFEFEF] hover:text-body'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Snag list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-[#EFEFEF] p-5 animate-pulse">
              <div className="flex gap-3"><div className="h-4 bg-[#F0F2F5] rounded w-48"/><div className="h-4 bg-[#F0F2F5] rounded w-20 ml-auto"/></div>
              <div className="h-3 bg-[#F0F2F5] rounded w-64 mt-2"/>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center py-20 bg-white rounded-2xl border border-[#EFEFEF] gap-3">
          <ClipboardList size={36} strokeWidth={1.25} className="text-muted/40"/>
          <p className="text-[14px] font-semibold text-muted">{snags.length === 0 ? 'No snags logged yet' : 'No snags match these filters'}</p>
          {snags.length === 0 && (
            <button onClick={() => setShowCreate(true)} className="mt-1 flex items-center gap-1.5 px-4 py-2 bg-[#dc2626] text-white text-[13px] font-semibold rounded-xl hover:bg-[#b91c1c] transition-colors">
              <Plus size={13}/> Log First Snag
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(s => (
            <SnagCard key={String(s._id)} snag={s} workers={workers}
              onUpdate={handleUpdate} onDelete={handleDelete}/>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateSnagModal projects={projects} workers={workers}
          onClose={() => setShowCreate(false)}
          onCreated={snag => { setSnags(prev => [snag, ...prev]); setShowCreate(false) }}/>
      )}
    </div>
  )
}
