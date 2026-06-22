import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Building2, MapPin, Phone, Globe, Hash, Users,
  User, Mail, Lock, Eye, EyeOff, Briefcase,
  ChevronRight, ChevronLeft, CheckCircle2,
  ShieldCheck, Palette, HardHat, UserCircle, Wrench,
} from 'lucide-react'

const COMPANY_TYPES = [
  { value: 'Interior Design Studio',  label: 'Interior Design Studio'  },
  { value: 'Architecture Firm',       label: 'Architecture Firm'       },
  { value: 'Construction Company',    label: 'Construction Company'    },
  { value: 'Design & Build',          label: 'Design & Build'          },
  { value: 'Renovation Contractor',   label: 'Renovation Contractor'   },
  { value: 'Other',                   label: 'Other'                   },
]

const TEAM_SIZES = [
  { value: '1–10',   label: '1 – 10 people'   },
  { value: '11–50',  label: '11 – 50 people'  },
  { value: '51–200', label: '51 – 200 people' },
  { value: '200+',   label: '200+ people'     },
]

const ROLES = [
  { value: 'Admin',      label: 'Owner / Admin',  desc: 'Full access',        icon: ShieldCheck  },
  { value: 'Designer',   label: 'Designer',       desc: 'Design & studio',    icon: Palette      },
  { value: 'Supervisor', label: 'Supervisor',     desc: 'Site & field ops',   icon: HardHat      },
  { value: 'Client',     label: 'Client',         desc: 'Project view only',  icon: UserCircle   },
  { value: 'Vendor',     label: 'Vendor',         desc: 'Supplies & quotes',  icon: Wrench       },
  { value: 'Worker',     label: 'Field Worker',   desc: 'Daily task updates', icon: Users        },
]

const blank1 = { companyName: '', type: '', city: '', phone: '', website: '', gstin: '', teamSize: '' }
const blank2 = { name: '', email: '', phone: '', designation: '', password: '', confirm: '' }

function FieldError({ msg }) {
  return msg ? <p className="text-[11px] text-[#dc2626] mt-1">{msg}</p> : null
}

function Input({ icon: Icon, error, ...props }) {
  return (
    <div>
      <div className="relative group">
        {Icon && (
          <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#AAAAAA] pointer-events-none group-focus-within:text-[#1B4F8A] transition-colors" />
        )}
        <input
          {...props}
          className={[
            'w-full py-3 text-[13px] bg-white border rounded-xl focus:outline-none transition-colors text-[#333333] placeholder:text-[#BBBBBB]',
            Icon ? 'pl-10 pr-4' : 'px-4',
            error ? 'border-[#dc2626]' : 'border-[#DDDDDD] focus:border-[#1B4F8A]',
          ].join(' ')}
        />
      </div>
      <FieldError msg={error} />
    </div>
  )
}

function SelectField({ icon: Icon, error, children, ...props }) {
  return (
    <div>
      <div className="relative group">
        {Icon && (
          <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#AAAAAA] pointer-events-none group-focus-within:text-[#1B4F8A] transition-colors z-10" />
        )}
        <select
          {...props}
          className={[
            'w-full py-3 text-[13px] bg-white border rounded-xl focus:outline-none transition-colors appearance-none cursor-pointer',
            Icon ? 'pl-10 pr-8' : 'px-4 pr-8',
            error ? 'border-[#dc2626] text-[#333333]' : 'border-[#DDDDDD] focus:border-[#1B4F8A]',
            props.value ? 'text-[#333333]' : 'text-[#BBBBBB]',
          ].join(' ')}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23AAAAAA'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            backgroundSize: '13px',
          }}
        >
          {children}
        </select>
      </div>
      <FieldError msg={error} />
    </div>
  )
}

