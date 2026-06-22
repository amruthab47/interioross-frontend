import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sparkles, Send, X, RotateCcw, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProjects } from '../api/projects'
import { getFinanceSummary, getInvoices } from '../api/finance'
import { getRecentActivity } from '../api/analytics'
import { getNotifications } from '../api/notifications'
import { callGroq, buildSystemPrompt } from '../utils/groq'

const QUICK_PROMPTS = [
  { label: 'Summarize my notifications',  text: 'Summarize my notifications for today'         },
  { label: 'Project status overview',      text: 'Give me a status overview of all projects'    },
  { label: 'Finance summary',              text: 'What is the current finance summary?'         },
  { label: 'Delayed projects',             text: 'Which projects are delayed or critical?'      },
  { label: 'Cost estimate for bedroom',    text: 'Estimate the cost to design a master bedroom' },
  { label: 'Pending payments',             text: 'What are the pending payments and invoices?'  },
  { label: "Today's schedule",             text: 'What are my tasks and meetings for today?'    },
  { label: 'Design advice',                text: 'Give me interior design tips and trends'      },
]

function renderText(text) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-1.5" />
    const parts = line.split(/(\*\*.*?\*\*|_.*?_)/)
    const rendered = parts.map((p, j) => {
      if (p.startsWith('**') && p.endsWith('**')) return <strong key={j}>{p.slice(2,-2)}</strong>
      if (p.startsWith('_')  && p.endsWith('_'))  return <em key={j} className="text-muted">{p.slice(1,-1)}</em>
      return <span key={j}>{p}</span>
    })
    const isBullet = line.trimStart().startsWith('•') || line.trimStart().startsWith('-')
    return (
      <div key={i} className={`leading-relaxed ${isBullet ? 'flex gap-1.5 ml-1' : ''}`}>
        {rendered}
      </div>
    )
  })
}

const PANEL_STYLE = `
  @keyframes aiPanelIn {
    from { opacity:0; transform:translateY(20px) scale(0.96); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  .ai-panel-in { animation: aiPanelIn 0.22s cubic-bezier(.22,.68,0,1.2) both; }
`

