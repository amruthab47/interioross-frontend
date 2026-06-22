import { useState, useEffect } from 'react';
import { getProjects } from '../api/projects';
import { projectToRow } from '../utils/format';

// Timeline window: 2026-04-01 to 2026-08-01
const TIMELINE_START = new Date('2026-04-01');
const TIMELINE_END = new Date('2026-08-01');
const TOTAL_DAYS = Math.round((TIMELINE_END - TIMELINE_START) / 86400000);

// Months to show in the header
const MONTHS = [];
(function () {
  let cur = new Date(TIMELINE_START.getFullYear(), TIMELINE_START.getMonth(), 1);
  while (cur < TIMELINE_END) {
    MONTHS.push(new Date(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
})();

const dayOffset = (dateStr) => {
  const d = new Date(dateStr);
  return Math.max(0, Math.round((d - TIMELINE_START) / 86400000));
};

const toPercent = (days) => `${((days / TOTAL_DAYS) * 100).toFixed(2)}%`;

const STATUS_COLOR = {
  done: '#16a34a',
  'in-progress': '#1B4F8A',
  upcoming: '#9CA3AF',
};

const STATUS_LABEL = {
  done: 'Completed',
  'in-progress': 'In Progress',
  upcoming: 'Upcoming',
};

function AssigneeBadge({ name }) {
  if (!name) return null;
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D6E8F7] text-[#1B4F8A] text-[9px] font-bold flex-shrink-0 ml-1">
      {initials}
    </span>
  );
}

function MonthHeader() {
  return (
    <div className="relative h-8" style={{ marginLeft: 220 }}>
      {MONTHS.map((m) => {
        const offset = dayOffset(m.toISOString().slice(0, 10));
        const label = m.toLocaleString('default', { month: 'short', year: '2-digit' });
        return (
          <div
            key={m.toISOString()}
            className="absolute top-0 h-full flex items-center"
            style={{ left: toPercent(offset) }}
          >
            <span className="text-[10px] text-[#777777] font-medium whitespace-nowrap pl-1">
              {label}
            </span>
            <div className="absolute left-0 top-0 h-full w-px bg-[#E0E0E0]" />
          </div>
        );
      })}
    </div>
  );
}

function GanttRow({ item }) {
  const isTask = item.type === 'task';
  const color = STATUS_COLOR[item.status];

  const left = isTask ? toPercent(dayOffset(item.start)) : toPercent(dayOffset(item.date));
  const width = isTask
    ? toPercent(Math.max(1, dayOffset(item.end) - dayOffset(item.start)))
    : null;

  return (
    <div className="flex items-center border-b border-[#F0F0F0] hover:bg-[#F7F9FC] transition-colors">
      {/* Row label */}
      <div
        className="flex-shrink-0 flex items-center gap-1 pr-3 py-2.5 pl-3"
        style={{ width: 220 }}
      >
        <span className="text-[12px] text-[#333333] truncate flex-1 leading-tight">
          {item.task}
        </span>
        {item.assignee && <AssigneeBadge name={item.assignee} />}
      </div>

      {/* Bar area */}
      <div className="flex-1 relative" style={{ height: 36 }}>
        {/* Month grid lines */}
        {MONTHS.map((m) => {
          const off = dayOffset(m.toISOString().slice(0, 10));
          return (
            <div
              key={m.toISOString()}
              className="absolute top-0 h-full w-px bg-[#F0F0F0]"
              style={{ left: toPercent(off) }}
            />
          );
        })}

        {isTask ? (
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-md flex items-center px-2"
            style={{
              left,
              width,
              height: 20,
              backgroundColor: color,
              opacity: item.status === 'upcoming' ? 0.55 : 1,
            }}
          >
            {item.status !== 'upcoming' && (
              <span className="text-[10px] text-white font-medium truncate">
                {item.assignee ? item.assignee.split(' ')[0] : ''}
              </span>
            )}
          </div>
        ) : (
          // Milestone diamond
          <div
            className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group"
            style={{ left, transform: 'translate(-50%, -50%)' }}
          >
            <div
              className="w-3 h-3 rotate-45 border-2 flex-shrink-0"
              style={{ borderColor: color, backgroundColor: color }}
            />
            <span
              className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
              style={{ color, backgroundColor: '#fff', border: `1px solid ${color}` }}
            >
              {item.label || item.task}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const TODAY_DATE = new Date('2026-05-26')
const todayOffset = Math.round((TODAY_DATE - TIMELINE_START) / 86400000)
const todayInRange = todayOffset > 0 && todayOffset < TOTAL_DAYS
const todayPct = `${((todayOffset / TOTAL_DAYS) * 100).toFixed(3)}%`

export default function DesignerTimeline() {
  const [designerProjects, setDesignerProjects] = useState([])
  const [ganttData, setGanttData] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(null)

  useEffect(() => {
    getProjects().then(ps => {
      const rows = ps.map(projectToRow)
      setDesignerProjects(rows)
      if (rows[0]) {
        setActiveProjectId(rows[0].id)
        setGanttData(rows[0].ganttItems ?? [])
      }
    }).catch(console.error)
  }, [])

  const filtered = ganttData
  const activeProject = designerProjects.find((p) => p.id === activeProjectId);

  return (
    <div className="min-h-screen bg-[#F7F9FC] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-sora text-2xl font-bold text-[#0F2340]">Project Timeline</h1>
        <p className="text-[13px] text-[#777777] mt-1">
          Gantt chart view of design phases and milestones
        </p>
      </div>

      {/* Project selector tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {designerProjects.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveProjectId(p.id)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-colors ${
              activeProjectId === p.id
                ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]'
                : 'bg-white text-[#333333] border-[#E0E0E0] hover:border-[#2E6DA4] hover:text-[#2E6DA4]'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Gantt card */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-5 py-4 border-b border-[#E0E0E0] flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-sora text-[15px] font-semibold text-[#0F2340]">
              {activeProject?.name}
            </h2>
            <p className="text-[12px] text-[#777777]">
              {activeProject?.client} &bull; {activeProject?.phase} &bull; {activeProject?.progress}% complete
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <span key={key} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: STATUS_COLOR[key], opacity: key === 'upcoming' ? 0.55 : 1 }}
                />
                <span className="text-[#777777]">{label}</span>
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rotate-45 border-2"
                style={{ borderColor: '#0F2340' }}
              />
              <span className="text-[#777777]">Milestone</span>
            </span>
          </div>
        </div>

        {/* Gantt body */}
        <div className="overflow-x-auto">
          <div style={{ minWidth: 900 }} className="relative">
            {/* Month labels */}
            <div className="border-b border-[#E0E0E0] bg-[#F7F9FC]">
              <div className="flex items-stretch">
                <div
                  className="flex-shrink-0 px-3 py-2 text-[11px] font-semibold text-[#777777] uppercase tracking-wide border-r border-[#E0E0E0]"
                  style={{ width: 220 }}
                >
                  Task / Phase
                </div>
                <div className="flex-1 relative" style={{ height: 32 }}>
                  <MonthHeader />
                  {todayInRange && (
                    <div className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none" style={{ left: todayPct }}>
                      <span className="text-[8px] font-bold text-white bg-[#E07B20] px-1 py-0.5 rounded whitespace-nowrap">Today</span>
                      <div className="flex-1 w-0.5 bg-[#E07B20]" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Today line overlay across all rows */}
            {todayInRange && (
              <div className="absolute top-8 bottom-0 w-0.5 bg-[#E07B20] opacity-60 pointer-events-none z-20"
                style={{ left: `calc(220px + (100% - 220px) * ${(todayOffset / TOTAL_DAYS).toFixed(4)})` }} />
            )}

            {/* Rows */}
            {filtered.map((item) => (
              <GanttRow key={item.id} item={item} />
            ))}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-[13px] text-[#777777]">
                No timeline data for this project.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend footer */}
      <div className="mt-4 flex flex-wrap items-center gap-5 text-[12px] text-[#777777]">
        <span className="font-medium text-[#0F2340]">Legend:</span>
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className="inline-block w-10 h-3 rounded-sm"
              style={{ backgroundColor: STATUS_COLOR[key], opacity: key === 'upcoming' ? 0.55 : 1 }}
            />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rotate-45 border-2"
            style={{ borderColor: '#0F2340' }}
          />
          Milestone
        </span>
      </div>
    </div>
  );
}
