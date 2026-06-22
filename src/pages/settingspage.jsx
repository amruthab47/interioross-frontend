import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Lock, Shield, Bell, Palette, Key, AlertTriangle,
  Eye, EyeOff, Copy, RefreshCw, Check, LogOut,
  Trash2, Smartphone, Mail, Globe, Moon, Sun, Monitor,
  CheckCircle2, XCircle, Info, Zap, Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { updateMe } from '../api/users'
import { apiFetch } from '../api/client'

// ── helpers ───────────────────────────────────────────────────────────────────
function useSaveBtn() {
  const [saved, setSaved] = useState(false)
  const trigger = useCallback(() => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])
  return [saved, trigger]
}

function SaveBtn({ onClick, label = 'Save Changes', className = '' }) {
  const [saved, triggerSave] = useSaveBtn()
  return (
    <button
      type="button"
      onClick={() => { onClick?.(); triggerSave() }}
      className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-all duration-200 ${saved ? 'bg-[#15803d]' : 'bg-primary hover:bg-[#163f6e]'} ${className}`}>
      {saved ? <><Check size={14} strokeWidth={2.5} /> Saved!</> : label}
    </button>
  )
}
function SaveBanner({ show }) {
  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
        @keyframes slideUp {
          from { opacity: 1; transform: translateY(0)     scale(1);    }
          to   { opacity: 0; transform: translateY(-12px) scale(0.97); }
        }
        .save-toast-in  { animation: slideDown 0.22s cubic-bezier(.22,.68,0,1.2) forwards; }
        .save-toast-out { animation: slideUp   0.18s ease-in forwards; pointer-events:none; }
      `}</style>
      {show && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 save-toast-in`}>
          <div className="flex items-center gap-2.5 px-5 py-3 bg-[#0F2340] text-white rounded-2xl shadow-2xl text-[13px] font-medium border border-white/10">
            <CheckCircle2 size={15} className="text-[#22c55e] shrink-0" />
            Changes saved successfully
          </div>
        </div>
      )}
    </>
  )
}

function SectionHeader({ title, desc }) {
  return (
    <div className="mb-6">
      <h3 className="font-sora font-bold text-[16px] text-body dark:text-white">{title}</h3>
      {desc && <p className="text-[12px] text-muted dark:text-slate-400 mt-1">{desc}</p>}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-body dark:text-slate-200 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted dark:text-slate-500 mt-1.5">{hint}</p>}
    </div>
  )
}

const inp = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-muted transition-colors'

function Toggle({ checked, onChange, label, desc }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer group py-3 border-b border-[#F4F4F4] dark:border-[#1A2236] last:border-0">
      <div>
        <p className="text-[13px] font-medium text-body dark:text-slate-200 group-hover:text-primary transition-colors">{label}</p>
        {desc && <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <div onClick={onChange}
        className={`relative w-10 h-5.5 rounded-full shrink-0 transition-colors duration-200 mt-0.5 ${checked ? 'bg-primary' : 'bg-[#D1D5DB] dark:bg-[#374151]'}`}
        style={{ height: '22px', width: '40px' }}>
        <span className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-[18px]' : ''}`} />
      </div>
    </label>
  )
}

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ chars',     ok: password.length >= 8              },
    { label: 'Uppercase',    ok: /[A-Z]/.test(password)            },
    { label: 'Number',       ok: /\d/.test(password)               },
    { label: 'Special char', ok: /[!@#$%^&*]/.test(password)       },
  ]
  const score = checks.filter(c => c.ok).length
  const bars  = [
    { min: 0, color: '' },
    { min: 1, color: 'bg-[#dc2626]' },
    { min: 2, color: 'bg-accent' },
    { min: 3, color: 'bg-[#eab308]' },
    { min: 4, color: 'bg-[#22c55e]' },
  ]
  const label = ['', 'Weak', 'Fair', 'Good', 'Strong'][score]
  const barColor = ['', 'bg-[#dc2626]', 'bg-accent', 'bg-[#eab308]', 'bg-[#22c55e]'][score]
  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= score ? barColor : 'bg-[#E5E7EB] dark:bg-[#374151]'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map(c => (
            <span key={c.label} className={`flex items-center gap-1 text-[10px] ${c.ok ? 'text-[#22c55e]' : 'text-muted dark:text-slate-500'}`}>
              {c.ok ? <Check size={9}/> : <span className="w-2 h-2 rounded-full border border-current inline-block"/>} {c.label}
            </span>
          ))}
        </div>
        <span className={`text-[11px] font-semibold ${['','text-[#dc2626]','text-accent','text-[#eab308]','text-[#22c55e]'][score]}`}>{label}</span>
      </div>
    </div>
  )
}

// ── SECTIONS ──────────────────────────────────────────────────────────────────

