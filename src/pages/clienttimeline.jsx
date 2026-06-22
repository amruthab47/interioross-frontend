import { useState, useEffect } from 'react';
import { getProjects } from '../api/projects';
import { projectToRow } from '../utils/format';

// Fallback dates used before the project loads
const TIMELINE_START = new Date('2026-01-01');
const TIMELINE_END   = new Date('2026-12-31');

function makePct(start, end) {
  const totalDays = (end - start) / (1000 * 60 * 60 * 24) || 1;
  return (dateStr) => {
    const d = new Date(dateStr);
    const days = (d - start) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.min(100, (days / totalDays) * 100));
  };
}

function makeMonthLabels(start, end, pctFn) {
  const labels = [];
  let d = new Date(start);
  d.setDate(1);
  while (d <= end) {
    labels.push({
      label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      pct: pctFn(d.toISOString().slice(0, 10)),
    });
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return labels;
}

function statusStyle(status) {
  if (status === 'done')        return { bar: '#16a34a', text: 'text-green-700',  bg: 'bg-green-100'  };
  if (status === 'in-progress') return { bar: '#1B4F8A', text: 'text-[#1B4F8A]', bg: 'bg-[#D6E8F7]'  };
  return                               { bar: '#CBD5E1', text: 'text-[#777777]',  bg: 'bg-gray-100'   };
}

function StatusDot({ status }) {
  const map = { done: 'bg-green-500', 'in-progress': 'bg-[#1B4F8A]', upcoming: 'bg-gray-300' };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${map[status] ?? 'bg-gray-300'}`} />;
}

export default function ClientTimeline() {
  const [project, setProject] = useState({ name: '', phase: '', progress: 0, ganttItems: [], startDate: '', endDate: '' })

  useEffect(() => {
    getProjects().then(ps => { if (ps[0]) setProject(projectToRow(ps[0])) }).catch(console.error)
  }, [])

  // Derive timeline range from the actual project dates
  const timelineStart = project.startDate ? new Date(project.startDate) : TIMELINE_START
  const timelineEnd   = project.endDate   ? new Date(project.endDate)   : TIMELINE_END
  const pct           = makePct(timelineStart, timelineEnd)
  const monthLabels   = makeMonthLabels(timelineStart, timelineEnd, pct)

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const clientTimeline = project.ganttItems ?? []

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#0F1219] space-y-5">

      {/* Header */}
      <div className="bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm p-5">
        <h1 className="text-xl font-bold font-sora text-[#0F2340] dark:text-white">{project.name}</h1>
        <p className="text-[13px] text-[#777777] mt-1">Your project timeline &mdash; all dates are estimates</p>
        <div className="flex flex-wrap gap-4 mt-3">
          {[
            { label: 'Start Date',  value: project.startDate ? fmtDate(project.startDate) : '—' },
            { label: 'Deadline',    value: project.endDate   ? fmtDate(project.endDate)   : '—' },
            { label: 'Phase',       value: project.phase },
            { label: 'Progress',    value: `${project.progress}% complete` },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <span className="text-[11px] text-[#777777]">{label}</span>
              <span className="text-[13px] font-semibold text-[#1B4F8A]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gantt chart */}
      <div className="bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm p-5 overflow-x-auto">
        <h2 className="font-semibold font-sora text-[15px] text-[#0F2340] dark:text-white mb-4">Timeline Chart</h2>

        {/* Month header */}
        <div className="flex items-center mb-1" style={{ paddingLeft: 180 }}>
          <div className="relative flex-1" style={{ height: 20 }}>
            {monthLabels.map((m) => (
              <span
                key={m.label}
                className="absolute text-[11px] text-[#777777] font-medium"
                style={{ left: `${m.pct}%`, transform: 'translateX(-50%)' }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Grid + rows */}
        <div style={{ paddingLeft: 180 }} className="relative">
          {/* Vertical month lines */}
          <div className="absolute inset-0 pointer-events-none" style={{ left: 0, right: 0 }}>
            {monthLabels.map((m) => (
              <div
                key={m.label}
                className="absolute top-0 bottom-0 border-l border-dashed border-[#E0E0E0] dark:border-[#1F2937]"
                style={{ left: `${m.pct}%` }}
              />
            ))}
          </div>

          {/* Rows */}
          {clientTimeline.map((item) => {
            const st = statusStyle(item.status);
            const isMilestone = item.type === 'milestone';

            const leftPct  = isMilestone ? pct(item.date) : pct(item.start);
            const rightPct = isMilestone ? null           : pct(item.end);
            const widthPct = isMilestone ? null           : (rightPct - leftPct);

            return (
              <div key={item.id} className="flex items-center mb-3 relative" style={{ height: 36 }}>
                {/* Task label — positioned absolutely to the left of chart */}
                <div
                  className="absolute flex items-center gap-2"
                  style={{ width: 172, right: '100%', paddingRight: 8 }}
                >
                  <StatusDot status={item.status} />
                  <span className="text-[12px] text-[#333333] dark:text-gray-300 truncate font-medium leading-tight">
                    {item.task}
                  </span>
                </div>

                {/* Timeline bar area */}
                <div className="relative w-full h-6">
                  {isMilestone ? (
                    /* Diamond marker */
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-2 flex items-center justify-center"
                      style={{ left: `${leftPct}%`, backgroundColor: st.bar, borderColor: st.bar }}
                      title={item.label ?? item.task}
                    />
                  ) : (
                    /* Bar */
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-5 rounded-full flex items-center px-2 overflow-hidden"
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(widthPct, 1.5)}%`,
                        backgroundColor: st.bar + '33',
                        borderLeft: `3px solid ${st.bar}`,
                      }}
                    >
                      {item.assignee && (
                        <span className="text-[9px] font-medium truncate" style={{ color: st.bar }}>
                          {item.assignee}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Milestone tooltip — flip to left side when near right edge */}
                  {isMilestone && item.label && (
                    <span
                      className="absolute top-0 text-[9px] font-semibold text-[#777777] whitespace-nowrap"
                      style={leftPct > 75
                        ? { right: `calc(${100 - leftPct}% + 12px)` }
                        : { left: `calc(${leftPct}% + 12px)` }
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm p-4 flex flex-wrap gap-6">
        <span className="text-[12px] font-medium text-[#777777]">Legend:</span>
        {[
          { color: '#16a34a', label: 'Done' },
          { color: '#1B4F8A', label: 'In Progress' },
          { color: '#CBD5E1', label: 'Upcoming' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-8 h-3 rounded-full" style={{ backgroundColor: color + '55', borderLeft: `3px solid ${color}` }} />
            <span className="text-[12px] text-[#333333] dark:text-gray-300">{label} Task</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rotate-45 border-2 border-[#1B4F8A] bg-[#1B4F8A]" />
          <span className="text-[12px] text-[#333333] dark:text-gray-300">Milestone</span>
        </div>
      </div>

      {/* Task list */}
      <div className="bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm p-5">
        <h2 className="font-semibold font-sora text-[15px] text-[#0F2340] dark:text-white mb-4">All Timeline Items</h2>
        <div className="space-y-0.5">
          {clientTimeline.map((item) => {
            const st = statusStyle(item.status);
            const isMilestone = item.type === 'milestone';
            const dateStr = isMilestone
              ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : `${new Date(item.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — ${new Date(item.end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

            return (
              <div key={item.id} className="flex items-center gap-4 py-2.5 border-b border-[#F0F4F8] dark:border-[#1F2937] last:border-0">
                <StatusDot status={item.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[#333333] dark:text-gray-200">{item.task}</span>
                    {isMilestone && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#D6E8F7] text-[#1B4F8A] rounded font-semibold">Milestone</span>
                    )}
                  </div>
                  {item.assignee && (
                    <span className="text-[11px] text-[#777777]">Assigned to {item.assignee}</span>
                  )}
                  {item.label && (
                    <span className="text-[11px] text-[#2E6DA4] block">{item.label}</span>
                  )}
                </div>
                <span className="text-[11px] text-[#777777] whitespace-nowrap flex-shrink-0">{dateStr}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text} whitespace-nowrap`}>
                  {item.status === 'in-progress' ? 'In Progress' : item.status === 'done' ? 'Done' : 'Upcoming'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
