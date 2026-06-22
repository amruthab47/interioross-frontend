import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus, X, ChevronDown, ChevronUp, Scale, Trophy, Store,
  FolderKanban, Trash2, CheckCircle2, AlertCircle, RotateCcw,
  BookOpen, Save, Edit2, ChevronRight,
} from 'lucide-react'
import { getQuotes, createQuote, updateQuote, deleteQuote,
         addBid, updateBid, deleteBid, awardBid, reopenQuote,
         getRateCard, saveRateCard } from '../api/vendorquotes'

/* ── helpers ─────────────────────────────────────────────────────────────── */
const fmtINR  = p => p == null ? '—' : '₹' + Math.round(p / 100).toLocaleString('en-IN')
const fmtDate = s => { if (!s) return '—'; try { return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return s } }
const toP     = n => Math.round(Number(String(n).replace(/[₹,\s]/g, '')) * 100) || 0 // rupees → paise
const fromP   = p => p ? Math.round(p / 100) : ''  // paise → rupees for input

const TRADES = ['Carpentry', 'Masonry', 'Electrical', 'Painting', 'Plumbing', 'Fabrication',
                'False Ceiling', 'Flooring', 'Tiling', 'Waterproofing', 'Other']

const STATUS_CFG = {
  Open:      { bg: 'bg-[#D6E8F7]',  text: 'text-[#1B4F8A]' },
  Awarded:   { bg: 'bg-[#F0FDF4]',  text: 'text-[#15803d]' },
  Cancelled: { bg: 'bg-[#FEF2F2]',  text: 'text-[#dc2626]' },
}
const BID_CFG = {
  Submitted: { bg: 'bg-[#F7F9FC]',  text: 'text-[#777777]' },
  Selected:  { bg: 'bg-[#F0FDF4]',  text: 'text-[#15803d]' },
  Rejected:  { bg: 'bg-[#FEF2F2]',  text: 'text-[#dc2626]' },
}

