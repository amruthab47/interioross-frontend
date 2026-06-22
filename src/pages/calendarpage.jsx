import React, { useState, useMemo, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, Calendar, AlertCircle,
  CheckSquare, Video, Users, CheckCircle2, XCircle, RotateCcw, AlertTriangle, Send,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getCalendarEvents, createEvent } from '../api/calendar'
import { getProjects } from '../api/projects'
import { getUsers } from '../api/users'
import { projectToRow } from '../utils/format'

const TODAY_YEAR = 2026, TODAY_MONTH = 5, TODAY_DATE = 7
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_LABELS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const EVENT_TYPES = ['meeting', 'deadline', 'task', 'holiday']
const MEETING_MODES = ['offline', 'online']

const TYPE_CFG = {
  meeting:  { label: 'Meeting',  bg: 'bg-primary',     text: 'text-white', dot: 'bg-primary',   light: 'bg-light-blue/70 dark:bg-[#1B2D4A]',  iconColor: 'text-primary dark:text-[#5B9BD5]',   Icon: Calendar    },
  deadline: { label: 'Deadline', bg: 'bg-[#dc2626]',   text: 'text-white', dot: 'bg-[#dc2626]', light: 'bg-[#FEF2F2] dark:bg-[#2D0808]',      iconColor: 'text-[#dc2626]',                      Icon: AlertCircle },
  task:     { label: 'Task',     bg: 'bg-accent',       text: 'text-white', dot: 'bg-accent',    light: 'bg-[#FFF3E8] dark:bg-[#2D1F0A]',      iconColor: 'text-accent',                         Icon: CheckSquare },
  holiday:  { label: 'Holiday',  bg: 'bg-[#7C3AED]',   text: 'text-white', dot: 'bg-[#7C3AED]', light: 'bg-[#F5F3FF] dark:bg-[#1A0E3A]',      iconColor: 'text-[#7C3AED] dark:text-[#A78BFA]', Icon: Calendar    },
}

const RSVP_CFG = {
  accepted:   { label: 'Accepted',   bg: 'bg-[#F0FDF4]', text: 'text-[#15803d]', Icon: CheckCircle2 },
  rejected:   { label: 'Declined',   bg: 'bg-[#FEF2F2]', text: 'text-[#dc2626]', Icon: XCircle      },
  reschedule: { label: 'Reschedule', bg: 'bg-[#FFF3E8]', text: 'text-accent',     Icon: RotateCcw    },
  pending:    { label: 'Pending',    bg: 'bg-[#F7F9FC]',  text: 'text-muted',     Icon: Clock        },
}


function isoDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

function getMeId() { return 1 }

