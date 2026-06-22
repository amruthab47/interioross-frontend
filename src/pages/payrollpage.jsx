import { useState, useEffect, useMemo } from 'react'
import {
  IndianRupee, Users, CheckCircle2, Clock, AlertTriangle,
  Plus, ChevronDown, ChevronUp, X, RefreshCw, Banknote,
  CreditCard, Smartphone, FileText, Calendar, TrendingUp,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getPayroll, getPayrollMonths, generatePayroll, recordPayment, updatePayroll } from '../api/payroll'

/* ── helpers ─────────────────────────────────────────────────────────────── */
const fmtINR = p => p == null ? '₹0' : '₹' + Math.round(p / 100).toLocaleString('en-IN')
const fmtDate = s => s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const STATUS_CFG = {
  'Pending':        { bg: 'bg-[#FEF2F2] dark:bg-[#2D0808]/60', text: 'text-[#dc2626]', dot: 'bg-[#dc2626]' },
  'Partially Paid': { bg: 'bg-[#FFF3E8] dark:bg-[#2D1F0A]/60', text: 'text-accent',     dot: 'bg-accent'    },
  'Paid':           { bg: 'bg-[#F0FDF4] dark:bg-[#0A2318]/60', text: 'text-[#15803d]',  dot: 'bg-[#15803d]' },
}

const METHOD_ICONS = {
  'Cash':          Banknote,
  'Bank Transfer': CreditCard,
  'UPI':           Smartphone,
  'Cheque':        FileText,
}

