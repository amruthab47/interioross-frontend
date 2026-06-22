import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, CheckSquare, GitBranch, PenTool, Calendar, ChevronRight, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { getProjects } from '../api/projects';
import { getAllVersions } from '../api/designs';
import { projectToRow } from '../utils/format';

const statusBadge = (status) => {
  if (status === 'In Progress')
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700">
        In Progress
      </span>
    );
  if (status === 'Pending Approval')
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-100 text-[#E07B20]">
        Pending Approval
      </span>
    );
  if (status === 'Design Complete')
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
        Design Complete
      </span>
    );
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
      {status}
    </span>
  );
};

const ProgressBar = ({ value }) => (
  <div className="w-full bg-[#D6E8F7] rounded-full h-[6px]">
    <div
      className="bg-[#1B4F8A] h-[6px] rounded-full transition-all"
      style={{ width: `${value}%` }}
    />
  </div>
);

const KpiCard = ({ icon: Icon, label, value, iconColor, to }) => {
  const cls = "bg-white dark:bg-[#141B27] rounded-xl p-5 border border-[#E0E0E0] dark:border-[#1F2937] flex items-center gap-4 hover:shadow-md hover:border-primary/30 transition-all duration-150"
  const inner = (
    <>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconColor + '1A' }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-2xl font-bold font-sora text-[#1B4F8A]">{value}</p>
        <p className="text-[12px] text-[#777777] mt-0.5">{label}</p>
      </div>
    </>
  )
  return to ? <Link to={to} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>
}

