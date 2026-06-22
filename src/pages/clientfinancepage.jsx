import { useState, useEffect, useMemo } from 'react'
import {
  IndianRupee, FileText, CreditCard, CheckCircle, Clock,
  AlertCircle, TrendingUp, Banknote, ChevronRight, Calendar,
  AlertTriangle, BookOpen, Download, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { getProjects }                        from '../api/projects'
import { getMilestones, getInvoices, getPayments, getQuotations, createPaymentOrder, verifyPayment } from '../api/finance'
import { projectToRow, formatINRCompact }     from '../utils/format'

/* ── load Razorpay checkout.js once ─────────────────────────────────────── */
function useRazorpayScript() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (window.Razorpay) { setReady(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => setReady(true)
    document.body.appendChild(s)
  }, [])
  return ready
}

/* ── helpers ────────────────────────────────────────────────────────────── */
const fmtINR = p => p == null ? '₹0' : '₹' + Math.round(p / 100).toLocaleString('en-IN')
const fmtAmt = n => n == null ? '₹0' : '₹' + Math.round(n).toLocaleString('en-IN')

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function daysFrom(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000)
}

/* ── status configs ──────────────────────────────────────────────────────── */
const INV_CFG = {
  Paid:    { bg: 'bg-[#F0FDF4]', text: 'text-[#15803d]', dot: 'bg-[#15803d]' },
  Pending: { bg: 'bg-[#FFF3E8]', text: 'text-[#E07B20]', dot: 'bg-[#E07B20]' },
  Overdue: { bg: 'bg-[#FEF2F2]', text: 'text-[#dc2626]', dot: 'bg-[#dc2626]' },
}
const PAY_CFG = {
  Cleared: { bg: 'bg-[#F0FDF4]', text: 'text-[#15803d]', dot: 'bg-[#15803d]' },
  Pending: { bg: 'bg-[#FFF3E8]', text: 'text-[#E07B20]', dot: 'bg-[#E07B20]' },
}
const QUOT_CFG = {
  Sent:     { bg: 'bg-[#D6E8F7]',  text: 'text-[#1B4F8A]', dot: 'bg-[#1B4F8A]'  },
  Approved: { bg: 'bg-[#F0FDF4]',  text: 'text-[#15803d]', dot: 'bg-[#15803d]'  },
  Rejected: { bg: 'bg-[#FEF2F2]',  text: 'text-[#dc2626]', dot: 'bg-[#dc2626]'  },
}
const MS_CFG = {
  Paid:    { bg: 'bg-[#F0FDF4]', text: 'text-[#15803d]', dot: '#15803d', ring: 'ring-[#15803d]', icon: CheckCircle },
  Overdue: { bg: 'bg-[#FEF2F2]', text: 'text-[#dc2626]', dot: '#dc2626', ring: 'ring-[#dc2626]', icon: AlertCircle },
  Pending: { bg: 'bg-[#F7F9FC]', text: 'text-[#777777]', dot: '#D6E8F7', ring: 'ring-[#D6E8F7]', icon: Clock       },
}

function StatusBadge({ status, cfg }) {
  const c = cfg[status] ?? { bg: 'bg-[#F7F9FC]', text: 'text-[#777777]', dot: 'bg-[#777777]' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{status}
    </span>
  )
}

