import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, X, Phone, Mail, ChevronUp, ChevronDown, Store, IndianRupee, FolderKanban, AlertTriangle, Loader2 } from 'lucide-react'
import { getVendors, createVendor } from '../api/vendors'

function normalizeVendor(v) {
  return { ...v, id: v._id, usedProjects: v.usedProjectsCount ?? 0, paymentOutstanding: Math.round((v.paymentOutstandingPaise ?? 0) / 100) }
}

const TRADES = [
  'Carpentry', 'Masonry', 'Electrical', 'Painting', 'Plumbing',
  'Fabrication', 'False Ceiling', 'Flooring', 'Tiling', 'Waterproofing',
  'Civil', 'HVAC', 'Glazing', 'Landscaping',
]

const TRADE_CFG = {
  Carpentry:     { bg: 'bg-[#FFF3E8]  dark:bg-[#2D1F0A]',   text: 'text-accent'           },
  Masonry:       { bg: 'bg-[#F7F9FC]  dark:bg-[#1A2236]',   text: 'text-muted'            },
  Electrical:    { bg: 'bg-[#FFFBEA]  dark:bg-[#2D2A00]',   text: 'text-[#854d0e]'        },
  Painting:      { bg: 'bg-[#FEF2F2]  dark:bg-[#2D0808]',   text: 'text-[#dc2626]'        },
  Plumbing:      { bg: 'bg-light-blue/60 dark:bg-[#1B2D4A]', text: 'text-primary dark:text-[#5B9BD5]' },
  Fabrication:   { bg: 'bg-[#F0FDF4]  dark:bg-[#0A2318]',   text: 'text-[#15803d]'        },
  'False Ceiling': { bg: 'bg-[#F5F3FF] dark:bg-[#1A0E3A]',  text: 'text-[#7C3AED]'        },
  Flooring:      { bg: 'bg-[#FFF7ED]  dark:bg-[#2D1A00]',   text: 'text-[#c2410c]'        },
  Tiling:        { bg: 'bg-[#EFF6FF]  dark:bg-[#0B1D3A]',   text: 'text-[#1d4ed8]'        },
  Waterproofing: { bg: 'bg-[#F0FDFA]  dark:bg-[#022c22]',   text: 'text-[#0f766e]'        },
}

function tradeCfg(trade) {
  return TRADE_CFG[trade] ?? { bg: 'bg-[#F7F9FC] dark:bg-[#1A2236]', text: 'text-muted' }
}

function fmt(n) {
  if (!n) return '—'
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  return `₹${(n / 1000).toFixed(0)}k`
}

