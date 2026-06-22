import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, X, Phone, Mail, MapPin, FolderKanban, IndianRupee, ChevronUp, ChevronDown, User, Loader2 } from 'lucide-react'
import { getClients, createClient } from '../api/clients'

function normalizeClient(c) {
  const activeProjects = Array.isArray(c.activeProjects)
    ? c.activeProjects.length
    : (c.activeProjects ?? 0)
  return { ...c, id: c._id, activeProjects, totalValue: Math.round((c.totalValuePaise ?? 0) / 100) }
}

function fmt(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`
  return `₹${(n / 1000).toFixed(0)}k`
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysSince(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

const SORT_OPTIONS = [
  { value: 'name',         label: 'Name'            },
  { value: 'totalValue',   label: 'Project Value'   },
  { value: 'lastContact',  label: 'Last Contact'    },
  { value: 'activeCount',  label: 'Active Projects' },
]

function AddClientModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function validate() {
    const e = {}
    if (!form.name.trim())  e.name  = 'Client name is required'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setApiError('')
    setLoading(true)
    try {
      const saved = await createClient({
        name:        form.name.trim(),
        phone:       form.phone.trim(),
        email:       form.email.trim(),
        city:        form.city.trim(),
        lastContact: new Date().toISOString().slice(0, 10),
      })
      onAdd(normalizeClient(saved))
      onClose()
    } catch (err) {
      setApiError(err.message || 'Failed to add client')
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
            <div className="w-7 h-7 rounded-lg bg-light-blue/60 dark:bg-[#1B2D4A] flex items-center justify-center">
              <User size={13} strokeWidth={2} className="text-primary dark:text-[#5B9BD5]" />
            </div>
            <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Add Client</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body transition-colors">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={lbl}>Client Name <span className="text-[#dc2626]">*</span></label>
            <input type="text" placeholder="Full name or company name"
              value={form.name} onChange={e => set('name', e.target.value)}
              className={`${field} ${errors.name ? 'border-[#dc2626]' : ''}`} />
            {errors.name && <p className="text-[11px] text-[#dc2626] mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Phone <span className="text-[#dc2626]">*</span></label>
              <input type="tel" placeholder="+91 00000 00000"
                value={form.phone} onChange={e => set('phone', e.target.value)}
                className={`${field} ${errors.phone ? 'border-[#dc2626]' : ''}`} />
              {errors.phone && <p className="text-[11px] text-[#dc2626] mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className={lbl}>Email <span className="text-muted font-normal normal-case">(optional)</span></label>
              <input type="email" placeholder="email@example.com"
                value={form.email} onChange={e => set('email', e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <label className={lbl}>City / Area</label>
            <input type="text" placeholder="e.g. Coimbatore, RS Puram"
              value={form.city} onChange={e => set('city', e.target.value)} className={field} />
          </div>

          <div>
            <label className={lbl}>Notes <span className="text-muted font-normal normal-case">(optional)</span></label>
            <textarea rows={3} placeholder="Any additional notes about this client…"
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
              {loading ? <><Loader2 size={13} className="animate-spin" /> Adding…</> : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const [clients, setClients]     = useState([])
  useEffect(() => { getClients().then(d => setClients(d.map(normalizeClient))).catch(console.error) }, [])
  const [search,  setSearch]      = useState('')
  const [sortKey, setSortKey]     = useState('name')
  const [sortDir, setSortDir]     = useState('asc')
  const [showModal, setShowModal] = useState(false)

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clients
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.city ?? '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        let av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
        if (sortKey === 'activeCount') { av = a.activeProjects ?? 0; bv = b.activeProjects ?? 0 }
        if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      })
  }, [clients, search, sortKey, sortDir])

  const totalValue     = clients.reduce((s, c) => s + c.totalValue, 0)
  const totalActive    = clients.reduce((s, c) => s + (c.activeProjects ?? 0), 0)
  const avgValue       = clients.length ? Math.round(totalValue / clients.length) : 0

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronDown size={12} className="text-muted/40" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-primary" />
      : <ChevronDown size={12} className="text-primary" />
  }

  const KPI_CARDS = [
    { label: 'Total Clients',    value: clients.length,   icon: User,         color: 'text-primary',     bg: 'bg-light-blue/60 dark:bg-[#1B2D4A]'  },
    { label: 'Active Projects',  value: totalActive,      icon: FolderKanban, color: 'text-[#15803d]',   bg: 'bg-[#F0FDF4] dark:bg-[#0A2318]'      },
    { label: 'Total Portfolio',  value: fmt(totalValue),  icon: IndianRupee,  color: 'text-accent',      bg: 'bg-[#FFF3E8] dark:bg-[#2D1F0A]'      },
    { label: 'Avg Project Value',value: fmt(avgValue),    icon: IndianRupee,  color: 'text-[#7C3AED]',   bg: 'bg-[#F5F3FF] dark:bg-[#1A0E3A]'      },
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sora text-[20px] font-bold text-body dark:text-white leading-tight">Clients</h2>
          <p className="text-[13px] text-muted dark:text-slate-400 mt-0.5">Manage your client relationships</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-xl transition-colors shadow-sm">
          <Plus size={15} strokeWidth={2.5} /> Add Client
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-5 py-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
              <Icon size={18} strokeWidth={1.75} className={color} />
            </div>
            <div>
              <p className="text-[11px] text-muted dark:text-slate-500 uppercase tracking-wider">{label}</p>
              <p className="font-sora font-bold text-[20px] text-body dark:text-white leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
          <div className="relative w-72">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input type="text" placeholder="Search clients by name, phone, city…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[12px] bg-[#F7F9FC] dark:bg-[#0F1219] border border-[#EFEFEF] dark:border-[#1F2937] rounded-lg focus:outline-none focus:border-primary text-body dark:text-slate-200 placeholder:text-muted transition-colors" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted">Sort:</span>
            <select value={sortKey} onChange={e => setSortKey(e.target.value)}
              className="text-[12px] text-body dark:text-slate-200 bg-[#F7F9FC] dark:bg-[#0F1219] border border-[#EFEFEF] dark:border-[#1F2937] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                  { label: 'Client',          col: 'name'        },
                  { label: 'Phone',           col: null          },
                  { label: 'Active Projects', col: 'activeCount' },
                  { label: 'Total Value',     col: 'totalValue'  },
                  { label: 'Last Contact',    col: 'lastContact' },
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
                    No clients found
                  </td>
                </tr>
              ) : filtered.map((c, idx) => (
                <tr key={c.id}
                  className={`border-t border-[#F4F4F4] dark:border-[#1A2236] hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] transition-colors ${idx % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : ''}`}>

                  {/* Client */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-light-blue dark:bg-[#1B2D4A] flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-primary dark:text-[#5B9BD5]">
                          {c.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-body dark:text-slate-200">{c.name}</p>
                        {c.city && (
                          <p className="flex items-center gap-1 text-[11px] text-muted dark:text-slate-400 mt-0.5">
                            <MapPin size={9} /> {c.city}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-5 py-4">
                    <a href={`tel:${c.phone}`}
                      className="flex items-center gap-1.5 text-[12px] text-body dark:text-slate-300 hover:text-primary transition-colors">
                      <Phone size={11} strokeWidth={1.75} className="text-muted" /> {c.phone}
                    </a>
                    {c.email && (
                      <a href={`mailto:${c.email}`}
                        className="flex items-center gap-1.5 text-[11px] text-muted dark:text-slate-500 hover:text-primary transition-colors mt-0.5">
                        <Mail size={9} strokeWidth={1.75} /> {c.email}
                      </a>
                    )}
                  </td>

                  {/* Active Projects */}
                  <td className="px-5 py-4">
                    {!c.activeProjects ? (
                      <span className="text-[12px] text-muted dark:text-slate-500">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold bg-light-blue/60 dark:bg-[#1B2D4A] text-primary dark:text-[#5B9BD5] px-2.5 py-1 rounded-lg">
                        <FolderKanban size={11} /> {c.activeProjects} project{c.activeProjects !== 1 ? 's' : ''}
                      </span>
                    )}
                  </td>

                  {/* Total Value */}
                  <td className="px-5 py-4">
                    <span className="text-[13px] font-semibold text-body dark:text-slate-200">
                      {c.totalValue > 0 ? fmt(c.totalValue) : '—'}
                    </span>
                    {c.totalValue > 0 && (
                      <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">
                        ₹{c.totalValue.toLocaleString('en-IN')}
                      </p>
                    )}
                  </td>

                  {/* Last Contact */}
                  <td className="px-5 py-4">
                    <p className="text-[12px] font-medium text-body dark:text-slate-300">{fmtDate(c.lastContact)}</p>
                    <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">{daysSince(c.lastContact)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-[#F0F2F5] dark:border-[#1F2937] text-[11px] text-muted dark:text-slate-500">
            Showing {filtered.length} of {clients.length} client{clients.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {showModal && (
        <AddClientModal
          onClose={() => setShowModal(false)}
          onAdd={c => setClients(p => [...p, c])}
        />
      )}
    </div>
  )
}
