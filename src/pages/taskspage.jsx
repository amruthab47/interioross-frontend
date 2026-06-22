import { useState, useMemo, useEffect, useRef } from 'react'
import {
  CheckCircle2, Circle, Clock, AlertTriangle, CheckSquare,
  Plus, Bell, Search, Trash2, X, Check,
  AlarmClock, Calendar, ChevronDown, ListTodo, CalendarDays,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProjects } from '../api/projects'
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks'
import { projectToRow } from '../utils/format'

// ── helpers ───────────────────────────────────────────────────────────────────
const TODAY    = new Date('2026-05-25')
const SV_PROJS = [1, 3]
const MO = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11}

function parseDue(s)      { const [d,m,y]=s.split(' '); return new Date(+y,MO[m],+d) }
function isOverdue(s, st) { return st !== 'Completed' && parseDue(s) < TODAY }
function fmtDt(dt)        { return new Date(dt).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) }

function derivePri(task, ps) {
  if (task.status === 'Completed') return 'low'
  if (ps === 'Critical' || isOverdue(task.dueDate, task.status)) return 'high'
  if (ps === 'Delayed'  || task.status === 'In Progress') return 'medium'
  return 'low'
}

const PRI  = {
  high:   { l:'High', c:'#dc2626', bg:'#FEF2F2' },
  medium: { l:'Med',  c:'#E07B20', bg:'#FFF3E8' },
  low:    { l:'Low',  c:'#2E6DA4', bg:'#EBF4FF' },
}
const STA = {
  'Completed':   { c:'#15803d', bg:'#F0FDF4' },
  'In Progress': { c:'#1B4F8A', bg:'#D6E8F7' },
  'Pending':     { c:'#E07B20', bg:'#FFF3E8' },
}
const PDOT = { 1:'#1B4F8A', 2:'#2E6DA4', 3:'#E07B20', 4:'#7C3AED', 5:'#dc2626', 6:'#15803d' }
const CAT_C  = { HR:'#7C3AED', Finance:'#E07B20', Meeting:'#1B4F8A', 'Site Visit':'#15803d', Site:'#15803d', Procurement:'#0f766e', Communication:'#2E6DA4', Reporting:'#6B7280', Design:'#DB2777', Custom:'#555' }
const CAT_BG = { HR:'#F5F3FF', Finance:'#FFF3E8', Meeting:'#D6E8F7', 'Site Visit':'#F0FDF4', Site:'#F0FDF4', Procurement:'#F0FDFA', Communication:'#EBF4FF', Reporting:'#F9FAFB', Design:'#FDF2F8', Custom:'#F4F4F4' }

const WEEK = [
  {date:'2026-05-25',short:'Mon',label:'Monday, 25 May',    today:true },
  {date:'2026-05-26',short:'Tue',label:'Tuesday, 26 May',   today:false},
  {date:'2026-05-27',short:'Wed',label:'Wednesday, 27 May', today:false},
  {date:'2026-05-28',short:'Thu',label:'Thursday, 28 May',  today:false},
  {date:'2026-05-29',short:'Fri',label:'Friday, 29 May',    today:false},
  {date:'2026-05-30',short:'Sat',label:'Saturday, 30 May',  today:false},
  {date:'2026-05-31',short:'Sun',label:'Sunday, 31 May',    today:false},
]

const inp = 'w-full px-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary text-body dark:text-slate-200 bg-white dark:bg-[#1C2538] placeholder:text-muted transition-colors'