const MONTH_OPTIONS = (() => {
  const opts = []
  for (let m = 0; m < 12; m++) {
    const d = new Date(2026, m, 1)
    opts.push({
      value: `2026-${String(m + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    })
  }
  return opts.reverse()
})()

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG['Pending']
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  )
}

/* ── Record Payment Modal ────────────────────────────────────────────────── */
function PaymentModal({ record, onClose, onPaid }) {
  const worker   = record.workerId
  const balance  = (record.netWagePaise ?? 0) - (record.paidPaise ?? 0)
  const [form, setForm] = useState({
    amount:    Math.round(balance / 100),
    method:    'Cash',
    reference: '',
    note:      '',
    date:      new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || form.amount <= 0) { setErr('Enter a valid amount.'); return }
    setSaving(true); setErr('')
    try {
      const updated = await recordPayment(record._id, {
        amountPaise: Math.round(Number(form.amount) * 100),
        method:    form.method,
        reference: form.reference,
        note:      form.note,
        date:      form.date,
      })
      onPaid(updated)
      onClose()
    } catch (e) { setErr(e.message || 'Failed to record payment.') }
    finally { setSaving(false) }
  }

  const f = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] transition-colors'
  const l = 'block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5'

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
              <p className="text-[11px] text-muted dark:text-slate-400">{worker?.name} · Balance: {fmtINR(balance)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] transition-colors">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={l}>Amount (₹) <span className="text-[#dc2626]">*</span></label>
              <input type="number" min="1" max={Math.round(balance / 100) + 1}
                value={form.amount} onChange={e => set('amount', e.target.value)} className={f} />
            </div>
            <div>
              <label className={l}>Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={f} />
            </div>
          </div>

          <div>
            <label className={l}>Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {['Cash', 'Bank Transfer', 'UPI', 'Cheque'].map(m => {
                const Icon = METHOD_ICONS[m]
                return (
                  <button key={m} type="button"
                    onClick={() => set('method', m)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-medium transition-all ${
                      form.method === m
                        ? 'bg-navy text-white border-navy'
                        : 'border-[#DDDDDD] dark:border-[#2A3547] text-muted hover:border-primary hover:text-primary'
                    }`}>
                    <Icon size={13} strokeWidth={1.75} />
                    {m}
                  </button>
                )
              })}
            </div>
          </div>

          {(form.method === 'Bank Transfer' || form.method === 'UPI' || form.method === 'Cheque') && (
            <div>
              <label className={l}>Reference / Transaction ID</label>
              <input type="text" placeholder="e.g. TXN123456 or cheque no."
                value={form.reference} onChange={e => set('reference', e.target.value)} className={f} />
            </div>
          )}

          <div>
            <label className={l}>Note <span className="text-muted font-normal normal-case tracking-normal">(optional)</span></label>
            <input type="text" placeholder="e.g. May advance, week 1 wages…"
              value={form.note} onChange={e => set('note', e.target.value)} className={f} />
          </div>

          {err && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] dark:bg-[#2D0808]/50 px-3 py-2 rounded-lg">{err}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-primary hover:text-primary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Saving…</> : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Worker Row (expandable) ─────────────────────────────────────────────── */
function WorkerRow({ record, onUpdate, idx }) {
  const [expanded, setExpanded] = useState(false)
  const [showPay,  setShowPay]  = useState(false)
  const [editRate, setEditRate] = useState(false)
  const [newRate,  setNewRate]  = useState(Math.round((record.dailyWagePaise ?? 0) / 100))
  const [saving,   setSaving]   = useState(false)

  const worker  = record.workerId ?? {}
  const balance = (record.netWagePaise ?? 0) - (record.paidPaise ?? 0)
  const payPct  = record.netWagePaise > 0
    ? Math.min(100, Math.round((record.paidPaise / record.netWagePaise) * 100))
    : 0

  async function saveRate() {
    setSaving(true)
    try {
      const updated = await updatePayroll(record._id, { dailyWagePaise: Math.round(newRate * 100) })
      onUpdate(updated)
      setEditRate(false)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const statusCfg = STATUS_CFG[record.status] ?? STATUS_CFG['Pending']

  return (
    <>
      <tr
        className={[
          'border-b border-[#F4F4F4] dark:border-[#1A2236] transition-all duration-100 cursor-pointer',
          'hover:[box-shadow:inset_3px_0_0_#1B4F8A] hover:bg-light-blue/10 dark:hover:bg-[#1A2236]',
          idx % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : 'bg-white dark:bg-[#141B27]',
        ].join(' ')}
        onClick={() => setExpanded(e => !e)}>

        {/* Worker */}
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-mid-blue/15 dark:bg-mid-blue/25 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-mid-blue">{worker.initials ?? '?'}</span>
            </div>
            <span className="text-[13px] font-semibold text-body dark:text-white">{worker.name ?? '—'}</span>
          </div>
        </td>

        {/* Attendance breakdown */}
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3 text-[12px]">
            <span className="flex items-center gap-1 text-[#15803d] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#15803d]" />{record.daysPresent}d
            </span>
            <span className="flex items-center gap-1 text-[#dc2626]">
              <span className="w-2 h-2 rounded-full bg-[#dc2626]" />{record.daysAbsent}d absent
            </span>
            {record.daysLeave > 0 && (
              <span className="flex items-center gap-1 text-accent">
                <span className="w-2 h-2 rounded-full bg-accent" />{record.daysLeave}d leave
              </span>
            )}
          </div>
        </td>

        {/* Daily rate */}
        <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
          {editRate ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-muted">₹</span>
              <input type="number" min="0" value={newRate}
                onChange={e => setNewRate(e.target.value)}
                className="w-20 px-2 py-1 text-[12px] border border-primary rounded-lg focus:outline-none text-body dark:text-white bg-white dark:bg-[#1C2538]"
                autoFocus />
              <button onClick={saveRate} disabled={saving}
                className="text-[11px] font-semibold text-white bg-primary px-2 py-1 rounded-lg disabled:opacity-50">
                {saving ? '…' : 'Save'}
              </button>
              <button onClick={() => setEditRate(false)} className="text-muted hover:text-body">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setNewRate(Math.round((record.dailyWagePaise ?? 0) / 100)); setEditRate(true) }}
              className="group flex items-center gap-1 text-[13px] font-medium text-body dark:text-slate-200 hover:text-primary transition-colors">
              {fmtINR(record.dailyWagePaise)}<span className="text-[10px] text-muted">/day</span>
              <span className="text-[9px] text-muted group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">edit</span>
            </button>
          )}
        </td>

        {/* Gross wages */}
        <td className="px-5 py-3.5 text-[13px] font-semibold text-body dark:text-white whitespace-nowrap">
          {fmtINR(record.grossWagePaise)}
        </td>

        {/* Paid + progress */}
        <td className="px-5 py-3.5">
          <div className="min-w-[120px]">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-[#15803d] font-semibold">{fmtINR(record.paidPaise)} paid</span>
              <span className="text-muted">{payPct}%</span>
            </div>
            <div className="h-1.5 bg-[#F0F2F5] dark:bg-[#2A3547] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${payPct}%`, background: payPct === 100 ? '#15803d' : '#E07B20' }} />
            </div>
          </div>
        </td>

        {/* Balance */}
        <td className="px-5 py-3.5 whitespace-nowrap">
          <span className={`text-[13px] font-bold ${balance > 0 ? 'text-[#dc2626]' : 'text-[#15803d]'}`}>
            {balance > 0 ? fmtINR(balance) : '—'}
          </span>
        </td>

        {/* Status */}
        <td className="px-5 py-3.5">
          <StatusBadge status={record.status} />
        </td>

        {/* Actions */}
        <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {balance > 0 && (
              <button onClick={() => setShowPay(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap">
                <IndianRupee size={11} strokeWidth={2.5} /> Pay
              </button>
            )}
            <button onClick={() => setExpanded(e => !e)}
              className="p-1.5 rounded-lg text-muted hover:text-body dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] transition-colors">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded payment history */}
      {expanded && (
        <tr className={idx % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : 'bg-white dark:bg-[#141B27]'}>
          <td colSpan={8} className="px-5 pb-5 pt-0">
            <div className="ml-11 border border-[#EFEFEF] dark:border-[#1F2937] rounded-xl overflow-hidden">
              {record.paymentRecords?.length > 0 ? (
                <>
                  <div className="px-4 py-2.5 bg-[#F7F9FC] dark:bg-[#0F1219] border-b border-[#EFEFEF] dark:border-[#1F2937]">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Payment History</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F0F2F5] dark:bg-[#1A2236]">
                        {['Date','Amount','Method','Reference','Note','Paid By'].map(h => (
                          <th key={h} className="text-left px-4 py-2 text-[10px] font-semibold text-muted uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {record.paymentRecords.map((p, i) => {
                        const Icon = METHOD_ICONS[p.method] ?? Banknote
                        return (
                          <tr key={i} className="border-t border-[#F0F2F5] dark:border-[#1F2937]">
                            <td className="px-4 py-2.5 text-[12px] text-muted">{fmtDate(p.date)}</td>
                            <td className="px-4 py-2.5 text-[13px] font-semibold text-[#15803d]">{fmtINR(p.amountPaise)}</td>
                            <td className="px-4 py-2.5">
                              <span className="flex items-center gap-1.5 text-[11px] font-medium text-body dark:text-slate-300">
                                <Icon size={12} strokeWidth={1.75} className="text-muted" />{p.method}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-[12px] font-mono text-muted">{p.reference || '—'}</td>
                            <td className="px-4 py-2.5 text-[12px] text-muted">{p.note || '—'}</td>
                            <td className="px-4 py-2.5 text-[12px] text-muted">{p.paidBy?.name ?? '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 text-[12px] text-muted">
                  <Clock size={14} strokeWidth={1.75} className="text-muted/50" />
                  No payments recorded yet.
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      {showPay && (
        <PaymentModal
          record={record}
          onClose={() => setShowPay(false)}
          onPaid={updated => { onUpdate(updated); setShowPay(false) }}
        />
      )}
    </>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function PayrollPage() {
  const { user } = useAuth()
  const [month,     setMonth]     = useState('2026-05')
  const [records,   setRecords]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [generating,setGenerating]= useState(false)

  async function load(m) {
    setLoading(true)
    try {
      const data = await getPayroll(m)
      setRecords(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(month) }, [month])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const data = await generatePayroll(month)
      setRecords(data)
    } catch (e) { console.error(e) }
    finally { setGenerating(false) }
  }

  function handleUpdate(updated) {
    setRecords(prev => prev.map(r => String(r._id) === String(updated._id) ? updated : r))
  }

  const stats = useMemo(() => {
    const totalWage    = records.reduce((s, r) => s + (r.netWagePaise ?? 0), 0)
    const totalPaid    = records.reduce((s, r) => s + (r.paidPaise    ?? 0), 0)
    const totalBalance = totalWage - totalPaid
    const pending      = records.filter(r => r.status === 'Pending').length
    const partial      = records.filter(r => r.status === 'Partially Paid').length
    const paid         = records.filter(r => r.status === 'Paid').length
    return { totalWage, totalPaid, totalBalance, pending, partial, paid }
  }, [records])

  const selectedLabel = MONTH_OPTIONS.find(o => o.value === month)?.label ?? month

  if (user?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-[#FFF3E8] dark:bg-[#2D1F0A] flex items-center justify-center">
          <AlertTriangle size={24} strokeWidth={1.75} className="text-accent" />
        </div>
        <p className="font-sora font-semibold text-[15px] text-body dark:text-white">Access Restricted</p>
        <p className="text-[13px] text-muted text-center max-w-sm">Payroll is available to Admin only.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-sora text-[20px] font-bold text-body dark:text-white">Worker Payroll</h1>
          <p className="text-[13px] text-muted dark:text-slate-400 mt-0.5">
            Daily wage tracking, attendance-based calculation &amp; payment recording
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month selector */}
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] transition-colors">
            {MONTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Generate / Refresh */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-navy hover:bg-primary rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap">
            {generating
              ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Generating…</>
              : <><RefreshCw size={14} strokeWidth={2} /> {records.length ? 'Refresh Payroll' : 'Generate Payroll'}</>
            }
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Payable',  value: fmtINR(stats.totalWage),    icon: IndianRupee, bg: 'bg-light-blue/60 dark:bg-[#1B2D4A]', color: 'text-primary dark:text-[#5B9BD5]'  },
          { label: 'Total Paid',     value: fmtINR(stats.totalPaid),    icon: CheckCircle2,bg: 'bg-[#F0FDF4] dark:bg-[#0A2318]',     color: 'text-[#15803d] dark:text-[#22c55e]'},
          { label: 'Balance Due',    value: fmtINR(stats.totalBalance), icon: AlertTriangle,bg:'bg-[#FEF2F2] dark:bg-[#2D0808]',    color: 'text-[#dc2626]'                    },
          { label: 'Workers',        value: `${stats.paid}/${records.length} paid`,
                                                                          icon: Users,        bg: 'bg-[#FFF3E8] dark:bg-[#2D1F0A]',   color: 'text-accent'                       },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-4 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
              <Icon size={17} strokeWidth={1.75} className={color} />
            </div>
            <div>
              <p className="font-sora text-[22px] font-bold text-body dark:text-white leading-none">{value}</p>
              <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payment notice */}
      <div className="bg-[#EBF3FB] dark:bg-[#1B2D4A]/50 rounded-xl border border-primary/20 px-5 py-3.5 flex items-start gap-3">
        <TrendingUp size={15} strokeWidth={1.75} className="text-primary shrink-0 mt-0.5" />
        <div className="text-[12px] text-primary dark:text-[#5B9BD5] leading-relaxed">
          <strong>Recording payments:</strong> Click <strong>Pay</strong> on any worker to log Cash, Bank Transfer, UPI or Cheque payments — partial payments are supported.
          {' '}<strong>Online disbursement</strong> (app-initiated bank transfer) can be added via Razorpay Payouts — contact your developer when ready.
        </div>
      </div>

      {/* Main table */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
          <div>
            <h3 className="font-sora font-semibold text-[14px] text-body dark:text-white">
              {selectedLabel} — Worker Wages
            </h3>
            <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">
              {records.length} worker{records.length !== 1 ? 's' : ''} · Click a row to see payment history · Click rate to edit
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <span className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span className="text-[13px] text-muted">Loading payroll…</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Calendar size={36} strokeWidth={1.25} className="text-muted/40" />
            <p className="text-[14px] font-semibold text-muted">No payroll for {selectedLabel}</p>
            <p className="text-[12px] text-muted/70">Click "Generate Payroll" to calculate wages from attendance.</p>
            <button onClick={handleGenerate} disabled={generating}
              className="mt-1 flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-navy hover:bg-primary rounded-xl transition-colors disabled:opacity-50">
              <RefreshCw size={14} strokeWidth={2} />
              Generate Payroll
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy">
                  {['Worker', 'Attendance', 'Daily Rate', 'Gross Wages', 'Paid', 'Balance', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap last:w-28">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record, i) => (
                  <WorkerRow key={String(record._id)} record={record} onUpdate={handleUpdate} idx={i} />
                ))}
              </tbody>
              {/* Footer totals */}
              <tfoot>
                <tr className="bg-[#F7F9FC] dark:bg-[#0F1219] border-t-2 border-[#EFEFEF] dark:border-[#2A3547]">
                  <td className="px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-widest" colSpan={3}>
                    Total ({records.length} workers)
                  </td>
                  <td className="px-5 py-3 text-[13px] font-bold text-body dark:text-white">{fmtINR(stats.totalWage)}</td>
                  <td className="px-5 py-3 text-[13px] font-bold text-[#15803d]">{fmtINR(stats.totalPaid)}</td>
                  <td className="px-5 py-3 text-[13px] font-bold text-[#dc2626]">{stats.totalBalance > 0 ? fmtINR(stats.totalBalance) : '—'}</td>
                  <td colSpan={2} className="px-5 py-3">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-[#15803d] font-semibold">{stats.paid} paid</span>
                      {stats.partial > 0 && <span className="text-accent font-semibold">· {stats.partial} partial</span>}
                      {stats.pending > 0 && <span className="text-[#dc2626] font-semibold">· {stats.pending} pending</span>}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
