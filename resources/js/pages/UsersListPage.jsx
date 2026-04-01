import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, Trash2, MapPin, School } from 'lucide-react'
import api from '@/lib/axios'
import DataTable from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/auth'
import { USER_ROLES, USER_STATUSES } from '@/constants/user'

function usersPageSubtitle(authUser, listScope) {
  if (authUser?.role === 'super_admin') {
    return 'Full directory — all districts'
  }
  const d = listScope?.district || (authUser?.role === 'admin' && authUser?.district?.trim()
    ? authUser.district
    : null)
  if (d) {
    return `Users in ${d} only — other districts are hidden`
  }
  if (authUser?.role === 'admin') {
    return 'All districts — add a district on your account to limit this list'
  }
  return 'Directory of portal users'
}

export default function UsersListPage() {
  const navigate  = useNavigate()
  const authUser  = useAuthStore((s) => s.user)

  /** Admin with a district: list is server-scoped; cannot switch district via UI. */
  const isDistrictAdmin =
    authUser?.role === 'admin' && Boolean(authUser?.district?.trim())

  const [users, setUsers]         = useState([])
  const [meta, setMeta]           = useState(null)
  const [listScope, setListScope] = useState(null)
  const [isLoading, setLoading]   = useState(true)
  const [districts, setDistricts] = useState([])
  const [blocks, setBlocks]       = useState([])
  const [filters, setFilters]     = useState({
    search: '', role: '', status: '', district: '', block: '', page: 1,
  })

  // Refresh profile without toggling global isLoading (fetchMe would blank the whole app)
  useEffect(() => {
    useAuthStore.getState().refreshUser()
  }, [])

  // Load districts on mount
  useEffect(() => {
    api.get('/v1/users/districts').then(({ data }) => setDistricts(data.districts ?? []))
  }, [])

  // Load blocks when district changes (district admins: use their district from profile)
  useEffect(() => {
    setBlocks([])
    const d = isDistrictAdmin ? authUser?.district : filters.district
    if (!d) return
    api.get('/v1/users/districts', { params: { district: d } })
      .then(({ data }) => setBlocks(data.blocks ?? []))
  }, [isDistrictAdmin, authUser?.district, filters.district])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: filters.page, per_page: 15 }
      if (filters.search)   params.search   = filters.search
      if (filters.role)     params.role     = filters.role
      if (filters.status)   params.status   = filters.status
      if (filters.district && !isDistrictAdmin) params.district = filters.district
      if (filters.block)    params.block    = filters.block

      const { data } = await api.get('/v1/users', { params })
      setUsers(Array.isArray(data.data) ? data.data : [])
      setMeta(data)
      setListScope(data.list_scope ?? null)
    } catch {
      toast.error('Failed to load users.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [filters, isDistrictAdmin])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`/v1/users/${id}`)
      toast.success('User deleted.')
      fetchUsers()
    } catch {
      toast.error('Failed to delete user.')
    }
  }

  const columns = [
    {
      label: '#',
      key: 'sno',
      thClass: 'w-10',
      render: (_row, _col, rowIdx) => (
        <span className="text-xs text-slate-400">
          {(filters.page - 1) * 15 + rowIdx + 1}
        </span>
      ),
    },
    {
      label: 'User',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} src={row.avatar} size="sm" />
          <div>
            <p className="font-medium text-slate-800 text-sm">{row.name}</p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      label: 'School / UDISE',
      key: 'school_name',
      render: (row) => row.school_name ? (
        <div>
          <p className="text-sm text-slate-700 leading-tight">{row.school_name}</p>
          {row.udise_code && (
            <p className="text-xs text-slate-400 font-mono mt-0.5">{row.udise_code}</p>
          )}
        </div>
      ) : (
        <span className="text-slate-400 text-xs">—</span>
      ),
    },
    {
      label: 'District / Block',
      key: 'district',
      render: (row) => (row.district || row.city) ? (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="w-3 h-3 shrink-0" />
          <span>{[row.district, row.city].filter(Boolean).join(' / ')}</span>
        </div>
      ) : (
        <span className="text-slate-400 text-xs">—</span>
      ),
    },
    {
      label: 'Role',
      key: 'role',
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      label: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      label: 'Actions',
      key: 'actions',
      thClass: 'text-right',
      tdClass: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="View"
            onClick={() => navigate(`/users/${row.id}`)}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          {authUser?.role === 'super_admin' && (
            <button
              title="Delete"
              onClick={() => handleDelete(row.id)}
              className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{usersPageSubtitle(authUser, listScope)}</p>
        </div>
        <div className="flex items-center gap-2">
          {authUser?.role === 'super_admin' && (
            <button
              onClick={() => navigate('/users/trashed')}
              className="btn btn-ghost btn-sm text-slate-500"
            >
              Deleted Users
            </button>
          )}
          {authUser?.role === 'super_admin' && (
            <button
              onClick={() => navigate('/users/create')}
              className="btn-primary"
            >
              + Create User
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          placeholder="Search name, email, UDISE, school…"
          className="input flex-1 min-w-[200px] max-w-[200px]"
        />

        <select
          value={filters.role}
          onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value, page: 1 }))}
          className="select max-w-[200px]"
        >
          <option value="">All Roles</option>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          className="select max-w-[200px]"
        >
          <option value="">All Statuses</option>
          {USER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {!isDistrictAdmin && (
          <select
            value={filters.district}
            onChange={(e) =>
              setFilters((f) => ({ ...f, district: e.target.value, block: '', page: 1 }))
            }
            className="select max-w-[200px]"
          >
            <option value="">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}

        {(isDistrictAdmin || filters.district) && (
          <select
            value={filters.block}
            onChange={(e) => setFilters((f) => ({ ...f, block: e.target.value, page: 1 }))}
            className="select max-w-[200px]"
          >
            <option value="">All Blocks</option>
            {blocks.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}

        {(filters.search || filters.role || filters.status || (!isDistrictAdmin && filters.district) || filters.block) && (
          <button
            onClick={() => setFilters({ search: '', role: '', status: '', district: '', block: '', page: 1 })}
            className="btn btn-ghost btn-sm text-slate-500"
          >
            Reset
          </button>
        )}
      </div>

      {(listScope?.district || isDistrictAdmin || filters.district) && (
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
          <School className="w-4 h-4 text-blue-500" />
          <span>
            List is scoped to{' '}
            <strong>
              {listScope?.district ?? (isDistrictAdmin ? authUser?.district : filters.district)}
            </strong>
            {listScope?.state && (
              <span className="text-slate-400"> ({listScope.state})</span>
            )}
            {filters.block && <> › <strong>{filters.block}</strong></>}
            {(listScope?.district || isDistrictAdmin) && (
              <span className="text-slate-400 ml-1">— enforced on server</span>
            )}
          </span>
        </div>
      )}

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          emptyMessage="No users found matching your filters."
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
    </div>
  )
}
