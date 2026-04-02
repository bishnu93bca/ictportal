import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import { FolderOpen, FolderTree, Plus, Pencil, Trash2, Search, Eye, Package } from 'lucide-react'
import { useCategoryStore } from '@/store/category'
import { useAuthStore } from '@/store/auth'
import { hasPermission } from '@/lib/permissions'
import Modal from '@/components/ui/Modal'
import DataTable from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'

/* ─── Helpers ─────────────────────────────────────────────────────── */

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function StatusToggle({ item, onToggle, saving }) {
  return (
    <button
      title={item.status ? 'Click to deactivate' : 'Click to activate'}
      disabled={saving}
      onClick={() => onToggle(item)}
      className={`relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none ${
        item.status ? 'bg-blue-500' : 'bg-slate-300'
      } ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
        item.status ? 'translate-x-4' : 'translate-x-0.5'
      }`} />
    </button>
  )
}

/* ─── Shared form fields (slug auto-gen + status toggle) ──────────── */

function FormFields({ form, errors, slugEdited, onName, onSlug, onStatusToggle }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          className={`input w-full ${errors.name ? 'border-red-400' : ''}`}
          value={form.name}
          onChange={onName}
          placeholder="e.g. Hardware"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Slug <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            className={`input w-full font-mono text-sm pr-16 ${errors.slug ? 'border-red-400' : ''}`}
            value={form.slug}
            onChange={onSlug}
            placeholder="auto-generated"
          />
          {!slugEdited && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 select-none">auto</span>
          )}
        </div>
        {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
        <p className="text-xs text-slate-400 mt-1">Auto-generated from name.</p>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">Status</label>
        <button
          type="button"
          onClick={onStatusToggle}
          className={`relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none ${
            form.status ? 'bg-blue-500' : 'bg-slate-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
            form.status ? 'translate-x-4' : 'translate-x-0.5'
          }`} />
        </button>
      </div>
    </>
  )
}

/* ─── Category Form Modal ─────────────────────────────────────────── */

function CategoryModal({ isOpen, onClose, initial, onSaved }) {
  const { createCategory, updateCategory } = useCategoryStore()
  const isEdit = Boolean(initial)

  const [form, setForm]             = useState({ name: '', slug: '', status: true })
  const [slugEdited, setSlugEdited] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [errors, setErrors]         = useState({})

  useEffect(() => {
    if (isOpen) {
      setForm({ name: initial?.name ?? '', slug: initial?.slug ?? '', status: initial?.status ?? true })
      setSlugEdited(isEdit)
      setErrors({})
    }
  }, [isOpen, initial, isEdit])

  const handleName = (e) => {
    const name = e.target.value
    setForm((f) => ({ ...f, name, slug: slugEdited ? f.slug : slugify(name) }))
  }

  const handleSlug = (e) => { setSlugEdited(true); setForm((f) => ({ ...f, slug: e.target.value })) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (!form.slug.trim()) errs.slug = 'Slug is required.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const payload = { ...form, slug: slugify(form.slug) }
      if (isEdit) { await updateCategory(initial.id, payload); toast.success('Category updated.') }
      else        { await createCategory(payload);              toast.success('Category created.') }
      onSaved(); onClose()
    } catch (err) {
      const msg = err.response?.data?.errors ?? err.response?.data?.message ?? 'Failed to save.'
      if (typeof msg === 'object') {
        const mapped = {}
        Object.entries(msg).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v })
        setErrors(mapped)
      } else { toast.error(msg) }
    } finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Category' : 'Add Category'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFields
          form={form} errors={errors} slugEdited={slugEdited}
          onName={handleName} onSlug={handleSlug}
          onStatusToggle={() => setForm((f) => ({ ...f, status: !f.status }))}
        />
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

/* ─── SubCategory Form Modal ──────────────────────────────────────── */