function PersonalSection({ user, updateUser, onSaved }) {
  const [form, setForm] = useState({
    name:  user.name  ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    city:  user.city  ?? '',
    bio:   user.bio   ?? '',
  })
  const [btnSaved, setBtnSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave(e) {
    e.preventDefault()
    setApiError('')
    setLoading(true)
    try {
      const initials = form.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
      const saved = await updateMe({ name: form.name, phone: form.phone, city: form.city, initials })
      updateUser({ ...saved, initials })
      onSaved()
      setBtnSaved(true)
      setTimeout(() => setBtnSaved(false), 2000)
    } catch (err) {
      setApiError(err.message || 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <SectionHeader title="Personal Details" desc="Your public profile and contact information." />

      {/* Avatar */}
      <div className="flex items-center gap-5 pb-5 border-b border-[#F0F2F5] dark:border-[#1F2937]">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-mid-blue flex items-center justify-center shrink-0 shadow-md">
          <span className="font-sora font-bold text-[22px] text-white">{user.initials}</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-body dark:text-slate-200">{user.name}</p>
          <p className="text-[12px] text-muted dark:text-slate-400 mt-0.5">{user.role} · Square Interiors</p>
          <span className="inline-block mt-1.5 text-[11px] font-medium text-muted bg-[#F7F9FC] dark:bg-[#1C2538] px-2.5 py-1 rounded-lg border border-[#EFEFEF] dark:border-[#2A3547]">
            Avatar uses your initials
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Field label="Full Name">
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inp} placeholder="Your full name" />
        </Field>
        <Field label="Role" hint="Contact your admin to change your role.">
          <div className={`${inp} bg-[#F7F9FC] dark:bg-[#0F1219] text-muted cursor-not-allowed`}>{user.role}</div>
        </Field>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Field label="Email Address">
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} placeholder="you@squareinteriors.in" />
        </Field>
        <Field label="Phone Number">
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} placeholder="+91 00000 00000" />
        </Field>
      </div>

      <Field label="City / Location">
        <input type="text" value={form.city} onChange={e => set('city', e.target.value)} className={inp} placeholder="e.g. Coimbatore" />
      </Field>

      <Field label="Bio" hint="A short description about yourself. Visible to team members.">
        <textarea rows={3} value={form.bio} onChange={e => set('bio', e.target.value)}
          className={`${inp} resize-none`} placeholder="Interior design professional…" />
      </Field>

      {apiError && <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] px-3 py-2 rounded-xl">{apiError}</p>}
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-60 ${btnSaved ? 'bg-[#15803d]' : 'bg-primary hover:bg-[#163f6e]'}`}>
          {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : btnSaved ? <><Check size={14} strokeWidth={2.5} /> Saved!</> : 'Save Changes'}
        </button>
        <button type="button" disabled={loading} onClick={() => setForm({ name: user.name, email: user.email, phone: user.phone, city: user.city, bio: user.bio ?? '' })}
          className="px-5 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
          Reset
        </button>
      </div>
    </form>
  )
}

function SecuritySection({ onSaved }) {
  const [cur,     setCur]     = useState('')
  const [nxt,     setNxt]     = useState('')
  const [conf,    setConf]    = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNxt, setShowNxt] = useState(false)
  const [err,     setErr]     = useState('')
  const [pwSaved, setPwSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const sessions = [
    { id: 1, device: 'Chrome on Windows 11', location: 'Coimbatore, TN', time: 'Active now',  current: true  },
    { id: 2, device: 'Safari on iPhone 14',  location: 'Coimbatore, TN', time: '2 hours ago', current: false },
    { id: 3, device: 'Chrome on MacBook',    location: 'Chennai, TN',    time: '3 days ago',  current: false },
  ]

  async function handleChange(e) {
    e.preventDefault()
    if (!cur.trim())    { setErr('Current password is required'); return }
    if (nxt.length < 6) { setErr('New password must be at least 6 characters'); return }
    if (nxt !== conf)   { setErr('Passwords do not match'); return }
    setErr('')
    setLoading(true)
    try {
      await apiFetch('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: cur, newPassword: nxt }),
      })
      setCur(''); setNxt(''); setConf('')
      onSaved()
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 2000)
    } catch (err2) {
      setErr(err2.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader title="Security" desc="Manage your password and active sessions." />

      {/* Change password */}
      <form onSubmit={handleChange} className="space-y-4">
        <p className="text-[13px] font-semibold text-body dark:text-slate-200 mb-3">Change Password</p>

        <Field label="Current Password">
          <div className="relative">
            <input type={showCur ? 'text' : 'password'} value={cur} onChange={e => setCur(e.target.value)}
              className={inp} placeholder="Enter current password" />
            <button type="button" onClick={() => setShowCur(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-body transition-colors">
              {showCur ? <EyeOff size={14}/> : <Eye size={14}/>}
            </button>
          </div>
        </Field>

        <Field label="New Password">
          <div className="relative">
            <input type={showNxt ? 'text' : 'password'} value={nxt} onChange={e => setNxt(e.target.value)}
              className={inp} placeholder="Enter new password" />
            <button type="button" onClick={() => setShowNxt(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-body transition-colors">
              {showNxt ? <EyeOff size={14}/> : <Eye size={14}/>}
            </button>
          </div>
          <PasswordStrength password={nxt} />
        </Field>

        <Field label="Confirm New Password">
          <input type="password" value={conf} onChange={e => setConf(e.target.value)}
            className={`${inp} ${conf && conf !== nxt ? 'border-[#dc2626]' : ''}`} placeholder="Repeat new password" />
          {conf && conf !== nxt && <p className="text-[11px] text-[#dc2626] mt-1">Passwords do not match</p>}
        </Field>

        {err && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#FEF2F2] dark:bg-[#2D0808] rounded-xl text-[12px] text-[#dc2626]">
            <XCircle size={13}/> {err}
          </div>
        )}

        <button type="submit" disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-60 ${pwSaved ? 'bg-[#15803d]' : 'bg-primary hover:bg-[#163f6e]'}`}>
          {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : pwSaved ? <><Check size={14} strokeWidth={2.5} /> Saved!</> : 'Update Password'}
        </button>
      </form>

      {/* Active sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-body dark:text-slate-200">Active Sessions</p>
          <button className="text-[11px] font-medium text-[#dc2626] hover:text-[#b91c1c] transition-colors">
            Sign out all other devices
          </button>
        </div>
        <div className="rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">
          {sessions.map((s, idx) => (
            <div key={s.id} className={`flex items-center gap-3 px-4 py-3.5 ${idx > 0 ? 'border-t border-[#F4F4F4] dark:border-[#1A2236]' : ''} ${s.current ? 'bg-light-blue/30 dark:bg-[#1B2D4A]/40' : 'hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236]'} transition-colors`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.current ? 'bg-light-blue dark:bg-[#1B2D4A]' : 'bg-[#F7F9FC] dark:bg-[#1C2538]'}`}>
                <Monitor size={16} strokeWidth={1.75} className={s.current ? 'text-primary dark:text-[#5B9BD5]' : 'text-muted'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-body dark:text-slate-200">{s.device}</p>
                  {s.current && <span className="text-[10px] font-semibold text-[#15803d] bg-[#F0FDF4] dark:bg-[#0A2318] px-1.5 py-0.5 rounded-md">Current</span>}
                </div>
                <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">{s.location} · {s.time}</p>
              </div>
              {!s.current && (
                <button className="text-[11px] font-medium text-[#dc2626] hover:text-[#b91c1c] shrink-0 transition-colors">Revoke</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TwoFASection({ onSaved }) {
  const [enabled,  setEnabled]  = useState(false)
  const [method,   setMethod]   = useState('app')
  const [step,     setStep]     = useState(0)
  const [code,     setCode]     = useState('')
  const [codeErr,  setCodeErr]  = useState(false)
  const [showCodes, setShowCodes] = useState(false)

  const backupCodes = ['A3K9-XP2M','BT7Q-NR4L','C8W5-YD6J','DH2E-ZF3K','E5V1-MG8N','F4U6-PQ7R']

  function handleVerify() {
    if (code === '123456') { setEnabled(true); setStep(0); setCode(''); onSaved() }
    else setCodeErr(true)
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Two-Factor Authentication" desc="Add an extra layer of security to your account." />

      {/* Status */}
      <div className={`flex items-center justify-between px-5 py-4 rounded-2xl border ${enabled ? 'bg-[#F0FDF4] dark:bg-[#0A2318] border-[#86efac] dark:border-[#166534]' : 'bg-[#FFF3E8] dark:bg-[#2D1F0A] border-[#f5c98a] dark:border-[#5A3A10]'}`}>
        <div className="flex items-center gap-3">
          <Shield size={20} strokeWidth={1.75} className={enabled ? 'text-[#15803d]' : 'text-accent'} />
          <div>
            <p className="text-[13px] font-semibold text-body dark:text-white">2FA is {enabled ? 'enabled' : 'disabled'}</p>
            <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5">
              {enabled ? 'Your account is protected with two-factor authentication.' : 'Enable 2FA to secure your account.'}
            </p>
          </div>
        </div>
        {enabled
          ? <button onClick={() => { setEnabled(false) }} className="text-[12px] font-semibold text-[#dc2626] bg-[#FEF2F2] dark:bg-[#2D0808] px-3 py-1.5 rounded-lg hover:bg-[#FEE2E2] transition-colors">Disable</button>
          : <button onClick={() => setStep(1)} className="text-[12px] font-semibold text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-[#163f6e] transition-colors">Enable 2FA</button>
        }
      </div>

      {/* Setup flow */}
      {step === 1 && !enabled && (
        <div className="rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937] bg-[#F7F9FC] dark:bg-[#0F1219]">
            <p className="text-[13px] font-semibold text-body dark:text-white">Set up Two-Factor Authentication</p>
          </div>

          <div className="px-5 py-5 space-y-5">
            {/* Method selection */}
            <div>
              <p className="text-[12px] font-semibold text-muted dark:text-slate-400 uppercase tracking-widest mb-3">Choose method</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {[
                  { id: 'app', label: 'Authenticator App', desc: 'Google Authenticator, Authy, etc.', Icon: Smartphone },
                  { id: 'sms', label: 'SMS / Phone',        desc: 'Get code via text message',         Icon: Mail       },
                ].map(({ id, label, desc, Icon }) => (
                  <button key={id} type="button" onClick={() => setMethod(id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${method === id ? 'bg-light-blue/40 dark:bg-[#1B2D4A] border-primary/40' : 'border-[#EFEFEF] dark:border-[#2A3547] hover:border-primary/30'}`}>
                    <Icon size={16} strokeWidth={1.75} className={method === id ? 'text-primary dark:text-[#5B9BD5]' : 'text-muted'} />
                    <div>
                      <p className={`text-[12px] font-semibold ${method === id ? 'text-primary dark:text-[#5B9BD5]' : 'text-body dark:text-slate-200'}`}>{label}</p>
                      <p className="text-[10px] text-muted mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* QR / instructions */}
            {method === 'app' ? (
              <div className="space-y-3">
                <p className="text-[12px] text-muted dark:text-slate-400">Scan this QR code with your authenticator app:</p>
                <div className="w-36 h-36 bg-[#F7F9FC] dark:bg-[#1C2538] rounded-xl border border-[#EFEFEF] dark:border-[#2A3547] flex items-center justify-center mx-auto">
                  {/* Simulated QR code grid */}
                  <svg viewBox="0 0 80 80" className="w-28 h-28 opacity-80">
                    {[...Array(7)].map((_, r) => [...Array(7)].map((_, c) => {
                      const corner = (r < 3 && c < 3) || (r < 3 && c > 3) || (r > 3 && c < 3)
                      const fill = corner ? '#0F2340' : ((r * 7 + c * 3 + r + c) % 3 === 0 ? '#0F2340' : 'transparent')
                      return <rect key={`${r}-${c}`} x={c * 11 + 1} y={r * 11 + 1} width={9} height={9} rx={1} fill={fill} />
                    }))}
                  </svg>
                </div>
                <p className="text-[11px] text-muted text-center">Or enter code manually: <span className="font-mono font-semibold text-body dark:text-slate-200">JBSW Y3DP EHPK 3PXP</span></p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[12px] text-muted dark:text-slate-400">We'll send a code to your registered phone number:</p>
                <div className={`${inp} bg-[#F7F9FC] dark:bg-[#0F1219] text-muted`}>{'+91 98400 ••••••'}</div>
              </div>
            )}

            {/* Code input */}
            <div>
              <p className="text-[12px] font-semibold text-body dark:text-slate-200 mb-1.5">Enter verification code</p>
              <div className="flex gap-3">
                <input type="text" maxLength={6} placeholder="000000"
                  value={code} onChange={e => { setCode(e.target.value.replace(/\D/,'')); setCodeErr(false) }}
                  className={`${inp} font-mono tracking-[0.3em] text-center w-40 ${codeErr ? 'border-[#dc2626]' : ''}`} />
                <button type="button" onClick={handleVerify}
                  className="px-4 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-xl transition-colors">
                  Verify
                </button>
                <button type="button" onClick={() => { setStep(0); setCode(''); setCodeErr(false) }}
                  className="px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-primary hover:text-primary transition-colors">
                  Cancel
                </button>
              </div>
              {codeErr && <p className="text-[11px] text-[#dc2626] mt-1.5">Incorrect code. (Hint: use 123456 for demo)</p>}
            </div>
          </div>
        </div>
      )}

      {/* Backup codes */}
      {enabled && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-body dark:text-slate-200">Backup Codes</p>
            <button onClick={() => setShowCodes(v => !v)}
              className="text-[11px] font-medium text-primary dark:text-[#5B9BD5] hover:underline">
              {showCodes ? 'Hide codes' : 'Show codes'}
            </button>
          </div>
          {showCodes ? (
            <div className="grid grid-cols-3 gap-2 p-4 rounded-xl bg-[#F7F9FC] dark:bg-[#1C2538] border border-[#EFEFEF] dark:border-[#2A3547]">
              {backupCodes.map(c => (
                <span key={c} className="font-mono text-[12px] font-semibold text-body dark:text-slate-200 text-center py-1.5">{c}</span>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 rounded-xl bg-[#F7F9FC] dark:bg-[#1C2538] border border-[#EFEFEF] dark:border-[#2A3547] text-[12px] text-muted text-center">
              ••••-•••• × 6 backup codes available
            </div>
          )}
          <p className="text-[11px] text-muted dark:text-slate-500 mt-2">Save these codes in a safe place — each can be used once if you lose access to your device.</p>
        </div>
      )}
    </div>
  )
}

function NotificationsSection({ onSaved }) {
  const [prefs, setPrefs] = useState({
    masterEmail:  true,
    masterInApp:  true,
    leaveReq:     true,
    projectDelay: true,
    invoiceDue:   true,
    taskUpdate:   true,
    paymentRecv:  true,
    meetingInvite:true,
    dailyDigest:  false,
    weeklyReport: true,
    soundAlerts:  false,
    mobileNotif:  true,
  })
  const toggle = k => setPrefs(p => ({ ...p, [k]: !p[k] }))

  return (
    <div className="space-y-6">
      <SectionHeader title="Notifications" desc="Choose what alerts and updates you receive." />

      <div className="rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">
        <div className="px-5 py-3 bg-[#F7F9FC] dark:bg-[#0F1219] border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <p className="text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest">Channels</p>
        </div>
        <div className="px-5">
          <Toggle checked={prefs.masterEmail}  onChange={() => toggle('masterEmail')}  label="Email notifications"      desc="Receive updates at your registered email address" />
          <Toggle checked={prefs.masterInApp}  onChange={() => toggle('masterInApp')}  label="In-app notifications"     desc="Show alerts in the notification bell"              />
          <Toggle checked={prefs.mobileNotif}  onChange={() => toggle('mobileNotif')}  label="Mobile push notifications" desc="Push alerts on your phone (requires app)"         />
          <Toggle checked={prefs.soundAlerts}  onChange={() => toggle('soundAlerts')}  label="Sound alerts"             desc="Play a sound when new notifications arrive"        />
        </div>
      </div>

      <div className="rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">
        <div className="px-5 py-3 bg-[#F7F9FC] dark:bg-[#0F1219] border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <p className="text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest">Alert Types</p>
        </div>
        <div className="px-5">
          <Toggle checked={prefs.leaveReq}      onChange={() => toggle('leaveReq')}      label="Leave requests"        desc="When a team member submits or updates a leave"     />
          <Toggle checked={prefs.projectDelay}  onChange={() => toggle('projectDelay')}  label="Project delays"        desc="When a project falls behind schedule"               />
          <Toggle checked={prefs.invoiceDue}    onChange={() => toggle('invoiceDue')}    label="Invoice & payment due" desc="When invoices or payments need attention"           />
          <Toggle checked={prefs.taskUpdate}    onChange={() => toggle('taskUpdate')}    label="Task updates"          desc="When tasks are assigned, updated, or completed"     />
          <Toggle checked={prefs.paymentRecv}   onChange={() => toggle('paymentRecv')}   label="Payment received"      desc="When a client payment is confirmed"                 />
          <Toggle checked={prefs.meetingInvite} onChange={() => toggle('meetingInvite')} label="Meeting invitations"   desc="When you are invited to or scheduled for a meeting" />
        </div>
      </div>

      <div className="rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">
        <div className="px-5 py-3 bg-[#F7F9FC] dark:bg-[#0F1219] border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <p className="text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest">Digest & Reports</p>
        </div>
        <div className="px-5">
          <Toggle checked={prefs.dailyDigest}  onChange={() => toggle('dailyDigest')}  label="Daily summary digest"  desc="Receive a daily email summary at 8 AM"            />
          <Toggle checked={prefs.weeklyReport} onChange={() => toggle('weeklyReport')} label="Weekly report email"   desc="Receive weekly performance report every Monday"   />
        </div>
      </div>

      <SaveBtn onClick={onSaved} label="Save Preferences" />
    </div>
  )
}

function AppearanceSection({ onSaved }) {
  const { isDark, toggleTheme } = useTheme()
  const [density, setDensity] = useState('default')
  const [accent,  setAccent]  = useState('blue')

  const ACCENTS = [
    { id: 'blue',   color: '#1B4F8A', label: 'Navy Blue'    },
    { id: 'orange', color: '#E07B20', label: 'Amber Orange' },
    { id: 'green',  color: '#15803d', label: 'Forest Green' },
    { id: 'purple', color: '#7C3AED', label: 'Deep Violet'  },
    { id: 'teal',   color: '#0f766e', label: 'Teal'         },
  ]

  return (
    <div className="space-y-6">
      <SectionHeader title="Appearance" desc="Customise how InteriorOS looks for you." />

      {/* Theme */}
      <div className="rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">
        <div className="px-5 py-3 bg-[#F7F9FC] dark:bg-[#0F1219] border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <p className="text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest">Theme</p>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[
              { id: 'light', label: 'Light', desc: 'Clean white interface', Icon: Sun   },
              { id: 'dark',  label: 'Dark',  desc: 'Easy on the eyes',      Icon: Moon  },
            ].map(({ id, label, desc, Icon }) => {
              const active = (id === 'dark') === isDark
              return (
                <button key={id} type="button" onClick={() => { if ((id === 'dark') !== isDark) toggleTheme() }}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${active ? 'bg-light-blue/40 dark:bg-[#1B2D4A] border-primary/40' : 'border-[#EFEFEF] dark:border-[#2A3547] hover:border-primary/30'}`}>
                  <Icon size={18} strokeWidth={1.75} className={active ? 'text-primary dark:text-[#5B9BD5]' : 'text-muted'} />
                  <div>
                    <p className={`text-[13px] font-semibold ${active ? 'text-primary dark:text-[#5B9BD5]' : 'text-body dark:text-slate-200'}`}>{label}</p>
                    <p className="text-[10px] text-muted mt-0.5">{desc}</p>
                  </div>
                  {active && <Check size={14} className="text-primary dark:text-[#5B9BD5] ml-auto" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Density */}
      <div className="rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">
        <div className="px-5 py-3 bg-[#F7F9FC] dark:bg-[#0F1219] border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <p className="text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest">Interface Density</p>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { id: 'compact', label: 'Compact', desc: 'More on screen' },
              { id: 'default', label: 'Default', desc: 'Balanced'       },
              { id: 'comfort', label: 'Comfortable', desc: 'More space' },
            ].map(({ id, label, desc }) => (
              <button key={id} type="button" onClick={() => setDensity(id)}
                className={`py-3 px-3 rounded-xl border text-center transition-all ${density === id ? 'bg-light-blue/40 dark:bg-[#1B2D4A] border-primary/40' : 'border-[#EFEFEF] dark:border-[#2A3547] hover:border-primary/30'}`}>
                <p className={`text-[12px] font-semibold ${density === id ? 'text-primary dark:text-[#5B9BD5]' : 'text-body dark:text-slate-200'}`}>{label}</p>
                <p className="text-[10px] text-muted mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accent colour */}
      <div className="rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">
        <div className="px-5 py-3 bg-[#F7F9FC] dark:bg-[#0F1219] border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <p className="text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest">Accent Colour</p>
        </div>
        <div className="px-5 py-4 flex gap-4 flex-wrap">
          {ACCENTS.map(({ id, color, label }) => (
            <button key={id} type="button" onClick={() => setAccent(id)} title={label}
              className="flex flex-col items-center gap-1.5 group">
              <div className={`w-9 h-9 rounded-full transition-all duration-150 ${accent === id ? 'ring-2 ring-offset-2 ring-[#1B4F8A] scale-110 dark:ring-offset-[#141B27]' : 'hover:scale-105'}`}
                style={{ background: color }} />
              <span className={`text-[10px] font-medium ${accent === id ? 'text-body dark:text-white' : 'text-muted'}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <SaveBtn onClick={onSaved} label="Save Appearance" />
    </div>
  )
}

function PermissionsSection({ userRole }) {
  const isAdmin = userRole === 'Admin'

  const ROLES = ['Admin', 'Supervisor', 'Designer', 'Client']
  const PERMS = [
    { label: 'View Dashboard',        admin: true,  supervisor: true,  designer: true,  client: false },
    { label: 'Manage Projects',        admin: true,  supervisor: false, designer: false, client: false },
    { label: 'View Projects',          admin: true,  supervisor: true,  designer: true,  client: true  },
    { label: 'Submit Site Reports',    admin: true,  supervisor: true,  designer: false, client: false },
    { label: 'Manage Finance',         admin: true,  supervisor: false, designer: false, client: false },
    { label: 'View Finance',           admin: true,  supervisor: false, designer: false, client: true  },
    { label: 'Manage Attendance',      admin: true,  supervisor: true,  designer: false, client: false },
    { label: 'View Attendance',        admin: true,  supervisor: true,  designer: false, client: false },
    { label: 'Create Meetings',        admin: true,  supervisor: false, designer: false, client: false },
    { label: 'Request Meetings',       admin: true,  supervisor: true,  designer: true,  client: false },
    { label: 'Manage Clients',         admin: true,  supervisor: false, designer: false, client: false },
    { label: 'Manage Vendors',         admin: true,  supervisor: false, designer: false, client: false },
    { label: 'View Reports',           admin: true,  supervisor: true,  designer: false, client: false },
    { label: 'Chat with All Users',    admin: true,  supervisor: false, designer: false, client: false },
    { label: 'Use AI Assistant',       admin: true,  supervisor: true,  designer: true,  client: false },
    { label: 'Manage Settings',        admin: true,  supervisor: false, designer: false, client: false },
  ]

  const [perms, setPerms] = useState(PERMS)
  function toggle(rowIdx, role) {
    if (!isAdmin) return
    setPerms(p => p.map((r, i) => i === rowIdx ? { ...r, [role.toLowerCase()]: !r[role.toLowerCase()] } : r))
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Permissions" desc={isAdmin ? "Control what each role can access in InteriorOS." : "Your current access permissions within InteriorOS."} />

      {!isAdmin && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-light-blue/40 dark:bg-[#1B2D4A] rounded-xl border border-primary/20 text-[12px] text-primary dark:text-[#5B9BD5]">
          <Info size={13}/> Permission management is available to Admin users only. Contact your admin to request changes.
        </div>
      )}

      <div className="rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F7F9FC] dark:bg-[#0F1219]">
                <th className="text-left text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-wider px-5 py-3 w-64">Permission</th>
                {ROLES.map(r => (
                  <th key={r} className="text-center text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-wider px-4 py-3">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perms.map((perm, ri) => (
                <tr key={perm.label} className={`border-t border-[#F4F4F4] dark:border-[#1A2236] ${ri % 2 === 1 ? 'bg-[#FAFBFC] dark:bg-[#111620]' : ''}`}>
                  <td className="px-5 py-3 text-[12px] font-medium text-body dark:text-slate-300">{perm.label}</td>
                  {ROLES.map(r => {
                    const key     = r.toLowerCase()
                    const allowed = perm[key]
                    return (
                      <td key={r} className="px-4 py-3 text-center">
                        {isAdmin ? (
                          <button type="button" onClick={() => toggle(ri, r)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mx-auto transition-all ${allowed ? 'bg-primary border-primary' : 'border-[#D1D5DB] dark:border-[#374151] hover:border-primary/50'}`}>
                            {allowed && <Check size={10} strokeWidth={2.5} className="text-white" />}
                          </button>
                        ) : (
                          allowed
                            ? <CheckCircle2 size={16} strokeWidth={1.75} className="text-[#22c55e] mx-auto" />
                            : <span className="w-4 h-0.5 bg-[#D1D5DB] dark:bg-[#374151] rounded-full inline-block" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function CredentialsSection({ onSaved }) {
  const [apiKey,   setApiKey]   = useState('sk-si-8Xq2mNpL4vRtYcJk9WdZbHf3')
  const [copied,   setCopied]   = useState(false)
  const [showKey,  setShowKey]  = useState(false)
  const [webhook,  setWebhook]  = useState('https://squareinteriors.in/webhooks/interioross')

  function copyKey() {
    navigator.clipboard?.writeText(apiKey).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function regen() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const key = 'sk-si-' + Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setApiKey(key)
    onSaved()
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Credentials & API" desc="Manage your API keys and integration tokens. Admin access only." />

      <div className="rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">
        <div className="px-5 py-3 bg-[#F7F9FC] dark:bg-[#0F1219] border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <p className="text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest">API Key</p>
        </div>
        <div className="px-5 py-5 space-y-3">
          <p className="text-[12px] text-muted dark:text-slate-400">Use this key to access the InteriorOS API programmatically. Keep it secret.</p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-[#F7F9FC] dark:bg-[#0F1219] border border-[#EFEFEF] dark:border-[#2A3547] rounded-xl">
              <span className="font-mono text-[12px] text-body dark:text-slate-200 flex-1 truncate">
                {showKey ? apiKey : apiKey.slice(0, 10) + '•'.repeat(20)}
              </span>
              <button onClick={() => setShowKey(v => !v)} className="text-muted hover:text-body transition-colors shrink-0">
                {showKey ? <EyeOff size={13}/> : <Eye size={13}/>}
              </button>
            </div>
            <button onClick={copyKey}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[12px] font-medium rounded-xl border transition-all ${copied ? 'bg-[#F0FDF4] dark:bg-[#0A2318] border-[#86efac] text-[#15803d]' : 'border-[#DDDDDD] dark:border-[#2A3547] text-muted hover:border-primary hover:text-primary'}`}>
              {copied ? <><Check size={12}/> Copied</> : <><Copy size={12}/> Copy</>}
            </button>
            <button onClick={regen}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-[12px] font-medium text-[#dc2626] bg-[#FEF2F2] dark:bg-[#2D0808] border border-[#fca5a5] dark:border-[#7f1d1d] rounded-xl hover:bg-[#FEE2E2] transition-colors">
              <RefreshCw size={12}/> Regen
            </button>
          </div>
          <p className="text-[11px] text-muted dark:text-slate-500">Last generated: 15 Apr 2026 · Used: 3 times this month</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">
        <div className="px-5 py-3 bg-[#F7F9FC] dark:bg-[#0F1219] border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <p className="text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest">Webhook URL</p>
        </div>
        <div className="px-5 py-5 space-y-3">
          <p className="text-[12px] text-muted dark:text-slate-400">InteriorOS will POST event payloads to this URL for real-time integrations.</p>
          <div className="flex gap-2">
            <input type="url" value={webhook} onChange={e => setWebhook(e.target.value)} className={`${inp} flex-1 font-mono text-[12px]`} />
            <SaveBtn onClick={onSaved} label="Save" className="px-4 py-2.5 text-[12px]" />
          </div>
          <div className="flex gap-4">
            {[['Events sent', '128'], ['Last event', '2h ago'], ['Success rate', '99.2%']].map(([l, v]) => (
              <div key={l} className="text-center">
                <p className="text-[15px] font-bold text-body dark:text-white">{v}</p>
                <p className="text-[10px] text-muted">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DangerZoneSection({ onLogout }) {
  const navigate = useNavigate()
  const [showDeactivate, setShowDeactivate] = useState(false)
  const [showDelete,     setShowDelete]     = useState(false)
  const [confirmText,    setConfirmText]    = useState('')
  const [logoutAll,      setLogoutAll]      = useState(false)

  function handleLogout() {
    onLogout()
    navigate('/login')
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Danger Zone" desc="Irreversible actions. Please read carefully before proceeding." />

      {/* Logout */}
      <div className="rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F7F9FC] dark:bg-[#1C2538] flex items-center justify-center shrink-0 mt-0.5">
              <LogOut size={16} strokeWidth={1.75} className="text-muted" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-body dark:text-slate-200">Log out</p>
              <p className="text-[12px] text-muted dark:text-slate-400 mt-0.5">Sign out of your current session.</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="px-4 py-2 text-[12px] font-semibold text-body dark:text-slate-200 border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-primary hover:text-primary transition-colors shrink-0">
            Log out
          </button>
        </div>
      </div>

      {/* Log out all */}
      <div className="rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFF3E8] dark:bg-[#2D1F0A] flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone size={16} strokeWidth={1.75} className="text-accent" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-body dark:text-slate-200">Log out of all devices</p>
              <p className="text-[12px] text-muted dark:text-slate-400 mt-0.5">Revoke all active sessions across every device.</p>
            </div>
          </div>
          <button onClick={() => setLogoutAll(true)}
            className="px-4 py-2 text-[12px] font-semibold text-accent bg-[#FFF3E8] dark:bg-[#2D1F0A] rounded-xl hover:bg-[#FFE4C4] transition-colors shrink-0">
            Sign out all
          </button>
        </div>
        {logoutAll && (
          <div className="px-5 pb-4 flex items-center gap-2.5 text-[12px] text-[#15803d] bg-[#F0FDF4] dark:bg-[#0A2318] border-t border-[#EFEFEF] dark:border-[#1F2937] py-3">
            <CheckCircle2 size={14}/> All other sessions have been revoked.
          </div>
        )}
      </div>

      {/* Deactivate */}
      <div className="rounded-2xl border border-[#fca5a5] dark:border-[#7f1d1d] overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FEF2F2] dark:bg-[#2D0808] flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle size={16} strokeWidth={1.75} className="text-[#dc2626]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-body dark:text-slate-200">Deactivate account</p>
              <p className="text-[12px] text-muted dark:text-slate-400 mt-0.5">Temporarily disable your account. You can reactivate by contacting admin.</p>
            </div>
          </div>
          <button onClick={() => setShowDeactivate(v => !v)}
            className="px-4 py-2 text-[12px] font-semibold text-[#dc2626] bg-[#FEF2F2] dark:bg-[#2D0808] rounded-xl hover:bg-[#FEE2E2] transition-colors shrink-0">
            Deactivate
          </button>
        </div>
        {showDeactivate && (
          <div className="px-5 pb-4 space-y-3 border-t border-[#fca5a5] dark:border-[#7f1d1d]">
            <p className="text-[12px] text-[#dc2626] pt-3">Are you sure? This will disable your access until an admin re-enables it.</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-[12px] font-semibold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl transition-colors">
                Confirm Deactivate
              </button>
              <button onClick={() => setShowDeactivate(false)} className="px-4 py-2 text-[12px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:text-body transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete */}
      <div className="rounded-2xl border-2 border-[#dc2626]/30 dark:border-[#7f1d1d] overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FEF2F2] dark:bg-[#2D0808] flex items-center justify-center shrink-0 mt-0.5">
              <Trash2 size={16} strokeWidth={1.75} className="text-[#dc2626]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#dc2626]">Delete account permanently</p>
              <p className="text-[12px] text-muted dark:text-slate-400 mt-0.5">Permanently remove your account and all associated data. This cannot be undone.</p>
            </div>
          </div>
          <button onClick={() => setShowDelete(v => !v)}
            className="px-4 py-2 text-[12px] font-semibold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl transition-colors shrink-0">
            Delete
          </button>
        </div>
        {showDelete && (
          <div className="px-5 pb-5 space-y-3 border-t border-[#fca5a5] dark:border-[#7f1d1d] bg-[#FEF2F2]/40 dark:bg-[#1a0505]">
            <p className="text-[12px] text-[#dc2626] pt-3 font-medium">This action is <strong>irreversible</strong>. Type <strong>DELETE</strong> to confirm.</p>
            <input type="text" placeholder="Type DELETE to confirm"
              value={confirmText} onChange={e => setConfirmText(e.target.value)}
              className={`${inp} border-[#fca5a5] focus:border-[#dc2626]`} />
            <div className="flex gap-2">
              <button disabled={confirmText !== 'DELETE'}
                className="px-4 py-2 text-[12px] font-semibold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Permanently Delete
              </button>
              <button onClick={() => { setShowDelete(false); setConfirmText('') }}
                className="px-4 py-2 text-[12px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:text-body transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Settings Page ────────────────────────────────────────────────────────
const NAV = [
  { id: 'personal',      label: 'Personal',      Icon: User,          },
  { id: 'security',      label: 'Security',       Icon: Lock,          },
  { id: 'twofa',         label: '2FA',            Icon: Shield,        },
  { id: 'notifications', label: 'Notifications',  Icon: Bell,          },
  { id: 'appearance',    label: 'Appearance',     Icon: Palette,       },
  { id: 'permissions',   label: 'Permissions',    Icon: Key,           },
  { id: 'credentials',   label: 'Credentials',    Icon: Zap,  adminOnly: true },
  { id: 'danger',        label: 'Danger Zone',    Icon: AlertTriangle, danger: true },
]

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth()
  const [active,    setActive]    = useState('personal')
  const [savedShow, setSavedShow] = useState(false)

  function onSaved() {
    setSavedShow(true)
    setTimeout(() => setSavedShow(false), 2500)
  }

  const visibleNav = NAV.filter(n => !n.adminOnly || user?.role === 'Admin')

  return (
    <div className="space-y-4">

      {/* Horizontal tab bar */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-2 py-1.5">
        <nav className="flex items-center gap-0.5">
          {visibleNav.map(({ id, label, Icon, danger }) => {
            const isActive = active === id
            return (
              <button key={id} onClick={() => setActive(id)}
                className={[
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] whitespace-nowrap transition-all duration-150',
                  isActive
                    ? danger
                      ? 'bg-[#FEF2F2] dark:bg-[#2D0808] text-[#dc2626] font-semibold'
                      : 'bg-light-blue/50 dark:bg-[#1B2D4A] text-primary dark:text-[#5B9BD5] font-semibold'
                    : danger
                      ? 'text-[#dc2626]/60 hover:bg-[#FEF2F2]/60 dark:hover:bg-[#2D0808]/60 hover:text-[#dc2626]'
                      : 'text-muted dark:text-slate-400 hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] hover:text-body dark:hover:text-white',
                ].join(' ')}>
                <Icon size={14} strokeWidth={1.75} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-8 py-7 min-h-[500px] flex flex-col items-center">
        <div className="w-full max-w-2xl">
          {active === 'personal'      && <PersonalSection      user={user} updateUser={updateUser} onSaved={onSaved} />}
          {active === 'security'      && <SecuritySection      onSaved={onSaved} />}
          {active === 'twofa'         && <TwoFASection         onSaved={onSaved} />}
          {active === 'notifications' && <NotificationsSection onSaved={onSaved} />}
          {active === 'appearance'    && <AppearanceSection    onSaved={onSaved} />}
          {active === 'permissions'   && <PermissionsSection   userRole={user.role} />}
          {active === 'credentials'   && <CredentialsSection   onSaved={onSaved} />}
          {active === 'danger'        && <DangerZoneSection    onLogout={logout} />}
        </div>
      </div>

      <SaveBanner show={savedShow} />
    </div>
  )
}
