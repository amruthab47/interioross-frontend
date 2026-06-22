import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
  PenTool, Trash2, Grid, ChevronDown, Layers, Eye, EyeOff,
  X, Move, Plus, Info, RotateCcw, RotateCw, Home, Building2, Palette,
  ChevronLeft, Maximize2, Pencil, Check, Save, Send, DoorOpen,
} from 'lucide-react'
import { getFurniture } from '../api/catalog'
import { getProjects } from '../api/projects'
import { projectToRow } from '../utils/format'
import { saveStudioDesign, getLatestStudioDesign } from '../api/designs'

// ── Scales ───────────────────────────────────────────────────────────────────
const WALL_T      = 16   // wall thickness in room canvas (px)
const ROOM_SCALE  = 28   // px per foot in room canvas
const ROOM_SCALE_M= 90   // px per metre
const FP_SCALE    = 14   // px per foot in floor-plan canvas
const FP_SCALE_M  = 46
const FP_WALL     = 9    // wall thickness in floor plan (px)
const FP_W        = 1100 // floor-plan canvas width
const FP_H        = 680  // floor-plan canvas height

const fmt   = n => '₹' + n.toLocaleString('en-IN')
const nextId = (() => { let i = 200; return () => `p-${i++}` })()

function getRoomCanvas(dims) {
  const s = dims.unit === 'ft' ? ROOM_SCALE : ROOM_SCALE_M
  return {
    w: Math.min(Math.max(Math.round(dims.w * s), 280), 760),
    h: Math.min(Math.max(Math.round(dims.d * s), 220), 560),
    s,
  }
}
function getFPRoomSize(dims) {
  const s = dims.unit === 'ft' ? FP_SCALE : FP_SCALE_M
  return { rw: Math.round(dims.w * s), rh: Math.round(dims.d * s) }
}

// ── Colour helpers ────────────────────────────────────────────────────────────
function lighten(hex, a = 0.3) {
  if (!hex || hex[0] !== '#') return hex
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `rgb(${Math.round(r+(255-r)*a)},${Math.round(g+(255-g)*a)},${Math.round(b+(255-b)*a)})`
}
function darken(hex, a = 0.28) {
  if (!hex || hex[0] !== '#') return hex
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `rgb(${Math.round(r*(1-a))},${Math.round(g*(1-a))},${Math.round(b*(1-a))})`
}

const baseW = ci => ci ? Math.max(Math.round((ci.widthCm ?? 90) / 6), 28) : 28
const baseH = ci => ci ? Math.max(Math.round((ci.depthCm ?? 60) / 6), 18) : 18
const itemW  = it => Math.max(Math.round(baseW(it.catalogItem) * (it.scale ?? 1)), 22)
const itemH  = it => Math.max(Math.round(baseH(it.catalogItem) * (it.scale ?? 1)), 14)

function hitTest(mx, my, item) {
  const w = itemW(item), h = itemH(item)
  const dx = mx - item.cx, dy = my - item.cy
  const rad = -((item.rotation ?? 0) * Math.PI) / 180
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad)
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad)
  return Math.abs(rx) <= w/2+3 && Math.abs(ry) <= h/2+3
}

// ── Colour variants ───────────────────────────────────────────────────────────
const COLOR_VARIANTS = {
  sofa:     [{name:'Slate',hex:'#7A8799'},{name:'Mocha',hex:'#A0826D'},{name:'Teal',hex:'#4A7B7B'},{name:'Ivory',hex:'#D4C4B0'},{name:'Navy',hex:'#2C3E50'},{name:'Rose',hex:'#B07878'}],
  chair:    [{name:'Walnut',hex:'#8B6343'},{name:'Cream',hex:'#E8DDD0'},{name:'Charcoal',hex:'#4A4A4A'},{name:'Teal',hex:'#3E8080'},{name:'Blush',hex:'#C09090'}],
  table:    [{name:'Oak',hex:'#C19A6B'},{name:'Walnut',hex:'#8B6343'},{name:'White',hex:'#F0EDED'},{name:'Wenge',hex:'#4A3728'},{name:'Gray',hex:'#C5C5C5'}],
  bed:      [{name:'Walnut',hex:'#8B6343'},{name:'Oak',hex:'#C19A6B'},{name:'White',hex:'#F0EFED'},{name:'Wenge',hex:'#4A3728'},{name:'Navy',hex:'#2C3E52'}],
  wardrobe: [{name:'Cream',hex:'#E8DDD0'},{name:'Walnut',hex:'#8B6343'},{name:'White',hex:'#F5F5F5'},{name:'Gray',hex:'#B0B0B0'},{name:'Navy',hex:'#2C3E50'}],
  coffee:   [{name:'Oak',hex:'#C19A6B'},{name:'Walnut',hex:'#8B6343'},{name:'White',hex:'#F5F5F5'},{name:'Black',hex:'#2A2A2A'},{name:'Marble',hex:'#E8E4E0'}],
  desk:     [{name:'Oak',hex:'#C5A97A'},{name:'White',hex:'#F5F5F5'},{name:'Walnut',hex:'#7B5B3A'},{name:'Gray',hex:'#9CA3AF'}],
  shelf:    [{name:'Oak',hex:'#C19A6B'},{name:'White',hex:'#F5F5F5'},{name:'Walnut',hex:'#8B6343'},{name:'Black',hex:'#2A2A2A'}],
  tv:       [{name:'Black',hex:'#1A1A2E'},{name:'Anthracite',hex:'#2C2C3A'},{name:'White',hex:'#EFEFEF'},{name:'Oak',hex:'#C19A6B'}],
  lamp:     [{name:'Brass',hex:'#B8860B'},{name:'Chrome',hex:'#B0B8C0'},{name:'Black',hex:'#2A2A2A'},{name:'Copper',hex:'#B87333'},{name:'White',hex:'#F0F0F0'}],
  pendant:  [{name:'Brass',hex:'#B8860B'},{name:'Black',hex:'#1A1A1A'},{name:'White',hex:'#F0F0F0'},{name:'Copper',hex:'#B87333'}],
  side:     [{name:'Oak',hex:'#C19A6B'},{name:'Walnut',hex:'#8B6343'},{name:'White',hex:'#F5F5F5'},{name:'Marble',hex:'#E8E4E0'}],
  default:  [{name:'Beige',hex:'#D6C4A8'},{name:'Gray',hex:'#9CA3AF'},{name:'White',hex:'#F5F5F5'},{name:'Walnut',hex:'#8B6343'}],
}
const getVariants = icon => COLOR_VARIANTS[icon] ?? COLOR_VARIANTS.default

// ── Furniture heights (cm, approximate for elevation view) ────────────────────
const FURNITURE_H_CM = {
  sofa:80, chair:85, table:76, bed:55, wardrobe:205,
  coffee:45, desk:76, shelf:188, tv:148, lamp:168, pendant:35, side:62, default:80,
}
const ELEV_CEILING_CM = 270
const DOOR_FT = 3