function SubCategoryModal({ isOpen, onClose, initial, onSaved }) {
  const { allCategories, fetchAllCategories, createSubCategory, updateSubCategory } = useCategoryStore()
  const isEdit = Boolean(initial)

  const [form, setForm]             = useState({ category_id: '', name: '', slug: '', status: true })
  const [slugEdited, setSlugEdited] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [errors, setErrors]         = useState({})

  useEffect(() => {
    if (isOpen) {
      fetchAllCategories()
      setForm({
        category_id: initial?.category_id ?? '',
        name:        initial?.name        ?? '',
        slug:        initial?.slug        ?? '',
        status:      initial?.status      ?? true,
      })
      setSlugEdited(isEdit)
      setErrors({})
    }
  }, [isOpen, initial, isEdit, fetchAllCategories])

  const handleName = (e) => {
    const name = e.target.value
    setForm((f) => ({ ...f, name, slug: slugEdited ? f.slug : slugify(name) }))
  }

  const handleSlug = (e) => { setSlugEdited(true); setForm((f) => ({ ...f, slug: e.target.value })) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.category_id) errs.category_id = 'Please select a category.'
    if (!form.name.trim())  errs.name        = 'Name is required.'
    if (!form.slug.trim())  errs.slug        = 'Slug is required.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const payload = { ...form, slug: slugify(form.slug), category_id: Number(form.category_id) }
      if (isEdit) { await updateSubCategory(initial.id, payload); toast.success('Sub-category updated.') }
      else        { await createSubCategory(payload);              toast.success('Sub-category created.') }
      onSaved(); onClose()
    } catch (err) {
      const msg = err.response?.data?.errors ?? err.response?.data?.message ?? 'Failed to save.'
      if (typeof msg === 'object') {
        const mapped = {}
        Object.entries(msg).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v })
        setErrors(mapped)
      } else { toast.error(msg) }
    } finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Sub-Category' : 'Add Sub-Category'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            className={`input w-full ${errors.category_id ? 'border-red-400' : ''}`}
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
          >
            <option value="">— Select category —</option>
            {allCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id}</p>}
        </div>

        <FormFields
          form={form} errors={errors} slugEdited={slugEdited}
          onName={handleName} onSlug={handleSlug}
          onStatusToggle={() => setForm((f) => ({ ...f, status: !f.status }))}
        />

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

/* ─── Equipment Model Form Modal ─────────────────────────────────── */

