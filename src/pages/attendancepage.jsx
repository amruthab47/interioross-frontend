import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  CheckCircle2, UserX, Clock, BarChart2,
  Check, X, CalendarDays, ChevronLeft, ChevronRight,
  Search, Plus, FileText, Image as ImageIcon, ChevronDown,
  TrendingUp, IndianRupee, Timer,
  MapPin, Lock, Navigation, Loader2, ShieldCheck, AlertTriangle,
} from 'lucide-react'
import { getAttendance, getEmployeeAttendance, getLeaveRequests, getAttendanceCalendar, applyLeave, updateLeaveStatus, submitAttendance } from '../api/attendance'
import { getProjects, setSiteLocation } from '../api/projects'
import { getUsers } from '../api/users'
import { projectToRow } from '../utils/format'

/* ─── haversine distance (metres) ───────────────────────── */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fmtDist(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`
}

/* ─── Set Site Location Modal ────────────────────────────── */
function SetSiteModal({ projects, onClose, onSaved }) {
  const [projectId, setProjectId] = useState(projects[0]?._id?.toString() ?? '')
  const [step,      setStep]      = useState('idle')   // idle | locating | done | error
  const [coords,    setCoords]    = useState(null)
  const [radius,    setRadius]    = useState(300)
  const [saving,    setSaving]    = useState(false)
  const [errMsg,    setErrMsg]    = useState('')

  async function detectLocation() {
    if (!navigator.geolocation) { setErrMsg('GPS not available on this device.'); setStep('error'); return }
    setStep('locating')
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }); setStep('done') },
      err => { setErrMsg(err.message || 'Could not get location.'); setStep('error') },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  async function save() {
    if (!coords || !projectId) return
    setSaving(true)
    try {
      await setSiteLocation(projectId, coords.lat, coords.lng, radius)
      onSaved(projectId, coords, radius)
      onClose()
    } catch (e) { setErrMsg(e.message || 'Failed to save.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-2xl w-full max-w-[400px] overflow-hidden">
        <div className="bg-[#0F2340] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="font-sora font-bold text-[15px] text-white">Set Site Location</h2>
            <p className="text-[11px] text-[#7AABDA] mt-0.5">Pin the geofence for attendance</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X size={16}/></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-[#777777] uppercase tracking-widest mb-1.5">Project</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#E0E6F0] rounded-xl text-[13px] text-[#333333] bg-white focus:outline-none focus:border-[#1B4F8A] appearance-none">
              {projects.map(p => <option key={p._id} value={String(p._id)}>{p.name}</option>)}
            </select>
          </div>

          {step === 'idle' && (
            <button onClick={detectLocation}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#1B4F8A] hover:bg-[#163f6e] text-white rounded-xl text-[13px] font-semibold transition-colors">
              <Navigation size={14}/> Use My Current Location
            </button>
          )}

          {step === 'locating' && (
            <div className="flex items-center justify-center gap-2.5 py-4 bg-[#F7F9FC] rounded-xl">
              <Loader2 size={16} className="animate-spin text-[#1B4F8A]"/>
              <p className="text-[13px] text-[#555555]">Detecting GPS location…</p>
            </div>
          )}

          {step === 'done' && coords && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 bg-[#F0FDF4] border border-[#bbf7d0] rounded-xl">
                <MapPin size={16} className="text-[#15803d] shrink-0 mt-0.5"/>
                <div>
                  <p className="text-[12px] font-semibold text-[#15803d]">Location captured</p>
                  <p className="text-[11px] text-[#555555] mt-0.5">{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</p>
                  <p className="text-[10px] text-[#777777] mt-0.5">Accuracy: ±{coords.accuracy}m</p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#777777] uppercase tracking-widest mb-1.5">
                  Geofence Radius: {radius}m
                </label>
                <input type="range" min={100} max={1000} step={50} value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  className="w-full accent-[#1B4F8A]"/>
                <div className="flex justify-between text-[10px] text-[#AAAAAA] mt-0.5">
                  <span>100m</span><span>1000m</span>
                </div>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="flex items-center gap-2.5 p-3.5 bg-[#FEF2F2] border border-[#fecaca] rounded-xl">
              <AlertTriangle size={14} className="text-[#dc2626] shrink-0"/>
              <p className="text-[12px] text-[#dc2626]">{errMsg}</p>
            </div>
          )}

          {errMsg && step !== 'error' && (
            <p className="text-[12px] text-[#dc2626]">{errMsg}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-[#E0E6F0] rounded-xl text-[13px] font-medium text-[#555555] hover:bg-[#F7F9FC] transition-colors">
              Cancel
            </button>
            <button onClick={save} disabled={step !== 'done' || saving}
              className="flex-1 py-2.5 bg-[#0F2340] hover:bg-[#1B4F8A] text-white rounded-xl text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {saving ? 'Saving…' : 'Save Site Location'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Mark Attendance Modal ──────────────────────────────── */
function MarkAttendanceModal({ projects, onClose, onMarked }) {
  const today   = new Date().toISOString().slice(0, 10)
  const timeNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  const [projectId, setProjectId] = useState(projects[0]?._id?.toString() ?? '')
  const [step,      setStep]      = useState('init')   // init | locating | locked | ready | submitting | done
  const [location,  setLocation]  = useState(null)
  const [distance,  setDistance]  = useState(null)
  const [workers,   setWorkers]   = useState([])       // { id, name, initials, role, status }
  const [errMsg,    setErrMsg]    = useState('')

  const proj = projects.find(p => String(p._id) === projectId)

  // Load workers when project changes
  useEffect(() => {
    getUsers().then(users => {
      const list = (users || [])
        .filter(u => u.role !== 'Admin' && u.role !== 'Client')
        .map(u => ({ id: String(u._id), name: u.name, initials: u.initials || u.name?.slice(0, 2), role: u.role, status: 'Present' }))
      setWorkers(list)
    }).catch(console.error)
  }, [])

  function startLocating() {
    if (!navigator.geolocation) { setErrMsg('GPS not supported.'); return }
    setStep('locating')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }
        setLocation(loc)
        if (proj?.siteLat && proj?.siteLng) {
          const dist = haversine(loc.lat, loc.lng, proj.siteLat, proj.siteLng)
          setDistance(Math.round(dist))
          setStep(dist <= (proj.siteRadius ?? 300) ? 'ready' : 'locked')
        } else {
          setDistance(null)
          setStep('ready') // No site set — allow with warning
        }
      },
      err => { setErrMsg(err.message || 'Location access denied.'); setStep('init') },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  function toggleWorker(id) {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, status: w.status === 'Present' ? 'Absent' : 'Present' } : w))
  }

  function setAllStatus(status) {
    setWorkers(prev => prev.map(w => ({ ...w, status })))
  }

  async function submit() {
    setStep('submitting')
    try {
      const records = workers.map(w => ({
        userId: w.id, recordDate: today, status: w.status, projectId,
      }))
      await submitAttendance(records, location)
      onMarked()
      setStep('done')
    } catch (e) {
      setErrMsg(e.message || 'Failed to submit.')
      setStep('ready')
    }
  }

  const presentCount = workers.filter(w => w.status === 'Present').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-2xl w-full max-w-[480px] max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-[#0F2340] px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-sora font-bold text-[15px] text-white">Mark Today's Attendance</h2>
            <p className="text-[11px] text-[#7AABDA] mt-0.5">{today} · {timeNow}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X size={16}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Project selector */}
          <div>
            <label className="block text-[10px] font-semibold text-[#777777] uppercase tracking-widest mb-1.5">Project</label>
            <select value={projectId} onChange={e => { setProjectId(e.target.value); setStep('init'); setLocation(null); setDistance(null) }}
              className="w-full px-3 py-2.5 border border-[#E0E6F0] rounded-xl text-[13px] text-[#333333] bg-white focus:outline-none focus:border-[#1B4F8A] appearance-none">
              {projects.map(p => <option key={p._id} value={String(p._id)}>{p.name}</option>)}
            </select>
          </div>

          {/* Geofence status */}
          {step === 'init' && (
            <button onClick={startLocating}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1B4F8A] hover:bg-[#163f6e] text-white rounded-xl text-[13px] font-semibold transition-colors">
              <Navigation size={14}/> Verify Location to Continue
            </button>
          )}

          {step === 'locating' && (
            <div className="flex items-center justify-center gap-2.5 py-5 bg-[#F7F9FC] rounded-xl border border-[#E0E6F0]">
              <Loader2 size={16} className="animate-spin text-[#1B4F8A]"/>
              <p className="text-[13px] text-[#555555] font-medium">Detecting your location…</p>
            </div>
          )}

          {step === 'locked' && (
            <div className="rounded-xl border-2 border-[#dc2626] bg-[#FEF2F2] px-5 py-5 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-[#dc2626] flex items-center justify-center">
                <Lock size={24} className="text-white"/>
              </div>
              <div>
                <p className="font-sora font-bold text-[15px] text-[#dc2626]">Attendance Locked</p>
                <p className="text-[12px] text-[#555555] mt-1 leading-relaxed">
                  You are <span className="font-bold text-[#dc2626]">{fmtDist(distance)}</span> away from <span className="font-semibold">{proj?.name}</span>.
                </p>
                <p className="text-[11px] text-[#777777] mt-1">
                  Must be within <span className="font-semibold">{proj?.siteRadius ?? 300}m</span> of the site to mark attendance.
                </p>
              </div>
              <div className="w-full bg-white rounded-lg px-4 py-3 border border-[#fecaca]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#777777]">Your location</span>
                  <span className="font-mono text-[#333333]">{location?.lat.toFixed(5)}, {location?.lng.toFixed(5)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1.5">
                  <span className="text-[#777777]">GPS accuracy</span>
                  <span className="text-[#333333]">±{location?.accuracy}m</span>
                </div>
              </div>
              <button onClick={startLocating}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#dc2626] text-[#dc2626] rounded-lg text-[12px] font-semibold hover:bg-[#dc2626] hover:text-white transition-colors">
                <Navigation size={12}/> Try Again
              </button>
            </div>
          )}

          {(step === 'ready' || step === 'submitting') && (
            <>
              {/* Location verified banner */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${proj?.siteLat ? 'bg-[#F0FDF4] border-[#bbf7d0]' : 'bg-[#FFF8F2] border-[#E07B20]/30'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${proj?.siteLat ? 'bg-[#15803d]' : 'bg-[#E07B20]'}`}>
                  {proj?.siteLat ? <ShieldCheck size={15} className="text-white"/> : <AlertTriangle size={15} className="text-white"/>}
                </div>
                <div className="min-w-0">
                  {proj?.siteLat ? (
                    <>
                      <p className="text-[12px] font-semibold text-[#15803d]">Location Verified — {fmtDist(distance ?? 0)} from site</p>
                      <p className="text-[10px] text-[#555555] mt-0.5">{location?.lat.toFixed(5)}, {location?.lng.toFixed(5)} · ±{location?.accuracy}m</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[12px] font-semibold text-[#E07B20]">No geofence set for this project</p>
                      <p className="text-[10px] text-[#777777] mt-0.5">Ask Admin to set site location. Attendance saved with your GPS.</p>
                    </>
                  )}
                </div>
              </div>

              {/* Workers list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-semibold text-[#777777] uppercase tracking-widest">
                    Workers <span className="text-[#1B4F8A]">({presentCount} present / {workers.length} total)</span>
                  </label>
                  <div className="flex gap-1.5">
                    <button onClick={() => setAllStatus('Present')}
                      className="text-[10px] font-semibold px-2 py-1 bg-[#F0FDF4] text-[#15803d] rounded-lg hover:bg-[#15803d] hover:text-white transition-colors">
                      All Present
                    </button>
                    <button onClick={() => setAllStatus('Absent')}
                      className="text-[10px] font-semibold px-2 py-1 bg-[#FEF2F2] text-[#dc2626] rounded-lg hover:bg-[#dc2626] hover:text-white transition-colors">
                      All Absent
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {workers.map(w => (
                    <div key={w.id} onClick={() => toggleWorker(w.id)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all ${
                        w.status === 'Present'
                          ? 'bg-[#F0FDF4] border-[#bbf7d0]'
                          : 'bg-[#FEF2F2] border-[#fecaca]'
                      }`}>
                      <div className="w-7 h-7 rounded-full bg-[#1B4F8A] flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-white">{w.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#333333] truncate">{w.name}</p>
                        <p className="text-[10px] text-[#777777]">{w.role}</p>
                      </div>
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                        w.status === 'Present' ? 'bg-[#15803d] text-white' : 'bg-[#dc2626] text-white'
                      }`}>
                        {w.status === 'Present' ? <Check size={10} strokeWidth={2.5}/> : <X size={10} strokeWidth={2.5}/>}
                        {w.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                <CheckCircle2 size={28} className="text-[#15803d]"/>
              </div>
              <p className="font-sora font-bold text-[15px] text-[#0F2340]">Attendance Submitted</p>
              <p className="text-[13px] text-[#777777]">
                {presentCount} present · {workers.length - presentCount} absent · Location recorded
              </p>
            </div>
          )}

          {errMsg && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] px-3 py-2 rounded-xl">{errMsg}</p>}
        </div>

        {/* Footer */}
        {(step === 'ready' || step === 'submitting') && (
          <div className="px-6 py-4 border-t border-[#F0F2F5] shrink-0 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-[#E0E6F0] rounded-xl text-[13px] font-medium text-[#555555] hover:bg-[#F7F9FC] transition-colors">
              Cancel
            </button>
            <button onClick={submit} disabled={step === 'submitting'}
              className="flex-1 py-2.5 bg-[#0F2340] hover:bg-[#1B4F8A] text-white rounded-xl text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
              {step === 'submitting' ? <><Loader2 size={13} className="animate-spin"/> Submitting…</> : 'Submit Attendance'}
            </button>
          </div>
        )}
        {step === 'done' && (
          <div className="px-6 py-4 border-t border-[#F0F2F5] shrink-0">
            <button onClick={onClose} className="w-full py-2.5 bg-[#1B4F8A] text-white rounded-xl text-[13px] font-semibold hover:bg-[#163f6e] transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── constants ─────────────────────────────────────────── */
const LEAVE_ENTITLEMENT = 20
const PERSONAL_LEAVE_DAYS = 6
const PROOF_REQUIRED_TYPES = ['Sick', 'Medical']
const TODAY_YEAR = 2026, TODAY_MONTH = 4, TODAY_DATE = 21
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const LEAVE_TYPES_LIST = ['Casual', 'Sick', 'Medical', 'Personal', 'Emergency']
const LEAVE_TYPES = ['Casual', 'Sick', 'Medical', 'Personal', 'Emergency']

function fmtDate(str) {
  if (!str) return ''
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ─── spiral binding ─────────────────────────────────────── */
function SpiralBinding() {
  return (
    <div className="flex justify-center items-end gap-[3.5px] px-4 relative z-10 mb-[-6px] pointer-events-none">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="w-[7px] h-[11px] rounded-full shrink-0"
          style={{
            background: 'linear-gradient(155deg, #ececec 0%, #b8b8b8 38%, #d8d8d8 58%, #909090 100%)',
            border: '1px solid #b8b8b8',
            boxShadow: 'inset 0 1px 1.5px rgba(255,255,255,0.65), inset 0 -1px 1px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.16)',
            animation: 'coilWave 2.8s ease-in-out infinite',
            animationDelay: `${i * 0.09}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ─── sticky note ────────────────────────────────────────── */
function StickyNote({ label, value, sub, bg, darkBg, borderCls, rotateCls, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="mt-3">
      <SpiralBinding />
      <div className={[
        bg, darkBg, rotateCls,
        'relative z-0 pt-7 px-5 pb-5 rounded-xl border-t-[3px]', borderCls,
        'shadow-[2px_6px_22px_rgba(0,0,0,0.09)] dark:shadow-[2px_6px_22px_rgba(0,0,0,0.42)]',
        'hover:rotate-0 transition-transform duration-300 cursor-default select-none',
      ].join(' ')}>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon size={15} strokeWidth={2} className={iconColor} />
          </div>
          <span className="text-[10px] font-bold text-body/30 dark:text-slate-600 uppercase tracking-[0.12em]">May '26</span>
        </div>
        <p className="font-sora text-[34px] font-bold text-body dark:text-white leading-none">{value}</p>
        <p className="text-[12px] font-semibold mt-2 text-body/60 dark:text-slate-400">{label}</p>
        {sub && <p className="text-[11px] text-body/40 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ─── month calendar ─────────────────────────────────────── */
function MonthCalendar({ year, month, calData, selectedDay, onSelectDay }) {
  const isPastMonth = year < TODAY_YEAR || (year === TODAY_YEAR && month < TODAY_MONTH)
  const isCurrentMonth = year === TODAY_YEAR && month === TODAY_MONTH
  const isFutureMonth = year > TODAY_YEAR || (year === TODAY_YEAR && month > TODAY_MONTH)

  const firstDayMon = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = [
    ...Array(firstDayMon).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div style={{ animation: 'fadeSlide 0.22s ease both' }}>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-wider py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} className="h-11" />
              const col = i % 7
              const isWeekend = col === 5 || col === 6
              const isToday = isCurrentMonth && day === TODAY_DATE
              const isPast = !isWeekend && (isPastMonth || (isCurrentMonth && day < TODAY_DATE))
              const isFuture = !isWeekend && (isFutureMonth || (isCurrentMonth && day > TODAY_DATE))
              const isSelected = selectedDay === day && !isToday
              const att = calData[day]

              return (
                <div
                  key={day}
                  onClick={() => !isWeekend && !isFuture && onSelectDay(isSelected ? null : day)}
                  className={[
                    'relative h-11 flex flex-col items-center justify-center rounded-xl text-[13px] font-medium select-none transition-all duration-100',
                    isToday ? 'bg-primary text-white font-bold shadow-md' : '',
                    isSelected ? 'ring-2 ring-primary/70 ring-offset-1 dark:ring-offset-[#141B27] bg-light-blue/60 dark:bg-[#1B2D4A] text-primary dark:text-[#5B9BD5] font-semibold' : '',
                    isWeekend ? 'text-muted/30 dark:text-slate-700' : '',
                    isFuture ? 'text-muted/25 dark:text-slate-700' : '',
                    isPast && !isSelected ? 'text-body dark:text-slate-300 hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] cursor-pointer' : '',
                    !isWeekend && !isToday && !isSelected && !isPast && !isFuture ? 'text-body dark:text-slate-300' : '',
                  ].filter(Boolean).join(' ')}>
                  {day}
                  {isPast && att && !isToday && (
                    <span className={[
                      'absolute bottom-[4px] w-2 h-2 rounded-full',
                      att === 'high' ? 'bg-[#15803d]' : att === 'medium' ? 'bg-accent' : 'bg-[#dc2626]',
                    ].join(' ')} />
                  )}
                  {isToday && <span className="absolute bottom-[5px] w-1 h-1 rounded-full bg-white/60" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── leave status config ────────────────────────────────── */
const LEAVE_STATUS = {
  Pending: { cls: 'bg-[#FFF3E8] dark:bg-[#2D1F0A] text-accent', dot: 'bg-accent' },
  Approved: { cls: 'bg-[#F0FDF4] dark:bg-[#0A2318] text-[#15803d] dark:text-[#22c55e]', dot: 'bg-[#15803d]' },
  Rejected: { cls: 'bg-[#FEF2F2] dark:bg-[#2D0808] text-[#dc2626]', dot: 'bg-[#dc2626]' },
}

/* ─── leave request modal ────────────────────────────────── */
function LeaveRequestModal({ leavesRemaining, personalLeavesRemaining, onClose, onSubmit }) {
  const { user } = useAuth()
  const supervisorData = { name: user?.name ?? '', role: user?.role ?? '', initials: user?.initials ?? '' }
  const [form, setForm] = useState({ type: 'Casual', from: '', to: '', reason: '', contact: '', notes: '', proof: null })
  const [proofFile, setProofFile] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const days = useMemo(() => {
    if (!form.from || !form.to) return 0
    const diff = (new Date(form.to) - new Date(form.from)) / 86400000
    return diff < 0 ? 0 : Math.round(diff) + 1
  }, [form.from, form.to])

  const proofRequired = PROOF_REQUIRED_TYPES.includes(form.type)
  const canSubmit = form.from && form.to && form.reason.trim() && days > 0 && (!proofRequired || form.proof)

  function handleProof(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    set('proof', { name: file.name, fileType: ext === 'pdf' ? 'pdf' : 'image' })
    setProofFile(file)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ ...form, days }, proofFile)
  }

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937] shrink-0">
          <div>
            <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Request Leave</h3>
            <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">
              {leavesRemaining} of {LEAVE_ENTITLEMENT} days remaining
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-body dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] transition-colors">
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* Employee info strip */}
            <div className="bg-[#F7F9FC] dark:bg-[#0F1219] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-mid-blue/20 dark:bg-mid-blue/30 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-mid-blue">{supervisorData.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-body dark:text-white">{supervisorData.name}</p>
                <p className="text-[11px] text-muted dark:text-slate-400">{supervisorData.role}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-sora text-[22px] font-bold text-primary dark:text-[#5B9BD5] leading-none">{leavesRemaining}</p>
                <p className="text-[10px] text-muted dark:text-slate-500 mt-0.5">days left</p>
              </div>
            </div>

            {/* Leave type */}
            <div>
              <label className="block text-[11px] font-semibold text-body dark:text-slate-300 uppercase tracking-[0.08em] mb-2">
                Leave Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {LEAVE_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => set('type', t)}
                    className={[
                      'px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-all duration-150',
                      form.type === t
                        ? 'bg-primary text-white border-primary'
                        : 'border-[#DDDDDD] dark:border-[#2A3547] text-muted dark:text-slate-400 hover:border-primary hover:text-primary dark:hover:text-[#5B9BD5]',
                    ].join(' ')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              {[['from', 'From Date'], ['to', 'To Date']].map(([k, lbl]) => (
                <div key={k}>
                  <label className="block text-[11px] font-semibold text-body dark:text-slate-300 uppercase tracking-[0.08em] mb-1.5">
                    {lbl}
                  </label>
                  <input type="date" value={form[k]} min="2026-01-01"
                    onChange={e => set(k, e.target.value)}
                    className="w-full px-3 py-2 text-[13px] rounded-xl border border-[#DDDDDD] dark:border-[#2A3547] bg-white dark:bg-[#1C2538] text-body dark:text-slate-200 focus:outline-none focus:border-primary transition-colors" />
                </div>
              ))}
            </div>

            {/* Duration badge */}
            {days > 0 && (
              <div className={[
                'flex items-center justify-between px-4 py-3 rounded-xl border',
                days > leavesRemaining
                  ? 'bg-[#FEF2F2] dark:bg-[#2D0808] border-[#dc2626]/20'
                  : 'bg-[#EFF6FF] dark:bg-[#1B2D4A] border-primary/15',
              ].join(' ')}>
                <span className="text-[12px] font-medium text-muted dark:text-slate-400">Duration</span>
                <div className="flex items-center gap-2">
                  <span className={`font-sora text-[20px] font-bold leading-none ${days > leavesRemaining ? 'text-[#dc2626]' : 'text-primary dark:text-[#5B9BD5]'}`}>
                    {days}
                  </span>
                  <span className="text-[12px] text-muted dark:text-slate-400">
                    {days === 1 ? 'day' : 'days'}
                    {days > leavesRemaining && (
                      <span className="ml-1 text-[#dc2626]">· exceeds balance</span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-[11px] font-semibold text-body dark:text-slate-300 uppercase tracking-[0.08em] mb-1.5">
                Reason <span className="text-[#dc2626]">*</span>
              </label>
              <input type="text" value={form.reason} onChange={e => set('reason', e.target.value)}
                placeholder="Enter reason for leave…"
                className="w-full px-3 py-2 text-[13px] rounded-xl border border-[#DDDDDD] dark:border-[#2A3547] bg-white dark:bg-[#1C2538] text-body dark:text-slate-200 placeholder:text-muted focus:outline-none focus:border-primary transition-colors" />
            </div>

            {/* Contact person */}
            <div>
              <label className="block text-[11px] font-semibold text-body dark:text-slate-300 uppercase tracking-[0.08em] mb-1.5">
                Contact Person During Leave
              </label>
              <input type="text" value={form.contact} onChange={e => set('contact', e.target.value)}
                placeholder="Who to contact in your absence…"
                className="w-full px-3 py-2 text-[13px] rounded-xl border border-[#DDDDDD] dark:border-[#2A3547] bg-white dark:bg-[#1C2538] text-body dark:text-slate-200 placeholder:text-muted focus:outline-none focus:border-primary transition-colors" />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-body dark:text-slate-300 uppercase tracking-[0.08em] mb-1.5">
                Additional Notes <span className="text-muted dark:text-slate-500 font-normal normal-case">(optional)</span>
              </label>
              <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Any additional information…"
                className="w-full px-3 py-2 text-[13px] rounded-xl border border-[#DDDDDD] dark:border-[#2A3547] bg-white dark:bg-[#1C2538] text-body dark:text-slate-200 placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none" />
            </div>

            {/* Personal leave balance */}
            {form.type === 'Personal' && (
              <div className="flex items-center justify-between px-4 py-3 bg-[#EFF6FF] dark:bg-[#1B2D4A] rounded-xl border border-primary/15">
                <div>
                  <p className="text-[11px] font-semibold text-primary dark:text-[#5B9BD5]">Personal Leave Balance</p>
                  <p className="text-[10px] text-muted dark:text-slate-500 mt-0.5">Fixed annual entitlement</p>
                </div>
                <div className="text-right">
                  <span className="font-sora text-[20px] font-bold text-primary dark:text-[#5B9BD5] leading-none">
                    {personalLeavesRemaining}
                  </span>
                  <span className="text-[11px] text-muted dark:text-slate-400 ml-1">/ {PERSONAL_LEAVE_DAYS} days</span>
                </div>
              </div>
            )}

            {/* Proof attachment (required for Sick / Medical) */}
            {proofRequired && (
              <div>
                <label className="block text-[11px] font-semibold text-body dark:text-slate-300 uppercase tracking-[0.08em] mb-1.5">
                  Proof Attachment <span className="text-[#dc2626]">*</span>
                  <span className="text-muted dark:text-slate-500 font-normal normal-case ml-1">(image or PDF)</span>
                </label>
                {form.proof ? (
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#EFF6FF] dark:bg-[#1B2D4A] rounded-xl border border-primary/20">
                    <div className="flex items-center gap-2.5">
                      {form.proof.fileType === 'pdf'
                        ? <FileText size={14} strokeWidth={1.75} className="text-primary dark:text-[#5B9BD5]" />
                        : <ImageIcon size={14} strokeWidth={1.75} className="text-primary dark:text-[#5B9BD5]" />}
                      <span className="text-[12px] font-medium text-primary dark:text-[#5B9BD5] truncate max-w-[220px]">
                        {form.proof.name}
                      </span>
                    </div>
                    <button type="button" onClick={() => set('proof', null)}
                      className="text-muted hover:text-body dark:hover:text-white transition-colors ml-2 shrink-0">
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-1.5 px-4 py-4 border-2 border-dashed border-[#DDDDDD] dark:border-[#2A3547] rounded-xl cursor-pointer hover:border-primary hover:bg-light-blue/10 dark:hover:bg-[#1B2D4A]/30 transition-all duration-150 group">
                    <input type="file" accept="image/*,.pdf" className="sr-only" onChange={handleProof} />
                    <span className="text-[12px] text-muted dark:text-slate-400 group-hover:text-primary dark:group-hover:text-[#5B9BD5] transition-colors font-medium">
                      Click to upload medical proof
                    </span>
                    <span className="text-[10px] text-muted dark:text-slate-500">JPEG, PNG or PDF accepted</span>
                  </label>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-[#F0F2F5] dark:border-[#1F2937] shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted dark:text-slate-400 border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-primary hover:text-primary transition-colors duration-150">
              Cancel
            </button>
            <button type="submit" disabled={!canSubmit}
              className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-[#163f6e] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors duration-150">
              Submit Request
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

/* ─── employee detail panel ──────────────────────────────── */
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function StatPill({ label, value, sub, bg, textCls }) {
  return (
    <div className={`${bg} rounded-xl px-4 py-3 flex flex-col gap-0.5`}>
      <span className={`font-sora text-[22px] font-bold leading-none ${textCls}`}>{value}</span>
      <span className="text-[11px] font-semibold text-body/70 dark:text-slate-400">{label}</span>
      {sub && <span className="text-[10px] text-muted dark:text-slate-500">{sub}</span>}
    </div>
  )
}

function EmployeeDetailPanel({ employee, onClose }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employee) return
    setLoading(true)
    getEmployeeAttendance(employee.id)
      .then(recs => setRecords(recs))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [employee?.id])

  const summary = useMemo(() => {
    if (!records.length) return null
    const present = records.filter(r => r.status === 'Present')
    const absent = records.filter(r => r.status === 'Absent')
    const leave = records.filter(r => r.status === 'Leave')

    const totalHours = present.reduce((s, r) => s + (r.hoursWorked || 0), 0)
    const avgHours = present.length ? (totalHours / present.length).toFixed(1) : 0

    // Group by month
    const byMonth = {}
    records.forEach(r => {
      const parts = r.recordDate?.split('-') || []
      const key = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : 'Unknown'
      if (!byMonth[key]) byMonth[key] = { present: 0, absent: 0, leave: 0, total: 0 }
      byMonth[key].total++
      if (r.status === 'Present') byMonth[key].present++
      else if (r.status === 'Absent') byMonth[key].absent++
      else byMonth[key].leave++
    })

    // Current month = 2026-05
    const curKey = '2026-05'
    const curMonth = byMonth[curKey] || { present: 0, absent: 0, leave: 0, total: 0 }
    const curHours = present
      .filter(r => r.recordDate?.startsWith(curKey))
      .reduce((s, r) => s + (r.hoursWorked || 0), 0)

    // Salary estimate
    const monthlySalary = employee.monthlySalary || 0
    const workingDays = curMonth.total || 22
    const dailyRate = monthlySalary > 0 ? Math.round(monthlySalary / workingDays) : 0
    const earnedSalary = dailyRate * curMonth.present

    return { present, absent, leave, totalHours, avgHours, byMonth, curMonth, curHours, monthlySalary, dailyRate, earnedSalary }
  }, [records, employee])

  if (!employee) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-[420px] h-full bg-white dark:bg-[#141B27] border-l border-[#EFEFEF] dark:border-[#1F2937] shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.22s ease both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937] bg-navy shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-[13px] font-bold text-white">{employee.initials}</span>
            </div>
            <div>
              <p className="font-sora font-semibold text-[14px] text-white">{employee.name}</p>
              <p className="text-[11px] text-white/60 mt-0.5">{employee.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 rounded-full border-4 border-[#D6E8F7] border-t-primary animate-spin" />
            </div>
          ) : !summary ? (
            <p className="text-[13px] text-muted dark:text-slate-500 text-center py-10">No attendance records found.</p>
          ) : (
            <>
              {/* This month summary */}
              <div>
                <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-3">May 2026 — Current Month</p>
                <div className="grid grid-cols-3 gap-2">
                  <StatPill label="Present" value={summary.curMonth.present} sub="days" bg="bg-[#F0FDF4] dark:bg-[#0A2318]" textCls="text-[#15803d] dark:text-[#22c55e]" />
                  <StatPill label="Absent" value={summary.curMonth.absent} sub="days" bg="bg-[#FEF2F2] dark:bg-[#2D0808]" textCls="text-[#dc2626]" />
                  <StatPill label="On Leave" value={summary.curMonth.leave} sub="days" bg="bg-[#FFF3E8] dark:bg-[#2D1F0A]" textCls="text-accent" />
                </div>
              </div>

              {/* Attendance rate */}
              {summary.curMonth.total > 0 && (() => {
                const rate = Math.round((summary.curMonth.present / summary.curMonth.total) * 100)
                return (
                  <div className="bg-[#F7F9FC] dark:bg-[#1C2538] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-primary dark:text-[#5B9BD5]" />
                        <span className="text-[12px] font-semibold text-body dark:text-white">Attendance Rate</span>
                      </div>
                      <span className={`text-[13px] font-bold ${rate >= 80 ? 'text-[#15803d]' : rate >= 60 ? 'text-accent' : 'text-[#dc2626]'}`}>{rate}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#E0E0E0] dark:bg-[#2A3547] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${rate >= 80 ? 'bg-[#15803d]' : rate >= 60 ? 'bg-accent' : 'bg-[#dc2626]'}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted dark:text-slate-500 mt-1.5">
                      {summary.curMonth.present} of {summary.curMonth.total} working days
                    </p>
                  </div>
                )
              })()}

              {/* Time tracking */}
              {summary.curHours > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-3">Time Tracking — This Month</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#F7F9FC] dark:bg-[#1C2538] rounded-xl p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#D6E8F7] dark:bg-[#1B2D4A] flex items-center justify-center shrink-0">
                        <Timer size={14} className="text-primary dark:text-[#5B9BD5]" />
                      </div>
                      <div>
                        <p className="font-sora font-bold text-[18px] text-body dark:text-white leading-none">{summary.curHours.toFixed(0)}<span className="text-[12px] font-normal ml-0.5">h</span></p>
                        <p className="text-[10px] text-muted dark:text-slate-500 mt-0.5">Total hours</p>
                      </div>
                    </div>
                    <div className="bg-[#F7F9FC] dark:bg-[#1C2538] rounded-xl p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#D6E8F7] dark:bg-[#1B2D4A] flex items-center justify-center shrink-0">
                        <Clock size={14} className="text-primary dark:text-[#5B9BD5]" />
                      </div>
                      <div>
                        <p className="font-sora font-bold text-[18px] text-body dark:text-white leading-none">
                          {summary.curMonth.present > 0 ? (summary.curHours / summary.curMonth.present).toFixed(1) : '0.0'}<span className="text-[12px] font-normal ml-0.5">h</span>
                        </p>
                        <p className="text-[10px] text-muted dark:text-slate-500 mt-0.5">Avg / day</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Salary estimate */}
              {summary.monthlySalary > 0 && (
                <div className="bg-[#EFF6FF] dark:bg-[#1B2D4A] rounded-xl p-4 border border-primary/15">
                  <div className="flex items-center gap-2 mb-3">
                    <IndianRupee size={14} className="text-primary dark:text-[#5B9BD5]" />
                    <span className="text-[12px] font-semibold text-primary dark:text-[#5B9BD5]">Salary Reference — May 2026</span>
                  </div>
                  <div className="space-y-2 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted dark:text-slate-400">Monthly CTC</span>
                      <span className="font-semibold text-body dark:text-white">₹{summary.monthlySalary.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted dark:text-slate-400">Working days</span>
                      <span className="font-semibold text-body dark:text-white">{summary.curMonth.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted dark:text-slate-400">Days present</span>
                      <span className="font-semibold text-body dark:text-white">{summary.curMonth.present}</span>
                    </div>
                    <div className="h-px bg-primary/15 my-1" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary dark:text-[#5B9BD5]">Payable this month</span>
                      <span className="font-sora font-bold text-[15px] text-primary dark:text-[#5B9BD5]">
                        ₹{summary.earnedSalary.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly history */}
              <div>
                <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-3">Monthly History</p>
                <div className="space-y-2">
                  {Object.entries(summary.byMonth)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .slice(0, 6)
                    .map(([key, data]) => {
                      const [yr, mo] = key.split('-')
                      const label = `${MONTH_LABELS[(parseInt(mo) - 1)]} ${yr}`
                      const rate = data.total ? Math.round((data.present / data.total) * 100) : 0
                      return (
                        <div key={key} className="flex items-center gap-3 px-3 py-2.5 bg-[#F7F9FC] dark:bg-[#1C2538] rounded-xl">
                          <div className="w-14 shrink-0">
                            <p className="text-[11px] font-semibold text-body dark:text-slate-200">{label}</p>
                          </div>
                          <div className="flex-1">
                            <div className="w-full h-1.5 bg-[#E0E0E0] dark:bg-[#2A3547] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${rate >= 80 ? 'bg-[#15803d]' : rate >= 60 ? 'bg-accent' : 'bg-[#dc2626]'}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted dark:text-slate-500">
                            <span className="text-[#15803d] font-semibold">{data.present}P</span>
                            <span>{data.absent}A</span>
                            {data.leave > 0 && <span className="text-accent">{data.leave}L</span>}
                            <span className="font-bold text-body dark:text-slate-300">{rate}%</span>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>

              {/* Recent records */}
              <div>
                <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-3">Recent Records</p>
                <div className="space-y-1.5">
                  {records
                    .filter(r => r.recordDate?.startsWith('2026-05'))
                    .sort((a, b) => b.recordDate.localeCompare(a.recordDate))
                    .slice(0, 8)
                    .map(r => (
                      <div key={r._id ?? r.recordDate} className="flex items-center justify-between px-3 py-2 bg-[#F7F9FC] dark:bg-[#1C2538] rounded-lg">
                        <span className="text-[12px] text-body dark:text-slate-200">
                          {new Date(r.recordDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <div className="flex items-center gap-3">
                          {r.checkIn && (
                            <span className="text-[11px] text-muted dark:text-slate-500">{r.checkIn} – {r.checkOut || '—'}</span>
                          )}
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${r.status === 'Present' ? 'bg-[#F0FDF4] dark:bg-[#0A2318] text-[#15803d]' :
                              r.status === 'Leave' ? 'bg-[#FFF3E8] dark:bg-[#2D1F0A] text-accent' :
                                'bg-[#FEF2F2] dark:bg-[#2D0808] text-[#dc2626]'
                            }`}>{r.status}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── main page ──────────────────────────────────────────── */
export default function AttendancePage() {
  const { user } = useAuth()
  const isAdmin = user.role === 'Admin'
  const isSupervisor = user.role === 'Supervisor'

  const [allRecords, setAllRecords] = useState([])
  const [allLeaveRequests, setAllLeaveRequests] = useState([])
  const [projectMap, setProjectMap] = useState({})
  const [projectsList, setProjectsList] = useState([])
  const [calendarData, setCalendarData] = useState({})
  const [showMarkModal, setShowMarkModal] = useState(false)
  const [showSetSiteModal, setShowSetSiteModal] = useState(false)

  useEffect(() => {
    // Fetch current month's records and aggregate to one row per employee
    const curMonth = `${TODAY_YEAR}-${String(TODAY_MONTH + 1).padStart(2, '0')}`
    const todayStr = `${curMonth}-${String(TODAY_DATE).padStart(2, '0')}`
    getAttendance({ month: curMonth }).then(d => {
      const map = {}
      d.forEach(r => {
        const uid = String(r.userId?._id ?? r.userId ?? '')
        if (!uid) return
        if (!map[uid]) {
          map[uid] = {
            id: uid, name: r.userId?.name ?? '', role: r.userId?.role ?? '',
            initials: r.userId?.initials ?? '', monthlySalary: r.userId?.monthlySalary ?? 0,
            present: 0, absent: 0, leaves: 0, todayStatus: 'Absent',
            projectId: r.projectId,
            type: r.userId?.role === 'Worker' ? 'worker' : 'staff',
          }
        }
        const em = map[uid]
        if (r.status === 'Present') em.present++
        else if (r.status === 'Absent') em.absent++
        else em.leaves++
        if (r.recordDate === todayStr) em.todayStatus = r.status
        if (r.projectId) em.projectId = r.projectId
      })
      setAllRecords(Object.values(map))
    }).catch(console.error)
    getLeaveRequests().then(d => setAllLeaveRequests(d.map(r => ({
      ...r, id: r._id, name: r.userId?.name ?? '', role: r.userId?.role ?? '',
      from: r.fromDate, to: r.toDate, contact: r.userId?.phone ?? '', proof: !!r.proofPath,
    })))).catch(console.error)
    getProjects().then(ps => {
      setProjectMap(Object.fromEntries(ps.map(p => [String(p._id), p.name])))
      setProjectsList(ps)
    }).catch(console.error)
    getAttendanceCalendar(TODAY_MONTH + 1, TODAY_YEAR).then(d => setCalendarData(d)).catch(console.error)
  }, [])

  /* calendar state */
  const [calYear, setCalYear] = useState(TODAY_YEAR)
  const [calMonth, setCalMonth] = useState(TODAY_MONTH)
  const [selectedDay, setSelectedDay] = useState(null)

  /* table state */
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  /* employee detail */
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  /* leave state */
  const [extraLeaves, setExtraLeaves] = useState([])
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [expandedLeave, setExpandedLeave] = useState(null)

  /* records filtered by role */
  const records = useMemo(() => allRecords, [allRecords])

  /* filtered + searched records */
  const filteredRecords = useMemo(() => {
    let list = records
    if (statusFilter !== 'All') list = list.filter(r => r.todayStatus === statusFilter)
    const q = searchQuery.trim().toLowerCase()
    if (q) list = list.filter(r =>
      (r.name ?? '').toLowerCase().includes(q) || (r.role ?? '').toLowerCase().includes(q)
    )
    return list
  }, [records, statusFilter, searchQuery])

  /* leave requests */
  const localLeaves = useMemo(() => [...allLeaveRequests, ...extraLeaves], [allLeaveRequests, extraLeaves])

  // Status comes from DB; fall back to 'Pending' only for freshly added local entries
  function getLeaveState(req) { return req.status ?? req.leaveType ?? 'Pending' }

  async function handleLeave(id, action) {
    try {
      await updateLeaveStatus(id, action)
      setAllLeaveRequests(prev => prev.map(r =>
        String(r.id) === String(id) ? { ...r, status: action } : r
      ))
    } catch (err) { console.error('Failed to update leave status:', err) }
  }

  /* stats */
  const presentCount = records.filter(r => r.todayStatus === 'Present').length
  const absentCount = records.filter(r => r.todayStatus === 'Absent').length
  const pendingLeaves = localLeaves.filter(l => getLeaveState(l) === 'Pending').length
  const attRate = records.length ? Math.round((presentCount / records.length) * 100) : 0

  const leavesRemaining = LEAVE_ENTITLEMENT
  const personalLeavesRemaining = PERSONAL_LEAVE_DAYS

  /* calendar data */
  const calData = calendarData || {}

  function prevMonth() {
    setSelectedDay(null)
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    setSelectedDay(null)
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  async function submitLeaveRequest(formData, proofFile) {
    try {
      await applyLeave({
        leaveType: formData.type,
        fromDate: formData.from,
        toDate: formData.to,
        days: formData.days,
        reason: formData.reason,
      }, proofFile)
      // Re-fetch leave requests to show updated list
      getLeaveRequests().then(d => setAllLeaveRequests(d.map(r => ({
        ...r, id: r._id, name: r.userId?.name ?? '', role: r.userId?.role ?? '',
        from: r.fromDate, to: r.toDate, contact: r.userId?.phone ?? '', proof: !!r.proofPath,
      })))).catch(console.error)
    } catch (err) {
      console.error('Failed to submit leave request:', err)
    }
    setShowLeaveModal(false)
  }

  /* sticky note config */
  const STICKIES = [
    {
      label: 'Present Today', value: String(presentCount), sub: `out of ${records.length} total`,
      bg: 'bg-[#F0FDF4]', darkBg: 'dark:bg-[#0A2318]', borderCls: 'border-[#15803d]',
      rotateCls: '-rotate-[1.3deg]',
      icon: CheckCircle2, iconBg: 'bg-[#dcfce7] dark:bg-[#0D3322]', iconColor: 'text-[#15803d] dark:text-[#22c55e]',
    },
    {
      label: 'Absent Today', value: String(absentCount), sub: 'marked absent',
      bg: 'bg-[#FEF2F2]', darkBg: 'dark:bg-[#2D0808]', borderCls: 'border-[#dc2626]',
      rotateCls: 'rotate-[0.9deg]',
      icon: UserX, iconBg: 'bg-[#fee2e2] dark:bg-[#3D0A0A]', iconColor: 'text-[#dc2626]',
    },
    {
      label: 'Pending Leaves', value: String(pendingLeaves), sub: 'awaiting approval',
      bg: 'bg-[#FFF3E8]', darkBg: 'dark:bg-[#2D1F0A]', borderCls: 'border-accent',
      rotateCls: '-rotate-[0.7deg]',
      icon: Clock, iconBg: 'bg-[#ffedd5] dark:bg-[#3D2A0A]', iconColor: 'text-accent',
    },
    {
      label: 'Attendance Rate', value: `${attRate}%`, sub: 'this month average',
      bg: 'bg-[#EFF6FF]', darkBg: 'dark:bg-[#1B2D4A]', borderCls: 'border-primary',
      rotateCls: 'rotate-[1.5deg]',
      icon: BarChart2, iconBg: 'bg-[#dbeafe] dark:bg-[#1B2D4A]', iconColor: 'text-primary dark:text-[#5B9BD5]',
    },
  ]

  return (
    <div className="space-y-5">

      {/* ── Sticky notes ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {STICKIES.map(s => <StickyNote key={s.label} {...s} />)}
      </div>

      {/* ── Calendar ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-5">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-light-blue dark:bg-[#1B2D4A] flex items-center justify-center">
              <CalendarDays size={16} strokeWidth={1.75} className="text-primary dark:text-[#5B9BD5]" />
            </div>
            <div>
              <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">
                {MONTH_NAMES[calMonth]} {calYear}
              </h3>
              <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">Attendance calendar</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-[11px] text-muted dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#15803d]" /> High ≥80%</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> Moderate</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#dc2626]" /> Low</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Today</span>
            </div>

            {/* Nav */}
            <div className="flex items-center gap-1">
              <button onClick={prevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted dark:text-slate-400 hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body dark:hover:text-white transition-colors">
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
              <button
                onClick={() => { setCalYear(TODAY_YEAR); setCalMonth(TODAY_MONTH); setSelectedDay(null) }}
                className="px-3 py-1.5 text-[11px] font-semibold text-primary dark:text-[#5B9BD5] bg-light-blue/60 dark:bg-[#1B2D4A] rounded-lg hover:bg-light-blue dark:hover:bg-[#1B4F8A]/30 transition-colors">
                Today
              </button>
              <button onClick={nextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted dark:text-slate-400 hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body dark:hover:text-white transition-colors">
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Selected day info strip */}
        {selectedDay && (
          <div className="mb-4 px-4 py-2.5 bg-light-blue/50 dark:bg-[#1B2D4A] rounded-xl flex items-center justify-between">
            <span className="text-[12px] font-semibold text-primary dark:text-[#5B9BD5]">
              {selectedDay} {MONTH_NAMES[calMonth]} {calYear}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${(calData[selectedDay] === 'high') ? 'bg-[#F0FDF4] dark:bg-[#0A2318] text-[#15803d]' :
                (calData[selectedDay] === 'medium') ? 'bg-[#FFF3E8] dark:bg-[#2D1F0A] text-accent' :
                  (calData[selectedDay] === 'low') ? 'bg-[#FEF2F2] dark:bg-[#2D0808] text-[#dc2626]' :
                    'bg-[#F0F2F5] dark:bg-[#1F2937] text-muted dark:text-slate-400'
              }`}>
              {calData[selectedDay] === 'high' ? 'High attendance' :
                calData[selectedDay] === 'medium' ? 'Moderate attendance' :
                  calData[selectedDay] === 'low' ? 'Low attendance' :
                    'No data'}
            </span>
          </div>
        )}

        <MonthCalendar
          key={`${calYear}-${calMonth}`}
          year={calYear} month={calMonth}
          calData={calData}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      </div>

      {/* ── Attendance table ──────────────────────────────── */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
          <div>
            <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">
              {isAdmin ? 'All Staff Attendance' : 'Site Workers Attendance'}
            </h3>
            <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">
              {filteredRecords.length} of {records.length} shown — May 2026
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isSupervisor && projectsList.length > 0 && (
              <button onClick={() => setShowMarkModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-white bg-[#0F2340] hover:bg-[#1B4F8A] rounded-xl transition-colors">
                <MapPin size={13} strokeWidth={2}/> Mark Attendance
              </button>
            )}
            {isAdmin && projectsList.length > 0 && (
              <button onClick={() => setShowSetSiteModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-[#1B4F8A] border border-[#D6E8F7] bg-[#D6E8F7]/40 hover:bg-[#D6E8F7] rounded-xl transition-colors">
                <Navigation size={13} strokeWidth={2}/> Set Site Location
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Filter tabs */}
            <div className="flex items-center gap-1">
              {['All', 'Present', 'Absent'].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={[
                    'px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all duration-150',
                    statusFilter === f
                      ? 'bg-navy text-white dark:bg-primary'
                      : 'text-muted dark:text-slate-400 hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body dark:hover:text-white',
                  ].join(' ')}>
                  {f}
                  {f !== 'All' && (
                    <span className={`ml-1.5 text-[10px] font-bold ${statusFilter === f ? 'text-white/70' : 'text-muted dark:text-slate-500'}`}>
                      {records.filter(r => r.todayStatus === f).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input type="text" placeholder="Search name or role…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-muted w-44 transition-colors" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy">
                {[
                  'Employee', 'Role',
                  ...(!isAdmin ? ['Project'] : []),
                  'Days Present', 'Days Absent', 'Leaves Taken', 'Today',
                ].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 7} className="px-5 py-10 text-center text-[13px] text-muted dark:text-slate-500">
                    No results match your search.
                  </td>
                </tr>
              ) : filteredRecords.map((row, i) => (
                <tr key={row.id}
                  onClick={() => setSelectedEmployee(row)}
                  className={[
                    'border-b border-[#F4F4F4] dark:border-[#1A2236] last:border-0 cursor-pointer',
                    'hover:[box-shadow:inset_3px_0_0_#1B4F8A] hover:bg-light-blue/20 dark:hover:bg-[#1A2236] transition-all duration-100',
                    i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : 'bg-white dark:bg-[#141B27]',
                  ].join(' ')}>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-mid-blue/15 dark:bg-mid-blue/25 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-mid-blue">{row.initials}</span>
                      </div>
                      <div>
                        <span className="text-[13px] font-semibold text-body dark:text-white whitespace-nowrap">{row.name}</span>
                        <p className="text-[10px] text-primary dark:text-[#5B9BD5] font-medium mt-0.5">View details →</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="text-[11px] text-muted dark:text-slate-400 bg-[#F0F2F5] dark:bg-[#1F2937] px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
                      {row.role}
                    </span>
                  </td>

                  {!isAdmin && (
                    <td className="px-5 py-3.5 text-[12px] text-body dark:text-slate-300 whitespace-nowrap">
                      {row.projectId ? projectMap[row.projectId] : '—'}
                    </td>
                  )}

                  <td className="px-5 py-3.5">
                    <span className="text-[13px] font-bold text-[#15803d] dark:text-[#22c55e]">{row.present}</span>
                    <span className="text-[11px] text-muted dark:text-slate-500 ml-1">days</span>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className={`text-[13px] font-semibold ${row.absent > 3 ? 'text-[#dc2626]' : 'text-body dark:text-slate-300'}`}>
                      {row.absent}
                    </span>
                    <span className="text-[11px] text-muted dark:text-slate-500 ml-1">days</span>
                  </td>

                  <td className="px-5 py-3.5 text-[13px] text-body dark:text-slate-300">
                    {row.leaves} {row.leaves === 1 ? 'day' : 'days'}
                  </td>

                  <td className="px-5 py-3.5">
                    <span className={[
                      'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg',
                      row.todayStatus === 'Present'
                        ? 'bg-[#F0FDF4] dark:bg-[#0A2318] text-[#15803d] dark:text-[#22c55e]'
                        : 'bg-[#FEF2F2] dark:bg-[#2D0808] text-[#dc2626]',
                    ].join(' ')}>
                      <span className={`w-1.5 h-1.5 rounded-full ${row.todayStatus === 'Present' ? 'bg-[#15803d]' : 'bg-[#dc2626]'}`} />
                      {row.todayStatus}
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Leave requests ────────────────────────────────── */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937] flex items-center justify-between">
          <div>
            <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Leave Requests</h3>
            <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">
              {pendingLeaves} pending · {localLeaves.length} total
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pendingLeaves > 0 && (
              <span className="text-[11px] font-semibold text-accent bg-[#FFF3E8] dark:bg-[#2D1F0A] px-2.5 py-1 rounded-lg">
                {pendingLeaves} need action
              </span>
            )}
            {isSupervisor && (
              <button onClick={() => setShowLeaveModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-xl transition-colors duration-150">
                <Plus size={13} strokeWidth={2.5} /> Request Leave
              </button>
            )}
          </div>
        </div>

        {localLeaves.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-muted dark:text-slate-500">
            No leave requests.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy">
                  {['Employee', 'Role', 'From', 'To', 'Days', 'Reason', 'Status', 'Actions'].map((h, idx) => (
                    <th key={h}
                      className={`text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap ${idx === 7 ? 'text-center' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localLeaves.map((req, i) => {
                  const state = getLeaveState(req)
                  const st = LEAVE_STATUS[state] ?? LEAVE_STATUS['Pending']
                  const initials = req.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  const isExpanded = isAdmin && expandedLeave === req.id
                  return (
                    <React.Fragment key={req.id}>
                      <tr
                        onClick={isAdmin ? () => setExpandedLeave(isExpanded ? null : req.id) : undefined}
                        className={[
                          'border-b border-[#F4F4F4] dark:border-[#1A2236]',
                          isExpanded ? '' : 'last:border-0',
                          'hover:bg-light-blue/20 dark:hover:bg-[#1A2236] transition-all duration-100',
                          i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : 'bg-white dark:bg-[#141B27]',
                          isAdmin ? 'cursor-pointer select-none' : '',
                        ].join(' ')}>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            {isAdmin && (
                              <ChevronDown
                                size={13}
                                strokeWidth={2}
                                className={`text-muted dark:text-slate-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            )}
                            <div className="w-7 h-7 rounded-full bg-mid-blue/15 dark:bg-mid-blue/25 flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-bold text-mid-blue">{initials}</span>
                            </div>
                            <span className="text-[13px] font-semibold text-body dark:text-white whitespace-nowrap">{req.name}</span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="text-[11px] text-muted dark:text-slate-400 bg-[#F0F2F5] dark:bg-[#1F2937] px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
                            {req.role}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-[13px] text-body dark:text-slate-300 whitespace-nowrap">{req.from}</td>
                        <td className="px-5 py-3.5 text-[13px] text-body dark:text-slate-300 whitespace-nowrap">{req.to}</td>

                        <td className="px-5 py-3.5">
                          <span className="text-[13px] font-semibold text-body dark:text-white">{req.days}</span>
                          <span className="text-[11px] text-muted dark:text-slate-500 ml-1">d</span>
                        </td>

                        <td className="px-5 py-3.5 text-[13px] text-body dark:text-slate-300 max-w-[180px]">
                          <span className="block truncate">{req.reason}</span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${st.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {state}
                          </span>
                        </td>

                        <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            {isAdmin && state === 'Pending' ? (
                              <>
                                <button onClick={() => handleLeave(req.id, 'Approved')}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-lg transition-colors duration-150">
                                  <Check size={11} strokeWidth={2.5} /> Approve
                                </button>
                                <button onClick={() => handleLeave(req.id, 'Rejected')}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-lg transition-colors duration-150">
                                  <X size={11} strokeWidth={2.5} /> Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-muted dark:text-slate-500">—</span>
                            )}
                          </div>
                        </td>

                      </tr>

                      {/* Expanded detail row — admin only */}
                      {isExpanded && (
                        <tr className="bg-[#EFF6FF] dark:bg-[#1B2D4A] border-b border-[#D6E8F7] dark:border-[#1F2937]">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-3 gap-5">
                              <div>
                                <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-1">Leave Type</p>
                                <p className="text-[13px] text-body dark:text-white font-medium">{req.leaveType ?? '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-1">Contact Person</p>
                                <p className="text-[13px] text-body dark:text-white font-medium">{req.contact || '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-1">Additional Notes</p>
                                <p className="text-[13px] text-body dark:text-white font-medium">{req.notes || '—'}</p>
                              </div>
                              {req.proof && (
                                <div className="col-span-3">
                                  <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-1.5">Attached Proof</p>
                                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#141B27] rounded-lg border border-primary/20">
                                    {req.proof.fileType === 'pdf'
                                      ? <FileText size={14} strokeWidth={1.75} className="text-primary dark:text-[#5B9BD5]" />
                                      : <ImageIcon size={14} strokeWidth={1.75} className="text-primary dark:text-[#5B9BD5]" />}
                                    <span className="text-[12px] font-medium text-primary dark:text-[#5B9BD5]">{req.proof.name}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Mark Attendance modal ────────────────────────── */}
      {showMarkModal && (
        <MarkAttendanceModal
          projects={projectsList}
          onClose={() => setShowMarkModal(false)}
          onMarked={() => {
            // Re-fetch attendance to reflect new records
            const curMonth = `${TODAY_YEAR}-${String(TODAY_MONTH + 1).padStart(2, '0')}`
            getAttendance({ month: curMonth }).then(d => {
              const map = {}
              const todayStr = `${curMonth}-${String(TODAY_DATE).padStart(2, '0')}`
              d.forEach(r => {
                const uid = String(r.userId?._id ?? r.userId ?? '')
                if (!uid) return
                if (!map[uid]) map[uid] = { id: uid, name: r.userId?.name ?? '', role: r.userId?.role ?? '', initials: r.userId?.initials ?? '', monthlySalary: r.userId?.monthlySalary ?? 0, present: 0, absent: 0, leaves: 0, todayStatus: 'Absent', projectId: r.projectId, type: r.userId?.role === 'Worker' ? 'worker' : 'staff' }
                if (r.status === 'Present') map[uid].present++
                else if (r.status === 'Absent') map[uid].absent++
                else map[uid].leaves++
                if (r.recordDate === todayStr) map[uid].todayStatus = r.status
              })
              setAllRecords(Object.values(map))
            }).catch(console.error)
          }}
        />
      )}

      {/* ── Set Site Location modal ───────────────────────── */}
      {showSetSiteModal && (
        <SetSiteModal
          projects={projectsList}
          onClose={() => setShowSetSiteModal(false)}
          onSaved={(pid, coords, radius) => {
            setProjectsList(prev => prev.map(p =>
              String(p._id) === pid ? { ...p, siteLat: coords.lat, siteLng: coords.lng, siteRadius: radius } : p
            ))
          }}
        />
      )}

      {/* ── Leave request modal ───────────────────────────── */}
      {showLeaveModal && (
        <LeaveRequestModal
          leavesRemaining={leavesRemaining}
          personalLeavesRemaining={personalLeavesRemaining}
          onClose={() => setShowLeaveModal(false)}
          onSubmit={submitLeaveRequest}
        />
      )}

      {/* ── Employee detail panel ─────────────────────────── */}
      {selectedEmployee && (
        <EmployeeDetailPanel
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

    </div>
  )
}
