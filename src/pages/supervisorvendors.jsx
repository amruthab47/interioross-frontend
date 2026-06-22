import { useState, useMemo, useEffect } from 'react'
import {
  Search, Phone, Mail, Store, FolderKanban,
  Plus, X, ChevronDown, ChevronUp, AlertTriangle,
  Truck, MessageSquare, ClipboardList, Star,
  CheckCircle2, Clock, MapPin, CalendarDays, FileWarning,
  PhoneCall, StickyNote, Package, TrendingUp, Banknote,
  AlertCircle, ArrowUpDown, Filter, CircleDollarSign, Scale,
} from 'lucide-react'
import {
  getVendors, updateVendor,
  getVendorLogs, addVendorLog, updateVendorLog,
  getVendorIssues,
} from '../api/vendors'
import { getProjects } from '../api/projects'
import { projectToRow } from '../utils/format'
import { QuoteCompareTab } from './supervisorquotes'

/* ── helpers ────────────────────────────────────────────────────────────── */
function fmtDate(s) {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtINR(p) {
  if (!p) return '₹0'
  return '₹' + Math.round(p / 100).toLocaleString('en-IN')
}
function daysAgo(dateStr) {
  if (!dateStr) return null
  const diff = Math.floor((Date.now() - new Date(dateStr + 'T00:00:00')) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)  return `${diff}d ago`
  if (diff < 30) return `${Math.floor(diff/7)}w ago`
  return `${Math.floor(diff/30)}mo ago`
}

const TRADE_CFG = {
  Carpentry:       { bg: 'bg-[#FFF3E8]',  text: 'text-accent'    },
  Masonry:         { bg: 'bg-[#F7F9FC]',  text: 'text-muted'     },
  Electrical:      { bg: 'bg-[#FFFBEA]',  text: 'text-[#854d0e]' },
  Painting:        { bg: 'bg-[#FEF2F2]',  text: 'text-[#dc2626]' },
  Plumbing:        { bg: 'bg-light-blue/60', text: 'text-primary'   },
  Fabrication:     { bg: 'bg-[#F0FDF4]',  text: 'text-[#15803d]' },
  'False Ceiling': { bg: 'bg-[#F5F3FF]',  text: 'text-[#7C3AED]' },
  Flooring:        { bg: 'bg-[#FFF7ED]',  text: 'text-[#c2410c]' },
  Tiling:          { bg: 'bg-[#EFF6FF]',  text: 'text-[#1d4ed8]' },
  Waterproofing:   { bg: 'bg-[#F0FDFA]',  text: 'text-[#0f766e]' },
}
function tradeCfg(t) { return TRADE_CFG[t] ?? { bg: 'bg-[#F7F9FC]', text: 'text-muted' } }

const LOG_TYPE_CFG = {
  Visit:    { icon: MapPin,             bg: 'bg-[#EFF6FF]', text: 'text-primary',   label: 'Site Visit' },
  Call:     { icon: PhoneCall,          bg: 'bg-[#F0FDF4]', text: 'text-[#15803d]', label: 'Call'       },
  Delivery: { icon: Package,            bg: 'bg-[#FFF3E8]', text: 'text-accent',    label: 'Delivery'   },
  Dispute:  { icon: FileWarning,        bg: 'bg-[#FEF2F2]', text: 'text-[#dc2626]', label: 'Dispute'    },
  Note:     { icon: StickyNote,         bg: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]', label: 'Note'       },
  Payment:  { icon: Banknote,           bg: 'bg-[#F0FDF4]', text: 'text-[#15803d]', label: 'Payment'    },
}

const DELIVERY_STATUS_CFG = {
  'Pending':  { bg: 'bg-[#FFF3E8]', text: 'text-accent'     },
  'On Time':  { bg: 'bg-[#F0FDF4]', text: 'text-[#15803d]'  },
  'Delayed':  { bg: 'bg-[#FEF2F2]', text: 'text-[#dc2626]'  },
  'Partial':  { bg: 'bg-[#FFFBEA]', text: 'text-[#854d0e]'  },
  'Rejected': { bg: 'bg-[#FEF2F2]', text: 'text-[#dc2626]'  },
}

const DISPUTE_STATUS_CFG = {
  'Open':      { bg: 'bg-[#FEF2F2]', text: 'text-[#dc2626]'  },
  'Escalated': { bg: 'bg-[#FFF3E8]', text: 'text-accent'     },
  'Resolved':  { bg: 'bg-[#F0FDF4]', text: 'text-[#15803d]'  },
}

/* ── Star rating display ─────────────────────────────────────────────────── */
function StarRating({ rating, size = 'sm' }) {
  const sz = size === 'sm' ? 12 : 16
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => {
        const filled = rating >= s
        const half   = !filled && rating >= s - 0.5
        return (
          <svg key={s} viewBox="0 0 20 20" style={{ width: sz, height: sz }}>
            {half
              ? <><defs><linearGradient id={`h${s}`} x1="0" y1="0" x2="1" y2="0"><stop offset="50%" stopColor="#F59E0B"/><stop offset="50%" stopColor="#E5E7EB"/></linearGradient></defs>
                  <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" fill={`url(#h${s})`} stroke="#D1D5DB" strokeWidth="0.5"/></>
              : <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7"
                  fill={filled ? '#F59E0B' : '#F3F4F6'} stroke={filled ? '#F59E0B' : '#D1D5DB'} strokeWidth="0.5"/>
            }
          </svg>
        )
      })}
      <span className="text-[11px] font-semibold text-body ml-1">{Number(rating).toFixed(1)}</span>
    </div>
  )
}