export default function AIFloatingButton() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{
    id: 0, role: 'ai',
    text: `Hello **${user?.name?.split(' ')[0]}**! I'm your InteriorOS AI assistant.\n\nAsk me about projects, finance, cost estimates, or design advice.`,
  }])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [ctxData, setCtxData]   = useState(null)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  // Fetch live context data when panel opens
  useEffect(() => {
    if (!open || ctxData) return
    Promise.all([
      getProjects().catch(() => []),
      getFinanceSummary().catch(() => ({})),
      getInvoices().catch(() => []),
      getRecentActivity().catch(() => []),
      getNotifications().catch(() => []),
    ]).then(([projs, fin, invs, activity, notifs]) => {
      const fmt = (p) => `₹${Math.round(p / 100).toLocaleString('en-IN')}`
      setCtxData({
        projects: projs.map(p => ({
          id: p._id, name: p.name, status: p.status, progress: p.progress,
          phase: p.currentPhase, client: p.clientId?.name ?? '',
          supervisor: p.supervisorId?.name ?? '', budget: fmt(p.budgetPaise ?? 0),
        })),
        financeSummary: {
          revenue: fmt(fin.revenuePaise ?? 0),
          expenses: fmt((fin.revenuePaise ?? 0) - (fin.profitPaise ?? 0)),
          profit: fmt(fin.profitPaise ?? 0),
          pendingInvoices: fin.pendingInvoices ?? 0,
          revenueRaw: fin.revenuePaise ?? 0,
          profitRaw: fin.profitPaise ?? 0,
        },
        expenseBreakdown: [],
        invoices: invs.map(i => ({
          id: i.invoiceNumber, client: i.clientId?.name ?? '', status: i.status,
          amount: Math.round((i.amountPaise ?? 0) / 100), project: i.projectId?.name ?? '',
          date: i.issueDate,
        })),
        supervisorData: { projectIds: [], todayTasks: [], workers: [], alerts: [] },
        recentActivity: activity.map(a => ({ actor: a.actor ?? '', action: a.action ?? '', target: a.target ?? '', detail: a.detail ?? '', time: a.time ?? '' })),
        notifications: {
          Admin: notifs.filter(n => n.userId?.role === 'Admin' || !n.userId),
          Supervisor: notifs.filter(n => n.userId?.role === 'Supervisor'),
          Designer: notifs.filter(n => n.userId?.role === 'Designer'),
          Client: notifs.filter(n => n.userId?.role === 'Client'),
        },
      })
    })
  }, [open])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 80)
  }, [open])

  // Hide on pages where the FAB overlaps critical bottom-right UI
  if (['/ai', '/chat', '/designer-studio'].includes(pathname)) return null

  function reset() {
    setMessages([{ id: 0, role: 'ai', text: `Hello **${user?.name?.split(' ')[0]}**! What would you like to know today?` }])
  }

  async function sendMessage(text) {
    const q = text.trim()
    if (!q || loading) return
    setMessages(p => [...p, { id: Date.now(), role: 'user', text: q }])
    setInput('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }
    setLoading(true)
    try {
      const ctx = ctxData ?? {
        projects: [], financeSummary: {}, expenseBreakdown: [],
        invoices: [], supervisorData: { projectIds: [], todayTasks: [], workers: [], alerts: [] },
        recentActivity: [], notifications: {},
      }
      const systemPrompt = buildSystemPrompt(user, ctx)
      const history = messages.slice(1).slice(-16).map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text,
      }))
      const reply = await callGroq([
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: q },
      ])
      setMessages(p => [...p, { id: Date.now() + 1, role: 'ai', text: reply }])
    } catch (err) {
      setMessages(p => [...p, {
        id: Date.now() + 1, role: 'ai',
        text: `Sorry, I couldn't reach the AI service. Please try again.\n\n_${err.message}_`,
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <>
      <style>{PANEL_STYLE}</style>

      {/* Chat panel */}
      {open && (
        <div
          className="ai-panel-in fixed z-50 flex flex-col bg-white dark:bg-[#141B27] rounded-2xl shadow-2xl border border-[#E0E0E0] dark:border-[#1F2937] overflow-hidden"
          style={{
            bottom: 88, right: 24,
            width: 'min(400px, calc(100vw - 32px))',
            height: 'min(560px, calc(100vh - 120px))',
          }}>

          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F2F5] dark:border-[#1F2937] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-mid-blue flex items-center justify-center shadow-sm">
                <Sparkles size={14} strokeWidth={1.75} className="text-white" />
              </div>
              <div>
                <p className="font-sora font-semibold text-[13px] text-body dark:text-white leading-tight">AI Assistant</p>
                <p className="text-[10px] text-muted dark:text-slate-500">InteriorOS Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={reset}
                title="New chat"
                className="p-1.5 rounded-lg text-muted hover:text-body dark:hover:text-white hover:bg-[#F7F9FC] dark:hover:bg-[#1C2538] transition-colors">
                <RotateCcw size={12} strokeWidth={2} />
              </button>
              <button onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-body dark:hover:text-white hover:bg-[#F7F9FC] dark:hover:bg-[#1C2538] transition-colors">
                <X size={15} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

            {/* Quick prompts */}
            {messages.length === 1 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2">Quick questions</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {QUICK_PROMPTS.map((p, i) => (
                    <button key={i} onClick={() => sendMessage(p.text)}
                      className="flex items-center gap-2 text-left px-3 py-2 rounded-xl border border-[#EFEFEF] dark:border-[#1F2937] bg-[#F7F9FC] dark:bg-[#0F1219] hover:border-primary hover:bg-light-blue/30 transition-colors group">
                      <ChevronRight size={11} className="text-muted group-hover:text-primary shrink-0" />
                      <span className="text-[11.5px] text-body dark:text-slate-300 group-hover:text-primary">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'ai' ? 'bg-gradient-to-br from-primary to-mid-blue' : 'bg-mid-blue'}`}>
                  {msg.role === 'ai'
                    ? <Sparkles size={12} strokeWidth={1.75} className="text-white" />
                    : <span className="text-[9px] font-bold text-white">{user?.initials}</span>
                  }
                </div>
                <div className={`max-w-[82%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={[
                    'px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-[#F7F9FC] dark:bg-[#1C2538] text-body dark:text-slate-200 rounded-tl-sm',
                  ].join(' ')}>
                    <div className="space-y-0.5">{renderText(msg.text)}</div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-mid-blue flex items-center justify-center shrink-0">
                  <Sparkles size={12} strokeWidth={1.75} className="text-white" />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-[#F7F9FC] dark:bg-[#1C2538]">
                  <div className="flex gap-1 items-center h-4">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
                        style={{ animationDelay:`${i*150}ms`, animationDuration:'0.8s' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-[#F0F2F5] dark:border-[#1F2937] px-3 py-2.5 flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,96)+'px' }}
              onKeyDown={handleKey}
              placeholder="Ask anything…"
              className="flex-1 resize-none bg-transparent text-[12.5px] text-body dark:text-slate-200 placeholder:text-muted focus:outline-none leading-relaxed"
              style={{ minHeight:24, maxHeight:96 }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-primary hover:bg-[#163f6e] flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Send size={13} strokeWidth={2} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(v => !v)}
        title="AI Assistant"
        className={[
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
          open
            ? 'bg-[#0F2340] scale-95 shadow-md'
            : 'bg-primary hover:bg-[#163f6e] hover:scale-105 hover:shadow-xl',
        ].join(' ')}>
        {open
          ? <X size={20} strokeWidth={2} className="text-white" />
          : <Sparkles size={22} strokeWidth={1.75} className="text-white" />
        }
      </button>
    </>
  )
}