// ── TaskRow ───────────────────────────────────────────────────────────────────
function TaskRow({ task, projects, onToggle, onRemove }) {
  const [isDone, setIsDone] = useState(task.status === 'Completed' || task.done)
  const over    = task.dueDate && isOverdue(task.dueDate, task.status) && !isDone
  const pri     = task.priority ?? 'low'
  const priMeta = PRI[pri]
  const pCol    = PDOT[task.projectId] ?? '#888'

  function handleToggle() {
    const next = !isDone
    setIsDone(next)
    onToggle?.(task.id, next)
  }

  return (
    <div className="group relative flex items-center gap-3 px-4 py-3 hover:bg-[#F7F9FC] dark:hover:bg-[#0F1219] transition-colors border-b border-[#F4F4F4] dark:border-[#1A2236] last:border-b-0">
      {/* Priority stripe */}
      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-colors"
        style={{ background: isDone ? '#E5E7EB' : priMeta.c }} />

      {/* Checkbox */}
      <button onClick={handleToggle}
        className="shrink-0 w-5 h-5 flex items-center justify-center transition-transform active:scale-75">
        {isDone
          ? <CheckCircle2 size={18} strokeWidth={2} className="text-[#15803d]" />
          : <Circle size={18} strokeWidth={1.75}
              className={`transition-colors ${over ? 'text-[#dc2626]' : 'text-[#CCCCCC] group-hover:text-primary'}`} />
        }
      </button>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium leading-snug transition-colors ${isDone ? 'line-through text-muted dark:text-slate-500' : over ? 'text-[#dc2626]' : 'text-body dark:text-slate-200'}`}>
          {task.name}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {task.projectId && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap"
              style={{ color: pCol, background: pCol + '18', border: `1px solid ${pCol}30` }}>
              {(projects ?? []).find(p => String(p.id) === String(task.projectId))?.name?.split(' ').slice(0,2).join(' ') ?? task.project}
            </span>
          )}
          {task.category && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
              style={{ color: CAT_C[task.category] ?? '#777', background: CAT_BG[task.category] ?? '#F9FAFB' }}>
              {task.category}
            </span>
          )}
          {task.assignedTo && (
            <span className="text-[10px] text-muted dark:text-slate-500">{task.assignedTo}</span>
          )}
          {task.dueDate && (
            <span className={`text-[10px] flex items-center gap-0.5 ${over ? 'text-[#dc2626] font-semibold' : 'text-muted dark:text-slate-500'}`}>
              {over && <AlertTriangle size={9} strokeWidth={2.5} />}
              {task.dueDate}
            </span>
          )}
        </div>
      </div>

      {/* Priority badge */}
      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-colors"
        style={{
          color: isDone ? '#9CA3AF' : priMeta.c,
          background: isDone ? '#F3F4F6' : priMeta.bg,
          border: `1px solid ${isDone ? '#E5E7EB' : priMeta.c + '40'}`,
        }}>
        {priMeta.l}
      </span>

      {/* Remove button */}
      {onRemove && (
        <button onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-[#dc2626] p-1 rounded-lg hover:bg-[#FEF2F2] shrink-0">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

// ── TaskCard container ────────────────────────────────────────────────────────
function TaskCard({ title, subtitle, completedPct, headerRight, children }) {
  return (
    <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-baseline gap-2">
            <span className="font-sora font-bold text-[15px] text-body dark:text-white">{title}</span>
            {subtitle && <span className="text-[11px] text-muted dark:text-slate-500">{subtitle}</span>}
          </div>
          {headerRight}
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-[#F0F2F5] dark:bg-[#1F2937] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${completedPct}%`,
              background: 'linear-gradient(90deg, #1B4F8A 0%, #2E6DA4 55%, #E07B20 100%)',
            }} />
        </div>
      </div>
      {children}
    </div>
  )
}

// ── AddTaskInline ─────────────────────────────────────────────────────────────
function AddTaskInline({ onAdd, projectList }) {
  const [text,    setText]    = useState('')
  const [projId,  setProjId]  = useState('')
  const [pri,     setPri]     = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [open,    setOpen]    = useState(false)
  const ref = useRef(null)

  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAdd({ name: text.trim(), projectId: projId ? +projId : null, priority: pri, dueDate, status: 'Pending' })
    setText(''); setProjId(''); setPri('medium'); setDueDate(''); setOpen(false)
  }

  return (
    <div className="border-b border-[#F0F2F5] dark:border-[#1F2937]">
      <form onSubmit={submit} className="flex items-center gap-2.5 px-4 py-3">
        <Plus size={14} className="text-muted shrink-0" />
        <input
          ref={ref}
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Add a task and press Enter…"
          className="flex-1 text-[13px] text-body dark:text-slate-200 placeholder:text-muted bg-transparent border-none outline-none"
        />
        {open && (
          <>
            <select value={projId} onChange={e => setProjId(e.target.value)}
              className="text-[11px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-lg px-2 py-1.5 bg-white dark:bg-[#1C2538] text-body dark:text-slate-200 focus:outline-none focus:border-primary shrink-0">
              <option value="">Project</option>
              {projectList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="text-[11px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-lg px-2 py-1.5 w-[120px] bg-white dark:bg-[#1C2538] text-body dark:text-slate-200 focus:outline-none focus:border-primary shrink-0" />
            <select value={pri} onChange={e => setPri(e.target.value)}
              className="text-[11px] border rounded-lg px-2 py-1.5 focus:outline-none shrink-0"
              style={{ borderColor: PRI[pri].c + '60', background: PRI[pri].bg, color: PRI[pri].c }}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button type="submit"
              className="text-[12px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-xl px-3.5 py-1.5 transition-colors shrink-0">
              Add
            </button>
          </>
        )}
      </form>
    </div>
  )
}

