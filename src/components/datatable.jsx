import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'

export default function DataTable({ columns, data, actions }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter(row =>
      columns.some(col =>
        String(row[col.key] ?? '').toLowerCase().includes(q)
      )
    )
  }, [data, columns, query])

  return (
    <div className="bg-white rounded-xl border border-[#EFEFEF] shadow-sm overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center justify-end px-4 py-3 border-b border-[#EFEFEF]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-[#DDDDDD] rounded-lg focus:outline-none focus:border-primary text-body placeholder:text-muted w-52 transition-colors duration-150"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="text-left px-4 py-3 text-xs font-semibold text-white uppercase tracking-wide">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-10 text-center text-sm text-muted"
                >
                  No results found.
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  className={`border-b border-[#F4F4F4] last:border-0 transition-colors duration-100 hover:bg-light-blue/30 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F7F9FC]'}`}
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-body">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