// ── Isometric 3D room view ────────────────────────────────────────────────────
function Iso3DView({ room, items }) {
  const C30 = Math.sqrt(3) / 2   // cos 30°
  const S30 = 0.5                 // sin 30°
  const RW  = room.dims.unit === 'ft' ? room.dims.w : Math.round(room.dims.w * 3.28)
  const RD  = room.dims.unit === 'ft' ? room.dims.d : Math.round(room.dims.d * 3.28)
  const RH  = 9  // 9 ft ceiling

  // Scale so the room fits comfortably; max canvas ~700 wide
  const S   = Math.min(26, 660 / ((RW + RD) * C30 * 2))
  const CVW = Math.round((RW + RD) * C30 * S + 80)
  const CVH = Math.round((RW + RD) * S30 * S + RH * S * 0.92 + 80)

  // Isometric origin: the near corner of the floor sits at the bottom-centre
  const OX = CVW / 2
  const OY = CVH - 36

  // World → screen: x = west↔east, z = near↔far, h = floor↔ceiling (all in ft)
  const iso = (x, z, h = 0) => [
    OX + (x - z) * C30 * S,
    OY - (x + z) * S30 * S - h * S * 0.92,
  ]

  // Build an SVG points string from an array of [x, z, h] triples
  const P = (...corners) =>
    corners.map(([x, z, h = 0]) => iso(x, z, h).join(',')).join(' ')

  // Room canvas size (for mapping furniture cx/cy → room feet)
  const { w: CW, h: CH } = getRoomCanvas(room.dims)
  const roomPos = it => ({
    fx: ((it.cx - WALL_T) / (CW - WALL_T * 2)) * RW,
    fz: ((it.cy - WALL_T) / (CH - WALL_T * 2)) * RD,
  })
  const roomDims = it => {
    const ci = it.catalogItem, sc = it.scale ?? 1
    return {
      fw: Math.min((ci.widthCm ?? 90) / 30.48 * sc, RW * 0.85),
      fd: Math.min((ci.depthCm ?? 60) / 30.48 * sc, RD * 0.85),
      fh: (FURNITURE_H_CM[ci.icon] ?? 80) / 30.48,
    }
  }

  // Painter's algorithm — draw items with highest (fx+fz) first (they're furthest back)
  const sorted = [...items].sort((a, b) => {
    const { fx: ax, fz: az } = roomPos(a)
    const { fx: bx, fz: bz } = roomPos(b)
    return (bx + bz) - (ax + az)
  })

  // Furniture top-face detail shapes for common icons
  const topDetail = (icon, x0, z0, x1, z1, fh, col) => {
    const dk = darken(col, 0.22)
    const lt = lighten(col, 0.35)
    switch (icon) {
      case 'sofa': return <>
        {/* backrest */}
        <polygon points={P([x0,z0,fh],[x1,z0,fh],[x1,z0+(z1-z0)*0.28,fh],[x0,z0+(z1-z0)*0.28,fh])} fill={dk} opacity="0.8"/>
        {/* seat cushion divider */}
        <line x1={iso(x0+(x1-x0)/2,z0+(z1-z0)*0.28,fh)[0]} y1={iso(x0+(x1-x0)/2,z0+(z1-z0)*0.28,fh)[1]}
              x2={iso(x0+(x1-x0)/2,z1,fh)[0]} y2={iso(x0+(x1-x0)/2,z1,fh)[1]} stroke="rgba(0,0,0,0.15)" strokeWidth="0.7"/>
        {/* armrests */}
        <polygon points={P([x0,z0,fh],[x0+(x1-x0)*0.14,z0,fh],[x0+(x1-x0)*0.14,z1,fh],[x0,z1,fh])} fill={dk} opacity="0.7"/>
        <polygon points={P([x1-(x1-x0)*0.14,z0,fh],[x1,z0,fh],[x1,z1,fh],[x1-(x1-x0)*0.14,z1,fh])} fill={dk} opacity="0.7"/>
      </>
      case 'bed': return <>
        {/* headboard */}
        <polygon points={P([x0,z0,fh],[x1,z0,fh],[x1,z0+(z1-z0)*0.22,fh],[x0,z0+(z1-z0)*0.22,fh])} fill={dk} opacity="0.85"/>
        {/* mattress (lighter) */}
        <polygon points={P([x0+(x1-x0)*0.04,z0+(z1-z0)*0.24,fh],[x1-(x1-x0)*0.04,z0+(z1-z0)*0.24,fh],[x1-(x1-x0)*0.04,z1-(z1-z0)*0.04,fh],[x0+(x1-x0)*0.04,z1-(z1-z0)*0.04,fh])} fill={lt} opacity="0.7"/>
        {/* pillows */}
        <polygon points={P([x0+(x1-x0)*0.08,z0+(z1-z0)*0.26,fh],[x0+(x1-x0)*0.45,z0+(z1-z0)*0.26,fh],[x0+(x1-x0)*0.45,z0+(z1-z0)*0.4,fh],[x0+(x1-x0)*0.08,z0+(z1-z0)*0.4,fh])} fill={lighten(col,0.6)} opacity="0.8"/>
        <polygon points={P([x0+(x1-x0)*0.55,z0+(z1-z0)*0.26,fh],[x1-(x1-x0)*0.08,z0+(z1-z0)*0.26,fh],[x1-(x1-x0)*0.08,z0+(z1-z0)*0.4,fh],[x0+(x1-x0)*0.55,z0+(z1-z0)*0.4,fh])} fill={lighten(col,0.6)} opacity="0.8"/>
      </>
      case 'wardrobe': return <>
        {/* door panels */}
        <line x1={iso(x0+(x1-x0)/3,z0,fh)[0]} y1={iso(x0+(x1-x0)/3,z0,fh)[1]} x2={iso(x0+(x1-x0)/3,z1,fh)[0]} y2={iso(x0+(x1-x0)/3,z1,fh)[1]} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8"/>
        <line x1={iso(x0+(x1-x0)*2/3,z0,fh)[0]} y1={iso(x0+(x1-x0)*2/3,z0,fh)[1]} x2={iso(x0+(x1-x0)*2/3,z1,fh)[0]} y2={iso(x0+(x1-x0)*2/3,z1,fh)[1]} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8"/>
      </>
      case 'table': return <>
        {/* wood grain lines */}
        {[0.25,0.5,0.75].map(t => (
          <line key={t} x1={iso(x0,z0+(z1-z0)*t,fh)[0]} y1={iso(x0,z0+(z1-z0)*t,fh)[1]}
            x2={iso(x1,z0+(z1-z0)*t,fh)[0]} y2={iso(x1,z0+(z1-z0)*t,fh)[1]} stroke="rgba(0,0,0,0.08)" strokeWidth="0.6"/>
        ))}
      </>
      case 'shelf': return <>
        {/* shelf dividers */}
        {[0.33,0.66].map(t => (
          <line key={t} x1={iso(x0+(x1-x0)*t,z0,fh)[0]} y1={iso(x0+(x1-x0)*t,z0,fh)[1]}
            x2={iso(x0+(x1-x0)*t,z1,fh)[0]} y2={iso(x0+(x1-x0)*t,z1,fh)[1]} stroke="rgba(0,0,0,0.15)" strokeWidth="0.6"/>
        ))}
      </>
      default: return null
    }
  }

  // Door geometry — show door opening on west (x=0) or north (z=RD) wall if visible
  const door = room.door ?? DEFAULT_DOOR
  const DH = 7  // door height ft

  return (
    <svg width={CVW} height={CVH} style={{ flexShrink:0, display:'block', borderRadius:12 }}>
      <defs>
        <filter id="iso-shadow" x="-30%" y="-30%" width="160%" height="200%">
          <feDropShadow dx="1.5" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.28)"/>
        </filter>
        <filter id="floor-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(0,0,0,0.15)"/>
        </filter>
        <radialGradient id="ceiling-light" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,250,230,0.25)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width={CVW} height={CVH} fill="#DDD8D0" rx="12"/>
      {/* Ceiling area fill */}
      <polygon points={P([0,0,RH],[RW,0,RH],[RW,RD,RH],[0,RD,RH])}
        fill="#F4F0EA" opacity="0.25"/>

      {/* ── Floor ── */}
      <polygon points={P([0,0],[RW,0],[RW,RD],[0,RD])} fill={room.floorColor} stroke="#B8ADA0" strokeWidth="0.5"/>
      {/* Floor tile grid */}
      {Array.from({length:Math.ceil(RW)+1},(_,i)=>i).map(i => {
        const [x1,y1]=iso(i,0), [x2,y2]=iso(i,RD)
        return <line key={`fx${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.07)" strokeWidth="0.5"/>
      })}
      {Array.from({length:Math.ceil(RD)+1},(_,i)=>i).map(i => {
        const [x1,y1]=iso(0,i), [x2,y2]=iso(RW,i)
        return <line key={`fz${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.07)" strokeWidth="0.5"/>
      })}
      {/* Floor edge highlight */}
      <polygon points={P([0,0],[RW,0],[RW,RD],[0,RD])} fill="none" stroke="#C5BAA6" strokeWidth="1"/>

      {/* ── West wall (x=0 face) ── */}
      {/* Base fill */}
      <polygon points={P([0,0],[0,RD],[0,RD,RH],[0,0,RH])}
        fill="url(#west-grad)" stroke="#B0A899" strokeWidth="0.5"/>
      {/* Ambient gradient overlay */}
      <defs>
        <linearGradient id="west-grad" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#C8C1B8"/>
          <stop offset="40%" stopColor="#D5CFC8"/>
          <stop offset="100%" stopColor="#E2DDD8"/>
        </linearGradient>
        <linearGradient id="north-grad" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#D4CEC7"/>
          <stop offset="40%" stopColor="#E0DAD3"/>
          <stop offset="100%" stopColor="#EDE8E3"/>
        </linearGradient>
      </defs>
      {/* Baseboard west */}
      <polygon points={P([0,0,0],[0,RD,0],[0,RD,0.22],[0,0,0.22])} fill="rgba(255,255,255,0.45)"/>
      {/* Crown moulding west */}
      <polygon points={P([0,0,RH],[0,RD,RH],[0,RD,RH-0.2],[0,0,RH-0.2])} fill="rgba(255,255,255,0.3)"/>
      {/* West wall window */}
      {RD >= 8 && (() => {
        const wz1=RD*0.28, wz2=RD*0.58, wh1=3.0, wh2=6.8
        return <>
          <polygon points={P([0,wz1,wh1],[0,wz2,wh1],[0,wz2,wh2],[0,wz1,wh2])}
            fill="rgba(185,220,245,0.7)" stroke="#9ABFCF" strokeWidth="0.8"/>
          {/* Window sill */}
          <polygon points={P([0,wz1-0.1,wh1-0.1],[0,wz2+0.1,wh1-0.1],[0,wz2+0.1,wh1],[0,wz1-0.1,wh1])}
            fill="rgba(255,255,255,0.6)"/>
          {/* Window cross bar */}
          <line x1={iso(0,(wz1+wz2)/2,wh1)[0]} y1={iso(0,(wz1+wz2)/2,wh1)[1]}
                x2={iso(0,(wz1+wz2)/2,wh2)[0]} y2={iso(0,(wz1+wz2)/2,wh2)[1]} stroke="#9ABFCF" strokeWidth="0.6"/>
          <line x1={iso(0,wz1,(wh1+wh2)/2)[0]} y1={iso(0,wz1,(wh1+wh2)/2)[1]}
                x2={iso(0,wz2,(wh1+wh2)/2)[0]} y2={iso(0,wz2,(wh1+wh2)/2)[1]} stroke="#9ABFCF" strokeWidth="0.6"/>
        </>
      })()}
      {/* Door on west wall */}
      {door.wall === 'left' && (() => {
        const dz = Math.max(0, Math.min(RD-DOOR_FT, door.offset * (RD-DOOR_FT)))
        return <>
          <polygon points={P([0,dz,0],[0,dz+DOOR_FT,0],[0,dz+DOOR_FT,DH],[0,dz,DH])}
            fill="rgba(240,232,220,0.95)" stroke="#8B7355" strokeWidth="0.8"/>
          {/* Door panel detail */}
          <polygon points={P([0,dz+DOOR_FT*0.08,DH*0.08],[0,dz+DOOR_FT*0.92,DH*0.08],[0,dz+DOOR_FT*0.92,DH*0.52],[0,dz+DOOR_FT*0.08,DH*0.52])}
            fill="none" stroke="#8B7355" strokeWidth="0.5" opacity="0.5"/>
          <polygon points={P([0,dz+DOOR_FT*0.08,DH*0.56],[0,dz+DOOR_FT*0.92,DH*0.56],[0,dz+DOOR_FT*0.92,DH*0.92],[0,dz+DOOR_FT*0.08,DH*0.92])}
            fill="none" stroke="#8B7355" strokeWidth="0.5" opacity="0.5"/>
          {/* Door handle */}
          <circle cx={iso(0,dz+DOOR_FT*0.8,(DH*0.5))[0]} cy={iso(0,dz+DOOR_FT*0.8,(DH*0.5))[1]} r="2.5" fill="#B8860B"/>
        </>
      })()}

      {/* ── North wall (z=RD face) ── */}
      <polygon points={P([0,RD],[RW,RD],[RW,RD,RH],[0,RD,RH])}
        fill="url(#north-grad)" stroke="#B0A899" strokeWidth="0.5"/>
      {/* Baseboard north */}
      <polygon points={P([0,RD,0],[RW,RD,0],[RW,RD,0.22],[0,RD,0.22])} fill="rgba(255,255,255,0.45)"/>
      {/* Crown moulding north */}
      <polygon points={P([0,RD,RH],[RW,RD,RH],[RW,RD,RH-0.2],[0,RD,RH-0.2])} fill="rgba(255,255,255,0.3)"/>
      {/* North wall windows */}
      {RW >= 8 && (() => {
        const pairs = RW >= 16
          ? [[RW*0.15,RW*0.38],[RW*0.62,RW*0.85]]
          : [[RW*0.2,RW*0.8]]
        return pairs.map(([wx1,wx2],pi) => (
          <g key={pi}>
            <polygon points={P([wx1,RD,3.0],[wx2,RD,3.0],[wx2,RD,6.8],[wx1,RD,6.8])}
              fill="rgba(185,220,245,0.7)" stroke="#9ABFCF" strokeWidth="0.8"/>
            <line x1={iso((wx1+wx2)/2,RD,3.0)[0]} y1={iso((wx1+wx2)/2,RD,3.0)[1]}
                  x2={iso((wx1+wx2)/2,RD,6.8)[0]} y2={iso((wx1+wx2)/2,RD,6.8)[1]} stroke="#9ABFCF" strokeWidth="0.6"/>
            <line x1={iso(wx1,RD,4.9)[0]} y1={iso(wx1,RD,4.9)[1]}
                  x2={iso(wx2,RD,4.9)[0]} y2={iso(wx2,RD,4.9)[1]} stroke="#9ABFCF" strokeWidth="0.6"/>
            {/* Sill */}
            <polygon points={P([wx1-0.1,RD,2.9],[wx2+0.1,RD,2.9],[wx2+0.1,RD,3.0],[wx1-0.1,RD,3.0])}
              fill="rgba(255,255,255,0.6)"/>
          </g>
        ))
      })()}
      {/* Door on north wall */}
      {door.wall === 'top' && (() => {
        const dx = Math.max(0, Math.min(RW-DOOR_FT, door.offset * (RW-DOOR_FT)))
        return <>
          <polygon points={P([dx,RD,0],[dx+DOOR_FT,RD,0],[dx+DOOR_FT,RD,DH],[dx,RD,DH])}
            fill="rgba(240,232,220,0.95)" stroke="#8B7355" strokeWidth="0.8"/>
          <polygon points={P([dx+DOOR_FT*0.08,RD,DH*0.08],[dx+DOOR_FT*0.92,RD,DH*0.08],[dx+DOOR_FT*0.92,RD,DH*0.52],[dx+DOOR_FT*0.08,RD,DH*0.52])}
            fill="none" stroke="#8B7355" strokeWidth="0.5" opacity="0.5"/>
          <polygon points={P([dx+DOOR_FT*0.08,RD,DH*0.56],[dx+DOOR_FT*0.92,RD,DH*0.56],[dx+DOOR_FT*0.92,RD,DH*0.92],[dx+DOOR_FT*0.08,RD,DH*0.92])}
            fill="none" stroke="#8B7355" strokeWidth="0.5" opacity="0.5"/>
          <circle cx={iso(dx+DOOR_FT*0.2,RD,DH*0.5)[0]} cy={iso(dx+DOOR_FT*0.2,RD,DH*0.5)[1]} r="2.5" fill="#B8860B"/>
        </>
      })()}

      {/* ── Ceiling light hint ── */}
      {(() => {
        const [cx2,cy2] = iso(RW/2, RD/2, RH)
        return <ellipse cx={cx2} cy={cy2} rx={S*3} ry={S*1.5} fill="url(#ceiling-light)"/>
      })()}

      {/* ── Ceiling light fixture (pendant) ── */}
      {(() => {
        const [px2,py2] = iso(RW/2, RD/2, RH)
        const [px3,py3] = iso(RW/2, RD/2, RH-1.2)
        return <>
          <line x1={px2} y1={py2} x2={px3} y2={py3} stroke="#888" strokeWidth="1"/>
          <ellipse cx={px3} cy={py3} rx={S*0.5} ry={S*0.25} fill="#F5E6A0" stroke="#AAA" strokeWidth="0.5"/>
          <ellipse cx={px3} cy={py3+3} rx={S*0.3} ry={S*0.12} fill="rgba(255,240,100,0.6)"/>
        </>
      })()}

      {/* ── Wall corner edge lines ── */}
      {/* Near-left vertical edge */}
      <line x1={iso(0,0,0)[0]} y1={iso(0,0,0)[1]} x2={iso(0,0,RH)[0]} y2={iso(0,0,RH)[1]} stroke="#A89D93" strokeWidth="1.2"/>
      {/* Near-right edge (floor only, wall not visible) */}
      <line x1={iso(RW,0,0)[0]} y1={iso(RW,0,0)[1]} x2={iso(0,0,0)[0]} y2={iso(0,0,0)[1]} stroke="#A89D93" strokeWidth="1.2"/>
      {/* Far right edge */}
      <line x1={iso(RW,RD,0)[0]} y1={iso(RW,RD,0)[1]} x2={iso(RW,RD,RH)[0]} y2={iso(RW,RD,RH)[1]} stroke="#A89D93" strokeWidth="1.2"/>
      {/* Ceiling edges */}
      <line x1={iso(0,0,RH)[0]} y1={iso(0,0,RH)[1]} x2={iso(RW,0,RH)[0]} y2={iso(RW,0,RH)[1]} stroke="#B8ADA0" strokeWidth="0.8"/>
      <line x1={iso(0,0,RH)[0]} y1={iso(0,0,RH)[1]} x2={iso(0,RD,RH)[0]} y2={iso(0,RD,RH)[1]} stroke="#B8ADA0" strokeWidth="0.8"/>
      <line x1={iso(RW,0,RH)[0]} y1={iso(RW,0,RH)[1]} x2={iso(RW,RD,RH)[0]} y2={iso(RW,RD,RH)[1]} stroke="#B8ADA0" strokeWidth="0.8"/>
      <line x1={iso(0,RD,RH)[0]} y1={iso(0,RD,RH)[1]} x2={iso(RW,RD,RH)[0]} y2={iso(RW,RD,RH)[1]} stroke="#B8ADA0" strokeWidth="0.8"/>

      {/* ── Furniture ── */}
      {sorted.map(item => {
        const { fx, fz } = roomPos(item)
        const { fw, fd, fh } = roomDims(item)
        const col    = item.colorOverride ?? item.catalogItem?.colorHex ?? '#A0826D'
        const front  = darken(col, 0.20)   // near-z face
        const side   = darken(col, 0.35)   // far-x face (right side from viewer)
        const top    = col
        const shadow = darken(col, 0.45)

        const x0 = Math.max(0.05, Math.min(RW - fw - 0.05, fx - fw / 2))
        const z0 = Math.max(0.05, Math.min(RD - fd - 0.05, fz - fd / 2))
        const x1 = x0 + fw, z1 = z0 + fd

        return (
          <g key={item.id}>
            {/* Floor shadow ellipse */}
            {(() => {
              const [scx,scy] = iso(x0+fw/2, z0+fd/2, 0)
              return <ellipse cx={scx} cy={scy} rx={S*fw*C30*0.9} ry={S*fd*S30*0.8}
                fill="rgba(0,0,0,0.13)" style={{filter:'blur(3px)'}}/>
            })()}

            {/* Front face (near-z edge) */}
            <polygon points={P([x0,z0,0],[x1,z0,0],[x1,z0,fh],[x0,z0,fh])}
              fill={front} stroke="rgba(0,0,0,0.12)" strokeWidth="0.5"/>
            {/* Edge highlight on front-top */}
            <polygon points={P([x0,z0,fh],[x1,z0,fh],[x1,z0,fh-0.08],[x0,z0,fh-0.08])}
              fill="rgba(255,255,255,0.2)" stroke="none"/>

            {/* Right side face (far-x edge) */}
            <polygon points={P([x1,z0,0],[x1,z1,0],[x1,z1,fh],[x1,z0,fh])}
              fill={side} stroke="rgba(0,0,0,0.12)" strokeWidth="0.5"/>

            {/* Top face */}
            <polygon points={P([x0,z0,fh],[x1,z0,fh],[x1,z1,fh],[x0,z1,fh])}
              fill={top} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/>
            {/* Top face gloss strip */}
            <polygon points={P([x0,z0,fh],[x1,z0,fh],[x1,z0+fd*0.2,fh],[x0,z0+fd*0.2,fh])}
              fill="rgba(255,255,255,0.18)" stroke="none"/>

            {/* Furniture-specific top detail */}
            {topDetail(item.catalogItem.icon, x0, z0, x1, z1, fh, col)}
          </g>
        )
      })}

      {/* ── Label ── */}
      {(() => {
        const [lx,ly] = iso(RW/2, 0, 0)
        return (
          <text x={lx} y={ly+20} textAnchor="middle" fontSize="11" fill="rgba(0,0,0,0.38)"
            style={{fontFamily:'DM Sans,sans-serif',fontWeight:500}}>
            {room.name} — {RW}×{RD} ft
          </text>
        )
      })()}
    </svg>
  )
}

