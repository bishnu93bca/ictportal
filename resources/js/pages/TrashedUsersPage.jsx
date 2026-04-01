import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import DataTable from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import { RoleBadge } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'

export default function TrashedUsersPage() {
  const navigate = useNavigate()

  const [users, setUsers]     = useState([])
  const [meta, setMeta]       = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', page: 1 })

  const fetchTrashed = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: filters.page, per_page: 15 }
      if (filters.search) params.search = filters.search

      const { data } = await api.get('/v1/users/trashed', { params })
      setUsers(data.data)
      setMeta(data)
    } catch {
      toast.error('Failed to load deleted users.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchTrashed() }, [fetchTrashed])

  const handleRestore = async (id) => {
    if (!confirm('Restore this user?')) return
    try {
      await api.post(`/v1/users/${id}/restore`)
      toast.success('User restored.')
      fetchTrashed()
    } catch {
      toast.error('Failed to restore user.')
    }
  }

  const handleForceDelete = async (id) => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return
    try {
      await api.delete(`/v1/users/${id}/force`)
      toast.success('User permanently deleted.')
      fetchTrashed()
    } catch {
      toast.error('Failed to permanently delete user.')
    }
  }

  const columns = [
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
      label: 'Role',
      key: 'role',
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      label: 'Deleted At',
      key: 'deleted_at',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.deleted_at).toLocaleString()}
        </span>
      ),
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRestore(row.id)}
            className="btn btn-ghost btn-sm text-green-600 hover:bg-green-50"
          >
            Restore
          </button>
          <button
            onClick={() => handleForceDelete(row.id)}
            className="btn btn-danger btn-sm"
          >
            Delete Forever
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <button
            onClick={() => navigate('/users')}
            className="text-sm text-blue-600 hover:underline mb-1 block"
          >
            ← Back to Users
          </button>
          <h1 className="page-title">Deleted Users</h1>
          <p className="page-subtitle">Restore or permanently delete soft-deleted accounts</p>
        </div>
      </div>

      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          placeholder="Search by name or email…"
          className="input max-w-xs"
        />
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          emptyMessage="No deleted users found."
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
