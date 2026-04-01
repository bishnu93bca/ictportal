import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

function SortIcon({ active, dir }) {
  if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 inline ml-1" />
  return dir === 'asc'
    ? <ChevronUp   className="w-3.5 h-3.5 text-blue-500 inline ml-1" />
    : <ChevronDown className="w-3.5 h-3.5 text-blue-500 inline ml-1" />
}

/**
 * Reusable data table.
 *
 * Column definition:
 *   { label, key, sortable?, render?, thClass?, tdClass? }
 *
 * Sorting props (all optional):
 *   sortBy, sortDir, onSort(key)
 */
export default function DataTable({
  columns,
  data,
  isLoading,
  emptyMessage = 'No records found.',
  sortBy,
  sortDir,
  onSort,
}) {
  if (isLoading) {
    return <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
  }

  if (!data?.length) {
    return <div className="py-16 text-center text-slate-400 text-sm">{emptyMessage}</div>
  }

  const handleSort = (col) => {
    if (col.sortable && onSort) onSort(col.sortKey ?? col.key)
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr className="bg-slate-50">
            {columns.map((col) => (
              <th
                key={col.key ?? col.label}
                className={[
                  col.thClass ?? '',
                  col.sortable ? 'cursor-pointer select-none whitespace-nowrap' : '',
                ].join(' ').trim()}
                onClick={() => handleSort(col)}
              >
                {col.label}
                {col.sortable && (
                  <SortIcon
                    active={sortBy === (col.sortKey ?? col.key)}
                    dir={sortDir}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={row.id ?? rowIdx}>
              {columns.map((col) => (
                <td key={col.key ?? col.label} className={col.tdClass ?? ''}>
                  {col.render ? col.render(row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
