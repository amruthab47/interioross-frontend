import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Camera, X, ChevronLeft, ChevronRight, Images,
  Calendar, FolderKanban, ArrowUpDown, SlidersHorizontal,
  Send, CheckCircle, AlertCircle, Loader,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getGalleryPhotos, sendProgressSummary } from '../api/reports'
import { getProjects } from '../api/projects'

const PERIOD_OPTIONS = [
  { value: 'all',   label: 'All Time'   },
  { value: 'today', label: 'Today'      },
  { value: 'week',  label: 'This Week'  },
  { value: 'month', label: 'This Month' },
]

const STAGE_OPTIONS = [
  { value: 'all',      label: 'All Stages'     },
  { value: 'early',    label: 'Early (0–33%)'  },
  { value: 'mid',      label: 'Mid (34–66%)'   },
  { value: 'final',    label: 'Final (67–99%)' },
  { value: 'complete', label: 'Completed'       },
]

function fmtDate(str) {
  if (!str) return ''
  return new Date(str + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function statusColor(status) {
  if (status === 'Completed') return 'bg-green-500/20 text-green-300'
  if (status === 'Critical')  return 'bg-red-500/20 text-red-300'
  if (status === 'Delayed')   return 'bg-orange-500/20 text-orange-300'
  return 'bg-blue-500/20 text-blue-300'
}

/* ── Send Update Modal ───────────────────────────────────────────────────── */
function SendUpdateModal({ projects, todayPhotosByProject, onClose }) {
  const firstId = projects[0]?._id?.toString() ?? ''
  const [projectId,     setProjectId]     = useState(firstId)
  const [overrideEmail, setOverrideEmail] = useState('')
  const [editingEmail,  setEditingEmail]  = useState(false)
  const [note,          setNote]          = useState('')
  const [status,        setStatus]        = useState('idle')
  const [result,        setResult]        = useState(null)

  const selectedProject = projects.find(p => String(p._id) === projectId)
  const clientName      = selectedProject?.clientId?.name  ?? ''
  const clientEmail     = selectedProject?.clientId?.email ?? ''
  const effectiveEmail  = overrideEmail.trim() || clientEmail
  const photoCount      = todayPhotosByProject[projectId] ?? 0
  const hasNoEmail      = !clientEmail && !overrideEmail.trim()

  // When project changes, reset email override and stop editing
  function handleProjectChange(id) {
    setProjectId(id)
    setOverrideEmail('')
    setEditingEmail(false)
  }

  async function handleSend() {
    if (!projectId || hasNoEmail) return
    setStatus('sending')
    try {
      const res = await sendProgressSummary(projectId, note, '', overrideEmail.trim() || undefined)
      setResult(res)
      setStatus('success')
    } catch (err) {
      setResult({ message: err.message || 'Failed to send.' })
      setStatus('error')
    }
  }

  const initials = clientName
    ? clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="bg-[#0F2340] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="font-sora font-bold text-[16px] text-white">Send Daily Update</h2>
            <p className="text-[12px] text-[#7AABDA] mt-0.5">Email today's progress summary to the client</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center">
              <CheckCircle size={28} className="text-[#15803d]" />
            </div>
            <p className="font-sora font-bold text-[15px] text-[#0F2340]">
              {result?.demo ? 'Demo Mode — Not Sent' : 'Update Sent!'}
            </p>
            <p className="text-[13px] text-[#777777] max-w-xs leading-relaxed">
              {result?.demo
                ? result.message
                : `Delivered to ${result?.to}. The client will see today's photos, progress, and milestones.`}
            </p>
            <button onClick={onClose}
              className="mt-3 px-6 py-2 bg-[#1B4F8A] text-white rounded-lg text-[13px] font-semibold hover:bg-[#163f6e] transition-colors">
              Done
            </button>
          </div>
        ) : status === 'error' ? (
          <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-[#FEF2F2] flex items-center justify-center">
              <AlertCircle size={28} className="text-[#dc2626]" />
            </div>
            <p className="font-sora font-bold text-[15px] text-[#0F2340]">Failed to Send</p>
            <p className="text-[13px] text-[#777777] max-w-xs">{result?.message}</p>
            <button onClick={() => setStatus('idle')}
              className="mt-3 px-6 py-2 bg-[#1B4F8A] text-white rounded-lg text-[13px] font-semibold hover:bg-[#163f6e] transition-colors">
              Try Again
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">

            {/* Project selector */}
            <div>
              <label className="block text-[11px] font-semibold text-[#777777] uppercase tracking-widest mb-1.5">Project</label>
              <select
                value={projectId}
                onChange={e => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#E0E6F0] rounded-xl text-[13px] text-[#333333] bg-white focus:outline-none focus:border-[#1B4F8A] appearance-none"
                style={selectArrowStyle}
              >
                {projects.map(p => (
                  <option key={p._id} value={String(p._id)}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Client confirmation card */}
            <div className={`rounded-xl border px-4 py-3 ${hasNoEmail ? 'bg-[#FFF8F2] border-[#E07B20]/40' : 'bg-[#F0F6FF] border-[#D6E8F7]'}`}>
              <p className="text-[10px] font-semibold text-[#777777] uppercase tracking-widest mb-2">Sending to</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1B4F8A] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0F2340] truncate">
                    {clientName || <span className="text-[#AAAAAA]">No client linked</span>}
                  </p>
                  {!editingEmail ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {effectiveEmail ? (
                        <>
                          <p className="text-[12px] text-[#555555] truncate">{effectiveEmail}</p>
                          {overrideEmail && (
                            <span className="text-[10px] bg-[#E07B20]/15 text-[#E07B20] font-semibold px-1.5 py-0.5 rounded shrink-0">custom</span>
                          )}
                        </>
                      ) : (
                        <p className="text-[12px] text-[#E07B20]">No email on file</p>
                      )}
                      <button
                        onClick={() => setEditingEmail(true)}
                        className="ml-auto text-[11px] text-[#1B4F8A] font-semibold hover:underline shrink-0"
                      >
                        {effectiveEmail ? 'Change' : 'Add email'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        autoFocus
                        type="email"
                        value={overrideEmail}
                        onChange={e => setOverrideEmail(e.target.value)}
                        placeholder={clientEmail || 'Enter email address'}
                        className="flex-1 min-w-0 px-2 py-1 border border-[#1B4F8A] rounded-lg text-[12px] text-[#333333] placeholder-[#BBBBBB] focus:outline-none"
                      />
                      <button
                        onClick={() => setEditingEmail(false)}
                        className="text-[11px] text-[#1B4F8A] font-semibold hover:underline shrink-0"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {hasNoEmail && !editingEmail && (
                <p className="text-[11px] text-[#E07B20] mt-2">Add an email above to send this update.</p>
              )}
            </div>

            {/* Photo count + today info */}
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${photoCount > 0 ? 'bg-[#F0FDF4] border-[#bbf7d0]' : 'bg-[#F7F9FC] border-[#E0E6F0]'}`}>
              <Camera size={14} className={photoCount > 0 ? 'text-[#15803d]' : 'text-[#AAAAAA]'} />
              <p className={`text-[12px] font-medium ${photoCount > 0 ? 'text-[#15803d]' : 'text-[#AAAAAA]'}`}>
                {photoCount > 0
                  ? `${photoCount} photo${photoCount !== 1 ? 's' : ''} from today will be included`
                  : 'No photos uploaded today — email will still be sent'}
              </p>
            </div>

            {/* Optional note */}
            <div>
              <label className="block text-[11px] font-semibold text-[#777777] uppercase tracking-widest mb-1.5">
                Personal Note <span className="normal-case font-normal text-[#AAAAAA]">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="e.g. Flooring is on schedule, expect foundation to complete by Friday…"
                className="w-full px-3 py-2.5 border border-[#E0E6F0] rounded-xl text-[13px] text-[#333333] placeholder-[#BBBBBB] resize-none focus:outline-none focus:border-[#1B4F8A] leading-relaxed"
              />
            </div>

            {/* What's included */}
            <div className="bg-[#F7F9FC] rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold text-[#777777] uppercase tracking-widest mb-2">Email will include</p>
              <div className="grid grid-cols-2 gap-1">
                {["Today's site photos", "Project progress bar", "Supervisor report notes", "Payment milestone status"].map(item => (
                  <div key={item} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] shrink-0" />
                    <p className="text-[11px] text-[#555555]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pb-1">
              <button onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-[#E0E6F0] rounded-xl text-[13px] font-medium text-[#555555] hover:bg-[#F7F9FC] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!projectId || hasNoEmail || status === 'sending'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B4F8A] text-white rounded-xl text-[13px] font-semibold hover:bg-[#163f6e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'sending'
                  ? <><Loader size={13} className="animate-spin" /> Sending…</>
                  : <><Send size={13} /> Send Update</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SiteGalleryPage() {
  const { user } = useAuth()
  const isClient     = user?.role === 'Client'
  const isDesigner   = user?.role === 'Designer'
  const isSupervisor = user?.role === 'Supervisor' || user?.role === 'Admin'
  const showProjectFilter = isSupervisor || isDesigner

  const [allPhotos,     setAllPhotos]     = useState([])
  const [projects,      setProjects]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filterPeriod,  setFilterPeriod]  = useState('all')
  const [filterProject, setFilterProject] = useState('all')
  const [filterStage,   setFilterStage]   = useState('all')
  const [sortDesc,      setSortDesc]      = useState(true)
  const [lightboxIdx,   setLightboxIdx]   = useState(null)
  const [showSendModal, setShowSendModal] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const projs = await getProjects().catch(() => [])
        setProjects(projs || [])

        let photos
        if (isClient && projs?.length > 0) {
          // Client only sees their own project's photos
          photos = await getGalleryPhotos({ projectId: projs[0]._id }).catch(() => [])
          setFilterProject(String(projs[0]._id))
        } else {
          photos = await getGalleryPhotos().catch(() => [])
        }
        setAllPhotos(photos || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isClient])

  // ── Filtering & sorting ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...allPhotos]

    if (filterPeriod !== 'all') {
      const now = new Date()
      const todayStr = now.toISOString().slice(0, 10)
      if (filterPeriod === 'today') {
        list = list.filter(p => p.reportDate === todayStr)
      } else if (filterPeriod === 'week') {
        const d = new Date(now); d.setDate(d.getDate() - 7)
        const cutoff = d.toISOString().slice(0, 10)
        list = list.filter(p => p.reportDate >= cutoff)
      } else if (filterPeriod === 'month') {
        const cutoff = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
        list = list.filter(p => p.reportDate >= cutoff)
      }
    }

    if (filterProject !== 'all') {
      list = list.filter(p => String(p.projectId) === filterProject)
    }

    if (filterStage !== 'all') {
      list = list.filter(p => {
        const prog = p.projectProgress ?? 0
        if (filterStage === 'early')    return prog <= 33
        if (filterStage === 'mid')      return prog > 33 && prog <= 66
        if (filterStage === 'final')    return prog > 66 && prog < 100
        if (filterStage === 'complete') return prog >= 100
        return true
      })
    }

    list.sort((a, b) => {
      const cmp = a.reportDate.localeCompare(b.reportDate)
      return sortDesc ? -cmp : cmp
    })

    return list
  }, [allPhotos, filterPeriod, filterProject, filterStage, sortDesc])

  // ── Lightbox keyboard navigation ──────────────────────────────────────────
  useEffect(() => {
    if (lightboxIdx === null) return
    const handle = (e) => {
      if (e.key === 'ArrowRight') setLightboxIdx(i => (i < filtered.length - 1 ? i + 1 : i))
      if (e.key === 'ArrowLeft')  setLightboxIdx(i => (i > 0 ? i - 1 : i))
      if (e.key === 'Escape')     setLightboxIdx(null)
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [lightboxIdx, filtered.length])

  const lightboxPhoto = lightboxIdx !== null ? filtered[lightboxIdx] : null

  // ── Today's photo counts per project (for Send modal) ────────────────────
  const todayPhotosByProject = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const map = {}
    allPhotos.forEach(p => {
      if (p.reportDate === today) {
        const key = String(p.projectId)
        map[key] = (map[key] || 0) + 1
      }
    })
    return map
  }, [allPhotos])

  // ── Group photos by date for the timeline header display ──────────────────
  const grouped = useMemo(() => {
    const map = []
    const seen = {}
    filtered.forEach((photo, idx) => {
      const key = photo.reportDate
      if (!seen[key]) {
        seen[key] = true
        map.push({ date: key, startIdx: idx })
      }
    })
    return map
  }, [filtered])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-[#D6E8F7] border-t-[#1B4F8A] animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D6E8F7] flex items-center justify-center shrink-0">
            <Camera size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="font-sora font-bold text-xl text-navy leading-tight">Site Gallery</h1>
            <p className="text-muted text-[12px] mt-0.5">
              {filtered.length} photo{filtered.length !== 1 ? 's' : ''}
              {allPhotos.length !== filtered.length && ` of ${allPhotos.length} total`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSupervisor && projects.length > 0 && (
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1B4F8A] text-white rounded-lg text-[12px] font-semibold hover:bg-[#163f6e] transition-colors shadow-sm"
            >
              <Send size={13} />
              Send Daily Update
            </button>
          )}
          <button
            onClick={() => setSortDesc(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#E0E6F0] rounded-lg text-[12px] text-body hover:border-primary transition-colors bg-white"
          >
            <ArrowUpDown size={13} />
            {sortDesc ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E0E6F0] px-4 py-3 mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* Period */}
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-muted shrink-0" />
          <div className="flex gap-1">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilterPeriod(opt.value)}
                className={[
                  'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                  filterPeriod === opt.value
                    ? 'bg-primary text-white'
                    : 'bg-[#F7F9FC] text-body hover:bg-[#D6E8F7] hover:text-primary',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Stage filter */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal size={13} className="text-muted shrink-0" />
            <select
              value={filterStage}
              onChange={e => setFilterStage(e.target.value)}
              className="pl-2 pr-7 py-1.5 border border-[#E0E6F0] rounded-lg text-[11px] text-body bg-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
              style={selectArrowStyle}
            >
              {STAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Project filter — supervisor / designer / admin only */}
          {showProjectFilter && (
            <div className="flex items-center gap-1.5">
              <FolderKanban size={13} className="text-muted shrink-0" />
              <select
                value={filterProject}
                onChange={e => setFilterProject(e.target.value)}
                className="pl-2 pr-7 py-1.5 border border-[#E0E6F0] rounded-lg text-[11px] text-body bg-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
                style={selectArrowStyle}
              >
                <option value="all">All Projects</option>
                {projects.map(p => (
                  <option key={p._id} value={String(p._id)}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-[#F7F9FC] border border-[#E0E6F0] flex items-center justify-center mb-4">
            <Images size={28} strokeWidth={1.25} className="text-muted" />
          </div>
          <p className="font-sora font-semibold text-base text-navy">No site photos</p>
          <p className="text-muted text-sm mt-1.5 text-center max-w-xs">
            {isSupervisor
              ? 'Submit a daily report with photos and they will appear here.'
              : 'No site progress photos have been uploaded yet.'}
          </p>
        </div>
      ) : (
        /* ── Photo grid ───────────────────────────────────────────────── */
        <div className="space-y-8">
          {grouped.map(group => {
            const groupPhotos = filtered.filter(p => p.reportDate === group.date)
            return (
              <div key={group.date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-sora font-semibold text-[13px] text-navy">{fmtDate(group.date)}</span>
                  <span className="text-muted text-[11px]">{groupPhotos.length} photo{groupPhotos.length !== 1 ? 's' : ''}</span>
                  <div className="flex-1 h-px bg-[#E0E6F0]" />
                  {showProjectFilter && groupPhotos[0]?.projectName && (
                    <span className="text-[11px] text-primary font-medium bg-[#D6E8F7] px-2 py-0.5 rounded-full">
                      {groupPhotos[0].projectName}
                      {groupPhotos.some(p => p.projectName !== groupPhotos[0].projectName) && ' & others'}
                    </span>
                  )}
                </div>

                {/* Photo row */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {groupPhotos.map(photo => {
                    const absIdx = filtered.indexOf(photo)
                    return (
                      <button
                        key={`${photo.reportId}-${photo.publicId}`}
                        onClick={() => setLightboxIdx(absIdx)}
                        className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-[#E8EEF5] hover:shadow-md transition-all duration-200 hover:scale-[1.02] focus:outline-none"
                      >
                        <img
                          src={photo.url}
                          alt={photo.originalName || 'Site photo'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        {/* Project badge (supervisor) */}
                        {showProjectFilter && photo.projectName && (
                          <div className="absolute top-2 left-2 bg-navy/75 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm truncate max-w-[80%]">
                            {photo.projectName}
                          </div>
                        )}
                        {/* Bottom info on hover */}
                        <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
                          {photo.supervisorName && (
                            <p className="text-white/80 text-[10px]">by {photo.supervisorName}</p>
                          )}
                          {photo.summary && (
                            <p className="text-white text-[11px] font-medium truncate mt-0.5">{photo.summary}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Send Update Modal ───────────────────────────────────────────── */}
      {showSendModal && (
        <SendUpdateModal
          projects={projects}
          todayPhotosByProject={todayPhotosByProject}
          onClose={() => setShowSendModal(false)}
        />
      )}

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors z-10"
          >
            <X size={22} />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/40 text-[12px]">
            {lightboxIdx + 1} / {filtered.length}
          </div>

          {/* Prev */}
          {lightboxIdx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => i - 1) }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors z-10"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* Next */}
          {lightboxIdx < filtered.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => i + 1) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors z-10"
              style={{ right: lightboxPhoto ? '304px' : '12px' }}
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* Content */}
          <div
            className="flex gap-5 max-w-6xl w-full mx-16 h-full max-h-[90vh] items-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            <div className="flex-1 flex items-center justify-center min-w-0 min-h-0">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.originalName || 'Site photo'}
                className="max-h-[82vh] max-w-full object-contain rounded-xl"
              />
            </div>

            {/* Info panel */}
            <div className="w-64 shrink-0 flex flex-col gap-3">
              <div className="bg-white/8 rounded-xl p-4 space-y-4 border border-white/10">
                <div>
                  <p className="text-white/40 text-[9px] uppercase tracking-widest mb-1">Date</p>
                  <p className="text-white font-semibold text-[13px]">{fmtDate(lightboxPhoto.reportDate)}</p>
                </div>

                {lightboxPhoto.projectName && (
                  <div>
                    <p className="text-white/40 text-[9px] uppercase tracking-widest mb-1">Project</p>
                    <p className="text-white font-semibold text-[13px]">{lightboxPhoto.projectName}</p>
                    {lightboxPhoto.projectStatus && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(lightboxPhoto.projectStatus)}`}>
                          {lightboxPhoto.projectStatus}
                        </span>
                        {lightboxPhoto.projectProgress != null && (
                          <span className="text-white/40 text-[10px]">{lightboxPhoto.projectProgress}% done</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {lightboxPhoto.supervisorName && (
                  <div>
                    <p className="text-white/40 text-[9px] uppercase tracking-widest mb-1">Submitted by</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {lightboxPhoto.supervisorInitials || lightboxPhoto.supervisorName[0]}
                      </div>
                      <p className="text-white text-[12px]">{lightboxPhoto.supervisorName}</p>
                    </div>
                  </div>
                )}

                {lightboxPhoto.summary && (
                  <div>
                    <p className="text-white/40 text-[9px] uppercase tracking-widest mb-1">Report Notes</p>
                    <p className="text-white/75 text-[12px] leading-relaxed">{lightboxPhoto.summary}</p>
                  </div>
                )}

                {lightboxPhoto.originalName && (
                  <div>
                    <p className="text-white/40 text-[9px] uppercase tracking-widest mb-1">File</p>
                    <p className="text-white/50 text-[10px] truncate">{lightboxPhoto.originalName}</p>
                  </div>
                )}
              </div>

              <p className="text-white/25 text-[10px] text-center">← → to navigate · ESC to close</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const selectArrowStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23777777'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 6px center',
  backgroundSize: '12px',
}