// ── Send to Client modal ──────────────────────────────────────────────────────
// ── PDF export ────────────────────────────────────────────────────────────────
async function exportDesignPDF({ activeProject, activeRoom, dims, currentItems, totalValue, floors, activeFloorId }) {
  const fmt = n => '₹' + n.toLocaleString('en-IN')
  const date = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })

  const FPS = 8
  const FPWALL = 5
  const DOOR_W = Math.round(DOOR_FT * FPS)
  const activeFloor = floors.find(f => f.id === activeFloorId)
  const maxX = Math.max(...(activeFloor?.rooms ?? []).map(r => r.fx + r.dims.w * FPS)) + 40
  const maxY = Math.max(...(activeFloor?.rooms ?? []).map(r => r.fy + r.dims.d * FPS)) + 40

  const planSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${maxY}" style="background:#E8E4DA;border-radius:6px">
    ${(activeFloor?.rooms ?? []).map(rm => {
      const rw = Math.round(rm.dims.w * FPS), rh = Math.round(rm.dims.d * FPS)
      const d = rm.door ?? DEFAULT_DOOR
      const gx = FPWALL + Math.round(d.offset * (rw - FPWALL*2 - DOOR_W))
      const gy = FPWALL + Math.round(d.offset * (rh - FPWALL*2 - DOOR_W))
      const doorGap = d.wall==='bottom'||d.wall==='top'
        ? `<rect x="${gx}" y="${d.wall==='bottom'?rh-FPWALL:0}" width="${DOOR_W}" height="${FPWALL}" fill="#E8E4DA"/>`
        : `<rect x="${d.wall==='left'?0:rw-FPWALL}" y="${gy}" width="${FPWALL}" height="${DOOR_W}" fill="#E8E4DA"/>`
      return `
        <rect x="${rm.fx}" y="${rm.fy}" width="${rw}" height="${rh}" fill="#C5BAA6" rx="1"/>
        <rect x="${rm.fx+FPWALL}" y="${rm.fy+FPWALL}" width="${rw-FPWALL*2}" height="${rh-FPWALL*2}" fill="${rm.floorColor}" rx="1"/>
        ${doorGap.replace(/"/g, '"')}
        <text x="${rm.fx+FPWALL+3}" y="${rm.fy+FPWALL+10}" font-size="7" font-family="sans-serif" fill="#0F2340" font-weight="600">${rm.name}</text>
        <text x="${rm.fx+FPWALL+3}" y="${rm.fy+FPWALL+19}" font-size="5" font-family="sans-serif" fill="#777">${rm.dims.w}×${rm.dims.d}${rm.dims.unit}</text>
      `
    }).join('')}
  </svg>`

  const itemRows = currentItems.map(it => `
    <tr>
      <td style="padding:5px 8px;border-bottom:1px solid #f0f0f0">${it.catalogItem?.name ?? '—'}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #f0f0f0;color:#777">${it.catalogItem?.category ?? '—'}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #f0f0f0;color:#777">${it.catalogItem?.brand ?? '—'}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #f0f0f0;text-align:right;color:#1B4F8A;font-weight:600">${fmt(it.catalogItem?.price ?? 0)}</td>
    </tr>`).join('')

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;padding:40px;font-family:-apple-system,Segoe UI,sans-serif;color:#333;box-sizing:border-box'
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
      <div>
        <h1 style="font-size:22px;color:#0F2340;margin:0 0 4px;font-weight:700">Design Document</h1>
        <p style="color:#777;font-size:12px;margin:0">${activeProject} · ${activeRoom?.name ?? ''} · ${date}</p>
      </div>
      <div style="font-size:10px;color:#bbb;text-align:right">InteriorOS Design Studio</div>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:24px">
      ${[
        ['Room', activeRoom?.name ?? '—'],
        ['Size', `${dims.w}×${dims.d} ${dims.unit}`],
        ['Items', currentItems.length],
        ['Total Value', fmt(totalValue)],
      ].map(([label, val]) => `
        <div style="background:#f7f9fc;border:1px solid #e8e8e8;border-radius:8px;padding:10px 16px;min-width:120px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#999">${label}</div>
          <div style="font-size:15px;font-weight:700;color:#0F2340;margin-top:2px">${val}</div>
        </div>`).join('')}
    </div>

    <div style="margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#999;margin-bottom:10px">Floor Plan — ${activeFloor?.name ?? ''}</div>
      <div style="background:#e8e4da;border-radius:8px;padding:16px;display:inline-block">${planSVG}</div>
    </div>

    <div style="margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#999;margin-bottom:10px">Furniture Schedule</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:#0F2340">
          <th style="color:#fff;padding:7px 8px;text-align:left;font-size:10px;font-weight:600">Item</th>
          <th style="color:#fff;padding:7px 8px;text-align:left;font-size:10px;font-weight:600">Category</th>
          <th style="color:#fff;padding:7px 8px;text-align:left;font-size:10px;font-weight:600">Brand</th>
          <th style="color:#fff;padding:7px 8px;text-align:right;font-size:10px;font-weight:600">Price</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
        <tfoot><tr style="background:#f0f4f8">
          <td colspan="3" style="padding:6px 8px;border-top:2px solid #e0e0e0;font-weight:700;color:#0F2340">Total</td>
          <td style="padding:6px 8px;border-top:2px solid #e0e0e0;text-align:right;font-weight:700;color:#0F2340">${fmt(totalValue)}</td>
        </tr></tfoot>
      </table>
    </div>

    <div style="margin-top:32px;padding-top:12px;border-top:1px solid #eee;color:#bbb;font-size:10px;display:flex;justify-content:space-between">
      <span>Generated by InteriorOS Design Studio</span>
      <span>${date}</span>
    </div>
  `
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgH = (canvas.height * pageW) / canvas.width
    let remaining = imgH
    let yPos = 0
    pdf.addImage(imgData, 'PNG', 0, yPos, pageW, imgH)
    remaining -= pageH
    while (remaining > 0) {
      yPos -= pageH
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, yPos, pageW, imgH)
      remaining -= pageH
    }
    pdf.save(`Design_${activeProject}_${date}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}

// ── Send to Client modal ──────────────────────────────────────────────────────
function SendDesignModal({ projects, activeProject, floors, onClose, onSent }) {
  const [projectId,    setProjectId]    = useState(activeProject?.id ?? '')
  const [label,        setLabel]        = useState(`v${Date.now().toString().slice(-4)}`)
  const [notes,        setNotes]        = useState('')
  const [saving,       setSaving]       = useState(false)
  const [saveOnly,     setSaveOnly]     = useState(false)
  const [done,         setDone]         = useState(false)
  const [err,          setErr]          = useState('')

  async function submit(send) {
    if (!projectId || !label.trim()) { setErr('Project and version label are required'); return }
    setSaving(true); setSaveOnly(!send); setErr('')
    try {
      // Strip catalogItem from each placed item to keep payload compact
      const compactFloors = floors.map(fl => ({
        ...fl,
        rooms: fl.rooms.map(rm => ({
          ...rm,
          items: rm.items.map(it => ({
            id:it.id, cid:it.catalogItem.id, cx:it.cx, cy:it.cy,
            rotation:it.rotation??0, scale:it.scale??1, colorOverride:it.colorOverride??null,
          }))
        }))
      }))
      await saveStudioDesign({
        projectId,
        versionLabel: label.trim(),
        changes: notes.trim() ? [notes.trim()] : ['Studio design update'],
        studioData: { floors: compactFloors, savedAt: new Date().toISOString() },
        sendToClient: send,
      })
      setDone(true)
      setTimeout(() => { onSent(send); onClose() }, 1800)
    } catch (e) {
      setErr(e.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const inp = 'w-full px-3 py-2 text-[12px] border border-[#E0DAD0] rounded-lg outline-none focus:border-[#1B4F8A] bg-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] border border-[#EFEFEF]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2">
            <Save size={15} className="text-[#1B4F8A]"/>
            <h3 className="font-sora font-semibold text-[14px] text-[#0F2340]">Save / Send Design</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F0F2F5] text-[#999]"><X size={15}/></button>
        </div>
        {done ? (
          <div className="px-5 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-3">
              <Check size={22} className="text-[#15803d]"/>
            </div>
            <p className="font-semibold text-[14px] text-[#0F2340]">{saveOnly ? 'Design saved!' : 'Sent to client!'}</p>
            <p className="text-[12px] text-[#999] mt-1">
              {saveOnly ? 'Your design has been saved to the project.' : 'The client has been notified and can now review the design.'}
            </p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-[#AAA] uppercase tracking-wider mb-1.5">Project *</label>
              <select value={projectId} onChange={e=>setProjectId(e.target.value)} className={inp}>
                <option value="">— Select project —</option>
                {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#AAA] uppercase tracking-wider mb-1.5">Version Label *</label>
              <input type="text" value={label} onChange={e=>setLabel(e.target.value)}
                placeholder="e.g. v1.0 — Living Room" className={inp}/>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#AAA] uppercase tracking-wider mb-1.5">Notes for Client</label>
              <textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)}
                placeholder="Describe what changed or your design intent…"
                className={`${inp} resize-none`}/>
            </div>
            {err && <p className="text-[11px] text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={()=>submit(false)} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-[#DDD] rounded-xl text-[12px] font-medium text-[#555] hover:border-[#1B4F8A] hover:text-[#1B4F8A] disabled:opacity-50 transition-colors">
                <Save size={12}/> {saving&&!saveOnly ? '…' : 'Save'}
              </button>
              <button onClick={()=>submit(true)} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#1B4F8A] hover:bg-[#163f6e] rounded-xl text-[12px] font-semibold text-white disabled:opacity-50 transition-colors">
                <Send size={12}/> {saving&&saveOnly===false ? '…' : 'Send to Client'}
              </button>
            </div>
            <p className="text-[10px] text-[#CCC] text-center pb-1">
              "Send" notifies the client — they can view & comment in their portal
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Furniture SVG ─────────────────────────────────────────────────────────────
function FurnitureSVG({ icon, color, selected }) {
  const sc = selected ? '#1B4F8A' : 'rgba(0,0,0,0.32)'
  const sw = selected ? 2.5 : 1.4
  const lt = lighten(color, 0.38), lt2 = lighten(color, 0.60)
  const dk = darken(color, 0.28),  dk2 = darken(color, 0.48)
  const B = { width:'100%', height:'100%', viewBox:'0 0 100 100', preserveAspectRatio:'none' }
  const M = { width:'100%', height:'100%', viewBox:'0 0 100 100', preserveAspectRatio:'xMidYMid meet' }
  switch (icon) {
    case 'sofa': return <svg {...B}><rect x="5" y="35" width="90" height="58" rx="4" fill={color} stroke={sc} strokeWidth={sw}/><rect x="5" y="5" width="90" height="35" rx="4" fill={dk} stroke={sc} strokeWidth={sw}/><rect x="5" y="5" width="14" height="88" rx="4" fill={dk2} stroke={sc} strokeWidth={sw}/><rect x="81" y="5" width="14" height="88" rx="4" fill={dk2} stroke={sc} strokeWidth={sw}/><line x1="50" y1="35" x2="50" y2="93" stroke={sc} strokeWidth="1.2" opacity="0.45"/><rect x="21" y="38" width="25" height="12" rx="4" fill={lt} opacity="0.55"/><rect x="54" y="38" width="25" height="12" rx="4" fill={lt} opacity="0.55"/><rect x="21" y="76" width="25" height="6" rx="2" fill={dk} opacity="0.25"/><rect x="54" y="76" width="25" height="6" rx="2" fill={dk} opacity="0.25"/></svg>
    case 'chair': return <svg {...B}><rect x="10" y="5" width="80" height="28" rx="4" fill={dk} stroke={sc} strokeWidth={sw}/><rect x="10" y="30" width="80" height="55" rx="4" fill={color} stroke={sc} strokeWidth={sw}/><rect x="14" y="84" width="10" height="12" rx="2" fill={dk2}/><rect x="76" y="84" width="10" height="12" rx="2" fill={dk2}/><rect x="22" y="36" width="56" height="14" rx="3" fill={lt} opacity="0.45"/><line x1="10" y1="62" x2="90" y2="62" stroke={sc} strokeWidth="0.8" opacity="0.25"/></svg>
    case 'table': return <svg {...B}><rect x="8" y="8" width="84" height="84" rx="3" fill={lt} stroke={sc} strokeWidth={sw}/><line x1="8" y1="26" x2="92" y2="26" stroke={dk} strokeWidth="0.8" opacity="0.3"/><line x1="8" y1="44" x2="92" y2="44" stroke={dk} strokeWidth="0.8" opacity="0.3"/><line x1="8" y1="62" x2="92" y2="62" stroke={dk} strokeWidth="0.8" opacity="0.3"/><line x1="8" y1="80" x2="92" y2="80" stroke={dk} strokeWidth="0.8" opacity="0.3"/><rect x="8" y="8" width="14" height="14" rx="2" fill={dk2}/><rect x="78" y="8" width="14" height="14" rx="2" fill={dk2}/><rect x="8" y="78" width="14" height="14" rx="2" fill={dk2}/><rect x="78" y="78" width="14" height="14" rx="2" fill={dk2}/><rect x="8" y="8" width="84" height="84" rx="3" fill="none" stroke={sc} strokeWidth={sw}/></svg>
    case 'bed': return <svg {...B}><rect x="5" y="5" width="90" height="90" rx="3" fill={color} stroke={sc} strokeWidth={sw}/><rect x="5" y="5" width="90" height="30" rx="3" fill={dk2} stroke={sc} strokeWidth={sw}/><rect x="5" y="87" width="90" height="8" rx="2" fill={dk}/><rect x="10" y="32" width="80" height="54" rx="2" fill={lt2} stroke={sc} strokeWidth="1"/><rect x="14" y="9" width="30" height="17" rx="5" fill={lighten(color,0.7)} stroke={sc} strokeWidth="0.8"/><rect x="56" y="9" width="30" height="17" rx="5" fill={lighten(color,0.7)} stroke={sc} strokeWidth="0.8"/><line x1="50" y1="32" x2="50" y2="86" stroke={sc} strokeWidth="0.7" opacity="0.25"/></svg>
    case 'wardrobe': return <svg {...B}><rect x="5" y="5" width="90" height="90" rx="2" fill={color} stroke={sc} strokeWidth={sw}/><rect x="8" y="8" width="27" height="80" rx="2" fill={lt} stroke={sc} strokeWidth="1"/><rect x="37" y="8" width="26" height="80" rx="2" fill={lt} stroke={sc} strokeWidth="1"/><rect x="65" y="8" width="27" height="80" rx="2" fill={lt} stroke={sc} strokeWidth="1"/><circle cx="29" cy="48" r="3" fill={dk2}/><circle cx="55" cy="48" r="3" fill={dk2}/><circle cx="81" cy="48" r="3" fill={dk2}/><rect x="5" y="86" width="90" height="9" rx="1" fill={dk}/></svg>
    case 'tv': return <svg {...B}><rect x="5" y="42" width="90" height="53" rx="3" fill={color} stroke={sc} strokeWidth={sw}/><rect x="8" y="5" width="84" height="42" rx="2" fill={dk2} stroke={sc} strokeWidth="1.5"/><rect x="12" y="9" width="76" height="30" rx="1" fill="rgba(20,30,55,0.85)"/><rect x="14" y="11" width="72" height="26" rx="1" fill="rgba(50,70,120,0.35)"/><line x1="33" y1="42" x2="33" y2="95" stroke={sc} strokeWidth="0.9" opacity="0.35"/><line x1="67" y1="42" x2="67" y2="95" stroke={sc} strokeWidth="0.9" opacity="0.35"/><circle cx="90" cy="10" r="3" fill="rgba(0,220,100,0.8)"/></svg>
    case 'coffee': return <svg {...B}><rect x="10" y="20" width="80" height="60" rx="10" fill={lt} stroke={sc} strokeWidth={sw}/><rect x="14" y="24" width="72" height="52" rx="8" fill="none" stroke={dk} strokeWidth="1.2" opacity="0.45"/><rect x="18" y="72" width="10" height="14" rx="2" fill={dk2}/><rect x="72" y="72" width="10" height="14" rx="2" fill={dk2}/><rect x="18" y="14" width="10" height="12" rx="2" fill={dk2}/><rect x="72" y="14" width="10" height="12" rx="2" fill={dk2}/></svg>
    case 'shelf': return <svg {...B}><rect x="5" y="5" width="90" height="90" rx="2" fill={dk} stroke={sc} strokeWidth={sw}/><rect x="5" y="5" width="90" height="22" rx="2" fill={color}/><rect x="5" y="29" width="90" height="20" fill={color}/><rect x="5" y="51" width="90" height="20" fill={color}/><rect x="5" y="73" width="90" height="22" fill={color}/><rect x="5" y="27" width="90" height="3" fill={dk2}/><rect x="5" y="49" width="90" height="3" fill={dk2}/><rect x="5" y="71" width="90" height="3" fill={dk2}/><rect x="10" y="7" width="7" height="18" rx="1" fill="#C0392B" opacity="0.8"/><rect x="19" y="7" width="5" height="18" rx="1" fill="#2E86AB" opacity="0.8"/><rect x="26" y="7" width="8" height="18" rx="1" fill="#E07B20" opacity="0.8"/><rect x="10" y="31" width="6" height="16" rx="1" fill="#8E44AD" opacity="0.8"/><rect x="18" y="31" width="8" height="16" rx="1" fill="#2E86AB" opacity="0.8"/><rect x="5" y="5" width="5" height="90" rx="1" fill={dk2}/><rect x="90" y="5" width="5" height="90" rx="1" fill={dk2}/></svg>
    case 'desk': return <svg {...B}><rect x="5" y="5" width="90" height="58" rx="3" fill={color} stroke={sc} strokeWidth={sw}/><rect x="5" y="5" width="90" height="58" rx="3" fill={lt} opacity="0.4"/><rect x="68" y="63" width="27" height="28" rx="2" fill={color} stroke={sc} strokeWidth={sw}/><line x1="68" y1="77" x2="95" y2="77" stroke={sc} strokeWidth="0.9" opacity="0.35"/><rect x="76" y="68" width="12" height="4" rx="2" fill={dk2} opacity="0.55"/><rect x="76" y="80" width="12" height="4" rx="2" fill={dk2} opacity="0.55"/><rect x="8" y="58" width="10" height="14" rx="2" fill={dk2}/><rect x="54" y="58" width="10" height="14" rx="2" fill={dk2}/><rect x="18" y="9" width="40" height="26" rx="2" fill={dk2} opacity="0.5"/></svg>
    case 'lamp': return <svg {...M}><circle cx="50" cy="36" r="32" fill="rgba(255,220,60,0.07)"/><path d="M28 46 L40 20 L60 20 L72 46 Z" fill={color} stroke={sc} strokeWidth={sw}/><path d="M32 40 L42 22 L58 22 L68 40" fill={lt} opacity="0.4"/><circle cx="50" cy="20" r="5" fill="rgba(255,220,80,0.95)"/><line x1="50" y1="46" x2="50" y2="80" stroke={dk2} strokeWidth="3" strokeLinecap="round"/><ellipse cx="50" cy="83" rx="18" ry="6" fill={dk} stroke={sc} strokeWidth="1.2"/></svg>
    case 'pendant': return <svg {...M}><circle cx="50" cy="62" r="34" fill="rgba(255,220,60,0.06)"/><line x1="50" y1="5" x2="50" y2="44" stroke={dk2} strokeWidth="1.5"/><path d="M30 52 L36 44 L64 44 L70 52 Z" fill={color} stroke={sc} strokeWidth={sw}/><ellipse cx="50" cy="52" rx="20" ry="4" fill={dk} opacity="0.65"/><circle cx="50" cy="60" r="10" fill={color} stroke={sc} strokeWidth="1"/><circle cx="50" cy="60" r="6" fill="rgba(255,220,80,0.9)"/></svg>
    case 'side': return <svg {...B}><rect x="15" y="32" width="70" height="48" rx="3" fill={color} stroke={sc} strokeWidth={sw}/><rect x="15" y="32" width="70" height="8" rx="3" fill={lt} opacity="0.5"/><rect x="22" y="76" width="8" height="18" rx="2" fill={dk2}/><rect x="70" y="76" width="8" height="18" rx="2" fill={dk2}/><rect x="40" y="18" width="20" height="18" rx="2" fill={lighten(color,0.55)} stroke={sc} strokeWidth="1" opacity="0.9"/><circle cx="50" cy="15" r="4" fill="rgba(255,220,60,0.85)"/></svg>
    default: return <svg {...B}><rect x="8" y="8" width="84" height="84" rx="4" fill={color} stroke={sc} strokeWidth={sw}/><rect x="8" y="8" width="84" height="22" rx="4" fill={dk} opacity="0.55"/></svg>
  }
}

// ── Room canvas background ────────────────────────────────────────────────────
function RoomBackground({ w, h, floorColor, door = DEFAULT_DOOR }) {
  const T = WALL_T
  const wf = '#C5BAA6', ws = '#A8997F', win = '#B4CEDF'

  // Door geometry
  const DW = Math.round(DOOR_FT * ROOM_SCALE)   // door width in px
  const DA = Math.round(DOOR_FT * ROOM_SCALE)    // door swing arc radius

  function doorPath() {
    const wall = door.wall, off = door.offset
    if (wall === 'bottom') {
      const x0 = T + Math.round(off * (w - T*2 - DW))
      return {
        wallBefore: [0,   h-T, x0,      T],
        wallAfter:  [x0+DW, h-T, w-x0-DW, T],
        arc:  `M ${x0} ${h-T} L ${x0} ${h-T-DA} A ${DA} ${DA} 0 0 1 ${x0+DW} ${h-T}`,
      }
    }
    if (wall === 'top') {
      const x0 = T + Math.round(off * (w - T*2 - DW))
      return {
        wallBefore: [0,   0, x0,      T],
        wallAfter:  [x0+DW, 0, w-x0-DW, T],
        arc:  `M ${x0} ${T} L ${x0} ${T+DA} A ${DA} ${DA} 0 0 0 ${x0+DW} ${T}`,
      }
    }
    if (wall === 'left') {
      const y0 = T + Math.round(off * (h - T*2 - DW))
      return {
        wallBefore: [0, 0,    T, y0],
        wallAfter:  [0, y0+DW, T, h-y0-DW],
        arc:  `M ${T} ${y0} L ${T+DA} ${y0} A ${DA} ${DA} 0 0 0 ${T} ${y0+DW}`,
      }
    }
    // right wall
    const y0 = T + Math.round(off * (h - T*2 - DW))
    return {
      wallBefore: [w-T, 0,    T, y0],
      wallAfter:  [w-T, y0+DW, T, h-y0-DW],
      arc:  `M ${w-T} ${y0} L ${w-T-DA} ${y0} A ${DA} ${DA} 0 0 1 ${w-T} ${y0+DW}`,
    }
  }
  const { wallBefore: wb, wallAfter: wa, arc } = doorPath()
  const [wbx,wby,wbw,wbh] = wb
  const [wax,way,waw,wah] = wa

  return (
    <svg width={w} height={h} style={{ position:'absolute',inset:0,pointerEvents:'none',zIndex:0 }}>
      <rect x={T} y={T} width={w-T*2} height={h-T*2} fill={floorColor}/>
      {Array.from({length:8},(_,i) => <line key={i} x1={T} y1={T+i*(h-T*2)/8} x2={w-T} y2={T+i*(h-T*2)/8} stroke="rgba(0,0,0,0.04)" strokeWidth="0.8"/>)}

      {/* All four walls, but split the door wall */}
      {door.wall !== 'top'    && <rect x={0}   y={0}   width={w}  height={T}  fill={wf} stroke={ws} strokeWidth="0.5"/>}
      {door.wall !== 'bottom' && <rect x={0}   y={h-T} width={w}  height={T}  fill={wf} stroke={ws} strokeWidth="0.5"/>}
      {door.wall !== 'left'   && <rect x={0}   y={0}   width={T}  height={h}  fill={wf} stroke={ws} strokeWidth="0.5"/>}
      {door.wall !== 'right'  && <rect x={w-T} y={0}   width={T}  height={h}  fill={wf} stroke={ws} strokeWidth="0.5"/>}

      {/* Door wall split into before + after segments */}
      <rect x={wbx} y={wby} width={wbw} height={wbh} fill={wf} stroke={ws} strokeWidth="0.5"/>
      <rect x={wax} y={way} width={waw} height={wah} fill={wf} stroke={ws} strokeWidth="0.5"/>

      {/* Door arc */}
      <path d={arc} fill="rgba(255,248,240,0.22)" stroke="#8B7355" strokeWidth="1.5" strokeDasharray="5,3"/>

      {/* Windows */}
      <rect x={Math.min(130,w-50)} y={0} width={Math.min(100,w/3)} height={T} fill={win} opacity="0.85"/>
      {w > 400 && <rect x={Math.min(390,w-100)} y={0} width={80} height={T} fill={win} opacity="0.85"/>}

      {/* Scale */}
      <g opacity="0.4">
        <line x1={w-120} y1={h-5} x2={w-T} y2={h-5} stroke="#5C4F3D" strokeWidth="1"/>
        <line x1={w-120} y1={h-8} x2={w-120} y2={h-2} stroke="#5C4F3D" strokeWidth="1"/>
        <line x1={w-T}   y1={h-8} x2={w-T}   y2={h-2} stroke="#5C4F3D" strokeWidth="1"/>
        <text x={w-70} y={h-8} textAnchor="middle" fontSize="8" fill="#5C4F3D" style={{fontFamily:'DM Sans,sans-serif'}}>{Math.round(w/ROOM_SCALE)} ft</text>
      </g>
    </svg>
  )
}

// ── Mini floor plan (used in building view) ───────────────────────────────────
function MiniFloorPlan({ floor, width = 280, height = 110 }) {
  const S = 3.2
  return (
    <div style={{ width, height, position:'relative', background:'#D4C8B8', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
      <svg width={width} height={height} style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
        <defs><pattern id={`mg-${floor.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5"/>
        </pattern></defs>
        <rect width={width} height={height} fill={`url(#mg-${floor.id})`}/>
      </svg>
      {floor.rooms.map(rm => {
        const { rw, rh } = getFPRoomSize(rm.dims)
        const sw = Math.round(rw * S / FP_SCALE * 2), sh = Math.round(rh * S / FP_SCALE * 2)
        const sx = Math.round(rm.fx * S / FP_SCALE * 1.5) + 8, sy = Math.round(rm.fy * S / FP_SCALE * 1.5) + 8
        const W = 3
        return (
          <div key={rm.id} style={{ position:'absolute', left:sx, top:sy, width:sw, height:sh }}>
            <div style={{ position:'absolute', inset:0, background:'#C5BAA6', borderRadius:1 }}/>
            <div style={{ position:'absolute', inset:W, background:rm.floorColor, borderRadius:1 }}/>
            {rm.items.slice(0,10).map(it => {
              const { w: cw, h: ch } = getRoomCanvas(rm.dims)
              return <div key={it.id} style={{ position:'absolute',
                left: W + ((it.cx - WALL_T) / (cw - WALL_T*2)) * (sw - W*2) - 2,
                top:  W + ((it.cy - WALL_T) / (ch - WALL_T*2)) * (sh - W*2) - 1.5,
                width:Math.max(3,itemW(it)/cw*(sw-W*2)), height:Math.max(2,itemH(it)/ch*(sh-W*2)),
                background:it.colorOverride ?? it.catalogItem?.colorHex ?? '#A0826D',
                borderRadius:0.5, transform:`rotate(${it.rotation??0}deg)`, opacity:0.85,
              }}/>
            })}
            <p style={{ position:'absolute',left:W+2,top:W+1,fontSize:5,fontWeight:600,
              color:'rgba(0,0,0,0.5)',fontFamily:'DM Sans,sans-serif',lineHeight:1.2 }}>{rm.name}</p>
          </div>
        )
      })}
    </div>
  )
}

