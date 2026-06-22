import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Search, Paperclip, X, Image as ImageIcon, FileText, File, MoreVertical, Trash2, AlertTriangle, Images, Download, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getUsers } from '../api/users'
import { getChatThreads, getChatMessages, sendMessage as apiSendMessage, clearChat as apiClearChat, uploadChatFile } from '../api/chat'
import { connectSocket } from '../socket/socket'

function timeNow() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)  return d.toLocaleDateString('en-IN', { weekday: 'short' })
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* Parse a message content string into { kind, data } */
function parseContent(text) {
  if (!text || text[0] !== '{') return null
  try {
    const obj = JSON.parse(text)
    if (obj.__attach) return obj
  } catch {}
  return null
}

/* Preview text shown in the contact list */
function attachPreview(text) {
  const p = parseContent(text)
  if (!p) return text
  const caption = p.text ? ` — ${p.text}` : ''
  if (p.kind === 'image') return `📷 Image${caption}`
  return `📎 ${p.name}${caption}`
}

function docIcon(mime) {
  if (!mime) return File
  if (mime.includes('pdf'))   return FileText
  if (mime.includes('image')) return ImageIcon
  return File
}

function RoleTag({ role }) {
  const COLOR = {
    Admin:      'bg-[#E8F0FB] text-primary',
    Supervisor: 'bg-[#FFF3E8] text-accent',
    Designer:   'bg-[#F5F3FF] text-[#7C3AED]',
    Client:     'bg-[#F0FDF4] text-[#15803d]',
    Vendor:     'bg-[#FFF9E6] text-[#B45309]',
    Worker:     'bg-[#F7F9FC] text-muted',
  }
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${COLOR[role] ?? COLOR.Worker}`}>
      {role}
    </span>
  )
}

/* ── Message bubble content ── */
function MessageContent({ text, isMine }) {
  const attach = parseContent(text)

  if (attach) {
    const captionColor = isMine ? 'text-white/90' : 'text-body dark:text-slate-200'
    const cardBg       = isMine ? 'bg-white/15' : 'bg-[#F0F2F5] dark:bg-[#1F2937]'
    const nameColor    = isMine ? 'text-white' : 'text-body dark:text-slate-200'
    const sizeColor    = isMine ? 'text-white/60' : 'text-muted'
    const src          = attach.url || attach.data

    if (attach.kind === 'image') {
      return (
        <div className="space-y-2">
          <a href={src} target="_blank" rel="noopener noreferrer">
            <img
              src={src}
              alt={attach.name}
              className="max-w-[260px] max-h-[200px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
            />
          </a>
          {attach.text && (
            <p className={`text-[13px] leading-relaxed ${captionColor}`}>{attach.text}</p>
          )}
        </div>
      )
    }

    const DocIcon = docIcon(attach.mime)
    return (
      <div className="space-y-1.5">
        <a
          href={src || undefined}
          target="_blank"
          rel="noopener noreferrer"
          download={attach.name}
          className={src ? 'cursor-pointer' : 'cursor-default pointer-events-none'}
        >
          <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl ${cardBg} min-w-[180px] max-w-[260px] ${src ? 'hover:opacity-80 transition-opacity' : ''}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isMine ? 'bg-white/20' : 'bg-light-blue/60 dark:bg-[#1B2D4A]'}`}>
              <DocIcon size={16} className={isMine ? 'text-white' : 'text-primary dark:text-[#5B9BD5]'} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[12px] font-semibold truncate ${nameColor}`}>{attach.name}</p>
              <p className={`text-[10px] mt-0.5 ${sizeColor}`}>{fmtSize(attach.size)}{src ? ' · tap to open' : ''}</p>
            </div>
            {src && <Download size={13} className={isMine ? 'text-white/60 shrink-0' : 'text-muted shrink-0'} />}
          </div>
        </a>
        {attach.text && (
          <p className={`text-[13px] leading-relaxed ${captionColor}`}>{attach.text}</p>
        )}
      </div>
    )
  }

  return <span className="text-[13px] leading-relaxed whitespace-pre-wrap">{text}</span>
}

export default function ChatPage() {
  const { user } = useAuth()
  const me = {
    id:       String(user?.id ?? user?._id ?? ''),
    name:     user?.name     ?? '',
    role:     user?.role     ?? '',
    initials: user?.initials ?? '',
  }

  const [contacts,     setContacts]     = useState([])
  const [search,       setSearch]       = useState('')
  const [selectedId,   setSelectedId]   = useState(null)
  const [thread,       setThread]       = useState([])
  const [input,        setInput]        = useState('')
  const [previews,     setPreviews]     = useState({})
  const [unread,       setUnread]       = useState({})
  const [attachment,    setAttachment]    = useState(null)
  const [attachErr,     setAttachErr]     = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [confirmClear,  setConfirmClear]  = useState(false)
  const [clearing,      setClearing]      = useState(false)
  const [showMedia,     setShowMedia]     = useState(false)

  // Compute media/docs from thread for the media panel
  const allAttachments = thread
    .map(m => { const a = parseContent(m.text); return a ? { ...a, sentAt: m.sentAt, from: m.from } : null })
    .filter(Boolean)
  const mediaImages = allAttachments.filter(a => a.kind === 'image')
  const mediaDocs   = allAttachments.filter(a => a.kind !== 'image')

  const bottomRef     = useRef(null)
  const inputRef      = useRef(null)
  const fileInputRef  = useRef(null)
  const selectedIdRef = useRef(null)
  const menuRef       = useRef(null)

  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  // ── Load contacts + thread summaries ─────────────────────────────────────────
  useEffect(() => {
    Promise.all([getUsers(), getChatThreads()])
      .then(([users, threads]) => {
        const normalized = users
          .filter(u => String(u._id) !== me.id && u.role !== 'Worker')
          .map(u => ({ ...u, id: String(u._id), initials: u.initials ?? u.name?.slice(0, 2) ?? '?' }))
        setContacts(normalized)

        const map = {}
        threads.forEach(t => {
          let otherId = String(t.user?._id ?? '')
          if (!otherId && t.threadKey) {
            otherId = t.threadKey.split('_').find(p => p !== me.id) ?? ''
          }
          if (!otherId) return
          const lm = t.lastMessage
          if (!lm?.content) return
          map[otherId] = {
            preview: lm.content,
            sentAt:  lm.sentAt ?? null,
            fromMe:  String(lm.senderId?._id ?? lm.senderId) === me.id,
          }
        })
        setPreviews(map)

        const withMsg = normalized.filter(c => map[c.id]?.sentAt)
        withMsg.sort((a, b) => new Date(map[b.id].sentAt) - new Date(map[a.id].sentAt))
        const first = withMsg[0] ?? normalized[0]
        if (first) setSelectedId(first.id)
      })
      .catch(console.error)
  }, [])

  // ── Fetch thread when contact changes ────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) return
    setUnread(prev => { const n = { ...prev }; delete n[selectedId]; return n })
    getChatMessages(selectedId, { limit: 50 })
      .then(msgs => {
        const rows = msgs.map(m => ({
          id:     String(m._id),
          from:   String(m.senderId?._id ?? m.senderId),
          text:   m.content,
          time:   fmtTime(m.sentAt),
          sentAt: m.sentAt,
        }))
        setThread(rows)
        if (rows.length) {
          const last = rows[rows.length - 1]
          setPreviews(p => ({
            ...p,
            [selectedId]: { preview: last.text, sentAt: last.sentAt, fromMe: last.from === me.id },
          }))
        }
      })
      .catch(console.error)
  }, [selectedId])

  // ── Socket: real-time incoming ───────────────────────────────────────────────
  useEffect(() => {
    const socket = connectSocket()

    function onMessage(msg) {
      const senderId   = String(msg.senderId?._id ?? msg.senderId)
      const currentSel = selectedIdRef.current
      const parts      = (msg.threadKey ?? '').split('_')
      const otherParty = parts.find(p => p !== me.id) ?? senderId

      const previewContact = senderId === me.id ? otherParty : senderId
      if (previewContact) {
        setPreviews(p => ({
          ...p,
          [previewContact]: { preview: msg.content, sentAt: msg.sentAt ?? new Date().toISOString(), fromMe: senderId === me.id },
        }))
      }

      const inThread = (senderId === currentSel || otherParty === currentSel) && currentSel
      if (inThread) {
        setThread(prev => {
          if (prev.some(m => m.id === String(msg._id))) return prev
          return [...prev, {
            id:     String(msg._id),
            from:   senderId,
            text:   msg.content,
            time:   fmtTime(msg.sentAt ?? new Date().toISOString()),
            sentAt: msg.sentAt,
          }]
        })
      } else if (senderId !== me.id) {
        setUnread(prev => ({ ...prev, [senderId]: (prev[senderId] ?? 0) + 1 }))
      }
    }

    socket.on('chat:message', onMessage)
    return () => { socket.off('chat:message', onMessage) }
  }, [me.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread.length, selectedId])

  // ── File selection — upload immediately, store URL ──────────────────────────
  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setAttachErr('')

    const isImage = file.type.startsWith('image/')
    if (file.size > 10 * 1024 * 1024) {
      setAttachErr('File too large — max 10 MB')
      return
    }

    // Show local preview immediately while uploading
    if (isImage) {
      const reader = new FileReader()
      reader.onload = ev => setAttachment({ kind: 'image', name: file.name, size: file.size, mime: file.type, data: ev.target.result, url: null })
      reader.readAsDataURL(file)
    } else {
      setAttachment({ kind: 'doc', name: file.name, size: file.size, mime: file.type, url: null })
    }

    setUploadingFile(true)
    try {
      const result = await uploadChatFile(file)
      setAttachment(prev => prev ? { ...prev, url: result.url } : null)
    } catch (err) {
      setAttachErr('Upload failed: ' + (err.message || 'please try again'))
      setAttachment(null)
    } finally {
      setUploadingFile(false)
    }
  }

  // ── Send ─────────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.trim()
    if ((!text && !attachment) || !selectedId) return

    let content
    if (attachment) {
      content = JSON.stringify({ __attach: true, ...attachment, text })
    } else {
      content = text
    }

    // Optimistic
    const tempId = `tmp-${Date.now()}`
    const now    = new Date().toISOString()
    setThread(t => [...t, { id: tempId, from: me.id, text: content, time: timeNow(), sentAt: now }])
    setPreviews(p => ({ ...p, [selectedId]: { preview: content, sentAt: now, fromMe: true } }))
    setInput('')
    setAttachment(null)
    inputRef.current?.focus()
    // reset textarea height
    if (inputRef.current) { inputRef.current.style.height = 'auto' }

    try {
      const msg    = await apiSendMessage(selectedId, content)
      const sentAt = msg.sentAt ?? now
      setThread(t => t.map(m => m.id === tempId
        ? { id: String(msg._id), from: me.id, text: msg.content, time: fmtTime(sentAt), sentAt }
        : m
      ))
    } catch {
      setThread(t => t.filter(m => m.id !== tempId))
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handler(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  async function handleClearChat() {
    if (!selectedId) return
    setClearing(true)
    try {
      await apiClearChat(selectedId)
      setThread([])
      setPreviews(p => { const n = { ...p }; delete n[selectedId]; return n })
    } catch (err) { console.error(err) }
    finally { setClearing(false); setConfirmClear(false) }
  }

  // ── Filtered + sorted contacts ───────────────────────────────────────────────
  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    const aU = unread[a.id] ?? 0, bU = unread[b.id] ?? 0
    if (aU !== bU) return bU - aU
    const aT = previews[a.id]?.sentAt ? new Date(previews[a.id].sentAt) : null
    const bT = previews[b.id]?.sentAt ? new Date(previews[b.id].sentAt) : null
    if (aT && bT) return bT - aT
    if (aT) return -1
    if (bT) return 1
    return a.name.localeCompare(b.name)
  })

  const selectedUser = contacts.find(c => c.id === selectedId)

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">

      {/* ── LEFT: Contact list ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-72 shrink-0 border-r border-[#F0F2F5] dark:border-[#1F2937] flex-col">

        <div className="px-4 pt-4 pb-3 border-b border-[#F0F2F5] dark:border-[#1F2937]">
          <h2 className="font-sora font-bold text-[15px] text-body dark:text-white mb-3">
            Messages
            {Object.values(unread).reduce((s, n) => s + n, 0) > 0 && (
              <span className="ml-2 min-w-[18px] h-[18px] rounded-full bg-[#dc2626] text-white text-[10px] font-bold inline-flex items-center justify-center px-1">
                {Object.values(unread).reduce((s, n) => s + n, 0)}
              </span>
            )}
          </h2>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search people…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[12px] bg-[#F7F9FC] dark:bg-[#0F1219] border border-[#EFEFEF] dark:border-[#1F2937] rounded-lg focus:outline-none focus:border-primary text-body dark:text-slate-200 placeholder:text-muted transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {sorted.map(contact => {
            const preview    = previews[contact.id]
            const hasUnread  = (unread[contact.id] ?? 0) > 0
            const active     = contact.id === selectedId
            const previewTxt = preview?.preview ? attachPreview(preview.preview) : ''
            return (
              <button
                key={contact.id}
                onClick={() => {
                  setSelectedId(contact.id)
                  setUnread(p => { const n = { ...p }; delete n[contact.id]; return n })
                }}
                className={[
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100',
                  active ? 'bg-light-blue/40 dark:bg-[#1B2D4A]/60' : 'hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236]',
                ].join(' ')}
              >
                <div className="relative shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${contact.role === 'Vendor' ? 'bg-[#B45309]' : 'bg-mid-blue'}`}>
                    <span className="text-[11px] font-semibold text-white">{contact.initials}</span>
                  </div>
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#dc2626] border-2 border-white dark:border-[#141B27]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-[13px] font-semibold truncate ${hasUnread ? 'text-body dark:text-white' : active ? 'text-primary dark:text-[#5B9BD5]' : 'text-body dark:text-slate-200'}`}>
                      {contact.name}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {preview?.sentAt && (
                        <span className="text-[10px] text-muted dark:text-slate-500">{fmtTime(preview.sentAt)}</span>
                      )}
                      {hasUnread && (
                        <span className="min-w-[18px] h-[18px] rounded-full bg-[#dc2626] text-white text-[10px] font-bold flex items-center justify-center px-1">
                          {unread[contact.id]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-0.5">
                    <RoleTag role={contact.role} />
                    {previewTxt ? (
                      <p className={`text-[11px] truncate flex-1 ${hasUnread ? 'font-semibold text-body dark:text-white' : 'text-muted dark:text-slate-500'}`}>
                        {preview.fromMe && <span className="text-primary dark:text-[#5B9BD5]">You: </span>}
                        {previewTxt}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted dark:text-slate-500 truncate flex-1 italic">No messages yet</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}

          {sorted.length === 0 && (
            <p className="text-[12px] text-muted dark:text-slate-500 text-center px-4 py-8">No contacts found</p>
          )}
        </div>
      </div>

      {/* ── RIGHT: Chat window ──────────────────────────────────────────────── */}
      {selectedUser ? (
        <div className="flex-1 flex min-w-0">
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#F0F2F5] dark:border-[#1F2937] shrink-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-mid-blue">
              <span className="text-[11px] font-semibold text-white">{selectedUser.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-sora font-semibold text-[14px] text-body dark:text-white">{selectedUser.name}</p>
                <RoleTag role={selectedUser.role} />
              </div>
              <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">
                {selectedUser.phone ? `${selectedUser.phone}` : '○ Offline'}
              </p>
            </div>

            {/* Media viewer toggle */}
            <button
              onClick={() => setShowMedia(v => !v)}
              title="Photos & Files"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${showMedia ? 'bg-[#D6E8F7] text-primary' : 'text-muted hover:text-body hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937]'}`}>
              <Images size={16} strokeWidth={1.75} />
            </button>

            {/* ⋯ menu */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-body hover:bg-[#F0F2F5] dark:hover:bg-[#1F2937] transition-colors">
                <MoreVertical size={16} strokeWidth={1.75} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-44 bg-white dark:bg-[#1C2538] border border-[#EFEFEF] dark:border-[#2A3547] rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                  <button
                    onClick={() => { setMenuOpen(false); setConfirmClear(true) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#dc2626] hover:bg-[#FEF2F2] dark:hover:bg-[#2D0808]/60 transition-colors">
                    <Trash2 size={14} strokeWidth={1.75} />
                    Clear chat history
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {thread.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <div className="w-14 h-14 rounded-full bg-[#F7F9FC] dark:bg-[#1C2538] flex items-center justify-center">
                  <span className="text-[13px] font-bold text-muted">{selectedUser.initials}</span>
                </div>
                <p className="text-[13px] font-medium text-body dark:text-white">{selectedUser.name}</p>
                <p className="text-[12px] text-muted dark:text-slate-500">No messages yet — say hi! 👋</p>
              </div>
            ) : (
              thread.map((msg, idx) => {
                const isMine  = msg.from === me.id
                const prevMsg = thread[idx - 1]
                const thisDay = msg.sentAt ? new Date(msg.sentAt).toDateString() : ''
                const prevDay = prevMsg?.sentAt ? new Date(prevMsg.sentAt).toDateString() : ''
                const showDate = !prevMsg || thisDay !== prevDay
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && thisDay && (
                      <div className="flex items-center gap-2 my-2">
                        <div className="flex-1 h-px bg-[#F0F2F5] dark:bg-[#1F2937]" />
                        <span className="text-[10px] text-muted dark:text-slate-500 font-medium">
                          {new Date(msg.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <div className="flex-1 h-px bg-[#F0F2F5] dark:bg-[#1F2937]" />
                      </div>
                    )}
                    <div className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-mid-blue flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[9px] font-semibold text-white">{selectedUser.initials}</span>
                        </div>
                      )}
                      <div className={`max-w-[65%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={[
                          'px-3.5 py-2.5 rounded-2xl',
                          isMine
                            ? 'bg-primary text-white rounded-tr-sm'
                            : 'bg-[#F7F9FC] dark:bg-[#1C2538] text-body dark:text-slate-200 rounded-tl-sm',
                        ].join(' ')}>
                          <MessageContent text={msg.text} isMine={isMine} />
                        </div>
                        <span className="text-[10px] text-muted dark:text-slate-500 mt-1">{msg.time}</span>
                      </div>
                    </div>
                  </React.Fragment>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Compose area ── */}
          <div className="shrink-0 border-t border-[#F0F2F5] dark:border-[#1F2937]">

            {/* Attachment preview */}
            {attachment && (
              <div className="px-4 pt-3 pb-1 flex items-start gap-2">
                {attachment.kind === 'image' ? (
                  <div className="relative group">
                    <img src={attachment.data || attachment.url} alt={attachment.name} className="h-20 rounded-xl object-cover border border-[#EFEFEF] dark:border-[#1F2937]" />
                    {uploadingFile && (
                      <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                        <Loader2 size={16} className="text-white animate-spin" />
                      </div>
                    )}
                    <button onClick={() => { setAttachment(null); setUploadingFile(false) }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0F2340] text-white flex items-center justify-center hover:bg-[#dc2626] transition-colors shadow">
                      <X size={10} strokeWidth={2.5} />
                    </button>
                    <p className="text-[10px] text-muted dark:text-slate-500 mt-1 truncate max-w-[140px]">
                      {uploadingFile ? 'Uploading…' : attachment.name}
                    </p>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2.5 bg-[#F0F2F5] dark:bg-[#1F2937] rounded-xl px-3.5 py-2.5 border border-[#EFEFEF] dark:border-[#2A3547]">
                    <div className="w-8 h-8 rounded-lg bg-light-blue/60 dark:bg-[#1B2D4A] flex items-center justify-center shrink-0">
                      {uploadingFile
                        ? <Loader2 size={14} strokeWidth={1.75} className="text-primary animate-spin" />
                        : <FileText size={14} strokeWidth={1.75} className="text-primary dark:text-[#5B9BD5]" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-body dark:text-slate-200 truncate max-w-[180px]">{attachment.name}</p>
                      <p className="text-[10px] text-muted dark:text-slate-500">
                        {uploadingFile ? 'Uploading…' : fmtSize(attachment.size)}
                      </p>
                    </div>
                    <button onClick={() => { setAttachment(null); setUploadingFile(false) }}
                      className="ml-2 w-5 h-5 rounded-full bg-muted/20 hover:bg-[#dc2626] text-muted hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {attachErr && (
              <p className="px-4 pt-2 text-[11px] text-[#dc2626] font-medium">{attachErr}</p>
            )}

            {/* Input row */}
            <div className="px-4 py-3 flex gap-2 items-end">

              {/* Attachment button */}
              <button
                onClick={() => { setAttachErr(''); fileInputRef.current?.click() }}
                title="Attach image or document"
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-muted hover:text-primary hover:bg-light-blue/40 dark:hover:bg-[#1B2D4A]/60 transition-colors duration-150">
                <Paperclip size={17} strokeWidth={1.75} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Text input */}
              <textarea
                ref={inputRef}
                rows={1}
                placeholder={attachment ? 'Add a caption… (optional)' : `Message ${selectedUser.name}…`}
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                onKeyDown={handleKey}
                className="flex-1 resize-none bg-[#F7F9FC] dark:bg-[#1C2538] border border-[#EFEFEF] dark:border-[#1F2937] rounded-xl px-3.5 py-2.5 text-[13px] text-body dark:text-slate-200 placeholder:text-muted dark:placeholder:text-slate-500 focus:outline-none focus:border-primary transition-colors leading-relaxed"
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />

              {/* Send button */}
              <button
                onClick={sendMessage}
                disabled={(!input.trim() && !attachment) || uploadingFile}
                className="w-9 h-9 rounded-xl bg-primary hover:bg-[#163f6e] flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <Send size={15} strokeWidth={2} className="text-white" />
              </button>
            </div>
          </div>
        </div>{/* end chat column */}

        {/* ── Media / Files panel ─────────────────────────────────────────── */}
        {showMedia && (
          <div className="w-64 shrink-0 border-l border-[#F0F2F5] dark:border-[#1F2937] flex flex-col">
            <div className="px-4 py-3.5 border-b border-[#F0F2F5] dark:border-[#1F2937] flex items-center justify-between">
              <p className="font-sora font-semibold text-[13px] text-body dark:text-white">Photos & Files</p>
              <button onClick={() => setShowMedia(false)} className="text-muted hover:text-body transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

              {/* Images */}
              <div>
                <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2">
                  Photos ({mediaImages.length})
                </p>
                {mediaImages.length === 0
                  ? <p className="text-[11px] text-muted italic">No photos yet</p>
                  : (
                    <div className="grid grid-cols-3 gap-1">
                      {mediaImages.map((a, i) => {
                        const src = a.url || a.data
                        return (
                          <a key={i} href={src} target="_blank" rel="noopener noreferrer"
                            className="aspect-square rounded-lg overflow-hidden bg-[#F0F2F5] dark:bg-[#1F2937] hover:opacity-80 transition-opacity">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                          </a>
                        )
                      })}
                    </div>
                  )}
              </div>

              {/* Documents */}
              <div>
                <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2">
                  Documents ({mediaDocs.length})
                </p>
                {mediaDocs.length === 0
                  ? <p className="text-[11px] text-muted italic">No documents yet</p>
                  : (
                    <div className="space-y-2">
                      {mediaDocs.map((a, i) => {
                        const DocIcon = docIcon(a.mime)
                        const src = a.url || a.data
                        return (
                          <a key={i} href={src || undefined} target="_blank" rel="noopener noreferrer" download={a.name}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#1C2538] border border-[#EFEFEF] dark:border-[#1F2937] ${src ? 'hover:border-primary transition-colors' : 'opacity-60 pointer-events-none'}`}>
                            <div className="w-8 h-8 rounded-lg bg-[#D6E8F7] dark:bg-[#1B2D4A] flex items-center justify-center shrink-0">
                              <DocIcon size={13} className="text-primary dark:text-[#5B9BD5]" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold text-body dark:text-slate-200 truncate">{a.name}</p>
                              <p className="text-[10px] text-muted dark:text-slate-500">{fmtSize(a.size)}</p>
                            </div>
                            {src && <Download size={12} className="text-muted shrink-0" />}
                          </a>
                        )
                      })}
                    </div>
                  )}
              </div>

            </div>
          </div>
        )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[13px] text-muted dark:text-slate-500">Select a contact to start chatting</p>
        </div>
      )}

      {/* ── Confirm clear dialog ─────────────────────────────────────────── */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-2xl w-full max-w-[380px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] dark:bg-[#2D0808] flex items-center justify-center shrink-0">
                <AlertTriangle size={18} strokeWidth={1.75} className="text-[#dc2626]" />
              </div>
              <div>
                <p className="font-sora font-semibold text-[15px] text-body dark:text-white">Clear chat history?</p>
                <p className="text-[12px] text-muted dark:text-slate-400 mt-0.5">
                  All messages with <span className="font-medium text-body dark:text-slate-200">{selectedUser?.name}</span> will be permanently deleted.
                </p>
              </div>
            </div>
            <p className="text-[12px] text-[#dc2626] bg-[#FEF2F2] dark:bg-[#2D0808]/60 rounded-lg px-3 py-2 mb-5">
              This cannot be undone. Both sides of the conversation will be cleared.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                disabled={clearing}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={handleClearChat}
                disabled={clearing}
                className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {clearing ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Clearing…
                  </>
                ) : (
                  <>
                    <Trash2 size={13} strokeWidth={2.5} />
                    Clear chat
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
