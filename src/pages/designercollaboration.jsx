import { useState, useEffect, useRef } from 'react'
import {
  ChevronRight, MessageCircle, Clock, CheckCircle2, XCircle,
  AlertCircle, Send, Check, Layers, FileText, User, Plus, Upload, X,
} from 'lucide-react'
import { getProjects } from '../api/projects'
import { getAllVersions, getVersionComments, addComment, updateVersionStatus, uploadDesignVersion } from '../api/designs'
import { projectToRow } from '../utils/format'

// ── status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  'Approved':          { bg: '#F0FDF4', text: '#15803d', border: '#BBF7D0',  dot: '#15803d' },
  'Pending Review':    { bg: '#EFF6FF', text: '#1B4F8A', border: '#BFDBFE',  dot: '#1B4F8A' },
  'Changes Requested': { bg: '#FFF3E8', text: '#E07B20', border: '#FED7AA',  dot: '#E07B20' },
  'Rejected':          { bg: '#FEF2F2', text: '#dc2626', border: '#FECACA',  dot: '#dc2626' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG['Pending Review']
  const icons = {
    'Approved':          <CheckCircle2 size={11} />,
    'Pending Review':    <Clock size={11} />,
    'Changes Requested': <AlertCircle size={11} />,
    'Rejected':          <XCircle size={11} />,
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      {icons[status]}
      {status}
    </span>
  )
}

function VersionBadge({ version }) {
  return (
    <span
      className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide"
      style={{ background: '#0F2340', color: '#FFFFFF' }}
    >
      {version.toUpperCase()}
    </span>
  )
}

function Avatar({ initials, role }) {
  const isDesigner = role === 'Designer'
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
      style={{ background: isDesigner ? '#1B4F8A' : '#E07B20' }}
    >
      {initials}
    </div>
  )
}

