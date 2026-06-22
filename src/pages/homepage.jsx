import { Link } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ArrowRight, ChevronDown, FolderKanban, IndianRupee,
  Users, LayoutDashboard, FileText, Zap, Sparkles,
  CheckCircle2, Camera, MessageSquare, CalendarDays,
} from 'lucide-react'

/* ── Feature bento cards ─────────────────────────────────────────────────── */
const BENTO = [
  {
    id: 'dashboard',
    tag: 'Overview',
    title: 'Everything at a glance',
    desc: 'One dashboard. All projects, finances, and team activity — live.',
    img: '/app/dashboard.png',
    icon: LayoutDashboard,
    span: 'col-span-2 row-span-2',
    accent: '#1B4F8A',
  },
  {
    id: 'finance',
    tag: 'Finance',
    title: 'Invoices & budgets in ₹',
    desc: 'Track every rupee across all projects with real-time P&L.',
    img: '/app/finance.png',
    icon: IndianRupee,
    span: 'col-span-1 row-span-1',
    accent: '#E07B20',
  },
  {
    id: 'projects',
    tag: 'Projects',
    title: 'Phase-by-phase tracking',
    desc: 'Log milestones, timelines, and deliverables — all organised.',
    img: '/app/projects.png',
    icon: FolderKanban,
    span: 'col-span-1 row-span-1',
    accent: '#2E6DA4',
  },
  {
    id: 'client',
    tag: 'Client Portal',
    title: 'Clients stay in the loop',
    desc: 'A live window for your clients — no more phone-tag.',
    img: '/app/client.png',
    icon: Users,
    span: 'col-span-2 row-span-1',
    accent: '#1B4F8A',
  },
  {
    id: 'ai',
    tag: 'AI Assistant',
    title: 'AI built into every workflow',
    desc: 'Snag detection, finance insights, and smart suggestions — powered by LLaMA.',
    img: '/app/ai.png',
    icon: Sparkles,
    span: 'col-span-1 row-span-1',
    accent: '#E07B20',
  },
  {
    id: 'tasks',
    tag: 'Tasks',
    title: 'Assign & track every task',
    desc: 'Supervisors, designers, workers — all on the same task board.',
    img: '/app/tasks.png',
    icon: FileText,
    span: 'col-span-1 row-span-1',
    accent: '#2E6DA4',
  },
]

const HOW = [
  { n: '01', title: 'Set up your firm', desc: 'Add your team, assign roles — admin, supervisor, designer, client — and invite everyone in minutes.' },
  { n: '02', title: 'Create projects', desc: 'Log every project with client details, budget, timeline, and phases. Everything in one place from day one.' },
  { n: '03', title: 'Collaborate & track', desc: 'Assign tasks, update progress, share renders, and keep clients informed without switching tools.' },
  { n: '04', title: 'Invoice & close', desc: 'Generate invoices, track payments, and close projects cleanly with a full financial summary.' },
]