// ── Add/Edit Event Modal ──────────────────────────────────────────────────────
function AddEventModal({ onClose, onAdd, onRequest, defaultDate, userRole, meId, users = [], projects = [] }) {
  const today  = defaultDate ?? isoDate(TODAY_YEAR, TODAY_MONTH, TODAY_DATE)
  const isAdmin = userRole === 'Admin'

  const [form, setForm] = useState({
    title: '', type: 'meeting', date: today, time: '', projectId: '',
    description: '', meetingMode: 'offline', location: '', purpose: '',
    invitees: [],
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const isMeeting = form.type === 'meeting'

  function toggleInvitee(id) {
    setForm(f => ({
      ...f,
      invitees: f.invitees.includes(id) ? f.invitees.filter(i => i !== id) : [...f.invitees, id],
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return

    const base = {
      id:          `ev-${Date.now()}`,
      title:       form.title,
      type:        form.type,
      date:        form.date,
      time:        form.time || 'All day',
      projectId:   form.projectId ? Number(form.projectId) : null,
      description: form.description,
      roles:       ['Admin','Supervisor','Designer','Client'],
      invitees:    isMeeting ? form.invitees : [],
      inviteeStatus: isMeeting
        ? Object.fromEntries(form.invitees.map(id => [id, 'pending']))
        : {},
    }

    if (isMeeting) {
      base.meetingMode = form.meetingMode
      base.location    = form.location
      base.purpose     = form.purpose
    }

    if (!isAdmin && isMeeting) {
      onRequest({
        id:          `mr-${Date.now()}`,
        title:       form.title,
        requestedBy: meId,
        type:        form.meetingMode,
        location:    form.location,
        date:        form.date,
        time:        form.time || 'TBD',
        invitees:    form.invitees,
        purpose:     form.purpose || form.description,
        status:      'pending',
        createdAt:   isoDate(TODAY_YEAR, TODAY_MONTH, TODAY_DATE),
        _event:      base,
      })
    } else {
      onAdd(base)
    }
    onClose()
  }

  const field = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-muted transition-colors'
  const lbl   = 'block text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-1.5'

  const otherUsers = users.filter(u => String(u.id ?? u._id) !== String(meId))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF] dark:border-[#1F2937] sticky top-0 bg-white dark:bg-[#141B27] z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-light-blue/60 dark:bg-[#1B2D4A] flex items-center justify-center">
              <Plus size={14} strokeWidth={2.5} className="text-primary dark:text-[#5B9BD5]" />
            </div>
            <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Add Event</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body transition-colors">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          <div>
            <label className={lbl}>Event Title <span className="text-[#dc2626]">*</span></label>
            <input type="text" required placeholder="Enter event title…"
              value={form.title} onChange={e => set('title', e.target.value)} className={field} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className={field}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{TYPE_CFG[t].label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Project <span className="text-muted font-normal normal-case">(optional)</span></label>
              <select value={form.projectId} onChange={e => set('projectId', e.target.value)} className={field}>
                <option value="">— None —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Date <span className="text-[#dc2626]">*</span></label>
              <input type="date" required value={form.date} onChange={e => set('date', e.target.value)} className={field} />
            </div>
            <div>
              <label className={lbl}>Time <span className="text-muted font-normal normal-case">(optional)</span></label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} className={field} />
            </div>
          </div>

          {/* Meeting-specific fields */}
          {isMeeting && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Meeting Type</label>
                  <div className="flex gap-2">
                    {MEETING_MODES.map(m => (
                      <button key={m} type="button" onClick={() => set('meetingMode', m)}
                        className={[
                          'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[12px] font-medium capitalize transition-all',
                          form.meetingMode === m
                            ? 'bg-light-blue/40 dark:bg-[#1B2D4A] border-primary/40 text-primary dark:text-[#5B9BD5]'
                            : 'border-[#EFEFEF] dark:border-[#2A3547] text-muted hover:border-primary/30',
                        ].join(' ')}>
                        {m === 'online' ? <Video size={13} /> : <MapPin size={13} />}
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lbl}>{form.meetingMode === 'online' ? 'Meeting Platform / Link' : 'Location'}</label>
                  <input type="text"
                    placeholder={form.meetingMode === 'online' ? 'Google Meet, Zoom, Teams…' : 'Site address or office…'}
                    value={form.location} onChange={e => set('location', e.target.value)} className={field} />
                </div>
              </div>

              <div>
                <label className={lbl}>Purpose / Agenda</label>
                <textarea rows={2} placeholder="What is this meeting about?"
                  value={form.purpose} onChange={e => set('purpose', e.target.value)}
                  className={`${field} resize-none`} />
              </div>

              <div>
                <label className={lbl}>Invite People</label>
                <div className="border border-[#EFEFEF] dark:border-[#2A3547] rounded-xl p-3 max-h-[180px] overflow-y-auto space-y-1">
                  {otherUsers.map(u => {
                    const checked = form.invitees.includes(u.id)
                    return (
                      <label key={u.id} className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] transition-colors">
                        <div onClick={() => toggleInvitee(u.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-primary border-primary' : 'border-[#CCCCCC] dark:border-[#3A4557]'}`}>
                          {checked && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div className="w-6 h-6 rounded-full bg-mid-blue flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-semibold text-white">{u.initials}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-body dark:text-slate-200">{u.name}</p>
                          <p className="text-[10px] text-muted">{u.role}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
                {form.invitees.length > 0 && (
                  <p className="text-[10px] text-muted mt-1.5">{form.invitees.length} person{form.invitees.length > 1 ? 's' : ''} invited</p>
                )}
              </div>
            </>
          )}

          {!isMeeting && (
            <div>
              <label className={lbl}>Description <span className="text-muted font-normal normal-case">(optional)</span></label>
              <textarea rows={3} placeholder="Add a description or notes…"
                value={form.description} onChange={e => set('description', e.target.value)}
                className={`${field} resize-none`} />
            </div>
          )}

          {/* Non-admin meeting warning */}
          {!isAdmin && isMeeting && (
            <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-[#FFF3E8] dark:bg-[#2D1F0A] rounded-xl border border-[#f5c98a] dark:border-[#5A3A10]">
              <AlertTriangle size={13} className="text-accent shrink-0 mt-0.5" />
              <p className="text-[11px] text-accent leading-relaxed">
                <strong>Admin approval required.</strong> This meeting will be sent to Admin for review before it is scheduled.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-primary hover:text-primary transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-xl transition-colors">
              {!isAdmin && isMeeting ? 'Request Meeting' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Meeting Requests Panel (Admin only) ───────────────────────────────────────
function MeetingRequestsPanel({ requests, onApprove, onReject }) {
  const pending = requests.filter(r => r.status === 'pending')
  if (pending.length === 0) return null

  return (
    <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#f5c98a] dark:border-[#5A3A10] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937] bg-[#FFF3E8] dark:bg-[#2D1F0A]">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-accent" />
          <h3 className="font-sora font-semibold text-[13px] text-body dark:text-white">
            Meeting Requests <span className="text-accent">({pending.length})</span>
          </h3>
        </div>
        <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">Pending admin approval</p>
      </div>
      <div className="py-2">
        {pending.map((req, idx) => {
          const requester = userMap[req.requestedBy]
          const inviteeNames = req.invitees.map(id => userMap[id]?.name.split(' ')[0]).filter(Boolean).join(', ')
          return (
            <div key={req.id}>
              <div className="px-5 py-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-body dark:text-white leading-snug">{req.title}</p>
                    <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5">
                      Requested by <strong className="text-body dark:text-slate-200">{requester?.name}</strong> · {req.date} · {req.time}
                    </p>
                    {req.purpose && <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5 line-clamp-2">{req.purpose}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${req.type === 'online' ? 'bg-[#F5F3FF] text-[#7C3AED]' : 'bg-light-blue/60 text-primary'}`}>
                        {req.type === 'online' ? <Video size={9}/> : <MapPin size={9}/>} {req.type}
                      </span>
                      {req.location && <span className="text-[10px] text-muted">{req.location}</span>}
                      {inviteeNames && (
                        <span className="flex items-center gap-1 text-[10px] text-muted">
                          <Users size={9}/> {inviteeNames}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onApprove(req.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-lg transition-colors">
                    <CheckCircle2 size={11} /> Approve
                  </button>
                  <button onClick={() => onReject(req.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[#dc2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] dark:bg-[#2D0808] rounded-lg transition-colors">
                    <XCircle size={11} /> Decline
                  </button>
                </div>
              </div>
              {idx < pending.length - 1 && <div className="mx-5 h-px bg-[#F4F4F4] dark:bg-[#1A2236]" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── RSVP bar (for invited users on event detail) ───────────────────────────────
function RSVPBar({ event, meId, onRSVP }) {
  const myStatus = event.inviteeStatus?.[meId] ?? null
  if (!event.invitees?.includes(meId)) return null

  const [showMsg, setShowMsg] = useState(false)
  const [msgText, setMsgText] = useState('')

  const actions = [
    { key: 'accepted',   label: 'Accept',      Icon: CheckCircle2, cls: 'text-[#15803d] bg-[#F0FDF4] hover:bg-[#DCFCE7] dark:bg-[#0A2318]' },
    { key: 'rejected',   label: 'Decline',     Icon: XCircle,      cls: 'text-[#dc2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] dark:bg-[#2D0808]' },
    { key: 'reschedule', label: 'Reschedule',  Icon: RotateCcw,    cls: 'text-accent bg-[#FFF3E8] hover:bg-[#FFE4C4] dark:bg-[#2D1F0A]'     },
  ]

  if (myStatus && myStatus !== 'pending') {
    const cfg = RSVP_CFG[myStatus]
    return (
      <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
        <cfg.Icon size={12} /> Your response: {cfg.label}
      </div>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Your RSVP</p>
      <div className="flex gap-1.5">
        {actions.map(({ key, label, Icon, cls }) => (
          <button key={key} onClick={() => { onRSVP(event.id, meId, key); if (key === 'reschedule') setShowMsg(true) }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${cls}`}>
            <Icon size={11} /> {label}
          </button>
        ))}
      </div>
      {showMsg && (
        <div className="flex gap-2 mt-1">
          <input type="text" placeholder="Add a note (e.g. propose new time)…"
            value={msgText} onChange={e => setMsgText(e.target.value)}
            className="flex-1 px-3 py-1.5 text-[11px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-lg bg-white dark:bg-[#1C2538] text-body dark:text-slate-200 placeholder:text-muted focus:outline-none focus:border-primary" />
          <button onClick={() => setShowMsg(false)}
            className="px-3 py-1.5 text-[11px] font-semibold text-white bg-primary rounded-lg">
            <Send size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main CalendarPage ──────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { user } = useAuth()
  const isAdmin  = user.role === 'Admin'
  // Derive a stable, string ID for the logged-in user
  const meId = String(user?._id ?? user?.id ?? '')

  const [apiEvents,    setApiEvents]    = useState([])
  const [projectMap,   setProjectMap]   = useState({})
  const [userMap,      setUserMap]      = useState({})
  const [allUsers,     setAllUsers]     = useState([])

  useEffect(() => {
    const from = `${TODAY_YEAR}-01-01`, to = `${TODAY_YEAR}-12-31`
    getCalendarEvents(from, to).then(evs => setApiEvents(evs.map(e => ({
      ...e, id: e._id, date: e.eventDate, time: e.eventTime, roles: e.rolesVisible ?? ['all'],
      projectId: e.projectId?._id ?? e.projectId,
    })))).catch(console.error)
    getProjects().then(ps => setProjectMap(Object.fromEntries(ps.map(p => [String(p._id), p.name])))).catch(console.error)
    getUsers().then(us => {
      setUserMap(Object.fromEntries(us.map(u => [String(u._id), u])))
      // Exclude workers from meeting invite list
      setAllUsers(us.filter(u => u.role !== 'Worker').map(u => ({ ...u, id: String(u._id) })))
    }).catch(console.error)
  }, [])

  const [year,        setYear]        = useState(TODAY_YEAR)
  const [month,       setMonth]       = useState(TODAY_MONTH)
  const [selectedDay, setSelectedDay] = useState(TODAY_DATE)
  const [showModal,   setShowModal]   = useState(false)
  const [customEvents, setCustom]     = useState([])
  const [typeFilter,  setTypeFilter]  = useState('all')
  const [meetingReqs, setMeetingReqs] = useState([])
  const [rsvpMap,     setRsvpMap]     = useState({})

  const seedEvents = apiEvents
  const allEvents = useMemo(() => [...apiEvents, ...customEvents], [apiEvents, customEvents])

  const roleEvents = useMemo(() =>
    allEvents.filter(e => e.roles.includes('all') || e.roles.includes(user.role))
  , [allEvents, user.role])

  const monthEvents = useMemo(() =>
    roleEvents.filter(e => {
      const [ey, em] = e.date.split('-').map(Number)
      return ey === year && em - 1 === month
    })
  , [roleEvents, year, month])

  const dayEvents = useMemo(() => {
    const iso = isoDate(year, month, selectedDay)
    return monthEvents.filter(e => e.date === iso && (typeFilter === 'all' || e.type === typeFilter))
  }, [monthEvents, year, month, selectedDay, typeFilter])

  const eventsByDay = useMemo(() => {
    const map = {}
    monthEvents.forEach(e => {
      const d = Number(e.date.split('-')[2])
      if (!map[d]) map[d] = []
      map[d].push(e)
    })
    return map
  }, [monthEvents])

  async function handleAdd(ev) {
    try {
      const payload = {
        title:        ev.title,
        eventDate:    ev.date,
        eventTime:    ev.time === 'All day' ? '' : ev.time,
        type:         ev.type,
        projectId:    ev.projectId || null,
        description:  ev.description,
        rolesVisible: ev.roles,
        invitees:     ev.invitees || [],
        meetingMode:  ev.meetingMode || '',
        location:     ev.location || '',
        purpose:      ev.purpose || '',
      }
      const created = await createEvent(payload)
      setApiEvents(p => [...p, {
        ...created,
        id:        created._id,
        date:      created.eventDate,
        time:      created.eventTime || 'All day',
        roles:     created.rolesVisible ?? ['all'],
        projectId: created.projectId?._id ?? created.projectId,
      }])
    } catch (err) {
      console.error(err)
      setCustom(p => [...p, ev])
    }
  }
  function handleRequest(req) { setMeetingReqs(p => [...p, req]) }
  function handleApprove(id) {
    const req = meetingReqs.find(r => r.id === id)
    if (req?._event) setCustom(p => [...p, req._event])
    setMeetingReqs(p => p.map(r => r.id === id ? { ...r, status: 'approved' } : r))
  }
  function handleReject(id) {
    setMeetingReqs(p => p.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
  }
  function handleRSVP(eventId, uid, status) {
    setRsvpMap(m => ({ ...m, [`${eventId}-${uid}`]: status }))
    setCustom(p => p.map(e => e.id === eventId
      ? { ...e, inviteeStatus: { ...e.inviteeStatus, [uid]: status } }
      : e
    ))
  }

  function prevMonth() {
    setSelectedDay(null)
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    setSelectedDay(null)
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
  }
  function goToday() { setYear(TODAY_YEAR); setMonth(TODAY_MONTH); setSelectedDay(TODAY_DATE) }

  const firstDayMon  = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const cells        = [...Array(firstDayMon).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const isCurrentMonth = year === TODAY_YEAR && month === TODAY_MONTH
  const defaultDate  = selectedDay ? isoDate(year, month, selectedDay) : isoDate(year, month, TODAY_DATE)

  const upcomingEvents = useMemo(() =>
    roleEvents
      .filter(e => e.date >= isoDate(TODAY_YEAR, TODAY_MONTH, TODAY_DATE))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8)
  , [roleEvents])

  const pendingReqs = meetingReqs.filter(r => r.status === 'pending')

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sora text-[20px] font-bold text-body dark:text-white leading-tight">Calendar</h2>
          <p className="text-[13px] text-muted dark:text-slate-400 mt-0.5">Meetings, deadlines & project schedules</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && pendingReqs.length > 0 && (
            <span className="text-[11px] font-semibold text-accent bg-[#FFF3E8] dark:bg-[#2D1F0A] px-2.5 py-1.5 rounded-lg border border-[#f5c98a]">
              {pendingReqs.length} meeting request{pendingReqs.length > 1 ? 's' : ''} pending
            </span>
          )}
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-xl transition-colors shadow-sm">
            <Plus size={15} strokeWidth={2.5} />
            {user.role === 'Admin' ? 'Add Event' : 'Request Meeting'}
          </button>
        </div>
      </div>

      {/* Admin pending meeting requests */}
      {isAdmin && (
        <MeetingRequestsPanel
          requests={meetingReqs}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* LEFT — Calendar grid */}
        <div className="col-span-2 bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">

          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body transition-colors">
                  <ChevronLeft size={16} strokeWidth={2} />
                </button>
                <button onClick={goToday} className="px-3 py-1.5 text-[11px] font-semibold text-primary dark:text-[#5B9BD5] bg-light-blue/60 dark:bg-[#1B2D4A] rounded-lg hover:bg-light-blue transition-colors">
                  Today
                </button>
                <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body transition-colors">
                  <ChevronRight size={16} strokeWidth={2} />
                </button>
              </div>
              <h3 className="font-sora font-semibold text-[16px] text-body dark:text-white">
                {MONTH_NAMES[month]} {year}
              </h3>
            </div>

            <div className="flex gap-1 bg-[#F0F2F5] dark:bg-[#0F1219] rounded-lg p-0.5">
              <button onClick={() => setTypeFilter('all')}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${typeFilter === 'all' ? 'bg-white dark:bg-[#1C2538] text-body dark:text-white shadow-sm' : 'text-muted dark:text-slate-500 hover:text-body'}`}>
                All
              </button>
              {EVENT_TYPES.map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors capitalize ${typeFilter === t ? 'bg-white dark:bg-[#1C2538] text-body dark:text-white shadow-sm' : 'text-muted dark:text-slate-500 hover:text-body'}`}>
                  {TYPE_CFG[t].label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
          <div className="min-w-[560px]">
          <div className="grid grid-cols-7 border-b border-[#F0F2F5] dark:border-[#1F2937]">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-wider py-3">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} className="h-[100px] border-b border-r border-[#F4F4F4] dark:border-[#1A2236]" />
              const col = i % 7
              const isWeekend = col === 5 || col === 6
              const isToday  = isCurrentMonth && day === TODAY_DATE
              const isSel    = selectedDay === day
              const evs      = (eventsByDay[day] ?? []).filter(e => typeFilter === 'all' || e.type === typeFilter)
              return (
                <div key={day} onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={[
                    'h-[100px] p-2 border-b border-r border-[#F4F4F4] dark:border-[#1A2236] cursor-pointer transition-colors duration-100 flex flex-col',
                    isWeekend ? 'bg-[#FAFBFC] dark:bg-[#111620]' : '',
                    isSel ? 'bg-light-blue/30 dark:bg-[#1B2D4A]/60 ring-2 ring-inset ring-primary/30' : 'hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236]',
                  ].join(' ')}>
                  <div className={['w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold self-end mb-1',
                    isToday ? 'bg-primary text-white shadow-sm' : '',
                    isWeekend && !isToday ? 'text-muted/40 dark:text-slate-600' : (!isToday ? 'text-body dark:text-slate-300' : ''),
                  ].join(' ')}>{day}</div>
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {evs.slice(0, 3).map(e => {
                      const cfg = TYPE_CFG[e.type]
                      return (
                        <div key={e.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${cfg.bg} ${cfg.text}`}>
                          <span className="truncate">{e.title}</span>
                        </div>
                      )
                    })}
                    {evs.length > 3 && <p className="text-[10px] text-muted dark:text-slate-500 pl-1">+{evs.length - 3} more</p>}
                  </div>
                </div>
              )
            })}
          </div>
          </div>
          </div>

          <div className="flex items-center gap-5 px-5 py-3 border-t border-[#F0F2F5] dark:border-[#1F2937]">
            {EVENT_TYPES.map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-sm ${TYPE_CFG[t].bg}`} />
                <span className="text-[11px] text-muted dark:text-slate-400">{TYPE_CFG[t].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Day detail + upcoming */}
        <div className="col-span-1 space-y-4">

          {selectedDay && (
            <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
                <div>
                  <p className="font-sora font-semibold text-[14px] text-body dark:text-white">
                    {selectedDay} {MONTH_NAMES[month]}
                  </p>
                  <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setShowModal(true)}
                  className="w-7 h-7 rounded-lg bg-light-blue/60 dark:bg-[#1B2D4A] flex items-center justify-center text-primary dark:text-[#5B9BD5] hover:bg-light-blue transition-colors">
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              </div>

              {dayEvents.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-[12px] text-muted dark:text-slate-500">No events for this day</p>
                  <button onClick={() => setShowModal(true)} className="text-[11px] font-medium text-primary dark:text-[#5B9BD5] mt-2 hover:underline">
                    + Add event
                  </button>
                </div>
              ) : (
                <div className="py-2">
                  {dayEvents.map((e, idx) => {
                    const cfg = TYPE_CFG[e.type]
                    const { Icon } = cfg
                    const hasMeetingDetails = e.type === 'meeting' && (e.meetingMode || e.location || e.purpose || e.invitees?.length)
                    const inviterName = e.invitees?.length && userMap[e.createdBy]?.name
                    return (
                      <div key={e.id}>
                        <div className="px-5 py-3 hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] transition-colors">
                          <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.light}`}>
                              <Icon size={14} strokeWidth={1.75} className={cfg.iconColor} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold text-body dark:text-white leading-snug">{e.title}</p>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {e.time && e.time !== 'All day' && (
                                  <span className="flex items-center gap-1 text-[11px] text-muted dark:text-slate-400">
                                    <Clock size={10} strokeWidth={2} /> {e.time}
                                  </span>
                                )}
                                {e.time === 'All day' && (
                                  <span className="text-[10px] font-semibold text-muted dark:text-slate-400 uppercase tracking-wide">All day</span>
                                )}
                                {e.projectId && (
                                  <span className="flex items-center gap-1 text-[11px] text-muted dark:text-slate-400 truncate">
                                    <MapPin size={10} strokeWidth={2} /> {projectMap[e.projectId] ?? ''}
                                  </span>
                                )}
                              </div>

                              {/* Meeting extra details */}
                              {hasMeetingDetails && (
                                <div className="mt-2 space-y-1.5">
                                  {e.meetingMode && (
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${e.meetingMode === 'online' ? 'bg-[#F5F3FF] text-[#7C3AED]' : 'bg-light-blue/60 text-primary'}`}>
                                      {e.meetingMode === 'online' ? <Video size={9}/> : <MapPin size={9}/>} {e.meetingMode}
                                    </span>
                                  )}
                                  {e.location && (
                                    <p className="text-[11px] text-muted dark:text-slate-400 flex items-center gap-1">
                                      <MapPin size={9}/> {e.location}
                                    </p>
                                  )}
                                  {e.purpose && (
                                    <p className="text-[11px] text-muted dark:text-slate-400">{e.purpose}</p>
                                  )}
                                  {e.invitees?.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                      <Users size={9} className="text-muted" />
                                      {e.invitees.map(id => {
                                        const u = userMap[id]
                                        const status = e.inviteeStatus?.[id] ?? 'pending'
                                        const sCfg = RSVP_CFG[status]
                                        return u ? (
                                          <span key={id} className={`flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${sCfg.bg} ${sCfg.text}`}>
                                            <sCfg.Icon size={8} /> {u.name.split(' ')[0]}
                                          </span>
                                        ) : null
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}

                              {e.description && !hasMeetingDetails && (
                                <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">{e.description}</p>
                              )}

                              {/* RSVP section */}
                              <RSVPBar event={e} meId={meId} onRSVP={handleRSVP} />
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md self-start shrink-0 ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                        {idx < dayEvents.length - 1 && <div className="mx-5 h-px bg-[#F4F4F4] dark:bg-[#1A2236]" />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Upcoming events */}
          <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
              <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Upcoming</h3>
              <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">Next scheduled events</p>
            </div>
            <div className="py-1 max-h-[380px] overflow-y-auto">
              {upcomingEvents.length === 0 ? (
                <p className="text-[12px] text-muted dark:text-slate-500 px-5 py-6 text-center">No upcoming events</p>
              ) : upcomingEvents.map((e, idx) => {
                const cfg = TYPE_CFG[e.type]
                const [ey, em, ed] = e.date.split('-').map(Number)
                const isToday2 = ey === TODAY_YEAR && em - 1 === TODAY_MONTH && ed === TODAY_DATE
                return (
                  <div key={e.id}>
                    <div onClick={() => { setYear(ey); setMonth(em - 1); setSelectedDay(ed) }}
                      className="flex gap-3 px-5 py-3 hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] transition-colors cursor-pointer">
                      <div className="shrink-0 w-10 text-center">
                        <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase">{MONTH_NAMES[em - 1].slice(0, 3)}</p>
                        <p className={`font-sora font-bold text-[18px] leading-none ${isToday2 ? 'text-primary dark:text-[#5B9BD5]' : 'text-body dark:text-white'}`}>{ed}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-body dark:text-white leading-snug truncate">{e.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                          {e.time && <span className="text-[10px] text-muted dark:text-slate-500">{e.time}</span>}
                          {e.meetingMode && (
                            <span className={`flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded ${e.meetingMode === 'online' ? 'bg-[#F5F3FF] text-[#7C3AED]' : 'bg-light-blue/60 text-primary'}`}>
                              {e.meetingMode === 'online' ? <Video size={8}/> : <MapPin size={8}/>} {e.meetingMode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {idx < upcomingEvents.length - 1 && <div className="mx-5 h-px bg-[#F4F4F4] dark:bg-[#1A2236]" />}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {showModal && (
        <AddEventModal
          defaultDate={defaultDate}
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
          onRequest={handleRequest}
          userRole={user.role}
          meId={meId}
          users={allUsers}
          projects={Object.entries(projectMap).map(([id, name]) => ({ id, name }))}
        />
      )}
    </div>
  )
}
