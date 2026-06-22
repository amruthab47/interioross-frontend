import { useState, useEffect, useMemo } from 'react'
import {
  Layers, Palette, Grid, Info, Lock,
  Package, CheckCircle2, XCircle, X, ExternalLink,
  Truck, ClipboardList, Plus, ChevronDown, ChevronUp,
  Building2, Star, Phone, Calendar, IndianRupee,
  AlertTriangle, Clock, CheckCheck, Ban, Minus,
} from 'lucide-react'
import { getMaterials, getColorPalettes } from '../api/catalog'
import { getAllMoodBoards } from '../api/designs'
import { getProjects } from '../api/projects'
import { getVendors } from '../api/vendors'
import { getPurchaseOrders, createPurchaseOrder, updatePurchaseOrder } from '../api/purchaseOrders'
import { projectToRow } from '../utils/format'

const TABS = [
  { id: 'orders',     label: 'Purchase Orders', icon: Truck        },
  { id: 'moodboards', label: 'Mood Boards',     icon: Layers       },
  { id: 'palettes',   label: 'Color Palettes',  icon: Palette      },
  { id: 'materials',  label: 'Catalog',         icon: Grid         },
]

const MAT_CATEGORIES = ['All', 'Flooring', 'Wall', 'Ceiling']

const DURABILITY_CFG = {
  High:   { bg: '#F0FDF4', text: '#15803d' },
  Medium: { bg: '#FFF3E8', text: '#E07B20' },
  Low:    { bg: '#FEF2F2', text: '#dc2626' },
}

const ORDER_STEPS = ['Ordered', 'Shipped', 'Partially Delivered', 'Delivered']

const ORDER_STATUS_CFG = {
  Draft:               { bg: '#F7F9FC', text: '#777777', dot: '#AAAAAA',  label: 'Draft'                },
  Ordered:             { bg: '#EBF4FF', text: '#1B4F8A', dot: '#1B4F8A',  label: 'Ordered'              },
  Shipped:             { bg: '#FFF3E8', text: '#E07B20', dot: '#E07B20',  label: 'Shipped'              },
  'Partially Delivered':{ bg: '#F5F3FF', text: '#7C3AED', dot: '#7C3AED', label: 'Partially Delivered'  },
  Delivered:           { bg: '#F0FDF4', text: '#15803d', dot: '#15803d',  label: 'Delivered'            },
  Cancelled:           { bg: '#FEF2F2', text: '#dc2626', dot: '#dc2626',  label: 'Cancelled'            },
}

const PAY_STATUS_CFG = {
  Pending:           { bg: '#FEF2F2', text: '#dc2626', label: 'Pending'        },
  'Partially Paid':  { bg: '#FFF3E8', text: '#E07B20', label: 'Partially Paid' },
  Paid:              { bg: '#F0FDF4', text: '#15803d', label: 'Paid'           },
}

function fmtINR(paise) {
  if (!paise) return '₹0'
  return '₹' + Math.round(paise / 100).toLocaleString('en-IN')
}
function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ── small badge ── */
function Badge({ status, cfg }) {
  const s = cfg[status]
  if (!s) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
      style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.text }} />
      {s.label}
    </span>
  )
}

