import { useState, useRef, useEffect } from 'react';
import { FileText, Download, Eye, ChevronDown, Plus, X, Upload, CheckCircle } from 'lucide-react';
import { getDocuments, uploadDocument } from '../api/documents';
import { resolveFileUrl } from '../api/client';
import { getProjects } from '../api/projects';

/* ─── helpers ─── */
const TYPE_PREFIXES = { Quotation: 'QT', Invoice: 'INV', Contract: 'CTR', 'Design Report': 'RPT' };
const TYPE_STATUSES = {
  Quotation:      ['Draft', 'Pending', 'Accepted'],
  Invoice:        ['Pending', 'Paid', 'Overdue'],
  Contract:       ['Active', 'Pending'],
  'Design Report':['Draft', 'Sent'],
};

function genNumber(type, existingDocs) {
  const prefix = TYPE_PREFIXES[type] ?? 'DOC';
  const same = existingDocs.filter(d => d.type === type);
  const next = (same.length + 1).toString().padStart(3, '0');
  return `${prefix}-2026-${next}`;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── PDF viewer modal ─── */
function PdfModal({ doc, onClose }) {
  const src = doc.fileUrl ?? '/blank.pdf';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
        style={{ height: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0] shrink-0">
          <div>
            <p className="font-semibold font-sora text-[15px] text-[#0F2340]">{doc.type}</p>
            <p className="font-mono text-[12px] text-[#777777] mt-0.5">
              {doc.number} &bull; {doc.project}
              {doc.fileName && <span className="ml-2 text-[#1B4F8A]">({doc.fileName})</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={src}
              download={doc.fileName ?? `${doc.number}.pdf`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4F8A] hover:bg-[#2E6DA4] text-white text-[12px] font-medium rounded-lg transition-colors"
            >
              <Download size={12} /> Download
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#F7F9FC] hover:bg-[#E0E0E0] flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-[#777777]" />
            </button>
          </div>
        </div>
        <iframe src={src} title={doc.number} className="flex-1 w-full" style={{ border: 'none' }} />
      </div>
    </div>
  );
}

/* ─── Generate / upload modal ─── */
function GenerateDocModal({ initialType, allDocs, projects, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType]           = useState(initialType);
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount]       = useState('');
  const [pages, setPages]         = useState('');
  const [status, setStatus]       = useState(TYPE_STATUSES[initialType][0]);
  const [file, setFile]           = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [saved, setSaved]         = useState(false);
  const fileRef = useRef();

  const selectedProject = projects.find(p => String(p.id ?? p._id) === String(projectId));

  function handleTypeChange(t) {
    setType(t);
    setStatus(TYPE_STATUSES[t][0]);
  }

  function handleFile(f) {
    if (f) setFile(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleSubmit() {
    if (!projectId || !file) return;
    setSaving(true);
    try {
      const number = genNumber(type, allDocs);
      const data = {
        type,
        documentNumber: number,
        projectId,
        issueDate: today,
        status,
        ...(type === 'Design Report'
          ? { pages: pages || undefined }
          : { amountPaise: amount ? String(Math.round(Number(amount.replace(/,/g, '')) * 100)) : '0' }),
      };
      const saved = await uploadDocument(data, file);
      // Build a row shape matching what the table expects
      const newDoc = {
        id: saved._id,
        type,
        number,
        project: selectedProject?.name ?? '',
        client:  selectedProject?.client ?? selectedProject?.clientId?.name ?? '',
        date:    today,
        status,
        fileUrl: saved.fileUrl ?? saved.storagePath ?? '/blank.pdf',
        fileName: file.name,
        ...(type === 'Design Report'
          ? { pages: pages ? Number(pages) : undefined }
          : { amount: amount ? `₹${Number(amount.replace(/,/g, '')).toLocaleString('en-IN')}` : undefined }),
      };
      setSaved(true);
      setTimeout(() => { onSave(newDoc); onClose(); }, 900);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const [saving, setSaving] = useState(false);

  const isDesignReport = type === 'Design Report';
  const canSubmit = projectId && file;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0E0E0]">
          <div>
            <h2 className="font-sora font-bold text-[17px] text-[#0F2340]">Upload Document</h2>
            <p className="text-[12px] text-[#777777] mt-0.5">Fill in the details and attach your file</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#F7F9FC] hover:bg-[#E0E0E0] flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-[#777777]" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Document type */}
          <div>
            <label className="block text-[11px] font-semibold text-[#555] uppercase tracking-wide mb-1.5">Document Type</label>
            <div className="flex gap-2 flex-wrap">
              {['Quotation', 'Invoice', 'Contract', 'Design Report'].map(t => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                    type === t
                      ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]'
                      : 'bg-white text-[#333333] border-[#E0E0E0] hover:border-[#2E6DA4] hover:text-[#2E6DA4]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          <div>
            <label className="block text-[11px] font-semibold text-[#555] uppercase tracking-wide mb-1.5">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-[#E0E0E0] rounded-lg outline-none focus:border-[#1B4F8A] text-[#333333] bg-white"
            >
              <option value="">Select a project…</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Client (auto-filled) */}
          {selectedProject && (
            <div>
              <label className="block text-[11px] font-semibold text-[#555] uppercase tracking-wide mb-1.5">Client</label>
              <div className="px-3 py-2 text-[13px] bg-[#F7F9FC] border border-[#E0E0E0] rounded-lg text-[#333333]">
                {selectedProject.client}
              </div>
            </div>
          )}

          {/* Amount OR Pages */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#555] uppercase tracking-wide mb-1.5">
                {isDesignReport ? 'Pages' : 'Amount (₹)'}
              </label>
              <input
                type="number"
                placeholder={isDesignReport ? 'e.g. 24' : 'e.g. 850000'}
                value={isDesignReport ? pages : amount}
                onChange={e => isDesignReport ? setPages(e.target.value) : setAmount(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#E0E0E0] rounded-lg outline-none focus:border-[#1B4F8A] text-[#333333]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#555] uppercase tracking-wide mb-1.5">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#E0E0E0] rounded-lg outline-none focus:border-[#1B4F8A] text-[#333333] bg-white"
              >
                {TYPE_STATUSES[type].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-[11px] font-semibold text-[#555] uppercase tracking-wide mb-1.5">
              File <span className="text-red-500">*</span>
            </label>
            {file ? (
              <div className="flex items-center gap-3 p-3 bg-[#F0FDF4] border border-green-200 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#333333] truncate">{file.name}</p>
                  <p className="text-[11px] text-[#777777]">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="w-6 h-6 rounded-full hover:bg-green-200 flex items-center justify-center transition-colors"
                >
                  <X size={12} className="text-green-700" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-[#1B4F8A] bg-[#D6E8F7]'
                    : 'border-[#D0D5DD] bg-[#F7F9FC] hover:border-[#2E6DA4] hover:bg-[#EEF5FB]'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#D6E8F7] flex items-center justify-center mb-3">
                  <Upload size={18} className="text-[#1B4F8A]" />
                </div>
                <p className="text-[13px] font-semibold text-[#0F2340]">Click to upload or drag & drop</p>
                <p className="text-[11px] text-[#777777] mt-1">PDF, DOC, DOCX — max 20 MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={e => handleFile(e.target.files[0])}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E0E0E0] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-[#333333] border border-[#E0E0E0] hover:bg-[#F7F9FC] transition-colors"
          >
            Cancel
          </button>
          {saved ? (
            <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-100 text-green-700 font-semibold text-[13px]">
              <CheckCircle size={15} /> Saved!
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors ${
                canSubmit && !saving
                  ? 'bg-[#1B4F8A] hover:bg-[#2E6DA4] cursor-pointer'
                  : 'bg-[#B0B8C4] cursor-not-allowed'
              }`}
            >
              {saving ? 'Uploading…' : 'Upload & Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Badge helpers ─── */
const DOC_TYPES = ['All', 'Quotation', 'Invoice', 'Contract', 'Design Report'];

const typeBadge = (type) => {
  switch (type) {
    case 'Quotation':     return 'bg-[#D6E8F7] text-[#1B4F8A]';
    case 'Invoice':       return 'bg-green-100 text-green-700';
    case 'Contract':      return 'bg-[#0F2340] text-white';
    case 'Design Report': return 'bg-purple-100 text-purple-700';
    default:              return 'bg-gray-100 text-gray-600';
  }
};

const statusBadge = (status) => {
  switch (status) {
    case 'Accepted':
    case 'Paid':    return 'bg-green-100 text-green-700';
    case 'Pending':
    case 'Draft':   return 'bg-[#FFF3E0] text-[#E07B20]';
    case 'Overdue': return 'bg-red-100 text-red-600';
    case 'Active':
    case 'Sent':    return 'bg-[#D6E8F7] text-[#1B4F8A]';
    default:        return 'bg-gray-100 text-gray-600';
  }
};

function StatCard({ label, count, color }) {
  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5 flex flex-col gap-1">
      <p className="text-[12px] text-[#777777] font-medium uppercase tracking-wide">{label}</p>
      <p className={`font-sora text-3xl font-bold ${color}`}>{count}</p>
    </div>
  );
}

function docToRow(doc) {
  return {
    id:       doc._id ?? doc.id,
    type:     doc.type,
    number:   doc.documentNumber ?? doc.number ?? '',
    project:  doc.projectId?.name ?? doc.project ?? '',
    client:   doc.clientId?.name ?? doc.client ?? '',
    date:     doc.issueDate ? doc.issueDate.slice(0, 10) : (doc.date ?? ''),
    status:   doc.status ?? '',
    amount:   doc.amountPaise ? `₹${Math.round(doc.amountPaise / 100).toLocaleString('en-IN')}` : doc.amount,
    pages:    doc.pages,
    version:  doc.versionLabel ?? doc.version,
    fileUrl:  resolveFileUrl(doc.fileUrl ?? doc.storagePath ?? ''),
    fileName: doc.fileName ?? '',
  };
}

/* ─── Page ─── */
export default function DesignerDocuments() {
  const [localDocs, setLocalDocs]       = useState([]);
  const [projects, setProjects]         = useState([]);
  const [activeType, setActiveType]     = useState('All');
  const [showDropdown, setShowDropdown] = useState(false);
  const [previewDoc, setPreviewDoc]     = useState(null);
  const [generateType, setGenerateType] = useState(null);

  useEffect(() => {
    getDocuments()
      .then(docs => setLocalDocs(docs.map(docToRow)))
      .catch(console.error);
    getProjects()
      .then(ps => setProjects(ps.map(p => ({
        id: p._id,
        name: p.name,
        client: p.clientId?.name ?? '',
      }))))
      .catch(console.error);
  }, []);

  const filtered = activeType === 'All'
    ? localDocs
    : localDocs.filter(d => d.type === activeType);

  const countOf = (type) => localDocs.filter(d => d.type === type).length;

  function openGenerate(type) {
    setShowDropdown(false);
    setGenerateType(type);
  }

  function handleSave(newDoc) {
    setLocalDocs(prev => [newDoc, ...prev]);
    setGenerateType(null);
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-sora text-2xl font-bold text-[#0F2340]">Documents</h1>
          <p className="text-[13px] text-[#777777] mt-1">
            Manage quotations, invoices, contracts and design reports
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(v => !v)}
            className="flex items-center gap-2 bg-[#1B4F8A] hover:bg-[#2E6DA4] text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            Upload New
            <ChevronDown size={13} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E0E0E0] rounded-xl shadow-lg z-20 overflow-hidden">
              {['Quotation', 'Invoice', 'Contract', 'Design Report'].map(opt => (
                <button
                  key={opt}
                  onClick={() => openGenerate(opt)}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-[#333333] hover:bg-[#D6E8F7] hover:text-[#1B4F8A] transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Quotations"     count={countOf('Quotation')}     color="text-[#1B4F8A]" />
        <StatCard label="Invoices"       count={countOf('Invoice')}       color="text-green-600" />
        <StatCard label="Contracts"      count={countOf('Contract')}      color="text-[#0F2340]" />
        <StatCard label="Design Reports" count={countOf('Design Report')} color="text-purple-600" />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {DOC_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
              activeType === t
                ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]'
                : 'bg-white text-[#333333] border-[#E0E0E0] hover:border-[#2E6DA4] hover:text-[#2E6DA4]'
            }`}
          >
            {t}
            {t !== 'All' && <span className="ml-1.5 text-[10px] opacity-75">({countOf(t)})</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#0F2340] text-white">
                {['Type', 'Number', 'Project', 'Client', 'Date', 'Amount / Pages', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, idx) => {
                const amountOrPages = doc.amount
                  ? doc.amount
                  : doc.pages
                  ? `${doc.pages} pages`
                  : '—';

                return (
                  <tr
                    key={doc.id}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#F7F9FC]'} hover:bg-[#D6E8F7] transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${typeBadge(doc.type)}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[12px] text-[#333333] tracking-tight">{doc.number}</span>
                    </td>
                    <td className="px-4 py-3 text-[#0F2340] font-medium whitespace-nowrap">{doc.project}</td>
                    <td className="px-4 py-3 text-[#333333] whitespace-nowrap">{doc.client}</td>
                    <td className="px-4 py-3 text-[#777777] whitespace-nowrap">
                      {doc.fileUrl ? fmtDate(doc.date) : doc.date}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#333333] whitespace-nowrap">
                      {amountOrPages}
                      {doc.version && <span className="ml-1.5 text-[10px] text-[#777777]">{doc.version}</span>}
                      {doc.fileName && <span className="ml-1.5 text-[10px] text-[#1B4F8A] font-medium">Uploaded</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusBadge(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="flex items-center gap-1 text-[12px] font-medium text-[#1B4F8A] border border-[#1B4F8A] px-3 py-1 rounded-lg hover:bg-[#D6E8F7] transition-colors whitespace-nowrap"
                        >
                          <Eye size={12} /> View
                        </button>
                        <a
                          href={doc.fileUrl ?? '/blank.pdf'}
                          download={doc.fileName ?? `${doc.number}.pdf`}
                          className="flex items-center gap-1 text-[12px] font-medium bg-[#1B4F8A] text-white px-3 py-1 rounded-lg hover:bg-[#2E6DA4] transition-colors whitespace-nowrap"
                        >
                          <Download size={12} /> Download
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-[#777777]">
              <FileText size={36} className="mb-3 opacity-25" />
              <p className="text-[13px]">No documents in this category.</p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#E0E0E0] bg-[#F7F9FC] text-[12px] text-[#777777]">
          Showing {filtered.length} of {localDocs.length} documents
        </div>
      </div>

      {previewDoc && <PdfModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}

      {generateType && (
        <GenerateDocModal
          initialType={generateType}
          allDocs={localDocs}
          projects={projects}
          onClose={() => setGenerateType(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