/* ── Interactive star picker ─────────────────────────────────────────────── */
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)} className="transition-transform hover:scale-110">
          <svg viewBox="0 0 20 20" className="w-6 h-6">
            <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7"
              fill={(hover || value) >= s ? '#F59E0B' : '#E5E7EB'}
              stroke={(hover || value) >= s ? '#F59E0B' : '#D1D5DB'} strokeWidth="0.5"/>
          </svg>
        </button>
      ))}
      {value > 0 && <span className="text-[12px] text-muted ml-1">{value}.0</span>}
    </div>
  )
}

/* ── Issues Panel ────────────────────────────────────────────────────────── */
function IssuesPanel({ issues }) {
  const [open, setOpen] = useState(true)
  const total = (issues.disputes?.length ?? 0) + (issues.deliveries?.length ?? 0)
  if (total === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-[#dc2626]/25 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#FEF9F9] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <AlertCircle size={15} className="text-[#dc2626]" />
          <span className="font-sora font-semibold text-[14px] text-body">Open Issues</span>
          {issues.disputes?.length > 0 && (
            <span className="text-[10px] font-bold text-[#dc2626] bg-[#FEF2F2] px-2 py-0.5 rounded-full">
              {issues.disputes.length} dispute{issues.disputes.length !== 1 ? 's' : ''}
            </span>
          )}
          {issues.deliveries?.length > 0 && (
            <span className="text-[10px] font-bold text-accent bg-[#FFF3E8] px-2 py-0.5 rounded-full">
              {issues.deliveries.length} pending delivery{issues.deliveries.length !== 1 ? 'ies' : ''}
            </span>
          )}
        </div>
        <ChevronDown size={14} className={`text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-[#F0F2F5] px-5 py-4 space-y-4">
          {/* Disputes */}
          {issues.disputes?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2.5">
                Disputes — {issues.disputes.length} open
              </p>
              <div className="space-y-2">
                {issues.disputes.map(d => (
                  <div key={String(d._id)} className="flex gap-3 p-3 bg-[#FEF9F9] border border-[#dc2626]/15 rounded-xl">
                    <FileWarning size={14} className="text-[#dc2626] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[12px] text-body">{d.vendorId?.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${DISPUTE_STATUS_CFG[d.disputeStatus]?.bg} ${DISPUTE_STATUS_CFG[d.disputeStatus]?.text}`}>
                          {d.disputeStatus}
                        </span>
                        {d.projectId?.name && (
                          <span className="text-[10px] text-muted bg-[#F0F2F5] px-1.5 py-0.5 rounded-md">{d.projectId.name}</span>
                        )}
                        {d.disputeAmount > 0 && (
                          <span className="text-[10px] font-bold text-[#dc2626]">{fmtINR(d.disputeAmount)}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{d.summary}</p>
                      <p className="text-[10px] text-muted/60 mt-0.5">by {d.createdBy?.name} · {fmtDate(d.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending deliveries */}
          {issues.deliveries?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2.5">
                Pending Deliveries — {issues.deliveries.length}
              </p>
              <div className="space-y-2">
                {issues.deliveries.map(d => (
                  <div key={String(d._id)} className="flex gap-3 p-3 bg-[#FFFAF0] border border-accent/20 rounded-xl">
                    <Truck size={14} className="text-accent shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[12px] text-body">{d.vendorId?.name}</span>
                        {d.projectId?.name && (
                          <span className="text-[10px] text-muted bg-[#F0F2F5] px-1.5 py-0.5 rounded-md">{d.projectId.name}</span>
                        )}
                        {d.expectedDate && (
                          <span className="text-[10px] font-semibold text-accent bg-[#FFF3E8] px-1.5 py-0.5 rounded-md">
                            Expected {fmtDate(d.expectedDate)}
                          </span>
                        )}
                      </div>
                      {d.deliveryItems && (
                        <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{d.deliveryItems}</p>
                      )}
                      <p className="text-[10px] text-muted/60 mt-0.5">Logged {fmtDate(d.date)} · by {d.createdBy?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Log Activity Modal ──────────────────────────────────────────────────── */
function LogModal({ vendor, projects, onClose, onSaved }) {
  const [form, setForm] = useState({
    type: 'Call',
    date: new Date().toISOString().split('T')[0],
    summary: '', projectId: '',
    deliveryStatus: 'Pending', deliveryItems: '', expectedDate: '',
    disputeAmount: '',
    paymentAmount: '',
    ratingGiven: 0,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    if (!form.summary.trim()) { setErr('Please enter a summary.'); return }
    if (form.type === 'Payment' && (!form.paymentAmount || Number(form.paymentAmount) <= 0)) {
      setErr('Enter the amount paid.'); return
    }
    setSaving(true); setErr('')
    try {
      const payload = {
        type:       form.type,
        date:       form.date,
        summary:    form.summary.trim(),
        projectId:  form.projectId || undefined,
        ratingGiven: form.ratingGiven || 0,
        ...(form.type === 'Delivery' && {
          deliveryStatus: form.deliveryStatus,
          deliveryItems:  form.deliveryItems,
          expectedDate:   form.expectedDate || '',
        }),
        ...(form.type === 'Dispute' && {
          disputeAmount: form.disputeAmount ? Math.round(Number(form.disputeAmount) * 100) : 0,
        }),
        ...(form.type === 'Payment' && {
          paymentAmountPaise: Math.round(Number(form.paymentAmount) * 100),
        }),
      }
      const log = await addVendorLog(vendor._id ?? vendor.id, payload)
      onSaved(log)
      onClose()
    } catch(e) { setErr(e.message || 'Failed to save.') }
    finally { setSaving(false) }
  }

  const fi = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] rounded-xl focus:outline-none focus:border-primary text-body bg-white transition-colors'
  const lb = 'block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FFF3E8] flex items-center justify-center">
              <ClipboardList size={14} strokeWidth={2} className="text-accent" />
            </div>
            <div>
              <p className="font-sora font-semibold text-[15px] text-body">Log Activity</p>
              <p className="text-[11px] text-muted">{vendor.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] transition-colors">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Type buttons */}
          <div>
            <label className={lb}>Activity Type</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(LOG_TYPE_CFG).map(([t, cfg]) => {
                const Icon = cfg.icon
                return (
                  <button key={t} type="button" onClick={() => set('type', t)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-medium transition-all ${
                      form.type === t
                        ? `${cfg.bg} ${cfg.text} border-current`
                        : 'border-[#EFEFEF] text-muted hover:border-primary hover:text-primary'
                    }`}>
                    <Icon size={14} strokeWidth={1.75} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lb}>Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={fi} />
            </div>
            <div>
              <label className={lb}>Project <span className="text-muted font-normal normal-case tracking-normal">(optional)</span></label>
              <select value={form.projectId} onChange={e => set('projectId', e.target.value)} className={fi}>
                <option value="">— General —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lb}>Summary / Notes <span className="text-[#dc2626]">*</span></label>
            <textarea rows={3} required value={form.summary} onChange={e => set('summary', e.target.value)}
              placeholder={
                form.type === 'Visit'    ? 'What was discussed? Any agreements made?' :
                form.type === 'Call'     ? 'What did you talk about? Any commitments made?' :
                form.type === 'Delivery' ? 'What arrived? Any issues with the delivery?' :
                form.type === 'Dispute'  ? 'Describe the issue clearly for admin escalation' :
                form.type === 'Payment'  ? 'Advance payment, partial payment, final settlement…' :
                                           'Add any note about this vendor…'
              }
              className={`${fi} resize-none`} />
          </div>

          {/* Delivery fields */}
          {form.type === 'Delivery' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lb}>Delivery Status</label>
                  <select value={form.deliveryStatus} onChange={e => set('deliveryStatus', e.target.value)} className={fi}>
                    {['Pending','On Time','Delayed','Partial','Rejected'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lb}>Expected Date <span className="text-muted font-normal normal-case tracking-normal">(if pending)</span></label>
                  <input type="date" value={form.expectedDate} onChange={e => set('expectedDate', e.target.value)} className={fi} />
                </div>
              </div>
              <div>
                <label className={lb}>Items</label>
                <input type="text" placeholder="e.g. Gypsum boards (60), MS grid (180 ft)"
                  value={form.deliveryItems} onChange={e => set('deliveryItems', e.target.value)} className={fi} />
              </div>
            </div>
          )}

          {/* Dispute fields */}
          {form.type === 'Dispute' && (
            <div>
              <label className={lb}>Amount in Dispute (₹) <span className="text-muted font-normal normal-case tracking-normal">(optional)</span></label>
              <input type="number" min="0" placeholder="e.g. 65000"
                value={form.disputeAmount} onChange={e => set('disputeAmount', e.target.value)} className={fi} />
            </div>
          )}

          {/* Payment fields */}
          {form.type === 'Payment' && (
            <div>
              <label className={lb}>Amount Paid (₹) <span className="text-[#dc2626]">*</span></label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-[13px] font-medium">₹</span>
                <input type="number" min="1" placeholder="0"
                  value={form.paymentAmount} onChange={e => set('paymentAmount', e.target.value)}
                  className={`${fi} pl-7`} />
              </div>
              <p className="text-[11px] text-muted mt-1">This will reduce the vendor's outstanding balance.</p>
            </div>
          )}

          {/* Rating on visits / deliveries */}
          {(form.type === 'Visit' || form.type === 'Delivery') && (
            <div>
              <label className={lb}>Rate This Vendor <span className="text-muted font-normal normal-case tracking-normal">(optional — updates vendor rating)</span></label>
              <StarPicker value={form.ratingGiven} onChange={v => set('ratingGiven', v)} />
            </div>
          )}

          {err && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] px-3 py-2 rounded-lg">{err}</p>}
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-[#F0F2F5] shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] rounded-xl hover:border-primary hover:text-primary transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-navy hover:bg-primary rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving
              ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"/>Saving…</>
              : 'Save Activity'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Resolve Dispute Modal ───────────────────────────────────────────────── */
function ResolveDisputeModal({ log, vendorId, onClose, onResolved }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateVendorLog(vendorId, log._id, { disputeStatus: 'Resolved', resolvedNote: note })
      onResolved(updated)
      onClose()
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-2xl w-full max-w-[420px]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF]">
          <p className="font-sora font-semibold text-[15px] text-body">Resolve Dispute</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] transition-colors"><X size={16} strokeWidth={2}/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <p className="text-[13px] text-body bg-[#F7F9FC] rounded-xl px-3.5 py-3 leading-relaxed">{log.summary}</p>
          <div>
            <label className="block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5">Resolution Note</label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
              placeholder="How was this resolved?"
              className="w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] rounded-xl focus:outline-none focus:border-primary text-body bg-white resize-none transition-colors"/>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] rounded-xl hover:border-primary hover:text-primary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-xl transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Mark Resolved'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Vendor Card (expandable) ────────────────────────────────────────────── */
function VendorCard({ vendor, projects, issueStats, onVendorUpdate }) {
  const [expanded,    setExpanded]    = useState(false)
  const [logs,        setLogs]        = useState(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [showLog,     setShowLog]     = useState(false)
  const [resolving,   setResolving]   = useState(null)

  const id = vendor._id ?? vendor.id

  async function loadLogs() {
    if (logs !== null) return
    setLoadingLogs(true)
    try { setLogs(await getVendorLogs(id)) }
    catch(e) { console.error(e); setLogs([]) }
    finally { setLoadingLogs(false) }
  }

  function toggle() { setExpanded(e => !e); loadLogs() }

  function handleLogSaved(newLog) {
    setLogs(prev => prev ? [newLog, ...prev] : [newLog])
    if (newLog.ratingGiven > 0) {
      onVendorUpdate({ ...vendor, rating: Math.min(5, parseFloat(((vendor.rating + newLog.ratingGiven) / 2).toFixed(1))) })
    }
    if (newLog.type === 'Payment' && newLog.paymentAmountPaise > 0) {
      onVendorUpdate({ ...vendor, paymentOutstandingPaise: Math.max(0, (vendor.paymentOutstandingPaise || 0) - newLog.paymentAmountPaise) })
    }
  }

  function handleDisputeResolved(updated) {
    setLogs(prev => prev ? prev.map(l => String(l._id) === String(updated._id) ? updated : l) : prev)
  }

  const openDisputes = (logs ?? []).filter(l => l.type === 'Dispute' && l.disputeStatus !== 'Resolved')
  const pendingDlv   = (logs ?? []).filter(l => l.type === 'Delivery' && l.deliveryStatus === 'Pending')
  const lastActivity = (logs ?? []).sort((a, b) => b.date > a.date ? 1 : -1)[0]
  const tc = tradeCfg(vendor.trade)

  // Use issueStats from parent (derived from /issues endpoint) when logs not yet loaded
  const disputeCount  = logs ? openDisputes.length  : (issueStats?.disputes  ?? 0)
  const deliveryCount = logs ? pendingDlv.length     : (issueStats?.deliveries ?? 0)
  const hasIssues     = disputeCount > 0 || deliveryCount > 0

  return (
    <>
      <div className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm ${
        expanded ? 'border-primary/40 shadow-md' :
        hasIssues ? 'border-[#dc2626]/20 hover:border-[#dc2626]/40' :
        'border-[#EFEFEF] hover:border-primary/25 hover:shadow-md'
      }`}>

        {/* ── Card header ── */}
        <div className="flex items-start gap-4 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-[#FFF3E8] flex items-center justify-center shrink-0 mt-0.5">
            <Store size={17} strokeWidth={1.75} className="text-accent" />
          </div>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={toggle}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] font-semibold text-body">{vendor.name}</p>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${tc.bg} ${tc.text}`}>{vendor.trade}</span>
                  {disputeCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#dc2626] bg-[#FEF2F2] px-2 py-0.5 rounded-full">
                      <AlertTriangle size={9} strokeWidth={2.5}/>{disputeCount} dispute{disputeCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {deliveryCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-accent bg-[#FFF3E8] px-2 py-0.5 rounded-full">
                      <Truck size={9} strokeWidth={2.5}/>{deliveryCount} delivery pending
                    </span>
                  )}
                  {(vendor.paymentOutstandingPaise ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#854d0e] bg-[#FFFBEA] px-2 py-0.5 rounded-full">
                      <CircleDollarSign size={9} strokeWidth={2.5}/>{fmtINR(vendor.paymentOutstandingPaise)} due
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                  <StarRating rating={vendor.rating ?? 0} />
                  <a href={`tel:${vendor.contact}`} onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-[12px] text-primary hover:text-mid-blue transition-colors font-medium">
                    <Phone size={11} strokeWidth={2}/>{vendor.contact}
                  </a>
                  {vendor.email && (
                    <a href={`mailto:${vendor.email}`} onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 text-[12px] text-muted hover:text-primary transition-colors">
                      <Mail size={11} strokeWidth={1.75}/>{vendor.email}
                    </a>
                  )}
                  {lastActivity && (
                    <span className="flex items-center gap-1 text-[11px] text-muted">
                      <Clock size={11} strokeWidth={1.75}/>Last: {daysAgo(lastActivity.date)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); setShowLog(true) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-navy hover:bg-primary rounded-lg transition-colors whitespace-nowrap">
                  <Plus size={11} strokeWidth={2.5}/> Log Activity
                </button>
                <div className="text-muted">{expanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Expanded activity log ── */}
        {expanded && (
          <div className="border-t border-[#F0F2F5] px-5 py-4">
            {loadingLogs ? (
              <div className="flex items-center gap-2 py-4">
                <span className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin"/>
                <span className="text-[12px] text-muted">Loading activity log…</span>
              </div>
            ) : !logs || logs.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <ClipboardList size={28} strokeWidth={1.25} className="text-muted/40"/>
                <p className="text-[13px] font-semibold text-muted">No activity logged yet</p>
                <p className="text-[11px] text-muted/70">Log your first call, visit or delivery using the button above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-3">Activity Log ({logs.length})</p>
                {logs.map((log) => {
                  const cfg  = LOG_TYPE_CFG[log.type] ?? LOG_TYPE_CFG.Note
                  const Icon = cfg.icon
                  const isOpenDispute = log.type === 'Dispute' && log.disputeStatus !== 'Resolved'
                  return (
                    <div key={String(log._id)}
                      className={`flex gap-3 p-3.5 rounded-xl border transition-colors ${
                        isOpenDispute
                          ? 'bg-[#FEF9F9] border-[#dc2626]/20'
                          : log.type === 'Payment'
                          ? 'bg-[#F0FDF8] border-[#15803d]/15'
                          : 'bg-[#F7F9FC] border-[#EFEFEF]'
                      }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                        <Icon size={14} strokeWidth={1.75} className={cfg.text}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${cfg.text}`}>{cfg.label}</span>
                            {log.projectId?.name && (
                              <span className="text-[10px] text-muted bg-[#F0F2F5] px-1.5 py-0.5 rounded-md">{log.projectId.name}</span>
                            )}
                            {log.deliveryStatus && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${DELIVERY_STATUS_CFG[log.deliveryStatus]?.bg} ${DELIVERY_STATUS_CFG[log.deliveryStatus]?.text}`}>
                                {log.deliveryStatus}
                              </span>
                            )}
                            {log.disputeStatus && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${DISPUTE_STATUS_CFG[log.disputeStatus]?.bg} ${DISPUTE_STATUS_CFG[log.disputeStatus]?.text}`}>
                                {log.disputeStatus}
                              </span>
                            )}
                            {log.ratingGiven > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] text-[#F59E0B] font-semibold">
                                <Star size={10} fill="#F59E0B" strokeWidth={0}/>{log.ratingGiven}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted whitespace-nowrap shrink-0">{fmtDate(log.date)}</span>
                        </div>

                        <p className="text-[12px] text-body mt-1 leading-relaxed">{log.summary}</p>

                        {log.deliveryItems && (
                          <p className="text-[11px] text-muted mt-1 flex items-center gap-1">
                            <Package size={10} strokeWidth={1.75}/>{log.deliveryItems}
                          </p>
                        )}
                        {log.expectedDate && log.deliveryStatus === 'Pending' && (
                          <p className="text-[11px] text-accent font-medium mt-0.5 flex items-center gap-1">
                            <CalendarDays size={10} strokeWidth={1.75}/>Expected {fmtDate(log.expectedDate)}
                          </p>
                        )}
                        {log.disputeAmount > 0 && (
                          <p className="text-[11px] text-[#dc2626] font-semibold mt-1">
                            Amount in dispute: {fmtINR(log.disputeAmount)}
                          </p>
                        )}
                        {log.paymentAmountPaise > 0 && (
                          <p className="text-[11px] text-[#15803d] font-semibold mt-1 flex items-center gap-1">
                            <Banknote size={10} strokeWidth={1.75}/>Paid: {fmtINR(log.paymentAmountPaise)}
                          </p>
                        )}
                        {log.resolvedNote && (
                          <p className="text-[11px] text-[#15803d] mt-1 bg-[#F0FDF4] px-2 py-1 rounded-lg">
                            Resolved: {log.resolvedNote}
                          </p>
                        )}
                        <p className="text-[10px] text-muted/60 mt-1.5">by {log.createdBy?.name ?? '—'}</p>

                        {isOpenDispute && (
                          <button
                            onClick={() => setResolving(log)}
                            className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#15803d] bg-[#F0FDF4] hover:bg-[#dcfce7] px-2.5 py-1.5 rounded-lg transition-colors">
                            <CheckCircle2 size={11} strokeWidth={2.5}/> Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showLog && (
        <LogModal vendor={vendor} projects={projects} onClose={() => setShowLog(false)} onSaved={handleLogSaved}/>
      )}
      {resolving && (
        <ResolveDisputeModal log={resolving} vendorId={id} onClose={() => setResolving(null)} onResolved={handleDisputeResolved}/>
      )}
    </>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { value: 'issues',      label: 'Issues First'       },
  { value: 'outstanding', label: 'Outstanding (High)'  },
  { value: 'rating',      label: 'Rating (High)'       },
  { value: 'name',        label: 'Name (A–Z)'          },
]

const TYPE_FILTERS = [
  { value: 'all',         label: 'All'                },
  { value: 'issues',      label: 'Has Issues'         },
  { value: 'delivery',    label: 'Pending Delivery'   },
  { value: 'outstanding', label: 'Has Outstanding'    },
]

export default function SupervisorVendors() {
  const [pageTab,      setPageTab]      = useState('vendors') // 'vendors' | 'quotes'
  const [vendors,      setVendors]      = useState([])
  const [projects,     setProjects]     = useState([])
  const [issues,       setIssues]       = useState({ disputes: [], deliveries: [] })
  const [search,       setSearch]       = useState('')
  const [tradeFilter,  setTradeFilter]  = useState('all')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [sortBy,       setSortBy]       = useState('issues')
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    Promise.all([
      getVendors(),
      getProjects(),
      getVendorIssues().catch(() => ({ disputes: [], deliveries: [] })),
    ])
      .then(([vs, ps, iss]) => {
        setVendors(vs)
        setProjects(ps.map(projectToRow))
        setIssues(iss || { disputes: [], deliveries: [] })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Map vendorId → { disputes, deliveries } counts from the issues endpoint
  const issuesByVendor = useMemo(() => {
    const map = {}
    ;(issues.disputes ?? []).forEach(d => {
      const vid = String(d.vendorId?._id ?? d.vendorId)
      if (!map[vid]) map[vid] = { disputes: 0, deliveries: 0 }
      map[vid].disputes++
    })
    ;(issues.deliveries ?? []).forEach(d => {
      const vid = String(d.vendorId?._id ?? d.vendorId)
      if (!map[vid]) map[vid] = { disputes: 0, deliveries: 0 }
      map[vid].deliveries++
    })
    return map
  }, [issues])

  const allTrades = useMemo(() => ['all', ...new Set(vendors.map(v => v.trade))], [vendors])

  const displayed = useMemo(() => {
    const q = search.toLowerCase()
    let list = vendors.filter(v =>
      (tradeFilter === 'all' || v.trade === tradeFilter) &&
      ((v.name ?? '').toLowerCase().includes(q) ||
       (v.trade ?? '').toLowerCase().includes(q) ||
       (v.contact ?? '').includes(q))
    )

    // Type quick-filter
    if (typeFilter === 'issues') {
      list = list.filter(v => (issuesByVendor[String(v._id)]?.disputes ?? 0) > 0)
    } else if (typeFilter === 'delivery') {
      list = list.filter(v => (issuesByVendor[String(v._id)]?.deliveries ?? 0) > 0)
    } else if (typeFilter === 'outstanding') {
      list = list.filter(v => (v.paymentOutstandingPaise ?? 0) > 0)
    }

    // Sort
    list = [...list]
    if (sortBy === 'issues') {
      list.sort((a, b) => {
        const ai = (issuesByVendor[String(a._id)]?.disputes ?? 0) + (issuesByVendor[String(a._id)]?.deliveries ?? 0)
        const bi = (issuesByVendor[String(b._id)]?.disputes ?? 0) + (issuesByVendor[String(b._id)]?.deliveries ?? 0)
        return bi - ai || a.name.localeCompare(b.name)
      })
    } else if (sortBy === 'outstanding') {
      list.sort((a, b) => (b.paymentOutstandingPaise ?? 0) - (a.paymentOutstandingPaise ?? 0))
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }

    return list
  }, [vendors, search, tradeFilter, typeFilter, sortBy, issuesByVendor])

  function handleVendorUpdate(updated) {
    setVendors(prev => prev.map(v => String(v._id) === String(updated._id ?? updated.id) ? updated : v))
  }

  const avgRating              = vendors.length ? (vendors.reduce((s, v) => s + (v.rating ?? 0), 0) / vendors.length).toFixed(1) : '0'
  const totalPaymentOutstanding = vendors.reduce((s, v) => s + (v.paymentOutstandingPaise ?? 0), 0)
  const totalIssues            = (issues.disputes?.length ?? 0) + (issues.deliveries?.length ?? 0)

  return (
    <div className="space-y-5">

      {/* Header + tab bar */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-sora text-[20px] font-bold text-body leading-tight">Vendors</h2>
          <p className="text-[13px] text-muted mt-0.5">Manage vendors, log activity, and compare quotes</p>
        </div>
        <div className="flex gap-1 bg-white border border-[#EFEFEF] rounded-xl shadow-sm p-1">
          {[
            { id: 'vendors', label: 'Vendors', icon: Store },
            { id: 'quotes',  label: 'Quote Compare', icon: Scale },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setPageTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${pageTab === id ? 'bg-navy text-white shadow-sm' : 'text-muted hover:bg-[#F0F2F5] hover:text-body'}`}>
              <Icon size={13} strokeWidth={1.75}/>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Quote Compare tab */}
      {pageTab === 'quotes' && <QuoteCompareTab vendors={vendors} projects={projects} />}

      {/* Vendors tab content */}
      {pageTab === 'vendors' && <>

      {/* Issues panel */}
      {!loading && <IssuesPanel issues={issues} />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Vendors',       value: vendors.length,              icon: Store,          bg: 'bg-light-blue/60', color: 'text-primary'    },
          { label: 'Avg Rating',          value: `${avgRating}/5`,            icon: TrendingUp,     bg: 'bg-[#FFFBEA]',     color: 'text-[#854d0e]'  },
          { label: 'Payment Outstanding', value: fmtINR(totalPaymentOutstanding), icon: AlertTriangle, bg: 'bg-[#FEF2F2]', color: 'text-[#dc2626]'  },
          { label: 'Open Issues',         value: totalIssues,                 icon: AlertCircle,    bg: 'bg-[#FEF2F2]',     color: 'text-[#dc2626]'  },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#EFEFEF] shadow-sm px-5 py-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
              <Icon size={17} strokeWidth={1.75} className={color}/>
            </div>
            <div>
              <p className="text-[11px] text-muted uppercase tracking-wider">{label}</p>
              <p className="font-sora font-bold text-[20px] text-body leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + sort row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"/>
          <input type="text" placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 text-[13px] bg-white border border-[#EFEFEF] rounded-xl focus:outline-none focus:border-primary text-body placeholder:text-muted transition-colors"/>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-1.5 bg-white border border-[#EFEFEF] rounded-xl px-3 py-2 cursor-pointer">
          <ArrowUpDown size={13} className="text-muted shrink-0"/>
          <select
            value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="text-[12px] text-body bg-transparent border-none outline-none cursor-pointer pr-1"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Type filter + trade filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Quick type filters */}
        <div className="flex gap-1.5">
          {TYPE_FILTERS.map(f => (
            <button key={f.value} onClick={() => setTypeFilter(f.value)}
              className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                typeFilter === f.value
                  ? 'bg-navy text-white'
                  : 'bg-white text-muted border border-[#EFEFEF] hover:text-body'
              }`}>
              {f.label}
              {f.value === 'issues' && totalIssues > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeFilter === f.value ? 'bg-white/20' : 'bg-[#FEF2F2] text-[#dc2626]'}`}>
                  {totalIssues}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Trade filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {allTrades.map(t => (
            <button key={t} onClick={() => setTradeFilter(t)}
              className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg capitalize transition-colors ${
                tradeFilter === t
                  ? 'bg-primary text-white'
                  : 'bg-white text-muted border border-[#EFEFEF] hover:text-body'
              }`}>
              {t === 'all' ? 'All Trades' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor cards */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-[#EFEFEF] p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F0F2F5] shrink-0"/>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#F0F2F5] rounded w-48"/>
                  <div className="h-3 bg-[#F0F2F5] rounded w-64"/>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center py-16 bg-white rounded-2xl border border-[#EFEFEF] gap-3">
          <Store size={36} strokeWidth={1.25} className="text-muted/40"/>
          <p className="text-[14px] font-semibold text-muted">No vendors found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(v => (
            <VendorCard
              key={String(v._id ?? v.id)}
              vendor={v}
              projects={projects}
              issueStats={issuesByVendor[String(v._id)] ?? null}
              onVendorUpdate={handleVendorUpdate}
            />
          ))}
        </div>
      )}

      </>}
    </div>
  )
}