// ── Animated Star Rating ──────────────────────────────────────────────────────
function StarRating({ rating, animate = true }) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center gap-0.5">
      <style>{`
        @keyframes starPop {
          0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
          60%  { transform: scale(1.35) rotate(8deg); opacity: 1; }
          80%  { transform: scale(0.9) rotate(-4deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes starGlow {
          0%, 100% { filter: drop-shadow(0 0 2px #F59E0B88); }
          50%       { filter: drop-shadow(0 0 6px #F59E0BCC) drop-shadow(0 0 12px #FBBF2466); }
        }
        .star-filled {
          animation:
            ${animate ? 'starPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both,' : ''}
            starGlow 2.4s ease-in-out infinite;
        }
        .star-filled:nth-child(1) { animation-delay: ${animate ? '0ms, ' : ''}0ms; }
        .star-filled:nth-child(2) { animation-delay: ${animate ? '60ms, ' : ''}300ms; }
        .star-filled:nth-child(3) { animation-delay: ${animate ? '120ms, ' : ''}600ms; }
        .star-filled:nth-child(4) { animation-delay: ${animate ? '180ms, ' : ''}900ms; }
        .star-filled:nth-child(5) { animation-delay: ${animate ? '240ms, ' : ''}1200ms; }
      `}</style>
      {stars.map(s => {
        const filled = rating >= s
        const half   = !filled && rating >= s - 0.5

        if (filled) {
          return (
            <svg key={s} viewBox="0 0 20 20" className="w-4 h-4 star-filled" style={{ animationDelay: animate ? `${(s - 1) * 60}ms, ${(s - 1) * 300}ms` : `${(s - 1) * 300}ms` }}>
              <defs>
                <linearGradient id={`sg-full-${s}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FCD34D" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
              <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7"
                fill={`url(#sg-full-${s})`} stroke="#F59E0B" strokeWidth="0.5" />
            </svg>
          )
        }
        if (half) {
          return (
            <svg key={s} viewBox="0 0 20 20" className="w-4 h-4">
              <defs>
                <linearGradient id={`sg-half-${s}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#E5E7EB" />
                </linearGradient>
              </defs>
              <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7"
                fill={`url(#sg-half-${s})`} stroke="#D1D5DB" strokeWidth="0.5" />
            </svg>
          )
        }
        return (
          <svg key={s} viewBox="0 0 20 20" className="w-4 h-4">
            <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7"
              fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="0.5" />
          </svg>
        )
      })}
      <span className="text-[12px] font-semibold text-body dark:text-slate-200 ml-1.5">{rating.toFixed(1)}</span>
    </div>
  )
}

// ── Add Vendor Modal ──────────────────────────────────────────────────────────
function AddVendorModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', trade: '', contact: '', email: '', rating: '4.0', notes: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function validate() {
    const e = {}
    if (!form.name.trim())    e.name  = 'Vendor name is required'
    if (!form.trade)          e.trade = 'Trade is required'
    if (!form.contact.trim()) e.contact = 'Contact number is required'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setApiError('')
    setLoading(true)
    try {
      const saved = await createVendor({
        name:    form.name.trim(),
        trade:   form.trade,
        contact: form.contact.trim(),
        email:   form.email.trim(),
        rating:  parseFloat(form.rating),
      })
      onAdd(normalizeVendor(saved))
      onClose()
    } catch (err) {
      setApiError(err.message || 'Failed to add vendor')
    } finally {
      setLoading(false)
    }
  }

  const field = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-muted transition-colors'
  const lbl   = 'block text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-2xl w-full max-w-[480px]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FFF3E8] dark:bg-[#2D1F0A] flex items-center justify-center">
              <Store size={13} strokeWidth={2} className="text-accent" />
            </div>
            <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Add Vendor</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body transition-colors">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={lbl}>Vendor / Company Name <span className="text-[#dc2626]">*</span></label>
            <input type="text" placeholder="e.g. Kumar Carpentry Works"
              value={form.name} onChange={e => set('name', e.target.value)}
              className={`${field} ${errors.name ? 'border-[#dc2626]' : ''}`} />
            {errors.name && <p className="text-[11px] text-[#dc2626] mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Trade <span className="text-[#dc2626]">*</span></label>
              <select value={form.trade} onChange={e => set('trade', e.target.value)}
                className={`${field} ${errors.trade ? 'border-[#dc2626]' : ''}`}>
                <option value="">— Select trade —</option>
                {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.trade && <p className="text-[11px] text-[#dc2626] mt-1">{errors.trade}</p>}
            </div>
            <div>
              <label className={lbl}>Initial Rating</label>
              <div className="space-y-1.5">
                <input type="range" min="1" max="5" step="0.5"
                  value={form.rating} onChange={e => set('rating', e.target.value)}
                  className="w-full accent-[#F59E0B]" />
                <div className="flex items-center justify-between">
                  <StarRating rating={parseFloat(form.rating)} animate={false} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Contact Number <span className="text-[#dc2626]">*</span></label>
              <input type="tel" placeholder="+91 00000 00000"
                value={form.contact} onChange={e => set('contact', e.target.value)}
                className={`${field} ${errors.contact ? 'border-[#dc2626]' : ''}`} />
              {errors.contact && <p className="text-[11px] text-[#dc2626] mt-1">{errors.contact}</p>}
            </div>
            <div>
              <label className={lbl}>Email <span className="text-muted font-normal normal-case">(optional)</span></label>
              <input type="email" placeholder="vendor@email.com"
                value={form.email} onChange={e => set('email', e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <label className={lbl}>Notes <span className="text-muted font-normal normal-case">(optional)</span></label>
            <textarea rows={3} placeholder="Any notes about work quality, terms, etc."
              value={form.notes} onChange={e => set('notes', e.target.value)}
              className={`${field} resize-none`} />
          </div>

          {apiError && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] px-3 py-2 rounded-xl">{apiError}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-xl transition-colors disabled:opacity-60">
              {loading ? <><Loader2 size={13} className="animate-spin" /> Adding…</> : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main VendorsPage ──────────────────────────────────────────────────────────
export default function VendorsPage() {
  const [vendors,    setVendors]    = useState([])
  useEffect(() => { getVendors().then(d => setVendors(d.map(normalizeVendor))).catch(console.error) }, [])
  const [search,     setSearch]     = useState('')
  const [tradeFilter, setTradeFilter] = useState('all')
  const [sortKey,    setSortKey]    = useState('name')
  const [sortDir,    setSortDir]    = useState('asc')
  const [showModal,  setShowModal]  = useState(false)

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const allTrades = useMemo(() => ['all', ...new Set(vendors.map(v => v.trade))], [vendors])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return vendors
      .filter(v =>
        (tradeFilter === 'all' || v.trade === tradeFilter) &&
        (v.name.toLowerCase().includes(q) ||
          v.trade.toLowerCase().includes(q) ||
          v.contact.includes(q))
      )
      .sort((a, b) => {
        const av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
        if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      })
  }, [vendors, search, tradeFilter, sortKey, sortDir])

  const totalOutstanding = vendors.reduce((s, v) => s + v.paymentOutstanding, 0)
  const avgRating        = vendors.length ? (vendors.reduce((s, v) => s + v.rating, 0) / vendors.length).toFixed(1) : '0'
  const totalProjects    = vendors.reduce((s, v) => s + v.usedProjects, 0)

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronDown size={12} className="text-muted/40" />
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />
  }

  const KPI_CARDS = [
    { label: 'Total Vendors',      value: vendors.length,    icon: Store,          color: 'text-primary',   bg: 'bg-light-blue/60 dark:bg-[#1B2D4A]' },
    { label: 'Total Projects Used', value: totalProjects,    icon: FolderKanban,   color: 'text-[#15803d]', bg: 'bg-[#F0FDF4] dark:bg-[#0A2318]'     },
    { label: 'Avg Rating',         value: `${avgRating}/5`,  icon: null,           color: '',               bg: 'bg-[#FFFBEA] dark:bg-[#2D2A00]'     },
    { label: 'Payment Outstanding', value: totalOutstanding > 0 ? `₹${(totalOutstanding / 1000).toFixed(0)}k` : '₹0', icon: IndianRupee, color: totalOutstanding > 0 ? 'text-[#dc2626]' : 'text-[#15803d]', bg: totalOutstanding > 0 ? 'bg-[#FEF2F2] dark:bg-[#2D0808]' : 'bg-[#F0FDF4] dark:bg-[#0A2318]' },
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sora text-[20px] font-bold text-body dark:text-white leading-tight">Vendors</h2>
          <p className="text-[13px] text-muted dark:text-slate-400 mt-0.5">Contractors, suppliers & service partners</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-xl transition-colors shadow-sm">
          <Plus size={15} strokeWidth={2.5} /> Add Vendor
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-5 py-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
              {label === 'Avg Rating' ? (
                <svg viewBox="0 0 20 20" className="w-5 h-5">
                  <style>{`@keyframes kpiGlow { 0%,100% { filter:drop-shadow(0 0 2px #F59E0B88); } 50% { filter:drop-shadow(0 0 8px #F59E0BCC); } }`}</style>
                  <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7"
                    fill="#F59E0B" style={{ animation: 'kpiGlow 2s ease-in-out infinite' }} />
                </svg>
              ) : Icon ? (
                <Icon size={18} strokeWidth={1.75} className={color} />
              ) : null}
            </div>
            <div>
              <p className="text-[11px] text-muted dark:text-slate-500 uppercase tracking-wider">{label}</p>
              <p className={`font-sora font-bold text-[20px] leading-tight ${label === 'Payment Outstanding' ? color : 'text-body dark:text-white'}`}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input type="text" placeholder="Search vendors…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-[12px] bg-[#F7F9FC] dark:bg-[#0F1219] border border-[#EFEFEF] dark:border-[#1F2937] rounded-lg focus:outline-none focus:border-primary text-body dark:text-slate-200 placeholder:text-muted transition-colors" />
            </div>

            {/* Trade filter pills */}
            <div className="flex gap-1.5 flex-wrap">
              {allTrades.map(t => (
                <button key={t} onClick={() => setTradeFilter(t)}
                  className={[
                    'text-[11px] font-medium px-2.5 py-1 rounded-lg capitalize transition-colors',
                    tradeFilter === t
                      ? 'bg-primary text-white'
                      : 'bg-[#F7F9FC] dark:bg-[#0F1219] text-muted hover:text-body dark:hover:text-slate-300 border border-[#EFEFEF] dark:border-[#1F2937]',
                  ].join(' ')}>
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] text-muted">Sort:</span>
            <select value={sortKey} onChange={e => setSortKey(e.target.value)}
              className="text-[12px] text-body dark:text-slate-200 bg-[#F7F9FC] dark:bg-[#0F1219] border border-[#EFEFEF] dark:border-[#1F2937] rounded-lg px-2.5 py-1.5 focus:outline-none">
              <option value="name">Name</option>
              <option value="rating">Rating</option>
              <option value="usedProjects">Projects Used</option>
              <option value="paymentOutstanding">Outstanding</option>
            </select>
            <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 rounded-lg border border-[#EFEFEF] dark:border-[#1F2937] text-muted hover:text-primary hover:border-primary transition-colors">
              {sortDir === 'asc' ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F7F9FC] dark:bg-[#0F1219]">
                {[
                  { label: 'Vendor',              col: 'name'               },
                  { label: 'Trade',               col: null                 },
                  { label: 'Rating',              col: 'rating'             },
                  { label: 'Projects Used',       col: 'usedProjects'       },
                  { label: 'Payment Outstanding', col: 'paymentOutstanding' },
                ].map(({ label, col }) => (
                  <th key={label}
                    onClick={() => col && toggleSort(col)}
                    className={`text-left text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-wider px-5 py-3 ${col ? 'cursor-pointer select-none hover:text-body dark:hover:text-slate-300 transition-colors' : ''}`}>
                    <div className="flex items-center gap-1">
                      {label}
                      {col && <SortIcon col={col} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-[13px] text-muted dark:text-slate-500 py-12">
                    No vendors found
                  </td>
                </tr>
              ) : filtered.map((v, idx) => {
                const tc = tradeCfg(v.trade)
                return (
                  <tr key={v.id}
                    className={`border-t border-[#F4F4F4] dark:border-[#1A2236] hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] transition-colors ${idx % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : ''}`}>

                    {/* Vendor */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FFF3E8] dark:bg-[#2D1F0A] flex items-center justify-center shrink-0">
                          <Store size={15} strokeWidth={1.75} className="text-accent" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-body dark:text-slate-200">{v.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <a href={`tel:${v.contact}`}
                              className="flex items-center gap-1 text-[11px] text-muted dark:text-slate-400 hover:text-primary transition-colors">
                              <Phone size={9}/> {v.contact}
                            </a>
                            {v.email && (
                              <a href={`mailto:${v.email}`}
                                className="flex items-center gap-1 text-[11px] text-muted dark:text-slate-400 hover:text-primary transition-colors">
                                <Mail size={9}/> {v.email}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Trade */}
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${tc.bg} ${tc.text}`}>
                        {v.trade}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-4">
                      <StarRating rating={v.rating} />
                    </td>

                    {/* Projects Used */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <FolderKanban size={13} strokeWidth={1.75} className="text-muted" />
                        <span className="text-[13px] font-semibold text-body dark:text-slate-200">{v.usedProjects}</span>
                        <span className="text-[11px] text-muted">project{v.usedProjects !== 1 ? 's' : ''}</span>
                      </div>
                    </td>

                    {/* Payment Outstanding */}
                    <td className="px-5 py-4">
                      {v.paymentOutstanding > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-[#FEF2F2] dark:bg-[#2D0808] rounded-lg">
                            <AlertTriangle size={11} className="text-[#dc2626]" />
                            <span className="text-[12px] font-semibold text-[#dc2626]">
                              ₹{v.paymentOutstanding.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[12px] font-semibold text-[#15803d] bg-[#F0FDF4] dark:bg-[#0A2318] px-2.5 py-1 rounded-lg">
                          Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-[#F0F2F5] dark:border-[#1F2937] text-[11px] text-muted dark:text-slate-500">
            Showing {filtered.length} of {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
            {totalOutstanding > 0 && (
              <span className="ml-3 text-[#dc2626] font-medium">
                · ₹{totalOutstanding.toLocaleString('en-IN')} total outstanding
              </span>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <AddVendorModal
          onClose={() => setShowModal(false)}
          onAdd={v => setVendors(p => [...p, v])}
        />
      )}
    </div>
  )
}
