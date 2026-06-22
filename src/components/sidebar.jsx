import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  Wallet, ClipboardList, BarChart2, Users, Store, Settings,
  X, LogOut, PenTool, Layers, ShoppingBag, Calculator,
  FileText, Home, MessageCircle, ClipboardCheck, Bot, Camera,
  Banknote, Bug,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_FOR_ROLE = {
  Admin: [
    { path: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
    { path: '/projects',   label: 'Projects',      icon: FolderKanban    },
    { path: '/tasks',      label: 'Tasks',         icon: CheckSquare     },
    { path: '/finance',    label: 'Finance',       icon: Wallet          },
    { path: '/attendance', label: 'Attendance',    icon: ClipboardList   },
    { path: '/clients',   label: 'Clients',        icon: Users           },
    { path: '/vendors',    label: 'Vendors',       icon: Store           },
    { path: '/supervisor-snags', label: 'Snag List',  icon: Bug             },
    { path: '/chat',       label: 'Messages',      icon: MessageCircle   },
    { path: '/ai',         label: 'AI Assistant',  icon: Bot             },
    { path: '/reports',    label: 'Reports',       icon: BarChart2       },
    { path: '/settings',   label: 'Settings',      icon: Settings        },
  ],
  Supervisor: [
    { path: '/supervisor',           label: 'Dashboard',  icon: LayoutDashboard },
    { path: '/projects',             label: 'Projects',   icon: FolderKanban    },
    { path: '/tasks',                label: 'Tasks',      icon: CheckSquare     },
    { path: '/attendance',           label: 'Attendance', icon: ClipboardList   },
    { path: '/supervisor-clients',   label: 'Clients',    icon: Users           },
    { path: '/supervisor-vendors',   label: 'Vendors',    icon: Store           },
    { path: '/supervisor-designs',   label: 'Designs',    icon: PenTool         },
    { path: '/supervisor-materials', label: 'Materials',  icon: Layers          },
    { path: '/reports',              label: 'Reports',      icon: BarChart2       },
    { path: '/supervisor-snags',      label: 'Snag List',    icon: Bug             },
    { path: '/supervisor-gallery',   label: 'Site Gallery', icon: Camera          },
    { path: '/settings',             label: 'Settings',     icon: Settings        },
  ],
  Designer: [
    { path: '/designer',               label: 'Dashboard',         icon: LayoutDashboard },
    { path: '/designer-studio',        label: 'Design Studio',     icon: PenTool         },
    { path: '/designer-collaboration', label: 'Collaboration',     icon: Users           },
    { path: '/designer-marketplace',   label: 'Marketplace',       icon: ShoppingBag     },
    { path: '/projects',               label: 'Projects',          icon: FolderKanban    },
    { path: '/tasks',                  label: 'Tasks',             icon: CheckSquare     },
    { path: '/designer-finance',       label: 'Finance & Costs',   icon: Calculator      },
    { path: '/designer-timeline',      label: 'Timeline',          icon: BarChart2       },
    { path: '/designer-documents',     label: 'Documents',         icon: FileText        },
    { path: '/designer-materials',     label: 'Materials & Boards',icon: Layers          },
    { path: '/designer-gallery',       label: 'Site Gallery',      icon: Camera          },
    { path: '/settings',               label: 'Settings',          icon: Settings        },
  ],
  Client: [
    { path: '/client',                label: 'My Project',      icon: Home            },
    { path: '/client-designs',        label: 'My Designs',      icon: PenTool         },
    { path: '/client-collaboration',  label: 'Review & Approve',icon: ClipboardCheck  },
    { path: '/client-timeline',       label: 'Timeline',        icon: BarChart2       },
    { path: '/client-marketplace',    label: 'Marketplace',     icon: ShoppingBag     },
    { path: '/client-documents',      label: 'Documents',       icon: FileText        },
    { path: '/client-finance',         label: 'Finances',        icon: Wallet          },
    { path: '/client-snags',           label: 'Snag List',       icon: Bug             },
    { path: '/client-gallery',        label: 'Site Gallery',    icon: Camera          },
    { path: '/chat',                  label: 'Messages',        icon: MessageCircle   },
    { path: '/settings',              label: 'Settings',        icon: Settings        },
  ],
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = NAV_FOR_ROLE[user?.role] ?? NAV_FOR_ROLE.Admin
  const homePath = navItems[0]?.path ?? '/dashboard'

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <aside
      className={[
        'fixed left-0 top-0 h-screen w-60 bg-navy z-40 flex flex-col',
        'transition-transform duration-300 ease-in-out',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="h-[60px] flex items-center justify-between px-5 shrink-0">
        <Link to={homePath} className="flex items-center group">
          <span className="font-sora font-bold text-xl text-white tracking-tight transition-all duration-200 group-hover:text-accent group-hover:tracking-wide">
            InteriorOS
          </span>
        </Link>
        <button onClick={onClose} className="lg:hidden p-1 text-white/60 hover:text-white transition-colors" aria-label="Close menu">
          <X size={18} strokeWidth={1.75} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              [
                'w-full flex items-center gap-3 px-4 py-2.5',
                'rounded-r-lg transition-all duration-150',
                isActive
                  ? 'bg-primary [box-shadow:inset_4px_0_0_#E07B20] text-white font-medium'
                  : 'text-white/65 hover:bg-white/10 hover:text-white',
              ].join(' ')
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            <span className="text-[13px]">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer — logout only */}
      <div className="shrink-0 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={15} strokeWidth={1.75} />
          <span className="text-[12px]">Sign out</span>
        </button>
      </div>
    </aside>
  )
}