/* ── Scroll-reveal hook ──────────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target) } }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ── 3-D tilt card ───────────────────────────────────────────────────────── */
function TiltCard({ children, className = '', style = {} }) {
  const ref = useRef(null)
  const onMove = useCallback((e) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width  - 0.5
    const y = (e.clientY - r.top)  / r.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) translateZ(6px)`
    el.style.setProperty('--glow-x', `${(x + 0.5) * 100}%`)
    el.style.setProperty('--glow-y', `${(y + 0.5) * 100}%`)
  }, [])
  const onLeave = useCallback(() => {
    const el = ref.current; if (!el) return
    el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0px)'
  }, [])
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      className={className} style={{ ...style, transition: 'transform 0.18s ease', willChange: 'transform' }}>
      {children}
    </div>
  )
}

/* ── Magnetic button ─────────────────────────────────────────────────────── */
function MagBtn({ children, to, href, className = '' }) {
  const ref = useRef(null)
  const onMove = useCallback((e) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width  / 2)) * 0.28
    const y = (e.clientY - (r.top  + r.height / 2)) * 0.28
    el.style.transform = `translate(${x}px, ${y}px)`
  }, [])
  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'translate(0,0)'
  }, [])
  const Tag = to ? Link : href ? 'a' : 'button'
  const extra = to ? { to } : href ? { href } : {}
  return (
    <Tag ref={ref} {...extra} onMouseMove={onMove} onMouseLeave={onLeave}
      className={className} style={{ transition: 'transform 0.22s cubic-bezier(0.23,1,0.32,1)', display: 'inline-flex', alignItems: 'center' }}>
      {children}
    </Tag>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const heroRef   = useRef(null)
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const [navScrolled, setNavScrolled] = useState(false)

  // Per-element reveal state, triggered by the lamp scan
  const [lit, setLit] = useState({
    badge: false, w0: false, w1: false, w2: false, sub: false, btns: false,
  })
  const litRef = useRef({ badge: false, w0: false, w1: false, w2: false, sub: false, btns: false })
  // Drag hint shows only after the lamp has fully settled (phase 2)
  const [lampSettled, setLampSettled] = useState(false)

  function triggerLit(key) {
    if (litRef.current[key]) return
    litRef.current[key] = true
    setLit(p => ({ ...p, [key]: true }))
  }

  useReveal()

  /* ── Lamp canvas ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    const hero   = heroRef.current
    if (!canvas || !hero) return
    const ctx = canvas.getContext('2d')

    const resize = () => { canvas.width = hero.offsetWidth; canvas.height = hero.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    // ─────────────────────────────────────────────────────────────────────
    // CONCEPT
    //   The hook is fixed at the TOP-LEFT corner.
    //   A long pendulum cord hangs from the hook.
    //   The lamp starts at max-angle extension (cord nearly horizontal →
    //   lamp near bottom-right corner, light pointing diagonally across).
    //   The pendulum swings from that bottom corner toward the top corner
    //   (back toward the hook), sweeping its beam upward across the hero.
    //   Text elements are revealed bottom→top as the beam passes over them.
    //   After the sweep the lamp settles into a natural hang from the hook.
    //   User can grab the lamp body and drag to reposition.
    // ─────────────────────────────────────────────────────────────────────

    // Hook position — left side, moved right so lamp is fully visible on screen
    const HX = 72, HY = 22

    // Shade geometry
    const SH = 105  // shade height  (from neck top to opening rim)
    const SW = 148  // shade opening width
    const ST = 30   // shade neck width

    // Cord length: long enough so lamp is clearly visible.
    function cordLen(cw, ch) { return Math.min(ch * 0.50, 460) }

    // Angle state (radians from vertical; positive = right of vertical)
    //   Start    ≈ +82°  (cord nearly horizontal)
    //   SwingEnd ≈  −7°  (Phase 0 eases here: passes vertical, overshoot left)
    //   Settle   =   0°  (Phase 1 physics bounces back and settles here)
    const A_START     =  82 * Math.PI / 180
    const A_SWING_END =  -7 * Math.PI / 180
    const A_SETTLE    =  0

    // Mutable animation state — single object avoids stale-closure issues
    const L = {
      angle:    A_START,   // current cord angle from vertical
      angleVel: 0,         // angular velocity for pendulum physics
      phase:    0,         // 0=sweep  1=settle(damped)  2=idle  3=drag
      sweepT:   0,         // 0→1 progress of the sweep animation
      // Overlay fades from 0.88 (dark room effect) to 0 (fully lit) after settle
      overlayOpacity: 0.88,
      dragging: false,
      dragStartAngle: 0,
      dragStartMX:    0,
    }

    // Derive lamp tip position from current angle + cord length
    function lampPos(cw, ch) {
      const cl = cordLen(cw, ch)
      return {
        lx: HX + Math.sin(L.angle) * cl,
        ly: HY + Math.cos(L.angle) * cl,
        cl,
      }
    }

    // ── Reveal thresholds (sweep progress 0→1, bottom-first order) ────────
    // Lower progress = revealed first = lower in the text block (buttons…)
    // Higher progress = revealed last  = higher in the text block (badge…)
    const RT = { btns: 0.14, sub: 0.24, w2: 0.36, w1: 0.48, w0: 0.60, badge: 0.72 }

    // ── Hit-test: is the mouse near the lamp body? ─────────────────────────
    function hitLamp(mx, my, cw, ch) {
      const { lx, ly } = lampPos(cw, ch)
      const cx = lx, cy = ly - SH / 2
      return Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) < 72
    }

    // ── Mouse interaction (available after sweep finishes) ─────────────────
    const onMouseMove = (e) => {
      if (L.phase < 2) return
      const r  = hero.getBoundingClientRect()
      const mx = e.clientX - r.left
      const my = e.clientY - r.top
      const cw = canvas.width, ch = canvas.height

      if (L.dragging) {
        // Rotate angle based on horizontal drag distance
        const dx = mx - L.dragStartMX
        L.angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2,
          L.dragStartAngle + dx / (cordLen(cw, ch) * 0.7)
        ))
        L.angleVel = 0
      }
      canvas.style.cursor = hitLamp(mx, my, cw, ch)
        ? (L.dragging ? 'grabbing' : 'grab') : 'default'
    }

    const onMouseDown = (e) => {
      if (L.phase < 2) return
      const r  = hero.getBoundingClientRect()
      const mx = e.clientX - r.left, my = e.clientY - r.top
      if (hitLamp(mx, my, canvas.width, canvas.height)) {
        L.dragging       = true
        L.dragStartAngle = L.angle
        L.dragStartMX    = mx
        L.phase          = 3
        canvas.style.cursor = 'grabbing'
        canvas.style.pointerEvents = 'auto'
      }
    }

    const onMouseUp = () => {
      if (L.dragging) {
        L.dragging = false
        L.phase    = 1 // Go back to settle phase so it swings physically!
        canvas.style.cursor = 'grab'
      }
    }

    hero.addEventListener('mousemove', onMouseMove)
    hero.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup',  onMouseUp)

    // ══════════════════════════════════════════════════════════════════════
    // DRAW HELPERS
    // ══════════════════════════════════════════════════════════════════════

    // The cord direction vector (unit): hook → lamp
    function cordDir(cw, ch) {
      const { lx, ly } = lampPos(cw, ch)
      const dx = lx - HX, dy = ly - HY
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      return { dx: dx / len, dy: dy / len }
    }

    // ── 1. Dark overlay + angled light cone ───────────────────────────────
    function drawLightCone(cw, ch) {
      const { lx, ly } = lampPos(cw, ch)
      const { dx, dy }  = cordDir(cw, ch)

      // The opening of the shade faces in the cord direction (hook→lamp)
      // so the light cone radiates FROM the lamp tip along that direction.
      const coneHalfAngle = (64 * Math.PI) / 180
      const coneLen       = Math.sqrt(cw * cw + ch * ch) * 1.6

      // Left / right cone-edge angles (in screen coords)
      const baseAngle = Math.atan2(dy, dx)
      const leftAngle = baseAngle - coneHalfAngle
      const rightAngle = baseAngle + coneHalfAngle

      // Cone edge endpoints
      const cLx = lx + Math.cos(leftAngle)  * coneLen
      const cLy = ly + Math.sin(leftAngle)  * coneLen
      const cRx = lx + Math.cos(rightAngle) * coneLen
      const cRy = ly + Math.sin(rightAngle) * coneLen

      // ── Dark overlay (opacity fades after lamp settles) ──────────────────
      ctx.fillStyle = `rgba(6,8,12,${L.overlayOpacity.toFixed(3)})`
      ctx.fillRect(0, 0, cw, ch)

      // ── Cut out the cone (erase overlay inside it) ───────────────────────
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.moveTo(lx, ly)
      ctx.lineTo(cLx, cLy)
      ctx.lineTo(cRx, cRy)
      ctx.closePath()
      ctx.clip()

      // Radial gradient: bright near lamp, fading outward
      const fadeCenter = lx + dx * coneLen * 0.28, fadeCY = ly + dy * coneLen * 0.28
      const cg = ctx.createRadialGradient(lx, ly, 8, fadeCenter, fadeCY, coneLen * 0.82)
      cg.addColorStop(0,    'rgba(0,0,0,1.00)')
      cg.addColorStop(0.12, 'rgba(0,0,0,0.98)')
      cg.addColorStop(0.40, 'rgba(0,0,0,0.85)')
      cg.addColorStop(0.68, 'rgba(0,0,0,0.50)')
      cg.addColorStop(0.88, 'rgba(0,0,0,0.15)')
      cg.addColorStop(1,    'rgba(0,0,0,0.00)')
      ctx.fillStyle = cg
      ctx.fillRect(-10, -10, cw + 20, ch + 20)
      ctx.restore()

      // ── Warm amber tint inside cone ──────────────────────────────────────
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.beginPath()
      ctx.moveTo(lx, ly)
      ctx.lineTo(cLx, cLy)
      ctx.lineTo(cRx, cRy)
      ctx.closePath()
      ctx.clip()
      const wg = ctx.createRadialGradient(lx, ly, 0, fadeCenter, fadeCY, coneLen * 0.65)
      wg.addColorStop(0,   'rgba(255,220,130,0.16)')
      wg.addColorStop(0.35,'rgba(255,200,100,0.09)')
      wg.addColorStop(1,   'rgba(255,180,60,0)')
      ctx.fillStyle = wg
      ctx.fillRect(-10, -10, cw + 20, ch + 20)
      ctx.restore()

      // ── Light pool / termination glow ────────────────────────────────────
      const poolX = lx + dx * coneLen * 0.5, poolY = ly + dy * coneLen * 0.5
      ctx.save()
      const pg = ctx.createRadialGradient(poolX, poolY, 0, poolX, poolY, coneLen * Math.tan(coneHalfAngle) * 0.55)
      pg.addColorStop(0,   'rgba(255,215,110,0.08)')
      pg.addColorStop(0.6, 'rgba(255,195,80,0.03)')
      pg.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = pg
      ctx.fillRect(-10, -10, cw + 20, ch + 20)
      ctx.restore()
    }

    // ── 2. Cord ────────────────────────────────────────────────────────────
    function drawCord(cw, ch) {
      const { lx, ly } = lampPos(cw, ch)
      // Shade neck top (above the shade body)
      const neckX = lx - Math.sin(L.angle) * SH
      const neckY = ly - Math.cos(L.angle) * SH

      ctx.save()
      ctx.strokeStyle = 'rgba(185,170,140,0.50)'
      ctx.lineWidth   = 1.8
      ctx.shadowColor = 'rgba(0,0,0,0.6)'
      ctx.shadowBlur  = 5
      ctx.beginPath()
      ctx.moveTo(HX, HY)
      // Slight natural catenary droop
      const cpx = (HX + neckX) / 2 + (neckY - HY) * 0.04
      const cpy = (HY + neckY) / 2 + Math.abs(neckX - HX) * 0.06
      ctx.quadraticCurveTo(cpx, cpy, neckX, neckY)
      ctx.stroke()
      ctx.restore()

      // Corner hook
      ctx.save()
      ctx.fillStyle = 'rgba(160,140,100,0.60)'
      ctx.strokeStyle = 'rgba(100,80,50,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(HX, HY, 6, 0, Math.PI * 2)
      ctx.fill(); ctx.stroke()
      ctx.restore()
    }

    // ── 3. Shade (bell-shaped, rotated to face cord direction) ────────────
    function drawShade(cw, ch) {
      const { lx, ly } = lampPos(cw, ch)

      ctx.save()
      // rotate(-angle) so local -y points toward the hook (neck) and
      // local +y points away (opening), keeping the cord endpoint at the neck.
      ctx.translate(lx, ly)
      ctx.rotate(-L.angle)

      // The shade is drawn with its opening facing downward in local space (y+)
      const half  = SW / 2
      const halfT = ST / 2
      const bulge = 20

      // ── Shade body ────────────────────────────────────────────────────────
      ctx.beginPath()
      ctx.moveTo(-halfT, -SH)
      ctx.bezierCurveTo(-halfT - bulge, -SH * 0.55, -half - bulge * 0.5, -SH * 0.22, -half, 0)
      ctx.lineTo( half, 0)
      ctx.bezierCurveTo( half + bulge * 0.5, -SH * 0.22,  halfT + bulge, -SH * 0.55,  halfT, -SH)
      ctx.closePath()

      // Metallic gradient along local X
      const eg = ctx.createLinearGradient(-half - 12, 0, half + 12, 0)
      eg.addColorStop(0,    '#05111C')
      eg.addColorStop(0.10, '#0C1A28')
      eg.addColorStop(0.28, '#172A3C')
      eg.addColorStop(0.48, '#1F3244')
      eg.addColorStop(0.56, '#182C3C')
      eg.addColorStop(0.75, '#0D1E2C')
      eg.addColorStop(0.90, '#091520')
      eg.addColorStop(1,    '#040C14')
      ctx.fillStyle = eg
      ctx.fill()

      // Rim outline
      ctx.strokeStyle = 'rgba(70,110,150,0.20)'
      ctx.lineWidth = 1; ctx.stroke()

      // ── Interior warm glow through the opening ──────────────────────────
      ctx.save()
      ctx.beginPath()
      ctx.ellipse(0, 0, half + 4, 13, 0, 0, Math.PI * 2)
      ctx.clip()
      const ig = ctx.createRadialGradient(0, -3, 0, 0, -3, half + 4)
      ig.addColorStop(0,   'rgba(255,242,165,0.95)')
      ig.addColorStop(0.3, 'rgba(255,215,110,0.75)')
      ig.addColorStop(0.7, 'rgba(255,185,60,0.38)')
      ig.addColorStop(1,   'rgba(255,160,30,0)')
      ctx.fillStyle = ig
      ctx.fillRect(-half - 8, -16, SW + 16, 26)
      ctx.restore()

      // ── Rim ring (bright edge facing the light direction) ─────────────────
      ctx.beginPath()
      ctx.ellipse(0, 0, half, 8, 0, Math.PI, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,218,105,0.60)'
      ctx.lineWidth = 2.5; ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(0, 0, half, 8, 0, 0, Math.PI)
      ctx.strokeStyle = 'rgba(110,72,16,0.32)'
      ctx.lineWidth = 2; ctx.stroke()

      // ── Neck / cap ────────────────────────────────────────────────────────
      ctx.beginPath()
      ctx.roundRect(-halfT - 1, -SH - 18, ST + 2, 22, 3)
      const nc = ctx.createLinearGradient(-halfT - 1, 0, halfT + 1, 0)
      nc.addColorStop(0, '#04101A'); nc.addColorStop(0.4, '#152232')
      nc.addColorStop(0.6, '#112030'); nc.addColorStop(1, '#040C16')
      ctx.fillStyle = nc; ctx.fill()
      ctx.strokeStyle = 'rgba(50,90,130,0.28)'; ctx.lineWidth = 1; ctx.stroke()

      // ── Metallic highlight on shade edge ──────────────────────────────────
      ctx.beginPath()
      ctx.moveTo(-halfT - bulge * 0.2, -SH * 0.9)
      ctx.bezierCurveTo(-halfT - bulge * 0.8, -SH * 0.55, -half - bulge * 0.35, -SH * 0.28, -half + 5, -2)
      ctx.strokeStyle = 'rgba(110,155,200,0.16)'; ctx.lineWidth = 2; ctx.stroke()

      ctx.restore()

      // ── Ambient halo around shade ─────────────────────────────────────────
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      const centerY = ly - Math.cos(L.angle) * SH / 2
      const centerX = lx - Math.sin(L.angle) * SH / 2
      const hg = ctx.createRadialGradient(centerX, centerY, 8, centerX, centerY, SW * 0.85)
      hg.addColorStop(0,   'rgba(200,178,95,0.13)')
      hg.addColorStop(0.5, 'rgba(160,125,55,0.05)')
      hg.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = hg
      ctx.beginPath(); ctx.arc(centerX, centerY, SW * 0.85, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }

    // (sofa is now an SVG DOM element — see JSX below)
    function drawSofa_UNUSED(cw, ch) {
      // World dimensions (pixels)
      const W   = Math.min(255, cw * 0.185)  // sofa width (front face)
      const D   = 58                           // depth front → back
      const LH  = 18                           // leg height
      const SH  = 44                           // seat top from floor (legs + cushion base)
      const BH  = 68                           // back cushion height above seat
      const AW  = 26                           // armrest width
      const TH  = SH + BH + 12                // total height (armrest top)
      const iW  = W - AW * 2                  // inner seat width
      const t3  = iW / 3                       // third of inner width

      // Oblique cabinet projection: depth goes upper-left
      // P(x, y, z) → screen — y is "up" in world, down in screen
      const kx = -0.42, ky = -0.26
      const ox = cw - W - 52
      const oy = ch - 44
      const P  = (x, y, z) => [ox + x + z * kx, oy - y + z * ky]

      // Draw a quad face and fill it
      const Q = (pts, style) => {
        ctx.beginPath()
        pts.forEach((p, i) => { const [sx, sy] = P(...p); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy) })
        ctx.closePath()
        ctx.fillStyle = style; ctx.fill()
      }
      // Gradient helper: linear gradient between two 3D points
      const G = (x1,y1,z1, x2,y2,z2) => ctx.createLinearGradient(...P(x1,y1,z1), ...P(x2,y2,z2))

      ctx.save()

      // ── PASS 1: back/side faces (painter's order, drawn first) ──────────

      // Left side face of left armrest — shows the sofa's depth
      {
        const g = G(0,0,D, 0,0,0)
        g.addColorStop(0, 'rgba(7,13,22,0.92)'); g.addColorStop(1, 'rgba(18,30,48,0.92)')
        Q([[0,0,D],[0,TH,D],[0,TH,0],[0,0,0]], g)
      }

      // Left side face of seat body (between left arm and left cushion edge)
      {
        Q([[AW,0,D],[AW,SH,D],[AW,SH,0],[AW,0,0]], 'rgba(6,11,20,0.82)')
      }

      // Top of back cushions — thin parallelogram strip, most prominent "top" visible
      {
        const bkD = D * 0.28  // backrest doesn't go full depth
        const g = G(AW, TH, bkD, AW, TH, 0)
        g.addColorStop(0,'rgba(16,28,44,0.88)'); g.addColorStop(1,'rgba(28,46,68,0.88)')
        Q([[AW,TH,bkD],[W-AW,TH,bkD],[W-AW,TH,0],[AW,TH,0]], g)
      }

      // Top of left armrest — full depth, clearly angled
      {
        const g = G(0, TH, D, 0, TH, 0)
        g.addColorStop(0,'rgba(12,22,36,0.88)'); g.addColorStop(1,'rgba(26,44,64,0.90)')
        Q([[0,TH,D],[AW,TH,D],[AW,TH,0],[0,TH,0]], g)
        // Warm lamp highlight on left arm top
        const [x1,y1] = P(0,TH,0), [x2,y2] = P(AW,TH,0)
        const hg = ctx.createLinearGradient(x1,y1,x2,y2)
        hg.addColorStop(0,'rgba(210,160,65,0.28)'); hg.addColorStop(1,'rgba(210,160,65,0)')
        ctx.strokeStyle = hg; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke()
      }

      // Seat top — visible horizontal surface between armrests (key "sofa seat" cue)
      {
        const g = G(AW, SH, D, AW, SH, 0)
        g.addColorStop(0,'rgba(16,28,46,0.88)'); g.addColorStop(1,'rgba(34,56,82,0.92)')
        Q([[AW,SH,D],[W-AW,SH,D],[W-AW,SH,0],[AW,SH,0]], g)
        // Seat cushion dividers on top face
        for (let i = 1; i < 3; i++) {
          const sx = AW + t3 * i
          const [x1,y1] = P(sx,SH,0), [x2,y2] = P(sx,SH,D)
          ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke()
        }
      }

      // Right armrest top (narrow depth — further from viewer)
      {
        const rdD = D * 0.38
        const g = G(W-AW, TH, rdD, W-AW, TH, 0)
        g.addColorStop(0,'rgba(10,18,30,0.82)'); g.addColorStop(1,'rgba(20,34,52,0.85)')
        Q([[W-AW,TH,rdD],[W,TH,rdD],[W,TH,0],[W-AW,TH,0]], g)
        const [x1,y1] = P(W-AW,TH,0), [x2,y2] = P(W,TH,0)
        ctx.strokeStyle = 'rgba(200,150,55,0.14)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke()
      }

      // ── PASS 2: front face (z = 0) — axis-aligned in screen space ───────
      // All z=0 → P(x,y,0) = (ox+x, oy-y), so these are plain 2D rects/shapes.

      // Floor platform / leg area
      {
        const [x0,y0] = P(0,0,0), [x1,y1] = P(W,LH,0)
        const g = ctx.createLinearGradient(x0,y0, x0,y1)
        g.addColorStop(0,'rgba(7,13,22,0.92)'); g.addColorStop(1,'rgba(14,24,38,0.92)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.roundRect(x0, y1, x1-x0, y0-y1, [0,0,3,3]); ctx.fill()
        // Two legs visible
        ;[AW+10, W-AW-18].forEach(lx => {
          const [lsx,lsy] = P(lx,0,0)
          ctx.fillStyle = 'rgba(5,9,16,0.95)'
          ctx.beginPath(); ctx.roundRect(lsx, lsy-LH+2, 8, LH-2, [0,0,2,2]); ctx.fill()
        })
      }

      // Seat cushion base (full width between arms, above legs)
      {
        const [x0,y0] = P(AW, LH, 0), [x1,y1] = P(W-AW, SH, 0)
        const g = ctx.createLinearGradient(x0,y1, x0,y0)
        g.addColorStop(0,'rgba(20,34,54,0.92)'); g.addColorStop(1,'rgba(28,46,70,0.92)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.roundRect(x0, y1, x1-x0, y0-y1, [3,3,0,0]); ctx.fill()
      }

      // 3 seat cushions (front face, clearly rounded for "cushion" feel)
      for (let i = 0; i < 3; i++) {
        const [x0,y0] = P(AW + t3*i + 2, LH+2, 0)
        const [x1,y1] = P(AW + t3*(i+1) - 2, SH - 1, 0)
        const g = ctx.createLinearGradient(x0,y0, x0,y1)
        g.addColorStop(0,'rgba(22,38,60,0.92)'); g.addColorStop(0.5,'rgba(32,52,78,0.92)'); g.addColorStop(1,'rgba(24,40,62,0.88)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.roundRect(x0, y1, x1-x0, y0-y1, 4); ctx.fill()
        // Seam between seat cushions
        if (i < 2) {
          const [sx,sy0] = P(AW + t3*(i+1), LH+5, 0), [,sy1] = P(0,SH-5,0)
          ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1
          ctx.beginPath(); ctx.moveTo(sx,sy0); ctx.lineTo(sx,sy1); ctx.stroke()
        }
      }

      // 3 back cushions (tallest, most prominent feature)
      for (let i = 0; i < 3; i++) {
        const [x0,y0] = P(AW + t3*i + 2, SH+2, 0)
        const [x1,y1] = P(AW + t3*(i+1) - 2, TH - 2, 0)
        const g = ctx.createLinearGradient(x0,y1, x0,y0)
        g.addColorStop(0,'rgba(18,30,50,0.92)'); g.addColorStop(0.45,'rgba(28,46,70,0.92)'); g.addColorStop(1,'rgba(22,38,58,0.90)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.roundRect(x0, y1, x1-x0, y0-y1, 5); ctx.fill()
        ctx.strokeStyle='rgba(255,255,255,0.035)'; ctx.lineWidth=1; ctx.stroke()
        // Quilted horizontal stitch + button
        const midY = (y0+y1)/2
        ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1
        ctx.beginPath(); ctx.moveTo(x0+5,midY); ctx.lineTo(x1-5,midY); ctx.stroke()
        ctx.fillStyle='rgba(10,18,32,0.55)'
        ctx.beginPath(); ctx.arc((x0+x1)/2, midY, 2.5, 0, Math.PI*2); ctx.fill()
        // Seam between back cushions
        if (i < 2) {
          const [sx,sy0] = P(AW+t3*(i+1), SH+5, 0), [,sy1] = P(0,TH-5,0)
          ctx.strokeStyle='rgba(0,0,0,0.28)'; ctx.lineWidth=1
          ctx.beginPath(); ctx.moveTo(sx,sy0); ctx.lineTo(sx,sy1); ctx.stroke()
        }
      }

      // Left armrest (tall, full height — most 3D face on left)
      {
        const [x0,y0] = P(0, 0, 0), [x1,y1] = P(AW, TH, 0)
        const g = ctx.createLinearGradient(x0, y0, x1, y0)
        g.addColorStop(0,'rgba(22,38,58,0.95)'); g.addColorStop(1,'rgba(18,30,48,0.95)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.roundRect(x0, y1, x1-x0, y0-y1, [6,0,0,6]); ctx.fill()
        ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1; ctx.stroke()
      }

      // Right armrest
      {
        const [x0,y0] = P(W-AW, 0, 0), [x1,y1] = P(W, TH, 0)
        const g = ctx.createLinearGradient(x0, y0, x1, y0)
        g.addColorStop(0,'rgba(15,26,42,0.95)'); g.addColorStop(1,'rgba(11,20,32,0.95)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.roundRect(x0, y1, x1-x0, y0-y1, [0,6,6,0]); ctx.fill()
        ctx.strokeStyle='rgba(255,255,255,0.03)'; ctx.lineWidth=1; ctx.stroke()
      }

      // ── Warm amber glow — lamp light grazing the sofa top ────────────────
      const [bx0,by0] = P(AW, TH, 0), [bx1] = P(W-AW, TH, 0)
      const tg = ctx.createLinearGradient(bx0,by0, bx1,by0)
      tg.addColorStop(0,'rgba(215,162,72,0)'); tg.addColorStop(0.22,'rgba(215,162,72,0.32)')
      tg.addColorStop(0.75,'rgba(215,162,72,0.14)'); tg.addColorStop(1,'rgba(215,162,72,0)')
      ctx.strokeStyle=tg; ctx.lineWidth=1.5
      ctx.beginPath(); ctx.moveTo(bx0,by0); ctx.lineTo(bx1,by0); ctx.stroke()

      ctx.restore()
    }

    // ══════════════════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ══════════════════════════════════════════════════════════════════════
    let lastTs = 0

    const frame = (ts) => {
      const dt = Math.min((ts - lastTs) / 1000, 0.05)
      lastTs = ts
      const cw = canvas.width, ch = canvas.height

      // ── Phase 0: SWEEP ─ cord swings from horizontal (82°) → vertical (0°) ─
      if (L.phase === 0) {
        L.sweepT += dt * 0.70   // Faster sweep

        // Sine easing for a smoother, natural pendulum swing
        const t = Math.min(L.sweepT, 1)
        const eased = -(Math.cos(Math.PI * t) - 1) / 2

        L.angle = A_START + (A_SWING_END - A_START) * eased

        // Text reveals: keyed to sweep progress (bottom-first order)
        if (t > RT.btns)  triggerLit('btns')
        if (t > RT.sub)   triggerLit('sub')
        if (t > RT.w2)    triggerLit('w2')
        if (t > RT.w1)    triggerLit('w1')
        if (t > RT.w0)    triggerLit('w0')
        if (t > RT.badge) triggerLit('badge')

        if (L.sweepT >= 1) {
          ;['btns','sub','w2','w1','w0','badge'].forEach(triggerLit)
          L.angle    = A_SWING_END
          L.angleVel = 0       // no kick — physics takes over from the overshoot position
          L.phase    = 1
          canvas.style.pointerEvents = 'auto'
        }
      }

      // ── Phase 1: DAMPED SETTLE + bounce + overlay begins fading ─────────
      else if (L.phase === 1) {
        // Physics restores from −7° to 0°, small natural oscillation, then settles
        const gravity = 0.008, damping = 0.95
        L.angleVel += -gravity * Math.sin(L.angle - A_SETTLE)
        L.angleVel *= damping
        L.angle    += L.angleVel
        // Brighten the room quickly
        L.overlayOpacity = Math.max(0.0, L.overlayOpacity - dt * 1.10)

        if (Math.abs(L.angleVel) < 0.00008 && Math.abs(L.angle - A_SETTLE) < 0.0015) {
          L.angle    = A_SETTLE
          L.angleVel = 0
          L.phase    = 2
          setLampSettled(true)
        }
      }

      // ── Phase 2 & 3: IDLE / DRAG — room fully lit, gentle micro-sway ─────
      else if (L.phase >= 2) {
        // Continue fading overlay to 0 (fully lit screen)
        L.overlayOpacity = Math.max(0, L.overlayOpacity - dt * 0.08)

        if (L.phase === 2) {
          // Damp any residual velocity from the bounce to a full stop
          L.angleVel *= 0.96
          L.angle += L.angleVel
          if (Math.abs(L.angleVel) < 0.000005) L.angleVel = 0
        }
      }

      // ── Phase 3: DRAG ─ handled by mouse events ───────────────────────────
      // (L.angle updated directly in onMouseMove)

      // ── DRAW ────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, cw, ch)
      drawLightCone(cw, ch)
      drawCord(cw, ch)
      drawShade(cw, ch)

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mouseup', onMouseUp)
      hero.removeEventListener('mousemove', onMouseMove)
      hero.removeEventListener('mousedown', onMouseDown)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Nav scroll ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        /* ── Scroll reveal ── */
        [data-reveal] {
          opacity: 0; transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
        }
        [data-reveal].revealed { opacity: 1; transform: none; }
        [data-reveal][data-delay="1"] { transition-delay: 0.1s; }
        [data-reveal][data-delay="2"] { transition-delay: 0.2s; }
        [data-reveal][data-delay="3"] { transition-delay: 0.3s; }
        [data-reveal][data-delay="4"] { transition-delay: 0.4s; }
        [data-reveal][data-delay="5"] { transition-delay: 0.5s; }
        [data-reveal][data-delay="6"] { transition-delay: 0.6s; }

        /* ── Hero lamp-reveal animations ── */
        @keyframes lampReveal {
          0%   { opacity:0; transform: translateY(22px) scale(0.94); filter: blur(6px) brightness(1.6); }
          40%  { filter: blur(0px) brightness(1.15); }
          100% { opacity:1; transform: translateY(0)   scale(1);    filter: blur(0px) brightness(1); }
        }
        @keyframes wordFloat {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-5px); }
        }
        @keyframes badgePop {
          0%   { opacity:0; transform: scale(0.8) translateY(10px); }
          60%  { transform: scale(1.04) translateY(-2px); }
          100% { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes subReveal {
          0%   { opacity:0; transform: translateY(16px); filter: blur(4px); }
          100% { opacity:1; transform: translateY(0);    filter: blur(0); }
        }

        .lamp-badge.lit { animation: badgePop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .lamp-word      { opacity:0; display:inline-block; }
        .lamp-word.lit  { animation: lampReveal 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .lamp-word.lit.float { animation: lampReveal 0.5s cubic-bezier(0.22,1,0.36,1) forwards,
                                           wordFloat 4s ease-in-out 0.8s infinite; }
        .lamp-sub.lit   { animation: subReveal 0.5s cubic-bezier(0.22,1,0.36,1) 0.05s forwards; }
        .lamp-btns      { opacity:0; }
        .lamp-btns.lit  { animation: subReveal 0.5s cubic-bezier(0.22,1,0.36,1) 0.08s forwards; }

        /* ── Orbs ── */
        @keyframes orbFloat1 {
          0%,100% { transform:translate(0,0) scale(1); }
          33%     { transform:translate(40px,-30px) scale(1.06); }
          66%     { transform:translate(-25px,20px) scale(0.95); }
        }
        @keyframes orbFloat2 {
          0%,100% { transform:translate(0,0) scale(1); }
          40%     { transform:translate(-50px,35px) scale(1.08); }
          70%     { transform:translate(30px,-25px) scale(0.93); }
        }
        .orb1 { animation: orbFloat1 14s ease-in-out infinite; }
        .orb2 { animation: orbFloat2 18s ease-in-out infinite; }
        .orb3 { animation: orbFloat1 22s ease-in-out 4s infinite reverse; }

        /* ── Bento card glow ── */
        .bento-card::before {
          content:''; position:absolute; inset:-1px; border-radius:inherit;
          background: radial-gradient(circle at var(--glow-x,50%) var(--glow-y,50%),
            rgba(46,109,164,0.35) 0%, transparent 65%);
          opacity:0; transition:opacity 0.3s; z-index:0;
        }
        .bento-card:hover::before { opacity:1; }

        /* ── Screenshot frame ── */
        .ss-frame { transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease; }
        .ss-frame:hover { transform: translateY(-4px) scale(1.012); box-shadow: 0 24px 60px rgba(0,0,0,0.55); }

        /* ── Step pulse ── */
        @keyframes stepPulse {
          0%,100% { box-shadow:0 0 0 0 rgba(27,79,138,0.3); }
          50%     { box-shadow:0 0 0 8px rgba(27,79,138,0); }
        }
        .step-num { animation: stepPulse 3s ease-in-out infinite; }

        /* ── CTA ── */
        @keyframes ctaShift {
          0%  { background-position:0% 50%; }
          50% { background-position:100% 50%; }
          100%{ background-position:0% 50%; }
        }
        .cta-bg {
          background: linear-gradient(135deg,#0F2340,#1B4F8A,#2E6DA4,#0F2340,#1B3860);
          background-size:400% 400%; animation:ctaShift 12s ease infinite;
        }

        /* ── Noise ── */
        .noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity:0.028; pointer-events:none;
        }

        /* ── Drag hint label ── */
        @keyframes hintFade { 0%{opacity:0;transform:translateY(4px)} 20%{opacity:1;transform:none} 80%{opacity:1} 100%{opacity:0} }
        .drag-hint { animation: hintFade 3.5s ease 1.5s forwards; }

        @keyframes scrollBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
        .scroll-ind { animation: scrollBounce 2s ease-in-out infinite; }
      `}</style>

      <div className="bg-[#06080C] text-white min-h-screen" style={{ fontFamily: '"DM Sans", sans-serif' }}>

        {/* ── Navbar ──────────────────────────────────────────────────────── */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          navScrolled ? 'bg-[#06080C]/85 backdrop-blur-2xl border-b border-white/[0.07]' : ''
        }`}>
          <div className="max-w-7xl mx-auto px-8 h-[64px] flex items-center justify-between">
            <span style={{ fontFamily: '"Sora", sans-serif' }}
              className="font-bold text-[17px] tracking-tight text-white">
              Interior<span className="text-[#2E6DA4]">OS</span>
            </span>
            <div className="flex items-center gap-8">
              {['Features','How it works','About'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`}
                  className="text-[13px] text-white/45 hover:text-white transition-colors duration-200 tracking-wide">
                  {l}
                </a>
              ))}
              <MagBtn to="/login"
                className="ml-2 px-5 py-2 text-[13px] font-semibold text-white border border-white/15 rounded-lg hover:bg-white/8 hover:border-white/30 transition-all duration-200 cursor-pointer gap-2">
                Sign in <ArrowRight size={13} strokeWidth={2} />
              </MagBtn>
            </div>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">

          {/* Room background */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 90% 65% at 50% 45%, #091523 0%, #06080C 100%)' }} />
          <div className="noise absolute inset-0" />

          {/* Ambient orbs */}
          <div className="orb1 absolute w-[700px] h-[700px] rounded-full pointer-events-none"
            style={{ top:'-18%', left:'-10%', background:'radial-gradient(circle,rgba(27,79,138,0.16) 0%,transparent 70%)', filter:'blur(70px)' }}/>
          <div className="orb2 absolute w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ bottom:'-12%', right:'-6%', background:'radial-gradient(circle,rgba(46,109,164,0.12) 0%,transparent 70%)', filter:'blur(60px)' }}/>
          <div className="orb3 absolute w-[350px] h-[350px] rounded-full pointer-events-none"
            style={{ top:'28%', right:'8%', background:'radial-gradient(circle,rgba(224,123,32,0.07) 0%,transparent 70%)', filter:'blur(50px)' }}/>

          {/* ── Hero text — revealed word by word by the lamp ── */}
          <div className="relative z-10 text-center max-w-[820px] px-8 pointer-events-none select-none">

            {/* Badge */}
            <div className={`lamp-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] mb-8 ${lit.badge ? 'lit' : ''}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E07B20]" />
              <span className="text-[11px] text-white/55 tracking-[0.25em] uppercase">Square Interiors · InteriorOS</span>
            </div>

            {/* Headline — each word its own span */}
            <h1 style={{ fontFamily:'"Sora",sans-serif', fontSize:'clamp(54px,7.5vw,88px)', fontWeight:800, lineHeight:1.03, letterSpacing:'-0.025em', display:'block' }}>
              <span className={`lamp-word float ${lit.w0 ? 'lit' : ''}`}
                style={{ color:'#fff', marginRight:'0.22em' }}>
                Design.
              </span>
              <span className={`lamp-word float ${lit.w1 ? 'lit' : ''}`}
                style={{ color:'transparent', backgroundImage:'linear-gradient(135deg,#6CB4E8,#2E6DA4)', WebkitBackgroundClip:'text', backgroundClip:'text', marginRight:'0.12em', animationDelay: lit.w1 ? '0s, 1.5s' : '0s' }}>
                Build.
              </span>
              <br />
              <span className={`lamp-word float ${lit.w2 ? 'lit' : ''}`}
                style={{ color:'#fff', animationDelay: lit.w2 ? '0s, 1.8s' : '0s' }}>
                Deliver.
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`lamp-sub mt-7 mb-11 text-[17px] text-white/42 max-w-[520px] mx-auto leading-[1.75] ${lit.sub ? 'lit' : ''}`}>
              The all-in-one platform built for interior design firms. Replace spreadsheets, WhatsApp groups, and disconnected tools — for good.
            </p>

            {/* CTAs — pointer-events back on for buttons */}
            <div className={`lamp-btns flex items-center justify-center gap-4 ${lit.btns ? 'lit' : ''}`}
              style={{ pointerEvents: lit.btns ? 'auto' : 'none' }}>
              <MagBtn to="/register"
                className="gap-2.5 px-8 py-3.5 text-[13px] font-semibold text-[#06080C] bg-white rounded-xl hover:bg-white/90 transition-all duration-200 cursor-pointer"
                style={{ boxShadow:'0 0 40px rgba(255,255,255,0.14),0 4px 20px rgba(0,0,0,0.3)' }}>
                Get started free <ArrowRight size={14} strokeWidth={2.2}/>
              </MagBtn>
              <MagBtn href="#features"
                className="gap-2 px-8 py-3.5 text-[13px] font-semibold text-white/60 hover:text-white border border-white/10 hover:border-white/25 rounded-xl transition-all duration-200 cursor-pointer">
                See features
              </MagBtn>
            </div>
          </div>

          {/* ── Canvas — lamp + light on top of everything ── */}
          <canvas ref={canvasRef}
            className="absolute inset-0"
            style={{ zIndex:20, pointerEvents:'none' }}/>

          {/* Drag hint — appears only after lamp has fully settled */}
          {lampSettled && (
            <div className="drag-hint absolute z-30 pointer-events-none"
              style={{ top:'33%', left:'20%', transform:'translate(-50%,-50%)' }}>
              <span className="text-[10px] text-white/30 tracking-widest uppercase bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                drag lamp
              </span>
            </div>
          )}

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 text-white/18 pointer-events-none">
            <span className="text-[10px] tracking-[0.28em] uppercase">scroll</span>
            <ChevronDown size={14} strokeWidth={1.5} className="scroll-ind"/>
          </div>

          {/* ── King bed — exact angle from reference photo ── */}
          <div className="absolute pointer-events-none select-none"
               style={{ bottom: 40, right: 40, zIndex: 18, opacity: 0.92 }}>
            {/*
              3-D coordinate system matching reference photo:
                Depth dir (foot→head): Δ=(+110,−38) for full length
                Height dir (up):       Δ=(0,−1) per px
              Anchors:
                FL_bot(12,226) FR_bot(240,206) BL_bot(122,188) BR_bot(350,168)
                FL_top(12,146) FR_top(240,126) BL_top(122,108) BR_top(350, 88)
                FL_mat(12,112) FR_mat(240, 92) BL_mat(122, 74) BR_mat(350, 54)
                HB_TL(122, 53) HB_TR(350, 33)
            */}
            <svg viewBox="0 0 380 240" width="372" height="234" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="rb_pf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#1E3858"/>
                  <stop offset="100%" stopColor="#0C1C30"/>
                </linearGradient>
                <linearGradient id="rb_ps" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#162C46"/>
                  <stop offset="100%" stopColor="#0A1824"/>
                </linearGradient>
                <linearGradient id="rb_ms" x1="0" y1="1" x2="0.3" y2="0">
                  <stop offset="0%"   stopColor="#1C3456"/>
                  <stop offset="100%" stopColor="#1A3054"/>
                </linearGradient>
                <linearGradient id="rb_hb" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#203C5E"/>
                  <stop offset="100%" stopColor="#142840"/>
                </linearGradient>
                <linearGradient id="rb_pl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#8AACC8"/>
                  <stop offset="100%" stopColor="#5E7A96"/>
                </linearGradient>
                <linearGradient id="rb_lg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="rgba(218,162,65,0)"/>
                  <stop offset="22%"  stopColor="rgba(218,162,65,0.54)"/>
                  <stop offset="72%"  stopColor="rgba(218,162,65,0.14)"/>
                  <stop offset="100%" stopColor="rgba(218,162,65,0)"/>
                </linearGradient>
                {/* Soft drop-shadow for pillows and edges */}
                <filter id="rb_ds" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2.5"
                    floodColor="#000814" floodOpacity="0.55"/>
                </filter>
              </defs>

              {/*
                _top / _mat points shifted +30 vs original → platform 50 px tall (thinner),
                HB_TL/TR stay fixed → headboard now 85 px tall (longer).
                FL_top(12,176) FR_top(240,156) BL_top(122,138) BR_top(350,118)
                FL_mat(12,142) FR_mat(240,122) BL_mat(122,104) BR_mat(350, 84)
              */}

              {/* 1 — Back face of platform */}
              <polygon points="122,188 350,168 350,118 122,138" fill="#09141F"/>

              {/* 2 — Right side of platform */}
              <polygon points="240,206 350,168 350,118 240,156" fill="url(#rb_ps)"/>

              {/* 3 — Right mattress piping strip */}
              <polygon points="240,156 350,118 350,84 240,122" fill="#182E48"/>
              <line x1="240" y1="123" x2="350" y2="85" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5"/>

              {/* 4 — Headboard — rounded corners (6 px), taller */}
              <path d="M 128,138 L 344,118 Q 350,118 350,112 L 350,39 Q 350,33 344,33
                       L 128,53 Q 122,53 122,59 L 122,132 Q 122,138 128,138 Z"
                    fill="url(#rb_hb)"/>
              <line x1="124" y1="54"  x2="348" y2="34"  stroke="rgba(255,255,255,0.16)" strokeWidth="2"/>
              <line x1="124" y1="80"  x2="348" y2="60"  stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
              <line x1="124" y1="106" x2="348" y2="86"  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>

              {/* 5 — Mattress top surface */}
              <polygon points="12,142 240,122 350,84 122,104" fill="url(#rb_ms)"/>
              <line x1="55"  y1="142" x2="138" y2="106" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              <line x1="105" y1="138" x2="180" y2="102" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              <line x1="160" y1="133" x2="222" y2="97"  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              <line x1="210" y1="129" x2="264" y2="92"  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>

              {/* 6 — Left pillow ── curved path, rounded corners, convex arch on top */}
              {/* Top surface: gently arched front edge shows pillow is rounded */}
              <path d="M 107,113 Q 150,110 194,105 L 215,98 Q 171,100 128,106 Z"
                    fill="#7AA0BC"/>
              {/* Front face: rounded 7-px corners, top arches +5 px upward, bottom sags −3 px */}
              <path d="M 114,87 Q 107,87 107,94 L 107,106 Q 107,113 114,113
                       Q 150,115 187,105 Q 194,105 194,98 L 194,86
                       Q 194,79 187,79 Q 150,73 114,87 Z"
                    fill="url(#rb_pl)" filter="url(#rb_ds)"/>
              {/* Piping border */}
              <path d="M 114,87 Q 107,87 107,94 L 107,106 Q 107,113 114,113
                       Q 150,115 187,105 Q 194,105 194,98 L 194,86
                       Q 194,79 187,79 Q 150,73 114,87 Z"
                    fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1"/>
              {/* Centre seam (dashed) */}
              <line x1="109" y1="100" x2="192" y2="92"
                    stroke="rgba(255,255,255,0.11)" strokeWidth="1" strokeDasharray="4,3"/>
              {/* Top shine */}
              <path d="M 116,87 Q 150,75 186,80"
                    fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5"/>

              {/* 7 — Right pillow ── same treatment */}
              <path d="M 214,103 Q 258,100 303,96 L 324,88 Q 280,92 235,96 Z"
                    fill="#7AA0BC"/>
              <path d="M 221,77 Q 214,77 214,84 L 214,96 Q 214,103 221,103
                       Q 258,106 296,96 Q 303,96 303,89 L 303,77
                       Q 303,70 296,70 Q 258,64 221,77 Z"
                    fill="url(#rb_pl)" filter="url(#rb_ds)"/>
              <path d="M 221,77 Q 214,77 214,84 L 214,96 Q 214,103 221,103
                       Q 258,106 296,96 Q 303,96 303,89 L 303,77
                       Q 303,70 296,70 Q 258,64 221,77 Z"
                    fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1"/>
              <line x1="216" y1="90" x2="301" y2="83"
                    stroke="rgba(255,255,255,0.11)" strokeWidth="1" strokeDasharray="4,3"/>
              <path d="M 223,77 Q 258,65 295,71"
                    fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5"/>

              {/* 8 — Mattress front face (thinner: 34 px) */}
              <polygon points="12,176 240,156 240,122 12,142" fill="#1C3658"/>
              <line x1="12" y1="143" x2="240" y2="123" stroke="rgba(255,255,255,0.20)" strokeWidth="2"/>
              <line x1="12" y1="176" x2="240" y2="156" stroke="rgba(0,0,0,0.22)"        strokeWidth="1"/>

              {/* 9 — Platform front face — rounded top corners */}
              <path d="M 12,226 L 12,184 Q 12,176 20,176
                       L 232,156 Q 240,156 240,164 L 240,206 Z"
                    fill="url(#rb_pf)"/>
              <line x1="12" y1="189" x2="240" y2="169" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              <line x1="12" y1="202" x2="240" y2="182" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
              <line x1="12" y1="215" x2="240" y2="195" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              <line x1="12" y1="177" x2="240" y2="157" stroke="rgba(255,255,255,0.14)" strokeWidth="2"/>

              {/* 10 — Highlights */}
              <line x1="124" y1="54"  x2="348" y2="34"  stroke="url(#rb_lg)"            strokeWidth="2.5"/>
              <line x1="130" y1="106" x2="213" y2="98"  stroke="rgba(218,162,65,0.22)"  strokeWidth="1"/>
              <line x1="237" y1="96"  x2="322" y2="88"  stroke="rgba(218,162,65,0.22)"  strokeWidth="1"/>
              <polygon points="122,104 350,84 346,96 122,116" fill="rgba(218,162,65,0.04)"/>
            </svg>
          </div>
        </section>

        {/* ── "What makes it different" strip ──────────────────────────── */}
        <section className="py-14 border-y border-white/[0.05] overflow-hidden">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-center gap-16 flex-wrap">
              {[
                { icon: FolderKanban, label: 'Project management' },
                { icon: IndianRupee,  label: 'Finance & invoicing' },
                { icon: Users,        label: 'Team collaboration' },
                { icon: LayoutDashboard, label: 'Client portal' },
                { icon: Sparkles,     label: 'AI assistant' },
                { icon: CalendarDays, label: 'Attendance & reports' },
                { icon: MessageSquare,label: 'Real-time chat' },
                { icon: Camera,       label: 'Snag detection' },
              ].map(({ icon: Icon, label }) => (
                <div key={label}
                  className="flex items-center gap-2.5 text-white/30 hover:text-white/70 transition-colors duration-300 cursor-default group">
                  <Icon size={15} strokeWidth={1.75} className="text-white/25 group-hover:text-[#2E6DA4] transition-colors duration-300" />
                  <span className="text-[12px] tracking-wide whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bento feature grid ────────────────────────────────────────── */}
        <section id="features" className="py-32 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20" data-reveal>
              <p className="text-[11px] tracking-[0.32em] uppercase text-[#E07B20] mb-4">What's inside</p>
              <h2 style={{ fontFamily: '"Sora", sans-serif' }}
                className="font-bold text-[42px] leading-tight text-white mb-5">
                Built for the way you work
              </h2>
              <p className="text-[15px] text-white/40 max-w-[480px] mx-auto leading-relaxed">
                Every tool your interior design firm needs, designed to work together seamlessly — and actually used every day.
              </p>
            </div>

            {/* Row 1: Dashboard large + Finance + Projects */}
            <div className="grid grid-cols-3 gap-4 mb-4">

              {/* Large dashboard card */}
              <TiltCard className="col-span-2 bento-card relative rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.018] group"
                style={{ minHeight: 420 }}>
                <div className="relative z-10 p-7 pb-0">
                  <div data-reveal data-delay="1" className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#1B4F8A]/20 text-[#5B9BD5] tracking-widest uppercase">Overview</span>
                  </div>
                  <h3 data-reveal data-delay="2" style={{ fontFamily: '"Sora", sans-serif' }}
                    className="font-bold text-[22px] text-white mb-2">Everything at a glance</h3>
                  <p data-reveal data-delay="3" className="text-[13px] text-white/40 max-w-[280px] leading-relaxed mb-6">
                    One dashboard for all projects, finances, tasks, and team activity — live and in real time.
                  </p>
                </div>
                <div className="ss-frame mx-7 rounded-t-xl overflow-hidden border border-white/10 relative"
                  style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.4)' }}>
                  <img src="/app/dashboard.png" alt="Dashboard" className="w-full block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06080C]/30 via-transparent to-transparent" />
                </div>
                {/* Hover border glow */}
                <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-[#2E6DA4]/30 transition-all duration-400 pointer-events-none" />
              </TiltCard>

              {/* Finance card */}
              <div className="flex flex-col gap-4">
                <TiltCard className="bento-card relative rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.018] group flex-1"
                  style={{ minHeight: 196 }}>
                  <div className="relative z-10 p-6 h-full flex flex-col">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: 'rgba(224,123,32,0.12)' }}>
                      <IndianRupee size={17} strokeWidth={1.75} className="text-[#E07B20]" />
                    </div>
                    <p className="text-[10px] tracking-widest uppercase text-[#E07B20] mb-1.5">Finance</p>
                    <h3 style={{ fontFamily: '"Sora", sans-serif' }}
                      className="font-semibold text-[15px] text-white mb-2">Invoices & budgets in ₹</h3>
                    <p className="text-[12px] text-white/35 leading-relaxed flex-1">
                      Real-time P&L across every project. Generate invoices in seconds.
                    </p>
                    <div className="mt-4 rounded-lg overflow-hidden border border-white/[0.06]">
                      <img src="/app/finance.png" alt="Finance" className="w-full block opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-[#E07B20]/25 transition-all duration-400 pointer-events-none" />
                </TiltCard>

                {/* Projects card */}
                <TiltCard className="bento-card relative rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.018] group flex-1"
                  style={{ minHeight: 196 }}>
                  <div className="relative z-10 p-6 h-full flex flex-col">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: 'rgba(46,109,164,0.12)' }}>
                      <FolderKanban size={17} strokeWidth={1.75} className="text-[#2E6DA4]" />
                    </div>
                    <p className="text-[10px] tracking-widest uppercase text-[#2E6DA4] mb-1.5">Projects</p>
                    <h3 style={{ fontFamily: '"Sora", sans-serif' }}
                      className="font-semibold text-[15px] text-white mb-2">Phase-by-phase tracking</h3>
                    <p className="text-[12px] text-white/35 leading-relaxed flex-1">
                      Milestones, timelines, deliverables — all in one organised workspace.
                    </p>
                    <div className="mt-4 rounded-lg overflow-hidden border border-white/[0.06]">
                      <img src="/app/projects.png" alt="Projects" className="w-full block opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-[#2E6DA4]/25 transition-all duration-400 pointer-events-none" />
                </TiltCard>
              </div>
            </div>

            {/* Row 2: Client portal wide + AI + Tasks */}
            <div className="grid grid-cols-3 gap-4">

              {/* Client portal - wide */}
              <TiltCard className="bento-card col-span-2 relative rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.018] group"
                style={{ minHeight: 320 }}>
                <div className="relative z-10 p-7 flex gap-8 h-full items-center">
                  <div className="flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-5"
                      style={{ background: 'rgba(27,79,138,0.15)' }}>
                      <Users size={17} strokeWidth={1.75} className="text-[#5B9BD5]" />
                    </div>
                    <p className="text-[10px] tracking-widest uppercase text-[#5B9BD5] mb-2">Client Portal</p>
                    <h3 style={{ fontFamily: '"Sora", sans-serif' }}
                      className="font-bold text-[20px] text-white mb-3 leading-snug">
                      Clients stay in<br />the loop — always
                    </h3>
                    <p className="text-[13px] text-white/38 leading-relaxed mb-6 max-w-[280px]">
                      A live portal for design approvals, milestone tracking, documents, and progress — no phone calls needed.
                    </p>
                    <div className="flex items-center gap-2">
                      {['Live updates', 'Design approval', 'Documents'].map(f => (
                        <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] text-white/45 border border-white/[0.08] bg-white/[0.025]">
                          <CheckCircle2 size={10} strokeWidth={2} className="text-[#5B9BD5]" />{f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="w-[52%] shrink-0 rounded-xl overflow-hidden border border-white/[0.08] ss-frame"
                    style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}>
                    <img src="/app/client.png" alt="Client portal" className="w-full block" />
                  </div>
                </div>
                <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-[#1B4F8A]/35 transition-all duration-400 pointer-events-none" />
              </TiltCard>

              <div className="flex flex-col gap-4">
                {/* AI card */}
                <TiltCard className="bento-card relative rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.018] group flex-1">
                  <div className="relative z-10 p-6 h-full flex flex-col">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: 'rgba(224,123,32,0.12)' }}>
                      <Sparkles size={17} strokeWidth={1.75} className="text-[#E07B20]" />
                    </div>
                    <p className="text-[10px] tracking-widest uppercase text-[#E07B20] mb-1.5">AI Built-in</p>
                    <h3 style={{ fontFamily: '"Sora", sans-serif' }}
                      className="font-semibold text-[15px] text-white mb-2">Smart assistant for every workflow</h3>
                    <p className="text-[12px] text-white/35 leading-relaxed flex-1">
                      Snag detection, finance insights, and project Q&A — powered by LLaMA vision.
                    </p>
                    <div className="mt-4 rounded-lg overflow-hidden border border-white/[0.06]">
                      <img src="/app/ai.png" alt="AI" className="w-full block opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-[#E07B20]/25 transition-all duration-400 pointer-events-none" />
                </TiltCard>

                {/* Tasks card */}
                <TiltCard className="bento-card relative rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.018] group flex-1">
                  <div className="relative z-10 p-6 h-full flex flex-col">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: 'rgba(46,109,164,0.12)' }}>
                      <FileText size={17} strokeWidth={1.75} className="text-[#2E6DA4]" />
                    </div>
                    <p className="text-[10px] tracking-widest uppercase text-[#2E6DA4] mb-1.5">Tasks & Snags</p>
                    <h3 style={{ fontFamily: '"Sora", sans-serif' }}
                      className="font-semibold text-[15px] text-white mb-2">Nothing slips through</h3>
                    <p className="text-[12px] text-white/35 leading-relaxed flex-1">
                      Tasks, snag lists, attendance — every operational detail tracked and assigned.
                    </p>
                    <div className="mt-4 rounded-lg overflow-hidden border border-white/[0.06]">
                      <img src="/app/tasks.png" alt="Tasks" className="w-full block opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-[#2E6DA4]/25 transition-all duration-400 pointer-events-none" />
                </TiltCard>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature detail: Chat ─────────────────────────────────────── */}
        <section className="py-24 px-8 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 gap-20 items-center">
              <div data-reveal>
                <p className="text-[11px] tracking-[0.32em] uppercase text-[#E07B20] mb-5">Collaboration</p>
                <h2 style={{ fontFamily: '"Sora", sans-serif' }}
                  className="font-bold text-[38px] leading-tight text-white mb-7">
                  Kill the WhatsApp<br />chaos for good.
                </h2>
                <p className="text-[15px] text-white/42 leading-relaxed mb-8">
                  Every conversation, file, and decision — organised by project. Supervisors, designers, and clients all in one thread. No screenshots, no missed messages.
                </p>
                <div className="space-y-4">
                  {[
                    'Project-scoped conversations',
                    'File and photo sharing built in',
                    'Clients have their own view',
                    'Real-time delivery receipts',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#1B4F8A]/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={11} strokeWidth={2.5} className="text-[#5B9BD5]" />
                      </div>
                      <span className="text-[14px] text-white/60">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div data-reveal data-delay="3" className="relative">
                <div className="absolute inset-0 rounded-2xl"
                  style={{ background: 'radial-gradient(circle at 50% 50%, rgba(27,79,138,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="ss-frame relative rounded-2xl overflow-hidden border border-white/[0.1]"
                  style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                  <img src="/app/chat.png" alt="Chat" className="w-full block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06080C]/20 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature detail: Designs ─────────────────────────────────── */}
        <section className="py-24 px-8 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 gap-20 items-center">
              <div data-reveal data-delay="2" className="relative order-2">
                <div className="absolute inset-0 rounded-2xl"
                  style={{ background: 'radial-gradient(circle at 50% 50%, rgba(46,109,164,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="ss-frame relative rounded-2xl overflow-hidden border border-white/[0.1]"
                  style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                  <img src="/app/designs.png" alt="Designs" className="w-full block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06080C]/20 to-transparent" />
                </div>
              </div>
              <div data-reveal className="order-1">
                <p className="text-[11px] tracking-[0.32em] uppercase text-[#E07B20] mb-5">Design Studio</p>
                <h2 style={{ fontFamily: '"Sora", sans-serif' }}
                  className="font-bold text-[38px] leading-tight text-white mb-7">
                  Present designs.<br />Get approvals faster.
                </h2>
                <p className="text-[15px] text-white/42 leading-relaxed mb-8">
                  Upload mood boards, renders, and material samples. Clients comment, approve, or request changes — all tracked with version history.
                </p>
                <div className="space-y-4">
                  {[
                    'Version-controlled design uploads',
                    'Client comments and approvals',
                    'Moodboard and material library',
                    'Presentation-ready sharing links',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#1B4F8A]/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={11} strokeWidth={2.5} className="text-[#5B9BD5]" />
                      </div>
                      <span className="text-[14px] text-white/60">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-32 px-8 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20" data-reveal>
              <p className="text-[11px] tracking-[0.32em] uppercase text-[#E07B20] mb-4">The process</p>
              <h2 style={{ fontFamily: '"Sora", sans-serif' }}
                className="font-bold text-[42px] text-white">Up and running in minutes</h2>
            </div>

            <div className="grid grid-cols-4 gap-8 relative">
              {/* Connecting line */}
              <div className="absolute top-[22px] left-[12.5%] right-[12.5%] h-px"
                style={{ background: 'linear-gradient(to right, transparent, rgba(46,109,164,0.3) 20%, rgba(46,109,164,0.3) 80%, transparent)' }} />

              {HOW.map(({ n, title, desc }, i) => (
                <div key={n} data-reveal data-delay={String(i + 1)} className="relative pt-1">
                  <div className="step-num w-11 h-11 rounded-full border border-[#1B4F8A]/40 flex items-center justify-center mb-6 bg-[#06080C]"
                    style={{ animationDelay: `${i * 0.7}s` }}>
                    <span className="text-[12px] font-semibold text-[#5B9BD5]">{n}</span>
                  </div>
                  <h3 style={{ fontFamily: '"Sora", sans-serif' }}
                    className="font-semibold text-[15px] text-white mb-3">{title}</h3>
                  <p className="text-[13px] text-white/38 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── About strip ──────────────────────────────────────────────── */}
        <section id="about" className="py-24 px-8 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-5 gap-16 items-start">
              <div className="col-span-2" data-reveal>
                <p className="text-[11px] tracking-[0.32em] uppercase text-[#E07B20] mb-5">About</p>
                <h2 style={{ fontFamily: '"Sora", sans-serif' }}
                  className="font-bold text-[36px] leading-tight text-white mb-6">
                  One platform.<br />Your entire firm.
                </h2>
                <p className="text-[14px] text-white/40 leading-relaxed mb-5">
                  InteriorOS was built specifically for interior design firms tired of stitching together WhatsApp, Google Sheets, and email.
                </p>
                <p className="text-[14px] text-white/40 leading-relaxed">
                  Designed for the Indian market — ₹ currency, familiar workflows, and a client experience that puts you ahead of firms still sending PDFs over WhatsApp.
                </p>
              </div>
              <div className="col-span-3" data-reveal data-delay="2">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: FolderKanban, title: 'Project tracking', desc: 'Every phase, milestone, and deliverable — tracked from kickoff to handover.' },
                    { icon: IndianRupee,  title: 'Finance in ₹',    desc: 'Quotations, invoices, payments — all in Indian Rupees with proper formatting.' },
                    { icon: Users,        title: 'Multi-role teams', desc: 'Admins, supervisors, designers, and clients each have their own view and access.' },
                    { icon: Zap,          title: 'Real-time alerts', desc: 'Instant notifications for task updates, payment receipts, and approvals.' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title}
                      className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-250 group">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
                        style={{ background: 'rgba(27,79,138,0.15)' }}>
                        <Icon size={15} strokeWidth={1.75} className="text-[#5B9BD5]" />
                      </div>
                      <p style={{ fontFamily: '"Sora", sans-serif' }}
                        className="font-semibold text-[13px] text-white mb-2">{title}</p>
                      <p className="text-[12px] text-white/35 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="py-20 px-8">
          <div className="max-w-7xl mx-auto" data-reveal>
            <div className="cta-bg relative overflow-hidden rounded-3xl px-16 py-24 text-center">
              {/* Noise overlay */}
              <div className="noise absolute inset-0 rounded-3xl" />
              {/* Orb */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)', filter: 'blur(40px)' }} />
              <div className="relative z-10">
                <p className="text-[11px] tracking-[0.32em] uppercase text-white/40 mb-6">Get started today</p>
                <h2 style={{ fontFamily: '"Sora", sans-serif' }}
                  className="font-bold text-[44px] leading-tight text-white mb-6">
                  Ready to streamline<br />your design firm?
                </h2>
                <p className="text-[16px] text-white/50 mb-12 max-w-[400px] mx-auto leading-relaxed">
                  Join interior design teams already running on InteriorOS — and leave the spreadsheets behind.
                </p>
                <MagBtn to="/register"
                  className="gap-2.5 px-10 py-4 bg-white text-[#0F2340] text-[14px] font-semibold rounded-xl hover:bg-white/90 transition-all duration-200 cursor-pointer"
                  style={{ boxShadow: '0 0 50px rgba(255,255,255,0.15)' }}>
                  Get started free <ArrowRight size={15} strokeWidth={2.2} />
                </MagBtn>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer id="contact" className="border-t border-white/[0.05] py-16 px-8">
          <div className="max-w-7xl mx-auto flex items-start justify-between">
            <div>
              <span style={{ fontFamily: '"Sora", sans-serif' }}
                className="font-bold text-[16px] text-white">
                Interior<span className="text-[#2E6DA4]">OS</span>
              </span>
              <p className="text-[12px] text-white/22 mt-1">by Square Interiors</p>
              <p className="text-[12px] text-white/22 mt-4 max-w-[220px] leading-relaxed">
                The operating system for modern interior design firms.
              </p>
            </div>
            <div className="flex gap-20">
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-5">Product</p>
                <div className="flex flex-col gap-3.5">
                  <a href="#features"      className="text-[13px] text-white/38 hover:text-white transition-colors duration-200">Features</a>
                  <a href="#how-it-works"  className="text-[13px] text-white/38 hover:text-white transition-colors duration-200">How it works</a>
                  <Link to="/login"        className="text-[13px] text-white/38 hover:text-white transition-colors duration-200">Login</Link>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-5">Company</p>
                <div className="flex flex-col gap-3.5">
                  <a href="#about"   className="text-[13px] text-white/38 hover:text-white transition-colors duration-200">About</a>
                  <a href="#contact" className="text-[13px] text-white/38 hover:text-white transition-colors duration-200">Contact</a>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-5">Contact</p>
                <div className="flex flex-col gap-3.5">
                  <a href="mailto:hello@squareinteriors.in"
                    className="text-[13px] text-white/38 hover:text-white transition-colors duration-200">
                    hello@squareinteriors.in
                  </a>
                  <p className="text-[13px] text-white/38">Coimbatore, Tamil Nadu</p>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-14 pt-7 border-t border-white/[0.04]">
            <p className="text-[11px] text-white/18 text-center">
              © 2025 Square Interiors. All rights reserved.
            </p>
          </div>
        </footer>

      </div>
    </>
  )
}
