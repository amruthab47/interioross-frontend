import { useState, useEffect } from 'react'
import {
  Layers, Palette, Grid, Plus, Info,
  Package, CheckCircle2, XCircle, X, ExternalLink,
} from 'lucide-react'
import { getMaterials, getColorPalettes, createMaterial } from '../api/catalog'
import { getAllMoodBoards, createMoodBoard, createColorPalette } from '../api/designs'
import { getProjects } from '../api/projects'
import { projectToRow } from '../utils/format'

// ── helpers ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'moodboards', label: 'Mood Boards',    icon: Layers   },
  { id: 'palettes',   label: 'Color Palettes', icon: Palette  },
  { id: 'materials',  label: 'Materials',      icon: Grid     },
]

const CATEGORIES = ['All', 'Flooring', 'Wall', 'Ceiling']

const DURABILITY_CFG = {
  High:   { bg: '#F0FDF4', text: '#15803d' },
  Medium: { bg: '#FFF3E8', text: '#E07B20' },
  Low:    { bg: '#FEF2F2', text: '#dc2626' },
}

// ── modal helpers ─────────────────────────────────────────────────────────────

const fieldCls = 'w-full px-3.5 py-2.5 text-[13px] border border-[#E0E0E0] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-[#1B4F8A] text-[#333333] dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-[#AAAAAA] transition-colors'
const labelCls = 'block text-[10px] font-semibold text-[#777777] uppercase tracking-widest mb-1.5'

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white dark:bg-[#141B27] rounded-2xl shadow-2xl w-full max-w-[480px] border border-[#EFEFEF] dark:border-[#1F2937]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <h2 className="font-sora font-semibold text-[15px] text-[#0F2340] dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#777777] hover:bg-[#F0F2F5] dark:hover:bg-[#1C2538] transition-colors"><X size={16}/></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Create Mood Board Modal ───────────────────────────────────────────────────
function CreateMoodBoardModal({ projects, onClose, onCreated }) {
  const [form, setForm] = useState({ projectId: '', title: '', imageUrl: '', style: '', keywords: '', materials: '', colors: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.projectId || !form.title) return
    setSaving(true)
    try {
      await createMoodBoard({
        projectId: form.projectId,
        title:     form.title,
        imageUrl:  form.imageUrl,
        style:     form.style,
        keywords:  form.keywords.split(',').map(s => s.trim()).filter(Boolean),
        materials: form.materials.split(',').map(s => s.trim()).filter(Boolean),
        colors:    form.colors.split(',').map(s => s.trim()).filter(Boolean),
      })
      onCreated()
      onClose()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  return (
    <ModalShell title="Create Mood Board" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Project <span className="text-[#dc2626]">*</span></label>
            <select required value={form.projectId} onChange={e => set('projectId', e.target.value)} className={fieldCls}>
              <option value="">— Select —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Title <span className="text-[#dc2626]">*</span></label>
            <input required placeholder="e.g. Coastal Living" value={form.title} onChange={e => set('title', e.target.value)} className={fieldCls}/>
          </div>
        </div>
        <div>
          <label className={labelCls}>Image URL</label>
          <input placeholder="https://..." value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} className={fieldCls}/>
        </div>
        <div>
          <label className={labelCls}>Style</label>
          <input placeholder="e.g. Minimalist, Scandinavian" value={form.style} onChange={e => set('style', e.target.value)} className={fieldCls}/>
        </div>
        <div>
          <label className={labelCls}>Colors (comma-separated hex)</label>
          <input placeholder="#FFFFFF, #D6E8F7, #0F2340" value={form.colors} onChange={e => set('colors', e.target.value)} className={fieldCls}/>
        </div>
        <div>
          <label className={labelCls}>Keywords (comma-separated)</label>
          <input placeholder="calm, airy, natural" value={form.keywords} onChange={e => set('keywords', e.target.value)} className={fieldCls}/>
        </div>
        <div>
          <label className={labelCls}>Materials (comma-separated)</label>
          <input placeholder="Oak, Linen, Marble" value={form.materials} onChange={e => set('materials', e.target.value)} className={fieldCls}/>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-[13px] font-medium text-[#777777] border border-[#E0E0E0] rounded-xl hover:border-[#999] transition-colors">Cancel</button>
          <button type="submit" disabled={saving || !form.projectId || !form.title}
            className="flex-1 py-2.5 text-[13px] font-semibold rounded-xl text-white bg-[#E07B20] hover:bg-[#c96d18] disabled:opacity-50 transition-colors">
            {saving ? 'Creating…' : 'Create Board'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Create Color Palette Modal ────────────────────────────────────────────────
function CreateColorPaletteModal({ onClose, onCreated }) {
  const [form, setForm]   = useState({ name: '', description: '', tags: '', colors: ['#FFFFFF', '#CCCCCC', '#888888', '#444444', '#111111'] })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function setColor(i, v) {
    setForm(f => { const c = [...f.colors]; c[i] = v; return { ...f, colors: c } })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    try {
      await createColorPalette({
        name:        form.name,
        description: form.description,
        tags:        form.tags.split(',').map(s => s.trim()).filter(Boolean),
        colors:      form.colors.filter(Boolean),
      })
      onCreated()
      onClose()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  return (
    <ModalShell title="New Color Palette" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Palette Name <span className="text-[#dc2626]">*</span></label>
          <input required placeholder="e.g. Ocean Breeze" value={form.name} onChange={e => set('name', e.target.value)} className={fieldCls}/>
        </div>
        <div>
          <label className={labelCls}>Colors</label>
          <div className="flex items-center gap-2 flex-wrap">
            {form.colors.map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <input type="color" value={c} onChange={e => setColor(i, e.target.value)}
                  className="w-10 h-10 rounded-lg border border-[#E0E0E0] cursor-pointer p-0.5"/>
                <span className="text-[9px] font-mono text-[#777777]">{c.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Tags (comma-separated)</label>
          <input placeholder="coastal, warm, earthy" value={form.tags} onChange={e => set('tags', e.target.value)} className={fieldCls}/>
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea rows={2} placeholder="Describe this palette..." value={form.description} onChange={e => set('description', e.target.value)}
            className={`${fieldCls} resize-none`}/>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-[13px] font-medium text-[#777777] border border-[#E0E0E0] rounded-xl hover:border-[#999] transition-colors">Cancel</button>
          <button type="submit" disabled={saving || !form.name}
            className="flex-1 py-2.5 text-[13px] font-semibold rounded-xl text-white bg-[#E07B20] hover:bg-[#c96d18] disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Create Palette'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Add Material Modal ────────────────────────────────────────────────────────
function AddMaterialModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', category: 'Flooring', brand: '', pricePerUnit: '', unit: 'sq ft',
    colorHex: '#CCCCCC', durability: 'Medium', maintenance: '', inStock: true, description: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    try {
      await createMaterial({
        ...form,
        pricePerUnit: Number(form.pricePerUnit) || 0,
      })
      onCreated()
      onClose()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  return (
    <ModalShell title="Add Material" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Name <span className="text-[#dc2626]">*</span></label>
            <input required placeholder="e.g. Marble Flooring" value={form.name} onChange={e => set('name', e.target.value)} className={fieldCls}/>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={fieldCls}>
              {['Flooring', 'Wall', 'Ceiling'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Brand</label>
            <input placeholder="e.g. Kajaria" value={form.brand} onChange={e => set('brand', e.target.value)} className={fieldCls}/>
          </div>
          <div>
            <label className={labelCls}>Price per Unit (₹)</label>
            <input type="number" min="0" placeholder="0" value={form.pricePerUnit} onChange={e => set('pricePerUnit', e.target.value)} className={fieldCls}/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Unit</label>
            <input placeholder="sq ft, piece, m²" value={form.unit} onChange={e => set('unit', e.target.value)} className={fieldCls}/>
          </div>
          <div>
            <label className={labelCls}>Durability</label>
            <select value={form.durability} onChange={e => set('durability', e.target.value)} className={fieldCls}>
              {['High', 'Medium', 'Low'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Maintenance</label>
            <input placeholder="e.g. Low, Wipe clean" value={form.maintenance} onChange={e => set('maintenance', e.target.value)} className={fieldCls}/>
          </div>
          <div>
            <label className={labelCls}>Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.colorHex} onChange={e => set('colorHex', e.target.value)}
                className="w-10 h-10 rounded-lg border border-[#E0E0E0] cursor-pointer p-0.5"/>
              <span className="text-[12px] font-mono text-[#555]">{form.colorHex.toUpperCase()}</span>
            </div>
          </div>
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea rows={2} placeholder="Brief description..." value={form.description} onChange={e => set('description', e.target.value)}
            className={`${fieldCls} resize-none`}/>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => set('inStock', !form.inStock)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.inStock ? 'bg-[#1B4F8A]' : 'bg-[#E0E0E0]'}`}>
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.inStock ? 'translate-x-6' : 'translate-x-1'}`}/>
          </button>
          <span className="text-[13px] text-[#333333] dark:text-slate-200">{form.inStock ? 'In Stock' : 'Out of Stock'}</span>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-[13px] font-medium text-[#777777] border border-[#E0E0E0] rounded-xl hover:border-[#999] transition-colors">Cancel</button>
          <button type="submit" disabled={saving || !form.name}
            className="flex-1 py-2.5 text-[13px] font-semibold rounded-xl text-white bg-[#1B4F8A] hover:bg-[#2E6DA4] disabled:opacity-50 transition-colors">
            {saving ? 'Adding…' : 'Add Material'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

function TabBar({ active, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-[#F7F9FC] dark:bg-[#242E42] p-1 rounded-xl border border-[#E0E0E0] dark:border-[#1F2937]">
      {TABS.map(tab => {
        const Icon = tab.icon
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              isActive
                ? 'bg-white dark:bg-[#1C2538] text-[#1B4F8A] dark:text-blue-300 shadow-sm'
                : 'text-[#777777] hover:text-[#333333] dark:hover:text-slate-200'
            }`}
          >
            <Icon size={15} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Mood Board Detail Modal ────────────────────────────────────────────────────
function MoodBoardModal({ board, projectName, onClose }) {
  if (!board) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1C2538] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={board.imageUrl}
            alt={board.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-0 left-0 p-5">
            <h2 className="text-[18px] font-bold text-white font-sora leading-tight">{board.title}</h2>
            <p className="text-[12px] text-white/80 mt-0.5">{projectName}</p>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-4">
          {/* Colors */}
          <div>
            <p className="text-[11px] font-semibold text-[#777777] uppercase tracking-wide mb-2">Color Palette</p>
            <div className="flex items-center gap-2">
              {board.colors.map((hex, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-10 h-10 rounded-lg border border-[#E0E0E0] shadow-sm"
                    style={{ background: hex }}
                    title={hex}
                  />
                  <span className="text-[9px] font-mono text-[#777777]">{hex.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Style & Keywords */}
          <div>
            <p className="text-[11px] font-semibold text-[#777777] uppercase tracking-wide mb-2">Style & Keywords</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] px-3 py-1 rounded-full font-semibold" style={{ background: '#D6E8F7', color: '#1B4F8A' }}>
                {board.style}
              </span>
              {board.keywords.map(kw => (
                <span key={kw} className="text-[11px] px-2 py-0.5 rounded-full bg-[#F7F9FC] text-[#555] border border-[#E0E0E0]">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Materials */}
          <div>
            <p className="text-[11px] font-semibold text-[#777777] uppercase tracking-wide mb-2">Materials</p>
            <div className="flex flex-wrap gap-2">
              {board.materials.map(mat => (
                <span key={mat} className="text-[12px] px-3 py-1 rounded-lg bg-[#F7F9FC] text-[#333] border border-[#E0E0E0]">
                  {mat}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: '#1B4F8A' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Mood Boards Tab ────────────────────────────────────────────────────────────
function MoodBoardsTab({ moodBoards, designerProjects, onCreateNew }) {
  const [selectedBoard, setSelectedBoard] = useState(null)
  const projectName = id => designerProjects.find(p => String(p.id) === String(id))?.name ?? 'Unknown'

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[15px] font-bold text-[#0F2340] dark:text-white font-sora">Mood Boards</h2>
          <p className="text-[12px] text-[#777777] mt-0.5">{moodBoards.length} boards across all projects</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#E07B20' }}
        >
          <Plus size={15} />
          Create New
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {moodBoards.map(board => (
          <div
            key={board.id}
            onClick={() => setSelectedBoard(board)}
            className="bg-white dark:bg-[#1C2538] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
          >
            {/* Room image */}
            <div className="relative h-44 overflow-hidden">
              <img
                src={board.imageUrl}
                alt={board.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              {/* Color swatches overlay */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1">
                {board.colors.map((hex, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border-2 border-white shadow"
                    style={{ background: hex }}
                    title={hex}
                  />
                ))}
              </div>
              {/* Style badge */}
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-[#1B4F8A]">
                  {board.style}
                </span>
              </div>
            </div>

            {/* Card body */}
            <div className="p-4">
              <h3 className="text-[13px] font-semibold text-[#0F2340] dark:text-white leading-snug mb-0.5">
                {board.title}
              </h3>
              <p className="text-[11px] text-[#777777] mb-2.5">{projectName(board.projectId)}</p>

              {/* Keywords */}
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                {board.keywords.map(kw => (
                  <span
                    key={kw}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F7F9FC] dark:bg-[#242E42] text-[#777777] border border-[#E0E0E0] dark:border-[#2A3547]"
                  >
                    {kw}
                  </span>
                ))}
              </div>

              {/* Materials */}
              <div className="border-t border-[#F0F0F0] dark:border-[#2A3547] pt-2.5">
                <p className="text-[10px] text-[#777777] mb-1.5 font-medium uppercase tracking-wide">Materials</p>
                <div className="flex flex-wrap gap-1.5">
                  {board.materials.slice(0, 3).map(mat => (
                    <span
                      key={mat}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-[#F7F9FC] dark:bg-[#242E42] text-[#333333] dark:text-slate-300 border border-[#E0E0E0] dark:border-[#2A3547]"
                    >
                      {mat}
                    </span>
                  ))}
                  {board.materials.length > 3 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#D6E8F7] text-[#1B4F8A] font-medium">
                      +{board.materials.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-[#2E6DA4] mt-3 flex items-center gap-1 font-medium">
                <ExternalLink size={11} />
                Click to view details
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedBoard && (
        <MoodBoardModal
          board={selectedBoard}
          projectName={projectName(selectedBoard.projectId)}
          onClose={() => setSelectedBoard(null)}
        />
      )}
    </div>
  )
}

// ── Color Palettes Tab ─────────────────────────────────────────────────────────
function ColorPalettesTab({ colorPalettes, onCreateNew }) {
  const [activePaletteId, setActivePaletteId] = useState(null)
  const [hoveredSwatch, setHoveredSwatch] = useState(null)

  const effectiveId   = activePaletteId ?? colorPalettes[0]?.id
  const activePalette = colorPalettes.find(p => p.id === effectiveId)
  // Pick first 3 colors for the tester
  const testerColors = activePalette ? activePalette.colors.slice(0, 3) : ['#FFFFFF', '#CCCCCC', '#888888']

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[15px] font-bold text-[#0F2340] dark:text-white font-sora">Color Palettes</h2>
          <p className="text-[12px] text-[#777777] mt-0.5">Click a palette to preview it in the Color Tester</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#E07B20' }}
        >
          <Plus size={15} />
          New Palette
        </button>
      </div>

      {/* Palette grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {colorPalettes.map(palette => {
          const isActive = palette.id === activePaletteId
          return (
            <div
              key={palette.id}
              onClick={() => setActivePaletteId(palette.id)}
              className={`bg-white dark:bg-[#1C2538] rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                isActive
                  ? 'border-[#1B4F8A] shadow-md ring-1 ring-[#1B4F8A]/20'
                  : 'border-[#E0E0E0] dark:border-[#1F2937]'
              }`}
            >
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
                  <div
                    key={i}
                    className="relative flex-1 h-9 rounded-md cursor-default group"
                    style={{ background: hex }}
                    onMouseEnter={() => setHoveredSwatch(`${palette.id}-${i}`)}
                    onMouseLeave={() => setHoveredSwatch(null)}
                  >
                    {hoveredSwatch === `${palette.id}-${i}` && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-[#0F2340] text-white text-[10px] font-mono whitespace-nowrap z-10 shadow-lg">
                        {hex.toUpperCase()}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F2340]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {palette.description && (
                <p className="text-[10px] text-[#777777] dark:text-slate-500 leading-relaxed">{palette.description}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Color Tester */}
      <div className="bg-white dark:bg-[#1C2538] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-bold text-[#0F2340] dark:text-white font-sora">Color Tester</h3>
            <p className="text-[12px] text-[#777777] mt-0.5">
              Previewing: <span className="font-semibold text-[#1B4F8A]">{activePalette?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#777777]">
            <Info size={12} />
            Mock room preview
          </div>
        </div>

        {/* Mock room */}
        <div className="rounded-xl overflow-hidden border border-[#E0E0E0] dark:border-[#2A3547]" style={{ height: 220 }}>
          <div className="flex h-full">
            {/* Wall zone */}
            <div
              className="flex-1 flex items-end justify-center pb-3 transition-colors duration-500"
              style={{ background: testerColors[0] }}
            >
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  color: '#333333',
                }}
              >
                Wall
              </span>
            </div>

            {/* Floor zone */}
            <div className="w-2/5 flex flex-col">
              <div
                className="flex-1 flex items-center justify-center transition-colors duration-500"
                style={{ background: testerColors[1] }}
              >
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.7)', color: '#333333' }}
                >
                  Floor
                </span>
              </div>
              {/* Accent zone */}
              <div
                className="h-14 flex items-center justify-center transition-colors duration-500"
                style={{ background: testerColors[2] }}
              >
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.7)', color: '#333333' }}
                >
                  Accent
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Color labels */}
        <div className="flex items-center gap-4 mt-3">
          {['Wall', 'Floor', 'Accent'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm border border-[#E0E0E0]"
                style={{ background: testerColors[i] }}
              />
              <span className="text-[11px] text-[#777777]">{label}</span>
              <span className="text-[11px] font-mono text-[#333333] dark:text-slate-300">{testerColors[i]?.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Materials Tab ──────────────────────────────────────────────────────────────
function MaterialsTab({ materialCatalog, onAddMaterial }) {
  const [categoryFilter, setCategoryFilter] = useState('All')

  const filtered = categoryFilter === 'All'
    ? materialCatalog
    : materialCatalog.filter(m => m.category === categoryFilter)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-[#0F2340] dark:text-white font-sora">Material Catalog</h2>
          <p className="text-[12px] text-[#777777] mt-0.5">{filtered.length} materials</p>
        </div>
        <button
          onClick={onAddMaterial}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#E07B20' }}
        >
          <Plus size={15} />
          Add Material
        </button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
              categoryFilter === cat
                ? 'bg-[#0F2340] text-white border-[#0F2340]'
                : 'bg-white dark:bg-[#1C2538] text-[#777777] dark:text-slate-400 border-[#E0E0E0] dark:border-[#1F2937] hover:border-[#2E6DA4] hover:text-[#1B4F8A]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1C2538] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: '#0F2340' }}>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-white uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-white uppercase tracking-wide">Category</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-white uppercase tracking-wide">Brand</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-white uppercase tracking-wide">Price</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-white uppercase tracking-wide">Durability</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-white uppercase tracking-wide">Maintenance</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-white uppercase tracking-wide">Stock</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((material, idx) => {
              const durCfg = DURABILITY_CFG[material.durability] || DURABILITY_CFG['Medium']
              return (
                <tr
                  key={material.id}
                  className="border-t border-[#F0F0F0] dark:border-[#1F2937] hover:bg-[#D6E8F7]/30 dark:hover:bg-[#1B4F8A]/10 transition-colors"
                  style={{ background: idx % 2 === 1 ? '#F7F9FC' : undefined }}
                >
                  {/* Name with color swatch */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-5 h-5 rounded-full border-2 border-[#E0E0E0] flex-shrink-0"
                        style={{ background: material.color }}
                      />
                      <div>
                        <p className="text-[13px] font-medium text-[#333333] dark:text-slate-200">{material.name}</p>
                        {material.description && (
                          <p className="text-[10px] text-[#777777] dark:text-slate-500 mt-0.5 max-w-[260px] leading-snug">{material.description}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#D6E8F7', color: '#1B4F8A' }}
                    >
                      {material.category}
                    </span>
                  </td>

                  {/* Brand */}
                  <td className="px-4 py-3 text-[13px] text-[#777777]">{material.brand}</td>

                  {/* Price */}
                  <td className="px-4 py-3">
                    <span className="text-[13px] font-semibold text-[#333333] dark:text-slate-200">
                      ₹{material.price}
                    </span>
                    <span className="text-[11px] text-[#777777] ml-1">/{material.unit}</span>
                  </td>

                  {/* Durability */}
                  <td className="px-4 py-3">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: durCfg.bg, color: durCfg.text }}
                    >
                      {material.durability}
                    </span>
                  </td>

                  {/* Maintenance */}
                  <td className="px-4 py-3 text-[13px] text-[#777777]">{material.maintenance}</td>

                  {/* Stock */}
                  <td className="px-4 py-3">
                    {material.inStock ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803d] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                        <CheckCircle2 size={11} />
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#dc2626] bg-[#FEF2F2] px-2 py-0.5 rounded-full border border-[#FECACA]">
                        <XCircle size={11} />
                        Out of Stock
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package size={28} className="text-[#DDDDDD] mb-2" />
            <p className="text-[13px] text-[#777777]">No materials found for this category.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DesignerMaterials() {
  const [moodBoards,      setMoodBoards]      = useState([])
  const [colorPalettes,   setColorPalettes]   = useState([])
  const [materialCatalog, setMaterialCatalog] = useState([])
  const [designerProjects,setDesignerProjects]= useState([])
  const [activeTab,       setActiveTab]       = useState('moodboards')

  const [showCreateBoard,   setShowCreateBoard]   = useState(false)
  const [showCreatePalette, setShowCreatePalette] = useState(false)
  const [showAddMaterial,   setShowAddMaterial]   = useState(false)

  function loadMoodBoards() {
    getAllMoodBoards().then(bs => setMoodBoards(bs.map(b => ({
      ...b, id: String(b._id), projectId: String(b.projectId?._id ?? b.projectId),
    })))).catch(console.error)
  }

  function loadColorPalettes() {
    getColorPalettes().then(ps => setColorPalettes(ps.map(p => ({
      ...p, id: String(p._id),
    })))).catch(console.error)
  }

  function loadMaterials() {
    getMaterials().then(ms => setMaterialCatalog(ms.map(m => ({
      ...m, id: String(m._id), price: m.pricePerUnit ?? m.price ?? 0, color: m.colorHex ?? null,
    })))).catch(console.error)
  }

  useEffect(() => {
    loadMoodBoards()
    loadColorPalettes()
    loadMaterials()
    getProjects().then(ps => setDesignerProjects(ps.map(projectToRow))).catch(console.error)
  }, [])

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-[#0F2340] dark:text-white font-sora">
            Materials &amp; Mood Boards
          </h1>
          <p className="text-[13px] text-[#777777] mt-0.5">Manage mood boards, color palettes, and material catalog</p>
        </div>
        <TabBar active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab content */}
      {activeTab === 'moodboards' && (
        <MoodBoardsTab
          moodBoards={moodBoards}
          designerProjects={designerProjects}
          onCreateNew={() => setShowCreateBoard(true)}
        />
      )}
      {activeTab === 'palettes' && (
        <ColorPalettesTab
          colorPalettes={colorPalettes}
          onCreateNew={() => setShowCreatePalette(true)}
        />
      )}
      {activeTab === 'materials' && (
        <MaterialsTab
          materialCatalog={materialCatalog}
          onAddMaterial={() => setShowAddMaterial(true)}
        />
      )}

      {showCreateBoard && (
        <CreateMoodBoardModal
          projects={designerProjects}
          onClose={() => setShowCreateBoard(false)}
          onCreated={loadMoodBoards}
        />
      )}
      {showCreatePalette && (
        <CreateColorPaletteModal
          onClose={() => setShowCreatePalette(false)}
          onCreated={loadColorPalettes}
        />
      )}
      {showAddMaterial && (
        <AddMaterialModal
          onClose={() => setShowAddMaterial(false)}
          onCreated={loadMaterials}
        />
      )}
    </div>
  )
}