/* ── Step indicators ──────────────────────────────────────────────────────── */
function StepBar({ step }) {
  return (
    <div className="flex items-center gap-0 mb-7">
      {[1, 2].map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div className={[
            'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shrink-0',
            step > s  ? 'bg-[#1B4F8A] text-white'  :
            step === s ? 'bg-[#0F2340] text-white ring-2 ring-[#0F2340]/20' :
                        'bg-[#F0F2F5] text-[#AAAAAA]',
          ].join(' ')}>
            {step > s ? <CheckCircle2 size={13} strokeWidth={2.5} /> : s}
          </div>
          <div className="flex-1 mx-2">
            <p className={`text-[10px] font-semibold leading-tight ${step === s ? 'text-[#0F2340]' : 'text-[#AAAAAA]'}`}>
              {s === 1 ? 'Company Info' : 'Your Account'}
            </p>
          </div>
          {i < 1 && (
            <div className="w-8 h-px bg-[#E0E0E0] mx-1 shrink-0" />
          )}
        </div>
      ))}
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()

  const [step,    setStep]    = useState(1)
  const [company, setCompany] = useState(blank1)
  const [user,    setUser]    = useState(blank2)
  const [role,    setRole]    = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showCfm, setShowCfm] = useState(false)
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  const setC = (k, v) => setCompany(p => ({ ...p, [k]: v }))
  const setU = (k, v) => setUser(p => ({ ...p, [k]: v }))

  /* ── Validation ── */
  function validateStep1() {
    const e = {}
    if (!company.companyName.trim()) e.companyName = 'Company name is required'
    if (!company.type)               e.type        = 'Please select a company type'
    if (!company.city.trim())        e.city        = 'City is required'
    if (!company.phone.trim())       e.phone       = 'Phone number is required'
    return e
  }

  function validateStep2() {
    const e = {}
    if (!user.name.trim())            e.name     = 'Full name is required'
    if (!user.email.trim())           e.email    = 'Email address is required'
    if (!user.phone.trim())           e.phone    = 'Phone number is required'
    if (!role)                        e.role     = 'Please select your role'
    if (user.password.length < 6)     e.password = 'Minimum 6 characters'
    if (user.password !== user.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  function handleNext(e) {
    e.preventDefault()
    const e1 = validateStep1()
    if (Object.keys(e1).length) { setErrors(e1); return }
    setErrors({})
    setStep(2)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const e2 = validateStep2()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setErrors({})
    setLoading(true)
    // Demo: simulate a 1.5s "registration" then show success
    setTimeout(() => {
      setLoading(false)
      setDone(true)
    }, 1500)
  }

  /* ── Success screen ── */
  if (done) {
    return (
      <>
        <style>{ANIM_CSS}</style>
        <div className="min-h-screen flex items-center justify-center px-4 bg-[#080808] relative">
          <BlobBg />
          <div className="relative z-10 w-full max-w-[420px]">
            <div className="bg-white rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.65)] px-8 py-12 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center mb-1">
                <CheckCircle2 size={32} className="text-[#15803d]" strokeWidth={1.75} />
              </div>
              <h2 className="font-sora font-bold text-[20px] text-[#0F2340]">You're all set!</h2>
              <p className="text-[13px] text-[#777777] leading-relaxed max-w-xs">
                <span className="font-semibold text-[#333333]">{company.companyName}</span> has been registered.
                Your admin account is ready — log in to get started.
              </p>
              <div className="w-full bg-[#F7F9FC] rounded-xl px-4 py-3 text-left space-y-1.5 mt-1">
                <Row label="Company"  value={company.companyName} />
                <Row label="Type"     value={company.type} />
                <Row label="City"     value={company.city} />
                <Row label="Name"     value={user.name} />
                <Row label="Email"    value={user.email} />
                <Row label="Role"     value={ROLES.find(r => r.value === role)?.label ?? role} />
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full mt-2 py-3 text-[13px] font-semibold rounded-xl bg-[#0F2340] hover:bg-[#1B4F8A] text-white transition-colors shadow-[0_2px_14px_rgba(0,0,0,0.2)]"
              >
                Go to Login
              </button>
            </div>
            <p className="text-center text-[11px] text-white/30 mt-5">© 2025 InteriorOS. All rights reserved.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{ANIM_CSS}</style>

      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#080808] relative">
        <BlobBg />

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080808]/80 backdrop-blur-sm">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-white/10" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white spin" />
            </div>
            <p className="text-white/70 text-[13px] font-medium mt-4 tracking-wide">Setting up your workspace…</p>
          </div>
        )}

        <div className="relative z-10 w-full max-w-[460px]">
          <div className="bg-white rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.65)] overflow-hidden">
            <div className="px-8 pt-8 pb-8">

              {/* Logo */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 bg-[#f2f2f2] rounded-2xl flex items-center justify-center mb-3">
                  <svg viewBox="0 0 80 80" className="w-8 h-8 chair-float" fill="#111111">
                    <rect x="8"  y="36" width="62" height="8"  rx="4"/>
                    <rect x="55" y="10" width="5"  height="28" rx="2.5"/>
                    <rect x="64" y="10" width="5"  height="28" rx="2.5"/>
                    <rect x="53" y="10" width="18" height="6"  rx="3"/>
                    <rect x="53" y="23" width="18" height="5"  rx="2.5"/>
                    <rect x="10" y="44" width="5"  height="19" rx="2.5"/>
                    <rect x="63" y="44" width="5"  height="24" rx="2.5"/>
                    <rect x="37" y="44" width="6"  height="32" rx="3"/>
                  </svg>
                </div>
                <h1 className="font-sora font-bold text-[19px] text-[#111111] tracking-tight">Create your workspace</h1>
                <p className="text-[11px] text-[#AAAAAA] mt-1 tracking-widest uppercase">InteriorOS</p>
              </div>

              <StepBar step={step} />

              {/* ── Step 1: Company ── */}
              {step === 1 && (
                <form onSubmit={handleNext} className="space-y-3 fade-in">
                  <p className="text-[11px] font-semibold text-[#777777] uppercase tracking-widest mb-1">Company Details</p>

                  <Input
                    icon={Building2}
                    placeholder="Company name *"
                    value={company.companyName}
                    onChange={e => setC('companyName', e.target.value)}
                    error={errors.companyName}
                  />

                  <SelectField
                    icon={Briefcase}
                    value={company.type}
                    onChange={e => setC('type', e.target.value)}
                    error={errors.type}
                  >
                    <option value="">Company type *</option>
                    {COMPANY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </SelectField>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      icon={MapPin}
                      placeholder="City *"
                      value={company.city}
                      onChange={e => setC('city', e.target.value)}
                      error={errors.city}
                    />
                    <Input
                      icon={Phone}
                      placeholder="Phone *"
                      type="tel"
                      value={company.phone}
                      onChange={e => setC('phone', e.target.value)}
                      error={errors.phone}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      icon={Globe}
                      placeholder="Website (optional)"
                      value={company.website}
                      onChange={e => setC('website', e.target.value)}
                    />
                    <Input
                      icon={Hash}
                      placeholder="GSTIN (optional)"
                      value={company.gstin}
                      onChange={e => setC('gstin', e.target.value)}
                    />
                  </div>

                  <SelectField
                    icon={Users}
                    value={company.teamSize}
                    onChange={e => setC('teamSize', e.target.value)}
                  >
                    <option value="">Team size (optional)</option>
                    {TEAM_SIZES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </SelectField>

                  <button type="submit"
                    className="w-full py-3 mt-1 text-[13px] font-semibold rounded-xl bg-[#0F2340] hover:bg-[#1B4F8A] text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_2px_14px_rgba(0,0,0,0.2)]">
                    Continue <ChevronRight size={15} />
                  </button>
                </form>
              )}

              {/* ── Step 2: Personal ── */}
              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-3 fade-in">
                  <p className="text-[11px] font-semibold text-[#777777] uppercase tracking-widest mb-1">Your Details</p>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      icon={User}
                      placeholder="Full name *"
                      value={user.name}
                      onChange={e => setU('name', e.target.value)}
                      error={errors.name}
                    />
                    <Input
                      icon={Phone}
                      placeholder="Phone *"
                      type="tel"
                      value={user.phone}
                      onChange={e => setU('phone', e.target.value)}
                      error={errors.phone}
                    />
                  </div>

                  <Input
                    icon={Mail}
                    placeholder="Work email address *"
                    type="email"
                    value={user.email}
                    onChange={e => setU('email', e.target.value)}
                    error={errors.email}
                  />

                  <Input
                    icon={Briefcase}
                    placeholder="Designation (e.g. Lead Designer)"
                    value={user.designation}
                    onChange={e => setU('designation', e.target.value)}
                  />

                  {/* Role picker */}
                  <div>
                    <p className="text-[11px] font-semibold text-[#777777] uppercase tracking-widest mb-2">Your Role *</p>
                    <div className="grid grid-cols-3 gap-2">
                      {ROLES.map(r => {
                        const Icon   = r.icon
                        const active = role === r.value
                        return (
                          <button key={r.value} type="button" onClick={() => setRole(r.value)}
                            className={[
                              'flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border transition-all duration-150 text-center',
                              active
                                ? 'bg-[#D6E8F7]/60 border-[#1B4F8A]/50'
                                : 'bg-[#F7F9FC] border-[#EFEFEF] hover:border-[#D0D5DD]',
                            ].join(' ')}>
                            <Icon size={16} strokeWidth={1.75} className={active ? 'text-[#1B4F8A]' : 'text-[#AAAAAA]'} />
                            <span className={`text-[11px] font-semibold leading-tight ${active ? 'text-[#1B4F8A]' : 'text-[#333333]'}`}>{r.label}</span>
                            <span className={`text-[9px] leading-tight ${active ? 'text-[#1B4F8A]/70' : 'text-[#AAAAAA]'}`}>{r.desc}</span>
                          </button>
                        )
                      })}
                    </div>
                    <FieldError msg={errors.role} />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="relative group">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#AAAAAA] pointer-events-none group-focus-within:text-[#1B4F8A] transition-colors" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Password (min 6 characters) *"
                        value={user.password}
                        onChange={e => setU('password', e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 text-[13px] bg-white border rounded-xl focus:outline-none transition-colors text-[#333333] placeholder:text-[#BBBBBB] ${errors.password ? 'border-[#dc2626]' : 'border-[#DDDDDD] focus:border-[#1B4F8A]'}`}
                      />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#333333] transition-colors">
                        {showPwd ? <EyeOff size={14}/> : <Eye size={14}/>}
                      </button>
                    </div>
                    <FieldError msg={errors.password} />
                  </div>

                  <div>
                    <div className="relative group">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#AAAAAA] pointer-events-none group-focus-within:text-[#1B4F8A] transition-colors" />
                      <input
                        type={showCfm ? 'text' : 'password'}
                        placeholder="Confirm password *"
                        value={user.confirm}
                        onChange={e => setU('confirm', e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 text-[13px] bg-white border rounded-xl focus:outline-none transition-colors text-[#333333] placeholder:text-[#BBBBBB] ${errors.confirm ? 'border-[#dc2626]' : 'border-[#DDDDDD] focus:border-[#1B4F8A]'}`}
                      />
                      <button type="button" onClick={() => setShowCfm(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#333333] transition-colors">
                        {showCfm ? <EyeOff size={14}/> : <Eye size={14}/>}
                      </button>
                    </div>
                    <FieldError msg={errors.confirm} />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setStep(1); setErrors({}) }}
                      className="flex items-center gap-1.5 px-5 py-3 text-[13px] font-semibold rounded-xl border border-[#E0E0E0] text-[#555555] hover:bg-[#F7F9FC] transition-colors">
                      <ChevronLeft size={14} /> Back
                    </button>
                    <button type="submit"
                      className="flex-1 py-3 text-[13px] font-semibold rounded-xl bg-[#0F2340] hover:bg-[#1B4F8A] text-white transition-all duration-200 shadow-[0_2px_14px_rgba(0,0,0,0.2)]">
                      Create Account
                    </button>
                  </div>
                </form>
              )}

              <p className="text-center text-[12px] text-[#AAAAAA] mt-5">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[#333333] hover:text-[#1B4F8A] transition-colors">Log in</Link>
              </p>

            </div>
          </div>
          <p className="text-center text-[11px] text-white/30 mt-5">© 2025 InteriorOS. All rights reserved.</p>
        </div>
      </div>
    </>
  )
}

/* ── small summary row ── */
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[#AAAAAA]">{label}</span>
      <span className="text-[12px] font-medium text-[#333333]">{value}</span>
    </div>
  )
}

/* ── shared animated background ── */
function BlobBg() {
  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0 }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="reg-blur" x="-60%" y="-60%" width="220%" height="220%">
            <feTurbulence type="turbulence" baseFrequency="0.006 0.009" numOctaves="5" seed="11" result="noise">
              <animate attributeName="baseFrequency" values="0.006 0.009;0.011 0.006;0.008 0.013;0.006 0.009" dur="18s" repeatCount="indefinite"/>
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="50" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
            <feGaussianBlur in="displaced" stdDeviation="14"/>
          </filter>
        </defs>
      </svg>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ filter: 'url(#reg-blur)' }}>
        <div className="fA absolute -bottom-[15%] -left-[8%]  w-[450px] h-[600px] rounded-full bg-white/[0.28] blur-[45px]" />
        <div className="fB absolute -bottom-[12%] -right-[6%] w-[480px] h-[560px] rounded-full bg-white/[0.22] blur-[55px]" style={{ animationDelay: '-14s' }} />
        <div className="fC absolute -bottom-[8%]  left-[30%]  w-[520px] h-[620px] rounded-full bg-white/[0.18] blur-[60px]" style={{ animationDelay: '-8s' }} />
        <div className="fD absolute -bottom-[8%]  -left-[15%] w-[130%]  h-[320px] rounded-[50%] bg-white/[0.20] blur-[70px]" style={{ animationDelay: '-22s' }} />
      </div>
    </>
  )
}

const ANIM_CSS = `
  @keyframes chairFloat {
    0%  { transform: translate(0px,0px) rotate(0deg); }
    18% { transform: translate(6px,-10px) rotate(13deg); }
    36% { transform: translate(-8px,-17px) rotate(-8deg); }
    54% { transform: translate(11px,-6px) rotate(20deg); }
    72% { transform: translate(-5px,7px) rotate(-5deg); }
    100%{ transform: translate(0px,0px) rotate(0deg); }
  }
  .chair-float { animation: chairFloat 16s ease-in-out infinite; }
  @keyframes floatA { from{transform:translate(0,0) scale(1);} to{transform:translate(45px,-55px) scale(1.07);} }
  @keyframes floatB { from{transform:translate(0,0) scale(1);} to{transform:translate(-55px,-45px) scale(0.93);} }
  @keyframes floatC { from{transform:translate(0,0) scale(1);} to{transform:translate(30px,-60px) scale(1.04);} }
  @keyframes floatD { from{transform:translate(0,0) scale(1);} to{transform:translate(-40px,-30px) scale(0.96);} }
  .fA { animation: floatA 26s ease-in-out infinite alternate; }
  .fB { animation: floatB 32s ease-in-out infinite alternate; }
  .fC { animation: floatC 20s ease-in-out infinite alternate; }
  .fD { animation: floatD 36s ease-in-out infinite alternate; }
  @keyframes spin { to{transform:rotate(360deg);} }
  .spin { animation: spin 0.9s linear infinite; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
  .fade-in { animation: fadeIn 0.22s ease both; }
`
