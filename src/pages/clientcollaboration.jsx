import { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle, RotateCcw, Check } from 'lucide-react';
import { getAllVersions, getVersionComments, addComment, updateVersionStatus } from '../api/designs';
import { getProjects } from '../api/projects';

function StatusBadge({ status }) {
  const map = {
    'Approved':          { cls: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
    'Pending Review':    { cls: 'bg-[#D6E8F7] text-[#1B4F8A]', dot: 'bg-[#1B4F8A]' },
    'Rejected':          { cls: 'bg-red-100 text-red-600',      dot: 'bg-red-500' },
    'Changes Requested': { cls: 'bg-[#FFF3E0] text-[#E07B20]', dot: 'bg-[#E07B20]' },
  };
  const cfg = map[status] ?? { cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

function Avatar({ initials, isClient }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
      style={{ backgroundColor: isClient ? '#E07B20' : '#1B4F8A', color: '#fff' }}
    >
      {initials}
    </div>
  );
}

function CommentBubble({ comment }) {
  const isClient = comment.role === 'Client';
  return (
    <div className={`flex gap-2.5 ${isClient ? 'flex-row-reverse' : 'flex-row'} ${comment.resolved ? 'opacity-50' : ''}`}>
      <Avatar initials={comment.initials} isClient={isClient} />
      <div className={`max-w-[72%] ${isClient ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`flex items-center gap-2 mb-1 ${isClient ? 'flex-row-reverse' : ''}`}>
          <span className="text-[11px] font-semibold text-[#333333] dark:text-gray-200">{comment.author}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${isClient ? 'bg-[#FFF3E0] text-[#E07B20]' : 'bg-[#D6E8F7] text-[#1B4F8A]'}`}>
            {comment.role}
          </span>
          {comment.resolved && (
            <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-[#777777] rounded font-medium">Resolved</span>
          )}
        </div>
        <div className={`rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${isClient ? 'bg-[#FFF3E0] text-[#333333] rounded-tr-none' : 'bg-[#D6E8F7] text-[#0F2340] rounded-tl-none'}`}>
          {comment.comment}
        </div>
        <span className="text-[10px] text-[#777777] mt-1 px-1">{comment.date}</span>
      </div>
    </div>
  );
}

export default function ClientCollaboration() {
  const [projectVersions, setProjectVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [actionTaken, setActionTaken] = useState(null);
  const [clientProjectName, setClientProjectName] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    getProjects().then(ps => {
      if (ps[0]) setClientProjectName(ps[0].name)
      const myIds = new Set(ps.map(p => String(p._id ?? p.id)))
      getAllVersions().then(vs => {
        const mine = vs.filter(v => myIds.has(String(v.projectId?._id ?? v.projectId)))
        const sorted = mine.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setProjectVersions(sorted)
        const first = sorted[0]
        if (first) {
          setSelectedVersionId(first._id)
          getVersionComments(first._id).then(setComments).catch(console.error)
        }
      }).catch(console.error)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedVersionId) getVersionComments(selectedVersionId).then(setComments).catch(console.error)
  }, [selectedVersionId])

  const latestVersionId = projectVersions[0]?._id ?? null
  const selectedVersion = projectVersions.find((v) => String(v._id) === String(selectedVersionId));
  const versionComments = comments.filter((c) => String(c.versionId) === String(selectedVersionId));
  const isPending = selectedVersion?.status === 'Pending Review';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [versionComments]);

  const handleSend = () => {
    const text = newComment.trim();
    if (!text) return;
    const next = {
      id: Date.now(),
      versionId: selectedVersionId,
      projectId: selectedVersion?.projectId ?? null,
      author: 'Priya K',
      initials: 'PK',
      role: 'Client',
      date: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      comment: text,
      resolved: false,
    };
    setComments((prev) => [...prev, next]);
    setNewComment('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#0F1219]">
      <div className="flex gap-5 h-[calc(100vh-120px)]">

        {/* Left sidebar: version list */}
        <div className="w-56 flex-shrink-0 bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#E0E0E0] dark:border-[#1F2937]">
            <h3 className="font-semibold text-[13px] font-sora text-[#0F2340] dark:text-white">Versions</h3>
            <p className="text-[11px] text-[#777777] mt-0.5">{clientProjectName || 'My Project'}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {projectVersions.map((v) => (
              <button
                key={String(v._id)}
                onClick={() => { setSelectedVersionId(v._id); setActionTaken(null); }}
                className={`w-full text-left px-4 py-3.5 border-b border-[#F0F4F8] dark:border-[#1F2937] transition-colors ${String(selectedVersionId) === String(v._id) ? 'bg-[#D6E8F7] dark:bg-[#1B4F8A]/20' : 'hover:bg-[#F7F9FC] dark:hover:bg-[#0F1219]'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-semibold text-[#0F2340] dark:text-white">{v.versionLabel ?? v.version}</span>
                  {String(v._id) === String(latestVersionId) && (
                    <span className="text-[9px] bg-[#1B4F8A] text-white px-1.5 py-0.5 rounded-full font-medium">Latest</span>
                  )}
                </div>
                <StatusBadge status={v.status} />
                <p className="text-[10px] text-[#777777] mt-1.5">
                  {v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Version detail card */}
          {selectedVersion && (
            <div className="bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-full bg-[#0F2340] flex items-center justify-center">
                      <span className="text-white text-[12px] font-bold">{selectedVersion.version}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold font-sora text-[15px] text-[#0F2340] dark:text-white">Version {selectedVersion.version}</h2>
                        <StatusBadge status={selectedVersion.status} />
                      </div>
                      <p className="text-[11px] text-[#777777]">
                        {new Date(selectedVersion.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} &bull; {selectedVersion.designer}
                      </p>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#333333] dark:text-gray-300 mt-2 leading-relaxed">{selectedVersion.changes}</p>
                  {selectedVersion.note && (
                    <p className="text-[12px] italic text-[#777777] mt-1.5">"{selectedVersion.note}"</p>
                  )}
                </div>

                {isPending && !actionTaken && (
                  <div className="flex gap-2.5 flex-shrink-0">
                    <button
                      onClick={() => setActionTaken('approved')}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-[12px] font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button
                      onClick={() => setActionTaken('changes')}
                      className="flex items-center gap-1.5 bg-[#E07B20] hover:bg-orange-600 text-white text-[12px] font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <RotateCcw size={13} /> Request Changes
                    </button>
                  </div>
                )}

                {actionTaken === 'approved' && (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <Check size={14} />
                    <span className="text-[12px] font-medium">Approved</span>
                  </div>
                )}

                {actionTaken === 'changes' && (
                  <div className="flex items-center gap-2 text-[#E07B20] bg-[#FFF3E0] border border-orange-200 rounded-lg px-3 py-2">
                    <RotateCcw size={14} />
                    <span className="text-[12px] font-medium">Changes Requested</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comment thread */}
          <div className="flex-1 bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm flex flex-col overflow-hidden min-h-0">
            <div className="p-4 border-b border-[#E0E0E0] dark:border-[#1F2937] flex items-center justify-between">
              <h3 className="font-semibold font-sora text-[14px] text-[#0F2340] dark:text-white">
                Comments &mdash; {selectedVersion?.version}
              </h3>
              <span className="text-[11px] text-[#777777]">{versionComments.length} comment{versionComments.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {versionComments.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[13px] text-[#777777]">No comments yet for this version. Be the first to share feedback.</p>
                </div>
              )}
              {versionComments.map((c) => (
                <CommentBubble key={c.id} comment={c} />
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#E0E0E0] dark:border-[#1F2937]">
              <div className="flex gap-2.5 items-end">
                <Avatar initials="PK" isClient={true} />
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Share feedback on this design version..."
                    rows={2}
                    className="w-full resize-none bg-[#F7F9FC] dark:bg-[#0F1219] border border-[#E0E0E0] dark:border-[#1F2937] rounded-xl px-4 py-2.5 text-[13px] text-[#333333] dark:text-gray-200 placeholder-[#777777] focus:outline-none focus:border-[#1B4F8A] pr-12"
                  />
                  <button
                    onClick={handleSend}
                    className="absolute right-3 bottom-3 w-7 h-7 rounded-lg bg-[#1B4F8A] hover:bg-[#2E6DA4] flex items-center justify-center transition-colors"
                  >
                    <Send size={13} className="text-white" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-[#777777] mt-1.5 pl-10">Press Enter to send &bull; Shift+Enter for new line</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