export default function DesignerDashboard() {
  const { user } = useAuth()
  const [designerProjects, setDesignerProjects] = useState([])
  const [designVersions,   setDesignVersions]   = useState([])
  const [designComments,   setDesignComments]   = useState([])

  useEffect(() => {
    getProjects().then(ps => setDesignerProjects(ps.map(projectToRow))).catch(console.error)
    getAllVersions().then(vs => {
      setDesignVersions(vs)
      // Load comments for the most recent version
      if (vs.length) {
        const last = vs[vs.length - 1]
        import('../api/designs').then(({ getVersionComments }) =>
          getVersionComments(last._id).then(setDesignComments).catch(() => {})
        )
      }
    }).catch(console.error)
  }, [])

  const projectNameMap = designerProjects.reduce((acc, p) => { acc[p.id] = p.name; return acc; }, {})
  const activeProjects = designerProjects.filter(p => p.status === 'In Progress' || p.status === 'On Track')
  const pendingApprovals = designVersions.filter(v => v.status === 'Pending Review')
  const upcomingMilestones = []

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#F7F9FC] p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-sora font-semibold text-[#0F2340] dark:text-white leading-tight">
              Designer Dashboard
            </h1>
            <p className="text-[13px] text-[#777777] mt-0.5">
              Welcome back, <span className="text-[#1B4F8A] font-medium">{user?.name ?? 'Designer'}</span> — {today}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-[#E0E0E0] rounded-lg px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-[#1B4F8A] flex items-center justify-center text-white text-[10px] font-bold">
              {user?.initials ?? 'D'}
            </div>
            <span className="text-[13px] text-[#333333] font-medium">{user?.name ?? 'Designer'}</span>
            <span className="text-[11px] text-[#777777] border border-[#D6E8F7] bg-[#D6E8F7] text-[#1B4F8A] rounded px-1.5 py-0.5 ml-1">
              {user?.role ?? 'Designer'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KpiCard icon={Layers}      label="Active Projects"   value={activeProjects.length}   iconColor="#1B4F8A" to="/designer"                />
          <KpiCard icon={CheckSquare} label="Pending Approvals"  value={pendingApprovals.length} iconColor="#E07B20" to="/designer-collaboration"   />
          <KpiCard icon={GitBranch}   label="Design Versions"    value={designVersions.length}   iconColor="#2E6DA4" to="/designer-collaboration"   />
          <KpiCard icon={PenTool}     label="Design Studio"      value="Open"                    iconColor="#16a34a" to="/designer-studio"          />
        </div>

        {pendingApprovals.length > 0 && (
          <Link
            to="/designer-collaboration"
            className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl border-2 border-[#E07B20] bg-[#FFF3E8] hover:bg-[#FDE8CC] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#E07B20] flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#E07B20] leading-tight">
                  {pendingApprovals.length} design{pendingApprovals.length > 1 ? 's' : ''} pending client approval
                </p>
                <p className="text-[12px] text-[#9A4E0A] mt-0.5">
                  Review and send for approval to unblock project delivery
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[#E07B20] font-semibold text-[13px] flex-shrink-0 group-hover:gap-2.5 transition-all">
              Go to Collaboration
              <ArrowRight size={16} />
            </div>
          </Link>
        )}

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0F0F0] dark:border-[#1F2937] flex items-center justify-between">
              <h2 className="font-sora font-semibold text-[15px] text-[#333333] dark:text-white">
                Active Projects
              </h2>
              <span className="text-[12px] text-[#777777]">{designerProjects.length} total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-[#0F2340] text-white">
                    <th className="text-left px-5 py-2.5 font-medium text-[12px]">Project</th>
                    <th className="text-left px-4 py-2.5 font-medium text-[12px]">Client</th>
                    <th className="text-left px-4 py-2.5 font-medium text-[12px]">Status</th>
                    <th className="text-left px-4 py-2.5 font-medium text-[12px]">Phase</th>
                    <th className="text-left px-4 py-2.5 font-medium text-[12px] w-32">Progress</th>
                    <th className="text-center px-4 py-2.5 font-medium text-[12px]">Versions</th>
                    <th className="text-left px-4 py-2.5 font-medium text-[12px]">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {designerProjects.map((project, idx) => (
                    <tr
                      key={project.id}
                      className={`border-b border-[#F0F0F0] dark:border-[#1F2937] hover:bg-[#D6E8F7] dark:hover:bg-[#1a2235] transition-colors ${
                        idx % 2 === 1 ? 'bg-[#F7F9FC] dark:bg-[#161D2A]' : 'bg-white dark:bg-[#141B27]'
                      }`}
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#0F2340] dark:text-white text-[13px]">
                          {project.name}
                        </p>
                        <p className="text-[11px] text-[#777777] mt-0.5">{project.style} · {project.area}</p>
                      </td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#B0B8C4]">
                        {project.client}
                      </td>
                      <td className="px-4 py-3">{statusBadge(project.status)}</td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#B0B8C4]">
                        {project.phase}
                      </td>
                      <td className="px-4 py-3 w-32">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={project.progress} />
                          <span className="text-[11px] text-[#777777] w-8 flex-shrink-0">
                            {project.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#D6E8F7] text-[#1B4F8A] text-[11px] font-semibold">
                          {designVersions.filter(v => String(v.projectId?._id ?? v.projectId) === String(project.id)).length}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-[#777777]">
                          <Calendar size={12} />
                          <span className="text-[12px]">
                            {project.endDate
                              ? new Date(project.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-span-1 bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0F0F0] dark:border-[#1F2937] flex items-center justify-between">
              <h2 className="font-sora font-semibold text-[15px] text-[#333333] dark:text-white">
                Upcoming Milestones
              </h2>
              <span className="text-[12px] text-[#777777]">{upcomingMilestones.length} pending</span>
            </div>

            <div className="divide-y divide-[#F0F0F0] dark:divide-[#1F2937]">
              {upcomingMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="px-5 py-3.5 hover:bg-[#F7F9FC] dark:hover:bg-[#1a2235] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#E07B20] mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#333333] dark:text-white leading-snug">
                        {milestone.label || milestone.task}
                      </p>
                      <p className="text-[11px] text-[#1B4F8A] font-medium mt-0.5">
                        {projectNameMap[milestone.projectId] || `Project ${milestone.projectId}`}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5 text-[#777777]">
                        <Clock size={11} />
                        <span className="text-[11px]">
                          {new Date(milestone.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[#777777] mt-0.5 flex-shrink-0" />
                  </div>
                </div>
              ))}

              {upcomingMilestones.length === 0 && (
                <div className="px-5 py-8 text-center text-[#777777] text-[13px]">
                  No upcoming milestones
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0F0F0] dark:border-[#1F2937]">
              <h2 className="font-sora font-semibold text-[15px] text-[#333333] dark:text-white">
                Recent Design Versions
              </h2>
            </div>
            <div className="divide-y divide-[#F0F0F0] dark:divide-[#1F2937]">
              {designVersions.slice(0, 5).map((v) => {
                let badgeClass = 'bg-gray-100 text-gray-600';
                if (v.status === 'Approved') badgeClass = 'bg-green-100 text-green-700';
                else if (v.status === 'Pending Review') badgeClass = 'bg-blue-100 text-blue-700';
                else if (v.status === 'Changes Requested') badgeClass = 'bg-orange-100 text-[#E07B20]';
                else if (v.status === 'Rejected') badgeClass = 'bg-red-100 text-red-600';

                return (
                  <div
                    key={String(v._id ?? v.id)}
                    className="px-5 py-3 hover:bg-[#F7F9FC] dark:hover:bg-[#1a2235] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#D6E8F7] flex items-center justify-center">
                          <GitBranch size={14} className="text-[#1B4F8A]" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-[#333333] dark:text-white">
                            {projectNameMap[String(v.projectId?._id ?? v.projectId)]} — {v.versionLabel ?? v.version}
                          </p>
                          <p className="text-[11px] text-[#777777] mt-0.5 max-w-[260px] truncate">
                            {Array.isArray(v.changes) ? v.changes.join(', ') : (v.changes ?? '')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${badgeClass}`}>
                          {v.status}
                        </span>
                        <span className="text-[11px] text-[#777777]">
                          {(v.createdAt || v.date) ? new Date(v.createdAt ?? v.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          }) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0F0F0] dark:border-[#1F2937]">
              <h2 className="font-sora font-semibold text-[15px] text-[#333333] dark:text-white">
                Client Comments
              </h2>
            </div>
            <div className="divide-y divide-[#F0F0F0] dark:divide-[#1F2937]">
              {designComments.map((c) => (
                <div
                  key={c.id}
                  className="px-5 py-3.5 hover:bg-[#F7F9FC] dark:hover:bg-[#1a2235] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#0F2340] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {c.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-medium text-[#333333] dark:text-white">
                          {c.author}
                          <span className="ml-1.5 text-[10px] text-[#777777] font-normal">
                            ({c.role})
                          </span>
                        </p>
                        {c.resolved ? (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            Resolved
                          </span>
                        ) : (
                          <span className="text-[10px] bg-orange-100 text-[#E07B20] px-1.5 py-0.5 rounded-full flex-shrink-0">
                            Open
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#555] dark:text-[#B0B8C4] mt-0.5 leading-relaxed">
                        {c.comment}
                      </p>
                      <p className="text-[10px] text-[#777777] mt-1">{c.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