// ── TaskListView ──────────────────────────────────────────────────────────────
function TaskListView({ allTasks, todoItems, setTodoItems, projectList, mode }) {
  const [search,     setSearch]     = useState('')
  const [statusF,    setStatusF]    = useState('All')
  const [projF,      setProjF]      = useState('0')
  const [localTasks, setLocalTasks] = useState(allTasks.map(t => ({ ...t })))

  useEffect(() => { setLocalTasks(allTasks.map(t => ({ ...t }))) }, [mode, allTasks])

  async function addTask(form) {
    const priority = form.priority.charAt(0).toUpperCase() + form.priority.slice(1)
    const optimisticId = `new-${Date.now()}`
    const optimistic = {
      id: optimisticId,
      name: form.name,
      projectId: form.projectId,
      project: projectList.find(p => String(p.id) === String(form.projectId))?.name ?? '',
      priority: form.priority,
      dueDate: form.dueDate ? new Date(form.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
      status: 'Pending',
      assignedTo: '',
      category: 'Custom',
    }
    setLocalTasks(prev => [optimistic, ...prev])
    try {
      const saved = await createTask({
        name: form.name,
        projectId: form.projectId || undefined,
        priority,
        dueDate: form.dueDate || undefined,
        status: 'Pending',
      })
      // Replace optimistic entry with DB record
      setLocalTasks(prev => prev.map(t => t.id === optimisticId
        ? { ...optimistic, id: String(saved._id) }
        : t
      ))
    } catch (err) {
      console.error(err)
      setLocalTasks(prev => prev.filter(t => t.id !== optimisticId))
    }
  }

  async function handleToggle(id, done) {
    setLocalTasks(prev => prev.map(t => t.id === id ? { ...t, status: done ? 'Completed' : 'Pending' } : t))
    setTodoItems(prev => prev.map(t => t.id === id ? { ...t, done } : t))
    try {
      await updateTask(id, { status: done ? 'Completed' : 'Pending' })
    } catch (err) { console.error(err) }
  }

  function addTodo(form) {
    const id = `td-${Date.now()}`
    setTodoItems(prev => [{ id, name: form.name, priority: form.priority, done: false, category: 'Custom', dueDate: form.dueDate }, ...prev])
    setNewTaskIds(prev => new Set([...prev, id]))
  }

  const isTasks = mode === 'tasks'

  const filteredTasks = useMemo(() => {
    if (!isTasks) return []
    return localTasks.filter(t => {
      const sf = statusF === 'All' || t.status === statusF
      const pf = projF === '0' || String(t.projectId) === projF
      const qf = !search || t.name.toLowerCase().includes(search.toLowerCase())
      return sf && pf && qf
    })
  }, [localTasks, statusF, projF, search, isTasks])

  const STATUS_TABS = [
    { k:'All',         n: localTasks.length },
    { k:'In Progress', n: localTasks.filter(t => t.status==='In Progress').length },
    { k:'Pending',     n: localTasks.filter(t => t.status==='Pending').length },
    { k:'Completed',   n: localTasks.filter(t => t.status==='Completed').length },
  ]

  const displayList = isTasks ? filteredTasks : todoItems

  const completedPct = useMemo(() => {
    if (isTasks) return localTasks.length ? Math.round(localTasks.filter(t => t.status==='Completed').length / localTasks.length * 100) : 0
    return todoItems.length ? Math.round(todoItems.filter(t => t.done).length / todoItems.length * 100) : 0
  }, [isTasks, localTasks, todoItems])

  return (
    <div className="space-y-4">
      {/* Controls */}
      {isTasks && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary bg-white dark:bg-[#1C2538] text-body dark:text-slate-200 placeholder:text-muted"
              placeholder="Search tasks…" />
          </div>
          <div className="relative">
            <select value={projF} onChange={e => setProjF(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2.5 text-[13px] border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl focus:outline-none focus:border-primary bg-white dark:bg-[#1C2538] text-body dark:text-slate-200 cursor-pointer">
              <option value="0">All Projects</option>
              {projectList.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
          <div className="flex gap-1 bg-[#F7F9FC] dark:bg-[#0F1219] rounded-xl p-1">
            {STATUS_TABS.map(({ k, n }) => (
              <button key={k} onClick={() => setStatusF(k)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap ${statusF === k ? 'bg-white dark:bg-[#1C2538] text-primary shadow-sm' : 'text-muted hover:text-body dark:hover:text-slate-200'}`}>
                {k}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${statusF === k ? 'bg-light-blue text-primary' : 'bg-[#EBEBEB] dark:bg-[#1F2937] text-muted'}`}>{n}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today header */}
      {!isTasks && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted uppercase tracking-widest">Today's To-Do</p>
            <h3 className="font-sora font-bold text-[18px] text-body dark:text-white mt-0.5">Monday, 25 May 2026</h3>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] px-5 py-3 shadow-sm">
            {(() => {
              const done  = todoItems.filter(t => t.done).length
              const total = todoItems.length
              const pct   = total ? Math.round(done/total*100) : 0
              return (
                <>
                  <svg className="-rotate-90" width="42" height="42" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="16" fill="none" stroke="#EEF2F7" strokeWidth="4"/>
                    <circle cx="21" cy="21" r="16" fill="none" stroke="#1B4F8A" strokeWidth="4"
                      strokeDasharray={`${2*Math.PI*16}`}
                      strokeDashoffset={`${2*Math.PI*16*(1-pct/100)}`}
                      strokeLinecap="round" style={{ transition:'stroke-dashoffset .5s' }}/>
                  </svg>
                  <div>
                    <p className="text-[20px] font-sora font-bold text-body dark:text-white leading-tight">{done}/{total}</p>
                    <p className="text-[11px] text-muted">tasks done</p>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Task card */}
      <TaskCard
        title={isTasks ? 'All Tasks' : "Today's Checklist"}
        subtitle={isTasks ? `${filteredTasks.length} tasks` : 'Monday, 25 May 2026'}
        completedPct={completedPct}
        headerRight={
          isTasks ? (
            <span className="text-[11px] text-muted dark:text-slate-500">
              {localTasks.filter(t => t.status==='Completed').length} completed · {localTasks.filter(t => isOverdue(t.dueDate, t.status)).length} overdue
            </span>
          ) : null
        }>

        <AddTaskInline
          onAdd={isTasks ? addTask : addTodo}
          projectList={projectList}
        />

        {displayList.length === 0 && (
          <div className="flex flex-col items-center py-14 gap-3 text-muted">
            <ListTodo size={28} strokeWidth={1.25} />
            <span className="text-[13px]">Nothing here — add a task above</span>
          </div>
        )}

        {displayList.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            projects={projectList}
            onToggle={handleToggle}
            onRemove={async () => {
              setLocalTasks(p => p.filter(t => t.id !== task.id))
              setTodoItems(p => p.filter(t => t.id !== task.id))
              // Only call API for DB-backed tasks (real MongoDB IDs are 24 hex chars)
              if (/^[0-9a-f]{24}$/.test(task.id)) {
                try { await deleteTask(task.id) } catch (err) { console.error(err) }
              }
            }}
          />
        ))}
      </TaskCard>

      {!isTasks && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(PRI).map(([k, v]) => {
            const cnt  = todoItems.filter(t => t.priority === k).length
            const done = todoItems.filter(t => t.priority === k && t.done).length
            const pct  = cnt ? Math.round(done/cnt*100) : 0
            return (
              <div key={k} className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-4 py-3">
                <div className="flex justify-between mb-2">
                  <span className="text-[12px] font-semibold" style={{ color: v.c }}>{v.l} priority</span>
                  <span className="text-[11px] text-muted">{done}/{cnt}</span>
                </div>
                <div className="h-1.5 bg-[#EFEFEF] dark:bg-[#1F2937] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width:`${pct}%`, background: v.c }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Week View ─────────────────────────────────────────────────────────────────
function WeekView({ weekTasks, calendarEvents = [], role }) {
  const roleKey = role === 'Supervisor' ? 'Supervisor' : 'Admin'
  const calByDate = useMemo(() => {
    const map = {}
    calendarEvents.forEach(ev => {
      if (!ev.roles.includes(roleKey)) return
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    })
    return map
  }, [roleKey])
  const tasksByDate = useMemo(() => {
    const map = {}
    weekTasks.forEach(t => {
      if (!map[t.date]) map[t.date] = []
      map[t.date].push(t)
    })
    return map
  }, [weekTasks])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label:'Tasks this week',   value:weekTasks.length,  color:'#1B4F8A', bg:'#D6E8F7' },
          { label:'Meetings & events', value:Object.values(calByDate).flat().length, color:'#E07B20', bg:'#FFF3E8' },
          { label:'Days remaining',    value:WEEK.filter(d=>!d.today).length, color:'#15803d', bg:'#F0FDF4' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-5 py-3.5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background:bg }}>
              <CalendarDays size={16} strokeWidth={1.75} style={{ color }} />
            </div>
            <div>
              <p className="text-[20px] font-sora font-bold text-body dark:text-white">{value}</p>
              <p className="text-[11px] text-muted dark:text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {WEEK.map(day => {
          const tasks  = tasksByDate[day.date] ?? []
          const events = calByDate[day.date]   ?? []
          if (!tasks.length && !events.length) return null
          return (
            <div key={day.date} className={`bg-white dark:bg-[#141B27] rounded-2xl border shadow-sm overflow-hidden ${day.today ? 'border-primary/40' : 'border-[#EFEFEF] dark:border-[#1F2937]'}`}>
              <div className={`px-5 py-3 flex items-center gap-3 border-b ${day.today ? 'bg-light-blue/30 dark:bg-[#1B2D4A]/40 border-primary/20' : 'bg-[#F7F9FC] dark:bg-[#0F1219] border-[#F0F2F5] dark:border-[#1F2937]'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 ${day.today ? 'bg-primary text-white' : 'bg-[#EBEBEB] dark:bg-[#1F2937] text-muted'}`}>{day.short}</div>
                <span className={`text-[13px] font-semibold ${day.today ? 'text-primary dark:text-[#5B9BD5]' : 'text-body dark:text-slate-200'}`}>{day.label}</span>
                {day.today && <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full">TODAY</span>}
                <span className="ml-auto text-[11px] text-muted">{tasks.length + events.length} item{tasks.length+events.length!==1?'s':''}</span>
              </div>
              <div className="divide-y divide-[#F4F4F4] dark:divide-[#1A2236]">
                {events.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    <span className="flex-1 text-[13px] font-medium text-body dark:text-slate-200">{ev.title}</span>
                    <span className="text-[11px] text-muted">{ev.time}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FFF3E8] text-accent">{ev.type}</span>
                  </div>
                ))}
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRI[t.priority]?.c ?? '#777' }} />
                    <span className="flex-1 text-[13px] font-medium text-body dark:text-slate-200">{t.task}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0"
                      style={{ color: CAT_C[t.category]??'#777', background: CAT_BG[t.category]??'#F9FAFB' }}>
                      {t.category}
                    </span>
                    <span style={{ fontSize:10, fontWeight:700, color:PRI[t.priority]?.c, background:PRI[t.priority]?.bg, borderRadius:5, padding:'2px 7px' }}>{PRI[t.priority]?.l}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Reminders ─────────────────────────────────────────────────────────────────
function AddReminderModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ title:'', datetime:'', notes:'' })
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }))
  function submit(e) { e.preventDefault(); if (!form.title||!form.datetime) return; onAdd(form); onClose() }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#141B27] rounded-2xl shadow-2xl w-full max-w-md border border-[#EFEFEF] dark:border-[#1F2937]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5] dark:border-[#1F2937]">
          <h3 className="font-sora font-bold text-[15px] text-body dark:text-white">Set a Reminder</h3>
          <button onClick={onClose} className="text-muted hover:text-body"><X size={16}/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div><label className="block text-[12px] font-semibold text-body dark:text-slate-200 mb-1.5">Title *</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} className={inp} placeholder="e.g. Client follow-up call"/></div>
          <div><label className="block text-[12px] font-semibold text-body dark:text-slate-200 mb-1.5">Date & Time *</label>
            <input type="datetime-local" value={form.datetime} onChange={e=>set('datetime',e.target.value)} className={inp}/></div>
          <div><label className="block text-[12px] font-semibold text-body dark:text-slate-200 mb-1.5">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)} className={`${inp} resize-none`} placeholder="Optional details…"/></div>
          <div className="flex gap-3 pt-1">
            <button type="submit" className="flex-1 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-xl transition-colors">Set Reminder</button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-[13px] font-medium text-muted border border-[#DDDDDD] dark:border-[#2A3547] rounded-xl hover:text-body transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RemindersView({ reminders, setReminders, onAdd }) {
  function dismiss(id) { setReminders(p => p.filter(r => r.id !== id)) }
  function toggleDone(id) { setReminders(p => p.map(r => r.id===id ? {...r,done:!r.done} : r)) }
  const upcoming = reminders.filter(r => !r.done)
  const past     = reminders.filter(r =>  r.done)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-body dark:text-slate-200">{upcoming.length} upcoming reminder{upcoming.length!==1?'s':''}</p>
          <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">Stay on top of key follow-ups and deadlines.</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-[#163f6e] rounded-xl transition-colors shrink-0">
          <Plus size={14} strokeWidth={2.5}/> Set Reminder
        </button>
      </div>
      {upcoming.length===0 && past.length===0 && (
        <div className="flex flex-col items-center py-16 text-muted gap-3 bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937]">
          <AlarmClock size={32} strokeWidth={1.25}/><p className="text-[13px]">No reminders set</p>
          <button onClick={onAdd} className="text-[12px] font-semibold text-primary hover:underline">Set your first reminder →</button>
        </div>
      )}
      {upcoming.length>0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-widest px-1">Upcoming</p>
          {upcoming.map(r => (
            <div key={r.id} className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-5 py-4 flex items-start gap-4 group hover:border-primary/30 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-light-blue dark:bg-[#1B2D4A] flex items-center justify-center shrink-0">
                <Bell size={16} strokeWidth={1.75} className="text-primary dark:text-[#5B9BD5]"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-body dark:text-slate-200">{r.title}</p>
                <p className="text-[12px] text-primary dark:text-[#5B9BD5] mt-0.5 font-medium">{fmtDt(r.datetime)}</p>
                {r.notes && <p className="text-[11px] text-muted mt-1">{r.notes}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => toggleDone(r.id)} className="flex items-center gap-1.5 text-[11px] font-medium text-[#15803d] bg-[#F0FDF4] hover:bg-[#dcfce7] px-2.5 py-1.5 rounded-lg transition-colors">
                  <Check size={11} strokeWidth={2.5}/> Done
                </button>
                <button onClick={() => dismiss(r.id)} className="text-muted hover:text-[#dc2626] p-1.5 rounded-lg hover:bg-[#FEF2F2] transition-colors"><Trash2 size={13}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {past.length>0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-widest px-1">Completed</p>
          {past.map(r => (
            <div key={r.id} className="bg-[#F7F9FC] dark:bg-[#0F1219] rounded-2xl border border-[#F0F2F5] dark:border-[#1F2937] px-5 py-3.5 flex items-center gap-4 opacity-60">
              <CheckCircle2 size={16} strokeWidth={1.75} className="text-[#15803d] shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-muted line-through truncate">{r.title}</p>
                <p className="text-[11px] text-muted mt-0.5">{fmtDt(r.datetime)}</p>
              </div>
              <button onClick={() => dismiss(r.id)} className="text-muted hover:text-[#dc2626] transition-colors shrink-0"><X size={13}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, bg }) {
  return (
    <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background:bg }}>
        <Icon size={18} strokeWidth={1.75} style={{ color }}/>
      </div>
      <div>
        <p className="text-[22px] font-sora font-bold text-body dark:text-white leading-tight">{value}</p>
        <p className="text-[12px] text-muted dark:text-slate-400">{label}</p>
        {sub && <p className="text-[11px] font-medium mt-0.5" style={{ color }}>{sub}</p>}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id:'tasks',     label:'All Tasks',  icon:CheckSquare },
  { id:'today',     label:'Today',      icon:ListTodo    },
  { id:'week',      label:'This Week',  icon:Calendar    },
  { id:'reminders', label:'Reminders',  icon:AlarmClock  },
]

export default function TasksPage() {
  const { user } = useAuth()
  const role      = user?.role ?? 'Admin'
  const isSv      = role === 'Supervisor'
  const isDesigner = role === 'Designer'

  const [projects,  setProjects]  = useState([])
  const [apiTasks,  setApiTasks]  = useState([])
  const [tab,        setTab]        = useState('tasks')
  const [reminders,  setReminders]  = useState([])
  const [showAddRem, setShowAddRem] = useState(false)
  const [todoItems,  setTodoItems]  = useState([])

  useEffect(() => {
    getProjects().then(ps => setProjects(ps.map(projectToRow))).catch(console.error)
    getTasks().then(ts => {
      const normalized = ts.map(t => ({
        ...t, id: t._id,
        name: t.name,
        project: t.projectId?.name ?? '',
        projectId: String(t.projectId?._id ?? t.projectId),
        assignedTo: t.assignedTo?.name ?? '',
        status: t.status ?? 'Pending',
        priority: (t.priority ?? 'Medium').toLowerCase(),
        dueDate: t.dueDate ?? '',
        done: t.status === 'Completed',
        category: t.category ?? 'Custom',
        task: t.name,
      }))
      setApiTasks(normalized)
      setTodoItems(normalized.filter(t => t.status !== 'Completed').slice(0, 10))
    }).catch(console.error)
  }, [])

  const projStatusMap = useMemo(() => {
    const m = {}; projects.forEach(p => { m[p.id] = p.status }); return m
  }, [projects])

  const allTasks = useMemo(() => apiTasks.map(t => ({ ...t, priority: derivePri(t, projStatusMap[t.projectId] ?? 'On Track') })), [apiTasks, projStatusMap])
  const projectList = projects
  const weekTasks   = []
  const overdue     = allTasks.filter(t => isOverdue(t.dueDate, t.status)).length
  const inProg      = allTasks.filter(t => t.status === 'In Progress').length
  const done        = allTasks.filter(t => t.status === 'Completed').length

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Tasks"  value={allTasks.length} icon={CheckSquare}  color="#1B4F8A" bg="#D6E8F7" />
        <KpiCard label="In Progress"  value={inProg}          icon={Clock}        color="#2E6DA4" bg="#EBF4FF" />
        <KpiCard label="Completed"    value={done}            icon={CheckCircle2} color="#15803d" bg="#F0FDF4" sub={`${allTasks.length?Math.round(done/allTasks.length*100):0}% done`}/>
        <KpiCard label="Overdue"      value={overdue}         icon={AlertTriangle}color="#dc2626" bg="#FEF2F2" sub={overdue>0?'Needs attention':'All clear'}/>
      </div>

      {/* Tab strip */}
      <div className="bg-white dark:bg-[#141B27] rounded-2xl border border-[#EFEFEF] dark:border-[#1F2937] shadow-sm px-2 py-1.5 flex items-center gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] whitespace-nowrap transition-all duration-150 ${tab===id ? 'bg-light-blue/50 dark:bg-[#1B2D4A] text-primary dark:text-[#5B9BD5] font-semibold' : 'text-muted dark:text-slate-400 hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] hover:text-body dark:hover:text-white'}`}>
            <Icon size={14} strokeWidth={1.75}/>
            {label}
            {id==='reminders' && reminders.filter(r=>!r.done).length>0 && (
              <span className="w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
                {reminders.filter(r=>!r.done).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {(tab==='tasks' || tab==='today') && (
        <TaskListView
          key={tab}
          allTasks={allTasks}
          todoItems={todoItems}
          setTodoItems={setTodoItems}
          projectList={projectList}
          mode={tab}
        />
      )}
      {tab==='week'      && <WeekView weekTasks={weekTasks} role={role}/>}
      {tab==='reminders' && <RemindersView reminders={reminders} setReminders={setReminders} onAdd={() => setShowAddRem(true)}/>}

      {showAddRem && <AddReminderModal onClose={() => setShowAddRem(false)} onAdd={form => { setReminders(p => [...p, {id:`rem-${Date.now()}`,...form,done:false}]) }}/>}
    </div>
  )
}
