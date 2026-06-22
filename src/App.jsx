import { Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom'
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useAuth } from './context/AuthContext'
import Sidebar from './components/sidebar'
import Header from './components/header'
import AIFloatingButton from './components/AIFloatingButton'

// Static imports — no lazy loading, no dynamic import failures
import Login                from './pages/login'
import Signup               from './pages/signup'
import Register             from './pages/register'
import HomePage             from './pages/homepage'
import AdminDashboard       from './pages/admindashboard'
import SupervisorDashboard  from './pages/supervisordashboard'
import ProjectDetail        from './pages/projectdetail'
import ProjectsPage         from './pages/projectspage'
import TasksPage            from './pages/taskspage'
import FinancePage          from './pages/financepage'
import AttendancePage       from './pages/attendancepage'
import CalendarPage         from './pages/calendarpage'
import ChatPage             from './pages/chatpage'
import AIPage               from './pages/aipage'
import ClientsPage          from './pages/clientspage'
import VendorsPage          from './pages/vendorspage'
import ReportsPage          from './pages/reportspage'
import SettingsPage         from './pages/settingspage'
import DesignerDashboard     from './pages/designerdashboard'
import DesignerStudio        from './pages/designerstudio'
import DesignerCollaboration from './pages/designercollaboration'
import DesignerMaterials     from './pages/designermaterials'
import DesignerMarketplace   from './pages/designermarketplace'
import DesignerFinance       from './pages/designerfinance'
import DesignerTimeline      from './pages/designertimeline'
import DesignerDocuments     from './pages/designerdocuments'
import SupervisorClients     from './pages/supervisorclients'
import SupervisorVendors     from './pages/supervisorvendors'
import SupervisorDesigns     from './pages/supervisordesigns'
import SupervisorMaterials   from './pages/supervisormaterials'
import ClientDashboard       from './pages/clientdashboard'
import ClientDesigns         from './pages/clientdesigns'
import ClientCollaboration   from './pages/clientcollaboration'
import ClientTimeline        from './pages/clienttimeline'
import ClientMarketplace     from './pages/clientmarketplace'
import ClientDocuments       from './pages/clientdocuments'
import SiteGalleryPage       from './pages/sitegallerypage'
import ClientFinancePage     from './pages/clientfinancepage'
import SupervisorSnags       from './pages/supervisorsnags'
import ClientSnags           from './pages/clientsnags'

const PAGE_TITLES = {
  '/dashboard':              'Dashboard',
  '/projects':               'Projects',
  '/tasks':                  'Tasks',
  '/finance':                'Finance',
  '/attendance':             'Attendance',
  '/calendar':               'Calendar',
  '/chat':                   'Messages',
  '/ai':                     'AI Assistant',
  '/reports':                'Reports',
  '/clients':                'Clients',
  '/vendors':                'Vendors',
  '/settings':               'Settings',
  '/supervisor':             'Supervisor Dashboard',
  '/supervisor-clients':     'Clients',
  '/supervisor-vendors':     'Vendors',
  '/supervisor-designs':     'Design Versions',
  '/supervisor-materials':   'Materials & Mood Boards',
  '/designer':               'Designer Dashboard',
  '/designer-studio':        'Design Studio',
  '/designer-collaboration': 'Collaboration',
  '/designer-materials':     'Materials & Mood Boards',
  '/designer-marketplace':   'Marketplace',
  '/designer-finance':       'Finance & Cost Estimation',
  '/designer-timeline':      'Project Timeline',
  '/designer-documents':     'Documents',
  '/client':                 'My Project',
  '/client-designs':         'My Designs',
  '/client-collaboration':   'Review & Approve',
  '/client-timeline':        'Timeline',
  '/client-marketplace':     'Marketplace',
  '/client-documents':       'Documents',
  '/supervisor-gallery':     'Site Gallery',
  '/designer-gallery':       'Site Gallery',
  '/client-gallery':         'Site Gallery',
  '/client-finance':         'Finances',
  '/supervisor-snags':       'Snag List',
  '/client-snags':           'Snag List',
}

