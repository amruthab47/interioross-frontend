import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  Lock, TrendingUp, TrendingDown, IndianRupee, AlertTriangle,
  Plus, Search, ChevronLeft, ChevronRight, X, Trash2, FileText, BookOpen, CreditCard, Upload,
  Banknote, Users, CheckCircle2, Clock, RefreshCw, ChevronDown, ChevronUp,
  Smartphone, Calendar,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { getProjects } from '../api/projects'
import { getFinanceSummary, getInvoices, createInvoice, getQuotations, createQuotation, getPayments, getMilestones, getFinancePnL } from '../api/finance'
import { getClients } from '../api/clients'
import { getExpenseBreakdown } from '../api/analytics'
import { getPayroll, generatePayroll, recordPayment, updatePayroll } from '../api/payroll'
import { projectToRow, formatINR } from '../utils/format'
import FileUploadZone from '../components/FileUploadZone'

const fmtINR = n => `₹${Math.abs(n).toLocaleString('en-IN')}`
const PAGE_SIZE = 6

const TABS = [
  { id: 'overview',   label: 'Overview',    Icon: TrendingUp  },
  { id: 'invoices',   label: 'Invoices',    Icon: FileText    },
  { id: 'quotations', label: 'Quotations',  Icon: BookOpen    },
  { id: 'payments',   label: 'Payments',    Icon: CreditCard  },
  { id: 'payroll',    label: 'Payroll',     Icon: Banknote    },
]

const INVOICE_STATUS = {
  Paid:    { cls: 'bg-[#F0FDF4] dark:bg-[#0A2318] text-[#15803d] dark:text-[#22c55e]', dot: 'bg-[#15803d]' },
  Pending: { cls: 'bg-[#FFF3E8] dark:bg-[#2D1F0A] text-accent',                        dot: 'bg-accent'     },
  Overdue: { cls: 'bg-[#FEF2F2] dark:bg-[#2D0808] text-[#dc2626]',                     dot: 'bg-[#dc2626]'  },
}
const QUOT_STATUS = {
  Sent:     { cls: 'bg-light-blue/60 dark:bg-[#1B2D4A] text-primary dark:text-[#5B9BD5]', dot: 'bg-primary'    },
  Approved: { cls: 'bg-[#F0FDF4] dark:bg-[#0A2318] text-[#15803d] dark:text-[#22c55e]',  dot: 'bg-[#15803d]'  },
  Rejected: { cls: 'bg-[#FEF2F2] dark:bg-[#2D0808] text-[#dc2626]',                       dot: 'bg-[#dc2626]'  },
}
const PAY_STATUS = {
  Cleared: { cls: 'bg-[#F0FDF4] dark:bg-[#0A2318] text-[#15803d] dark:text-[#22c55e]', dot: 'bg-[#15803d]' },
  Pending: { cls: 'bg-[#FFF3E8] dark:bg-[#2D1F0A] text-accent',                         dot: 'bg-accent'     },
  Overdue: { cls: 'bg-[#FEF2F2] dark:bg-[#2D0808] text-[#dc2626]',                      dot: 'bg-[#dc2626]'  },
}

function Badge({ status, cfg }) {
  const st = cfg[status]
  if (!st) return <span className="text-[11px] text-muted dark:text-slate-500">—</span>
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${st.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {status}
    </span>
  )
}

