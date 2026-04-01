import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ShieldCheck, KeyRound, Plus, Pencil, Trash2, Eye, Search,
  CheckSquare, Square, Users, Lock,
} from 'lucide-react'
import { useRbacStore } from '@/store/rbac'
import Modal from '@/components/ui/Modal'
import DataTable from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'

/* ─── Helpers ─────────────────────────────────────────────────────── */

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '')
}

function permSlugify(str) {
  // for permissions: module.action format — dots allowed
  return str.toLowerCase().trim().replace(/[^\w.\-]/g, '').replace(/\s+/g, '-')
}

function SystemBadge({ is_system }) {
  if (!is_system) return null
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-600">
      <Lock className="w-2.5 h-2.5" /> System
    </span>
  )
}

function GroupBadge({ group }) {
  const colors = {
    users: 'bg-blue-50 text-blue-700', complaints: 'bg-yellow-50 text-yellow-700',
    categories: 'bg-purple-50 text-purple-700', roles: 'bg-red-50 text-red-700',
    dashboard: 'bg-green-50 text-green-700', general: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[group] ?? colors.general}`}>
      {group}
    </span>
  )
}

/* ─── View Role Modal ─────────────────────────────────────────────── */

function ViewRoleModal({ isOpen, onClose, role }) {
  if (!role) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Role Details" size="md">
      <dl className="divide-y divide-slate-100">
        <div className="py-3 flex gap-4">
          <dt className="w-28 text-xs text-slate-400 uppercase pt-0.5 shrink-0">Name</dt>
          <dd className="flex-1 text-sm font-semibold text-slate-800 flex items-center gap-2">
            {role.name} <SystemBadge is_system={role.is_system} />
          </dd>
        </div>
        <div className="py-3 flex gap-4">
          <dt className="w-28 text-xs text-slate-400 uppercase pt-0.5 shrink-0">Slug</dt>
          <dd className="flex-1 text-sm font-mono text-slate-600">{role.slug}</dd>
        </div>
        <div className="py-3 flex gap-4">
          <dt className="w-28 text-xs text-slate-400 uppercase pt-0.5 shrink-0">Description</dt>
          <dd className="flex-1 text-sm text-slate-600">{role.description || '—'}</dd>
        </div>
        <div className="py-3 flex gap-4">
          <dt className="w-28 text-xs text-slate-400 uppercase pt-0.5 shrink-0">Permissions</dt>
          <dd className="flex-1 text-sm text-slate-800">{role.permissions_count ?? 0}</dd>
        </div>
        <div className="py-3 flex gap-4">
          <dt className="w-28 text-xs text-slate-400 uppercase pt-0.5 shrink-0">Users</dt>
          <dd className="flex-1 text-sm text-slate-800">{role.users_count ?? 0}</dd>
        </div>
      </dl>
    </Modal>
  )
}

/* ─── Role Form Modal ─────────────────────────────────────────────── */

function RoleFormModal({ isOpen, onClose, initial, onSaved }) {
  const { createRole, updateRole, fetchGroupedPermissions, fetchRolePermissions } = useRbacStore()
  const isEdit = Boolean(initial)

  const [form, setForm]             = useState({ name: '', slug: '', description: '', is_system: false })
  const [slugEdited, setSlugEdited] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [errors, setErrors]         = useState({})
  const [permGroups, setPermGroups] = useState([])
  const [selectedPermIds, setSelectedPermIds] = useState(() => new Set())
  const [loadingPerms, setLoadingPerms] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm({
        name:        initial?.name        ?? '',
        slug:        initial?.slug        ?? '',
        description: initial?.description ?? '',
        is_system:   initial?.is_system   ?? false,
      })
      setSlugEdited(isEdit)
      setErrors({})
    }
  }, [isOpen, initial, isEdit])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setLoadingPerms(true)
    ;(async () => {
      try {
        if (isEdit && initial?.id) {
          const grouped = await fetchRolePermissions(initial.id)
          if (cancelled) return
          setPermGroups(grouped)
          const ids = new Set()
          grouped.forEach((g) => g.permissions.forEach((p) => {
            if (p.assigned) ids.add(p.id)
          }))
          setSelectedPermIds(ids)
        } else {
          const grouped = await fetchGroupedPermissions()
          if (cancelled) return
          setPermGroups(grouped)
          setSelectedPermIds(new Set())
        }
      } catch {
        if (!cancelled) {
          setPermGroups([])
          setSelectedPermIds(new Set())
        }
      } finally {
        if (!cancelled) setLoadingPerms(false)
      }
    })()
    return () => { cancelled = true }
  }, [isOpen, isEdit, initial?.id, fetchGroupedPermissions, fetchRolePermissions])

  const handleName = (e) => {
    const name = e.target.value
    setForm((f) => ({ ...f, name, slug: slugEdited ? f.slug : slugify(name) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (!form.slug.trim()) errs.slug = 'Slug is required.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        slug: slugify(form.slug),
        permissions: [...selectedPermIds],
      }
      if (isEdit) { await updateRole(initial.id, payload); toast.success('Role updated.') }
      else        { await createRole(payload);              toast.success('Role created.') }
      onSaved(); onClose()
    } catch (err) {
      const msg = err.response?.data?.errors ?? err.response?.data?.message ?? 'Failed to save.'
      if (typeof msg === 'object') {
        const mapped = {}
        Object.entries(msg).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v })
        setErrors(mapped)
      } else toast.error(msg)
    } finally { setSaving(false) }
  }

  const togglePerm = (id) => setSelectedPermIds((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const togglePermGroup = (group) => {
    const ids = group.permissions.map((p) => p.id)
    const allSelected = ids.every((id) => selectedPermIds.has(id))
    setSelectedPermIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)))
      return next
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Role' : 'Add Role'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
          <input className={`input w-full ${errors.name ? 'border-red-400' : ''}`} value={form.name} onChange={handleName} placeholder="e.g. Editor" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Slug <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              className={`input w-full font-mono text-sm pr-14 ${errors.slug ? 'border-red-400' : ''}`}
              value={form.slug}
              onChange={(e) => { setSlugEdited(true); setForm((f) => ({ ...f, slug: e.target.value })) }}
              placeholder="auto-generated"
            />
            {!slugEdited && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">auto</span>}
          </div>
          {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea className="input w-full resize-none" rows={2} value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Permissions</label>
          <p className="text-xs text-slate-500 mb-2">Select which permissions this role grants. You can refine these later from the key icon on each role.</p>
          {loadingPerms ? (
            <div className="py-8 text-center text-slate-400 text-sm border border-slate-100 rounded-xl">Loading permissions…</div>
          ) : (
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
              {permGroups.map((group) => {
                const allChecked = group.permissions.every((p) => selectedPermIds.has(p.id))
                const someChecked = group.permissions.some((p) => selectedPermIds.has(p.id))
                return (
                  <div key={group.group} className="border border-slate-100 rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => togglePermGroup(group)}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 transition text-left"
                    >
                      {allChecked
                        ? <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                        : someChecked
                          ? <CheckSquare className="w-4 h-4 text-blue-300 shrink-0" />
                          : <Square className="w-4 h-4 text-slate-300 shrink-0" />}
                      <span className="text-sm font-semibold text-slate-700 capitalize">{group.group}</span>
                      <span className="ml-auto text-xs text-slate-400">
                        {group.permissions.filter((p) => selectedPermIds.has(p.id)).length} / {group.permissions.length}
                      </span>
                    </button>
                    <div className="divide-y divide-slate-50">
                      {group.permissions.map((p) => (
                        <label key={p.id} className="flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 transition">
                          <input
                            type="checkbox"
                            className="mt-0.5 accent-blue-500"
                            checked={selectedPermIds.has(p.id)}
                            onChange={() => togglePerm(p.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700">{p.name}</p>
                            <p className="text-xs font-mono text-slate-400">{p.slug}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {!loadingPerms && (
            <p className="text-xs text-slate-400 mt-1.5">{selectedPermIds.size} permission{selectedPermIds.size !== 1 ? 's' : ''} selected</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ─── Assign Permissions Modal ────────────────────────────────────── */

function PermissionsModal({ isOpen, onClose, role, onSaved }) {
  const { fetchRolePermissions, syncRolePermissions } = useRbacStore()

  const [permissionGroups, setPermissionGroups] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (!isOpen || !role) return
    let cancelled = false
    setLoading(true)
    fetchRolePermissions(role.id)
      .then((grouped) => {
        if (cancelled) return
        setPermissionGroups(grouped)
        const assignedIds = new Set()
        grouped.forEach((g) => g.permissions.forEach((p) => { if (p.assigned) assignedIds.add(p.id) }))
        setSelected(assignedIds)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isOpen, role?.id, fetchRolePermissions])

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleGroup = (group) => {
    const ids = group.permissions.map((p) => p.id)
    const allSelected = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => allSelected ? next.delete(id) : next.add(id))
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await syncRolePermissions(role.id, [...selected])
      toast.success('Permissions saved.')
      onSaved(); onClose()
    } catch { toast.error('Failed to save permissions.') }
    finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Permissions — ${role?.name ?? ''}`} size="lg">
      {loading ? (
        <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {permissionGroups.map((group) => {
            const allChecked = group.permissions.every((p) => selected.has(p.id))
            const someChecked = group.permissions.some((p) => selected.has(p.id))
            return (
              <div key={group.group} className="border border-slate-100 rounded-xl overflow-hidden">
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition text-left"
                >
                  {allChecked
                    ? <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                    : someChecked
                    ? <CheckSquare className="w-4 h-4 text-blue-300 shrink-0" />
                    : <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  }
                  <span className="text-sm font-semibold text-slate-700 capitalize">{group.group}</span>
                  <span className="ml-auto text-xs text-slate-400">
                    {group.permissions.filter((p) => selected.has(p.id)).length} / {group.permissions.length}
                  </span>
                </button>

                {/* Permissions grid */}
                <div className="divide-y divide-slate-50">
                  {group.permissions.map((p) => (
                    <label key={p.id} className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-blue-500"
                        checked={selected.has(p.id)}
                        onChange={() => toggle(p.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">{p.name}</p>
                        <p className="text-xs font-mono text-slate-400">{p.slug}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 mt-4">
        <span className="text-xs text-slate-400">{selected.size} permission{selected.size !== 1 ? 's' : ''} selected</span>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving || loading} className="btn btn-primary btn-sm">
            {saving ? 'Saving…' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Roles Tab ───────────────────────────────────────────────────── */

function RolesTab() {
  const { roles, roleMeta, rolesLoading, fetchRoles, deleteRole } = useRbacStore()

  const [filters, setFilters] = useState({ search: '', page: 1, per_page: 15 })
  const [modal, setModal]     = useState({ type: null, item: null })
  const debounceRef           = useRef(null)

  const load = useCallback(() => {
    const params = { page: filters.page, per_page: filters.per_page }
    if (filters.search) params.search = filters.search
    fetchRoles(params)
  }, [filters, fetchRoles])

  useEffect(() => { load() }, [load])

  const handleSearch = (e) => {
    clearTimeout(debounceRef.current)
    const val = e.target.value
    debounceRef.current = setTimeout(() => setFilters((f) => ({ ...f, search: val, page: 1 })), 350)
  }

  const handleDelete = async (role) => {
    if (role.is_system) { toast.error('System roles cannot be deleted.'); return }
    if (!confirm(`Delete role "${role.name}"?`)) return
    try { await deleteRole(role.id); toast.success('Role deleted.'); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed to delete.') }
  }

  const columns = [
    { label: '#', key: '_no', thClass: 'w-10',
      render: (_, idx) => <span className="text-xs text-slate-400">{((roleMeta?.current_page ?? 1) - 1) * filters.per_page + idx + 1}</span> },
    { label: 'Name', key: 'name',
      render: (row) => (
        <div>
          <span className="font-medium text-slate-800">{row.name}</span>
          <SystemBadge is_system={row.is_system} />
        </div>
      ),
    },
    { label: 'Slug', key: 'slug', render: (row) => <span className="font-mono text-xs text-slate-500">{row.slug}</span> },
    { label: 'Permissions', key: 'permissions_count',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          <KeyRound className="w-3 h-3" /> {row.permissions_count ?? 0}
        </span>
      ),
    },
    { label: 'Users', key: 'users_count',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          <Users className="w-3 h-3" /> {row.users_count ?? 0}
        </span>
      ),
    },
    { label: 'Description', key: 'description',
      render: (row) => <span className="text-xs text-slate-500 line-clamp-1">{row.description || '—'}</span> },
    { label: 'Actions', key: '_actions', thClass: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button title="View" onClick={() => setModal({ type: 'view', item: row })}
            className="btn btn-ghost btn-icon text-slate-400 hover:text-blue-600">
            <Eye className="w-4 h-4" />
          </button>
          <button title="Assign Permissions" onClick={() => setModal({ type: 'permissions', item: row })}
            className="btn btn-ghost btn-icon text-slate-400 hover:text-purple-600">
            <KeyRound className="w-4 h-4" />
          </button>
          <button title="Edit" onClick={() => setModal({ type: 'edit', item: row })}
            className="btn btn-ghost btn-icon text-slate-400 hover:text-amber-600">
            <Pencil className="w-4 h-4" />
          </button>
          <button title={row.is_system ? 'System roles cannot be deleted' : 'Delete'}
            onClick={() => handleDelete(row)}
            disabled={row.is_system}
            className={`btn btn-ghost btn-icon ${row.is_system ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-600'}`}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9 w-full" placeholder="Search roles…" defaultValue={filters.search} onChange={handleSearch} />
        </div>
        <button className="btn btn-primary btn-sm flex items-center gap-1.5 whitespace-nowrap"
          onClick={() => setModal({ type: 'add', item: null })}>
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <DataTable columns={columns} data={roles} isLoading={rolesLoading} emptyMessage="No roles found." />
      </div>

      {roleMeta && roleMeta.last_page > 1 && (
        <div className="mt-4">
          <Pagination meta={roleMeta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </div>
      )}

      <ViewRoleModal isOpen={modal.type === 'view'} onClose={() => setModal({ type: null, item: null })} role={modal.item} />
      <RoleFormModal
        isOpen={modal.type === 'add' || modal.type === 'edit'}
        onClose={() => setModal({ type: null, item: null })}
        initial={modal.type === 'edit' ? modal.item : null}
        onSaved={load}
      />
      <PermissionsModal
        isOpen={modal.type === 'permissions'}
        onClose={() => setModal({ type: null, item: null })}
        role={modal.item}
        onSaved={load}
      />
    </div>
  )
}

/* ─── Permission Form Modal ───────────────────────────────────────── */

const PERM_GROUPS = ['dashboard', 'users', 'complaints', 'categories', 'roles', 'general']

function PermissionFormModal({ isOpen, onClose, initial, onSaved }) {
  const { createPermission, updatePermission } = useRbacStore()
  const isEdit = Boolean(initial)

  const [form, setForm]             = useState({ name: '', slug: '', description: '', group: '' })
  const [slugEdited, setSlugEdited] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [errors, setErrors]         = useState({})

  useEffect(() => {
    if (isOpen) {
      setForm({
        name:        initial?.name        ?? '',
        slug:        initial?.slug        ?? '',
        description: initial?.description ?? '',
        group:       initial?.group       ?? '',
      })
      setSlugEdited(isEdit)
      setErrors({})
    }
  }, [isOpen, initial, isEdit])

  const handleName = (e) => {
    const name = e.target.value
    setForm((f) => ({ ...f, name, slug: slugEdited ? f.slug : permSlugify(name) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim())  errs.name  = 'Name is required.'
    if (!form.slug.trim())  errs.slug  = 'Slug is required.'
    if (!form.group.trim()) errs.group = 'Group is required.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      if (isEdit) { await updatePermission(initial.id, form); toast.success('Permission updated.') }
      else        { await createPermission(form);             toast.success('Permission created.') }
      onSaved(); onClose()
    } catch (err) {
      const msg = err.response?.data?.errors ?? err.response?.data?.message ?? 'Failed to save.'
      if (typeof msg === 'object') {
        const mapped = {}
        Object.entries(msg).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v })
        setErrors(mapped)
      } else toast.error(msg)
    } finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Permission' : 'Add Permission'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
          <input className={`input w-full ${errors.name ? 'border-red-400' : ''}`} value={form.name} onChange={handleName} placeholder="e.g. View Reports" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Slug <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              className={`input w-full font-mono text-sm pr-14 ${errors.slug ? 'border-red-400' : ''}`}
              value={form.slug}
              onChange={(e) => { setSlugEdited(true); setForm((f) => ({ ...f, slug: e.target.value })) }}
              placeholder="module.action"
            />
            {!slugEdited && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">auto</span>}
          </div>
          {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
          <p className="text-xs text-slate-400 mt-1">Use <code className="bg-slate-100 px-1 rounded">module.action</code> format, e.g. <code className="bg-slate-100 px-1 rounded">users.create</code></p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Group <span className="text-red-500">*</span></label>
          <select className={`input w-full ${errors.group ? 'border-red-400' : ''}`} value={form.group}
            onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}>
            <option value="">— Select group —</option>
            {PERM_GROUPS.map((g) => <option key={g} value={g} className="capitalize">{g}</option>)}
          </select>
          {errors.group && <p className="text-xs text-red-500 mt-1">{errors.group}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea className="input w-full resize-none" rows={2} value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ─── Permissions Tab ─────────────────────────────────────────────── */

function PermissionsTab() {
  const { permissions, permissionMeta, permissionsLoading, fetchPermissions, deletePermission } = useRbacStore()

  const [filters, setFilters] = useState({ search: '', group: '', page: 1, per_page: 20, sort_by: 'group', sort_dir: 'asc' })
  const [modal, setModal]     = useState({ type: null, item: null })
  const debounceRef           = useRef(null)

  const load = useCallback(() => {
    const params = { page: filters.page, per_page: filters.per_page, sort_by: filters.sort_by, sort_dir: filters.sort_dir }
    if (filters.search) params.search = filters.search
    if (filters.group)  params.group  = filters.group
    fetchPermissions(params)
  }, [filters, fetchPermissions])

  useEffect(() => { load() }, [load])

  const handleSearch = (e) => {
    clearTimeout(debounceRef.current)
    const val = e.target.value
    debounceRef.current = setTimeout(() => setFilters((f) => ({ ...f, search: val, page: 1 })), 350)
  }

  const handleSort = (key) => setFilters((f) => ({
    ...f, sort_by: key, page: 1,
    sort_dir: f.sort_by === key && f.sort_dir === 'asc' ? 'desc' : 'asc',
  }))

  const handleDelete = async (perm) => {
    if (!confirm(`Delete permission "${perm.slug}"?`)) return
    try { await deletePermission(perm.id); toast.success('Permission deleted.'); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed to delete.') }
  }

  const columns = [
    { label: '#', key: '_no', thClass: 'w-10',
      render: (_, idx) => <span className="text-xs text-slate-400">{((permissionMeta?.current_page ?? 1) - 1) * filters.per_page + idx + 1}</span> },
    { label: 'Name', key: 'name', sortable: true,
      render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
    { label: 'Slug', key: 'slug', sortable: true,
      render: (row) => <code className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{row.slug}</code> },
    { label: 'Group', key: 'group', sortable: true,
      render: (row) => <GroupBadge group={row.group} /> },
    { label: 'Roles', key: 'roles_count',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          <ShieldCheck className="w-3 h-3" /> {row.roles_count ?? 0}
        </span>
      ),
    },
    { label: 'Description', key: 'description',
      render: (row) => <span className="text-xs text-slate-500 line-clamp-1">{row.description || '—'}</span> },
    { label: 'Actions', key: '_actions', thClass: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button title="Edit" onClick={() => setModal({ type: 'edit', item: row })}
            className="btn btn-ghost btn-icon text-slate-400 hover:text-amber-600">
            <Pencil className="w-4 h-4" />
          </button>
          <button title="Delete" onClick={() => handleDelete(row)}
            className="btn btn-ghost btn-icon text-slate-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9 w-full" placeholder="Search permissions…" defaultValue={filters.search} onChange={handleSearch} />
        </div>
        <select className="input w-40" value={filters.group}
          onChange={(e) => setFilters((f) => ({ ...f, group: e.target.value, page: 1 }))}>
          <option value="">All Groups</option>
          {PERM_GROUPS.map((g) => <option key={g} value={g} className="capitalize">{g}</option>)}
        </select>
        <button className="btn btn-primary btn-sm flex items-center gap-1.5 whitespace-nowrap"
          onClick={() => setModal({ type: 'add', item: null })}>
          <Plus className="w-4 h-4" /> Add Permission
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <DataTable
          columns={columns} data={permissions} isLoading={permissionsLoading}
          emptyMessage="No permissions found."
          sortBy={filters.sort_by} sortDir={filters.sort_dir} onSort={handleSort}
        />
      </div>

      {permissionMeta && permissionMeta.last_page > 1 && (
        <div className="mt-4">
          <Pagination meta={permissionMeta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </div>
      )}

      <PermissionFormModal
        isOpen={modal.type === 'add' || modal.type === 'edit'}
        onClose={() => setModal({ type: null, item: null })}
        initial={modal.type === 'edit' ? modal.item : null}
        onSaved={load}
      />
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'roles',       label: 'Roles',       Icon: ShieldCheck },
  { id: 'permissions', label: 'Permissions', Icon: KeyRound    },
]

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState('roles')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Roles & Permissions</h1>
        <p className="text-sm text-slate-500 mt-1">Manage roles, permissions, and their assignments.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'roles'       && <RolesTab />}
      {activeTab === 'permissions' && <PermissionsTab />}
    </div>
  )
}