// ── Floor Plan Canvas (Sims-style top-down view) ──────────────────────────────
function FloorPlanCanvas({ floor, activeRoomId, onSelectRoom, onMoveRoom, onResizeRoom, onAddRoom, onEnterRoom, onRenameRoom }) {
  const [dragging,      setDragging]      = useState(null) // { type:'move'|'resize', roomId, ox,oy, edge? }
  const [hoverId,       setHoverId]       = useState(null)
  const [renamingId,    setRenamingId]    = useState(null)
  const [renameVal,     setRenameVal]     = useState('')
  const planRef = useRef(null)

  function startRename(e, rm) {
    e.stopPropagation()
    setRenamingId(rm.id)
    setRenameVal(rm.name)
  }
  function commitRename() {
    if (renameVal.trim()) onRenameRoom(renamingId, renameVal.trim())
    setRenamingId(null)
  }

  const getXY = e => {
    const r = planRef.current.getBoundingClientRect()
    return { mx: e.clientX - r.left, my: e.clientY - r.top }
  }
  const snap = v => Math.round(v / FP_SCALE) * FP_SCALE

  function startMove(e, roomId) {
    e.preventDefault(); e.stopPropagation()
    const rm = floor.rooms.find(r => r.id === roomId)
    const { mx, my } = getXY(e)
    setDragging({ type:'move', roomId, ox: mx - rm.fx, oy: my - rm.fy })
    onSelectRoom(roomId)
  }

  function startResize(e, roomId, edge) {
    e.preventDefault(); e.stopPropagation()
    const rm = floor.rooms.find(r => r.id === roomId)
    const { mx, my } = getXY(e)
    const { rw, rh } = getFPRoomSize(rm.dims)
    setDragging({ type:'resize', roomId, edge, ox:mx, oy:my, startW:rw, startH:rh,
      startFx:rm.fx, startFy:rm.fy, dims:rm.dims })
  }

  function onMouseMove(e) {
    if (!dragging) return
    const { mx, my } = getXY(e)
    const rm = floor.rooms.find(r => r.id === dragging.roomId)
    if (!rm) return

    if (dragging.type === 'move') {
      const nx = Math.max(0, Math.min(FP_W - 80, snap(mx - dragging.ox)))
      const ny = Math.max(0, Math.min(FP_H - 60, snap(my - dragging.oy)))
      onMoveRoom(dragging.roomId, nx, ny)
    } else {
      const dx = mx - dragging.ox, dy = my - dragging.oy
      const s = dragging.dims.unit === 'ft' ? FP_SCALE : FP_SCALE_M
      const edge = dragging.edge

      let newFx = dragging.startFx, newFy = dragging.startFy
      let newW = rm.dims.w, newD = rm.dims.d

      if (edge === 'right')  newW = Math.max(6, Math.round((dragging.startW + dx) / s))
      if (edge === 'bottom') newD = Math.max(4, Math.round((dragging.startH + dy) / s))
      if (edge === 'left')  { newW = Math.max(6, Math.round((dragging.startW - dx) / s)); newFx = Math.min(dragging.startFx + dragging.startW - newW*s, dragging.startFx + dragging.startW - 6*s) }
      if (edge === 'top')   { newD = Math.max(4, Math.round((dragging.startH - dy) / s)); newFy = Math.min(dragging.startFy + dragging.startH - newD*s, dragging.startFy + dragging.startH - 4*s) }

      onResizeRoom(dragging.roomId, newW, newD, newFx, newFy)
    }
  }

  const EDGE = 7 // resize handle size

  return (
    <div ref={planRef} className="relative rounded-2xl overflow-hidden border border-[#C5BAA6]/40 shadow-inner"
      style={{ width:FP_W, height:FP_H, background:'#E8E4DA', flexShrink:0,
        cursor: dragging ? (dragging.type==='move' ? 'grabbing' : 'nwse-resize') : 'default' }}
      onMouseMove={onMouseMove}
      onMouseUp={() => setDragging(null)}
      onMouseLeave={() => { setDragging(null); setHoverId(null) }}>

      {/* Grid */}
      <svg width={FP_W} height={FP_H} style={{ position:'absolute',inset:0,pointerEvents:'none',zIndex:0 }}>
        <defs><pattern id="fp-grid" width={FP_SCALE} height={FP_SCALE} patternUnits="userSpaceOnUse">
          <path d={`M ${FP_SCALE} 0 L 0 0 0 ${FP_SCALE}`} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="0.5"/>
        </pattern></defs>
        <rect width={FP_W} height={FP_H} fill="url(#fp-grid)"/>
        {/* Major grid every 5 ft */}
        {Array.from({length:Math.ceil(FP_W/(FP_SCALE*5))},(_,i) => (
          <line key={`gx${i}`} x1={(i+1)*FP_SCALE*5} y1={0} x2={(i+1)*FP_SCALE*5} y2={FP_H} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/>
        ))}
        {Array.from({length:Math.ceil(FP_H/(FP_SCALE*5))},(_,i) => (
          <line key={`gy${i}`} x1={0} y1={(i+1)*FP_SCALE*5} x2={FP_W} y2={(i+1)*FP_SCALE*5} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/>
        ))}
      </svg>

      {/* Compass */}
      <div style={{ position:'absolute', top:12, right:14, zIndex:10, pointerEvents:'none' }}>
        <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.75)',
          border:'1px solid rgba(0,0,0,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:10, fontWeight:700, color:'#C0392B', fontFamily:'DM Sans' }}>N</span>
        </div>
      </div>

      {/* Scale bar */}
      <div style={{ position:'absolute', bottom:12, right:14, zIndex:10, pointerEvents:'none',
        display:'flex', alignItems:'center', gap:4 }}>
        <div style={{ width:FP_SCALE*5, height:2, background:'#5C4F3D' }}/>
        <span style={{ fontSize:9, color:'#5C4F3D', fontFamily:'DM Sans,sans-serif' }}>5 ft</span>
      </div>

      {/* Rooms */}
      {floor.rooms.map(rm => {
        const { rw, rh } = getFPRoomSize(rm.dims)
        const isActive = rm.id === activeRoomId
        const isHover  = rm.id === hoverId
        const { w: cw, h: ch } = getRoomCanvas(rm.dims)
        const totalVal = rm.items.reduce((s,it) => s + (it.catalogItem?.price ?? 0), 0)

        return (
          <div key={rm.id} style={{ position:'absolute', left:rm.fx, top:rm.fy, width:rw, height:rh, zIndex: isActive ? 5 : 2 }}
            onMouseEnter={() => setHoverId(rm.id)}
            onMouseLeave={() => setHoverId(null)}>

            {/* Wall fill */}
            <div style={{ position:'absolute', inset:0, background:'#C5BAA6',
              borderRadius:2, boxShadow:'2px 3px 8px rgba(0,0,0,0.18)' }}/>
            {/* Floor fill */}
            <div style={{ position:'absolute', inset:FP_WALL, background:rm.floorColor, borderRadius:1 }}/>

            {/* Floor boards hint */}
            <svg style={{ position:'absolute', inset:FP_WALL, pointerEvents:'none' }} width={rw-FP_WALL*2} height={rh-FP_WALL*2}>
              {Array.from({length:6},(_,i) => <line key={i} x1={0} y1={i*(rh-FP_WALL*2)/6} x2={rw-FP_WALL*2} y2={i*(rh-FP_WALL*2)/6} stroke="rgba(0,0,0,0.04)" strokeWidth="0.6"/>)}
            </svg>

            {/* Furniture dots */}
            {rm.items.map(it => (
              <div key={it.id} style={{ position:'absolute',
                left:  FP_WALL + ((it.cx - WALL_T) / (cw - WALL_T*2)) * (rw - FP_WALL*2) - itemW(it)/cw*(rw-FP_WALL*2)/2,
                top:   FP_WALL + ((it.cy - WALL_T) / (ch - WALL_T*2)) * (rh - FP_WALL*2) - itemH(it)/ch*(rh-FP_WALL*2)/2,
                width: Math.max(5, itemW(it)/cw*(rw-FP_WALL*2)),
                height:Math.max(4, itemH(it)/ch*(rh-FP_WALL*2)),
                background:it.colorOverride ?? it.catalogItem?.colorHex ?? '#A0826D',
                borderRadius:1, transform:`rotate(${it.rotation??0}deg)`, opacity:0.88,
              }}/>
            ))}

            {/* Room label — click name to rename */}
            <div style={{ position:'absolute', left:FP_WALL+5, top:FP_WALL+4, zIndex:7, maxWidth: rw - FP_WALL*2 - 10 }}>
              {renamingId === rm.id ? (
                <input
                  autoFocus
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null) }}
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  style={{
                    fontSize: Math.min(11, rw/10), fontWeight: 700, color: '#0F2340',
                    fontFamily: 'Sora,sans-serif', background: 'rgba(255,255,255,0.92)',
                    border: '1.5px solid #1B4F8A', borderRadius: 4, padding: '1px 4px',
                    outline: 'none', width: Math.min(rw - FP_WALL*2 - 14, 120),
                  }}
                />
              ) : (
                <p
                  onClick={e => { e.stopPropagation(); onSelectRoom(rm.id); startRename(e, rm) }}
                  title="Click to rename"
                  style={{ fontSize: Math.min(11, rw/10), fontWeight: 700, color: '#0F2340',
                    fontFamily: 'Sora,sans-serif', lineHeight: 1.2, cursor: 'text',
                    textShadow: '0 1px 2px rgba(255,255,255,0.6)',
                    borderBottom: (isActive || isHover) ? '1px dashed rgba(27,79,138,0.4)' : '1px dashed transparent',
                    display: 'inline-block', transition: 'border-color 0.15s',
                  }}>
                  {rm.name}
                </p>
              )}
              <p style={{ fontSize: Math.min(9, rw/13), color: 'rgba(0,0,0,0.45)', fontFamily: 'DM Sans,sans-serif', pointerEvents:'none' }}>
                {rm.dims.w}×{rm.dims.d} {rm.dims.unit}
              </p>
              {rm.items.length > 0 && (
                <p style={{ fontSize: Math.min(8, rw/15), color: '#1B4F8A', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, pointerEvents:'none' }}>
                  {rm.items.length} items
                </p>
              )}
            </div>

            {/* Dynamic door on correct wall */}
            {(() => {
              const d = rm.door ?? DEFAULT_DOOR
              const DW = Math.round(DOOR_FT * FP_SCALE)  // door width in fp pixels
              const BG = '#E8E4DA'                        // floor plan background colour
              const arcStroke = '#8B7355'

              if (d.wall === 'bottom' && rh > 40 && rw > DW + FP_WALL*2) {
                const gx = FP_WALL + Math.round(d.offset * (rw - FP_WALL*2 - DW))
                return <>
                  {/* Gap in bottom wall */}
                  <div style={{ position:'absolute', bottom:0, left:gx, width:DW, height:FP_WALL, background:BG }}/>
                  {/* Door swing arc */}
                  <svg style={{ position:'absolute', bottom:FP_WALL, left:gx, overflow:'visible', pointerEvents:'none' }} width={DW} height={DW}>
                    <path d={`M 0 0 L 0 ${-DW} A ${DW} ${DW} 0 0 1 ${DW} 0`}
                      fill="rgba(255,248,230,0.45)" stroke={arcStroke} strokeWidth="0.9" strokeDasharray="3,2"/>
                    <line x1={0} y1={0} x2={DW} y2={0} stroke={arcStroke} strokeWidth="1.2"/>
                  </svg>
                </>
              }
              if (d.wall === 'top' && rh > 40 && rw > DW + FP_WALL*2) {
                const gx = FP_WALL + Math.round(d.offset * (rw - FP_WALL*2 - DW))
                return <>
                  <div style={{ position:'absolute', top:0, left:gx, width:DW, height:FP_WALL, background:BG }}/>
                  <svg style={{ position:'absolute', top:FP_WALL, left:gx, overflow:'visible', pointerEvents:'none' }} width={DW} height={DW}>
                    <path d={`M 0 0 L 0 ${DW} A ${DW} ${DW} 0 0 0 ${DW} 0`}
                      fill="rgba(255,248,230,0.45)" stroke={arcStroke} strokeWidth="0.9" strokeDasharray="3,2"/>
                    <line x1={0} y1={0} x2={DW} y2={0} stroke={arcStroke} strokeWidth="1.2"/>
                  </svg>
                </>
              }
              if (d.wall === 'left' && rw > 40 && rh > DW + FP_WALL*2) {
                const gy = FP_WALL + Math.round(d.offset * (rh - FP_WALL*2 - DW))
                return <>
                  <div style={{ position:'absolute', top:gy, left:0, width:FP_WALL, height:DW, background:BG }}/>
                  <svg style={{ position:'absolute', top:gy, left:FP_WALL, overflow:'visible', pointerEvents:'none' }} width={DW} height={DW}>
                    <path d={`M 0 0 L ${-DW} 0 A ${DW} ${DW} 0 0 0 0 ${DW}`}
                      fill="rgba(255,248,230,0.45)" stroke={arcStroke} strokeWidth="0.9" strokeDasharray="3,2"/>
                    <line x1={0} y1={0} x2={0} y2={DW} stroke={arcStroke} strokeWidth="1.2"/>
                  </svg>
                </>
              }
              if (d.wall === 'right' && rw > 40 && rh > DW + FP_WALL*2) {
                const gy = FP_WALL + Math.round(d.offset * (rh - FP_WALL*2 - DW))
                return <>
                  <div style={{ position:'absolute', top:gy, right:0, width:FP_WALL, height:DW, background:BG }}/>
                  <svg style={{ position:'absolute', top:gy, right:FP_WALL, overflow:'visible', pointerEvents:'none' }} width={DW} height={DW}>
                    <path d={`M ${DW} 0 L ${DW*2} 0 A ${DW} ${DW} 0 0 1 ${DW} ${DW}`}
                      fill="rgba(255,248,230,0.45)" stroke={arcStroke} strokeWidth="0.9" strokeDasharray="3,2"/>
                    <line x1={DW} y1={0} x2={DW} y2={DW} stroke={arcStroke} strokeWidth="1.2"/>
                  </svg>
                </>
              }
              return null
            })()}

            {/* Selection / hover border */}
            <div style={{ position:'absolute', inset:0,
              border: isActive ? '2px solid #1B4F8A' : isHover ? '2px solid #2E6DA4' : '2px solid transparent',
              borderRadius:2, pointerEvents:'none', transition:'border-color 0.15s' }}/>

            {/* Drag area (move) */}
            <div style={{ position:'absolute', inset:EDGE, cursor:'grab', zIndex:3 }}
              onMouseDown={e => startMove(e, rm.id)}
              onDoubleClick={() => { onSelectRoom(rm.id); onEnterRoom() }}/>

            {/* Resize handles – right edge */}
            <div style={{ position:'absolute', right:0, top:EDGE, bottom:EDGE, width:EDGE, cursor:'ew-resize', zIndex:4 }}
              onMouseDown={e => startResize(e, rm.id, 'right')}/>
            {/* bottom edge */}
            <div style={{ position:'absolute', bottom:0, left:EDGE, right:EDGE, height:EDGE, cursor:'ns-resize', zIndex:4 }}
              onMouseDown={e => startResize(e, rm.id, 'bottom')}/>
            {/* left edge */}
            <div style={{ position:'absolute', left:0, top:EDGE, bottom:EDGE, width:EDGE, cursor:'ew-resize', zIndex:4 }}
              onMouseDown={e => startResize(e, rm.id, 'left')}/>
            {/* top edge */}
            <div style={{ position:'absolute', top:0, left:EDGE, right:EDGE, height:EDGE, cursor:'ns-resize', zIndex:4 }}
              onMouseDown={e => startResize(e, rm.id, 'top')}/>

            {/* Enter room button on hover */}
            {(isActive || isHover) && rw > 80 && rh > 60 && (
              <button
                onClick={() => { onSelectRoom(rm.id); onEnterRoom() }}
                style={{ position:'absolute', bottom:FP_WALL+6, right:6, zIndex:6,
                  fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:4,
                  background:'#1B4F8A', color:'#fff', border:'none', cursor:'pointer',
                  fontFamily:'DM Sans,sans-serif', boxShadow:'0 1px 4px rgba(0,0,0,0.25)' }}>
                Furnish →
              </button>
            )}
          </div>
        )
      })}

      {/* Add room hint */}
      <div style={{ position:'absolute', bottom:14, left:14, zIndex:10 }}>
        <button onClick={onAddRoom}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px',
            background:'rgba(27,79,138,0.88)', color:'#fff', border:'none', borderRadius:10,
            fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif',
            boxShadow:'0 2px 8px rgba(27,79,138,0.35)', backdropFilter:'blur(4px)' }}>
          + Add Room
        </button>
      </div>
      <div style={{ position:'absolute', bottom:14, left:130, zIndex:10, pointerEvents:'none' }}>
        <p style={{ fontSize:9, color:'rgba(0,0,0,0.4)', fontFamily:'DM Sans,sans-serif' }}>
          Drag to move · Drag edges to resize · Double-click to furnish
        </p>
      </div>
    </div>
  )
}

