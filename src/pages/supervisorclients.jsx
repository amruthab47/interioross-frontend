import { useState, useMemo, useEffect } from 'react'
import { Search, Phone, Mail, MapPin, FolderKanban, ChevronUp, ChevronDown, User, Lock } from 'lucide-react'
import { getClients } from '../api/clients'

function normalizeClient(c) {
  return { ...c, id: c._id, activeProjects: c.activeProjects ?? 0, totalValue: Math.round((c.totalValuePaise ?? 0) / 100) }
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysSince(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

const SORT_OPTIONS = [
  { value: 'name',        label: 'Name'            },
  { value: 'lastContact', label: 'Last Contact'    },
  { value: 'activeCount', label: 'Active Projects' },
]

export default function SupervisorClients() {
  const [clients,  setClients]  = useState([])
  const [search,   setSearch]   = useState('')
  const [sortKey,  setSortKey]  = useState('name')
  const [sortDir,  setSortDir]  = useState('asc')

  useEffect(() => { getClients().then(d => setClients(d.map(normalizeClient))).catch(console.error) }, [])

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

  const totalActive = clients.reduce((s, c) => s + (c.activeProjects ?? 0), 0)

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronDown size={12} className="text-muted/40" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-primary" />
      : <ChevronDown size={12} className="text-primary" />
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sora text-[20px] font-bold text-body dark:text-white leading-tight">Clients</h2>
          <p className="text-[13px] text-muted dark:text-slate-400 mt-0.5">Project client directory — view only</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F7F9FC] dark:bg-[#1A2236] border border-[#EFEFEF] dark:border-[#1F2937] rounded-xl text-muted">
          <Lock size={13} strokeWidth={2} />
          <span className="text-[12px] font-medium">View only — contact admin to add clients</span>
        </div>
      </div>

      {/* KPI cards — no financial data */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-light-blue/60 dark:bg-[#1B2D4A] flex items-center justify-center shrink-0">
            <User size={18} strokeWidth={1.75} className="text-primary" />
          </div>
          <div>
            <p className="text-[11px] text-muted dark:text-slate-500 uppercase tracking-wider">Total Clients</p>
            <p className="font-sora font-bold text-[20px] text-body dark:text-white leading-tight">{clients.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] dark:bg-[#0A2318] flex items-center justify-center shrink-0">
            <FolderKanban size={18} strokeWidth={1.75} className="text-[#15803d]" />
          </div>
          <div>
            <p className="text-[11px] text-muted dark:text-slate-500 uppercase tracking-wider">Active Projects</p>
            <p className="font-sora font-bold text-[20px] text-body dark:text-white leading-tight">{totalActive}</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
          <div className="relative w-72">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search clients by name, phone, city…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[12px] bg-[#F7F9FC] dark:bg-[#0F1219] border border-[#EFEFEF] dark:border-[#1F2937] rounded-lg focus:outline-none focus:border-primary text-body dark:text-slate-200 placeholder:text-muted transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted">Sort:</span>
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
              className="text-[12px] text-body dark:text-slate-200 bg-[#F7F9FC] dark:bg-[#0F1219] border border-[#EFEFEF] dark:border-[#1F2937] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 rounded-lg border border-[#EFEFEF] dark:border-[#1F2937] text-muted hover:text-primary hover:border-primary transition-colors"
            >
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
                  { label: 'Contact',         col: null          },
                  { label: 'Active Projects', col: 'activeCount' },
                  { label: 'Last Contact',    col: 'lastContact' },
                ].map(({ label, col }) => (
                  <th
                    key={label}
                    onClick={() => col && toggleSort(col)}
                    className={`text-left text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-wider px-5 py-3 ${col ? 'cursor-pointer select-none hover:text-body dark:hover:text-slate-300 transition-colors' : ''}`}
                  >
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
                  <td colSpan={4} className="text-center text-[13px] text-muted dark:text-slate-500 py-12">
                    No clients found
                  </td>
                </tr>
              ) : filtered.map((c, idx) => (
                <tr
                  key={c.id}
                  className={`border-t border-[#F4F4F4] dark:border-[#1A2236] hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] transition-colors ${idx % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : ''}`}
                >
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

                  {/* Contact */}
                  <td className="px-5 py-4">
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-[12px] text-body dark:text-slate-300 hover:text-primary transition-colors">
                      <Phone size={11} strokeWidth={1.75} className="text-muted" /> {c.phone}
                    </a>
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-[11px] text-muted dark:text-slate-500 hover:text-primary transition-colors mt-0.5">
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
    </div>
  )
}
