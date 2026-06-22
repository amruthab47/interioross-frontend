const STATUS_STYLES = {
  'On Track':    { bg: 'bg-[#E4F5EC]', text: 'text-[#1A7A4A]' },
  'Delayed':     { bg: 'bg-[#FEF3E2]', text: 'text-[#E07B20]' },
  'Critical':    { bg: 'bg-[#FDECEA]', text: 'text-[#C0392B]' },
  'Completed':   { bg: 'bg-[#D6E8F7]', text: 'text-[#1B4F8A]' },
  'In Progress': { bg: 'bg-[#FEF3E2]', text: 'text-[#E07B20]' },
  'Pending':     { bg: 'bg-[#F0F2F5]', text: 'text-[#777777]' },
  'Paid':        { bg: 'bg-[#E4F5EC]', text: 'text-[#1A7A4A]' },
  'Overdue':     { bg: 'bg-[#FDECEA]', text: 'text-[#C0392B]' },
}

const DEFAULT_STYLE = { bg: 'bg-[#F0F2F5]', text: 'text-[#777777]' }

export default function StatusBadge({ status }) {
  const { bg, text } = STATUS_STYLES[status] ?? DEFAULT_STYLE

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${bg} ${text}`}>
      {status}
    </span>
  )
}
