import { useEffect, useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  Eye, ShieldAlert, Search, RefreshCw, X,
  UserCheck, LogIn, LogOut, Plus, Pencil, Trash2,
} from 'lucide-react'
import api from '@/lib/axios'
import DataTable from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'

/* ─── Constants ────────────────────────────────────────────────── */

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']

const MODULES = ['auth', 'users', 'complaints', 'categories', 'sub_categories', 'roles', 'permissions']

const ACTION_META = {
  CREATE:  { label: 'Create',  icon: Plus,      bg: 'bg-green-100',  text: 'text-green-700'  },
  UPDATE:  { label: 'Update',  icon: Pencil,     bg: 'bg-blue-100',   text: 'text-blue-700'   },
  DELETE:  { label: 'Delete',  icon: Trash2,     bg: 'bg-red-100',    text: 'text-red-700'    },
  LOGIN:   { label: 'Login',   icon: LogIn,      bg: 'bg-indigo-100', text: 'text-indigo-700' },
  LOGOUT:  { label: 'Logout',  icon: LogOut,     bg: 'bg-slate-100',  text: 'text-slate-600'  },
}

/* ─── Sub-components ───────────────────────────────────────────── */

function ActionBadge({ action }) {
  const meta = ACTION_META[action] ?? { label: action, icon: ShieldAlert, bg: 'bg-gray-100', text: 'text-gray-600' }
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  )
}

function ModuleBadge({ module }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-600 capitalize">
      {module}
    </span>
  )
}