function UploadVersionModal({ isOpen, onClose, projects, onUploaded }) {
  const [form,    setForm]    = useState({ projectId: '', versionLabel: '', changes: '' })
  const [file,    setFile]    = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [dragOver,setDragOver]= useState(false)
  const inputRef = useRef(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleFile(f) {
    if (f && f.type.startsWith('image/')) setFile(f)
    else alert('Please select an image file (JPEG, PNG, WebP)')
  }
  function onDrop(e) { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.projectId || !form.versionLabel) return
    setSaving(true)
    try {
      const changes = form.changes ? form.changes.split('\n').filter(Boolean) : []
      await uploadDesignVersion(form.projectId, form.versionLabel, changes, file)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false); setSaving(false)
        setForm({ projectId: '', versionLabel: '', changes: '' }); setFile(null)
        onUploaded(); onClose()
      }, 1200)
    } catch (err) { console.error(err); setSaving(false) }
  }

  if (!isOpen) return null
  const field = 'w-full px-3.5 py-2.5 text-sm border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-[#1B4F8A] text-[#333333] dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-[#777777] transition-colors'
  const lbl   = 'block text-[10px] font-semibold text-[#777777] uppercase tracking-widest mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative z-10 bg-white dark:bg-[#141B27] rounded-2xl shadow-2xl w-full max-w-[500px] border border-[#EFEFEF] dark:border-[#1F2937]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFEFEF] dark:border-[#1F2937]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#D6E8F7] flex items-center justify-center">
              <Upload size={14} className="text-[#1B4F8A]"/>
            </div>
            <h2 className="font-sora font-semibold text-[15px] text-[#0F2340] dark:text-white">Upload Design Version</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#777777] hover:bg-[#F0F2F5] dark:hover:bg-[#1C2538] transition-colors">
            <X size={16}/>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Project <span className="text-[#dc2626]">*</span></label>
              <select required value={form.projectId} onChange={e => set('projectId', e.target.value)} className={field}>
                <option value="">— Select —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Version Label <span className="text-[#dc2626]">*</span></label>
              <input required placeholder="e.g. v3.0" value={form.versionLabel}
                onChange={e => set('versionLabel', e.target.value)} className={field}/>
            </div>
          </div>

          <div>
            <label className={lbl}>Changes (one per line)</label>
            <textarea rows={3} placeholder="Updated kitchen layout&#10;Changed ceiling cove&#10;New colour palette"
              value={form.changes} onChange={e => set('changes', e.target.value)}
              className={`${field} resize-none`}/>
          </div>

          <div>
            <label className={lbl}>Design Image <span className="normal-case font-normal text-[#777777] tracking-normal">(JPEG, PNG, WebP)</span></label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${dragOver ? 'border-[#1B4F8A] bg-[#D6E8F7]/30' : 'border-[#DDDDDD] dark:border-[#2A3547] hover:border-[#2E6DA4] hover:bg-[#F7F9FC]'}`}>
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={e => handleFile(e.target.files?.[0])}/>
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-12 h-12 object-cover rounded-lg border border-[#EFEFEF]"/>
                  <div className="text-left">
                    <p className="text-[13px] font-medium text-[#1B4F8A]">{file.name}</p>
                    <p className="text-[11px] text-[#777777]">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}
                    className="ml-auto p-1 rounded-lg hover:bg-[#FEF2F2] text-[#777777] hover:text-[#dc2626] transition-colors">
                    <X size={14}/>
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={22} className="text-[#777777] mx-auto mb-2"/>
                  <p className="text-[13px] text-[#777777]">Drag & drop or click to select image</p>
                  <p className="text-[11px] text-[#777777] mt-0.5">JPEG, PNG, WebP</p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-[#777777] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:text-[#333333] hover:border-[#999] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || !form.projectId || !form.versionLabel}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors ${success ? 'bg-[#15803d]' : 'bg-[#1B4F8A] hover:bg-[#2E6DA4] disabled:opacity-50 disabled:cursor-not-allowed'}`}>
              {success ? '✓ Uploaded!' : saving ? 'Uploading…' : 'Upload Version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DesignerCollaboration() {
  const [designerProjects, setDesignerProjects] = useState([])
  const [designVersions,   setDesignVersions]   = useState([])
  const [comments,         setComments]         = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedVersionId, setSelectedVersionId] = useState(null)
  const [commentText,  setCommentText]  = useState('')
  const [showUpload,   setShowUpload]   = useState(false)

  function loadVersions() {
    getAllVersions().then(vs => {
      setDesignVersions(vs)
      if (vs.length) setSelectedVersionId(vs[vs.length - 1]._id)
    }).catch(console.error)
  }

  useEffect(() => {
    getProjects().then(ps => {
      const rows = ps.map(projectToRow)
      setDesignerProjects(rows)
      if (rows[0]) setSelectedProjectId(rows[0].id)
    }).catch(console.error)
    loadVersions()
  }, [])

  useEffect(() => {
    if (selectedVersionId) getVersionComments(selectedVersionId).then(setComments).catch(console.error)
  }, [selectedVersionId])

  const selectedProject = designerProjects.find(p => p.id === selectedProjectId)
  const projectVersions = designVersions.filter(v => String(v.projectId?._id ?? v.projectId) === String(selectedProjectId))
  const selectedVersion = designVersions.find(v => v._id === selectedVersionId)
  const versionComments = comments

  function handleSelectProject(id) {
    setSelectedProjectId(id)
    const firstVersion = designVersions.find(v => String(v.projectId?._id ?? v.projectId) === String(id))
    setSelectedVersionId(firstVersion?._id ?? null)
  }

  return (
    <>
    <div className="flex gap-0 h-[calc(100vh-120px)] overflow-hidden -mx-6 -mt-6 px-0">

      {/* ── Left Sidebar: Project List ─────────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 bg-white dark:bg-[#1C2538] border-r border-[#E0E0E0] dark:border-[#1F2937] flex flex-col">
        <div className="px-4 py-4 border-b border-[#E0E0E0] dark:border-[#1F2937]">
          <h2 className="text-[13px] font-semibold text-[#0F2340] dark:text-white uppercase tracking-wide">
            Projects
          </h2>
          <p className="text-[11px] text-[#777777] mt-0.5">{designerProjects.length} active</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {designerProjects.map(project => {
            const isActive = project.id === selectedProjectId
            const pendingVersions = designVersions.filter(
              v => String(v.projectId?._id ?? v.projectId) === String(project.id) && v.status === 'Pending Review'
            ).length
            return (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className={`w-full text-left px-4 py-3 transition-colors border-l-2 ${
                  isActive
                    ? 'bg-[#D6E8F7] dark:bg-[#1B4F8A]/20 border-l-[#1B4F8A]'
                    : 'border-l-transparent hover:bg-[#F7F9FC] dark:hover:bg-[#242E42]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className={`text-[13px] font-medium truncate ${
                        isActive ? 'text-[#1B4F8A] dark:text-blue-300' : 'text-[#333333] dark:text-slate-200'
                      }`}
                    >
                      {project.name}
                    </p>
                    <p className="text-[11px] text-[#777777] truncate mt-0.5">{project.client}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-[#777777] flex items-center gap-1">
                        <FileText size={10} />
                        {project.versions} {project.versions === 1 ? 'version' : 'versions'}
                      </span>
                      {pendingVersions > 0 && (
                        <span className="text-[10px] bg-[#E07B20] text-white px-1.5 py-0.5 rounded-full font-semibold">
                          {pendingVersions} pending
                        </span>
                      )}
                    </div>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-[#1B4F8A] flex-shrink-0 mt-0.5" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Middle Panel: Version History ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#F7F9FC] dark:bg-[#111827] border-r border-[#E0E0E0] dark:border-[#1F2937] overflow-hidden">
        {/* Top bar */}
        <div className="px-5 py-4 bg-white dark:bg-[#1C2538] border-b border-[#E0E0E0] dark:border-[#1F2937] flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-bold text-[#0F2340] dark:text-white font-sora">
              Client Collaboration
            </h1>
            {selectedProject && (
              <p className="text-[12px] text-[#777777] mt-0.5 flex items-center gap-1">
                <Layers size={11} />
                {selectedProject.name} — {selectedProject.client}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedProject && (
              <>
                <span className="text-[11px] text-[#777777]">Phase:</span>
                <span className="text-[11px] font-medium text-[#1B4F8A] bg-[#D6E8F7] px-2 py-1 rounded-md">
                  {selectedProject.phase}
                </span>
              </>
            )}
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-[#1B4F8A] hover:bg-[#2E6DA4] rounded-lg transition-colors ml-2">
              <Plus size={13} strokeWidth={2.5}/> New Version
            </button>
          </div>
        </div>

        {/* Version list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {projectVersions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <FileText size={28} className="text-[#777777] mb-2" />
              <p className="text-[13px] text-[#777777]">No versions for this project yet.</p>
            </div>
          )}
          {projectVersions.map(version => {
            const isSelected = String(version._id) === String(selectedVersionId)
            const commentCount = comments.filter(c => String(c.versionId) === String(version._id)).length
            return (
              <div
                key={String(version._id)}
                onClick={() => setSelectedVersionId(version._id)}
                className={`bg-white dark:bg-[#1C2538] rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-l-4 border-l-[#1B4F8A] border-t-[#E0E0E0] border-r-[#E0E0E0] border-b-[#E0E0E0] shadow-md dark:border-t-[#1F2937] dark:border-r-[#1F2937] dark:border-b-[#1F2937]'
                    : 'border-[#E0E0E0] dark:border-[#1F2937] hover:border-[#2E6DA4] hover:shadow-sm'
                }`}
              >
                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <VersionBadge version={version.versionLabel ?? version.version} />
                      <StatusBadge status={version.status} />
                    </div>
                    <div className="flex items-center gap-3">
                      {commentCount > 0 && (
                        <span className="text-[11px] text-[#777777] flex items-center gap-1">
                          <MessageCircle size={11} />
                          {commentCount}
                        </span>
                      )}
                      <span className="text-[11px] text-[#777777]">
                        {version.createdAt ? new Date(version.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (version.date ?? '')}
                      </span>
                    </div>
                  </div>

                  {/* Changes */}
                  <p className="text-[13px] text-[#333333] dark:text-slate-200 leading-relaxed mb-2">
                    {version.changes}
                  </p>

                  {/* Designer & Note */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[11px] text-[#777777] flex items-center gap-1">
                      <User size={10} />
                      {version.designerId?.name ?? version.designer ?? ''}
                    </span>
                    {(version.reviewerNote ?? version.note) && (
                      <p className="text-[11px] italic text-[#777777] text-right max-w-xs">
                        "{version.reviewerNote ?? version.note}"
                      </p>
                    )}
                  </div>

                  {/* Action buttons for Pending Review */}
                  {version.status === 'Pending Review' && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F0F0F0] dark:border-[#2A3547]">
                      <button
                        className="flex-1 py-1.5 text-[12px] font-semibold rounded-lg text-white transition-colors"
                        style={{ background: '#E07B20' }}
                        onClick={e => e.stopPropagation()}
                      >
                        Send for Approval
                      </button>
                      <button
                        className="flex-1 py-1.5 text-[12px] font-semibold rounded-lg border transition-colors"
                        style={{ color: '#1B4F8A', borderColor: '#1B4F8A', background: 'transparent' }}
                        onClick={e => e.stopPropagation()}
                      >
                        Mark Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right Panel: Comments ─────────────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 bg-white dark:bg-[#1C2538] flex flex-col">
        {/* Panel header */}
        <div className="px-4 py-4 border-b border-[#E0E0E0] dark:border-[#1F2937]">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#0F2340] dark:text-white">
              Comments
            </h2>
            {selectedVersionId && (
              <span className="text-[11px] bg-[#D6E8F7] text-[#1B4F8A] px-2 py-0.5 rounded-full font-medium">
                {versionComments.length}
              </span>
            )}
          </div>
          {selectedVersion && (
            <p className="text-[11px] text-[#777777] mt-1">
              {(selectedVersion.versionLabel ?? selectedVersion.version ?? '').toUpperCase()} · {selectedVersion.createdAt ? new Date(selectedVersion.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (selectedVersion.date ?? '')}
            </p>
          )}
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!selectedVersionId && (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <MessageCircle size={28} className="text-[#DDDDDD] mb-2" />
              <p className="text-[12px] text-[#777777]">Select a version to view comments</p>
            </div>
          )}

          {selectedVersionId && versionComments.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageCircle size={24} className="text-[#DDDDDD] mb-2" />
              <p className="text-[12px] text-[#777777]">No comments yet.</p>
              <p className="text-[11px] text-[#AAAAAA] mt-1">Be the first to add a comment.</p>
            </div>
          )}

          {versionComments.map(comment => (
            <div
              key={comment.id}
              className={`rounded-xl p-3 transition-opacity ${
                comment.resolved
                  ? 'opacity-60 bg-[#F7F9FC] dark:bg-[#242E42]'
                  : 'bg-[#F7F9FC] dark:bg-[#242E42]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Avatar initials={comment.initials} role={comment.role} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[12px] font-semibold text-[#333333] dark:text-slate-200">
                      {comment.author}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: comment.role === 'Designer' ? '#D6E8F7' : '#FFF3E8',
                        color: comment.role === 'Designer' ? '#1B4F8A' : '#E07B20',
                      }}
                    >
                      {comment.role}
                    </span>
                    {comment.resolved && (
                      <span className="text-[10px] text-[#15803d] flex items-center gap-0.5">
                        <Check size={10} /> Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#333333] dark:text-slate-300 leading-relaxed">
                    {comment.comment}
                  </p>
                  <p className="text-[10px] text-[#777777] mt-1.5">{comment.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add comment form */}
        {selectedVersionId && (
          <div className="p-4 border-t border-[#E0E0E0] dark:border-[#1F2937]">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-3 py-2.5 text-[12px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-[#1B4F8A] text-[#333333] dark:text-slate-200 bg-[#F7F9FC] dark:bg-[#242E42] placeholder:text-[#AAAAAA] resize-none transition-colors"
            />
            <button
              className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#1B4F8A' }}
              disabled={!commentText.trim() || !selectedVersionId}
              onClick={async () => {
                if (!commentText.trim() || !selectedVersionId) return
                try {
                  const c = await addComment(selectedVersionId, commentText)
                  setComments(prev => [...prev, c])
                  setCommentText('')
                } catch (err) { console.error(err) }
              }}
            >
              <Send size={13} />
              Send
            </button>
          </div>
        )}
      </div>
    </div>
    <UploadVersionModal
      isOpen={showUpload}
      onClose={() => setShowUpload(false)}
      projects={designerProjects}
      onUploaded={loadVersions}
    />
    </>
  )
}
