import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Download, Eye, FileCheck, FileClock, FileSignature, BarChart2,
  Mail, CheckCircle, X, PenLine, ShieldCheck, Clock, AlertCircle,
  RefreshCw, Copy, ChevronRight,
} from 'lucide-react'
import { getDocuments, getDownloadUrl, initiateESign, verifyESign, getESignCertificate } from '../api/documents'
import { resolveFileUrl } from '../api/client'

/* ── type / status configs ───────────────────────────────────────────────── */
const TYPE_CONFIG = {
  Quotation:      { color: '#1B4F8A', bg: 'bg-[#D6E8F7]',  label: 'Quotation',     icon: FileClock     },
  Invoice:        { color: '#16a34a', bg: 'bg-green-100',  label: 'Invoice',       icon: FileCheck     },
  Contract:       { color: '#0F2340', bg: 'bg-[#D6E8F7]',  label: 'Contract',      icon: FileSignature },
  'Design Report':{ color: '#7C3AED', bg: 'bg-purple-100', label: 'Design Report', icon: BarChart2     },
}

const STATUS_CONFIG = {
  'Paid':                  { cls: 'bg-green-100 text-green-700',        dot: 'bg-green-500'   },
  'Active':                { cls: 'bg-[#D6E8F7] text-[#1B4F8A]',        dot: 'bg-[#1B4F8A]'  },
  'Available':             { cls: 'bg-[#D6E8F7] text-[#1B4F8A]',        dot: 'bg-[#2E6DA4]'  },
  'Pending Your Approval': { cls: 'bg-[#FFF3E0] text-[#E07B20]',        dot: 'bg-[#E07B20]'  },
  'Signed':                { cls: 'bg-[#F0FDF4] text-[#15803d]',        dot: 'bg-[#15803d]'  },
}