function TableControls({ search, onSearch, statusFilter, onStatus, sortKey, onSort, statuses, sortOptions }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input type="text" placeholder="Search…" value={search} onChange={e => onSearch(e.target.value)}
          className="pl-8 pr-3 py-2 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-muted w-44 transition-colors" />
      </div>
      <div className="flex gap-1">
        {statuses.map(s => (
          <button key={s} onClick={() => onStatus(s)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all ${statusFilter === s ? 'bg-navy text-white dark:bg-primary' : 'text-muted dark:text-slate-400 hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body dark:hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>
      <select value={sortKey} onChange={e => onSort(e.target.value)}
        className="px-3 py-2 text-[12px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] transition-colors">
        {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function Pagination({ page, total, onPage }) {
  if (total <= 1) return null
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#F0F2F5] dark:border-[#1F2937]">
      <p className="text-[12px] text-muted dark:text-slate-500">Page {page} of {total}</p>
      <div className="flex gap-1">
        <button onClick={() => onPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body dark:hover:text-white disabled:opacity-30 transition-colors">
          <ChevronLeft size={14} strokeWidth={2} />
        </button>
        {Array.from({ length: total }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => onPage(n)}
            className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-colors ${page === n ? 'bg-navy text-white dark:bg-primary' : 'text-muted dark:text-slate-400 hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body dark:hover:text-white'}`}>
            {n}
          </button>
        ))}
        <button onClick={() => onPage(p => Math.min(total, p + 1))} disabled={page === total}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body dark:hover:text-white disabled:opacity-30 transition-colors">
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

/* ── Generate Invoice Modal ─────────────────────────── */
function InvoiceModal({ onClose, onCreated, projects = [], clients = [] }) {
  const [form, setForm] = useState({
    clientId: '', projectId: '', invoiceDate: '', dueDate: '', terms: 'Net 30', notes: '',
  })
  const [items, setItems] = useState([{ desc: '', qty: 1, rate: '' }])
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function setItem(i, k, v) {
    setItems(arr => arr.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  }
  function addItem()    { setItems(a => [...a, { desc: '', qty: 1, rate: '' }]) }
  function removeItem(i){ setItems(a => a.filter((_, idx) => idx !== i)) }

  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0)
  const gst      = Math.round(subtotal * 0.18)
  const total    = subtotal + gst

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.clientId || !form.projectId) { setApiError('Select a client and project'); return }
    setApiError('')
    setLoading(true)
    try {
      const invoiceNumber = `INV-2026-${Date.now().toString().slice(-4)}`
      const saved = await createInvoice({
        invoiceNumber,
        clientId:    form.clientId,
        projectId:   form.projectId,
        amountPaise: total * 100,
        issueDate:   form.invoiceDate || new Date().toISOString().slice(0, 10),
        dueDate:     form.dueDate || '',
        status:      'Pending',
      })
      onCreated(normalizeInvoice(saved))
      onClose()
    } catch (err) {
      setApiError(err.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const field = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-muted transition-colors'
  const lbl   = 'block text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-2xl w-full max-w-[640px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF] dark:border-[#1F2937] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-light-blue/60 dark:bg-[#1B2D4A] flex items-center justify-center">
              <FileText size={14} strokeWidth={2} className="text-primary dark:text-[#5B9BD5]" />
            </div>
            <h3 className="font-sora font-semibold text-[15px] text-body dark:text-white">Generate Invoice</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] transition-colors">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Client <span className="text-[#dc2626]">*</span></label>
                <select required value={form.clientId} onChange={e => set('clientId', e.target.value)} className={field}>
                  <option value="">— Select client —</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Project <span className="text-[#dc2626]">*</span></label>
                <select required value={form.projectId} onChange={e => set('projectId', e.target.value)} className={field}>
                  <option value="">— Select project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={lbl}>Invoice Date</label>
                <input type="date" value={form.invoiceDate} onChange={e => set('invoiceDate', e.target.value)} className={field} />
              </div>
              <div>
                <label className={lbl}>Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} className={field} />
              </div>
              <div>
                <label className={lbl}>Payment Terms</label>
                <select value={form.terms} onChange={e => set('terms', e.target.value)} className={field}>
                  {['Net 15','Net 30','Net 45','On Delivery','Advance'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={lbl + ' mb-0'}>Line Items</label>
                <button type="button" onClick={addItem}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary dark:text-[#5B9BD5] hover:text-mid-blue transition-colors">
                  <Plus size={11} strokeWidth={2.5} /> Add row
                </button>
              </div>
              <div className="border border-[#EFEFEF] dark:border-[#2A3547] rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_80px_100px_90px_32px] bg-navy">
                  {['Description','Qty','Rate','Amount',''].map((h, i) => (
                    <div key={i} className="px-3 py-2 text-[10px] font-semibold text-white uppercase tracking-widest">{h}</div>
                  ))}
                </div>
                {items.map((it, i) => {
                  const amt = (Number(it.qty) || 0) * (Number(it.rate) || 0)
                  return (
                    <div key={i} className={`grid grid-cols-[1fr_80px_100px_90px_32px] ${i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : ''}`}>
                      <input type="text" placeholder="Description" value={it.desc} onChange={e => setItem(i, 'desc', e.target.value)}
                        className="px-3 py-2 text-[13px] text-body dark:text-slate-200 bg-transparent border-0 border-b border-[#EFEFEF] dark:border-[#2A3547] focus:outline-none focus:bg-light-blue/10 transition-colors placeholder:text-muted" />
                      <input type="number" min="1" value={it.qty} onChange={e => setItem(i, 'qty', e.target.value)}
                        className="px-3 py-2 text-[13px] text-body dark:text-slate-200 bg-transparent border-0 border-b border-l border-[#EFEFEF] dark:border-[#2A3547] focus:outline-none focus:bg-light-blue/10 transition-colors text-right" />
                      <input type="number" min="0" placeholder="0" value={it.rate} onChange={e => setItem(i, 'rate', e.target.value)}
                        className="px-3 py-2 text-[13px] text-body dark:text-slate-200 bg-transparent border-0 border-b border-l border-[#EFEFEF] dark:border-[#2A3547] focus:outline-none focus:bg-light-blue/10 transition-colors text-right" />
                      <div className="px-3 py-2 text-[13px] font-medium text-body dark:text-slate-200 border-b border-l border-[#EFEFEF] dark:border-[#2A3547] text-right">
                        {amt > 0 ? fmtINR(amt) : '—'}
                      </div>
                      <div className="flex items-center justify-center border-b border-l border-[#EFEFEF] dark:border-[#2A3547]">
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)}
                            className="text-muted hover:text-[#dc2626] transition-colors p-1">
                            <Trash2 size={12} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 space-y-1 text-right">
                <p className="text-[12px] text-muted dark:text-slate-400">Subtotal: <span className="font-semibold text-body dark:text-white">{fmtINR(subtotal)}</span></p>
                <p className="text-[12px] text-muted dark:text-slate-400">GST 18%: <span className="font-semibold text-body dark:text-white">{fmtINR(gst)}</span></p>
                <p className="text-[14px] font-bold text-body dark:text-white">Total: {fmtINR(total)}</p>
              </div>
            </div>

            <div>
              <label className={lbl}>Notes <span className="text-muted font-normal normal-case">(optional)</span></label>
              <textarea rows={2} placeholder="Payment instructions, terms, or notes…" value={form.notes} onChange={e => set('notes', e.target.value)}
                className={`${field} resize-none`} />
            </div>

          </div>

          <div className="px-6 pb-2 shrink-0">
            {apiError && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] px-3 py-2 rounded-xl">{apiError}</p>}
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-[#F0F2F5] dark:border-[#1F2937] shrink-0">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-xl transition-colors disabled:opacity-60">
              {loading ? <><Loader2 size={13} className="animate-spin" /> Creating…</> : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Generate Quotation Modal ───────────────────────── */
function QuotationModal({ onClose, onCreated, projects = [], clients = [] }) {
  const [form, setForm] = useState({ clientId: '', projectId: '', quoteDate: '', validUntil: '', notes: '' })
  const [items, setItems] = useState([{ desc: '', qty: 1, rate: '' }])
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  function setItem(i, k, v) { setItems(arr => arr.map((it, idx) => idx === i ? { ...it, [k]: v } : it)) }
  function addItem()    { setItems(a => [...a, { desc: '', qty: 1, rate: '' }]) }
  function removeItem(i){ setItems(a => a.filter((_, idx) => idx !== i)) }
  const total = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.clientId || !form.projectId) { setApiError('Select a client and project'); return }
    setApiError('')
    setLoading(true)
    try {
      const quotationNumber = `Q-2026-${Date.now().toString().slice(-4)}`
      const saved = await createQuotation({
        quotationNumber,
        clientId:    form.clientId,
        projectId:   form.projectId,
        amountPaise: total * 100,
        issueDate:   form.quoteDate || new Date().toISOString().slice(0, 10),
        validUntil:  form.validUntil || '',
        status:      'Sent',
      })
      onCreated(normalizeQuotation(saved))
      onClose()
    } catch (err) {
      setApiError(err.message || 'Failed to create quotation')
    } finally {
      setLoading(false)
    }
  }

  const field = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-muted transition-colors'
  const lbl   = 'block text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-2xl w-full max-w-[620px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF] dark:border-[#1F2937] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FFF3E8] dark:bg-[#2D1F0A] flex items-center justify-center">
              <BookOpen size={14} strokeWidth={2} className="text-accent" />
            </div>
            <h3 className="font-sora font-semibold text-[15px] text-body dark:text-white">Generate Quotation</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] transition-colors">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Client <span className="text-[#dc2626]">*</span></label>
                <select required value={form.clientId} onChange={e => set('clientId', e.target.value)} className={field}>
                  <option value="">— Select client —</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Project <span className="text-[#dc2626]">*</span></label>
                <select required value={form.projectId} onChange={e => set('projectId', e.target.value)} className={field}>
                  <option value="">— Select project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Quote Date</label>
                <input type="date" value={form.quoteDate} onChange={e => set('quoteDate', e.target.value)} className={field} />
              </div>
              <div>
                <label className={lbl}>Valid Until</label>
                <input type="date" value={form.validUntil} onChange={e => set('validUntil', e.target.value)} className={field} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={lbl + ' mb-0'}>Line Items</label>
                <button type="button" onClick={addItem} className="flex items-center gap-1 text-[11px] font-semibold text-primary dark:text-[#5B9BD5] hover:text-mid-blue transition-colors">
                  <Plus size={11} strokeWidth={2.5} /> Add row
                </button>
              </div>
              <div className="border border-[#EFEFEF] dark:border-[#2A3547] rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_80px_100px_90px_32px] bg-navy">
                  {['Description','Qty','Rate','Amount',''].map((h, i) => (
                    <div key={i} className="px-3 py-2 text-[10px] font-semibold text-white uppercase tracking-widest">{h}</div>
                  ))}
                </div>
                {items.map((it, i) => {
                  const amt = (Number(it.qty) || 0) * (Number(it.rate) || 0)
                  return (
                    <div key={i} className={`grid grid-cols-[1fr_80px_100px_90px_32px] ${i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : ''}`}>
                      <input type="text" placeholder="Description" value={it.desc} onChange={e => setItem(i, 'desc', e.target.value)}
                        className="px-3 py-2 text-[13px] text-body dark:text-slate-200 bg-transparent border-0 border-b border-[#EFEFEF] dark:border-[#2A3547] focus:outline-none placeholder:text-muted" />
                      <input type="number" min="1" value={it.qty} onChange={e => setItem(i, 'qty', e.target.value)}
                        className="px-3 py-2 text-[13px] text-body dark:text-slate-200 bg-transparent border-0 border-b border-l border-[#EFEFEF] dark:border-[#2A3547] focus:outline-none text-right" />
                      <input type="number" min="0" placeholder="0" value={it.rate} onChange={e => setItem(i, 'rate', e.target.value)}
                        className="px-3 py-2 text-[13px] text-body dark:text-slate-200 bg-transparent border-0 border-b border-l border-[#EFEFEF] dark:border-[#2A3547] focus:outline-none text-right" />
                      <div className="px-3 py-2 text-[13px] font-medium text-body dark:text-slate-200 border-b border-l border-[#EFEFEF] dark:border-[#2A3547] text-right">
                        {amt > 0 ? fmtINR(amt) : '—'}
                      </div>
                      <div className="flex items-center justify-center border-b border-l border-[#EFEFEF] dark:border-[#2A3547]">
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)} className="text-muted hover:text-[#dc2626] transition-colors p-1">
                            <Trash2 size={12} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-[14px] font-bold text-body dark:text-white text-right mt-2">Total: {fmtINR(total)}</p>
            </div>

            <div>
              <label className={lbl}>Notes <span className="text-muted font-normal normal-case">(optional)</span></label>
              <textarea rows={2} placeholder="Terms, inclusions, or additional information…" value={form.notes} onChange={e => set('notes', e.target.value)} className={`${field} resize-none`} />
            </div>
          </div>

          <div className="px-6 pb-2 shrink-0">
            {apiError && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] px-3 py-2 rounded-xl">{apiError}</p>}
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-[#F0F2F5] dark:border-[#1F2937] shrink-0">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-accent hover:text-accent transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-accent hover:bg-[#c96d18] rounded-xl transition-colors disabled:opacity-60">
              {loading ? <><Loader2 size={13} className="animate-spin" /> Creating…</> : 'Generate Quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Stat card ──────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, variant }) {
  const V = {
    green: { accent: 'bg-[#15803d]', iconBg: 'bg-[#F0FDF4] dark:bg-[#0A2318]', iconColor: 'text-[#15803d] dark:text-[#22c55e]', valColor: 'text-[#15803d] dark:text-[#22c55e]' },
    red:   { accent: 'bg-[#dc2626]', iconBg: 'bg-[#FEF2F2] dark:bg-[#2D0808]', iconColor: 'text-[#dc2626]',                     valColor: 'text-[#dc2626]'                     },
    blue:  { accent: 'bg-primary',   iconBg: 'bg-light-blue dark:bg-[#1B2D4A]', iconColor: 'text-primary dark:text-[#5B9BD5]',   valColor: 'text-primary dark:text-[#5B9BD5]'   },
  }[variant]

  return (
    <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <div className={`h-[3px] ${V.accent}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <p className="text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-[0.1em]">{label}</p>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${V.iconBg}`}>
            <Icon size={16} strokeWidth={1.75} className={V.iconColor} />
          </div>
        </div>
        <p className={`font-sora text-[28px] font-bold leading-none ${V.valColor}`}>{value}</p>
        {sub && <p className="text-[11px] text-muted dark:text-slate-500 mt-2">{sub}</p>}
      </div>
    </div>
  )
}

/* ── useTableState hook ────────────────────────────── */
function useTableState(seedData, searchFields, defaultSort) {
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortKey,      setSortKey]      = useState(defaultSort)
  const [page,         setPage]         = useState(1)
  const [extraData,    setExtra]        = useState([])

  const allData = useMemo(() => [...seedData, ...extraData], [seedData, extraData])

  const processed = useMemo(() => {
    let list = allData
    if (statusFilter !== 'All') list = list.filter(r => r.status === statusFilter)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(r => searchFields.some(f => String(r[f] ?? '').toLowerCase().includes(q)))
    const [key, dir] = sortKey.split('-')
    list = [...list].sort((a, b) => {
      let va = a[key], vb = b[key]
      if (key === 'amount') { va = Number(va) || 0; vb = Number(vb) || 0 }
      else { va = String(va ?? ''); vb = String(vb ?? '') }
      if (va < vb) return dir === 'asc' ? -1 : 1
      if (va > vb) return dir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [allData, search, statusFilter, sortKey])

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE))
  const paginated  = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const statuses   = ['All', ...new Set(allData.map(r => r.status))]

  function resetPage() { setPage(1) }

  return { search, setSearch: v => { setSearch(v); resetPage() },
           statusFilter, setStatusFilter: v => { setStatusFilter(v); resetPage() },
           sortKey, setSortKey,
           page, setPage, paginated, processed, totalPages, statuses, addItem: item => setExtra(p => [...p, item]) }
}

const PIE_COLORS = ['#1B4F8A', '#E07B20', '#2E6DA4', '#15803d', '#7C3AED', '#0F2340']

function FinanceChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#1C2538] border border-[#EFEFEF] dark:border-[#2A3547] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px] mt-1">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.fill }}/>
          <span className="text-muted">{p.name}:</span>
          <span className="font-semibold text-body dark:text-white">₹{Number(p.value).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Main Page ─────────────────────────────────────── */
/* ── Payroll helpers & components ──────────────────────────────────────── */
const fmtINRp  = p => p == null ? '₹0' : '₹' + Math.round(p / 100).toLocaleString('en-IN')
const fmtDateP = s => s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const PAY_STATUS_CFG = {
  'Pending':        { bg: 'bg-[#FEF2F2] dark:bg-[#2D0808]/60', text: 'text-[#dc2626]', dot: 'bg-[#dc2626]' },
  'Partially Paid': { bg: 'bg-[#FFF3E8] dark:bg-[#2D1F0A]/60', text: 'text-accent',     dot: 'bg-accent'    },
  'Paid':           { bg: 'bg-[#F0FDF4] dark:bg-[#0A2318]/60', text: 'text-[#15803d]',  dot: 'bg-[#15803d]' },
}
const METHOD_ICONS = { 'Cash': Banknote, 'Bank Transfer': CreditCard, 'UPI': Smartphone, 'Cheque': FileText }

const PAYROLL_MONTHS = (() => {
  const opts = []
  for (let m = 0; m < 12; m++) {
    const d = new Date(2026, m, 1)
    opts.push({ value: `2026-${String(m+1).padStart(2,'0')}`, label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) })
  }
  return opts.reverse()
})()

function PayStatusBadge({ status }) {
  const cfg = PAY_STATUS_CFG[status] ?? PAY_STATUS_CFG['Pending']
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{status}
    </span>
  )
}

function PaymentRecordModal({ record, onClose, onPaid }) {
  const worker  = record.workerId
  const balance = (record.netWagePaise ?? 0) - (record.paidPaise ?? 0)
  const [form, setForm] = useState({ amount: Math.round(balance/100), method: 'Cash', reference: '', note: '', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    if (!form.amount || form.amount <= 0) { setErr('Enter a valid amount.'); return }
    setSaving(true); setErr('')
    try {
      const updated = await recordPayment(record._id, { amountPaise: Math.round(Number(form.amount)*100), method: form.method, reference: form.reference, note: form.note, date: form.date })
      onPaid(updated); onClose()
    } catch(e) { setErr(e.message || 'Failed to record payment.') }
    finally { setSaving(false) }
  }

  const fi = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] transition-colors'
  const lb = 'block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-2xl w-full max-w-[420px]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] dark:bg-[#0A2318] flex items-center justify-center">
              <IndianRupee size={15} strokeWidth={2} className="text-[#15803d]" />
            </div>
            <div>
              <p className="font-sora font-semibold text-[14px] text-body dark:text-white">Record Payment</p>
              <p className="text-[11px] text-muted dark:text-slate-400">{worker?.name} · Balance: {fmtINRp(balance)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] transition-colors"><X size={16} strokeWidth={2}/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lb}>Amount (₹) *</label>
              <input type="number" min="1" value={form.amount} onChange={e => setF('amount', e.target.value)} className={fi}/>
            </div>
            <div>
              <label className={lb}>Date</label>
              <input type="date" value={form.date} onChange={e => setF('date', e.target.value)} className={fi}/>
            </div>
          </div>
          <div>
            <label className={lb}>Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {['Cash','Bank Transfer','UPI','Cheque'].map(m => {
                const Icon = METHOD_ICONS[m]
                return (
                  <button key={m} type="button" onClick={() => setF('method', m)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-medium transition-all ${form.method===m ? 'bg-navy text-white border-navy' : 'border-[#DDDDDD] dark:border-[#2A3547] text-muted hover:border-primary hover:text-primary'}`}>
                    <Icon size={13} strokeWidth={1.75}/>{m}
                  </button>
                )
              })}
            </div>
          </div>
          {['Bank Transfer','UPI','Cheque'].includes(form.method) && (
            <div>
              <label className={lb}>Reference / Transaction ID</label>
              <input type="text" placeholder="e.g. TXN123456" value={form.reference} onChange={e => setF('reference', e.target.value)} className={fi}/>
            </div>
          )}
          <div>
            <label className={lb}>Note <span className="text-muted font-normal normal-case tracking-normal">(optional)</span></label>
            <input type="text" placeholder="e.g. May advance…" value={form.note} onChange={e => setF('note', e.target.value)} className={fi}/>
          </div>
          {err && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] dark:bg-[#2D0808]/50 px-3 py-2 rounded-lg">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-primary hover:text-primary transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"/>Saving…</> : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PayrollWorkerRow({ record, onUpdate, idx }) {
  const [expanded, setExpanded] = useState(false)
  const [showPay,  setShowPay]  = useState(false)
  const [editRate, setEditRate] = useState(false)
  const [newRate,  setNewRate]  = useState(Math.round((record.dailyWagePaise ?? 0) / 100))
  const [saving,   setSaving]   = useState(false)

  const worker  = record.workerId ?? {}
  const balance = (record.netWagePaise ?? 0) - (record.paidPaise ?? 0)
  const payPct  = record.netWagePaise > 0 ? Math.min(100, Math.round((record.paidPaise / record.netWagePaise) * 100)) : 0

  async function saveRate() {
    setSaving(true)
    try { const u = await updatePayroll(record._id, { dailyWagePaise: Math.round(newRate*100) }); onUpdate(u); setEditRate(false) }
    catch(e) { console.error(e) } finally { setSaving(false) }
  }

  return (
    <>
      <tr className={['border-b border-[#F4F4F4] dark:border-[#1A2236] transition-all duration-100 cursor-pointer hover:[box-shadow:inset_3px_0_0_#1B4F8A] hover:bg-light-blue/20 dark:hover:bg-[#1A2236]', idx%2===1?'bg-[#FAFBFC] dark:bg-[#111620]':'bg-white dark:bg-[#141B27]'].join(' ')} onClick={() => setExpanded(e=>!e)}>
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-mid-blue/15 dark:bg-mid-blue/25 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-mid-blue">{worker.initials??'?'}</span>
            </div>
            <span className="text-[13px] font-semibold text-body dark:text-white">{worker.name??'—'}</span>
          </div>
        </td>
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3 text-[12px]">
            <span className="flex items-center gap-1 text-[#15803d] font-semibold"><span className="w-2 h-2 rounded-full bg-[#15803d]"/>{record.daysPresent}d</span>
            <span className="flex items-center gap-1 text-[#dc2626]"><span className="w-2 h-2 rounded-full bg-[#dc2626]"/>{record.daysAbsent}d absent</span>
            {record.daysLeave>0 && <span className="flex items-center gap-1 text-accent"><span className="w-2 h-2 rounded-full bg-accent"/>{record.daysLeave}d leave</span>}
          </div>
        </td>
        <td className="px-5 py-3.5" onClick={e=>e.stopPropagation()}>
          {editRate ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-muted">₹</span>
              <input type="number" min="0" value={newRate} onChange={e=>setNewRate(e.target.value)} autoFocus className="w-20 px-2 py-1 text-[12px] border border-primary rounded-lg focus:outline-none text-body dark:text-white bg-white dark:bg-[#1C2538]"/>
              <button onClick={saveRate} disabled={saving} className="text-[11px] font-semibold text-white bg-primary px-2 py-1 rounded-lg disabled:opacity-50">{saving?'…':'Save'}</button>
              <button onClick={()=>setEditRate(false)} className="text-muted hover:text-body"><X size={13}/></button>
            </div>
          ) : (
            <button onClick={()=>{setNewRate(Math.round((record.dailyWagePaise??0)/100));setEditRate(true)}} className="group flex items-center gap-1 text-[13px] font-medium text-body dark:text-slate-200 hover:text-primary transition-colors">
              {fmtINRp(record.dailyWagePaise)}<span className="text-[10px] text-muted">/day</span>
              <span className="text-[9px] text-muted group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">edit</span>
            </button>
          )}
        </td>
        <td className="px-5 py-3.5 text-[13px] font-semibold text-body dark:text-white whitespace-nowrap">{fmtINRp(record.grossWagePaise)}</td>
        <td className="px-5 py-3.5">
          <div className="min-w-[110px]">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-[#15803d] font-semibold">{fmtINRp(record.paidPaise)}</span>
              <span className="text-muted">{payPct}%</span>
            </div>
            <div className="h-1.5 bg-[#F0F2F5] dark:bg-[#2A3547] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-700" style={{ width:`${payPct}%`, background: payPct===100?'#15803d':'#E07B20' }}/>
            </div>
          </div>
        </td>
        <td className="px-5 py-3.5 whitespace-nowrap">
          <span className={`text-[13px] font-bold ${balance>0?'text-[#dc2626]':'text-[#15803d]'}`}>{balance>0?fmtINRp(balance):'—'}</span>
        </td>
        <td className="px-5 py-3.5"><PayStatusBadge status={record.status}/></td>
        <td className="px-5 py-3.5" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {balance>0 && (
              <button onClick={()=>setShowPay(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap">
                <IndianRupee size={11} strokeWidth={2.5}/> Pay
              </button>
            )}
            <button onClick={()=>setExpanded(e=>!e)} className="p-1.5 rounded-lg text-muted hover:text-body dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] transition-colors">
              {expanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className={idx%2===1?'bg-[#FAFBFC] dark:bg-[#111620]':'bg-white dark:bg-[#141B27]'}>
          <td colSpan={8} className="px-5 pb-5 pt-0">
            <div className="ml-11 border border-[#EFEFEF] dark:border-[#1F2937] rounded-xl overflow-hidden">
              {record.paymentRecords?.length>0 ? (
                <>
                  <div className="px-4 py-2.5 bg-[#F7F9FC] dark:bg-[#0F1219] border-b border-[#EFEFEF] dark:border-[#1F2937]">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Payment History</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F0F2F5] dark:bg-[#1A2236]">
                        {['Date','Amount','Method','Reference','Note','Paid By'].map(h=>(
                          <th key={h} className="text-left px-4 py-2 text-[10px] font-semibold text-muted uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {record.paymentRecords.map((p,i)=>{
                        const Icon = METHOD_ICONS[p.method]??Banknote
                        return (
                          <tr key={i} className="border-t border-[#F0F2F5] dark:border-[#1F2937]">
                            <td className="px-4 py-2.5 text-[12px] text-muted">{fmtDateP(p.date)}</td>
                            <td className="px-4 py-2.5 text-[13px] font-semibold text-[#15803d]">{fmtINRp(p.amountPaise)}</td>
                            <td className="px-4 py-2.5"><span className="flex items-center gap-1.5 text-[11px] font-medium text-body dark:text-slate-300"><Icon size={12} strokeWidth={1.75} className="text-muted"/>{p.method}</span></td>
                            <td className="px-4 py-2.5 text-[12px] font-mono text-muted">{p.reference||'—'}</td>
                            <td className="px-4 py-2.5 text-[12px] text-muted">{p.note||'—'}</td>
                            <td className="px-4 py-2.5 text-[12px] text-muted">{p.paidBy?.name??'—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 text-[12px] text-muted">
                  <Clock size={14} strokeWidth={1.75} className="text-muted/50"/>No payments recorded yet.
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
      {showPay && <PaymentRecordModal record={record} onClose={()=>setShowPay(false)} onPaid={u=>{onUpdate(u);setShowPay(false)}}/>}
    </>
  )
}

/* ── end payroll components ─────────────────────────────────────────────── */

function normalizeInvoice(i) { return { ...i, id: i._id, client: i.clientId?.name ?? '', project: i.projectId?.name ?? '', amount: Math.round((i.amountPaise ?? 0) / 100), date: i.issueDate ?? '' } }
function normalizePayment(p) { return { ...p, id: p._id, client: p.clientId?.name ?? '', project: p.projectId?.name ?? '', amount: Math.round((p.amountPaise ?? 0) / 100), date: p.paymentDate ?? '', invoiceId: p.invoiceId } }
function normalizeQuotation(q) { return { ...q, id: q._id, client: q.clientId?.name ?? '', project: q.projectId?.name ?? '', amount: Math.round((q.amountPaise ?? 0) / 100), date: q.issueDate ?? '', validUntil: q.validUntil ?? '' } }
function normalizeMilestone(m) { return { ...m, id: m._id, client: m.clientId?.name ?? '', project: m.projectId?.name ?? '', amount: Math.round((m.amountPaise ?? 0) / 100) } }

export default function FinancePage() {
  const { user }  = useAuth()
  const { isDark } = useTheme()
  const [tab,              setTab]              = useState('overview')
  const [showInvoice,      setShowInvoice]      = useState(false)
  const [showQuote,        setShowQuote]        = useState(false)
  const [billsTab,         setBillsTab]         = useState(false)
  const [financeSummary,   setFinanceSummary]   = useState({ revenuePaise: 0, pendingInvoices: 0 })
  const [expenseBreakdown, setExpenseBreakdown] = useState([])
  const [projectPnL,       setProjectPnL]       = useState([])
  const [pendingMilestones,setPendingMilestones]= useState([])
  const [projects,         setProjects]         = useState([])
  const [allClients,       setAllClients]       = useState([])
  const [seedInvoices,     setSeedInvoices]     = useState([])
  const [seedQuotations,   setSeedQuotations]   = useState([])
  const [seedPayments,     setSeedPayments]     = useState([])
  const [payrollMonth,     setPayrollMonth]     = useState('2026-05')
  const [payrollRecords,   setPayrollRecords]   = useState([])
  const [payrollLoading,   setPayrollLoading]   = useState(false)
  const [payrollGenerating,setPayrollGenerating]= useState(false)

  async function loadPayroll(m) {
    setPayrollLoading(true)
    try { setPayrollRecords(await getPayroll(m)) } catch(e) { console.error(e) }
    finally { setPayrollLoading(false) }
  }

  async function handleGeneratePayroll() {
    setPayrollGenerating(true)
    try { setPayrollRecords(await generatePayroll(payrollMonth)) } catch(e) { console.error(e) }
    finally { setPayrollGenerating(false) }
  }

  useEffect(() => {
    if (tab === 'payroll') loadPayroll(payrollMonth)
  }, [tab, payrollMonth])

  const payrollStats = useMemo(() => {
    const totalWage    = payrollRecords.reduce((s,r) => s + (r.netWagePaise  ?? 0), 0)
    const totalPaid    = payrollRecords.reduce((s,r) => s + (r.paidPaise     ?? 0), 0)
    const pending      = payrollRecords.filter(r => r.status === 'Pending').length
    const partial      = payrollRecords.filter(r => r.status === 'Partially Paid').length
    const paid         = payrollRecords.filter(r => r.status === 'Paid').length
    return { totalWage, totalPaid, balance: totalWage - totalPaid, pending, partial, paid }
  }, [payrollRecords])

  useEffect(() => {
    getFinanceSummary().then(setFinanceSummary).catch(console.error)
    getExpenseBreakdown().then(d => setExpenseBreakdown(d.map(e => ({ category: e.category, amount: Math.round((e.amountPaise ?? 0) / 100) })))).catch(console.error)
    getFinancePnL().then(d => setProjectPnL(d.map(p => ({ ...p, id: p.projectId, name: p.projectName, budget: Math.round((p.budgetPaise ?? 0) / 100), spent: Math.round((p.spentPaise ?? 0) / 100), collected: Math.round((p.collectedPaise ?? 0) / 100) })))).catch(console.error)
    getMilestones({ status: 'Pending' }).then(d => setPendingMilestones(d.map(normalizeMilestone))).catch(console.error)
    getProjects().then(ps => setProjects(ps.map(projectToRow))).catch(console.error)
    getClients().then(setAllClients).catch(console.error)
    getInvoices().then(d => setSeedInvoices(d.map(normalizeInvoice))).catch(console.error)
    getQuotations().then(d => setSeedQuotations(d.map(normalizeQuotation))).catch(console.error)
    getPayments().then(d => setSeedPayments(d.map(normalizePayment))).catch(console.error)
  }, [])

  const inv  = useTableState(seedInvoices,   ['id','client','project'],       'date-desc')
  const quot = useTableState(seedQuotations, ['id','client','project'],       'date-desc')
  const pay  = useTableState(seedPayments,   ['id','client','project','method','invoiceId'], 'date-desc')

  if (user.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-[#FFF3E8] dark:bg-[#2D1F0A] flex items-center justify-center">
          <Lock size={24} strokeWidth={1.75} className="text-accent" />
        </div>
        <p className="font-sora font-semibold text-[15px] text-body dark:text-white">Finance Access Restricted</p>
        <p className="text-[13px] text-muted dark:text-slate-400 text-center max-w-sm">
          Finance information is not enabled for your role. Contact your administrator for access.
        </p>
      </div>
    )
  }

  const totalExpenses = expenseBreakdown.reduce((s, e) => s + e.amount, 0)
  const overdueTotal  = pendingMilestones.reduce((s, m) => s + m.amount, 0)
  const financeChart  = projects.map(p => ({ project: p.name.split(' ').slice(0,2).join(' '), budget: Math.round(p.budgetRaw/100), actual: Math.round(p.spentRaw/100) }))

  return (
    <div className="space-y-5">

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-1.5">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={[
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 flex-1 justify-center',
              tab === id
                ? 'bg-navy text-white dark:bg-primary shadow-sm'
                : 'text-muted dark:text-slate-400 hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] hover:text-body dark:hover:text-white',
            ].join(' ')}>
            <Icon size={15} strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────── */}
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Total Revenue"  value={formatINR(financeSummary.revenuePaise ?? 0)}  sub="Collected this month"  icon={TrendingUp}   variant="green" />
            <StatCard label="Total Expenses" value={formatINR(totalExpenses * 100)}                sub="Across all projects"   icon={TrendingDown} variant="red"   />
            <StatCard label="Net Profit"     value={formatINR((financeSummary.revenuePaise ?? 0) - totalExpenses * 100)} sub="After all deductions" icon={IndianRupee} variant="blue" />
          </div>

          {/* ── Project Budget vs Actual — Charts ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Bar chart */}
            <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Budget vs Actual</h3>
                  <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">Per-project spend comparison</p>
                </div>
                <div className="flex gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: isDark ? '#1E2D44' : '#D6E8F7' }}/>
                    <span className="text-muted dark:text-slate-400">Budget</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-primary"/>
                    <span className="text-muted dark:text-slate-400">Actual</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={financeChart} barCategoryGap="30%" barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1F2937' : '#F0F2F5'} vertical={false}/>
                  <XAxis dataKey="project" tick={{ fontSize:11, fill: isDark ? '#4B5563' : '#AAAAAA' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill: isDark ? '#4B5563' : '#AAAAAA' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={46}/>
                  <Tooltip content={<FinanceChartTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)' }}/>
                  <Bar dataKey="budget" name="Budget" fill={isDark ? '#1E2D44' : '#D6E8F7'} radius={[4,4,0,0]}/>
                  <Bar dataKey="actual"  name="Actual"  fill="#1B4F8A"                       radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Expense breakdown pie */}
            <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-5">
              <div className="mb-4">
                <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Expense by Category</h3>
                <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">Current month distribution</p>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%" cy="50%"
                    outerRadius={75}
                    label={({ category, percent }) => `${category.split(' ')[0]} ${(percent*100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {expenseBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize:11, color: isDark ? '#4B5563' : '#AAAAAA' }}/>
                  <Tooltip formatter={v => `₹${Number(v).toLocaleString('en-IN')}`}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Upload Bills & Documents ─────────────────────── */}
          <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
            <button
              onClick={() => setBillsTab(o => !o)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937] hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] transition-colors duration-150 group">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FFF3E8] dark:bg-[#2D1F0A] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload size={14} className="text-accent"/>
                </div>
                <div className="text-left">
                  <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Upload Bills &amp; Documents</h3>
                  <p className="text-[11px] text-muted dark:text-slate-500">Attach invoices, receipts, contracts, and other files</p>
                </div>
              </div>
              <span className="text-[11px] text-primary dark:text-[#5B9BD5] font-medium">{billsTab ? 'Collapse ↑' : 'Expand ↓'}</span>
            </button>
            {billsTab && (
              <div className="px-5 py-5">
                <FileUploadZone
                  label="Upload invoices, bills, receipts, or contracts"
                  hint="PDF, images, Word, Excel — multiple files supported"
                  maxFiles={20}
                />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
              <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Project-wise P&amp;L</h3>
              <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">Budget vs actual spend per project</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy">
                    {['Project','Client','Budget','Spent','Remaining','Collected','P&L'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectPnL.map((row, i) => {
                    const remaining = row.budget - row.spent
                    const pl        = row.budget - row.spent
                    const pos       = pl >= 0
                    return (
                      <tr key={row.id} className={['border-b border-[#F4F4F4] dark:border-[#1A2236] last:border-0 hover:[box-shadow:inset_3px_0_0_#1B4F8A] hover:bg-light-blue/20 dark:hover:bg-[#1A2236] transition-all duration-100', i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : 'bg-white dark:bg-[#141B27]'].join(' ')}>
                        <td className="px-5 py-3.5 text-[13px] font-semibold text-body dark:text-white whitespace-nowrap">{row.name}</td>
                        <td className="px-5 py-3.5 text-[13px] text-body dark:text-slate-300 whitespace-nowrap">{row.client}</td>
                        <td className="px-5 py-3.5 text-[13px] font-medium text-body dark:text-slate-300 whitespace-nowrap">{fmtINR(row.budget)}</td>
                        <td className="px-5 py-3.5 text-[13px] text-body dark:text-slate-300 whitespace-nowrap">{fmtINR(row.spent)}</td>
                        <td className="px-5 py-3.5 text-[13px] font-medium whitespace-nowrap" style={{ color: remaining >= 0 ? '#15803d' : '#dc2626' }}>
                          {remaining >= 0 ? fmtINR(remaining) : `–${fmtINR(-remaining)}`}
                        </td>
                        <td className="px-5 py-3.5 text-[13px] text-body dark:text-slate-300 whitespace-nowrap">{fmtINR(row.collected)}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-md ${pos ? 'bg-[#F0FDF4] dark:bg-[#0A2318] text-[#15803d] dark:text-[#22c55e]' : 'bg-[#FEF2F2] dark:bg-[#2D0808] text-[#dc2626]'}`}>
                            {pos ? '+' : '–'}{fmtINR(Math.abs(pl))}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-5">
              <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white mb-0.5">Expense Breakdown</h3>
              <p className="text-[11px] text-muted dark:text-slate-500 mb-5">By category — current month</p>
              <div className="space-y-4">
                {expenseBreakdown.map(item => {
                  const pct = Math.round((item.amount / totalExpenses) * 100)
                  return (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-medium text-body dark:text-slate-300">{item.category}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-muted dark:text-slate-400">{pct}%</span>
                          <span className="text-[13px] font-semibold text-body dark:text-white w-24 text-right">{fmtINR(item.amount)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-[#F0F2F5] dark:bg-[#2A3547] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-5 pt-4 border-t border-[#F0F2F5] dark:border-[#1F2937] flex items-center justify-between">
                <span className="text-[12px] font-medium text-muted dark:text-slate-400">Total</span>
                <span className="font-sora font-bold text-[15px] text-body dark:text-white">{fmtINR(totalExpenses)}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Pending Milestones</h3>
                  <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">Overdue payment milestones</p>
                </div>
                <span className="text-[11px] font-semibold bg-[#FEF2F2] dark:bg-[#2D0808] text-[#dc2626] px-2.5 py-1 rounded-lg shrink-0">
                  {fmtINR(overdueTotal)} overdue
                </span>
              </div>
              <div className="space-y-3">
                {pendingMilestones.map(m => (
                  <div key={m.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FEF9F9] dark:bg-[#2D0808]/40 border border-[#dc2626]/15">
                    <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] dark:bg-[#2D0808] flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle size={14} strokeWidth={1.75} className="text-[#dc2626]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-body dark:text-white truncate">{m.client}</p>
                          <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5 truncate">{m.project} · {m.milestone}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[13px] font-bold text-[#dc2626]">{fmtINR(m.amount)}</p>
                          <p className="text-[10px] text-muted dark:text-slate-500 mt-0.5">{m.daysOverdue}d overdue</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── INVOICES ─────────────────────────────────── */}
      {tab === 'invoices' && (
        <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937] flex-wrap gap-3">
            <div>
              <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Invoices</h3>
              <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">{inv.processed.length} total</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <TableControls
                search={inv.search} onSearch={inv.setSearch}
                statusFilter={inv.statusFilter} onStatus={inv.setStatusFilter}
                sortKey={inv.sortKey} onSort={inv.setSortKey}
                statuses={inv.statuses}
                sortOptions={[
                  { value:'date-desc', label:'Newest first'  },
                  { value:'date-asc',  label:'Oldest first'  },
                  { value:'amount-desc',label:'Highest amount'},
                  { value:'amount-asc', label:'Lowest amount' },
                ]}
              />
              <button onClick={() => setShowInvoice(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-xl transition-colors whitespace-nowrap">
                <Plus size={13} strokeWidth={2.5} /> Generate Invoice
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy">
                  {['Invoice ID','Client','Project','Amount','Date','Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inv.paginated.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-[13px] text-muted dark:text-slate-500">No invoices match your search.</td></tr>
                ) : inv.paginated.map((item, i) => (
                  <tr key={item.id} className={['border-b border-[#F4F4F4] dark:border-[#1A2236] last:border-0 hover:[box-shadow:inset_3px_0_0_#1B4F8A] hover:bg-light-blue/20 dark:hover:bg-[#1A2236] transition-all duration-100', i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : 'bg-white dark:bg-[#141B27]'].join(' ')}>
                    <td className="px-5 py-3.5 text-[12px] font-mono text-muted dark:text-slate-400">{item.id}</td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-body dark:text-white whitespace-nowrap">{item.client}</td>
                    <td className="px-5 py-3.5 text-[13px] text-body dark:text-slate-300 whitespace-nowrap">{item.project}</td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-body dark:text-white whitespace-nowrap">{fmtINR(item.amount)}</td>
                    <td className="px-5 py-3.5 text-[13px] text-muted dark:text-slate-400 whitespace-nowrap">{item.date}</td>
                    <td className="px-5 py-3.5"><Badge status={item.status} cfg={INVOICE_STATUS} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={inv.page} total={inv.totalPages} onPage={inv.setPage} />
        </div>
      )}

      {/* ── QUOTATIONS ───────────────────────────────── */}
      {tab === 'quotations' && (
        <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937] flex-wrap gap-3">
            <div>
              <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Quotations</h3>
              <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">{quot.processed.length} total</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <TableControls
                search={quot.search} onSearch={quot.setSearch}
                statusFilter={quot.statusFilter} onStatus={quot.setStatusFilter}
                sortKey={quot.sortKey} onSort={quot.setSortKey}
                statuses={quot.statuses}
                sortOptions={[
                  { value:'date-desc',  label:'Newest first'   },
                  { value:'date-asc',   label:'Oldest first'   },
                  { value:'amount-desc',label:'Highest amount' },
                  { value:'amount-asc', label:'Lowest amount'  },
                ]}
              />
              <button onClick={() => setShowQuote(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-white bg-accent hover:bg-[#c96d18] rounded-xl transition-colors whitespace-nowrap">
                <Plus size={13} strokeWidth={2.5} /> Generate Quotation
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy">
                  {['Quote ID','Client','Project','Amount','Date','Valid Until','Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quot.paginated.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-[13px] text-muted dark:text-slate-500">No quotations match your search.</td></tr>
                ) : quot.paginated.map((item, i) => (
                  <tr key={item.id} className={['border-b border-[#F4F4F4] dark:border-[#1A2236] last:border-0 hover:[box-shadow:inset_3px_0_0_#1B4F8A] hover:bg-light-blue/20 dark:hover:bg-[#1A2236] transition-all duration-100', i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : 'bg-white dark:bg-[#141B27]'].join(' ')}>
                    <td className="px-5 py-3.5 text-[12px] font-mono text-muted dark:text-slate-400">{item.id}</td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-body dark:text-white whitespace-nowrap">{item.client}</td>
                    <td className="px-5 py-3.5 text-[13px] text-body dark:text-slate-300 whitespace-nowrap">{item.project}</td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-body dark:text-white whitespace-nowrap">{fmtINR(item.amount)}</td>
                    <td className="px-5 py-3.5 text-[13px] text-muted dark:text-slate-400 whitespace-nowrap">{item.date}</td>
                    <td className="px-5 py-3.5 text-[13px] text-muted dark:text-slate-400 whitespace-nowrap">{item.validUntil}</td>
                    <td className="px-5 py-3.5"><Badge status={item.status} cfg={QUOT_STATUS} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={quot.page} total={quot.totalPages} onPage={quot.setPage} />
        </div>
      )}

      {/* ── PAYMENTS ─────────────────────────────────── */}
      {tab === 'payments' && (
        <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937] flex-wrap gap-3">
            <div>
              <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">Payment Tracker</h3>
              <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">{pay.processed.length} entries</p>
            </div>
            <TableControls
              search={pay.search} onSearch={pay.setSearch}
              statusFilter={pay.statusFilter} onStatus={pay.setStatusFilter}
              sortKey={pay.sortKey} onSort={pay.setSortKey}
              statuses={pay.statuses}
              sortOptions={[
                { value:'date-desc',  label:'Newest first'   },
                { value:'date-asc',   label:'Oldest first'   },
                { value:'amount-desc',label:'Highest amount' },
                { value:'amount-asc', label:'Lowest amount'  },
              ]}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy">
                  {['Payment ID','Client','Project','Amount','Date','Method','Invoice Ref','Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pay.paginated.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-[13px] text-muted dark:text-slate-500">No payments match your search.</td></tr>
                ) : pay.paginated.map((item, i) => (
                  <tr key={item.id} className={['border-b border-[#F4F4F4] dark:border-[#1A2236] last:border-0 hover:[box-shadow:inset_3px_0_0_#1B4F8A] hover:bg-light-blue/20 dark:hover:bg-[#1A2236] transition-all duration-100', i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : 'bg-white dark:bg-[#141B27]'].join(' ')}>
                    <td className="px-5 py-3.5 text-[12px] font-mono text-muted dark:text-slate-400">{item.id}</td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-body dark:text-white whitespace-nowrap">{item.client}</td>
                    <td className="px-5 py-3.5 text-[13px] text-body dark:text-slate-300 whitespace-nowrap">{item.project}</td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-body dark:text-white whitespace-nowrap">{fmtINR(item.amount)}</td>
                    <td className="px-5 py-3.5 text-[13px] text-muted dark:text-slate-400 whitespace-nowrap">{item.date}</td>
                    <td className="px-5 py-3.5 text-[13px] text-muted dark:text-slate-400 whitespace-nowrap">{item.method}</td>
                    <td className="px-5 py-3.5 text-[12px] font-mono text-muted dark:text-slate-400 whitespace-nowrap">{item.invoiceId}</td>
                    <td className="px-5 py-3.5"><Badge status={item.status} cfg={PAY_STATUS} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pay.page} total={pay.totalPages} onPage={pay.setPage} />
        </div>
      )}

      {/* ── PAYROLL ──────────────────────────────────────────── */}
      {tab === 'payroll' && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <select value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)}
                className="px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] transition-colors">
                {PAYROLL_MONTHS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <button onClick={handleGeneratePayroll} disabled={payrollGenerating}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-navy hover:bg-primary rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap">
              {payrollGenerating
                ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"/>Generating…</>
                : <><RefreshCw size={14} strokeWidth={2}/>{payrollRecords.length ? 'Refresh Payroll' : 'Generate Payroll'}</>}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:'Total Payable', value:fmtINRp(payrollStats.totalWage),    icon:IndianRupee,  bg:'bg-light-blue/60 dark:bg-[#1B2D4A]', color:'text-primary dark:text-[#5B9BD5]'  },
              { label:'Total Paid',    value:fmtINRp(payrollStats.totalPaid),    icon:CheckCircle2, bg:'bg-[#F0FDF4] dark:bg-[#0A2318]',     color:'text-[#15803d] dark:text-[#22c55e]' },
              { label:'Balance Due',   value:fmtINRp(payrollStats.balance),      icon:AlertTriangle,bg:'bg-[#FEF2F2] dark:bg-[#2D0808]',     color:'text-[#dc2626]'                     },
              { label:'Staff',         value:`${payrollStats.paid}/${payrollRecords.length} paid`, icon:Users, bg:'bg-[#FFF3E8] dark:bg-[#2D1F0A]', color:'text-accent' },
            ].map(({ label, value, icon: Icon, bg, color }) => (
              <div key={label} className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon size={17} strokeWidth={1.75} className={color}/>
                </div>
                <div>
                  <p className="font-sora text-[22px] font-bold text-body dark:text-white leading-none">{value}</p>
                  <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
              <div>
                <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">
                  {PAYROLL_MONTHS.find(o=>o.value===payrollMonth)?.label} — Worker Wages
                </h3>
                <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">Workers · Supervisors · Designers — click a row for payment history · click rate to edit</p>
              </div>
            </div>

            {payrollLoading ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <span className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin"/>
                <span className="text-[13px] text-muted">Loading payroll…</span>
              </div>
            ) : payrollRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Calendar size={36} strokeWidth={1.25} className="text-muted/40"/>
                <p className="text-[14px] font-semibold text-muted">No payroll generated yet</p>
                <p className="text-[12px] text-muted/70">Click "Generate Payroll" to calculate wages from attendance.</p>
                <button onClick={handleGeneratePayroll} disabled={payrollGenerating}
                  className="mt-1 flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-navy hover:bg-primary rounded-xl transition-colors disabled:opacity-50">
                  <RefreshCw size={14} strokeWidth={2}/>Generate Payroll
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-navy">
                      {['Worker','Attendance','Daily Rate','Gross Wages','Paid','Balance','Status',''].map(h=>(
                        <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap last:w-28">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payrollRecords.map((record,i) => (
                      <PayrollWorkerRow key={String(record._id)} record={record}
                        onUpdate={u => setPayrollRecords(prev => prev.map(r => String(r._id)===String(u._id)?u:r))}
                        idx={i}/>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#F7F9FC] dark:bg-[#0F1219] border-t-2 border-[#EFEFEF] dark:border-[#2A3547]">
                      <td className="px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-widest" colSpan={3}>Total ({payrollRecords.length} staff)</td>
                      <td className="px-5 py-3 text-[13px] font-bold text-body dark:text-white">{fmtINRp(payrollStats.totalWage)}</td>
                      <td className="px-5 py-3 text-[13px] font-bold text-[#15803d]">{fmtINRp(payrollStats.totalPaid)}</td>
                      <td className="px-5 py-3 text-[13px] font-bold text-[#dc2626]">{payrollStats.balance>0?fmtINRp(payrollStats.balance):'—'}</td>
                      <td colSpan={2} className="px-5 py-3">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-[#15803d] font-semibold">{payrollStats.paid} paid</span>
                          {payrollStats.partial>0 && <span className="text-accent font-semibold">· {payrollStats.partial} partial</span>}
                          {payrollStats.pending>0 && <span className="text-[#dc2626] font-semibold">· {payrollStats.pending} pending</span>}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showInvoice && <InvoiceModal
        onClose={() => setShowInvoice(false)}
        onCreated={item => { inv.addItem(item); setShowInvoice(false) }}
        projects={projects}
        clients={allClients}
      />}
      {showQuote && <QuotationModal
        onClose={() => setShowQuote(false)}
        onCreated={item => { quot.addItem(item); setShowQuote(false) }}
        projects={projects}
        clients={allClients}
      />}

    </div>
  )
}
