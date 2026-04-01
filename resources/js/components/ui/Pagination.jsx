export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null

  const { current_page, last_page } = meta

  const pages = Array.from({ length: last_page }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === last_page || Math.abs(p - current_page) <= 2)

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <button
        onClick={() => onPageChange(current_page - 1)}
        disabled={current_page === 1}
        className="btn btn-ghost btn-sm disabled:opacity-40"
      >
        ← Prev
      </button>

      {pages.map((page, idx) => {
        const prev = pages[idx - 1]
        return (
          <div key={page} className="flex items-center gap-1">
            {prev && page - prev > 1 && (
              <span className="text-slate-400 text-sm px-1">…</span>
            )}
            <button
              onClick={() => onPageChange(page)}
              className={`btn btn-sm min-w-[2rem] ${
                page === current_page ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              {page}
            </button>
          </div>
        )
      })}

      <button
        onClick={() => onPageChange(current_page + 1)}
        disabled={current_page === last_page}
        className="btn btn-ghost btn-sm disabled:opacity-40"
      >
        Next →
      </button>

      <span className="text-xs text-slate-400 ml-2">
        {meta.from != null && meta.to != null
          ? `${meta.from}–${meta.to} of ${meta.total ?? 0}`
          : `0 of ${meta.total ?? 0}`}
      </span>
    </div>
  )
}