/* ── New Quote Modal ──────────────────────────────────────────────────────── */
function NewQuoteModal({ projects, onClose, onCreated }) {
  const [form, setForm]  = useState({ jobTitle: '', jobDescription: '', tradeCategory: '', projectId: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr]    = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const fi = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] rounded-xl focus:outline-none focus:border-primary text-body bg-white placeholder:text-muted transition-colors'
  const lb = 'block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5'

  async function submit(e) {
    e.preventDefault()
    if (!form.jobTitle.trim()) { setErr('Job title is required'); return }
    setSaving(true); setErr('')
    try {
      const q = await createQuote({ ...form, projectId: form.projectId || undefined })
      onCreated(q); onClose()
    } catch (e) { setErr(e.message || 'Failed to create') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-2xl w-full max-w-[480px]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F2F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#D6E8F7] flex items-center justify-center">
              <Scale size={14} className="text-primary" />
            </div>
            <p className="font-sora font-semibold text-[15px] text-body">New Quote Request</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] transition-colors"><X size={16}/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className={lb}>Job Title <span className="text-[#dc2626]">*</span></label>
            <input type="text" required placeholder="e.g. Master Bedroom Carpentry" value={form.jobTitle}
              onChange={e => set('jobTitle', e.target.value)} className={fi} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lb}>Trade Category</label>
              <select value={form.tradeCategory} onChange={e => set('tradeCategory', e.target.value)} className={fi}>
                <option value="">— Select —</option>
                {TRADES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lb}>Project</label>
              <select value={form.projectId} onChange={e => set('projectId', e.target.value)} className={fi}>
                <option value="">— General —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lb}>Scope Description <span className="text-muted font-normal normal-case tracking-normal">(optional)</span></label>
            <textarea rows={2} placeholder="Describe the work scope for vendors to quote on…"
              value={form.jobDescription} onChange={e => set('jobDescription', e.target.value)}
              className={`${fi} resize-none`} />
          </div>
          {err && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] px-3 py-2 rounded-xl">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] rounded-xl hover:border-primary hover:text-primary transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-navy hover:bg-primary rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"/>Creating…</> : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Add / Edit Bid Modal ─────────────────────────────────────────────────── */
function BidModal({ quoteId, vendors, existingBid, tradeCategory, onClose, onSaved }) {
  const emptyItem = () => ({ description: '', qty: 1, unit: '', ratePerUnit: '', notes: '' })
  const [form, setForm] = useState({
    vendorId:      existingBid?.vendorId ?? '',
    submittedDate: existingBid?.submittedDate ?? new Date().toISOString().split('T')[0],
    validUntil:    existingBid?.validUntil ?? '',
    deliveryWeeks: existingBid?.deliveryWeeks ?? '',
    notes:         existingBid?.notes ?? '',
  })
  const [items, setItems] = useState(
    existingBid?.items?.length
      ? existingBid.items.map(it => ({ ...it, ratePerUnit: fromP(it.ratePerUnit) }))
      : [emptyItem()]
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')
  const [loadingCard, setLoadingCard] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setItem = (i, k, v) => setItems(arr => arr.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  const addItem = () => setItems(a => [...a, emptyItem()])
  const removeItem = i => setItems(a => a.filter((_, idx) => idx !== i))

  const total = items.reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.ratePerUnit) || 0), 0)

  async function loadRateCard() {
    if (!form.vendorId) return
    setLoadingCard(true)
    try {
      const card = await getRateCard(form.vendorId)
      if (card?.rates?.length) {
        setItems(card.rates.map(r => ({ description: r.description, qty: 1, unit: r.unit, ratePerUnit: fromP(r.ratePerUnit), notes: r.notes || '' })))
      }
    } catch {}
    finally { setLoadingCard(false) }
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.vendorId && !items[0]?.description) { setErr('Select a vendor or enter at least one item'); return }
    setSaving(true); setErr('')
    try {
      const payload = {
        ...form,
        deliveryWeeks: Number(form.deliveryWeeks) || 0,
        items: items.filter(it => it.description.trim()).map(it => ({
          description: it.description.trim(),
          qty:         Number(it.qty) || 1,
          unit:        it.unit,
          ratePerUnit: toP(it.ratePerUnit),
          amount:      Math.round((Number(it.qty) || 1) * toP(it.ratePerUnit)),
          notes:       it.notes,
        })),
      }
      const updated = existingBid
        ? await updateBid(quoteId, existingBid._id, payload)
        : await addBid(quoteId, payload)
      onSaved(updated); onClose()
    } catch (e) { setErr(e.message || 'Failed to save'); setSaving(false) }
  }

  const fi = 'w-full px-3 py-2 text-[13px] border border-[#DDDDDD] rounded-xl focus:outline-none focus:border-primary text-body bg-white placeholder:text-muted transition-colors'
  const lb = 'block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5'

  // Filter vendors by trade category if set
  const filteredVendors = tradeCategory
    ? vendors.filter(v => v.trade === tradeCategory || !tradeCategory)
    : vendors

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-2xl w-full max-w-[620px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F2F5] shrink-0">
          <p className="font-sora font-semibold text-[15px] text-body">{existingBid ? 'Edit Bid' : 'Add Vendor Bid'}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-[#F0F2F5] transition-colors"><X size={16}/></button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Vendor + dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={lb}>Vendor <span className="text-[#dc2626]">*</span></label>
              <div className="flex gap-2">
                <select value={form.vendorId} onChange={e => set('vendorId', e.target.value)} className={fi}>
                  <option value="">— Select vendor —</option>
                  {vendors.map(v => <option key={v._id ?? v.id} value={v._id ?? v.id}>{v.name} · {v.trade}</option>)}
                </select>
                <button type="button" onClick={loadRateCard} disabled={!form.vendorId || loadingCard}
                  title="Load this vendor's rate card"
                  className="shrink-0 px-3 py-2 text-[11px] font-semibold text-primary border border-[#D6E8F7] bg-[#D6E8F7] hover:bg-primary hover:text-white rounded-xl transition-colors disabled:opacity-40 whitespace-nowrap">
                  {loadingCard ? '…' : '⬇ Load Rate Card'}
                </button>
              </div>
            </div>
            <div>
              <label className={lb}>Submitted Date</label>
              <input type="date" value={form.submittedDate} onChange={e => set('submittedDate', e.target.value)} className={fi}/>
            </div>
            <div>
              <label className={lb}>Valid Until</label>
              <input type="date" value={form.validUntil} onChange={e => set('validUntil', e.target.value)} className={fi}/>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={lb + ' mb-0'}>Line Items</label>
              <button type="button" onClick={addItem} className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-mid-blue transition-colors">
                <Plus size={11} strokeWidth={2.5}/> Add row
              </button>
            </div>
            <div className="border border-[#EFEFEF] rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_56px_72px_90px_28px] bg-navy text-white text-[10px] font-semibold uppercase tracking-widest">
                {['Description', 'Qty', 'Unit', 'Rate (₹)', ''].map((h, i) => (
                  <div key={i} className="px-2.5 py-2">{h}</div>
                ))}
              </div>
              {items.map((it, i) => {
                const amt = (Number(it.qty) || 1) * (Number(it.ratePerUnit) || 0)
                return (
                  <div key={i} className={`grid grid-cols-[1fr_56px_72px_90px_28px] ${i % 2 === 1 ? 'bg-[#FAFBFC]' : 'bg-white'} border-t border-[#EFEFEF]`}>
                    <input placeholder="Item description" value={it.description}
                      onChange={e => setItem(i, 'description', e.target.value)}
                      className="px-2.5 py-2 text-[12px] text-body bg-transparent border-none outline-none placeholder:text-muted focus:bg-[#D6E8F7]/20"/>
                    <input type="number" min="0.01" step="0.01" value={it.qty}
                      onChange={e => setItem(i, 'qty', e.target.value)}
                      className="px-2 py-2 text-[12px] text-right text-body bg-transparent border-none border-l border-[#EFEFEF] outline-none focus:bg-[#D6E8F7]/20"/>
                    <input placeholder="sqft" value={it.unit}
                      onChange={e => setItem(i, 'unit', e.target.value)}
                      className="px-2 py-2 text-[12px] text-body bg-transparent border-none border-l border-[#EFEFEF] outline-none focus:bg-[#D6E8F7]/20 placeholder:text-muted"/>
                    <input type="number" min="0" placeholder="0" value={it.ratePerUnit}
                      onChange={e => setItem(i, 'ratePerUnit', e.target.value)}
                      className="px-2 py-2 text-[12px] text-right text-body bg-transparent border-none border-l border-[#EFEFEF] outline-none focus:bg-[#D6E8F7]/20"/>
                    <div className="flex items-center justify-center border-l border-[#EFEFEF]">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-muted hover:text-[#dc2626] transition-colors p-1">
                          <X size={11}/>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-muted">Amounts auto-calculated as qty × rate</p>
              <p className="text-[14px] font-bold text-body">Total: ₹{total.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lb}>Delivery (weeks)</label>
              <input type="number" min="0" placeholder="e.g. 3" value={form.deliveryWeeks}
                onChange={e => set('deliveryWeeks', e.target.value)} className={fi}/>
            </div>
            <div>
              <label className={lb}>Notes</label>
              <input type="text" placeholder="Any conditions or remarks…" value={form.notes}
                onChange={e => set('notes', e.target.value)} className={fi}/>
            </div>
          </div>

          {err && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] px-3 py-2 rounded-xl">{err}</p>}
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-[#F0F2F5] shrink-0">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] rounded-xl hover:border-primary hover:text-primary transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-navy hover:bg-primary rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"/>Saving…</> : 'Save Bid'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Comparison Table ─────────────────────────────────────────────────────── */
function ComparisonTable({ quote, vendors, onUpdate }) {
  const bids = quote.bids ?? []
  if (!bids.length) return (
    <div className="text-center py-8 text-[13px] text-muted">No bids yet. Add a vendor bid above.</div>
  )

  // Collect all unique item descriptions across all bids (preserving order of first appearance)
  const allItems = useMemo(() => {
    const seen = new Set()
    const list = []
    bids.forEach(b => b.items.forEach(it => {
      if (!seen.has(it.description)) { seen.add(it.description); list.push(it.description) }
    }))
    return list
  }, [bids])

  // For each item desc, find the lowest non-zero amount across bids
  function lowestAmount(desc) {
    const amounts = bids.map(b => {
      const it = b.items.find(i => i.description === desc)
      return it?.amount ?? null
    }).filter(a => a !== null && a > 0)
    return amounts.length ? Math.min(...amounts) : null
  }

  const lowestTotal = bids.length ? Math.min(...bids.map(b => b.totalPaise)) : null
  const isOpen = quote.status === 'Open'

  async function handleAward(bidId) {
    const q = await awardBid(quote._id, bidId)
    onUpdate(q)
  }

  async function handleDelete(bidId) {
    const q = await deleteBid(quote._id, bidId)
    onUpdate(q)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-[#0F2340]">
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-white uppercase tracking-widest w-[220px] sticky left-0 bg-[#0F2340]">
              Line Item
            </th>
            {bids.map(bid => (
              <th key={String(bid._id)} className={`px-4 py-2 text-[11px] font-semibold min-w-[150px] ${bid.status === 'Selected' ? 'bg-[#15803d] text-white' : 'text-white'}`}>
                <div className="flex flex-col gap-1">
                  <span>{bid.vendorName || '—'}</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${BID_CFG[bid.status]?.bg} ${BID_CFG[bid.status]?.text}`}>
                      {bid.status}
                    </span>
                    {bid.status === 'Selected' && <Trophy size={10} className="text-yellow-300" />}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Per-item rows */}
          {allItems.map((desc, rowIdx) => {
            const lowest = lowestAmount(desc)
            return (
              <tr key={desc} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#F7F9FC]'}>
                <td className="px-4 py-2.5 text-[12px] font-medium text-body sticky left-0" style={{ background: 'inherit' }}>
                  {desc}
                </td>
                {bids.map(bid => {
                  const it     = bid.items.find(i => i.description === desc)
                  const amt    = it?.amount ?? null
                  const isLow  = amt !== null && amt > 0 && amt === lowest
                  return (
                    <td key={String(bid._id)} className={`px-4 py-2.5 text-right text-[12px] ${isLow ? 'bg-[#F0FDF4] font-bold text-[#15803d]' : 'text-body'}`}>
                      {amt !== null ? (
                        <div>
                          <span>{fmtINR(amt)}</span>
                          {it?.qty !== 1 && (
                            <span className="block text-[10px] text-muted">{it.qty} {it.unit} × {fmtINR(it.ratePerUnit)}</span>
                          )}
                          {isLow && <span className="ml-1 text-[9px] text-[#15803d]">▼ lowest</span>}
                        </div>
                      ) : <span className="text-muted">—</span>}
                    </td>
                  )
                })}
              </tr>
            )
          })}

          {/* Totals row */}
          <tr className="bg-[#F0F4F8] border-t-2 border-[#D6E8F7]">
            <td className="px-4 py-3 text-[13px] font-bold text-navy sticky left-0 bg-[#F0F4F8]">TOTAL</td>
            {bids.map(bid => {
              const isLowest = bid.totalPaise === lowestTotal
              return (
                <td key={String(bid._id)} className={`px-4 py-3 text-right text-[14px] font-bold ${bid.status === 'Selected' ? 'text-[#15803d]' : isLowest ? 'text-[#15803d]' : 'text-navy'}`}>
                  {fmtINR(bid.totalPaise)}
                  {isLowest && bid.status !== 'Selected' && <span className="ml-1 text-[10px]">✓ lowest</span>}
                </td>
              )
            })}
          </tr>

          {/* Delivery row */}
          {bids.some(b => b.deliveryWeeks > 0) && (
            <tr className="bg-white border-t border-[#EFEFEF]">
              <td className="px-4 py-2.5 text-[11px] text-muted sticky left-0 bg-white">Delivery</td>
              {bids.map(bid => (
                <td key={String(bid._id)} className="px-4 py-2.5 text-center text-[11px] text-muted">
                  {bid.deliveryWeeks ? `${bid.deliveryWeeks} wk${bid.deliveryWeeks !== 1 ? 's' : ''}` : '—'}
                </td>
              ))}
            </tr>
          )}

          {/* Notes row */}
          {bids.some(b => b.notes) && (
            <tr className="bg-[#FAFBFC] border-t border-[#EFEFEF]">
              <td className="px-4 py-2.5 text-[11px] text-muted sticky left-0 bg-[#FAFBFC]">Notes</td>
              {bids.map(bid => (
                <td key={String(bid._id)} className="px-4 py-2.5 text-[11px] text-muted text-center max-w-[150px]">
                  <span className="line-clamp-2">{bid.notes || '—'}</span>
                </td>
              ))}
            </tr>
          )}

          {/* Valid until row */}
          {bids.some(b => b.validUntil) && (
            <tr className="bg-white border-t border-[#EFEFEF]">
              <td className="px-4 py-2.5 text-[11px] text-muted sticky left-0 bg-white">Valid Until</td>
              {bids.map(bid => (
                <td key={String(bid._id)} className="px-4 py-2.5 text-center text-[11px] text-muted">
                  {fmtDate(bid.validUntil)}
                </td>
              ))}
            </tr>
          )}

          {/* Action row */}
          {isOpen && (
            <tr className="bg-[#F7F9FC] border-t border-[#EFEFEF]">
              <td className="px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider sticky left-0 bg-[#F7F9FC]">Action</td>
              {bids.map(bid => (
                <td key={String(bid._id)} className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center gap-2">
                    {bid.status !== 'Selected' ? (
                      <button onClick={() => handleAward(bid._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap">
                        <Trophy size={11}/> Award
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#15803d]">
                        <CheckCircle2 size={13}/> Awarded
                      </span>
                    )}
                    <button onClick={() => handleDelete(bid._id)}
                      className="text-muted hover:text-[#dc2626] transition-colors p-1" title="Remove bid">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/* ── Rate Card Editor ─────────────────────────────────────────────────────── */
function RateCardEditor({ vendors }) {
  const [selVendor, setSelVendor] = useState('')
  const [rates,     setRates]    = useState([])
  const [loading,   setLoading]  = useState(false)
  const [saving,    setSaving]   = useState(false)
  const [saved,     setSaved]    = useState(false)
  const emptyRate = () => ({ description: '', unit: '', ratePerUnit: '' })

  async function loadCard(vid) {
    setSelVendor(vid)
    if (!vid) { setRates([]); return }
    setLoading(true)
    try {
      const card = await getRateCard(vid)
      setRates(card?.rates?.map(r => ({ ...r, ratePerUnit: fromP(r.ratePerUnit) })) ?? [emptyRate()])
    } catch { setRates([emptyRate()]) }
    finally { setLoading(false) }
  }

  async function save() {
    setSaving(true); setSaved(false)
    try {
      const cleanRates = rates
        .filter(r => r.description.trim())
        .map(r => ({ description: r.description.trim(), unit: r.unit, ratePerUnit: toP(r.ratePerUnit), notes: r.notes || '' }))
      await saveRateCard(selVendor, cleanRates)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const setRate = (i, k, v) => setRates(arr => arr.map((r, idx) => idx === i ? { ...r, [k]: v } : r))
  const addRate = () => setRates(a => [...a, emptyRate()])
  const removeRate = i => setRates(a => a.filter((_, idx) => idx !== i))

  const fi = 'px-2.5 py-2 text-[12px] text-body bg-transparent border-none outline-none focus:bg-[#D6E8F7]/20 placeholder:text-muted w-full'

  return (
    <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0F2F5] flex items-center justify-between">
        <div>
          <h2 className="font-sora font-bold text-[15px] text-navy">Vendor Rate Cards</h2>
          <p className="text-[12px] text-muted mt-0.5">Standard rates per vendor — load into bids to fill items quickly</p>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <select value={selVendor} onChange={e => loadCard(e.target.value)}
            className="flex-1 max-w-xs px-3 py-2 text-[13px] border border-[#DDDDDD] rounded-xl focus:outline-none focus:border-primary text-body bg-white transition-colors">
            <option value="">— Select vendor to edit —</option>
            {vendors.map(v => <option key={v._id ?? v.id} value={v._id ?? v.id}>{v.name} · {v.trade}</option>)}
          </select>
          {selVendor && !loading && (
            <>
              <button onClick={addRate} className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-primary border border-[#D6E8F7] rounded-xl hover:bg-[#D6E8F7] transition-colors">
                <Plus size={12} strokeWidth={2.5}/> Add Rate
              </button>
              <button onClick={save} disabled={saving}
                className={`flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-xl transition-colors ${saved ? 'bg-[#F0FDF4] text-[#15803d] border border-[#15803d]/30' : 'bg-navy hover:bg-primary text-white'} disabled:opacity-50`}>
                {saving ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"/> : saved ? <><CheckCircle2 size={13}/> Saved</> : <><Save size={13}/> Save</>}
              </button>
            </>
          )}
        </div>

        {loading && <div className="flex items-center gap-2 py-4 text-muted"><span className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin"/><span className="text-[12px]">Loading rate card…</span></div>}

        {selVendor && !loading && (
          <div className="border border-[#EFEFEF] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_100px_28px] bg-navy text-white text-[10px] font-semibold uppercase tracking-widest">
              {['Description', 'Unit', 'Rate (₹)', ''].map((h, i) => (
                <div key={i} className="px-3 py-2">{h}</div>
              ))}
            </div>
            {rates.length === 0 && (
              <div className="px-4 py-6 text-center text-[12px] text-muted">No rates yet. Click "Add Rate" to start.</div>
            )}
            {rates.map((r, i) => (
              <div key={i} className={`grid grid-cols-[1fr_80px_100px_28px] border-t border-[#EFEFEF] ${i % 2 === 1 ? 'bg-[#FAFBFC]' : 'bg-white'}`}>
                <input placeholder="e.g. Wardrobe per sqft" value={r.description} onChange={e => setRate(i, 'description', e.target.value)} className={fi}/>
                <input placeholder="sqft" value={r.unit} onChange={e => setRate(i, 'unit', e.target.value)} className={`${fi} border-l border-[#EFEFEF]`}/>
                <input type="number" min="0" placeholder="0" value={r.ratePerUnit} onChange={e => setRate(i, 'ratePerUnit', e.target.value)} className={`${fi} border-l border-[#EFEFEF] text-right`}/>
                <div className="flex items-center justify-center border-l border-[#EFEFEF]">
                  <button type="button" onClick={() => removeRate(i)} className="text-muted hover:text-[#dc2626] transition-colors p-1"><X size={11}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!selVendor && (
          <div className="flex flex-col items-center py-10 gap-2 text-muted">
            <BookOpen size={28} strokeWidth={1.25} className="text-muted/40"/>
            <p className="text-[13px]">Select a vendor above to view or edit their rate card</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Quote Card ───────────────────────────────────────────────────────────── */
function QuoteCard({ quote, vendors, projects, onUpdate, onDelete }) {
  const [expanded,  setExpanded]  = useState(false)
  const [showAddBid, setShowAddBid] = useState(false)
  const [editBid,   setEditBid]   = useState(null)

  const bids = quote.bids ?? []
  const lowestBid = bids.length ? bids.reduce((a, b) => a.totalPaise < b.totalPaise ? a : b) : null
  const sc = STATUS_CFG[quote.status] ?? STATUS_CFG.Open

  async function handleReopen() {
    const q = await reopenQuote(quote._id)
    onUpdate(q)
  }

  async function handleCancel() {
    const q = await updateQuote(quote._id, { status: 'Cancelled' })
    onUpdate(q)
  }

  return (
    <>
      <div className={`bg-white rounded-2xl border shadow-sm transition-all ${expanded ? 'border-primary/30 shadow-md' : 'border-[#EFEFEF] hover:border-primary/20 hover:shadow-md'}`}>
        {/* Card header */}
        <div className="flex items-start gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <div className="w-10 h-10 rounded-xl bg-[#D6E8F7] flex items-center justify-center shrink-0 mt-0.5">
            <Scale size={17} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] font-semibold text-body">{quote.jobTitle}</p>
                  {quote.tradeCategory && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#FFF3E8] text-accent">{quote.tradeCategory}</span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{quote.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap text-[11px] text-muted">
                  {quote.projectId?.name && (
                    <span className="flex items-center gap-1"><FolderKanban size={10}/>{quote.projectId.name}</span>
                  )}
                  <span>{bids.length} vendor{bids.length !== 1 ? 's' : ''} quoted</span>
                  {lowestBid && quote.status !== 'Awarded' && (
                    <span className="text-[#15803d] font-medium">Lowest: {fmtINR(lowestBid.totalPaise)} ({lowestBid.vendorName})</span>
                  )}
                  {quote.status === 'Awarded' && lowestBid && (
                    <span className="flex items-center gap-1 text-[#15803d] font-semibold">
                      <Trophy size={10}/>Awarded: {bids.find(b => b.status === 'Selected')?.vendorName ?? '—'} · {fmtINR(bids.find(b => b.status === 'Selected')?.totalPaise)}
                    </span>
                  )}
                  <span>Created {fmtDate(quote.createdAt?.split?.('T')?.[0] ?? '')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {quote.status === 'Open' && (
                  <button onClick={e => { e.stopPropagation(); setShowAddBid(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-navy hover:bg-primary rounded-lg transition-colors whitespace-nowrap">
                    <Plus size={11} strokeWidth={2.5}/> Add Bid
                  </button>
                )}
                <div className="text-muted">{expanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded comparison table */}
        {expanded && (
          <div className="border-t border-[#F0F2F5]">
            {quote.jobDescription && (
              <div className="px-5 py-3 bg-[#F7F9FC] border-b border-[#F0F2F5]">
                <p className="text-[12px] text-muted">{quote.jobDescription}</p>
              </div>
            )}
            <ComparisonTable quote={quote} vendors={vendors} onUpdate={onUpdate} />
            <div className="flex items-center gap-3 px-5 py-3 border-t border-[#F0F2F5] bg-[#F7F9FC]">
              {quote.status === 'Open' && (
                <button onClick={handleCancel} className="flex items-center gap-1.5 text-[11px] font-medium text-muted hover:text-[#dc2626] transition-colors">
                  <X size={12}/> Cancel request
                </button>
              )}
              {quote.status !== 'Open' && (
                <button onClick={handleReopen} className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-mid-blue transition-colors">
                  <RotateCcw size={12}/> Reopen
                </button>
              )}
              <button onClick={() => onDelete(quote._id)} className="flex items-center gap-1.5 text-[11px] font-medium text-muted hover:text-[#dc2626] transition-colors ml-auto">
                <Trash2 size={12}/> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddBid && (
        <BidModal quoteId={quote._id} vendors={vendors} tradeCategory={quote.tradeCategory}
          onClose={() => setShowAddBid(false)} onSaved={q => { onUpdate(q); setShowAddBid(false) }}/>
      )}
      {editBid && (
        <BidModal quoteId={quote._id} vendors={vendors} existingBid={editBid} tradeCategory={quote.tradeCategory}
          onClose={() => setEditBid(null)} onSaved={q => { onUpdate(q); setEditBid(null) }}/>
      )}
    </>
  )
}

/* ── Embeddable tab (receives vendors + projects from parent) ─────────────── */
export function QuoteCompareTab({ vendors = [], projects = [] }) {
  const [quotes,        setQuotes]       = useState([])
  const [loading,       setLoading]      = useState(true)
  const [tab,           setTab]          = useState('comparisons')
  const [statusFilter,  setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter]= useState('all')
  const [showNew,       setShowNew]      = useState(false)

  useEffect(() => {
    getQuotes().then(qs => setQuotes(qs ?? [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  const displayed = useMemo(() => {
    let list = [...quotes]
    if (statusFilter !== 'all')  list = list.filter(q => q.status === statusFilter)
    if (projectFilter !== 'all') list = list.filter(q => String(q.projectId?._id ?? q.projectId) === projectFilter)
    return list
  }, [quotes, statusFilter, projectFilter])

  function handleCreated(q)  { setQuotes(prev => [q, ...prev]) }
  function handleUpdated(q)  { setQuotes(prev => prev.map(x => String(x._id) === String(q._id) ? q : x)) }
  async function handleDelete(id) {
    await deleteQuote(id)
    setQuotes(prev => prev.filter(q => String(q._id) !== String(id)))
  }

  const statCounts = useMemo(() => ({
    all:       quotes.length,
    Open:      quotes.filter(q => q.status === 'Open').length,
    Awarded:   quotes.filter(q => q.status === 'Awarded').length,
    Cancelled: quotes.filter(q => q.status === 'Cancelled').length,
  }), [quotes])

  return (
    <div className="space-y-5">
      {/* Sub-tab bar + action button */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-white border border-[#EFEFEF] rounded-xl shadow-sm p-1">
          {[
            { id: 'comparisons', label: 'Quote Comparisons', icon: Scale },
            { id: 'ratecards',   label: 'Rate Cards',        icon: BookOpen },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${tab === id ? 'bg-navy text-white shadow-sm' : 'text-muted hover:bg-[#F0F2F5] hover:text-body'}`}>
              <Icon size={13} strokeWidth={1.75}/>{label}
            </button>
          ))}
        </div>
        {tab === 'comparisons' && (
          <button onClick={() => setShowNew(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-navy hover:bg-primary text-white text-[13px] font-semibold rounded-xl transition-colors">
            <Plus size={14} strokeWidth={2.5}/> New Quote Request
          </button>
        )}
      </div>

      {/* ── Comparisons tab ── */}
      {tab === 'comparisons' && (
        <>
          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {[
                { v: 'all',       l: `All (${statCounts.all})`       },
                { v: 'Open',      l: `Open (${statCounts.Open})`      },
                { v: 'Awarded',   l: `Awarded (${statCounts.Awarded})` },
                { v: 'Cancelled', l: `Cancelled (${statCounts.Cancelled})` },
              ].map(({ v, l }) => (
                <button key={v} onClick={() => setStatusFilter(v)}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors ${statusFilter === v ? 'bg-navy text-white' : 'bg-white text-muted border border-[#EFEFEF] hover:text-body'}`}>
                  {l}
                </button>
              ))}
            </div>
            {projects.length > 0 && (
              <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
                className="ml-auto px-3 py-1.5 text-[12px] border border-[#EFEFEF] rounded-xl bg-white text-body focus:outline-none focus:border-primary appearance-none cursor-pointer pr-7"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23777'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '12px' }}>
                <option value="all">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>

          {/* Quote list */}
          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-[#EFEFEF] p-5 animate-pulse">
                  <div className="flex gap-4"><div className="w-10 h-10 rounded-xl bg-[#F0F2F5] shrink-0"/><div className="flex-1 space-y-2"><div className="h-4 bg-[#F0F2F5] rounded w-56"/><div className="h-3 bg-[#F0F2F5] rounded w-40"/></div></div>
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center py-20 bg-white rounded-2xl border border-[#EFEFEF] gap-3">
              <Scale size={36} strokeWidth={1.25} className="text-muted/40"/>
              <p className="text-[14px] font-semibold text-muted">No quote requests yet</p>
              <p className="text-[12px] text-muted/70">Create a request to start collecting and comparing vendor bids.</p>
              <button onClick={() => setShowNew(true)} className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-navy text-white text-[13px] font-semibold rounded-xl hover:bg-primary transition-colors">
                <Plus size={13}/> Create First Request
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map(q => (
                <QuoteCard key={String(q._id)} quote={q} vendors={vendors} projects={projects}
                  onUpdate={handleUpdated} onDelete={handleDelete}/>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Rate Cards tab ── */}
      {tab === 'ratecards' && <RateCardEditor vendors={vendors} />}

      {/* New Quote modal */}
      {showNew && (
        <NewQuoteModal projects={projects} onClose={() => setShowNew(false)} onCreated={q => { handleCreated(q); setShowNew(false) }}/>
      )}
    </div>
  )
}

export default QuoteCompareTab
