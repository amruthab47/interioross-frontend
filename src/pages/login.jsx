import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ROLE_PATHS = {
  Admin:      '/dashboard',
  Supervisor: '/supervisor',
  Designer:   '/designer',
  Client:     '/client',
}

/* ── 3-D Tilt login card wrapper ────────────────────────────────────────── */
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
  // Rot X
  let y1 = y * Math.cos(rotX) - z * Math.sin(rotX)
  let z1 = y * Math.sin(rotX) + z * Math.cos(rotX)
  // Rot Y
  let x2 = x * Math.cos(rotY) + z1 * Math.sin(rotY)
  let z2 = -x * Math.sin(rotY) + z1 * Math.cos(rotY)
  // Rot Z
  let x3 = x2 * Math.cos(rotZ) - y1 * Math.sin(rotZ)
  let y3 = x2 * Math.sin(rotZ) + y1 * Math.cos(rotZ)

  return { x: cx + x3 * scale, y: cy + y3 * scale }
}

export default function Login() {
  const navigate    = useNavigate()
  const { login }   = useAuth()
  const containerRef = useRef(null)
  const canvasRef   = useRef(null)
  const rafRef      = useRef(null)

  const [showPwd,     setShowPwd]     = useState(false)
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [forgotMode,  setForgotMode]  = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent,  setForgotSent]  = useState(false)

  // Track cursor position for spotlight and interactive physics
  const mouseRef = useRef({ x: undefined, y: undefined })

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
        baseX: 0.15, // fraction of width
        baseY: 0.32, // fraction of height
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

      // Fade in the blueprint background overlay on entrance
      overlayOpacity = Math.max(0, overlayOpacity - dt * 0.7)

      ctx.clearRect(0, 0, cw, ch)

      // Draw dark room overlay
      ctx.fillStyle = `rgba(6, 8, 12, ${overlayOpacity.toFixed(3)})`
      ctx.fillRect(0, 0, cw, ch)

      // Retrieve mouse details
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const hasMouse = mx !== undefined && my !== undefined

      // ── Draw Spotlight behind everything ──
      if (hasMouse) {
        ctx.save()
        const spotlightRadius = 240
        const sg = ctx.createRadialGradient(mx, my, 0, mx, my, spotlightRadius)
        sg.addColorStop(0, 'rgba(224, 123, 32, 0.13)')    // Accent Orange/Amber inner center
        sg.addColorStop(0.35, 'rgba(27, 79, 138, 0.08)') // Theme blue mid-ring
        sg.addColorStop(1, 'rgba(0, 0, 0, 0)')           // Fades to transparent
        ctx.fillStyle = sg
        ctx.beginPath()
        ctx.arc(mx, my, spotlightRadius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // ── Update and Draw particles (blueprint wireframe grid) ──
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > cw) p.vx *= -1
        if (p.y < 0 || p.y > ch) p.vy *= -1

        // Mouse gravity pull & light calculation
        let isLit = false
        if (hasMouse) {
          const pdx = mx - p.x
          const pdy = my - p.y
          const d = Math.sqrt(pdx * pdx + pdy * pdy)
          if (d < 180) {
            isLit = true
            // Gentle attraction force
            p.x += (pdx / d) * 0.15
            p.y += (pdy / d) * 0.15
          }
        }
        p.isLit = isLit
      })

      // Draw lines between close particles
      ctx.lineWidth = 0.8
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const pi = particles[i]
          const pj = particles[j]
          const dist = Math.sqrt((pi.x - pj.x) ** 2 + (pi.y - pj.y) ** 2)
          if (dist < 110) {
            const opacity = (1 - dist / 110) * 0.14
            // Highlight connections close to spotlight
            if (pi.isLit && pj.isLit) {
              ctx.strokeStyle = `rgba(224, 123, 32, ${opacity * 2.2})` // Accent Amber
            } else {
              ctx.strokeStyle = `rgba(46, 109, 164, ${opacity})` // Mid Blue
            }
            ctx.beginPath()
            ctx.moveTo(pi.x, pi.y)
            ctx.lineTo(pj.x, pj.y)
            ctx.stroke()
          }
        }
      }

      // Draw particle dots
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
      ctx.shadowBlur = 0 // Reset

      // ── Draw 3D Rotating Blueprint Wireframes ──
      shapes.forEach(shape => {
        const cx = shape.baseX * cw + Math.sin(ts * shape.driftSpeed) * shape.driftRange
        const cy = shape.baseY * ch + Math.cos(ts * shape.driftSpeed) * shape.driftRange

        // Update rotation
        shape.rx += shape.rvx
        shape.ry += shape.rvy
        shape.rz += shape.rvz

        // Mouse proximity highlight
        let distToMouse = 9999
        if (hasMouse) {
          distToMouse = Math.sqrt((cx - mx) ** 2 + (cy - my) ** 2)
        }
        const isClose = distToMouse < 200

        const geom = GEOMETRY[shape.type]
        const projected = geom.vertices.map(v => 
          project3D(v[0], v[1], v[2], shape.rx, shape.ry, shape.rz, shape.scale, cx, cy)
        )

        // Draw edges
        ctx.save()
        if (isClose) {
          ctx.strokeStyle = 'rgba(224, 123, 32, 0.38)' // Highlight orange
          ctx.lineWidth = 1.3
          ctx.shadowColor = 'rgba(224, 123, 32, 0.4)'
          ctx.shadowBlur = 6
        } else {
          ctx.strokeStyle = 'rgba(46, 109, 164, 0.12)' // Faint Blueprint Blue
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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const user = await login(email, password)
      navigate(ROLE_PATHS[user.role] || '/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  function handleForgot(e) {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotSent(true)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes chairFloat {
          0%   { transform: translate(  0px,   0px) rotate(  0deg); }
          18%  { transform: translate(  6px, -8px) rotate( 10deg); }
          36%  { transform: translate( -6px, -14px) rotate( -6deg); }
          54%  { transform: translate( 9px,  -4px) rotate( 16deg); }
          72%  { transform: translate( -4px,   5px) rotate( -3deg); }
          100% { transform: translate(  0px,   0px) rotate(  0deg); }
        }
        .chair-float { animation: chairFloat 16s ease-in-out infinite; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }

        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.3s cubic-bezier(0.25, 1, 0.5, 1) both; }

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
        className="min-h-screen flex items-center justify-center px-4 bg-[#06080C] relative overflow-hidden select-none"
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
            <p className="text-white/70 text-[12px] font-medium mt-4 tracking-wide uppercase">Signing you in…</p>
          </div>
        )}

        {/* Login Container (3D Tilt Card) */}
        <div className="relative z-10 w-full max-w-[420px] py-10 pointer-events-auto">
          <TiltCard className="bg-[#0F2340]/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] bento-card relative overflow-hidden">
            <div className="p-8 relative z-10">

              {/* Logo & Platform Label */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-15 h-15 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center mb-3">
                  <svg viewBox="0 0 80 80" className="w-9 h-9 chair-float" fill="#FFFFFF">
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
                <h1 style={{ fontFamily: '"Sora", sans-serif' }} className="font-bold text-[23px] text-white tracking-tight">
                  Interior<span className="text-[#2E6DA4]">OS</span>
                </h1>
                <p className="text-[10px] text-white/50 mt-1 tracking-[0.2em] uppercase">Square Interiors</p>
              </div>

              {/* Forgot password flow */}
              {forgotMode ? (
                <div className="fade-in">
                  {forgotSent ? (
                    <div className="flex flex-col items-center gap-3.5 py-4">
                      <div className="w-11 h-11 rounded-full bg-green-950/30 border border-green-800/40 flex items-center justify-center">
                        <CheckCircle2 size={22} className="text-green-400" />
                      </div>
                      <p style={{ fontFamily: '"Sora", sans-serif' }} className="font-semibold text-[14px] text-white text-center">Check your inbox</p>
                      <p className="text-[12px] text-white/60 text-center leading-relaxed">
                        A password reset link has been sent to <span className="font-semibold text-white">{forgotEmail}</span>.
                      </p>
                      <button
                        onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail('') }}
                        className="mt-3 text-[12px] font-semibold text-[#2E6DA4] hover:text-[#E07B20] transition-colors"
                      >
                        Back to login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgot} className="space-y-4">
                      <div>
                        <p style={{ fontFamily: '"Sora", sans-serif' }} className="font-semibold text-[14px] text-white mb-1">Forgot Password</p>
                        <p className="text-[12px] text-white/60 mb-4 leading-relaxed">Enter your registered email to receive a reset link.</p>
                        
                        <div className="relative group glass-input">
                          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none transition-colors duration-150" />
                          <input
                            type="email"
                            placeholder="Registered email address"
                            required
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-sm bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:border-[#E07B20] text-white placeholder:text-white/35 transition-all duration-150"
                          />
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full py-3 text-sm font-semibold rounded-xl bg-white hover:bg-white/90 text-[#06080C] cursor-pointer shadow-[0_4px_16px_rgba(255,255,255,0.06)] transition-all duration-200"
                      >
                        Send Reset Link
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setForgotMode(false)}
                        className="w-full text-center text-[12px] font-medium text-white/50 hover:text-white transition-colors"
                      >
                        Back to login
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Email Input */}
                  <div className="relative group glass-input">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none transition-colors duration-150" />
                    <input
                      type="email"
                      placeholder="Email address"
                      required
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      className="w-full pl-10 pr-4 py-3 text-sm bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:border-[#E07B20] text-white placeholder:text-white/35 transition-all duration-150"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative group glass-input">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none transition-colors duration-150" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Password"
                      required
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      className="w-full pl-10 pr-10 py-3 text-sm bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:border-[#E07B20] text-white placeholder:text-white/35 transition-all duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors duration-150"
                    >
                      {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="flex items-center gap-2.5 px-3.5 py-3 bg-red-950/40 border border-red-800/40 rounded-xl fade-in">
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                      <p className="text-[12px] text-red-200 leading-normal">{error}</p>
                    </div>
                  )}

                  {/* Forgot Link */}
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-[12px] font-medium text-[#2E6DA4] hover:text-[#E07B20] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!email || !password || loading}
                    className={[
                      'w-full py-3.5 text-sm font-semibold rounded-xl transition-all duration-250 flex items-center justify-center gap-2.5',
                      email && password && !loading
                        ? 'bg-white text-[#06080C] hover:bg-white/95 cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.06)] hover:shadow-[0_6px_28px_rgba(255,255,255,0.18)] hover:-translate-y-0.5'
                        : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5',
                    ].join(' ')}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        Login
                        <ArrowRight size={14} strokeWidth={2.2} />
                      </>
                    )}
                  </button>

                </form>
              )}

              {/* Toggle to Signup */}
              {!forgotMode && (
                <p className="text-center text-[12px] text-white/50 mt-6">
                  Don't have an account?{' '}
                  <Link to="/signup" className="font-semibold text-white hover:text-[#E07B20] transition-colors">Sign up</Link>
                </p>
              )}

            </div>
          </TiltCard>
          
          <p className="text-center text-[11px] text-white/20 mt-6">© 2026 Square Interiors. All rights reserved.</p>
        </div>
      </div>
    </>
  )
}