function AppLayout() {
  const { pathname } = useLocation()
  const isProjectDetail = /^\/projects\/\d+/.test(pathname)
  const title = isProjectDetail ? 'Project Detail' : (PAGE_TITLES[pathname] ?? 'Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mainRef = useRef(null)

  // Reset scroll BEFORE the browser paints — prevents blank flash when navigating
  // to shorter pages (AI, Settings, Chat) from a scrolled-down page.
  useLayoutEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [pathname])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  const isStudio = pathname === '/designer-studio'

  return (
    <div className="flex h-screen bg-[#F7F9FC] dark:bg-[#0F1219] transition-colors duration-300">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-60 flex-1 flex flex-col min-h-0">
        <Header title={title} onMenuClick={() => setSidebarOpen(v => !v)} />
        <main
          ref={mainRef}
          className={`mt-[60px] flex-1 min-h-0 ${isStudio ? 'overflow-hidden' : 'overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6'}`}
        >
          <Outlet />
        </main>
      </div>

      <AIFloatingButton />
    </div>
  )
}

function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F7F9FC]">
      <div className="w-8 h-8 rounded-full border-4 border-[#D6E8F7] border-t-[#1B4F8A] animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <AppLayout />
}

export default function App() {
  return (
    <Routes>
      <Route path="/"       element={<HomePage />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/signup"   element={<Signup />} />
      <Route path="/register" element={<Register />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard"              element={<AdminDashboard />} />
        <Route path="/supervisor"             element={<SupervisorDashboard />} />
        <Route path="/projects/:id"           element={<ProjectDetail />} />
        <Route path="/projects"               element={<ProjectsPage />} />
        <Route path="/tasks"                  element={<TasksPage />} />
        <Route path="/finance"                element={<FinancePage />} />
        <Route path="/attendance"             element={<AttendancePage />} />
        <Route path="/calendar"               element={<CalendarPage />} />
        <Route path="/chat"                   element={<ChatPage />} />
        <Route path="/ai"                     element={<AIPage />} />
        <Route path="/reports"                element={<ReportsPage />} />
        <Route path="/clients"                element={<ClientsPage />} />
        <Route path="/vendors"                element={<VendorsPage />} />
        <Route path="/settings"               element={<SettingsPage />} />
        <Route path="/supervisor-clients"     element={<SupervisorClients />} />
        <Route path="/supervisor-vendors"     element={<SupervisorVendors />} />
        <Route path="/supervisor-designs"     element={<SupervisorDesigns />} />
        <Route path="/supervisor-materials"   element={<SupervisorMaterials />} />
        <Route path="/designer"               element={<DesignerDashboard />} />
        <Route path="/designer-studio"        element={<DesignerStudio />} />
        <Route path="/designer-collaboration" element={<DesignerCollaboration />} />
        <Route path="/designer-materials"     element={<DesignerMaterials />} />
        <Route path="/designer-marketplace"   element={<DesignerMarketplace />} />
        <Route path="/designer-finance"       element={<DesignerFinance />} />
        <Route path="/designer-timeline"      element={<DesignerTimeline />} />
        <Route path="/designer-documents"     element={<DesignerDocuments />} />
        <Route path="/client"                 element={<ClientDashboard />} />
        <Route path="/client-designs"         element={<ClientDesigns />} />
        <Route path="/client-collaboration"   element={<ClientCollaboration />} />
        <Route path="/client-timeline"        element={<ClientTimeline />} />
        <Route path="/client-marketplace"     element={<ClientMarketplace />} />
        <Route path="/client-documents"       element={<ClientDocuments />} />
        <Route path="/supervisor-gallery"     element={<SiteGalleryPage />} />
        <Route path="/designer-gallery"       element={<SiteGalleryPage />} />
        <Route path="/client-gallery"         element={<SiteGalleryPage />} />
        <Route path="/client-finance"         element={<ClientFinancePage />} />
        <Route path="/supervisor-snags"       element={<SupervisorSnags />} />
        <Route path="/client-snags"           element={<ClientSnags />} />
      </Route>
    </Routes>
  )
}
