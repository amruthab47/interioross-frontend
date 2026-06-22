import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RotateCcw, Clock, ChevronDown, ChevronUp, User } from 'lucide-react';
import { getAllVersions, updateVersionStatus } from '../api/designs';
import { getProjects } from '../api/projects';

function StatusBadge({ status }) {
  const map = {
    'Approved':          { cls: 'bg-green-100 text-green-700',  label: 'Approved' },
    'Pending Review':    { cls: 'bg-[#D6E8F7] text-[#1B4F8A]', label: 'Pending Review' },
    'Rejected':          { cls: 'bg-red-100 text-red-600',      label: 'Rejected' },
    'Changes Requested': { cls: 'bg-[#FFF3E0] text-[#E07B20]', label: 'Changes Requested' },
  };
  const cfg = map[status] ?? { cls: 'bg-gray-100 text-gray-600', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function VersionCard({ version, isExpanded, onToggle, latestVersionId }) {
  const isPending = version.status === 'Pending Review';
  const isApproved = version.status === 'Approved';
  const isLatest = String(version._id) === String(latestVersionId);

  const [actionTaken, setActionTaken] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleAction(newStatus) {
    setSaving(true);
    try {
      await updateVersionStatus(version._id, newStatus);
      setActionTaken(newStatus === 'Approved' ? 'approved' : 'changes');
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div className={`bg-white dark:bg-[#141B27] rounded-xl border shadow-sm transition-all ${isLatest ? 'border-[#1B4F8A]' : 'border-[#E0E0E0] dark:border-[#1F2937]'}`}>
      {isLatest && (
        <div className="bg-[#1B4F8A] text-white text-[11px] font-semibold px-4 py-1.5 rounded-t-xl flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
          Latest Version
        </div>
      )}

      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        {/* Version badge */}
        <div className="w-10 h-10 rounded-full bg-[#0F2340] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[12px] font-bold">{version.versionLabel ?? version.version}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <StatusBadge status={version.status} />
            <span className="text-[12px] text-[#777777]">
              {version.createdAt || version.date
                ? new Date(version.createdAt ?? version.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—'}
            </span>
          </div>
          <p className="text-[13px] text-[#333333] dark:text-gray-200 truncate">
            {Array.isArray(version.changes) ? version.changes.join(', ') : (version.changes ?? '')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#D6E8F7] flex items-center justify-center">
              <User size={11} className="text-[#1B4F8A]" />
            </div>
            <span className="text-[12px] text-[#777777] hidden sm:inline">{version.designerId?.name ?? version.designer ?? ''}</span>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-[#777777]" /> : <ChevronDown size={16} className="text-[#777777]" />}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-[#F0F4F8] dark:border-[#1F2937] pt-4 space-y-4">
          {/* Design render image */}
          {version.image && (
            <div className="rounded-xl overflow-hidden border border-[#E0E0E0] dark:border-[#1F2937]">
              <img
                src={version.image}
                alt={`Design ${version.version} render`}
                className="w-full object-cover"
                style={{ maxHeight: 260 }}
              />
            </div>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#777777] font-semibold mb-1">Changes in this version</p>
            <p className="text-[13px] text-[#333333] dark:text-gray-300 leading-relaxed">{version.changes}</p>
          </div>

          {version.note && (
            <div className="bg-[#F7F9FC] dark:bg-[#0F1219] rounded-lg p-3 border border-[#E0E0E0] dark:border-[#1F2937]">
              <p className="text-[11px] text-[#777777] mb-1">Designer Note</p>
              <p className="text-[13px] italic text-[#333333] dark:text-gray-400">"{version.note}"</p>
            </div>
          )}

          {isPending && !actionTaken && (
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => handleAction('Approved')}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <CheckCircle size={14} />
                {saving ? 'Saving…' : 'Approve'}
              </button>
              <button
                onClick={() => handleAction('Changes Requested')}
                disabled={saving}
                className="flex items-center gap-2 bg-[#E07B20] hover:bg-orange-600 disabled:opacity-50 text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <RotateCcw size={14} />
                Request Changes
              </button>
            </div>
          )}

          {isPending && actionTaken === 'approved' && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <CheckCircle size={15} />
              <span className="text-[13px] font-medium">You approved this version. Your designer has been notified.</span>
            </div>
          )}

          {isPending && actionTaken === 'changes' && (
            <div className="flex items-center gap-2 text-[#E07B20] bg-[#FFF3E0] border border-orange-200 rounded-lg px-4 py-2.5">
              <RotateCcw size={15} />
              <span className="text-[13px] font-medium">Change request sent. Your designer will revise and re-submit.</span>
            </div>
          )}

          {isApproved && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle size={15} />
              <span className="text-[13px] font-medium">Approved</span>
            </div>
          )}

          {version.status === 'Rejected' && (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle size={15} />
              <span className="text-[13px] font-medium">This version was rejected</span>
            </div>
          )}

          {version.status === 'Changes Requested' && (
            <div className="flex items-center gap-2 text-[#E07B20]">
              <RotateCcw size={15} />
              <span className="text-[13px] font-medium">Changes requested — revision in progress</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClientDesigns() {
  const [projectVersions, setProjectVersions] = useState([])
  const [clientProjectName, setClientProjectName] = useState('')
  const latestVersionId = projectVersions[0]?._id ?? null
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getProjects().then(ps => {
      if (ps[0]) setClientProjectName(ps[0].name)
      const myIds = new Set(ps.map(p => String(p._id ?? p.id)))
      getAllVersions().then(vs => {
        const mine = vs.filter(v => myIds.has(String(v.projectId?._id ?? v.projectId)))
        const sorted = mine.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setProjectVersions(sorted)
        setExpandedId(sorted[0]?._id?.toString() ?? null)
      }).catch(console.error)
    }).catch(console.error)
  }, [])

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#0F1219] space-y-5">

      {/* Page header */}
      <div className="bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm p-5">
        <h1 className="text-xl font-bold font-sora text-[#0F2340] dark:text-white">My Design Versions</h1>
        <p className="text-[13px] text-[#777777] mt-1">
          {clientProjectName || 'Your project'} — all design versions from your designer
        </p>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[11px] text-[#777777]">Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#1B4F8A]" />
            <span className="text-[11px] text-[#777777]">Pending Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#E07B20]" />
            <span className="text-[11px] text-[#777777]">Changes Requested</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[11px] text-[#777777]">Rejected</span>
          </div>
        </div>
      </div>

      {/* Version list */}
      <div className="space-y-4">
        {projectVersions.map((version) => (
          <VersionCard
            key={String(version._id)}
            version={version}
            isExpanded={expandedId === version._id}
            onToggle={() => toggle(version._id)}
            latestVersionId={latestVersionId}
          />
        ))}
      </div>

      {projectVersions.length === 0 && (
        <div className="bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm p-10 text-center">
          <Clock size={32} className="text-[#D6E8F7] mx-auto mb-3" />
          <p className="text-[14px] font-medium text-[#0F2340] dark:text-white">No design versions yet</p>
          <p className="text-[12px] text-[#777777] mt-1">Your designer will upload the first version soon.</p>
        </div>
      )}
    </div>
  );
}