function EquipmentModelModal({ isOpen, onClose, initial, onSaved }) {
  const { createEquipmentModel, updateEquipmentModel } = useCategoryStore()
  const isEdit = Boolean(initial)

  const [form, setForm]             = useState({ sub_category_id: '', name: '', slug: '', status: true })
  const [slugEdited, setSlugEdited] = useState(false)
  const [subOptions, setSubOptions]   = useState([])
  const [saving, setSaving]         = useState(false)
  const [errors, setErrors]         = useState({})

  useEffect(() => {
    if (!isOpen) return
    api.get('/v1/sub-categories', { params: { per_page: 500, sort_by: 'name', sort_dir: 'asc' } })
      .then(({ data }) => setSubOptions(data.data ?? []))
      .catch(() => setSubOptions([]))
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setForm({
        sub_category_id: initial?.sub_category_id ?? '',
        name:            initial?.name            ?? '',
        slug:            initial?.slug            ?? '',
        status:          initial?.status          ?? true,
      })
      setSlugEdited(isEdit)
      setErrors({})
    }
  }, [isOpen, initial, isEdit])

  const handleName = (e) => {
    const name = e.target.value
    setForm((f) => ({ ...f, name, slug: slugEdited ? f.slug : slugify(name) }))
  }

  const handleSlug = (e) => { setSlugEdited(true); setForm((f) => ({ ...f, slug: e.target.value })) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.sub_category_id) errs.sub_category_id = 'Select a sub-category.'
    if (!form.name.trim())       errs.name = 'Model name is required.'
    if (!form.slug.trim())       errs.slug = 'Slug is required.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        sub_category_id: Number(form.sub_category_id),
        slug: slugify(form.slug),
      }
      if (isEdit) { await updateEquipmentModel(initial.id, payload); toast.success('Equipment model updated.') }
      else        { await createEquipmentModel(payload);              toast.success('Equipment model created.') }
      onSaved(); onClose()
    } catch (err) {
      const msg = err.response?.data?.errors ?? err.response?.data?.message ?? 'Failed to save.'
      if (typeof msg === 'object') {
        const mapped = {}
        Object.entries(msg).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v })
        setErrors(mapped)
      } else { toast.error(msg) }
    } finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Equipment Model' : 'Add Equipment Model'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Sub-Category <span className="text-red-500">*</span>
          </label>
          <select
            className={`input w-full ${errors.sub_category_id ? 'border-red-400' : ''}`}
            value={form.sub_category_id}
            onChange={(e) => setForm((f) => ({ ...f, sub_category_id: e.target.value }))}
          >
            <option value="">— Select —</option>
            {subOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.category?.name ? `${s.category.name} → ${s.name}` : s.name}
              </option>
            ))}
          </select>
          {errors.sub_category_id && <p className="text-xs text-red-500 mt-1">{errors.sub_category_id}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Model name <span className="text-red-500">*</span>
          </label>
          <input
            className={`input w-full ${errors.name ? 'border-red-400' : ''}`}
            value={form.name}
            onChange={handleName}
            placeholder="e.g. Veriton X2680G"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Slug <span className="text-red-500">*</span></label>
          <input
            className={`input w-full font-mono text-sm ${errors.slug ? 'border-red-400' : ''}`}
            value={form.slug}
            onChange={handleSlug}
          />
          {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, status: !f.status }))}
            className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
              form.status ? 'bg-blue-500' : 'bg-slate-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
              form.status ? 'translate-x-4' : 'translate-x-0.5'
            }`} />
          </button>
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

/* ─── View Modal ──────────────────────────────────────────────────── */

function ViewModal({ isOpen, onClose, item, type }) {
  if (!item) return null
  const title = type === 'category'
    ? 'Category Details'
    : type === 'equipment-model'
      ? 'Equipment Model Details'
      : 'Sub-Category Details'
  const rows = [
    ...(type === 'subcategory' ? [
      { label: 'Category', value: item.category?.name },
      { label: 'Equipment models', value: item.equipment_models_count ?? 0 },
    ] : []),
    ...(type === 'equipment-model' ? [
      { label: 'Category', value: item.sub_category?.category?.name },
      { label: 'Sub-Category', value: item.sub_category?.name },
    ] : []),
    { label: 'Name',  value: item.name },
    { label: 'Slug',  value: item.slug, mono: true },
    ...(type === 'category' ? [{ label: 'Sub-categories', value: item.sub_categories_count ?? 0 }] : []),
    { label: 'Status',  value: <StatusBadge active={item.status} /> },
    { label: 'Created', value: item.created_at ? new Date(item.created_at).toLocaleDateString() : '—' },
  ]
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <dl className="divide-y divide-slate-100">
        {rows.map(({ label, value, mono }) => (
          <div key={label} className="py-3 flex gap-4">
            <dt className="w-32 text-xs text-slate-400 uppercase tracking-wide pt-0.5 shrink-0">{label}</dt>
            <dd className={`flex-1 text-sm text-slate-700 font-medium ${mono ? 'font-mono' : ''}`}>{value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}

/* ─── RBAC: categories.* (from auth user; super_admin has *) ───────── */

function useCategoryPermissions() {
  const permissions = useAuthStore((s) => s.user?.permissions ?? [])
  return {
    canView: hasPermission(permissions, 'categories.view'),
    canCreate: hasPermission(permissions, 'categories.create'),
    canEdit: hasPermission(permissions, 'categories.edit'),
    canDelete: hasPermission(permissions, 'categories.delete'),
  }
}

/* ─── Action buttons shared by tabs ──────────────────────────────── */

function RowActions({ onView, onEdit, onDelete, canEdit, canDelete }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button title="View" type="button" onClick={onView} className="btn btn-ghost btn-icon text-slate-400 hover:text-blue-600">
        <Eye className="w-4 h-4" />
      </button>
      {canEdit && (
        <button title="Edit" type="button" onClick={onEdit} className="btn btn-ghost btn-icon text-slate-400 hover:text-amber-600">
          <Pencil className="w-4 h-4" />
        </button>
      )}
      {canDelete && (
        <button title="Delete" type="button" onClick={onDelete} className="btn btn-ghost btn-icon text-slate-400 hover:text-red-600">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

/* ─── Categories Tab ──────────────────────────────────────────────── */

function CategoriesTab() {
  const { canView, canCreate, canEdit, canDelete } = useCategoryPermissions()
  const {
    categories, categoryMeta, categoriesLoading,
    fetchCategories, deleteCategory, updateCategory,
  } = useCategoryStore()

  const [filters, setFilters]   = useState({ search: '', status: 'all', page: 1, sort_by: 'created_at', sort_dir: 'desc' })
  const [modal, setModal]       = useState({ type: null, item: null })
  const [toggling, setToggling] = useState(null)
  const debounceRef             = useRef(null)
  const searchRef               = useRef(null)

  const load = useCallback(() => {
    const params = { page: filters.page, per_page: 10, sort_by: filters.sort_by, sort_dir: filters.sort_dir }
    if (filters.search)           params.search = filters.search
    if (filters.status !== 'all') params.status = filters.status === 'active' ? 1 : 0
    fetchCategories(params)
  }, [filters, fetchCategories])

  useEffect(() => {
    if (!canView) return
    load()
  }, [load, canView])

  const handleSearch = (e) => {
    clearTimeout(debounceRef.current)
    const val = e.target.value
    debounceRef.current = setTimeout(() => setFilters((f) => ({ ...f, search: val, page: 1 })), 350)
  }

  const handleSort = (key) => setFilters((f) => ({
    ...f, sort_by: key, page: 1,
    sort_dir: f.sort_by === key && f.sort_dir === 'asc' ? 'desc' : 'asc',
  }))

  const handleToggleStatus = async (item) => {
    setToggling(item.id)
    try {
      await updateCategory(item.id, { status: !item.status })
      toast.success(`Category ${!item.status ? 'activated' : 'deactivated'}.`)
      load()
    } catch { toast.error('Failed to update status.') }
    finally { setToggling(null) }
  }

  const handleDelete = async (item) => {
    if (!confirm(`Delete category "${item.name}"? This cannot be undone.`)) return
    try { await deleteCategory(item.id); toast.success('Category deleted.'); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed to delete category.') }
  }

  const columns = [
    {
      label: '#', key: '_no', thClass: 'w-10',
      render: (_, idx) => (
        <span className="text-xs text-slate-400">
          {((categoryMeta?.current_page ?? 1) - 1) * (categoryMeta?.per_page ?? 10) + idx + 1}
        </span>
      ),
    },
    { label: 'Name', key: 'name', sortable: true,
      render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
    { label: 'Slug', key: 'slug', sortable: true,
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.slug}</span> },
    { label: 'Sub-categories', key: 'sub_categories_count',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          {row.sub_categories_count ?? 0}
        </span>
      ),
    },
    { label: 'Status', key: 'status', sortable: true,
      render: (row) => (
        canEdit ? (
          <StatusToggle item={row} onToggle={handleToggleStatus} saving={toggling === row.id} />
        ) : (
          <StatusBadge active={row.status} />
        )
      ),
    },
    { label: 'Created', key: 'created_at', sortable: true,
      render: (row) => <span className="text-xs text-slate-400">{new Date(row.created_at).toLocaleDateString()}</span> },
    { label: 'Actions', key: '_actions', thClass: 'text-right',
      render: (row) => (
        <RowActions
          onView={() => setModal({ type: 'view', item: row })}
          onEdit={() => setModal({ type: 'edit', item: row })}
          onDelete={() => handleDelete(row)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ]

  return (
    <div>
      {!canView && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
          You do not have <span className="font-mono text-xs">categories.view</span>. Ask a super admin to assign category permissions to your role.
        </p>
      )}
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input ref={searchRef} className="input pl-9 w-full" placeholder="Search categories…"
            defaultValue={filters.search} onChange={handleSearch} disabled={!canView} />
        </div>
        <select className="input w-36" value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          disabled={!canView}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {canCreate && (
          <button type="button" className="btn btn-primary btn-sm flex items-center gap-1.5 whitespace-nowrap"
            onClick={() => setModal({ type: 'add', item: null })}>
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      {/* DataTable */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <DataTable
          columns={columns}
          data={categories}
          isLoading={categoriesLoading}
          emptyMessage="No categories found."
          sortBy={filters.sort_by}
          sortDir={filters.sort_dir}
          onSort={handleSort}
        />
      </div>

      {/* Pagination */}
      {categoryMeta && categoryMeta.last_page > 1 && (
        <div className="mt-4">
          <Pagination meta={categoryMeta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </div>
      )}

      <CategoryModal
        isOpen={modal.type === 'add' || modal.type === 'edit'}
        onClose={() => setModal({ type: null, item: null })}
        initial={modal.type === 'edit' ? modal.item : null}
        onSaved={load}
      />
      <ViewModal
        isOpen={modal.type === 'view'}
        onClose={() => setModal({ type: null, item: null })}
        item={modal.item} type="category"
      />
    </div>
  )
}

/* ─── Sub-Categories Tab ──────────────────────────────────────────── */

function SubCategoriesTab() {
  const { canView, canCreate, canEdit, canDelete } = useCategoryPermissions()
  const {
    subCategories, subCategoryMeta, subCategoriesLoading,
    allCategories, fetchAllCategories,
    fetchSubCategories, deleteSubCategory, updateSubCategory,
  } = useCategoryStore()

  const [filters, setFilters]   = useState({ search: '', status: 'all', category_id: '', page: 1, sort_by: 'created_at', sort_dir: 'desc' })
  const [modal, setModal]       = useState({ type: null, item: null })
  const [toggling, setToggling] = useState(null)
  const debounceRef             = useRef(null)

  useEffect(() => { fetchAllCategories() }, [fetchAllCategories])

  const load = useCallback(() => {
    const params = { page: filters.page, per_page: 10, sort_by: filters.sort_by, sort_dir: filters.sort_dir }
    if (filters.search)           params.search      = filters.search
    if (filters.category_id)      params.category_id = filters.category_id
    if (filters.status !== 'all') params.status      = filters.status === 'active' ? 1 : 0
    fetchSubCategories(params)
  }, [filters, fetchSubCategories])

  useEffect(() => {
    if (!canView) return
    load()
  }, [load, canView])

  const handleSearch = (e) => {
    clearTimeout(debounceRef.current)
    const val = e.target.value
    debounceRef.current = setTimeout(() => setFilters((f) => ({ ...f, search: val, page: 1 })), 350)
  }

  const handleSort = (key) => setFilters((f) => ({
    ...f, sort_by: key, page: 1,
    sort_dir: f.sort_by === key && f.sort_dir === 'asc' ? 'desc' : 'asc',
  }))

  const handleToggleStatus = async (item) => {
    setToggling(item.id)
    try {
      await updateSubCategory(item.id, { status: !item.status })
      toast.success(`Sub-category ${!item.status ? 'activated' : 'deactivated'}.`)
      load()
    } catch { toast.error('Failed to update status.') }
    finally { setToggling(null) }
  }

  const handleDelete = async (item) => {
    if (!confirm(`Delete sub-category "${item.name}"?`)) return
    try { await deleteSubCategory(item.id); toast.success('Sub-category deleted.'); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed to delete.') }
  }

  const columns = [
    {
      label: '#', key: '_no', thClass: 'w-10',
      render: (_, idx) => (
        <span className="text-xs text-slate-400">
          {((subCategoryMeta?.current_page ?? 1) - 1) * (subCategoryMeta?.per_page ?? 10) + idx + 1}
        </span>
      ),
    },
    { label: 'Category', key: 'category',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
          {row.category?.name ?? '—'}
        </span>
      ),
    },
    { label: 'Name', key: 'name', sortable: true,
      render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
    { label: 'Slug', key: 'slug', sortable: true,
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.slug}</span> },
    { label: 'Models', key: 'equipment_models_count',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800">
          {row.equipment_models_count ?? 0}
        </span>
      ),
    },
    { label: 'Status', key: 'status', sortable: true,
      render: (row) => (
        canEdit ? (
          <StatusToggle item={row} onToggle={handleToggleStatus} saving={toggling === row.id} />
        ) : (
          <StatusBadge active={row.status} />
        )
      ),
    },
    { label: 'Created', key: 'created_at', sortable: true,
      render: (row) => <span className="text-xs text-slate-400">{new Date(row.created_at).toLocaleDateString()}</span> },
    { label: 'Actions', key: '_actions', thClass: 'text-right',
      render: (row) => (
        <RowActions
          onView={() => setModal({ type: 'view', item: row })}
          onEdit={() => setModal({ type: 'edit', item: row })}
          onDelete={() => handleDelete(row)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ]

  return (
    <div>
      {!canView && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
          You do not have <span className="font-mono text-xs">categories.view</span>. Ask a super admin to assign category permissions to your role.
        </p>
      )}
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9 w-full" placeholder="Search sub-categories…"
            defaultValue={filters.search} onChange={handleSearch} disabled={!canView} />
        </div>
        <select className="input w-44" value={filters.category_id}
          onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value, page: 1 }))}
          disabled={!canView}>
          <option value="">All Categories</option>
          {allCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input w-36" value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          disabled={!canView}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {canCreate && (
          <button type="button" className="btn btn-primary btn-sm flex items-center gap-1.5 whitespace-nowrap"
            onClick={() => setModal({ type: 'add', item: null })}>
            <Plus className="w-4 h-4" /> Add Sub-Category
          </button>
        )}
      </div>

      {/* DataTable */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <DataTable
          columns={columns}
          data={subCategories}
          isLoading={subCategoriesLoading}
          emptyMessage="No sub-categories found."
          sortBy={filters.sort_by}
          sortDir={filters.sort_dir}
          onSort={handleSort}
        />
      </div>

      {/* Pagination */}
      {subCategoryMeta && subCategoryMeta.last_page > 1 && (
        <div className="mt-4">
          <Pagination meta={subCategoryMeta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </div>
      )}

      <SubCategoryModal
        isOpen={modal.type === 'add' || modal.type === 'edit'}
        onClose={() => setModal({ type: null, item: null })}
        initial={modal.type === 'edit' ? modal.item : null}
        onSaved={load}
      />
      <ViewModal
        isOpen={modal.type === 'view'}
        onClose={() => setModal({ type: null, item: null })}
        item={modal.item} type="subcategory"
      />
    </div>
  )
}

/* ─── Equipment Models Tab ────────────────────────────────────────── */

function EquipmentModelsTab() {
  const { canView, canCreate, canEdit, canDelete } = useCategoryPermissions()
  const {
    equipmentModels,
    equipmentModelMeta,
    equipmentModelsLoading,
    fetchEquipmentModels,
    deleteEquipmentModel,
    updateEquipmentModel,
    allCategories,
    fetchAllCategories,
  } = useCategoryStore()

  const [filters, setFilters]   = useState({
    search: '', status: 'all', category_id: '', sub_category_id: '', page: 1, sort_by: 'created_at', sort_dir: 'desc',
  })
  const [modal, setModal]       = useState({ type: null, item: null })
  const [toggling, setToggling] = useState(null)
  const debounceRef             = useRef(null)
  const [subFilterOptions, setSubFilterOptions] = useState([])

  useEffect(() => { fetchAllCategories() }, [fetchAllCategories])

  useEffect(() => {
    if (!canView || !filters.category_id) {
      setSubFilterOptions([])
      return
    }
    api.get('/v1/sub-categories', {
      params: { per_page: 200, category_id: filters.category_id, sort_by: 'name', sort_dir: 'asc' },
    }).then(({ data }) => setSubFilterOptions(data.data ?? [])).catch(() => setSubFilterOptions([]))
  }, [filters.category_id, canView])

  const load = useCallback(() => {
    const params = { page: filters.page, per_page: 10, sort_by: filters.sort_by, sort_dir: filters.sort_dir }
    if (filters.search)           params.search = filters.search
    if (filters.category_id)      params.category_id = filters.category_id
    if (filters.sub_category_id)  params.sub_category_id = filters.sub_category_id
    if (filters.status !== 'all') params.status = filters.status === 'active' ? 1 : 0
    fetchEquipmentModels(params)
  }, [filters, fetchEquipmentModels])

  useEffect(() => {
    if (!canView) return
    load()
  }, [load, canView])

  const handleSearch = (e) => {
    clearTimeout(debounceRef.current)
    const val = e.target.value
    debounceRef.current = setTimeout(() => setFilters((f) => ({ ...f, search: val, page: 1 })), 350)
  }

  const handleSort = (key) => setFilters((f) => ({
    ...f, sort_by: key, page: 1,
    sort_dir: f.sort_by === key && f.sort_dir === 'asc' ? 'desc' : 'asc',
  }))

  const handleToggleStatus = async (item) => {
    setToggling(item.id)
    try {
      await updateEquipmentModel(item.id, { status: !item.status })
      toast.success(`Model ${!item.status ? 'activated' : 'deactivated'}.`)
      load()
    } catch { toast.error('Failed to update status.') }
    finally { setToggling(null) }
  }

  const handleDelete = async (item) => {
    if (!confirm(`Delete model "${item.name}"?`)) return
    try { await deleteEquipmentModel(item.id); toast.success('Equipment model deleted.'); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed to delete.') }
  }

  const columns = [
    {
      label: '#', key: '_no', thClass: 'w-10',
      render: (_, idx) => (
        <span className="text-xs text-slate-400">
          {((equipmentModelMeta?.current_page ?? 1) - 1) * (equipmentModelMeta?.per_page ?? 10) + idx + 1}
        </span>
      ),
    },
    {
      label: 'Category', key: 'category',
      render: (row) => (
        <span className="text-xs font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
          {row.sub_category?.category?.name ?? '—'}
        </span>
      ),
    },
    {
      label: 'Sub-Category', key: 'sub',
      render: (row) => (
        <span className="text-sm text-slate-800">{row.sub_category?.name ?? '—'}</span>
      ),
    },
    { label: 'Model', key: 'name', sortable: true,
      render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
    { label: 'Slug', key: 'slug', sortable: true,
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.slug}</span> },
    { label: 'Status', key: 'status', sortable: true,
      render: (row) => (
        canEdit ? (
          <StatusToggle item={row} onToggle={handleToggleStatus} saving={toggling === row.id} />
        ) : (
          <StatusBadge active={row.status} />
        )
      ),
    },
    { label: 'Created', key: 'created_at', sortable: true,
      render: (row) => <span className="text-xs text-slate-400">{new Date(row.created_at).toLocaleDateString()}</span> },
    { label: 'Actions', key: '_actions', thClass: 'text-right',
      render: (row) => (
        <RowActions
          onView={() => setModal({ type: 'view', item: row })}
          onEdit={() => setModal({ type: 'edit', item: row })}
          onDelete={() => handleDelete(row)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ]

  return (
    <div>
      {!canView && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
          You do not have <span className="font-mono text-xs">categories.view</span>. Ask a super admin to assign category permissions to your role.
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9 w-full" placeholder="Search models…"
            defaultValue={filters.search} onChange={handleSearch} disabled={!canView} />
        </div>
        <select className="input w-44" value={filters.category_id}
          onChange={(e) => setFilters((f) => ({
            ...f, category_id: e.target.value, sub_category_id: '', page: 1,
          }))}
          disabled={!canView}>
          <option value="">All Categories</option>
          {allCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input w-48" value={filters.sub_category_id}
          disabled={!filters.category_id || !canView}
          onChange={(e) => setFilters((f) => ({ ...f, sub_category_id: e.target.value, page: 1 }))}>
          <option value="">All sub-categories</option>
          {subFilterOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input w-36" value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          disabled={!canView}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {canCreate && (
          <button type="button" className="btn btn-primary btn-sm flex items-center gap-1.5 whitespace-nowrap"
            onClick={() => setModal({ type: 'add', item: null })}>
            <Plus className="w-4 h-4" /> Add Model
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <DataTable
          columns={columns}
          data={equipmentModels}
          isLoading={equipmentModelsLoading}
          emptyMessage="No equipment models found."
          sortBy={filters.sort_by}
          sortDir={filters.sort_dir}
          onSort={handleSort}
        />
      </div>

      {equipmentModelMeta && equipmentModelMeta.last_page > 1 && (
        <div className="mt-4">
          <Pagination meta={equipmentModelMeta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </div>
      )}

      <EquipmentModelModal
        isOpen={modal.type === 'add' || modal.type === 'edit'}
        onClose={() => setModal({ type: null, item: null })}
        initial={modal.type === 'edit' ? modal.item : null}
        onSaved={load}
      />
      <ViewModal
        isOpen={modal.type === 'view'}
        onClose={() => setModal({ type: null, item: null })}
        item={modal.item}
        type="equipment-model"
      />
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'categories',       label: 'Categories',       Icon: FolderOpen },
  { id: 'sub-categories',   label: 'Sub-Categories',   Icon: FolderTree  },
  { id: 'equipment-models', label: 'Equipment Models', Icon: Package     },
]

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState('categories')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Categories</h1>
        <p className="text-sm text-slate-500 mt-1">Manage categories, sub-categories (brands), and equipment models.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'categories'       && <CategoriesTab />}
      {activeTab === 'sub-categories'   && <SubCategoriesTab />}
      {activeTab === 'equipment-models' && <EquipmentModelsTab />}
    </div>
  )
}
