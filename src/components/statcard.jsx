export default function StatCard({ title, value, icon: Icon, trend, iconBg, iconColor }) {
  const isUp = trend?.direction === 'up'

  return (
    <div className="bg-white rounded-xl border border-[#EFEFEF] shadow-sm p-5 flex items-center gap-4">

      {/* Icon circle */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={22} strokeWidth={1.75} className={iconColor} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted uppercase tracking-wide leading-none">
          {title}
        </p>
        <p className="font-sora text-[22px] font-bold text-body mt-1.5 leading-none">
          {value}
        </p>
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={[
                'inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md leading-none',
                isUp
                  ? 'text-[#15803d] bg-[#f0fdf4]'
                  : 'text-[#dc2626] bg-[#fef2f2]',
              ].join(' ')}
            >
              {isUp ? '↑' : '↓'} {isUp ? '+' : '-'}{trend.value}%
            </span>
            {trend.label && (
              <span className="text-[11px] text-muted">{trend.label}</span>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