/* ── KPI Card ────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, accent, subColor }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-sm overflow-hidden">
      <div className="h-[3px]" style={{ background: accent }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] font-semibold text-[#777777] uppercase tracking-[0.1em]">{label}</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: accent + '18' }}>
            <Icon size={16} strokeWidth={1.75} style={{ color: accent }} />
          </div>
        </div>
        <p className="font-sora text-[26px] font-bold leading-none" style={{ color: accent }}>{value}</p>
        {sub && <p className="text-[11px] mt-2" style={{ color: subColor ?? '#777777' }}>{sub}</p>}
      </div>
    </div>
  )
}

/* ── Budget Analyzer ─────────────────────────────────────────────────────── */
function BudgetAnalyzer({ budgetPaise, spentPaise, invoicedPaise, paidPaise }) {
  const budget   = Math.round(budgetPaise   / 100)
  const spent    = Math.round(spentPaise    / 100)
  const invoiced = Math.round(invoicedPaise / 100)
  const paid     = Math.round(paidPaise     / 100)
  const base     = budget || 1

  const rows = [
    { label: 'Total Budget',       value: budget,   pct: 100,                        color: '#1B4F8A', bg: '#D6E8F7' },
    { label: 'Project Spend',       value: spent,    pct: Math.min(100, Math.round(spent    / base * 100)), color: '#2E6DA4', bg: '#EFF6FF' },
    { label: 'Amount Invoiced',     value: invoiced, pct: Math.min(100, Math.round(invoiced / base * 100)), color: '#E07B20', bg: '#FFF3E8' },
    { label: 'Your Payments Made',  value: paid,     pct: Math.min(100, Math.round(paid     / base * 100)), color: '#15803d', bg: '#F0FDF4' },
  ]

  const chartData = [
    { name: 'Budget',   amount: budget   },
    { name: 'Spent',    amount: spent    },
    { name: 'Invoiced', amount: invoiced },
    { name: 'Paid',     amount: paid     },
  ]
  const COLORS = ['#1B4F8A', '#2E6DA4', '#E07B20', '#15803d']

  return (
    <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-sm p-5">
      <div className="mb-5">
        <h2 className="font-sora font-bold text-[15px] text-[#0F2340]">Budget vs Spending Analyzer</h2>
        <p className="text-[12px] text-[#777777] mt-0.5">How your project finances compare at a glance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress bars */}
        <div className="space-y-4">
          {rows.map(row => (
            <div key={row.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-medium text-[#333333]">{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#777777]">{row.pct}%</span>
                  <span className="text-[13px] font-bold font-sora" style={{ color: row.color }}>{fmtAmt(row.value)}</span>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full" style={{ background: row.bg }}>
                <div className="h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${row.pct}%`, background: row.color }} />
              </div>
            </div>
          ))}

          {/* Delta insight */}
          {budget > 0 && (
            <div className="mt-2 p-3 rounded-xl bg-[#F7F9FC] border border-[#E0E0E0]">
              {paid >= invoiced ? (
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-[#15803d]" />
                  <p className="text-[12px] text-[#15803d] font-medium">All invoiced amounts are fully paid — great!</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle size={13} className="text-[#E07B20]" />
                  <p className="text-[12px] text-[#777777]">
                    Balance due on invoices: <span className="font-bold text-[#E07B20]">{fmtAmt(invoiced - paid)}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bar chart */}
        <div>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={chartData} barCategoryGap="28%" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#AAAAAA' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#AAAAAA' }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} width={46} />
              <Tooltip
                formatter={v => [`₹${Math.round(v).toLocaleString('en-IN')}`, '']}
                contentStyle={{ borderRadius: 12, border: '1px solid #EFEFEF', fontSize: 12 }}
                cursor={{ fill: 'rgba(0,0,0,0.025)' }}
              />
              <Bar dataKey="amount" radius={[5, 5, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ── Milestone Timeline ──────────────────────────────────────────────────── */
function MilestoneTimeline({ milestones }) {
  const sorted = [...milestones].sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
  const totalPaise = milestones.reduce((s, m) => s + (m.amountPaise ?? 0), 0)
  const paidPaise  = milestones.filter(m => m.status === 'Paid').reduce((s, m) => s + (m.amountPaise ?? 0), 0)
  const paidPct    = totalPaise ? Math.round((paidPaise / totalPaise) * 100) : 0

  if (milestones.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-sm p-8 flex flex-col items-center gap-2">
        <Banknote size={28} strokeWidth={1.25} className="text-[#777777]/40" />
        <p className="text-[13px] font-medium text-[#777777]">No payment milestones set yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#F0F4F8]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-sora font-bold text-[15px] text-[#0F2340]">Payment Schedule</h2>
            <p className="text-[12px] text-[#777777] mt-0.5">
              {milestones.filter(m => m.status === 'Paid').length} of {milestones.length} milestones paid
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#777777]">Settled</p>
            <p className="font-sora font-bold text-[18px] text-[#15803d]">{fmtINR(paidPaise)}</p>
            <p className="text-[10px] text-[#777777]">of {fmtINR(totalPaise)}</p>
          </div>
        </div>
        {/* Overall progress */}
        <div>
          <div className="flex justify-between text-[10px] text-[#777777] mb-1">
            <span>Payment progress</span><span>{paidPct}%</span>
          </div>
          <div className="w-full h-2 bg-[#F0F4F8] rounded-full">
            <div className="h-2 bg-[#15803d] rounded-full transition-all duration-700" style={{ width: `${paidPct}%` }} />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 py-5">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[#E0E6F0]" />

          <div className="space-y-0">
            {sorted.map((m, i) => {
              const cfg  = MS_CFG[m.status] ?? MS_CFG.Pending
              const Icon = cfg.icon
              const days = daysFrom(m.dueDate)
              const isPaid = m.status === 'Paid'
              const isOverdue = m.status === 'Overdue' || (days !== null && days < 0 && !isPaid)

              let dueLabel = ''
              if (isPaid) {
                dueLabel = `Paid · ${fmtDate(m.dueDate)}`
              } else if (isOverdue) {
                dueLabel = `${Math.abs(days ?? m.daysOverdue ?? 0)} day${Math.abs(days ?? 1) !== 1 ? 's' : ''} overdue`
              } else if (days !== null && days === 0) {
                dueLabel = 'Due today'
              } else if (days !== null && days > 0) {
                dueLabel = `Due in ${days} days · ${fmtDate(m.dueDate)}`
              } else {
                dueLabel = fmtDate(m.dueDate)
              }

              return (
                <div key={String(m._id)} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Node */}
                  <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ring-2 ${cfg.ring} ${isPaid ? 'bg-[#F0FDF4]' : isOverdue ? 'bg-[#FEF2F2]' : 'bg-[#F7F9FC]'}`}>
                    <Icon size={14} style={{ color: cfg.dot }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-[13px] font-semibold leading-tight ${isPaid ? 'text-[#777777]' : 'text-[#333333]'}`}>{m.label}</p>
                        <p className={`text-[11px] mt-0.5 font-medium ${isPaid ? 'text-[#15803d]' : isOverdue ? 'text-[#dc2626]' : 'text-[#777777]'}`}>
                          {dueLabel}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-[15px] font-bold font-sora ${isPaid ? 'text-[#15803d]' : isOverdue ? 'text-[#dc2626]' : 'text-[#0F2340]'}`}>
                          {fmtINR(m.amountPaise)}
                        </p>
                        <div className="mt-0.5">
                          <StatusBadge status={m.status} cfg={MS_CFG} />
                        </div>
                      </div>
                    </div>
                    {/* Amount as % of total */}
                    {totalPaise > 0 && (
                      <div className="mt-2">
                        <div className="w-full h-1 bg-[#F0F4F8] rounded-full">
                          <div className="h-1 rounded-full transition-all"
                            style={{
                              width: `${Math.round((m.amountPaise / totalPaise) * 100)}%`,
                              background: isPaid ? '#15803d' : isOverdue ? '#dc2626' : '#D6E8F7',
                            }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Invoice row ─────────────────────────────────────────────────────────── */
function InvoiceRow({ inv, idx, onPayNow, paying }) {
  const overdueDays = inv.status === 'Overdue' && inv.dueDate ? Math.abs(daysFrom(inv.dueDate) ?? 0) : 0
  const canPay = inv.status === 'Pending' || inv.status === 'Overdue'
  return (
    <tr className={`border-b border-[#F4F4F4] last:border-0 hover:bg-[#D6E8F7]/20 transition-colors ${idx % 2 === 1 ? 'bg-[#FAFBFC]' : 'bg-white'}`}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#D6E8F7] flex items-center justify-center shrink-0">
            <FileText size={12} className="text-[#1B4F8A]" />
          </div>
          <span className="text-[13px] font-semibold text-[#1B4F8A]">{inv.invoiceNumber ?? inv._id?.toString().slice(-6)}</span>
        </div>
      </td>
      <td className="px-5 py-3.5 text-[12px] text-[#777777]">{fmtDate(inv.issueDate)}</td>
      <td className="px-5 py-3.5 text-[12px] text-[#777777]">
        {inv.dueDate ? (
          <span className={inv.status === 'Overdue' ? 'text-[#dc2626] font-medium' : ''}>{fmtDate(inv.dueDate)}</span>
        ) : '—'}
        {overdueDays > 0 && <span className="ml-1 text-[10px] text-[#dc2626]">({overdueDays}d overdue)</span>}
      </td>
      <td className="px-5 py-3.5">
        <span className="text-[14px] font-bold font-sora text-[#0F2340]">{fmtINR(inv.amountPaise)}</span>
      </td>
      <td className="px-5 py-3.5"><StatusBadge status={inv.status} cfg={INV_CFG} /></td>
      <td className="px-5 py-3.5">
        {canPay && (
          <button
            onClick={() => onPayNow(inv)}
            disabled={paying === inv._id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#E07B20] text-white hover:bg-[#c96d18] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CreditCard size={11} />
            {paying === inv._id ? 'Opening…' : 'Pay Now'}
          </button>
        )}
      </td>
    </tr>
  )
}

/* ── Payment row ─────────────────────────────────────────────────────────── */
function PaymentRow({ pay, idx }) {
  const METHOD_ICON = { 'UPI': '📱', 'NEFT': '🏦', 'Cash': '💵', 'Cheque': '📄', 'Bank Transfer': '🏦' }
  return (
    <tr className={`border-b border-[#F4F4F4] last:border-0 hover:bg-[#F0FDF4]/40 transition-colors ${idx % 2 === 1 ? 'bg-[#FAFBFC]' : 'bg-white'}`}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] flex items-center justify-center shrink-0">
            <CreditCard size={12} className="text-[#15803d]" />
          </div>
          <span className="text-[13px] font-semibold text-[#15803d]">{pay.paymentNumber ?? pay._id?.toString().slice(-6)}</span>
        </div>
      </td>
      <td className="px-5 py-3.5 text-[12px] text-[#777777]">{fmtDate(pay.paymentDate)}</td>
      <td className="px-5 py-3.5">
        <span className="text-[14px] font-bold font-sora text-[#15803d]">{fmtINR(pay.amountPaise)}</span>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-[12px] text-[#333333]">
          {METHOD_ICON[pay.method] ?? ''} {pay.method ?? '—'}
        </span>
      </td>
      <td className="px-5 py-3.5"><StatusBadge status={pay.status ?? 'Cleared'} cfg={PAY_CFG} /></td>
    </tr>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function ClientFinancePage() {
  const [project,    setProject]    = useState({ budgetRaw: 0, spentRaw: 0 })
  const [milestones, setMilestones] = useState([])
  const [invoices,   setInvoices]   = useState([])
  const [payments,   setPayments]   = useState([])
  const [quotations, setQuotations] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState('invoices')
  const [payingId,   setPayingId]   = useState(null)
  const [payResult,  setPayResult]  = useState(null) // { success, message }
  const razorpayReady = useRazorpayScript()

  useEffect(() => {
    getProjects()
      .then(ps => { if (ps?.[0]) setProject(projectToRow(ps[0])) })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const pid = project.id ?? project._id
    if (!pid) return
    setLoading(true)
    Promise.all([
      getMilestones({ projectId: pid }),
      getInvoices({ projectId: pid }),
      getPayments({ projectId: pid }),
      getQuotations({ projectId: pid }),
    ])
      .then(([m, i, p, q]) => {
        setMilestones(m ?? [])
        setInvoices(i ?? [])
        setPayments(p ?? [])
        setQuotations(q ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [project.id, project._id])

  /* derived totals */
  const totalInvoicedPaise = useMemo(
    () => invoices.reduce((s, i) => s + (i.amountPaise ?? 0), 0),
    [invoices]
  )
  const totalPaidPaise = useMemo(
    () => payments.filter(p => p.status === 'Cleared').reduce((s, p) => s + (p.amountPaise ?? 0), 0),
    [payments]
  )
  const balancePaise = useMemo(
    () => Math.max(0, totalInvoicedPaise - totalPaidPaise),
    [totalInvoicedPaise, totalPaidPaise]
  )
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue')

  const TABS = [
    { id: 'invoices',   label: 'Invoices',   count: invoices.length,   icon: FileText   },
    { id: 'payments',   label: 'Payments',   count: payments.length,   icon: CreditCard },
    { id: 'quotations', label: 'Quotations', count: quotations.length, icon: BookOpen   },
  ]

  async function handlePayNow(inv) {
    if (!razorpayReady) return
    setPayingId(inv._id)
    try {
      const order = await createPaymentOrder(inv._id)
      const options = {
        key:         order.keyId,
        amount:      order.amount,
        currency:    order.currency,
        name:        'Square Interiors',
        description: `Invoice ${order.invoice.number}`,
        order_id:    order.orderId,
        theme:       { color: '#1B4F8A' },
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              invoiceId:           inv._id,
            })
            setPayResult({ success: true, message: `Payment of ${fmtINR(inv.amountPaise)} successful!` })
            // Refresh data
            const pid = project.id ?? project._id
            const [newInv, newPay] = await Promise.all([
              getInvoices({ projectId: pid }),
              getPayments({ projectId: pid }),
            ])
            setInvoices(newInv ?? [])
            setPayments(newPay ?? [])
          } catch {
            setPayResult({ success: false, message: 'Payment verification failed. Please contact support.' })
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => {
        setPayResult({ success: false, message: 'Payment failed. Please try again.' })
        setPayingId(null)
      })
      rzp.open()
    } catch (err) {
      setPayResult({ success: false, message: err.message || 'Could not initiate payment.' })
    } finally {
      setPayingId(null)
    }
  }

  if (loading && !project.name) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-[#D6E8F7] border-t-[#1B4F8A] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Payment result toast ───────────────────────────────────────── */}
      {payResult && (
        <div className={`rounded-xl px-5 py-3 flex items-center justify-between shadow-sm ${payResult.success ? 'bg-[#F0FDF4] border border-[#bbf7d0]' : 'bg-[#FEF2F2] border border-[#fecaca]'}`}>
          <div className="flex items-center gap-2.5">
            {payResult.success
              ? <CheckCircle size={16} className="text-[#15803d]" />
              : <AlertCircle size={16} className="text-[#dc2626]" />}
            <span className={`text-[13px] font-medium ${payResult.success ? 'text-[#15803d]' : 'text-[#dc2626]'}`}>{payResult.message}</span>
          </div>
          <button onClick={() => setPayResult(null)} className="text-[#777777] hover:text-[#333333] text-[18px] leading-none">&times;</button>
        </div>
      )}

      {/* ── Alert: overdue ─────────────────────────────────────────────── */}
      {overdueInvoices.length > 0 && (
        <div className="bg-[#dc2626] text-white rounded-xl px-5 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} />
            <span className="text-[13px] font-medium">
              {overdueInvoices.length === 1
                ? `Invoice ${overdueInvoices[0].invoiceNumber} is overdue — ${fmtINR(overdueInvoices[0].amountPaise)}`
                : `${overdueInvoices.length} invoices are overdue. Please settle them to avoid delays.`}
            </span>
          </div>
          <span className="text-[12px] font-semibold opacity-80">Contact: billing@squareinteriors.in</span>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-sora font-bold text-[22px] text-[#0F2340] leading-tight">Project Finances</h1>
        <p className="text-[13px] text-[#777777] mt-0.5">{project.name || 'Your Project'} · Complete financial overview</p>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Budget"
          value={formatINRCompact(project.budgetRaw ?? 0)}
          sub={`${project.budgetRaw ? Math.round((project.spentRaw / project.budgetRaw) * 100) : 0}% of budget used`}
          icon={TrendingUp}
          accent="#1B4F8A"
        />
        <KpiCard
          label="Amount Invoiced"
          value={fmtINR(totalInvoicedPaise)}
          sub={`${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} raised`}
          icon={FileText}
          accent="#E07B20"
        />
        <KpiCard
          label="Payments Made"
          value={fmtINR(totalPaidPaise)}
          sub={`${payments.filter(p => p.status === 'Cleared').length} payment${payments.filter(p => p.status === 'Cleared').length !== 1 ? 's' : ''} cleared`}
          icon={CreditCard}
          accent="#15803d"
        />
        <KpiCard
          label="Balance Due"
          value={fmtINR(balancePaise)}
          sub={balancePaise === 0 ? 'All invoices settled' : `${overdueInvoices.length > 0 ? overdueInvoices.length + ' overdue' : 'outstanding'}`}
          icon={balancePaise > 0 ? AlertTriangle : CheckCircle}
          accent={balancePaise > 0 ? '#dc2626' : '#15803d'}
          subColor={balancePaise > 0 ? '#dc2626' : '#15803d'}
        />
      </div>

      {/* ── Budget Analyzer ────────────────────────────────────────────── */}
      <BudgetAnalyzer
        budgetPaise={project.budgetRaw ? project.budgetRaw * 100 : 0}
        spentPaise={project.spentRaw ? project.spentRaw * 100 : 0}
        invoicedPaise={totalInvoicedPaise}
        paidPaise={totalPaidPaise}
      />

      {/* ── Payment Milestone Schedule ─────────────────────────────────── */}
      <MilestoneTimeline milestones={milestones} />

      {/* ── Tabbed transactions ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-sm overflow-hidden">

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-[#F0F4F8]">
          {TABS.map(({ id, label, count, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={[
                'flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-[13px] font-medium transition-all border-b-2 -mb-px',
                tab === id
                  ? 'text-[#1B4F8A] border-[#1B4F8A] bg-[#D6E8F7]/40'
                  : 'text-[#777777] border-transparent hover:text-[#333333] hover:bg-[#F7F9FC]',
              ].join(' ')}>
              <Icon size={14} strokeWidth={1.75} />
              {label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-[#1B4F8A] text-white' : 'bg-[#F0F2F5] text-[#777777]'}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Invoices ── */}
        {tab === 'invoices' && (
          invoices.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <FileText size={28} strokeWidth={1.25} className="text-[#777777]/40" />
              <p className="text-[13px] text-[#777777] font-medium">No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0F2340]">
                    {['Invoice No.', 'Issue Date', 'Due Date', 'Amount', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...invoices].sort((a, b) => (b.issueDate > a.issueDate ? 1 : -1)).map((inv, i) => (
                    <InvoiceRow key={String(inv._id)} inv={inv} idx={i} onPayNow={handlePayNow} paying={payingId} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ── Payments ── */}
        {tab === 'payments' && (
          payments.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <CreditCard size={28} strokeWidth={1.25} className="text-[#777777]/40" />
              <p className="text-[13px] text-[#777777] font-medium">No payments recorded yet</p>
            </div>
          ) : (
            <>
              {/* Payment summary strip */}
              <div className="px-5 py-3 bg-[#F0FDF4] border-b border-[#dcfce7] flex items-center gap-6">
                <div>
                  <p className="text-[10px] text-[#777777] uppercase tracking-wider">Total Received</p>
                  <p className="text-[16px] font-bold font-sora text-[#15803d]">{fmtINR(totalPaidPaise)}</p>
                </div>
                <div className="w-px h-8 bg-[#bbf7d0]" />
                <div>
                  <p className="text-[10px] text-[#777777] uppercase tracking-wider">Transactions</p>
                  <p className="text-[16px] font-bold font-sora text-[#15803d]">{payments.length}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0F2340]">
                      {['Payment No.', 'Date', 'Amount', 'Method', 'Status'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...payments].sort((a, b) => (b.paymentDate > a.paymentDate ? 1 : -1)).map((pay, i) => (
                      <PaymentRow key={String(pay._id)} pay={pay} idx={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}

        {/* ── Quotations ── */}
        {tab === 'quotations' && (
          quotations.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <BookOpen size={28} strokeWidth={1.25} className="text-[#777777]/40" />
              <p className="text-[13px] text-[#777777] font-medium">No quotations issued yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0F2340]">
                    {['Quotation No.', 'Issue Date', 'Valid Until', 'Amount', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...quotations].sort((a, b) => (b.issueDate > a.issueDate ? 1 : -1)).map((q, i) => (
                    <tr key={String(q._id)} className={`border-b border-[#F4F4F4] last:border-0 hover:bg-[#D6E8F7]/20 transition-colors ${i % 2 === 1 ? 'bg-[#FAFBFC]' : 'bg-white'}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#FFF3E8] flex items-center justify-center shrink-0">
                            <BookOpen size={12} className="text-[#E07B20]" />
                          </div>
                          <span className="text-[13px] font-semibold text-[#E07B20]">{q.quotationNumber ?? q._id?.toString().slice(-6)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-[#777777]">{fmtDate(q.issueDate)}</td>
                      <td className="px-5 py-3.5 text-[12px] text-[#777777]">{fmtDate(q.validUntil)}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[14px] font-bold font-sora text-[#0F2340]">{fmtINR(q.amountPaise)}</span>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={q.status} cfg={QUOT_CFG} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Footer note */}
        <div className="px-5 py-3 bg-[#F7F9FC] border-t border-[#F0F4F8] flex items-center justify-between">
          <p className="text-[11px] text-[#777777]">For billing queries, contact <span className="font-medium text-[#1B4F8A]">billing@squareinteriors.in</span></p>
          <p className="text-[11px] text-[#777777]">All amounts include applicable GST</p>
        </div>
      </div>
    </div>
  )
}
