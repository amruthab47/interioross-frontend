import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, Palette, UserCircle, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const ROLES = [
  { label: 'Designer', icon: Palette,    path: '/designer', desc: 'Task view'   },
  { label: 'Client',   icon: UserCircle, path: '/client',   desc: 'Status view' },
]

/* ── 3-D Tilt sign-up card wrapper ──────────────────────────────────────── */
function TiltCard({ children, className = '', style = {} }) {
  const ref = useRef(null)
  
  const onMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(1000px) rotateY(${x * 12}deg) rotateX(${-y * 10}deg) translateZ(10px)`
    el.style.setProperty('--glow-x', `${(x + 0.5) * 100}%`)
    el.style.setProperty('--glow-y', `${(y + 0.5) * 100}%`)
  }, [])

  const onLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)'
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{
        ...style,
        transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  )
}

// 3D projections geometry data
const GEOMETRY = {
  cube: {
    vertices: [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 0], // Back
      [4, 5], [5, 6], [6, 7], [7, 4], // Front
      [0, 4], [1, 5], [2, 6], [3, 7]  // Connectors
    ]
  },
  tetra: {
    vertices: [
      [0, 1, 0],
      [-0.94, -0.33, -0.54],
      [0.94, -0.33, -0.54],
      [0, -0.33, 0.82]
    ],
    edges: [
      [0, 1], [0, 2], [0, 3],
      [1, 2], [2, 3], [3, 1]
    ]
  },
  octa: {
    vertices: [
      [0, 1.1, 0], [0, -1.1, 0],
      [1.1, 0, 0], [-1.1, 0, 0],
      [0, 0, 1.1], [0, 0, -1.1]
    ],
    edges: [
      [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 4], [4, 3], [3, 5], [5, 2]
    ]
  }
}

// 3D Projection math
const project3D = (x, y, z, rotX, rotY, rotZ, scale, cx, cy) => {
  let y1 = y * Math.cos(rotX) - z * Math.sin(rotX)
  let z1 = y * Math.sin(rotX) + z * Math.cos(rotX)
  let x2 = x * Math.cos(rotY) + z1 * Math.sin(rotY)
  let z2 = -x * Math.sin(rotY) + z1 * Math.cos(rotY)
  let x3 = x2 * Math.cos(rotZ) - y1 * Math.sin(rotZ)
  let y3 = x2 * Math.sin(rotZ) + y1 * Math.cos(rotZ)
  return { x: cx + x3 * scale, y: cy + y3 * scale }
}

export default function Signup() {
  const navigate  = useNavigate()
  const { login } = useAuth()
  
  const containerRef = useRef(null)
  const canvasRef   = useRef(null)
  const rafRef      = useRef(null)

  const [showPwd,     setShowPwd]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form,        setForm]        = useState({ name: '', email: '', password: '', confirm: '' })
  const [selectedRole, setRole]       = useState(null)
  const [rememberMe,  setRememberMe]  = useState(false)
  const [loading,      setLoading]    = useState(false)
  const [errors,       setErrors]     = useState({})
  const [apiError,     setApiError]   = useState('')

  // Track cursor position for spotlight and interactive physics
  const mouseRef = useRef({ x: undefined, y: undefined })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  /* ── Interactive Particle Grid & Floating 3D Blueprints Canvas ─────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = container.offsetWidth
      canvas.height = container.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let overlayOpacity = 0.9

    // Particles array
    const particleCount = 45
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 1.2
      })
    }

    // 3D Floating design wireframes state
    const shapes = [
      {
        type: 'cube',
        scale: 42,
        baseX: 0.15,
        baseY: 0.32,
        x: 0, y: 0,
        rx: Math.random() * Math.PI, ry: Math.random() * Math.PI, rz: Math.random() * Math.PI,
        rvx: 0.003, rvy: 0.004, rvz: 0.002,
        driftRange: 20, driftSpeed: 0.0006
      },
      {
        type: 'tetra',
        scale: 36,
        baseX: 0.85,
        baseY: 0.28,
        x: 0, y: 0,
        rx: Math.random() * Math.PI, ry: Math.random() * Math.PI, rz: Math.random() * Math.PI,
        rvx: 0.005, rvy: 0.002, rvz: 0.004,
        driftRange: 15, driftSpeed: 0.0008
      },
      {
        type: 'octa',
        scale: 40,
        baseX: 0.22,
        baseY: 0.72,
        x: 0, y: 0,
        rx: Math.random() * Math.PI, ry: Math.random() * Math.PI, rz: Math.random() * Math.PI,
        rvx: 0.002, rvy: 0.005, rvz: 0.003,
        driftRange: 25, driftSpeed: 0.0005
      }
    ]

    const onMouseMove = (e) => {
      const r = container.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - r.left,
        y: e.clientY - r.top
      }
    }

    const onMouseLeave = () => {
      mouseRef.current = { x: undefined, y: undefined }
    }

    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseleave', onMouseLeave)

    let lastTs = 0
    const frame = (ts) => {
      const dt = Math.min((ts - lastTs) / 1000, 0.05)
      lastTs = ts
      const cw = canvas.width
      const ch = canvas.height

      overlayOpacity = Math.max(0, overlayOpacity - dt * 0.7)

      ctx.clearRect(0, 0, cw, ch)

      // Draw dark room overlay
      ctx.fillStyle = `rgba(6, 8, 12, ${overlayOpacity.toFixed(3)})`
      ctx.fillRect(0, 0, cw, ch)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const hasMouse = mx !== undefined && my !== undefined

      // Draw Spotlight
      if (hasMouse) {
        ctx.save()
        const spotlightRadius = 240
        const sg = ctx.createRadialGradient(mx, my, 0, mx, my, spotlightRadius)
        sg.addColorStop(0, 'rgba(224, 123, 32, 0.13)')
        sg.addColorStop(0.35, 'rgba(27, 79, 138, 0.08)')
        sg.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = sg
        ctx.beginPath()
        ctx.arc(mx, my, spotlightRadius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Update particles
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > cw) p.vx *= -1
        if (p.y < 0 || p.y > ch) p.vy *= -1

        let isLit = false
        if (hasMouse) {
          const pdx = mx - p.x
          const pdy = my - p.y
          const d = Math.sqrt(pdx * pdx + pdy * pdy)
          if (d < 180) {
            isLit = true
            p.x += (pdx / d) * 0.15
            p.y += (pdy / d) * 0.15
          }
        }
        p.isLit = isLit
      })

      // Connections
      ctx.lineWidth = 0.8
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const pi = particles[i]
          const pj = particles[j]
          const dist = Math.sqrt((pi.x - pj.x) ** 2 + (pi.y - pj.y) ** 2)
          if (dist < 110) {
            const opacity = (1 - dist / 110) * 0.14
            if (pi.isLit && pj.isLit) {
              ctx.strokeStyle = `rgba(224, 123, 32, ${opacity * 2.2})`
            } else {
              ctx.strokeStyle = `rgba(46, 109, 164, ${opacity})`
            }
            ctx.beginPath()
            ctx.moveTo(pi.x, pi.y)
            ctx.lineTo(pj.x, pj.y)
            ctx.stroke()
          }
        }
      }

      // Render dots
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        if (p.isLit) {
          ctx.fillStyle = 'rgba(224, 123, 32, 0.85)'
          ctx.shadowColor = 'rgba(224, 123, 32, 0.7)'
          ctx.shadowBlur = 5
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
          ctx.shadowBlur = 0
        }
        ctx.fill()
      })
      ctx.shadowBlur = 0

      // Render shapes
      shapes.forEach(shape => {
        const cx = shape.baseX * cw + Math.sin(ts * shape.driftSpeed) * shape.driftRange
        const cy = shape.baseY * ch + Math.cos(ts * shape.driftSpeed) * shape.driftRange

        shape.rx += shape.rvx
        shape.ry += shape.rvy
        shape.rz += shape.rvz

        let distToMouse = 9999
        if (hasMouse) {
          distToMouse = Math.sqrt((cx - mx) ** 2 + (cy - my) ** 2)
        }
        const isClose = distToMouse < 200

        const geom = GEOMETRY[shape.type]
        const projected = geom.vertices.map(v => 
          project3D(v[0], v[1], v[2], shape.rx, shape.ry, shape.rz, shape.scale, cx, cy)
        )

        ctx.save()
        if (isClose) {
          ctx.strokeStyle = 'rgba(224, 123, 32, 0.38)'
          ctx.lineWidth = 1.3
          ctx.shadowColor = 'rgba(224, 123, 32, 0.4)'
          ctx.shadowBlur = 6
        } else {
          ctx.strokeStyle = 'rgba(46, 109, 164, 0.12)'
          ctx.lineWidth = 0.95
          ctx.shadowBlur = 0
        }

        geom.edges.forEach(edge => {
          const p1 = projected[edge[0]]
          const p2 = projected[edge[1]]
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        })
        ctx.restore()
      })

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  function validate() {
    const e = {}
    if (!form.name.trim())             e.name     = 'Full name is required'
    if (!form.email.trim())            e.email    = 'Email is required'
    if (form.password.length < 6)      e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) e.confirm  = 'Passwords do not match'
    if (!selectedRole)                 e.role     = 'Please select a role'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setErrors({})
    setApiError('')
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password, role: selectedRole.label }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Registration failed')
      }
      await login(form.email.trim(), form.password)
      navigate(selectedRole.path)
    } catch (err2) {
      setApiError(err2.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes chairFloat {
          0%   { transform: translate(  0px,   0px) rotate(  0deg); }
          18%  { transform: translate(  6px, -8px) rotate(10deg); }
          36%  { transform: translate( -6px, -14px) rotate(-6deg); }
          54%  { transform: translate(  9px,  -4px) rotate(16deg); }
          72%  { transform: translate( -4px,   5px) rotate(-3deg); }
          100% { transform: translate(  0px,   0px) rotate(  0deg); }
        }
        .chair-float { animation: chairFloat 16s ease-in-out infinite; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }

        @keyframes orbFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(45px,-35px) scale(1.06); }
          66%     { transform: translate(-30px,25px) scale(0.94); }
        }
        @keyframes orbFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%     { transform: translate(-55px,30px) scale(1.08); }
          70%     { transform: translate(35px,-20px) scale(0.92); }
        }
        .orb1 { animation: orbFloat1 16s ease-in-out infinite; }
        .orb2 { animation: orbFloat2 20s ease-in-out infinite; }
        .orb3 { animation: orbFloat1 24s ease-in-out 3s infinite reverse; }

        .bento-card::before {
          content:''; position:absolute; inset:-1px; border-radius:inherit;
          background: radial-gradient(circle at var(--glow-x,50%) var(--glow-y,50%),
            rgba(46, 109, 164, 0.28) 0%, transparent 65%);
          opacity:0; transition:opacity 0.3s ease; z-index:0; pointer-events:none;
        }
        .bento-card:hover::before { opacity:1; }

        .noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity:0.028; pointer-events:none;
        }

        .glass-input:focus-within svg {
          color: #E07B20 !important;
          filter: drop-shadow(0 0 4px rgba(224,123,32,0.4));
        }
      `}</style>

      <div
        ref={containerRef}
        className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#06080C] relative overflow-hidden select-none"
        style={{ fontFamily: '"DM Sans", sans-serif' }}
      >
        {/* Dynamic Background Noise */}
        <div className="noise absolute inset-0 z-0" />

        {/* Ambient orbs matching homepage */}
        <div className="orb1 absolute w-[650px] h-[650px] rounded-full pointer-events-none z-0"
          style={{ top:'-15%', left:'-8%', background:'radial-gradient(circle,rgba(27,79,138,0.14) 0%,transparent 70%)', filter:'blur(60px)' }}/>
        <div className="orb2 absolute w-[550px] h-[550px] rounded-full pointer-events-none z-0"
          style={{ bottom:'-10%', right:'-5%', background:'radial-gradient(circle,rgba(46,109,164,0.11) 0%,transparent 70%)', filter:'blur(55px)' }}/>
        <div className="orb3 absolute w-[350px] h-[350px] rounded-full pointer-events-none z-0"
          style={{ top:'22%', right:'10%', background:'radial-gradient(circle,rgba(224,123,32,0.06) 0%,transparent 70%)', filter:'blur(50px)' }}/>

        {/* Background interactive canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-0 pointer-events-auto"
        />

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#06080C]/85 backdrop-blur-md">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-white/5" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#E07B20] spin" />
            </div>
            <p className="text-white/70 text-[12px] font-medium mt-4 tracking-wide uppercase">Creating your account…</p>
          </div>
        )}

        {/* Signup Container (3D Tilt Card) */}
        <div className="relative z-10 w-full max-w-[420px] py-4 pointer-events-auto">
          <TiltCard className="bg-[#0F2340]/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] bento-card relative overflow-hidden">
            <div className="p-7 relative z-10">

              {/* Logo & Platform Label */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center mb-3">
                  <svg viewBox="0 0 80 80" className="w-8 h-8 chair-float" fill="#FFFFFF">
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
                <h1 style={{ fontFamily: '"Sora", sans-serif' }} className="font-bold text-[21px] text-white tracking-tight">
                  Create Account
                </h1>
                <p className="text-[10px] text-white/50 mt-1 tracking-[0.2em] uppercase">Square Interiors</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Full Name */}
                <div>
                  <div className="relative group glass-input">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none transition-colors duration-150" />
                    <input
                      type="text"
                      placeholder="Full name"
                      value={form.name}
                      onChange={e => { set('name', e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                      className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.03] border rounded-xl focus:outline-none focus:border-[#E07B20] text-white placeholder:text-white/35 transition-all duration-150 ${errors.name ? 'border-[#dc2626]' : 'border-white/10'}`}
                    />
                  </div>
                  {errors.name && <p className="text-[11px] text-[#dc2626] mt-1">{errors.name}</p>}
                </div>

                {/* Email Address */}
                <div>
                  <div className="relative group glass-input">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none transition-colors duration-150" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={form.email}
                      onChange={e => { set('email', e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                      className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.03] border rounded-xl focus:outline-none focus:border-[#E07B20] text-white placeholder:text-white/35 transition-all duration-150 ${errors.email ? 'border-[#dc2626]' : 'border-white/10'}`}
                    />
                  </div>
                  {errors.email && <p className="text-[11px] text-[#dc2626] mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <div className="relative group glass-input">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none transition-colors duration-150" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Password (min 6 chars)"
                      value={form.password}
                      onChange={e => { set('password', e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                      className={`w-full pl-10 pr-10 py-2.5 text-sm bg-white/[0.03] border rounded-xl focus:outline-none focus:border-[#E07B20] text-white placeholder:text-white/35 transition-all duration-150 ${errors.password ? 'border-[#dc2626]' : 'border-white/10'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] text-[#dc2626] mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="relative group glass-input">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none transition-colors duration-150" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={form.confirm}
                      onChange={e => { set('confirm', e.target.value); setErrors(p => ({ ...p, confirm: '' })) }}
                      className={`w-full pl-10 pr-10 py-2.5 text-sm bg-white/[0.03] border rounded-xl focus:outline-none focus:border-[#E07B20] text-white placeholder:text-white/35 transition-all duration-150 ${errors.confirm ? 'border-[#dc2626]' : 'border-white/10'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {errors.confirm && <p className="text-[11px] text-[#dc2626] mt-1">{errors.confirm}</p>}
                </div>

                {/* Role Selector Grid */}
                <div>
                  <p className="text-[10px] text-white/50 font-medium tracking-widest uppercase mb-2">Select your role</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((role) => {
                      const { label, icon: Icon, desc } = role
                      const active = selectedRole?.label === label
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => { setRole(role); setErrors(p => ({ ...p, role: '' })) }}
                          className={[
                            'flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl border transition-all duration-150',
                            active
                              ? 'bg-[#1B4F8A]/35 border-[#E07B20]/40 text-[#E07B20] shadow-[0_0_12px_rgba(224,123,32,0.15)]'
                              : 'bg-white/[0.03] border-white/10 text-white/70 hover:border-white/20 hover:bg-white/[0.06] hover:text-white',
                          ].join(' ')}
                        >
                          <Icon size={16} strokeWidth={1.75} className={active ? 'text-[#E07B20]' : 'text-white/40'} />
                          <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-white/80'}`}>{label}</span>
                          <span className={`text-[9px] leading-none ${active ? 'text-[#E07B20]/80' : 'text-white/40'}`}>{desc}</span>
                        </button>
                      )
                    })}
                  </div>
                  {errors.role && <p className="text-[11px] text-[#dc2626] mt-1.5">{errors.role}</p>}
                </div>

                {/* Remember me Checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer group pt-1">
                  <div
                    onClick={() => setRememberMe(v => !v)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 ${rememberMe ? 'bg-[#E07B20] border-[#E07B20]' : 'border-white/20 group-hover:border-white/40 bg-white/5'}`}
                  >
                    {rememberMe && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-[12px] text-white/50 group-hover:text-white/70 transition-colors">
                    Remember me on this device
                  </span>
                </label>

                {apiError && (
                  <div className="px-3.5 py-2.5 bg-red-950/40 border border-red-800/40 rounded-xl text-[12px] text-red-200 fade-in">
                    {apiError}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-1.5 text-sm font-semibold rounded-xl bg-white text-[#06080C] hover:bg-white/95 cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.06)] hover:shadow-[0_6px_28px_rgba(255,255,255,0.18)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={14} strokeWidth={2.2} />
                    </>
                  )}
                </button>

              </form>

              <p className="text-center text-[12px] text-white/50 mt-5">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-white hover:text-[#E07B20] transition-colors">Log in</Link>
              </p>

            </div>
          </TiltCard>
          
          <p className="text-center text-[11px] text-white/20 mt-5">© 2026 Square Interiors. All rights reserved.</p>
        </div>
      </div>
    </>
  )
}
