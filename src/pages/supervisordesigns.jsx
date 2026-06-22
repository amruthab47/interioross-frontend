import { useState, useEffect } from 'react'
import {
  ChevronRight, MessageCircle, Clock, CheckCircle2, XCircle,
  AlertCircle, Check, Layers, FileText, User, Lock, ChevronDown, ChevronUp,
} from 'lucide-react'
import { getProjects } from '../api/projects'
import { getAllVersions, getVersionComments } from '../api/designs'
import { projectToRow } from '../utils/format'

const STATUS_CFG = {
  'Approved':          { bg: '#F0FDF4', text: '#15803d', border: '#BBF7D0', dot: '#15803d'  },
  'Pending Review':    { bg: '#EFF6FF', text: '#1B4F8A', border: '#BFDBFE', dot: '#1B4F8A'  },
  'Changes Requested': { bg: '#FFF3E8', text: '#E07B20', border: '#FED7AA', dot: '#E07B20'  },
  'Rejected':          { bg: '#FEF2F2', text: '#dc2626', border: '#FECACA', dot: '#dc2626'  },
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

function Avatar({ initials, role }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
      style={{ background: role === 'Designer' ? '#1B4F8A' : '#E07B20' }}
    >
      {initials}
    </div>
  )
}

export default function SupervisorDesigns() {
  const [designerProjects, setDesignerProjects] = useState([])
  const [designVersions,   setDesignVersions]   = useState([])
  const [designComments,   setDesignComments]   = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedVersionId, setSelectedVersionId] = useState(null)
  const [expandedImages, setExpandedImages] = useState({})

  useEffect(() => {
    getProjects().then(ps => {
      const rows = ps.map(projectToRow)
      setDesignerProjects(rows)
      if (rows[0]) setSelectedProjectId(rows[0].id)
    }).catch(console.error)
    getAllVersions().then(vs => {
      const normalized = vs.map(v => ({
        ...v,
        id:       String(v._id),
        version:  v.versionLabel ?? '',
        date:     v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
        changes:  Array.isArray(v.changes) ? v.changes.join(', ') : (v.changes ?? ''),
        designer: v.designerId?.name ?? v.designerId ?? '',
        note:     v.reviewerNote ?? '',
        image:    v.imageUrl ?? v.fileUrl ?? null,
      }))
      setDesignVersions(normalized)
      if (normalized.length) {
        const last = normalized[normalized.length - 1]
        setSelectedVersionId(last.id)
        getVersionComments(last.id).then(setDesignComments).catch(console.error)
      }
    }).catch(console.error)
  }, [])

  const selectedProject = designerProjects.find(p => p.id === selectedProjectId)
  const projectVersions = designVersions.filter(v => String(v.projectId?._id ?? v.projectId) === String(selectedProjectId))
  const selectedVersion = designVersions.find(v => v.id === selectedVersionId)
  const versionComments = selectedVersionId
    ? designComments.filter(c => String(c.versionId) === String(selectedVersionId))
    : []

  function handleSelectProject(id) {
    setSelectedProjectId(id)
    const versions = designVersions.filter(v => String(v.projectId?._id ?? v.projectId) === String(id))
    setSelectedVersionId(versions[versions.length - 1]?.id ?? null)
    setExpandedImages({})
  }

  function toggleImage(id) {
    setExpandedImages(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex gap-0 h-[calc(100vh-120px)] overflow-hidden -mx-6 -mt-6 px-0">

      {/* Left: Project list */}
      <div className="w-64 flex-shrink-0 bg-white dark:bg-[#1C2538] border-r border-[#E0E0E0] dark:border-[#1F2937] flex flex-col">
        <div className="px-4 py-4 border-b border-[#E0E0E0] dark:border-[#1F2937]">
          <h2 className="text-[13px] font-semibold text-[#0F2340] dark:text-white uppercase tracking-wide">Projects</h2>
          <p className="text-[11px] text-[#777777] mt-0.5">{designerProjects.length} active</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {designerProjects.map(project => {
            const isActive = project.id === selectedProjectId
            const pendingCount = designVersions.filter(
              v => v.projectId === project.id && v.status === 'Pending Review'
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
                    <p className={`text-[13px] font-medium truncate ${isActive ? 'text-[#1B4F8A] dark:text-blue-300' : 'text-[#333333] dark:text-slate-200'}`}>
                      {project.name}
                    </p>
                    <p className="text-[11px] text-[#777777] truncate mt-0.5">{project.client}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-[#777777] flex items-center gap-1">
                        <FileText size={10} />
                        {project.versions} {project.versions === 1 ? 'version' : 'versions'}
                      </span>
                      {pendingCount > 0 && (
                        <span className="text-[10px] bg-[#E07B20] text-white px-1.5 py-0.5 rounded-full font-semibold">
                          {pendingCount} pending
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

      {/* Middle: Version list */}
      <div className="flex-1 flex flex-col bg-[#F7F9FC] dark:bg-[#111827] border-r border-[#E0E0E0] dark:border-[#1F2937] overflow-hidden">
        {/* Top bar */}
        <div className="px-5 py-4 bg-white dark:bg-[#1C2538] border-b border-[#E0E0E0] dark:border-[#1F2937] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[15px] font-bold text-[#0F2340] dark:text-white font-sora">Design Versions</h1>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F9FC] dark:bg-[#1A2236] border border-[#EFEFEF] dark:border-[#1F2937] rounded-lg text-[11px] text-muted">
                <Lock size={11} />
                View only
              </span>
            </div>
            {selectedProject && (
              <p className="text-[12px] text-[#777777] mt-0.5 flex items-center gap-1">
                <Layers size={11} />
                {selectedProject.name} — {selectedProject.client}
              </p>
            )}
          </div>
          {selectedProject && (
            <span className="text-[11px] font-medium text-[#1B4F8A] bg-[#D6E8F7] px-2 py-1 rounded-md">
              {selectedProject.phase}
            </span>
          )}
        </div>

        {/* Version cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {projectVersions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <FileText size={28} className="text-[#777777] mb-2" />
              <p className="text-[13px] text-[#777777]">No versions for this project yet.</p>
            </div>
          )}

          {projectVersions.map(version => {
            const isSelected = version.id === selectedVersionId
            const commentCount = designComments.filter(c => c.versionId === version.id).length
            const imgExpanded = expandedImages[version.id]

            return (
              <div
                key={version.id}
                onClick={() => setSelectedVersionId(version.id)}
                className={`bg-white dark:bg-[#1C2538] rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-l-4 border-l-[#1B4F8A] border-t-[#E0E0E0] border-r-[#E0E0E0] border-b-[#E0E0E0] shadow-md dark:border-t-[#1F2937] dark:border-r-[#1F2937] dark:border-b-[#1F2937]'
                    : 'border-[#E0E0E0] dark:border-[#1F2937] hover:border-[#2E6DA4] hover:shadow-sm'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide bg-[#0F2340] text-white">
                        {version.version.toUpperCase()}
                      </span>
                      <StatusBadge status={version.status} />
                    </div>
                    <div className="flex items-center gap-3">
                      {commentCount > 0 && (
                        <span className="text-[11px] text-[#777777] flex items-center gap-1">
                          <MessageCircle size={11} /> {commentCount}
                        </span>
                      )}
                      <span className="text-[11px] text-[#777777]">{version.date}</span>
                    </div>
                  </div>

                  <p className="text-[13px] text-[#333333] dark:text-slate-200 leading-relaxed mb-2">
                    {version.changes}
                  </p>

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-[11px] text-[#777777] flex items-center gap-1">
                      <User size={10} /> {version.designer}
                    </span>
                    {version.note && (
                      <p className="text-[11px] italic text-[#777777] text-right max-w-xs">"{version.note}"</p>
                    )}
                  </div>

                  {/* Design image toggle */}
                  {version.image && (
                    <div onClick={e => { e.stopPropagation(); toggleImage(version.id) }}>
                      <button className="flex items-center gap-1 text-[11px] text-[#2E6DA4] font-medium mb-2 hover:text-[#1B4F8A]">
                        {imgExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {imgExpanded ? 'Hide render' : 'Show design render'}
                      </button>
                      {imgExpanded && (
                        <div className="rounded-xl overflow-hidden border border-[#E0E0E0] dark:border-[#1F2937]">
                          <img
                            src={version.image}
                            alt={`Design ${version.version}`}
                            className="w-full object-cover"
                            style={{ maxHeight: 220 }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: Comments (read-only) */}
      <div className="w-80 flex-shrink-0 bg-white dark:bg-[#1C2538] flex flex-col">
        <div className="px-4 py-4 border-b border-[#E0E0E0] dark:border-[#1F2937]">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#0F2340] dark:text-white">Comments</h2>
            {selectedVersionId && (
              <span className="text-[11px] bg-[#D6E8F7] text-[#1B4F8A] px-2 py-0.5 rounded-full font-medium">
                {versionComments.length}
              </span>
            )}
          </div>
          {selectedVersion && (
            <p className="text-[11px] text-[#777777] mt-1">
              {selectedVersion.version.toUpperCase()} · {selectedVersion.date}
            </p>
          )}
        </div>

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
            </div>
          )}

          {versionComments.map(comment => (
            <div
              key={comment.id}
              className={`rounded-xl p-3 bg-[#F7F9FC] dark:bg-[#242E42] ${comment.resolved ? 'opacity-60' : ''}`}
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
                  <p className="text-[12px] text-[#333333] dark:text-slate-300 leading-relaxed">{comment.comment}</p>
                  <p className="text-[10px] text-[#777777] mt-1.5">{comment.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Read-only footer notice */}
        <div className="p-4 border-t border-[#E0E0E0] dark:border-[#1F2937] bg-[#F7F9FC] dark:bg-[#0F1219]">
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <Lock size={12} />
            <span>Comments are visible but cannot be added here.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