function fmtDate(s) {
  if (!s) return '—'
  try { return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return s }
}
function fmtINR(p) { return p ? '₹' + Math.round(p / 100).toLocaleString('en-IN') : '—' }

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] ?? { color: '#777', bg: 'bg-gray-100', label: type, icon: FileText }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${cfg.bg}`} style={{ color: cfg.color }}>
      <Icon size={11} />{cfg.label}
    </span>
  )
}
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{status}
    </span>
  )
}

/* ── OTP Sign Modal ──────────────────────────────────────────────────────── */
function OtpSignModal({ doc, onClose, onSigned }) {
  const [step,        setStep]       = useState('confirm') // confirm → sending → otp → verifying → done
  const [otp,         setOtp]        = useState('')
  const [demoOtp,     setDemoOtp]    = useState('')
  const [signatureId, setSignatureId]= useState(null)
  const [expiresAt,   setExpiresAt]  = useState(null)
  const [error,       setError]      = useState('')
  const [copied,      setCopied]     = useState(false)

  async function requestOtp() {
    setStep('sending'); setError('')
    try {
      const res = await initiateESign(doc.id)
      setSignatureId(res.signatureId)
      setExpiresAt(new Date(res.expiresAt))
      setDemoOtp(res.demoOtp || '')
      setStep('otp')
    } catch (e) {
      setError(e.message || 'Failed to send OTP')
      setStep('confirm')
    }
  }

  async function submitOtp(e) {
    e.preventDefault()
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return }
    setStep('verifying'); setError('')
    try {
      const res = await verifyESign(signatureId, otp)
      onSigned(doc.id, res.signatureId)
      setStep('done')
    } catch (e) {
      setError(e.message || 'Verification failed')
      setStep('otp')
    }
  }

  function copyOtp() {
    navigator.clipboard.writeText(demoOtp).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F4F8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D6E8F7] flex items-center justify-center shrink-0">
              <PenLine size={16} className="text-[#1B4F8A]" />
            </div>
            <div>
              <p className="font-sora font-semibold text-[15px] text-[#0F2340]">Sign Document</p>
              <p className="text-[11px] text-[#777777] font-mono">{doc.number}</p>
            </div>
          </div>
          {step !== 'verifying' && step !== 'done' && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#777777] hover:bg-[#F0F2F5] transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-5">

          {/* Confirm step */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F7F9FC] rounded-xl border border-[#E0E6F0] space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#777777]">Document</span>
                  <span className="font-semibold text-[#333333]">{doc.type} · {doc.number}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#777777]">Project</span>
                  <span className="font-semibold text-[#333333]">{doc.project || '—'}</span>
                </div>
                {doc.amount > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#777777]">Amount</span>
                    <span className="font-semibold text-[#0F2340]">₹{doc.amount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-[#FFFBEB] border border-[#FCD34D]/40 rounded-xl">
                <AlertCircle size={14} className="text-[#854d0e] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#854d0e] leading-relaxed">
                  An OTP will be sent to your registered contact. By signing, you agree this constitutes a legally binding electronic signature under the <strong>IT Act 2000, Section 5</strong>.
                </p>
              </div>
              {error && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] px-3 py-2 rounded-xl">{error}</p>}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 text-[13px] font-medium text-[#777777] border border-[#DDDDDD] rounded-xl hover:border-[#1B4F8A] hover:text-[#1B4F8A] transition-colors">
                  Cancel
                </button>
                <button onClick={requestOtp} className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#0F2340] hover:bg-[#1B4F8A] rounded-xl transition-colors flex items-center justify-center gap-2">
                  <PenLine size={13} /> Request OTP to Sign
                </button>
              </div>
            </div>
          )}

          {/* Sending */}
          {step === 'sending' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-10 h-10 rounded-full border-4 border-[#D6E8F7] border-t-[#1B4F8A] animate-spin" />
              <p className="text-[13px] text-[#777777]">Sending OTP to your registered contact…</p>
            </div>
          )}

          {/* OTP entry */}
          {step === 'otp' && (
            <form onSubmit={submitOtp} className="space-y-4">
              <p className="text-[13px] text-[#333333] leading-relaxed">
                A 6-digit OTP has been sent to your registered email / phone. Enter it below to sign the document.
              </p>

              {/* Demo OTP panel */}
              {demoOtp && (
                <div className="flex items-center justify-between p-3.5 bg-[#0F2340] rounded-xl">
                  <div>
                    <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Demo mode — OTP</p>
                    <p className="text-[22px] font-bold font-sora tracking-[0.25em] text-white">{demoOtp}</p>
                  </div>
                  <button type="button" onClick={copyOtp}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-[11px] font-medium rounded-lg transition-colors">
                    <Copy size={11} />{copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}

              {expiresAt && (
                <p className="text-[11px] text-[#777777] flex items-center gap-1">
                  <Clock size={11} /> OTP valid until {expiresAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-[#777777] uppercase tracking-widest mb-2">Enter OTP</label>
                <input
                  type="text" inputMode="numeric" maxLength={6} autoFocus
                  value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                  placeholder="______"
                  className="w-full px-4 py-3 text-center text-[22px] font-bold font-sora tracking-[0.3em] border-2 border-[#DDDDDD] rounded-xl focus:outline-none focus:border-[#1B4F8A] text-[#0F2340] transition-colors"
                />
              </div>

              {error && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] px-3 py-2 rounded-xl">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={requestOtp}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-[12px] text-[#1B4F8A] border border-[#D6E8F7] rounded-xl hover:bg-[#D6E8F7] transition-colors">
                  <RefreshCw size={12} /> Resend
                </button>
                <button type="submit" disabled={otp.length !== 6}
                  className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  <ShieldCheck size={14} /> Verify & Sign
                </button>
              </div>
            </form>
          )}

          {/* Verifying */}
          {step === 'verifying' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-10 h-10 rounded-full border-4 border-[#D6E8F7] border-t-[#15803d] animate-spin" />
              <p className="text-[13px] text-[#777777]">Verifying OTP and recording signature…</p>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                <CheckCircle size={28} className="text-[#15803d]" />
              </div>
              <p className="font-sora font-bold text-[16px] text-[#0F2340]">Document Signed!</p>
              <p className="text-[12px] text-[#777777] leading-relaxed">
                Your electronic signature has been recorded and is legally binding under the IT Act 2000.
              </p>
              <button onClick={onClose}
                className="mt-2 w-full px-4 py-2.5 text-[13px] font-semibold text-white bg-[#0F2340] hover:bg-[#1B4F8A] rounded-xl transition-colors">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Certificate Modal ───────────────────────────────────────────────────── */
function CertificateModal({ signatureId, doc, onClose }) {
  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!signatureId) return
    getESignCertificate(signatureId)
      .then(setCert)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [signatureId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F4F8] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
              <ShieldCheck size={16} className="text-[#15803d]" />
            </div>
            <div>
              <p className="font-sora font-semibold text-[15px] text-[#0F2340]">Signature Certificate</p>
              <p className="text-[11px] text-[#777777]">Electronic Signature Record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#777777] hover:bg-[#F0F2F5] transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-[#D6E8F7] border-t-[#1B4F8A] animate-spin" />
          </div>
        ) : !cert ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-[13px] text-[#777777]">Certificate not found</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* Certificate block */}
            <div className="border-2 border-[#15803d]/30 rounded-2xl overflow-hidden">
              <div className="bg-[#0F2340] px-5 py-3 flex items-center gap-2">
                <ShieldCheck size={14} className="text-white" />
                <p className="text-[11px] font-bold text-white uppercase tracking-widest">Electronic Signature Certificate</p>
              </div>

              <div className="p-5 space-y-3">
                {/* Document details */}
                <div>
                  <p className="text-[9px] font-bold text-[#777777] uppercase tracking-widest mb-2">Document</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#777777]">Type</span>
                      <span className="font-semibold text-[#333333]">{cert.documentType}</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#777777]">Number</span>
                      <span className="font-mono font-semibold text-[#1B4F8A]">{cert.documentNumber}</span>
                    </div>
                    {cert.metadata?.projectName && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#777777]">Project</span>
                        <span className="font-semibold text-[#333333]">{cert.metadata.projectName}</span>
                      </div>
                    )}
                    {cert.metadata?.amountPaise > 0 && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#777777]">Amount</span>
                        <span className="font-bold text-[#0F2340]">{fmtINR(cert.metadata.amountPaise)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-[#F0F4F8]" />

                {/* Signer details */}
                <div>
                  <p className="text-[9px] font-bold text-[#777777] uppercase tracking-widest mb-2">Signer</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#777777]">Name</span>
                      <span className="font-semibold text-[#333333]">{cert.signerName}</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#777777]">Email</span>
                      <span className="font-semibold text-[#333333]">{cert.signerEmail}</span>
                    </div>
                    {cert.signerPhone && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#777777]">Phone</span>
                        <span className="font-semibold text-[#333333]">{cert.signerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-[#F0F4F8]" />

                {/* Signature details */}
                <div>
                  <p className="text-[9px] font-bold text-[#777777] uppercase tracking-widest mb-2">Signature Details</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#777777]">Signed at</span>
                      <span className="font-semibold text-[#15803d]">
                        {cert.signedAt ? new Date(cert.signedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#777777]">Verification</span>
                      <span className="font-semibold text-[#333333]">OTP to registered contact</span>
                    </div>
                    {cert.ipAddress && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#777777]">IP Address</span>
                        <span className="font-mono text-[#333333]">{cert.ipAddress}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#777777]">Signature ID</span>
                      <span className="font-mono text-[10px] text-[#777777]">{String(cert._id).slice(-12)}</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-[#F0F4F8]" />

                {/* Document hash */}
                <div>
                  <p className="text-[9px] font-bold text-[#777777] uppercase tracking-widest mb-2">Document Integrity</p>
                  <div className="bg-[#F7F9FC] rounded-lg p-3">
                    <p className="text-[9px] text-[#777777] mb-1">SHA-256 Hash</p>
                    <p className="font-mono text-[10px] text-[#333333] break-all leading-relaxed">{cert.documentHash}</p>
                    <p className="text-[9px] text-[#777777] mt-1.5">This hash uniquely identifies the document content at the time of signing. Any modification will produce a different hash.</p>
                  </div>
                </div>

                {/* Legal notice */}
                <div className="bg-[#F0FDF4] border border-[#15803d]/20 rounded-xl p-3 flex items-start gap-2">
                  <ShieldCheck size={13} className="text-[#15803d] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#15803d] leading-relaxed">
                    This electronic signature is legally valid under the <strong>Information Technology Act 2000, Section 5</strong>. It was created with the consent of the signatory and verified via one-time password sent to their registered contact.
                  </p>
                </div>
              </div>
            </div>

            {/* Audit trail */}
            {cert.auditTrail?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-[#777777] uppercase tracking-widest mb-2">Audit Trail</p>
                <div className="space-y-1.5">
                  {cert.auditTrail.map((ev, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-[#F7F9FC] rounded-xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-[#333333]">{ev.event.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-[#777777] mt-0.5">{ev.details}</p>
                        {ev.ip && <p className="text-[10px] text-[#777777]">IP: {ev.ip}</p>}
                      </div>
                      <span className="text-[10px] text-[#777777] shrink-0 whitespace-nowrap">
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function ClientDocuments() {
  const [docs,        setDocs]        = useState([])
  const [previewDoc,  setPreviewDoc]  = useState(null)
  const [signingDoc,  setSigningDoc]  = useState(null)   // doc being signed
  const [certInfo,    setCertInfo]    = useState(null)   // { signatureId, doc }
  // Map docId → { status, signatureId } from known signatures
  const [sigMap,      setSigMap]      = useState({})

  useEffect(() => {
    getDocuments().then(raw => {
      const mapped = raw.map(doc => ({
        ...doc,
        id:       doc._id,
        number:   doc.documentNumber,
        project:  doc.projectId?.name ?? '',
        client:   doc.clientId?.name  ?? '',
        amount:   Math.round((doc.amountPaise ?? 0) / 100),
        date:     doc.issueDate ?? '',
        fileUrl:  resolveFileUrl(doc.fileUrl ?? doc.storagePath ?? ''),
        fileName: doc.fileName ?? '',
      }))
      setDocs(mapped)

      // Pre-populate sigMap from doc.status === 'Signed'
      const initialMap = {}
      mapped.forEach(d => { if (d.status === 'Signed') initialMap[d.id] = { status: 'Signed' } })
      setSigMap(initialMap)
    }).catch(console.error)
  }, [])

  function handleSigned(docId, signatureId) {
    setSigMap(prev => ({ ...prev, [docId]: { status: 'Signed', signatureId } }))
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'Signed' } : d))
    setSigningDoc(null)
  }

  const typeCounts = docs.reduce((acc, d) => { acc[d.type] = (acc[d.type] ?? 0) + 1; return acc }, {})

  const needsSign = d =>
    ['Contract', 'Quotation'].includes(d.type) && d.status !== 'Signed'

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5">
        <h1 className="text-xl font-bold font-sora text-[#0F2340]">My Documents</h1>
        <p className="text-[13px] text-[#777777] mt-1">
          Quotations, invoices, contracts and design reports
          {docs[0]?.project ? ` for ${docs[0].project}` : ''}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const Icon = cfg.icon
          return (
            <div key={type} className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                <Icon size={16} style={{ color: cfg.color }} />
              </div>
              <div>
                <p className="text-xl font-bold font-sora" style={{ color: cfg.color }}>{typeCounts[type] ?? 0}</p>
                <p className="text-[11px] text-[#777777] mt-0.5">{type}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Document table */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E0E0E0] flex items-center justify-between">
          <h2 className="font-semibold font-sora text-[15px] text-[#0F2340]">All Documents</h2>
          <span className="text-[12px] text-[#777777]">{docs.length} document{docs.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0F2340]">
                {['Type', 'Document No.', 'Project', 'Date', 'Amount / Pages', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-white uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => {
                const sig     = sigMap[doc.id]
                const isSigned = sig?.status === 'Signed' || doc.status === 'Signed'
                const displayStatus = isSigned ? 'Signed' : doc.status
                return (
                  <tr key={doc.id} className={`border-b border-[#F0F4F8] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#F7F9FC]'} hover:bg-[#D6E8F7]/20`}>
                    <td className="px-4 py-3.5"><TypeBadge type={doc.type} /></td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[12px] font-medium text-[#0F2340]">{doc.number}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#333333] whitespace-nowrap">{doc.project}</td>
                    <td className="px-4 py-3.5 text-[12px] text-[#777777] whitespace-nowrap">{fmtDate(doc.date)}</td>
                    <td className="px-4 py-3.5 text-[13px] font-medium text-[#333333] whitespace-nowrap">
                      {doc.amount ? `₹${doc.amount.toLocaleString('en-IN')}` : doc.pages ? `${doc.pages}p` : '—'}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={displayStatus} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* View */}
                        <button onClick={() => setPreviewDoc(doc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D6E8F7] hover:bg-[#1B4F8A] text-[#1B4F8A] hover:text-white text-[12px] font-medium rounded-lg transition-colors">
                          <Eye size={12} /> View
                        </button>

                        {/* Sign button */}
                        {needsSign(doc) && (
                          <button onClick={() => setSigningDoc(doc)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2340] hover:bg-[#1B4F8A] text-white text-[12px] font-semibold rounded-lg transition-colors">
                            <PenLine size={12} /> Sign
                          </button>
                        )}

                        {/* Certificate button for signed docs */}
                        {isSigned && (sig?.signatureId || doc.status === 'Signed') && (
                          <button
                            onClick={async () => {
                              // If we already have signatureId in state, use it; otherwise fetch
                              if (sig?.signatureId) {
                                setCertInfo({ signatureId: sig.signatureId, doc })
                              } else {
                                try {
                                  const { apiFetch } = await import('../api/client')
                                  const s = await apiFetch(`/esign/status/${doc.id}`)
                                  if (s?._id) {
                                    setSigMap(prev => ({ ...prev, [doc.id]: { status: 'Signed', signatureId: s._id } }))
                                    setCertInfo({ signatureId: s._id, doc })
                                  }
                                } catch { /* ignore */ }
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#15803d] text-[#15803d] hover:text-white text-[12px] font-medium rounded-lg transition-colors border border-[#15803d]/20">
                            <ShieldCheck size={12} /> Certificate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {docs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#777777]">No documents yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <div className="bg-[#D6E8F7] rounded-xl border border-[#2E6DA4]/30 p-4 flex items-start gap-3">
        <Mail size={15} className="text-[#1B4F8A] mt-0.5 shrink-0" />
        <p className="text-[13px] text-[#1B4F8A]">
          For billing queries, contact{' '}
          <a href="mailto:billing@squareinteriors.in" className="font-semibold underline underline-offset-2 hover:text-[#0F2340] transition-colors">
            billing@squareinteriors.in
          </a>
          {' '}· Electronic signatures on this platform are valid under the IT Act 2000.
        </p>
      </div>

      {/* PDF preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" style={{ height: '80vh' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0] shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${TYPE_CONFIG[previewDoc.type]?.bg ?? 'bg-gray-100'} flex items-center justify-center shrink-0`}>
                  {(() => { const Icon = TYPE_CONFIG[previewDoc.type]?.icon ?? FileText; return <Icon size={15} style={{ color: TYPE_CONFIG[previewDoc.type]?.color ?? '#777' }} /> })()}
                </div>
                <div>
                  <p className="font-semibold font-sora text-[14px] text-[#0F2340]">{previewDoc.type}</p>
                  <p className="font-mono text-[12px] text-[#777777]">{previewDoc.number} · {previewDoc.project}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewDoc.fileUrl && (
                  <a href={previewDoc.fileUrl} download={previewDoc.fileName || `${previewDoc.number}.pdf`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4F8A] hover:bg-[#2E6DA4] text-white text-[12px] font-medium rounded-lg transition-colors">
                    <Download size={12} /> Download
                  </a>
                )}
                <button onClick={() => setPreviewDoc(null)} className="w-8 h-8 rounded-lg bg-[#F7F9FC] hover:bg-[#E0E0E0] flex items-center justify-center transition-colors">
                  <X size={14} className="text-[#777777]" />
                </button>
              </div>
            </div>
            <iframe src={previewDoc.fileUrl || '/blank.pdf'} title={previewDoc.number} className="flex-1 w-full" style={{ border: 'none' }} />
          </div>
        </div>
      )}

      {/* E-sign modal */}
      {signingDoc && (
        <OtpSignModal
          doc={signingDoc}
          onClose={() => setSigningDoc(null)}
          onSigned={handleSigned}
        />
      )}

      {/* Certificate modal */}
      {certInfo && (
        <CertificateModal
          signatureId={certInfo.signatureId}
          doc={certInfo.doc}
          onClose={() => setCertInfo(null)}
        />
      )}
    </div>
  )
}