function DiffView({ oldData, newData }) {
  if (!oldData && !newData) return <p className="text-slate-400 text-sm italic">No data snapshot.</p>

  const keys = Array.from(new Set([
    ...(oldData ? Object.keys(oldData) : []),
    ...(newData ? Object.keys(newData) : []),
  ])).filter((k) => !['updated_at', 'created_at', 'deleted_at'].includes(k))

  const changed = keys.filter(
    (k) => JSON.stringify(oldData?.[k]) !== JSON.stringify(newData?.[k]),
  )
  const unchanged = keys.filter((k) => !changed.includes(k))

  const renderRow = (k, highlight) => (
    <tr key={k} className={highlight ? 'bg-yellow-50' : ''}>
      <td className="py-1 pr-3 text-xs font-mono text-slate-500 whitespace-nowrap align-top">{k}</td>
      {oldData !== null && (
        <td className={`py-1 pr-3 text-xs break-all align-top ${highlight ? 'text-red-600 line-through' : 'text-slate-600'}`}>
          {oldData?.[k] !== undefined ? JSON.stringify(oldData[k]) : '—'}
        </td>
      )}
      {newData !== null && (
        <td className={`py-1 text-xs break-all align-top ${highlight ? 'text-green-700 font-medium' : 'text-slate-600'}`}>
          {newData?.[k] !== undefined ? JSON.stringify(newData[k]) : '—'}
        </td>
      )}
    </tr>
  )

  return (
    <div className="overflow-auto max-h-80">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-1 pr-3 text-xs text-slate-400 font-medium">Field</th>
            {oldData !== null && <th className="py-1 pr-3 text-xs text-slate-400 font-medium">Before</th>}
            {newData !== null && <th className="py-1 text-xs text-slate-400 font-medium">After</th>}
          </tr>
        </thead>
        <tbody>
          {changed.map((k) => renderRow(k, true))}
          {unchanged.map((k) => renderRow(k, false))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Main page ────────────────────────────────────────────────── */

export default function AuditLogsPage() {
  const [logs, setLogs]         = useState([])
  const [meta, setMeta]         = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filters, setFilters]   = useState({
    search: '', action: '', module: '', date_from: '', date_to: '', page: 1,
  })
  const searchRef = useRef(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: filters.page, per_page: 20 }
      if (filters.search)    params.search    = filters.search
      if (filters.action)    params.action    = filters.action
      if (filters.module)    params.module    = filters.module
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to)   params.date_to   = filters.date_to

      const { data } = await api.get('/v1/audit-logs', { params })
      setLogs(data.data)
      setMeta(data)
    } catch {
      toast.error('Failed to load audit logs.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const resetFilters = () =>
    setFilters({ search: '', action: '', module: '', date_from: '', date_to: '', page: 1 })

  const hasFilters = filters.search || filters.action || filters.module || filters.date_from || filters.date_to

  const columns = [
    {
      label: '#',
      key: 'id',
      thClass: 'w-12',
      render: (_row, _col, rowIdx) => (
        <span className="text-xs text-slate-400">
          {(filters.page - 1) * 20 + rowIdx + 1}
        </span>
      ),
    },
    {
      label: 'User',
      key: 'user',
      render: (row) => row.user ? (
        <div className="flex items-center gap-2">
          <Avatar name={row.user.name} src={row.user.avatar} size="xs" />
          <div>
            <p className="text-sm font-medium text-slate-700 leading-tight">{row.user.name}</p>
            <p className="text-xs text-slate-400">{row.user.email}</p>
          </div>
        </div>
      ) : (
        <span className="text-xs text-slate-400 italic">System</span>
      ),
    },
    {
      label: 'Action',
      key: 'action',
      render: (row) => <ActionBadge action={row.action} />,
    },
    {
      label: 'Module',
      key: 'module',
      render: (row) => <ModuleBadge module={row.module} />,
    },
    {
      label: 'Description',
      key: 'description',
      render: (row) => (
        <p className="text-sm text-slate-700 max-w-sm truncate" title={row.description}>
          {row.description}
        </p>
      ),
    },
    {
      label: 'IP Address',
      key: 'ip_address',
      render: (row) => (
        <span className="text-xs font-mono text-slate-500">{row.ip_address ?? '—'}</span>
      ),
    },
    {
      label: 'Time',
      key: 'created_at',
      render: (row) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      label: '',
      key: 'actions',
      thClass: 'w-10',
      render: (row) => (
        <button
          title="View details"
          onClick={() => setSelected(row)}
          className="p-1.5 rounded hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-500" />
            Audit Logs
          </h1>
          <p className="page-subtitle">Track all user actions across the system</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          title="Refresh"
          className="btn btn-ghost btn-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchRef}
            type="search"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            placeholder="Search description or IP…"
            className="input pl-9"
          />
        </div>

        {/* Action */}
        <select
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value, page: 1 }))}
          className="select max-w-[200px]"
        >
          <option value="">All Actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {/* Module */}
        <select
          value={filters.module}
          onChange={(e) => setFilters((f) => ({ ...f, module: e.target.value, page: 1 }))}
          className="select max-w-[200px]"
        >
          <option value="">All Modules</option>
          {MODULES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value, page: 1 }))}
            className="input w-36 text-sm"
            title="From date"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value, page: 1 }))}
            className="input w-36 text-sm"
            title="To date"
          />
        </div>

        {/* Reset */}
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="btn btn-ghost btn-sm text-slate-500 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          emptyMessage="No audit log entries found."
        />
      </div>

      {meta && (
        <div className="mt-4">
          <Pagination
            meta={meta}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <Modal
          isOpen={Boolean(selected)}
          onClose={() => setSelected(null)}
          title="Audit Log Detail"
          size="lg"
        >
          <div className="space-y-4">
            {/* Meta row */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Action</p>
                <ActionBadge action={selected.action} />
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Module</p>
                <ModuleBadge module={selected.module} />
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">User</p>
                {selected.user ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={selected.user.name} src={selected.user.avatar} size="xs" />
                    <span className="font-medium text-slate-700">{selected.user.name}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">System</span>
                )}
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Timestamp</p>
                <p className="text-slate-700 font-medium">
                  {new Date(selected.created_at).toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">IP Address</p>
                <p className="font-mono text-slate-700">{selected.ip_address ?? '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 col-span-1">
                <p className="text-xs text-slate-400 mb-1">User Agent</p>
                <p className="text-xs text-slate-500 truncate" title={selected.user_agent}>
                  {selected.user_agent ?? '—'}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Description</p>
              <p className="text-sm text-slate-700">{selected.description}</p>
            </div>

            {/* Data diff */}
            {(selected.old_data || selected.new_data) && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                  Data Snapshot
                </p>
                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                  <DiffView oldData={selected.old_data} newData={selected.new_data} />
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