/* ── Status pipeline ── */
function StatusPipeline({ status }) {
  if (status === 'Draft' || status === 'Cancelled') {
    return (
      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
        style={{ background: ORDER_STATUS_CFG[status].bg, color: ORDER_STATUS_CFG[status].text }}>
        {status}
      </span>
    )
  }
  const currentIdx = ORDER_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-0">
      {ORDER_STEPS.map((step, i) => {
        const done    = i < currentIdx
        const active  = i === currentIdx
        const pending = i > currentIdx
        return (
          <div key={step} className="flex items-center">
            {i > 0 && (
              <div className={`w-6 h-[2px] ${done ? 'bg-[#1B4F8A]' : 'bg-[#DDDDDD] dark:bg-[#2A3547]'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
                done   ? 'bg-[#1B4F8A] text-white' :
                active ? 'bg-[#E07B20] text-white ring-2 ring-[#E07B20]/30' :
                         'bg-[#F0F2F5] dark:bg-[#1F2937] text-muted'
              }`}>
                {done ? <CheckCheck size={10} strokeWidth={2.5} /> : i + 1}
              </div>
              <span className={`text-[9px] whitespace-nowrap font-medium ${
                active ? 'text-[#E07B20]' : done ? 'text-body dark:text-slate-300' : 'text-muted'
              }`}>{step.split(' ')[0]}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── New PO Modal ── */
function NewPOModal({ onClose, onSaved, projects, vendors }) {
  const [form, setForm] = useState({ projectId: '', vendorId: '', orderDate: new Date().toISOString().split('T')[0], expectedDeliveryDate: '', notes: '' })
  const [items, setItems] = useState([{ materialName: '', quantity: 1, unit: 'unit', unitPricePaise: '' }])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function setItem(i, k, v) { setItems(a => a.map((it, idx) => idx === i ? { ...it, [k]: v } : it)) }
  function addItem() { setItems(a => [...a, { materialName: '', quantity: 1, unit: 'unit', unitPricePaise: '' }]) }
  function removeItem(i) { setItems(a => a.filter((_, idx) => idx !== i)) }

  // unitPricePaise field holds rupees in the form; multiply for display
  const totalRupees = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPricePaise) || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.projectId || !form.vendorId) { setErr('Select a project and vendor.'); return }
    const filledItems = items.filter(it => it.materialName.trim())
    if (!filledItems.length) { setErr('Add at least one material.'); return }
    setSaving(true); setErr('')
    try {
      const payload = {
        ...form,
        items: filledItems.map(it => ({
          materialName:   it.materialName,
          quantity:       Number(it.quantity) || 0,
          unit:           it.unit,
          unitPricePaise: Math.round((Number(it.unitPricePaise) || 0) * 100), // rupees → paise
        })),
      }
      const saved = await createPurchaseOrder(payload)
      onSaved(saved)
      onClose()
    } catch (e) { setErr(e.message || 'Failed to create PO.') }
    finally { setSaving(false) }
  }

  const f = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-muted transition-colors'
  const l = 'block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-2xl w-full max-w-[680px] max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF] dark:border-[#1F2937] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FFF3E8] flex items-center justify-center">
              <Truck size={14} strokeWidth={2} className="text-accent" />
            </div>
            <h3 className="font-sora font-semibold text-[15px] text-body dark:text-white">New Purchase Order</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] transition-colors">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={l}>Project <span className="text-[#dc2626]">*</span></label>
              <select required value={form.projectId} onChange={e => set('projectId', e.target.value)} className={f}>
                <option value="">— Select project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={l}>Vendor / Supplier <span className="text-[#dc2626]">*</span></label>
              <select required value={form.vendorId} onChange={e => set('vendorId', e.target.value)} className={f}>
                <option value="">— Select vendor —</option>
                {vendors.map(v => <option key={v._id} value={v._id}>{v.name} ({v.trade})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={l}>Order Date</label>
              <input type="date" value={form.orderDate} onChange={e => set('orderDate', e.target.value)} className={f} />
            </div>
            <div>
              <label className={l}>Expected Delivery</label>
              <input type="date" value={form.expectedDeliveryDate} onChange={e => set('expectedDeliveryDate', e.target.value)} className={f} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={l + ' mb-0'}>Materials <span className="text-[#dc2626]">*</span></label>
              <button type="button" onClick={addItem} className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-mid-blue transition-colors">
                <Plus size={11} strokeWidth={2.5} /> Add row
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-[#EFEFEF] dark:border-[#2A3547]">
              <div className="grid grid-cols-[1fr_80px_80px_110px_32px] bg-navy">
                {['Material Name', 'Qty', 'Unit', 'Unit Price (₹)', ''].map((h, i) => (
                  <div key={i} className="px-3 py-2 text-[10px] font-semibold text-white uppercase tracking-widest">{h}</div>
                ))}
              </div>
              {items.map((it, i) => (
                <div key={i} className={`grid grid-cols-[1fr_80px_80px_110px_32px] ${i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : ''}`}>
                  <input type="text" placeholder="e.g. Gypsum board 12mm" value={it.materialName}
                    onChange={e => setItem(i, 'materialName', e.target.value)}
                    className="px-3 py-2 text-[13px] text-body dark:text-slate-200 bg-transparent border-0 border-b border-[#EFEFEF] dark:border-[#2A3547] focus:outline-none placeholder:text-muted" />
                  <input type="number" min="1" value={it.quantity}
                    onChange={e => setItem(i, 'quantity', e.target.value)}
                    className="px-3 py-2 text-[13px] text-body dark:text-slate-200 bg-transparent border-0 border-b border-l border-[#EFEFEF] dark:border-[#2A3547] focus:outline-none text-right" />
                  <input type="text" placeholder="unit" value={it.unit}
                    onChange={e => setItem(i, 'unit', e.target.value)}
                    className="px-3 py-2 text-[13px] text-body dark:text-slate-200 bg-transparent border-0 border-b border-l border-[#EFEFEF] dark:border-[#2A3547] focus:outline-none placeholder:text-muted" />
                  <input type="number" min="0" placeholder="0" value={it.unitPricePaise}
                    onChange={e => setItem(i, 'unitPricePaise', e.target.value)}
                    className="px-3 py-2 text-[13px] text-body dark:text-slate-200 bg-transparent border-0 border-b border-l border-[#EFEFEF] dark:border-[#2A3547] focus:outline-none text-right" />
                  <div className="flex items-center justify-center border-b border-l border-[#EFEFEF] dark:border-[#2A3547]">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-muted hover:text-[#dc2626] transition-colors p-1">
                        <X size={11} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-right text-[13px] font-bold text-body dark:text-white mt-2">
              Total: ₹{totalRupees.toLocaleString('en-IN')}
            </p>
          </div>

          <div>
            <label className={l}>Notes <span className="text-muted font-normal normal-case tracking-normal">(optional)</span></label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Special instructions, delivery address, etc."
              className={`${f} resize-none`} />
          </div>

          {err && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] dark:bg-[#2D0808]/50 px-3 py-2 rounded-lg">{err}</p>}
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-[#F0F2F5] dark:border-[#1F2937] shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-primary hover:text-primary transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-navy hover:bg-primary rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Creating…</> : 'Create Purchase Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Update Status Modal ── */
function UpdateStatusModal({ order, onClose, onUpdated }) {
  const [orderStatus,  setOrderStatus]  = useState(order.orderStatus)
  const [payStatus,    setPayStatus]    = useState(order.paymentStatus)
  const [paidAmt,      setPaidAmt]      = useState(Math.round((order.paidAmountPaise ?? 0) / 100))
  const [deliveryDate, setDeliveryDate] = useState(order.actualDeliveryDate ?? '')
  const [eventNote,    setEventNote]    = useState('')
  const [saving,       setSaving]       = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const body = {
        orderStatus, paymentStatus: payStatus,
        paidAmountPaise: Math.round(paidAmt * 100),
        actualDeliveryDate: deliveryDate,
      }
      if (eventNote.trim()) {
        body.addEvent = {
          date: new Date().toISOString().split('T')[0],
          event: eventNote.trim(),
          notes: '',
        }
      }
      const updated = await updatePurchaseOrder(order._id, body)
      onUpdated(updated)
      onClose()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const f = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] transition-colors'
  const l = 'block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-2xl w-full max-w-[460px]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <h3 className="font-sora font-semibold text-[15px] text-body dark:text-white">Update {order.poNumber}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] transition-colors">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={l}>Order Status</label>
              <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)} className={f}>
                {['Draft','Ordered','Shipped','Partially Delivered','Delivered','Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={l}>Payment Status</label>
              <select value={payStatus} onChange={e => setPayStatus(e.target.value)} className={f}>
                {['Pending','Partially Paid','Paid'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={l}>Amount Paid (₹)</label>
              <input type="number" min="0" value={paidAmt} onChange={e => setPaidAmt(e.target.value)} className={f} />
            </div>
            <div>
              <label className={l}>Actual Delivery Date</label>
              <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className={f} />
            </div>
          </div>
          <div>
            <label className={l}>Add Tracking Event <span className="text-muted font-normal normal-case tracking-normal">(optional)</span></label>
            <input type="text" placeholder="e.g. Shipment dispatched from vendor"
              value={eventNote} onChange={e => setEventNote(e.target.value)} className={f} />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-[#F0F2F5] dark:border-[#1F2937]">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-primary hover:text-primary transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-xl transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── PO Card (expandable) ── */
function POCard({ order, onUpdate, materialCatalog }) {
  const [expanded, setExpanded] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)

  const paid     = order.paidAmountPaise ?? 0
  const total    = order.totalAmountPaise ?? 0
  const payPct   = total ? Math.round((paid / total) * 100) : 0
  const vendor   = order.vendorId
  const project  = order.projectId

  return (
    <>
      <div className={`bg-white dark:bg-[#141B27] rounded-2xl border transition-all duration-200 shadow-sm ${
        expanded ? 'border-primary/40 shadow-md' : 'border-[#EFEFEF] dark:border-[#1F2937] hover:border-primary/30 hover:shadow-md'
      }`}>
        {/* Card header — always visible */}
        <div
          className="flex items-start gap-4 px-5 py-4 cursor-pointer select-none"
          onClick={() => setExpanded(e => !e)}>

          {/* Status icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: ORDER_STATUS_CFG[order.orderStatus]?.bg ?? '#F7F9FC' }}>
            <Truck size={17} strokeWidth={1.75} style={{ color: ORDER_STATUS_CFG[order.orderStatus]?.dot ?? '#AAA' }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-sora font-bold text-[14px] text-body dark:text-white">{order.poNumber}</span>
              <span className="text-[11px] text-muted dark:text-slate-400">·</span>
              <span className="text-[13px] font-medium text-body dark:text-slate-200">{project?.name ?? '—'}</span>
              <Badge status={order.orderStatus}  cfg={ORDER_STATUS_CFG} />
              <Badge status={order.paymentStatus} cfg={PAY_STATUS_CFG} />
            </div>

            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-[12px] text-muted dark:text-slate-400">
                <Building2 size={11} strokeWidth={1.75} className="shrink-0" />
                {vendor?.name ?? '—'}
                {vendor?.trade && <span className="text-[10px] text-muted/60">({vendor.trade})</span>}
              </span>
              <span className="flex items-center gap-1.5 text-[12px] text-muted dark:text-slate-400">
                <Calendar size={11} strokeWidth={1.75} className="shrink-0" />
                Ordered {fmtDate(order.orderDate)}
              </span>
              {order.expectedDeliveryDate && (
                <span className="flex items-center gap-1.5 text-[12px] text-muted dark:text-slate-400">
                  <Truck size={11} strokeWidth={1.75} className="shrink-0" />
                  Expected {fmtDate(order.expectedDeliveryDate)}
                </span>
              )}
            </div>

            {/* Pipeline + payment bar */}
            <div className="flex items-center gap-5 mt-2.5 flex-wrap">
              <StatusPipeline status={order.orderStatus} />
              <div className="flex items-center gap-2 min-w-[160px]">
                <div className="flex-1 h-1.5 bg-[#F0F2F5] dark:bg-[#2A3547] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${payPct}%`, background: payPct === 100 ? '#15803d' : '#E07B20' }} />
                </div>
                <span className="text-[11px] font-semibold text-body dark:text-slate-200 whitespace-nowrap">
                  {fmtINR(paid)} / {fmtINR(total)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); setShowUpdate(true) }}
              className="px-3 py-1.5 text-[11px] font-semibold text-primary border border-primary/30 hover:bg-light-blue/40 dark:hover:bg-[#1B2D4A]/60 rounded-lg transition-colors">
              Update
            </button>
            <div className="text-muted">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t border-[#F0F2F5] dark:border-[#1F2937] px-5 py-4 space-y-5">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Items table */}
              <div>
                <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2.5">Materials Ordered</p>
                <div className="rounded-xl overflow-hidden border border-[#EFEFEF] dark:border-[#2A3547]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F7F9FC] dark:bg-[#0F1219]">
                        {['Material', 'Qty', 'Unit Price', 'Total'].map(h => (
                          <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items ?? []).map((it, i) => (
                        <tr key={i} className={`border-t border-[#F0F2F5] dark:border-[#1F2937] ${i % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : ''}`}>
                          <td className="px-3 py-2.5 text-[12px] font-medium text-body dark:text-slate-200">{it.materialName}</td>
                          <td className="px-3 py-2.5 text-[12px] text-muted">{it.quantity} {it.unit}</td>
                          <td className="px-3 py-2.5 text-[12px] text-muted">{fmtINR(it.unitPricePaise)}</td>
                          <td className="px-3 py-2.5 text-[12px] font-semibold text-body dark:text-white">{fmtINR(it.totalPaise)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#F7F9FC] dark:bg-[#0F1219] border-t-2 border-[#EFEFEF] dark:border-[#2A3547]">
                        <td colSpan={3} className="px-3 py-2.5 text-[11px] font-semibold text-muted uppercase tracking-widest">Total</td>
                        <td className="px-3 py-2.5 text-[13px] font-bold text-body dark:text-white">{fmtINR(order.totalAmountPaise)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Payment summary */}
                <div className="mt-3 p-3.5 rounded-xl bg-[#F7F9FC] dark:bg-[#0F1219] border border-[#EFEFEF] dark:border-[#1F2937]">
                  <div className="flex items-center justify-between text-[12px] mb-2">
                    <span className="text-muted dark:text-slate-400">Amount Paid</span>
                    <span className="font-semibold text-[#15803d]">{fmtINR(order.paidAmountPaise)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] mb-2">
                    <span className="text-muted dark:text-slate-400">Balance Due</span>
                    <span className={`font-semibold ${(order.totalAmountPaise - order.paidAmountPaise) > 0 ? 'text-[#dc2626]' : 'text-[#15803d]'}`}>
                      {fmtINR(order.totalAmountPaise - (order.paidAmountPaise ?? 0))}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#EFEFEF] dark:bg-[#2A3547] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${payPct}%`, background: payPct === 100 ? '#15803d' : '#E07B20' }} />
                  </div>
                </div>

                {/* Vendor card */}
                {vendor && (
                  <div className="mt-3 p-3.5 rounded-xl border border-[#EFEFEF] dark:border-[#1F2937] bg-white dark:bg-[#1C2538]">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2">Supplier</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FFF3E8] flex items-center justify-center shrink-0">
                        <Building2 size={15} className="text-accent" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-body dark:text-white">{vendor.name}</p>
                        <p className="text-[11px] text-muted dark:text-slate-400">{vendor.trade}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {vendor.rating > 0 && (
                          <div className="flex items-center gap-1 text-[#E07B20]">
                            <Star size={11} strokeWidth={1.75} fill="#E07B20" />
                            <span className="text-[12px] font-semibold">{vendor.rating}</span>
                          </div>
                        )}
                        {vendor.contact && (
                          <p className="text-[10px] text-muted mt-0.5">{vendor.contact}</p>
                        )}
                      </div>
                    </div>
                    {order.actualDeliveryDate && (
                      <div className="mt-2.5 flex items-center gap-2 text-[11px] text-[#15803d] bg-[#F0FDF4] rounded-lg px-2.5 py-1.5">
                        <CheckCheck size={12} strokeWidth={2.5} />
                        Delivered on {fmtDate(order.actualDeliveryDate)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tracking timeline */}
              <div>
                <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2.5">Tracking History</p>
                {(order.trackingEvents ?? []).length === 0 ? (
                  <p className="text-[12px] text-muted italic">No tracking events yet.</p>
                ) : (
                  <div className="space-y-0">
                    {[...(order.trackingEvents ?? [])].reverse().map((ev, i, arr) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? 'bg-primary' : 'bg-[#F0F2F5] dark:bg-[#1F2937]'}`}>
                            {i === 0
                              ? <CheckCircle2 size={13} strokeWidth={2.5} className="text-white" />
                              : <div className="w-2 h-2 rounded-full bg-[#CCCCCC] dark:bg-[#3A4558]" />
                            }
                          </div>
                          {i < arr.length - 1 && <div className="w-px flex-1 bg-[#EFEFEF] dark:bg-[#1F2937] my-1" style={{ minHeight: 20 }} />}
                        </div>
                        <div className="pb-4 min-w-0">
                          <p className={`text-[12px] font-semibold leading-snug ${i === 0 ? 'text-body dark:text-white' : 'text-muted dark:text-slate-400'}`}>{ev.event}</p>
                          {ev.notes && <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5 leading-relaxed">{ev.notes}</p>}
                          <p className="text-[10px] text-muted dark:text-slate-600 mt-1">{fmtDate(ev.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {order.notes && (
                  <div className="mt-2 p-3 rounded-xl bg-[#FFF3E8] dark:bg-[#2D1F0A]/50 border border-accent/15 text-[12px] text-accent leading-relaxed">
                    <span className="font-semibold">Note: </span>{order.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showUpdate && (
        <UpdateStatusModal
          order={order}
          onClose={() => setShowUpdate(false)}
          onUpdated={updated => { onUpdate(updated); setShowUpdate(false) }}
        />
      )}
    </>
  )
}

/* ── Purchase Orders Tab ── */
function PurchaseOrdersTab({ orders, setOrders, projects, vendors, materialCatalog, isAdmin }) {
  const [projectFilter, setProjectFilter] = useState('all')
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [showNewPO,     setShowNewPO]     = useState(false)

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const pid = String(o.projectId?._id ?? o.projectId ?? '')
      const pOk = projectFilter === 'all' || pid === projectFilter
      const sOk = statusFilter  === 'all' || o.orderStatus === statusFilter
      return pOk && sOk
    })
  }, [orders, projectFilter, statusFilter])

  const stats = useMemo(() => ({
    total:     orders.length,
    inTransit: orders.filter(o => ['Ordered','Shipped','Partially Delivered'].includes(o.orderStatus)).length,
    payDue:    orders.filter(o => ['Pending','Partially Paid'].includes(o.paymentStatus)).length,
    delivered: orders.filter(o => o.orderStatus === 'Delivered').length,
  }), [orders])

  function handleUpdate(updated) {
    setOrders(prev => prev.map(o => String(o._id) === String(updated._id) ? updated : o))
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',    value: stats.total,     icon: ClipboardList, bg: 'bg-light-blue/60 dark:bg-[#1B2D4A]',  color: 'text-primary dark:text-[#5B9BD5]'  },
          { label: 'In Transit',      value: stats.inTransit, icon: Truck,         bg: 'bg-[#FFF3E8] dark:bg-[#2D1F0A]',      color: 'text-accent'                       },
          { label: 'Payment Due',     value: stats.payDue,    icon: IndianRupee,   bg: 'bg-[#FEF2F2] dark:bg-[#2D0808]',      color: 'text-[#dc2626]'                    },
          { label: 'Delivered',       value: stats.delivered, icon: CheckCheck,    bg: 'bg-[#F0FDF4] dark:bg-[#0A2318]',      color: 'text-[#15803d] dark:text-[#22c55e]'},
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm p-4 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
              <Icon size={17} strokeWidth={1.75} className={color} />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-body dark:text-white leading-none">{value}</p>
              <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + New PO button */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
            className="px-3 py-2 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary bg-white dark:bg-[#1C2538] text-body dark:text-slate-200 transition-colors">
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary bg-white dark:bg-[#1C2538] text-body dark:text-slate-200 transition-colors">
            <option value="all">All Statuses</option>
            {['Ordered','Shipped','Partially Delivered','Delivered','Cancelled'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowNewPO(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-navy hover:bg-primary rounded-xl transition-colors whitespace-nowrap">
          <Plus size={14} strokeWidth={2.5} /> New Purchase Order
        </button>
      </div>

      {/* PO list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] gap-3">
          <Package size={36} strokeWidth={1.25} className="text-muted/40" />
          <p className="text-[14px] font-semibold text-muted">No purchase orders found</p>
          <p className="text-[12px] text-muted/70">Create your first PO using the button above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <POCard
              key={String(order._id)}
              order={order}
              onUpdate={handleUpdate}
              materialCatalog={materialCatalog}
            />
          ))}
        </div>
      )}

      {showNewPO && (
        <NewPOModal
          onClose={() => setShowNewPO(false)}
          onSaved={po => setOrders(prev => [po, ...prev])}
          projects={projects}
          vendors={vendors}
        />
      )}
    </div>
  )
}

/* ── Mood Board Modal ── */
function MoodBoardModal({ board, projectName, onClose }) {
  if (!board) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1C2538] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="relative h-56 overflow-hidden">
          <img src={board.imageUrl} alt={board.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
            <X size={16} />
          </button>
          <div className="absolute bottom-0 left-0 p-5">
            <h2 className="text-[18px] font-bold text-white font-sora">{board.title}</h2>
            <p className="text-[12px] text-white/80 mt-0.5">{projectName}</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-[#777777] uppercase tracking-wide mb-2">Color Palette</p>
            <div className="flex items-center gap-2">
              {board.colors.map((hex, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg border border-[#E0E0E0] shadow-sm" style={{ background: hex }} title={hex} />
                  <span className="text-[9px] font-mono text-[#777777]">{hex.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#777777] uppercase tracking-wide mb-2">Style & Keywords</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] px-3 py-1 rounded-full font-semibold bg-[#D6E8F7] text-[#1B4F8A]">{board.style}</span>
              {board.keywords.map(kw => (
                <span key={kw} className="text-[11px] px-2 py-0.5 rounded-full bg-[#F7F9FC] text-[#555] border border-[#E0E0E0]">{kw}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#777777] uppercase tracking-wide mb-2">Materials</p>
            <div className="flex flex-wrap gap-2">
              {board.materials.map(mat => (
                <span key={mat} className="text-[12px] px-3 py-1 rounded-lg bg-[#F7F9FC] text-[#333] border border-[#E0E0E0]">{mat}</span>
              ))}
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button onClick={onClose} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-[#1B4F8A]">Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MoodBoardsTab({ moodBoards, designerProjects }) {
  const [selectedBoard, setSelectedBoard] = useState(null)
  const projectName = id => designerProjects.find(p => String(p.id) === String(id))?.name ?? 'Unknown'
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[15px] font-bold text-[#0F2340] dark:text-white font-sora">Mood Boards</h2>
        <p className="text-[12px] text-[#777777] mt-0.5">{moodBoards.length} boards across all projects</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {moodBoards.map(board => (
          <div key={board.id} onClick={() => setSelectedBoard(board)}
            className="bg-white dark:bg-[#1C2538] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="relative h-44 overflow-hidden">
              <img src={board.imageUrl} alt={board.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-1">
                {board.colors.map((hex, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ background: hex }} />
                ))}
              </div>
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-[#1B4F8A]">{board.style}</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-[13px] font-semibold text-[#0F2340] dark:text-white leading-snug mb-0.5">{board.title}</h3>
              <p className="text-[11px] text-[#777777] mb-2.5">{projectName(board.projectId)}</p>
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                {board.keywords.map(kw => (
                  <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F7F9FC] dark:bg-[#242E42] text-[#777777] border border-[#E0E0E0] dark:border-[#2A3547]">{kw}</span>
                ))}
              </div>
              <div className="border-t border-[#F0F0F0] dark:border-[#2A3547] pt-2.5">
                <p className="text-[10px] text-[#777777] mb-1.5 font-medium uppercase tracking-wide">Materials</p>
                <div className="flex flex-wrap gap-1.5">
                  {board.materials.slice(0, 3).map(mat => (
                    <span key={mat} className="text-[11px] px-2 py-0.5 rounded-md bg-[#F7F9FC] dark:bg-[#242E42] text-[#333333] dark:text-slate-300 border border-[#E0E0E0] dark:border-[#2A3547]">{mat}</span>
                  ))}
                  {board.materials.length > 3 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#D6E8F7] text-[#1B4F8A] font-medium">+{board.materials.length - 3} more</span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-[#2E6DA4] mt-3 flex items-center gap-1 font-medium"><ExternalLink size={11} /> Click to view details</p>
            </div>
          </div>
        ))}
      </div>
      {selectedBoard && <MoodBoardModal board={selectedBoard} projectName={projectName(selectedBoard.projectId)} onClose={() => setSelectedBoard(null)} />}
    </div>
  )
}

function ColorPalettesTab({ colorPalettes }) {
  const [activePaletteId, setActivePaletteId] = useState(null)
  const [hoveredSwatch, setHoveredSwatch] = useState(null)
  const effectiveId   = activePaletteId ?? colorPalettes[0]?.id
  const activePalette = colorPalettes.find(p => p.id === effectiveId)
  const testerColors  = activePalette ? activePalette.colors.slice(0, 3) : ['#FFFFFF', '#CCCCCC', '#888888']
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[15px] font-bold text-[#0F2340] dark:text-white font-sora">Color Palettes</h2>
        <p className="text-[12px] text-[#777777] mt-0.5">Click a palette to preview it in the Color Tester</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {colorPalettes.map(palette => {
          const isActive = palette.id === activePaletteId
          return (
            <div key={palette.id} onClick={() => setActivePaletteId(palette.id)}
              className={`bg-white dark:bg-[#1C2538] rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${isActive ? 'border-[#1B4F8A] shadow-md ring-1 ring-[#1B4F8A]/20' : 'border-[#E0E0E0] dark:border-[#1F2937]'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-[13px] font-semibold text-[#0F2340] dark:text-white">{palette.name}</p>
                {isActive && <span className="text-[9px] font-bold text-white bg-[#1B4F8A] px-1.5 py-0.5 rounded-full shrink-0">Active</span>}
              </div>
              {palette.tags && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {palette.tags.map(tag => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F0F2F5] dark:bg-[#2A3547] text-[#777777] dark:text-slate-400 font-medium">{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-1 mb-2">
                {palette.colors.map((hex, i) => (
                  <div key={i} className="relative flex-1 h-9 rounded-md cursor-default" style={{ background: hex }}
                    onMouseEnter={() => setHoveredSwatch(`${palette.id}-${i}`)}
                    onMouseLeave={() => setHoveredSwatch(null)}>
                    {hoveredSwatch === `${palette.id}-${i}` && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-[#0F2340] text-white text-[10px] font-mono whitespace-nowrap z-10 shadow-lg">
                        {hex.toUpperCase()}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F2340]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {palette.description && <p className="text-[10px] text-[#777777] dark:text-slate-500 leading-relaxed">{palette.description}</p>}
            </div>
          )
        })}
      </div>
      <div className="bg-white dark:bg-[#1C2538] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-bold text-[#0F2340] dark:text-white font-sora">Color Tester</h3>
            <p className="text-[12px] text-[#777777] mt-0.5">Previewing: <span className="font-semibold text-[#1B4F8A]">{activePalette?.name}</span></p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#777777]"><Info size={12} /> Mock room preview</div>
        </div>
        <div className="rounded-xl overflow-hidden border border-[#E0E0E0] dark:border-[#2A3547]" style={{ height: 220 }}>
          <div className="flex h-full">
            <div className="flex-1 flex items-end justify-center pb-3 transition-colors duration-500" style={{ background: testerColors[0] }}>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.7)', color: '#333333' }}>Wall</span>
            </div>
            <div className="w-2/5 flex flex-col">
              <div className="flex-1 flex items-center justify-center transition-colors duration-500" style={{ background: testerColors[1] }}>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.7)', color: '#333333' }}>Floor</span>
              </div>
              <div className="h-14 flex items-center justify-center transition-colors duration-500" style={{ background: testerColors[2] }}>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.7)', color: '#333333' }}>Accent</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3">
          {['Wall', 'Floor', 'Accent'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm border border-[#E0E0E0]" style={{ background: testerColors[i] }} />
              <span className="text-[11px] text-[#777777]">{label}</span>
              <span className="text-[11px] font-mono text-[#333333] dark:text-slate-300">{testerColors[i]?.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MaterialsTab({ materialCatalog }) {
  const [categoryFilter, setCategoryFilter] = useState('All')
  const filtered = categoryFilter === 'All' ? materialCatalog : materialCatalog.filter(m => m.category === categoryFilter)
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-[#0F2340] dark:text-white font-sora">Material Catalog</h2>
          <p className="text-[12px] text-[#777777] mt-0.5">{filtered.length} materials</p>
        </div>
        <div className="flex items-center gap-2">
          {MAT_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                categoryFilter === cat
                  ? 'bg-[#0F2340] text-white border-[#0F2340]'
                  : 'bg-white dark:bg-[#1C2538] text-[#777777] dark:text-slate-400 border-[#E0E0E0] dark:border-[#1F2937] hover:border-[#2E6DA4] hover:text-[#1B4F8A]'
              }`}>{cat}</button>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-[#1C2538] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: '#0F2340' }}>
              {['Name', 'Category', 'Brand', 'Price', 'Durability', 'Maintenance', 'Stock'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-white uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((material, idx) => {
              const durCfg = DURABILITY_CFG[material.durability] || DURABILITY_CFG['Medium']
              return (
                <tr key={material.id} className="border-t border-[#F0F0F0] dark:border-[#1F2937] hover:bg-[#D6E8F7]/30 dark:hover:bg-[#1B4F8A]/10 transition-colors"
                  style={{ background: idx % 2 === 1 ? '#F7F9FC' : undefined }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full border-2 border-[#E0E0E0] flex-shrink-0" style={{ background: material.color }} />
                      <div>
                        <p className="text-[13px] font-medium text-[#333333] dark:text-slate-200">{material.name}</p>
                        {material.description && <p className="text-[10px] text-[#777777] dark:text-slate-500 mt-0.5 max-w-[260px] leading-snug">{material.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-[#D6E8F7] text-[#1B4F8A]">{material.category}</span></td>
                  <td className="px-4 py-3 text-[13px] text-[#777777]">{material.brand}</td>
                  <td className="px-4 py-3"><span className="text-[13px] font-semibold text-[#333333] dark:text-slate-200">₹{material.price}</span><span className="text-[11px] text-[#777777] ml-1">/{material.unit}</span></td>
                  <td className="px-4 py-3"><span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: durCfg.bg, color: durCfg.text }}>{material.durability}</span></td>
                  <td className="px-4 py-3 text-[13px] text-[#777777]">{material.maintenance}</td>
                  <td className="px-4 py-3">
                    {material.inStock
                      ? <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803d] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#BBF7D0]"><CheckCircle2 size={11} /> In Stock</span>
                      : <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#dc2626] bg-[#FEF2F2] px-2 py-0.5 rounded-full border border-[#FECACA]"><XCircle size={11} /> Out of Stock</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package size={28} className="text-[#DDDDDD] mb-2" /><p className="text-[13px] text-[#777777]">No materials found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function SupervisorMaterials() {
  const [moodBoards,      setMoodBoards]      = useState([])
  const [colorPalettes,   setColorPalettes]   = useState([])
  const [materialCatalog, setMaterialCatalog] = useState([])
  const [projects,        setProjects]        = useState([])
  const [vendors,         setVendors]         = useState([])
  const [orders,          setOrders]          = useState([])
  const [activeTab,       setActiveTab]       = useState('orders')

  useEffect(() => {
    getAllMoodBoards().then(bs => setMoodBoards(bs.map(b => ({ ...b, id: String(b._id), projectId: String(b.projectId?._id ?? b.projectId) })))).catch(console.error)
    getColorPalettes().then(ps => setColorPalettes(ps.map(p => ({ ...p, id: String(p._id) })))).catch(console.error)
    getMaterials().then(ms => setMaterialCatalog(ms.map(m => ({ ...m, id: String(m._id), price: m.pricePerUnit ?? m.price ?? 0, color: m.colorHex ?? null })))).catch(console.error)
    getProjects().then(ps => setProjects(ps.map(projectToRow))).catch(console.error)
    getVendors().then(setVendors).catch(console.error)
    getPurchaseOrders().then(setOrders).catch(console.error)
  }, [])

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[18px] font-bold text-[#0F2340] dark:text-white font-sora">Materials & Tracking</h1>
          <p className="text-[13px] text-[#777777] mt-0.5">Purchase orders, delivery tracking, mood boards and material catalog</p>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-[#141B27] border border-[#EFEFEF] dark:border-[#1F2937] rounded-xl p-1 shadow-sm">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all ${
                  isActive ? 'bg-navy text-white shadow-sm' : 'text-muted dark:text-slate-400 hover:text-body dark:hover:text-slate-200 hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236]'
                }`}>
                <Icon size={14} strokeWidth={1.75} />{tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'orders'     && <PurchaseOrdersTab orders={orders} setOrders={setOrders} projects={projects} vendors={vendors} materialCatalog={materialCatalog} />}
      {activeTab === 'moodboards' && <MoodBoardsTab moodBoards={moodBoards} designerProjects={projects} />}
      {activeTab === 'palettes'   && <ColorPalettesTab colorPalettes={colorPalettes} />}
      {activeTab === 'materials'  && <MaterialsTab materialCatalog={materialCatalog} />}
    </div>
  )
}
