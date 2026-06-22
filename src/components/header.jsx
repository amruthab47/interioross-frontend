import { useState, useRef, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  Bell, Sun, Moon, X, CheckCheck, Clock,
  AlertTriangle, FileText, CheckSquare, IndianRupee, CalendarDays,
  Menu, MessageCircle, ClipboardList,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../hooks/useNotifications'

const TYPE_CFG = {
  leave:   { Icon: CalendarDays,  bg: 'bg-[#FFF3E8] dark:bg-[#2D1F0A]',      color: 'text-accent'                         },
  delay:   { Icon: AlertTriangle, bg: 'bg-[#FEF2F2] dark:bg-[#2D0808]',      color: 'text-[#dc2626]'                      },
  invoice: { Icon: FileText,      bg: 'bg-light-blue/60 dark:bg-[#1B2D4A]',  color: 'text-primary dark:text-[#5B9BD5]'    },
  task:    { Icon: CheckSquare,   bg: 'bg-[#F5F3FF] dark:bg-[#1A0E3A]',      color: 'text-[#7C3AED] dark:text-[#A78BFA]' },
  payment: { Icon: IndianRupee,   bg: 'bg-[#F0FDF4] dark:bg-[#0A2318]',      color: 'text-[#15803d] dark:text-[#22c55e]' },
  report:  { Icon: ClipboardList, bg: 'bg-light-blue/60 dark:bg-[#1B2D4A]',  color: 'text-primary dark:text-[#5B9BD5]'    },
  meeting: { Icon: CalendarDays,  bg: 'bg-light-blue/60 dark:bg-[#1B2D4A]',  color: 'text-primary dark:text-[#5B9BD5]'    },
  design:  { Icon: FileText,      bg: 'bg-[#F0FDF4] dark:bg-[#0A2318]',      color: 'text-[#15803d] dark:text-[#22c55e]'  },
}

export default function Header({ title, onMenuClick }) {
  const { isDark, toggleTheme } = useTheme()
  const { user } = useAuth()
  const { notifications, unreadCount, dismiss, dismissAll } = useNotifications()
  const [showPanel, setShowPanel] = useState(false)
  const panelRef = useRef(null)

  const notifs = notifications
  function isRead(n) { return n.isRead }

  useEffect(() => {
    if (!showPanel) return
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPanel])

  return (
    <header className="fixed top-0 left-0 lg:left-60 right-0 h-[60px] bg-white dark:bg-[#141B27] z-30 flex items-center justify-between px-4 lg:px-6 border-b border-[#E0E0E0] dark:border-[#1F2937] transition-colors duration-300">

      <div className="flex items-center gap-3">
        {/* Hamburger — mobile/tablet only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg text-muted dark:text-slate-400 hover:bg-light-blue dark:hover:bg-[#1C2538] transition-colors"
          aria-label="Open menu"
        >
          <Menu size={18} strokeWidth={1.75} />
        </button>

        <h1 className="font-sora font-semibold text-[15px] text-body dark:text-white tracking-tight truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1.5">

        {/* Calendar shortcut */}
        <NavLink to="/calendar"
          className={({ isActive }) =>
            `p-1.5 rounded-lg transition-colors duration-150 ${isActive ? 'bg-light-blue dark:bg-[#1C2538] text-primary' : 'text-muted dark:text-slate-400 hover:bg-light-blue dark:hover:bg-[#1C2538] hover:text-primary'}`
          }
          title="Calendar"
        >
          <CalendarDays size={17} strokeWidth={1.75} />
        </NavLink>

        {/* Messages shortcut */}
        <NavLink to="/chat"
          className={({ isActive }) =>
            `p-1.5 rounded-lg transition-colors duration-150 ${isActive ? 'bg-light-blue dark:bg-[#1C2538] text-primary' : 'text-muted dark:text-slate-400 hover:bg-light-blue dark:hover:bg-[#1C2538] hover:text-primary'}`
          }
          title="Messages"
        >
          <MessageCircle size={17} strokeWidth={1.75} />
        </NavLink>

        <div className="w-px h-4 bg-[#E0E0E0] dark:bg-[#1F2937] mx-0.5" />

        <button onClick={toggleTheme}
          className="p-1.5 rounded-lg text-muted dark:text-slate-400 hover:bg-light-blue dark:hover:bg-[#1C2538] transition-colors duration-150"
          aria-label="Toggle theme">
          {isDark ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
        </button>

        {/* Notification bell + panel */}
        <div className="relative" ref={panelRef}>
          <button onClick={() => setShowPanel(v => !v)}
            className={`relative p-1.5 rounded-lg transition-colors duration-150 ${showPanel ? 'bg-light-blue dark:bg-[#1C2538]' : 'hover:bg-light-blue dark:hover:bg-[#1C2538]'}`}>
            <Bell size={17} strokeWidth={1.75} className="text-muted dark:text-slate-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-accent text-white text-[10px] font-semibold flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showPanel && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-[360px] bg-white dark:bg-[#141B27] rounded-2xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-[0_16px_48px_rgba(0,0,0,0.16)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden z-50">

              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#F0F2F5] dark:border-[#1F2937]">
                <div className="flex items-center gap-2">
                  <h4 className="font-sora font-semibold text-[13px] text-body dark:text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold text-white bg-accent px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={dismissAll}
                    className="flex items-center gap-1 text-[11px] font-medium text-primary dark:text-[#5B9BD5] hover:text-mid-blue transition-colors">
                    <CheckCheck size={12} strokeWidth={2} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="text-[12px] text-muted dark:text-slate-500">All caught up — no notifications</p>
                  </div>
                ) : notifs.map((n, idx) => {
                  const cfg  = TYPE_CFG[n.type] ?? TYPE_CFG.task
                  const { Icon } = cfg
                  const read = isRead(n)
                  return (
                    <div key={n.id}>
                      <div className={`flex gap-3 px-4 py-3 group hover:bg-[#F7F9FC] dark:hover:bg-[#1A2236] transition-colors duration-100 ${!read ? 'bg-[#FFFBF5] dark:bg-[#1A1408]' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                          <Icon size={14} strokeWidth={1.75} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-[12px] font-semibold leading-snug ${read ? 'text-muted dark:text-slate-400' : 'text-body dark:text-white'}`}>
                              {n.title}
                              {!read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent ml-1.5 mb-0.5 align-middle" />}
                            </p>
                            <button onClick={() => dismiss(n._id ?? n.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted hover:text-body dark:hover:text-white shrink-0 transition-all duration-150 mt-0.5">
                              <X size={12} strokeWidth={2} />
                            </button>
                          </div>
                          <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5 leading-snug">{n.body}</p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock size={9} strokeWidth={2} className="text-muted dark:text-slate-600" />
                            <span className="text-[10px] text-muted dark:text-slate-500">{n.createdAt ? new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : n.time ?? ''}</span>
                          </div>
                        </div>
                      </div>
                      {idx < notifs.length - 1 && <div className="mx-4 h-px bg-[#F4F4F4] dark:bg-[#1A2236]" />}
                    </div>
                  )
                })}
              </div>

              {notifs.length > 0 && (
                <div className="px-4 py-3 border-t border-[#F0F2F5] dark:border-[#1F2937] text-center">
                  <button onClick={() => setShowPanel(false)}
                    className="text-[11px] font-medium text-primary dark:text-[#5B9BD5] hover:text-mid-blue transition-colors">
                    Close notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-[#E0E0E0] dark:bg-[#1F2937] mx-0.5" />

        <Link to="/settings" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity" title="Profile & Settings">
          <div className="w-8 h-8 rounded-full bg-mid-blue flex items-center justify-center shrink-0">
            <span className="text-[11px] font-semibold text-white">{user.initials}</span>
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="text-[13px] font-medium text-body dark:text-white">{user.name}</p>
            <p className="text-[11px] text-muted dark:text-slate-400">{user.role}</p>
          </div>
        </Link>

      </div>
    </header>
  )
}