// ── Building overview ─────────────────────────────────────────────────────────
function BuildingView({ floors, activeFloorId, onSelectFloor, onAddFloor, onGoToFloor }) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-sora font-bold text-[18px] text-[#0F2340]">Building Overview</h2>
          <p className="text-[12px] text-[#999] mt-0.5">{floors.length} floor{floors.length!==1?'s':''} · click a floor to explore it</p>
        </div>
        <button onClick={onAddFloor}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F2340] text-white rounded-xl text-[12px] font-semibold hover:bg-[#1B4F8A] transition-colors">
          <Plus size={13}/> Add Floor
        </button>
      </div>

      <div className="space-y-2 max-w-5xl">
        {[...floors].reverse().map((fl, rfi) => {
          const fi = floors.length - 1 - rfi
          const isActive = fl.id === activeFloorId
          const totalItems = fl.rooms.reduce((s,r) => s+r.items.length, 0)
          const totalVal   = fl.rooms.reduce((s,r) => s+r.items.reduce((rs,it) => rs+(it.catalogItem?.price??0),0), 0)
          return (
            <div key={fl.id}
              onClick={() => { onSelectFloor(fl.id); onGoToFloor() }}
              className={['rounded-2xl border-2 bg-white overflow-hidden cursor-pointer transition-all hover:shadow-lg',
                isActive ? 'border-[#1B4F8A] shadow-md' : 'border-[#E8E2DA] hover:border-[#1B4F8A]/40'].join(' ')}>
              <div className="flex items-stretch">
                {/* Floor number tab */}
                <div className={['w-16 flex flex-col items-center justify-center shrink-0 gap-1',
                  isActive ? 'bg-[#1B4F8A]' : 'bg-[#F4F0EA]'].join(' ')}>
                  <span className={['font-sora font-bold text-[22px]',
                    isActive ? 'text-white' : 'text-[#0F2340]'].join(' ')}>{fi+1}</span>
                  <span className={['text-[9px] font-semibold uppercase tracking-wider',
                    isActive ? 'text-white/70' : 'text-[#999]'].join(' ')}>
                    {fi===0?'GF':fi===1?'FF':fi===2?'SF':'UF'}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 px-5 py-4">
                  <p className="font-sora font-semibold text-[14px] text-[#0F2340]">{fl.name}</p>
                  <p className="text-[11px] text-[#999] mt-0.5">
                    {fl.rooms.length} rooms · {totalItems} items{totalVal>0?` · ${fmt(totalVal)}`:''}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {fl.rooms.map(rm => (
                      <span key={rm.id} style={{ background:rm.floorColor }}
                        className="text-[10px] px-2 py-0.5 rounded-md text-[#333] font-medium border border-[#00000010]">
                        {rm.name} ({rm.dims.w}×{rm.dims.d})
                      </span>
                    ))}
                  </div>
                </div>
                {/* Mini floor plan */}
                <div className="pr-5 flex items-center">
                  <MiniFloorPlan floor={fl} width={280} height={100}/>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Initial project data ──────────────────────────────────────────────────────
const DEFAULT_DOOR = { wall:'bottom', offset:0.35 }

const INIT_FLOORS = [
  {
    id:'fl-1', name:'Ground Floor',
    rooms:[
      { id:'rm-1', name:'Living Room',    floorColor:'#F0E8DA', dims:{w:18,d:14,unit:'ft'}, items:[], fx:20,  fy:30,  door:{wall:'bottom',offset:0.35} },
      { id:'rm-2', name:'Master Bedroom', floorColor:'#EAE5DF', dims:{w:14,d:12,unit:'ft'}, items:[], fx:274, fy:30,  door:{wall:'bottom',offset:0.4}  },
      { id:'rm-3', name:'Kitchen',        floorColor:'#F5F4EE', dims:{w:12,d:10,unit:'ft'}, items:[], fx:20,  fy:228, door:{wall:'right', offset:0.5}  },
      { id:'rm-4', name:'Bathroom',       floorColor:'#E8F0F5', dims:{w:8, d:8, unit:'ft'}, items:[], fx:190, fy:228, door:{wall:'top',   offset:0.4}  },
    ],
  },
  {
    id:'fl-2', name:'First Floor',
    rooms:[
      { id:'rm-5', name:'Study Room',  floorColor:'#EDE8E0', dims:{w:12,d:10,unit:'ft'}, items:[], fx:20,  fy:30, door:{wall:'bottom',offset:0.4} },
      { id:'rm-6', name:'Guest Room',  floorColor:'#EAE5DF', dims:{w:14,d:12,unit:'ft'}, items:[], fx:192, fy:30, door:{wall:'bottom',offset:0.35} },
    ],
  },
]

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DesignerStudio() {
  const [furnitureCatalog, setFurnitureCatalog] = useState([])
  const [designerProjects, setDesignerProjects] = useState([])
  const [floors,         setFloors]         = useState(INIT_FLOORS)
  const [activeFloorId,  setActiveFloorId]  = useState('fl-1')
  const [activeRoomId,   setActiveRoomId]   = useState('rm-1')
  const [studioView,     setStudioView]     = useState('floor')   // 'room'|'floor'|'building'
  const [selectedId,     setSelectedId]     = useState(null)
  const [dragging,       setDragging]       = useState(null)
  const [view,           setView]           = useState('after')
  const [showGrid,       setShowGrid]       = useState(true)
  const [catFilter,      setCatFilter]      = useState('All')
  const [projOpen,       setProjOpen]       = useState(false)
  const [activeProject,  setActiveProject]  = useState('')
  const [activeProjectId,setActiveProjectId]= useState('')
  const [editingRoomId,  setEditingRoomId]  = useState(null)
  const [editRoomName,   setEditRoomName]   = useState('')
  const [roomViewMode,   setRoomViewMode]   = useState('top')  // 'top' | 'elevation'
  const [elevDir,        setElevDir]        = useState('south')
  const [showSendModal,  setShowSendModal]  = useState(false)
  const [saveStatus,     setSaveStatus]     = useState('')     // '' | 'saving' | 'saved' | 'error'
  const canvasRef = useRef(null)
  const CATS = ['All','Seating','Dining','Bedroom','Storage','Living','Lighting','Office']

  useEffect(() => {
    // Load catalog first, then project + saved design (so we can hydrate items)
    getFurniture().then(items => {
      const cat = items.map((item,idx) => ({
        ...item, id:idx+1, icon:item.iconKey??'sofa', colorHex:item.colorHex??'#D6C4A8',
      }))
      setFurnitureCatalog(cat)

      getProjects().then(ps => {
        const rows = ps.map(projectToRow)
        setDesignerProjects(rows)
        if (!rows.length) return
        setActiveProject(rows[0].name)
        setActiveProjectId(rows[0].id)

        // Load saved design and hydrate compact items with catalog data
        getLatestStudioDesign(rows[0].id).then(v => {
          if (!v?.studioData?.floors) return
          const hydratedFloors = v.studioData.floors.map(fl => ({
            ...fl,
            door: fl.door ?? DEFAULT_DOOR,
            rooms: (fl.rooms ?? []).map(rm => ({
              ...rm,
              door: rm.door ?? DEFAULT_DOOR,
              items: (rm.items ?? []).map(it => {
                const catalogItem = cat.find(c => c.id === (it.cid ?? it.catalogItem?.id))
                if (!catalogItem) return null
                return { ...it, catalogItem }
              }).filter(Boolean),
            }))
          }))
          setFloors(hydratedFloors)
          // Restore active floor/room from saved data
          const firstFloor = hydratedFloors[0]
          if (firstFloor) {
            setActiveFloorId(firstFloor.id)
            const firstRoom = firstFloor.rooms[0]
            if (firstRoom) setActiveRoomId(firstRoom.id)
          }
        }).catch(() => {})
      }).catch(console.error)
    }).catch(console.error)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return
      if (!selectedId) return
      if (e.key==='r'||e.key==='R') { e.preventDefault(); rotateItem(selectedId,1) }
      if (e.key==='Delete'||e.key==='Backspace') { e.preventDefault(); removeSelected() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, activeFloorId, activeRoomId])

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeFloor  = useMemo(() => floors.find(f=>f.id===activeFloorId), [floors,activeFloorId])
  const activeRoom   = useMemo(() => activeFloor?.rooms.find(r=>r.id===activeRoomId), [activeFloor,activeRoomId])
  const currentItems = activeRoom?.items ?? []
  const selectedItem = currentItems.find(i=>i.id===selectedId) ?? null
  const totalValue   = currentItems.reduce((s,i)=>s+(i.catalogItem?.price??0),0)
  const dims         = activeRoom?.dims ?? {w:14,d:12,unit:'ft'}
  const { w: CW, h: CH } = getRoomCanvas(dims)
  const floorColor   = activeRoom?.floorColor ?? '#F0E8DA'
  const getItemColor = it => it.colorOverride ?? it.catalogItem?.colorHex ?? '#D6C4A8'
  const catalogItems = catFilter==='All' ? furnitureCatalog : furnitureCatalog.filter(i=>i.category===catFilter)

  // ── Setters ───────────────────────────────────────────────────────────────
  function updateRoomItems(newItems) {
    setFloors(prev => prev.map(fl => fl.id!==activeFloorId ? fl : { ...fl,
      rooms: fl.rooms.map(rm => rm.id!==activeRoomId ? rm : { ...rm, items:newItems })
    }))
  }
  function rotateItem(id,dir=1) {
    updateRoomItems(currentItems.map(it => it.id!==id ? it : { ...it, rotation:((it.rotation??0)+dir*90+360)%360 }))
  }
  function scaleItem(id,s) {
    updateRoomItems(currentItems.map(it => it.id!==id ? it : { ...it, scale:Math.max(0.4,Math.min(2.5,s)) }))
  }
  function setItemColor(id,hex) {
    updateRoomItems(currentItems.map(it => it.id!==id ? it : { ...it, colorOverride:hex }))
  }
  function removeSelected() { updateRoomItems(currentItems.filter(i=>i.id!==selectedId)); setSelectedId(null) }
  function clearAll() { updateRoomItems([]); setSelectedId(null); setDragging(null) }

  function updateDims(key,val) {
    setFloors(prev => prev.map(fl => fl.id!==activeFloorId ? fl : { ...fl,
      rooms: fl.rooms.map(rm => {
        if (rm.id!==activeRoomId) return rm
        const newDims = { ...rm.dims, [key]:val }
        const { w:cw, h:ch } = getRoomCanvas(newDims)
        const clampedItems = rm.items.map(it => ({
          ...it,
          cx: Math.max(WALL_T+itemW(it)/2, Math.min(cw-WALL_T-itemW(it)/2, it.cx)),
          cy: Math.max(WALL_T+itemH(it)/2, Math.min(ch-WALL_T-itemH(it)/2, it.cy)),
        }))
        return { ...rm, dims:newDims, items:clampedItems }
      })
    }))
  }
  function updateFloorColor(hex) {
    setFloors(prev => prev.map(fl => fl.id!==activeFloorId ? fl : { ...fl,
      rooms: fl.rooms.map(rm => rm.id!==activeRoomId ? rm : { ...rm, floorColor:hex })
    }))
  }

  function addToCanvas(ci) {
    const item = { id:nextId(), catalogItem:ci, cx:CW/2, cy:CH/2, rotation:0, scale:1.0, colorOverride:null }
    updateRoomItems([...currentItems, item])
    setSelectedId(item.id)
  }

  function addRoom() {
    const fx = Math.min(FP_W-200, (activeFloor?.rooms.length??0) * (14*14+10) + 20)
    const newRoom = { id:`rm-${Date.now()}`, name:`Room ${(activeFloor?.rooms.length??0)+1}`,
      floorColor:'#F0E8DA', dims:{w:12,d:10,unit:'ft'}, items:[], fx, fy:30 }
    setFloors(prev => prev.map(fl => fl.id!==activeFloorId ? fl : { ...fl, rooms:[...fl.rooms,newRoom] }))
    setActiveRoomId(newRoom.id)
  }

  function addFloor() {
    const newFloor = { id:`fl-${Date.now()}`, name:`Floor ${floors.length+1}`,
      rooms:[{ id:`rm-${Date.now()}-1`, name:'Room 1', floorColor:'#F0E8DA', dims:{w:14,d:12,unit:'ft'}, items:[], fx:20, fy:30 }] }
    setFloors(prev => [...prev, newFloor])
    setActiveFloorId(newFloor.id)
    setActiveRoomId(newFloor.rooms[0].id)
  }

  function moveRoom(roomId, fx, fy) {
    setFloors(prev => prev.map(fl => fl.id!==activeFloorId ? fl : { ...fl,
      rooms: fl.rooms.map(rm => rm.id!==roomId ? rm : { ...rm, fx, fy })
    }))
  }

  function resizeRoom(roomId, newW, newD, fx, fy) {
    setFloors(prev => prev.map(fl => fl.id!==activeFloorId ? fl : { ...fl,
      rooms: fl.rooms.map(rm => {
        if (rm.id!==roomId) return rm
        const newDims = { ...rm.dims, w:newW, d:newD }
        const { w:cw, h:ch } = getRoomCanvas(newDims)
        const clampedItems = rm.items.map(it => ({
          ...it,
          cx: Math.max(WALL_T+itemW(it)/2, Math.min(cw-WALL_T-itemW(it)/2, it.cx)),
          cy: Math.max(WALL_T+itemH(it)/2, Math.min(ch-WALL_T-itemH(it)/2, it.cy)),
        }))
        return { ...rm, dims:newDims, fx, fy, items:clampedItems }
      })
    }))
  }

  function renameRoom(roomId,name) {
    setFloors(prev => prev.map(fl => fl.id!==activeFloorId ? fl : { ...fl,
      rooms: fl.rooms.map(rm => rm.id!==roomId ? rm : { ...rm, name })
    }))
  }

  function updateDoor(roomId, patch) {
    setFloors(prev => prev.map(fl => fl.id!==activeFloorId ? fl : { ...fl,
      rooms: fl.rooms.map(rm => rm.id!==roomId ? rm : {
        ...rm, door: { ...(rm.door ?? DEFAULT_DOOR), ...patch }
      })
    }))
  }

  async function quickSave() {
    if (!activeProjectId) { setSaveStatus('error'); setTimeout(()=>setSaveStatus(''),2000); return }
    setSaveStatus('saving')
    try {
      const compactFloors = floors.map(fl => ({
        ...fl,
        rooms: fl.rooms.map(rm => ({
          ...rm,
          items: rm.items.map(it => ({
            id:it.id, cid:it.catalogItem.id, cx:it.cx, cy:it.cy,
            rotation:it.rotation??0, scale:it.scale??1, colorOverride:it.colorOverride??null,
          }))
        }))
      }))
      await saveStudioDesign({
        projectId: activeProjectId,
        versionLabel: `autosave-${new Date().toISOString().slice(0,10)}`,
        changes: ['Auto-saved from Design Studio'],
        studioData: { floors: compactFloors, savedAt: new Date().toISOString() },
        sendToClient: false,
      })
      setSaveStatus('saved')
    } catch { setSaveStatus('error') }
    setTimeout(()=>setSaveStatus(''),2500)
  }

  // ── Canvas mouse (room view) ──────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX-rect.left, my = e.clientY-rect.top
    for (let i = currentItems.length-1; i>=0; i--) {
      const it = currentItems[i]
      if (hitTest(mx,my,it)) {
        setSelectedId(it.id)
        setDragging({ id:it.id, ocx:mx-it.cx, ocy:my-it.cy })
        e.preventDefault(); return
      }
    }
    setSelectedId(null)
  }, [currentItems])

  const onMouseMove = useCallback((e) => {
    if (!dragging) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX-rect.left, my = e.clientY-rect.top
    setFloors(prev => prev.map(fl => fl.id!==activeFloorId ? fl : { ...fl,
      rooms: fl.rooms.map(rm => rm.id!==activeRoomId ? rm : { ...rm,
        items: rm.items.map(it => {
          if (it.id!==dragging.id) return it
          const w=itemW(it),h=itemH(it)
          return { ...it,
            cx:Math.max(WALL_T+w/2, Math.min(CW-WALL_T-w/2, mx-dragging.ocx)),
            cy:Math.max(WALL_T+h/2, Math.min(CH-WALL_T-h/2, my-dragging.ocy)),
          }
        })
      })
    }))
  }, [dragging, activeFloorId, activeRoomId, CW, CH])

  const onMouseUp = useCallback(() => setDragging(null), [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-60px)] overflow-hidden flex flex-col bg-[#EEEAE4]">

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-[#E0DAD0] px-3 py-2 flex items-center gap-2 flex-wrap">

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#0F2340] flex items-center justify-center">
            <PenTool size={14} className="text-white"/>
          </div>
          <span className="font-sora font-semibold text-[13px] text-[#0F2340] hidden sm:block">Design Studio</span>
        </div>
        <div className="w-px h-5 bg-[#E0DAD0] shrink-0"/>

        {/* View tabs */}
        <div className="flex items-center gap-0.5 bg-[#F4F1EC] border border-[#DDD] rounded-lg p-0.5 shrink-0">
          {[['floor','Floor Plan',Home],['building','Building',Building2]].map(([v,lbl,Icon])=>(
            <button key={v} onClick={()=>setStudioView(v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${studioView===v?'bg-[#0F2340] text-white':'text-[#777] hover:text-[#333]'}`}>
              <Icon size={11}/>{lbl}
            </button>
          ))}
          {studioView==='room' && (
            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-[#1B4F8A] text-white">
              <Maximize2 size={11}/> Room
            </button>
          )}
        </div>

        {/* Back to floor plan (room view only) */}
        {studioView==='room' && (
          <button onClick={()=>setStudioView('floor')}
            className="flex items-center gap-1 px-2 py-1.5 border border-[#DDD] rounded-lg text-[11px] text-[#555] hover:border-[#1B4F8A] hover:text-[#1B4F8A] transition-colors shrink-0">
            <ChevronLeft size={12}/> Floor Plan
          </button>
        )}

        <div className="w-px h-5 bg-[#E0DAD0] shrink-0"/>

        {/* Floor selector */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-[#999]">Floor:</span>
          <select value={activeFloorId}
            onChange={e=>{ setActiveFloorId(e.target.value); setActiveRoomId(floors.find(f=>f.id===e.target.value)?.rooms[0]?.id??'') }}
            className="text-[11px] border border-[#DDD] rounded-md px-1.5 py-1 bg-white text-[#333] outline-none focus:border-[#1B4F8A]">
            {floors.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        {/* Room tabs */}
        <div className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1">
          {(activeFloor?.rooms??[]).map(rm=>{
            const isActiveTab = activeRoomId === rm.id
            return (
              <div key={rm.id} className="flex items-center shrink-0">
                {editingRoomId === rm.id ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#D6E8F7]">
                    <input autoFocus value={editRoomName}
                      onChange={e=>setEditRoomName(e.target.value)}
                      onBlur={()=>{if(editRoomName.trim())renameRoom(rm.id,editRoomName.trim());setEditingRoomId(null)}}
                      onKeyDown={e=>{if(e.key==='Enter'){if(editRoomName.trim())renameRoom(rm.id,editRoomName.trim());setEditingRoomId(null)};if(e.key==='Escape')setEditingRoomId(null)}}
                      onClick={e=>e.stopPropagation()}
                      className="text-[11px] font-medium border-b border-[#1B4F8A] bg-transparent outline-none w-24 text-[#1B4F8A]"/>
                    <button onClick={()=>{if(editRoomName.trim())renameRoom(rm.id,editRoomName.trim());setEditingRoomId(null)}}
                      className="text-[#1B4F8A] hover:text-[#0F2340]"><Check size={11}/></button>
                  </div>
                ) : (
                  <button
                    onClick={()=>{setActiveRoomId(rm.id); if(studioView==='building') setStudioView('floor')}}
                    className={['flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap',
                      isActiveTab&&studioView==='room'?'bg-[#0F2340] text-white':
                      isActiveTab?'bg-[#D6E8F7] text-[#1B4F8A]':'text-[#555] hover:bg-[#F0F0F0]'].join(' ')}>
                    {rm.name}
                    {isActiveTab && (
                      <span onClick={e=>{e.stopPropagation();setEditingRoomId(rm.id);setEditRoomName(rm.name)}}
                        className={['p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity',
                          studioView==='room'?'hover:bg-white/20':'hover:bg-[#1B4F8A]/10'].join(' ')}
                        title="Rename room">
                        <Pencil size={9}/>
                      </span>
                    )}
                  </button>
                )}
              </div>
            )
          })}
          <button onClick={addRoom}
            className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-[11px] text-[#777] hover:bg-[#F0F0F0] hover:text-[#333] transition-colors shrink-0">
            <Plus size={11}/> Room
          </button>
        </div>

        <div className="w-px h-5 bg-[#E0DAD0] shrink-0"/>

        {/* Project selector */}
        <div className="relative shrink-0">
          <button onClick={()=>setProjOpen(o=>!o)}
            className="flex items-center gap-1 border border-[#DDD] rounded-lg px-2 py-1.5 text-[11px] text-[#333] hover:border-[#1B4F8A] transition-colors">
            <Layers size={11} className="text-[#1B4F8A]"/>
            <span className="max-w-[100px] truncate">{activeProject||'Project'}</span>
            <ChevronDown size={10} className="text-[#777]"/>
          </button>
          {projOpen && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-[#DDD] rounded-lg shadow-lg z-50 min-w-[160px] py-1">
              {designerProjects.map(p=>(
                <button key={p.id} onClick={()=>{setActiveProject(p.name);setActiveProjectId(p.id);setProjOpen(false)}}
                  className={`w-full text-left px-3 py-2 text-[11px] hover:bg-[#D6E8F7] ${activeProject===p.name?'text-[#1B4F8A] font-medium':'text-[#333]'}`}>
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Room view tools */}
        {studioView==='room' && <>
          <div className="flex items-center gap-0.5 bg-[#F4F1EC] border border-[#DDD] rounded-lg p-0.5 shrink-0">
            {[['after','After',Eye],['before','Before',EyeOff]].map(([v,lbl,Icon])=>(
              <button key={v} onClick={()=>setView(v)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${view===v?'bg-[#1B4F8A] text-white':'text-[#777] hover:text-[#333]'}`}>
                <Icon size={11}/>{lbl}
              </button>
            ))}
          </div>
          <button onClick={()=>setShowGrid(g=>!g)}
            className={`p-1.5 rounded-lg border transition-colors shrink-0 ${showGrid?'bg-[#D6E8F7] border-[#1B4F8A] text-[#1B4F8A]':'border-[#DDD] text-[#AAA] hover:text-[#555]'}`}>
            <Grid size={13}/>
          </button>
          <button onClick={clearAll}
            className="flex items-center gap-1 px-2 py-1.5 border border-[#DDD] rounded-lg text-[11px] text-[#777] hover:border-red-300 hover:text-red-500 transition-colors shrink-0">
            <RotateCcw size={11}/> Clear
          </button>
        </>}

        <div className="w-px h-5 bg-[#E0DAD0] shrink-0"/>

        {/* Save + Send */}
        <button onClick={quickSave} disabled={saveStatus==='saving'}
          className={['flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors shrink-0',
            saveStatus==='saved'  ? 'border-[#15803d] text-[#15803d] bg-[#F0FDF4]' :
            saveStatus==='error'  ? 'border-red-400 text-red-500 bg-red-50' :
            saveStatus==='saving' ? 'border-[#DDD] text-[#AAA]' :
            'border-[#DDD] text-[#555] hover:border-[#1B4F8A] hover:text-[#1B4F8A]'].join(' ')}>
          <Save size={11}/>
          {saveStatus==='saving'?'Saving…':saveStatus==='saved'?'Saved ✓':saveStatus==='error'?'Error':'Save'}
        </button>
        <button
          onClick={() => exportDesignPDF({ activeProject, activeRoom, dims, currentItems, totalValue, floors, activeFloorId })}
          title="Export as PDF"
          className="flex items-center gap-1 px-2.5 py-1.5 border border-[#DDD] rounded-lg text-[11px] font-medium text-[#555] hover:border-[#E07B20] hover:text-[#E07B20] transition-colors shrink-0">
          ⬇ PDF
        </button>
        <button onClick={()=>setShowSendModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4F8A] hover:bg-[#163f6e] text-white rounded-lg text-[11px] font-semibold transition-colors shrink-0">
          <Send size={11}/> Send to Client
        </button>
      </div>

      {/* ── Hint bar + view mode toggle ─────────────────────────────────── */}
      {studioView==='room' && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-1 bg-[#D6E8F7] border-b border-[#BDD4EA]">
          <Info size={11} className="text-[#1B4F8A] shrink-0"/>
          <p className="text-[10px] text-[#1B4F8A] flex-1 min-w-0 truncate">
            Furnishing: <strong>{activeRoom?.name}</strong> ({dims.w}×{dims.d} {dims.unit}) ·
            Click catalog to place · Drag to move · <kbd className="px-1 bg-white/70 rounded text-[9px]">R</kbd> rotate · <kbd className="px-1 bg-white/70 rounded text-[9px]">Del</kbd> remove
            {currentItems.length>0 && <span className="ml-2 font-semibold">{currentItems.length} items · {fmt(totalValue)}</span>}
          </p>
          {/* View mode: Top / Elevation */}
          <div className="flex items-center gap-0.5 bg-white/60 rounded-lg p-0.5 shrink-0">
            <button onClick={()=>setRoomViewMode('top')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${roomViewMode==='top'?'bg-[#1B4F8A] text-white':'text-[#1B4F8A] hover:bg-white/80'}`}>
              Top
            </button>
            <button onClick={()=>setRoomViewMode('elevation')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${roomViewMode==='elevation'?'bg-[#1B4F8A] text-white':'text-[#1B4F8A] hover:bg-white/80'}`}>
              3D View
            </button>
          </div>
        </div>
      )}

      {/* ── Building view ──────────────────────────────────────────────── */}
      {studioView==='building' && (
        <BuildingView floors={floors} activeFloorId={activeFloorId}
          onSelectFloor={id=>{setActiveFloorId(id);setActiveRoomId(floors.find(f=>f.id===id)?.rooms[0]?.id??'')}}
          onAddFloor={addFloor} onGoToFloor={()=>setStudioView('floor')}/>
      )}

      {/* ── Floor Plan view ──────────────────────────────────────────────── */}
      {studioView==='floor' && (
        <div className="flex-1 overflow-auto p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="font-sora font-bold text-[15px] text-[#0F2340]">{activeFloor?.name} — Floor Plan</h3>
              <span className="text-[11px] text-[#999]">{activeFloor?.rooms.length} rooms</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#AAA]">Drag to reposition · Drag edges to resize</span>
              <button onClick={()=>setStudioView('building')}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#DDD] rounded-lg text-[11px] text-[#555] hover:border-[#1B4F8A] hover:text-[#1B4F8A] transition-colors">
                <Building2 size={11}/> Building
              </button>
            </div>
          </div>
          <div className="overflow-auto flex-1">
            {activeFloor && (
              <FloorPlanCanvas
                floor={activeFloor}
                activeRoomId={activeRoomId}
                onSelectRoom={setActiveRoomId}
                onMoveRoom={moveRoom}
                onResizeRoom={resizeRoom}
                onAddRoom={addRoom}
                onEnterRoom={()=>setStudioView('room')}
                onRenameRoom={renameRoom}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Room view (3-panel) ───────────────────────────────────────────── */}
      {studioView==='room' && (
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Catalog */}
          <div className="w-48 shrink-0 bg-white border-r border-[#E0DAD0] flex flex-col overflow-hidden">
            <div className="px-3 py-2.5 border-b border-[#F0EAE0]">
              <p className="text-[12px] font-sora font-semibold text-[#0F2340]">Catalog</p>
              <p className="text-[10px] text-[#999] mt-0.5">{furnitureCatalog.length} items</p>
            </div>
            <div className="px-2 py-1.5 border-b border-[#F0EAE0] flex flex-wrap gap-1">
              {CATS.map(cat=>(
                <button key={cat} onClick={()=>setCatFilter(cat)}
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium transition-colors ${catFilter===cat?'bg-[#1B4F8A] text-white':'bg-[#F4F1EC] text-[#777] hover:bg-[#D6E8F7] hover:text-[#1B4F8A]'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {['Seating','Dining','Bedroom','Storage','Living','Lighting','Office'].filter(c=>catFilter==='All'||catFilter===c).map(cat=>{
                const items = furnitureCatalog.filter(i=>i.category===cat)
                if(!items.length) return null
                return (
                  <div key={cat}>
                    <div className="px-3 py-1 bg-[#F7F3EE] border-b border-[#EEE8E0]">
                      <p className="text-[9px] font-semibold text-[#999] uppercase tracking-wider">{cat}</p>
                    </div>
                    {items.map(item=>(
                      <button key={item.id} onClick={()=>addToCanvas(item)}
                        className="w-full text-left px-3 py-2 border-b border-[#F4F0EA] hover:bg-[#D6E8F7] transition-colors group">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded shrink-0 border border-black/10 overflow-hidden"
                            style={{ backgroundColor:item.colorHex??'#D6C4A8' }}>
                            <div style={{width:32,height:32}}>
                              <FurnitureSVG icon={item.icon} color={item.colorHex??'#D6C4A8'} selected={false}/>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-[#333] leading-tight truncate group-hover:text-[#1B4F8A]">{item.name}</p>
                            <p className="text-[9px] text-[#999]">{fmt(item.price??0)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center bg-[#E8E2D8] overflow-auto p-4">
            {/* 3D isometric view */}
            {roomViewMode==='elevation' && view==='after' && activeRoom && (
              <Iso3DView room={activeRoom} items={currentItems}/>
            )}

            {/* Top view */}
            {roomViewMode==='top' && <div className="relative shrink-0" style={{ width:CW, height:CH }}>
              <RoomBackground w={CW} h={CH} floorColor={view==='before'?'#D8D0C8':floorColor}
                door={activeRoom?.door ?? DEFAULT_DOOR}/>
              {showGrid && (
                <svg width={CW} height={CH} style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1}}>
                  <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5"/>
                  </pattern></defs>
                  <rect x={WALL_T} y={WALL_T} width={CW-WALL_T*2} height={CH-WALL_T*2} fill="url(#grid)"/>
                </svg>
              )}
              <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{background:'rgba(15,35,64,0.72)',color:'#fff',fontFamily:'DM Sans,sans-serif',backdropFilter:'blur(4px)'}}>
                  {activeRoom?.name} · {dims.w}×{dims.d} {dims.unit}
                </span>
              </div>
              {view==='before' && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                  style={{background:'rgba(220,215,208,0.55)'}}>
                  <span className="text-[13px] text-[#666] bg-white/70 px-4 py-2 rounded-lg" style={{fontFamily:'DM Sans,sans-serif'}}>
                    Before — Empty Room
                  </span>
                </div>
              )}
              <div ref={canvasRef} style={{position:'absolute',inset:0,zIndex:5,cursor:dragging?'grabbing':'default',userSelect:'none'}}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
                {view==='after' && currentItems.map(item=>{
                  const w=itemW(item),h=itemH(item),sel=item.id===selectedId
                  return (
                    <div key={item.id} style={{
                      position:'absolute',left:item.cx-w/2,top:item.cy-h/2,width:w,height:h,
                      transform:`rotate(${item.rotation??0}deg)`,transformOrigin:'center',
                      zIndex:sel?15:8,cursor:dragging?.id===item.id?'grabbing':'grab',
                      filter:sel?'drop-shadow(0 0 6px rgba(27,79,138,0.65))':'drop-shadow(0 2px 4px rgba(0,0,0,0.22))',
                      outline:sel?'2px solid #1B4F8A':'none',borderRadius:3,
                    }}>
                      <FurnitureSVG icon={item.catalogItem.icon} color={getItemColor(item)} selected={sel}/>
                      <div style={{position:'absolute',top:'100%',left:'50%',transform:'translateX(-50%)',pointerEvents:'none',marginTop:2,whiteSpace:'nowrap'}}>
                        <span style={{fontSize:7,color:'rgba(0,0,0,0.5)',fontFamily:'DM Sans,sans-serif',background:'rgba(255,255,255,0.8)',padding:'0 2px',borderRadius:2}}>
                          {item.catalogItem.name.split(' ').slice(0,2).join(' ')}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {view==='after'&&currentItems.length===0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{paddingTop:40}}>
                    <PenTool size={26} style={{color:'rgba(180,160,130,0.55)',marginBottom:8}}/>
                    <p style={{color:'rgba(160,140,110,0.75)',fontSize:12,fontFamily:'DM Sans,sans-serif'}}>Click items in the catalog to place furniture</p>
                  </div>
                )}
              </div>
            </div>}
          </div>

          {/* Properties */}
          <div className="w-52 shrink-0 bg-white border-l border-[#E0DAD0] flex flex-col overflow-hidden">
            <div className="px-3 py-2.5 border-b border-[#F0EAE0]">
              <p className="text-[12px] font-sora font-semibold text-[#0F2340]">Properties</p>
            </div>
            {selectedItem ? (
              <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-3 border-b border-[#F0EAE0]">
                  <div className="w-full h-14 rounded-lg border border-black/10 mb-2 overflow-hidden" style={{background:getItemColor(selectedItem)}}>
                    <FurnitureSVG icon={selectedItem.catalogItem.icon} color={getItemColor(selectedItem)} selected={false}/>
                  </div>
                  <p className="text-[12px] font-semibold text-[#333]">{selectedItem.catalogItem.name}</p>
                  <p className="text-[10px] text-[#999] mt-0.5">{selectedItem.catalogItem.brand}</p>
                </div>
                <div className="px-3 py-2.5 border-b border-[#F0EAE0]">
                  <p className="text-[9px] font-bold text-[#AAA] uppercase tracking-wider mb-2">Rotation</p>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>rotateItem(selectedItem.id,-1)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-[#E0DAD0] text-[11px] text-[#555] hover:border-[#1B4F8A] hover:text-[#1B4F8A] transition-colors">
                      <RotateCcw size={11}/> CCW
                    </button>
                    <span className="text-[11px] font-semibold text-[#1B4F8A] w-8 text-center">{selectedItem.rotation??0}°</span>
                    <button onClick={()=>rotateItem(selectedItem.id,1)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-[#E0DAD0] text-[11px] text-[#555] hover:border-[#1B4F8A] hover:text-[#1B4F8A] transition-colors">
                      <RotateCw size={11}/> CW
                    </button>
                  </div>
                  <p className="text-[9px] text-[#CCC] mt-1 text-center">or press <kbd className="px-1 bg-[#F4F1EC] rounded text-[8px]">R</kbd></p>
                </div>
                <div className="px-3 py-2.5 border-b border-[#F0EAE0]">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[9px] font-bold text-[#AAA] uppercase tracking-wider">Size</p>
                    <span className="text-[10px] font-semibold text-[#1B4F8A]">{Math.round((selectedItem.scale??1)*100)}%</span>
                  </div>
                  <input type="range" min="40" max="250" step="5"
                    value={Math.round((selectedItem.scale??1)*100)}
                    onChange={e=>scaleItem(selectedItem.id,Number(e.target.value)/100)}
                    className="w-full accent-[#1B4F8A]"/>
                  <div className="flex justify-between text-[8px] text-[#CCC] mt-0.5"><span>40%</span><span>100%</span><span>250%</span></div>
                </div>
                <div className="px-3 py-2.5 border-b border-[#F0EAE0]">
                  <div className="flex items-center gap-1 mb-2">
                    <Palette size={10} className="text-[#AAA]"/>
                    <p className="text-[9px] font-bold text-[#AAA] uppercase tracking-wider">Colour</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {getVariants(selectedItem.catalogItem.icon).map(v=>{
                      const active=(selectedItem.colorOverride??selectedItem.catalogItem.colorHex)===v.hex
                      return <button key={v.hex} onClick={()=>setItemColor(selectedItem.id,v.hex)} title={v.name}
                        className={['w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                          active?'border-[#1B4F8A] scale-110 shadow-sm':'border-white shadow hover:border-[#1B4F8A]/50'].join(' ')}
                        style={{background:v.hex}}/>
                    })}
                    {selectedItem.colorOverride && (
                      <button onClick={()=>setItemColor(selectedItem.id,null)}
                        className="w-6 h-6 rounded-full border-2 border-dashed border-[#CCC] flex items-center justify-center text-[#CCC] hover:border-red-400 hover:text-red-400 transition-colors" title="Reset">
                        <X size={9}/>
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-3 py-2 border-b border-[#F0EAE0] space-y-1">
                  {[['Category',selectedItem.catalogItem.category],['Price',fmt(selectedItem.catalogItem.price??0)]].map(([l,v])=>(
                    <div key={l} className="flex justify-between text-[11px]">
                      <span className="text-[#999]">{l}</span>
                      <span className={`font-medium ${l==='Price'?'text-[#1B4F8A]':'text-[#333]'}`}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2 border-b border-[#F0EAE0] flex items-center gap-1.5">
                  <Move size={11} className="text-[#CCC]"/><span className="text-[10px] text-[#CCC]">Drag to reposition</span>
                </div>
                <div className="px-3 py-2.5">
                  <button onClick={removeSelected} className="w-full flex items-center justify-center gap-1.5 bg-red-50 text-red-500 border border-red-200 rounded-lg px-3 py-1.5 text-[11px] font-medium hover:bg-red-100 transition-colors">
                    <X size={11}/> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-3 text-center">
                <div className="w-9 h-9 rounded-full bg-[#F4F1EC] border border-[#E0DAD0] flex items-center justify-center mb-2">
                  <Layers size={15} className="text-[#CCC]"/>
                </div>
                <p className="text-[11px] text-[#BBB] leading-relaxed">Select an item to edit rotation, size & colour</p>
              </div>
            )}

            {/* Floor + Room dims */}
            <div className="shrink-0 border-t border-[#F0EAE0] px-3 py-2.5 space-y-2">
              <p className="text-[9px] font-bold text-[#AAA] uppercase tracking-wider">Floor</p>
              <div className="flex items-center gap-2">
                <input type="color" value={floorColor} onChange={e=>updateFloorColor(e.target.value)}
                  className="w-6 h-6 rounded border border-[#E0DAD0] cursor-pointer p-0"/>
                <span className="text-[10px] text-[#999]">Floor tile colour</span>
              </div>

              {/* Door placement */}
              <p className="text-[9px] font-bold text-[#AAA] uppercase tracking-wider pt-1 flex items-center gap-1">
                <DoorOpen size={10}/> Door
              </p>
              <div>
                <p className="text-[9px] text-[#BBB] mb-1">Wall</p>
                <div className="grid grid-cols-2 gap-1">
                  {['top','bottom','left','right'].map(wall=>(
                    <button key={wall} onClick={()=>updateDoor(activeRoomId,{wall})}
                      className={['py-0.5 rounded text-[10px] font-medium border capitalize transition-colors',
                        (activeRoom?.door?.wall??'bottom')===wall
                          ?'bg-[#1B4F8A] text-white border-[#1B4F8A]'
                          :'bg-white text-[#777] border-[#E0DAD0] hover:border-[#1B4F8A]'].join(' ')}>
                      {wall}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[9px] text-[#BBB]">Position</p>
                  <span className="text-[9px] text-[#1B4F8A] font-semibold">
                    {Math.round((activeRoom?.door?.offset??0.35)*100)}%
                  </span>
                </div>
                <input type="range" min="5" max="85" step="5"
                  value={Math.round((activeRoom?.door?.offset??0.35)*100)}
                  onChange={e=>updateDoor(activeRoomId,{offset:Number(e.target.value)/100})}
                  className="w-full accent-[#1B4F8A]"/>
              </div>

              <p className="text-[9px] font-bold text-[#AAA] uppercase tracking-wider pt-1">Room Size</p>
              <div className="flex gap-1.5">
                <div className="flex-1">
                  <p className="text-[9px] text-[#BBB] mb-0.5">Width</p>
                  <input type="number" min="4" max="60" value={dims.w}
                    onChange={e=>updateDims('w',Math.max(4,Number(e.target.value)))}
                    className="w-full px-1.5 py-1 text-[11px] border border-[#E0DAD0] rounded-md outline-none focus:border-[#1B4F8A]"/>
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-[#BBB] mb-0.5">Depth</p>
                  <input type="number" min="4" max="60" value={dims.d}
                    onChange={e=>updateDims('d',Math.max(4,Number(e.target.value)))}
                    className="w-full px-1.5 py-1 text-[11px] border border-[#E0DAD0] rounded-md outline-none focus:border-[#1B4F8A]"/>
                </div>
              </div>
              <div className="flex gap-1">
                {['ft','m'].map(u=>(
                  <button key={u} onClick={()=>updateDims('unit',u)}
                    className={`flex-1 py-0.5 rounded text-[10px] font-medium border transition-colors ${dims.unit===u?'bg-[#1B4F8A] text-white border-[#1B4F8A]':'bg-white text-[#999] border-[#E0DAD0] hover:border-[#1B4F8A]'}`}>
                    {u}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-[#AAA] text-center">Canvas: {CW}×{CH}px</p>
            </div>
            <div className="shrink-0 border-t border-[#F0EAE0] px-3 py-2 space-y-1">
              {[['Items',currentItems.length],['Value',fmt(totalValue)]].map(([l,v])=>(
                <div key={l} className="flex justify-between text-[11px]">
                  <span className="text-[#AAA]">{l}</span>
                  <span className="text-[#1B4F8A] font-semibold">{v}</span>
                </div>
              ))}
              <button onClick={clearAll} disabled={currentItems.length===0}
                className="w-full mt-1 flex items-center justify-center gap-1.5 bg-[#F7F4EF] border border-[#E0DAD0] text-[#999] rounded-lg px-3 py-1.5 text-[11px] hover:border-red-200 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <Trash2 size={11}/> Clear Room
              </button>
            </div>
          </div>

        </div>
      )}

      {showSendModal && (
        <SendDesignModal
          projects={designerProjects}
          activeProject={designerProjects.find(p=>p.id===activeProjectId) ?? null}
          floors={floors}
          onClose={()=>setShowSendModal(false)}
          onSent={()=>setSaveStatus('saved')}
        />
      )}
    </div>
  )
}
