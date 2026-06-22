import React, { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, RotateCcw, User, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProjects } from '../api/projects'
import { getFinanceSummary, getInvoices } from '../api/finance'
import { getExpenseBreakdown, getRecentActivity } from '../api/analytics'
import { getNotifications } from '../api/notifications'
import { projectToRow, formatINR } from '../utils/format'
import { callGroq, buildSystemPrompt } from '../utils/groq'

const QUICK_PROMPTS = [
  { label: 'Summarize my notifications',   text: 'Summarize my notifications for today'           },
  { label: 'Project status overview',       text: 'Give me a status overview of all projects'      },
  { label: 'Finance summary',               text: 'What is the current finance summary?'           },
  { label: 'Delayed projects',              text: 'Which projects are delayed or critical?'        },
  { label: 'Cost estimate for bedroom',     text: 'Estimate the cost to design a master bedroom'   },
  { label: 'Cost estimate for kitchen',     text: 'Estimate the cost to redesign a modular kitchen'},
  { label: 'Pending payments',              text: 'What are the pending payments and invoices?'    },
  { label: "Today's schedule",              text: 'What are my tasks and meetings for today?'      },
]

export default function AIPage() {
  const { user } = useAuth()
  const [projects,       setProjects]       = useState([])
  const [financeSummary, setFinanceSummary] = useState({ revenuePaise: 0, pendingInvoices: 0, revenueRaw: 0, expensesRaw: 0, profitRaw: 0 })
  const [expenseBreakdown, setExpenseBreakdown] = useState([])
  const [invoices,       setInvoices]       = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [allNotifications, setAllNotifications] = useState([])

  useEffect(() => {
    getProjects().then(ps => setProjects(ps.map(projectToRow))).catch(console.error)
    getFinanceSummary().then(s => setFinanceSummary({ ...s, revenue: formatINR(s.revenuePaise), expenses: formatINR(0), profit: formatINR(s.revenuePaise), pendingInvoices: s.pendingInvoices ?? 0, revenueRaw: Math.round((s.revenuePaise ?? 0)/100), expensesRaw: 0, profitRaw: Math.round((s.revenuePaise ?? 0)/100) })).catch(console.error)
    getExpenseBreakdown().then(d => setExpenseBreakdown(d.map(e => ({ category: e.category, amount: Math.round((e.amountPaise ?? 0)/100) })))).catch(console.error)
    getInvoices().then(d => setInvoices(d.map(i => ({ ...i, id: i._id, client: i.clientId?.name ?? '', project: i.projectId?.name ?? '', amount: Math.round((i.amountPaise ?? 0)/100), date: i.issueDate ?? '' })))).catch(console.error)
    getRecentActivity().then(setRecentActivity).catch(console.error)
    getNotifications().then(ns => setAllNotifications({ Admin: ns, Supervisor: ns, Designer: ns, Client: ns })).catch(console.error)
  }, [])

  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'ai',
      text: `Hello **${user?.name?.split(' ')[0] ?? 'there'}**! I'm your InteriorOS AI assistant.\n\nI can summarize your notifications, give project status overviews, help with cost estimations, and answer finance or design questions.\n\nWhat would you like to know today?`,
    },
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    const q = text.trim()
    if (!q || loading) return
    setMessages(p => [...p, { id: Date.now(), role: 'user', text: q }])
    setInput('')
    setLoading(true)
    try {
      const supervisorData = { name: user?.name ?? '', projectIds: [], todayTasks: [], workers: [], alerts: [] }
      const systemPrompt = buildSystemPrompt(user, {
        projects, financeSummary, expenseBreakdown, invoices,
        supervisorData, recentActivity, notifications: allNotifications,
      })
      const history = messages.slice(1).slice(-20).map(m => ({
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
        text: `Sorry, I couldn't reach the AI service right now. Please try again.\n\n_${err.message}_`,
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  function reset() {
    setMessages([{
      id: 0, role: 'ai',
      text: `Hello **${user?.name?.split(' ')[0] ?? 'there'}**! I'm your InteriorOS AI assistant. What would you like to know today?`,
    }])
  }

  function renderText(text) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-2" />
      const parts = line.split(/(\*\*.*?\*\*|_.*?_|\|.*?\|)/)
      const rendered = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={j}>{part.slice(2, -2)}</strong>
        if (part.startsWith('_')  && part.endsWith('_'))  return <em key={j} className="text-muted">{part.slice(1, -1)}</em>
        if (part.startsWith('|')  && part.endsWith('|')) {
          const cells = part.split('|').filter(Boolean)
          if (cells.every(c => /^[-\s]+$/.test(c))) return null
          return (
            <span key={j} className="inline-flex gap-4">
              {cells.map((c, k) => <span key={k} className="min-w-[140px]">{c.trim()}</span>)}
            </span>
          )
        }
        return <span key={j}>{part}</span>
      })
      const isBullet = line.trimStart().startsWith('•') || line.trimStart().startsWith('-')
      const isHeader = line.trimStart().startsWith('#')
      return (
        <div key={i} className={[
          'leading-relaxed',
          isBullet ? 'flex gap-1.5 ml-2' : '',
          isHeader  ? 'font-sora font-bold text-body dark:text-white mt-1' : '',
        ].join(' ')}>
          {rendered}
        </div>
      )
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-0">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-mid-blue flex items-center justify-center shadow-sm">
            <Sparkles size={16} strokeWidth={1.75} className="text-white" />
          </div>
          <div>
            <h2 className="font-sora font-bold text-[18px] text-body dark:text-white leading-tight">AI Assistant</h2>
            <p className="text-[12px] text-muted dark:text-slate-400">Powered by InteriorOS Intelligence</p>
          </div>
        </div>
        <button onClick={reset}
          className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-muted hover:text-body dark:hover:text-white border border-[#DDDDDD] dark:border-[#2A3547] rounded-lg hover:border-primary transition-colors">
          <RotateCcw size={12} strokeWidth={2} /> New chat
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm">

        {/* Quick prompts (only when just the greeting message) */}
        {messages.length === 1 && (
          <div className="px-6 pt-5 pb-3">
            <p className="text-[11px] font-semibold text-muted dark:text-slate-500 uppercase tracking-widest mb-3">Quick questions</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.text)}
                  className="flex items-center gap-2 text-left px-3.5 py-2.5 rounded-xl border border-[#EFEFEF] dark:border-[#1F2937] bg-[#F7F9FC] dark:bg-[#0F1219] hover:border-primary hover:bg-light-blue/30 dark:hover:bg-[#1B2D4A]/50 transition-colors group">
                  <ChevronRight size={12} strokeWidth={2} className="text-muted group-hover:text-primary shrink-0" />
                  <span className="text-[12px] text-body dark:text-slate-300 group-hover:text-primary dark:group-hover:text-[#5B9BD5]">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="px-6 py-4 space-y-5">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'ai' ? 'bg-gradient-to-br from-primary to-mid-blue' : 'bg-mid-blue'}`}>
                {msg.role === 'ai'
                  ? <Sparkles size={13} strokeWidth={1.75} className="text-white" />
                  : <span className="text-[10px] font-semibold text-white">{user.initials}</span>
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[72%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={[
                  'px-4 py-3 rounded-2xl text-[13px]',
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-[#F7F9FC] dark:bg-[#1C2538] text-body dark:text-slate-200 rounded-tl-sm',
                ].join(' ')}>
                  <div className="space-y-0.5">{renderText(msg.text)}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-mid-blue flex items-center justify-center shrink-0">
                <Sparkles size={13} strokeWidth={1.75} className="text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#F7F9FC] dark:bg-[#1C2538]">
                <div className="flex gap-1 items-center h-5">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted dark:bg-slate-500 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.8s' }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="mt-3 bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-4 py-3 flex gap-3 items-end">
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Ask about projects, costs, finance, notifications…"
          value={input}
          onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
          onKeyDown={handleKey}
          className="flex-1 resize-none bg-transparent text-[13px] text-body dark:text-slate-200 placeholder:text-muted dark:placeholder:text-slate-500 focus:outline-none leading-relaxed"
          style={{ minHeight: '24px', maxHeight: '120px' }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-xl bg-primary hover:bg-[#163f6e] flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Send size={14} strokeWidth={2} className="text-white" />
        </button>
      </div>
    </div>
  )
}
