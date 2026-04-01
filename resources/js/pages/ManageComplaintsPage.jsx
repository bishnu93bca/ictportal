import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Paperclip } from 'lucide-react'
import { useComplaintStore } from '@/store/complaint'
import { useCategoryStore } from '@/store/category'
import { useAuthStore } from '@/store/auth'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import DataTable from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import {
  COMPLAINT_STATUSES,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_STATUS_COLORS,
} from '@/constants/complaint'

const FINALIZED = ['resolved', 'rejected']

function StatusBadge({ status }) {
  const color = COMPLAINT_STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {COMPLAINT_STATUS_LABELS[status] ?? status}
    </span>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-slate-700 font-medium">{value || '—'}</dd>
    </div>
  )
}

export default function ManageComplaintsPage() {
  const authUser = useAuthStore((s) => s.user)
  const { complaints, meta, isLoading, fetchComplaints, updateStatus } = useComplaintStore()
  const { allCategories, fetchAllCategories } = useCategoryStore()

  const [filters, setFilters]         = useState({ status: '', category_id: '', search: '', page: 1 })

  useEffect(() => { fetchAllCategories() }, [fetchAllCategories])
  const [selected, setSelected]       = useState(null)
  const [statusForm, setStatusForm]   = useState({ status: '', admin_note: '' })
  const [isSaving, setSaving]         = useState(false)
  const [detailModal, setDetailModal] = useState(null)

  useEffect(() => {
    const params = { page: filters.page, per_page: 15 }
    if (filters.status)      params.status      = filters.status
    if (filters.category_id) params.category_id = filters.category_id
    if (filters.search)      params.search      = filters.search
    fetchComplaints(params)
  }, [filters, fetchComplaints])

  const openStatusModal = (complaint) => {
    setSelected(complaint)
    setStatusForm({ status: complaint.status, admin_note: complaint.admin_note ?? '' })
  }

  const handleStatusUpdate = async (e) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      await updateStatus(selected.id, statusForm)
      toast.success('Status updated.')
      setSelected(null)
      fetchComplaints({
        page: filters.page, per_page: 15,
        ...(filters.status      ? { status: filters.status }           : {}),
        ...(filters.category_id ? { category_id: filters.category_id } : {}),
        ...(filters.search      ? { search: filters.search }           : {}),
      })
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update status.')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      label: 'Submitted By',
      key: 'user',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.complainant_name || row.user?.name} src={row.user?.avatar} size="sm" />
          <div>
            <p className="text-sm font-medium text-slate-800">{row.complainant_name || row.user?.name || '—'}</p>
            <p className="text-xs text-slate-400">{row.school_name || row.user?.email || ''}</p>
            {row.udise_code && (
              <p className="text-xs text-slate-300">UDISE: {row.udise_code}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      label: 'Complaint',
      key: 'title',
      render: (row) => (
        <div>
          <p
            className="font-medium text-slate-800 text-sm cursor-pointer hover:text-blue-600"
            onClick={() => setDetailModal(row)}
          >
            {row.title}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {row.category && (
              <span className="text-xs text-slate-400">{row.category.name}</span>
            )}
            {row.sub_category && (
              <span className="text-xs text-slate-300">/ {row.sub_category.name}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      label: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      label: 'Date',
      key: 'created_at',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (row) => {
        const isFinalized = FINALIZED.includes(row.status)
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDetailModal(row)}
              className="btn btn-ghost btn-sm"
            >
              View
            </button>
            <button
              onClick={() => openStatusModal(row)}
              className={`btn btn-sm ${isFinalized ? 'btn-ghost text-slate-300 cursor-not-allowed' : 'btn-ghost text-blue-600'}`}
              disabled={isFinalized}
              title={isFinalized ? 'Complaint is already finalized' : 'Update complaint status'}
            >
              Update Status
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Complaints</h1>
          <p className="page-subtitle">Review and update complaint statuses</p>
        </div>
      </div>

      {authUser?.role === 'admin' && authUser?.district && (
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
          <span className="font-medium">District view:</span>{' '}
          showing complaints filed by teachers in{' '}
          <strong>{authUser.district}</strong>
          {authUser.state ? `, ${authUser.state}` : ''}.
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          placeholder="Search complaints…"
          className="input max-w-xs"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          className="select max-w-[180px]"
        >
          <option value="">All Statuses</option>
          {COMPLAINT_STATUSES.map((s) => (
            <option key={s} value={s}>{COMPLAINT_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filters.category_id}
          onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value, page: 1 }))}
          className="select max-w-[180px]"
        >
          <option value="">All Categories</option>
          {allCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={complaints}
          isLoading={isLoading}
          emptyMessage="No complaints found."
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

      {/* ── Update Status Modal ── */}
      {selected && (
        <Modal
          isOpen
          title="Update Complaint Status"
          onClose={() => setSelected(null)}
        >
          {/* Complainant identity summary */}
          <div className="mb-4 p-3 bg-slate-50 rounded-lg text-sm space-y-1">
            <p className="font-medium text-slate-800">{selected.title}</p>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              {selected.category && <span>{selected.category.name}</span>}
              {selected.sub_category && <span className="text-slate-300">/ {selected.sub_category.name}</span>}
            </div>
            <div className="grid grid-cols-2 gap-x-4 pt-1 text-xs text-slate-500">
              <span>Name: <strong className="text-slate-700">{selected.complainant_name}</strong></span>
              <span>School: <strong className="text-slate-700">{selected.school_name}</strong></span>
              <span className="col-span-2">UDISE: <strong className="text-slate-700">{selected.udise_code}</strong></span>
            </div>
          </div>

          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div>
              <label className="label">New Status</label>
              <select
                value={statusForm.status}
                onChange={(e) => setStatusForm((f) => ({ ...f, status: e.target.value }))}
                className="select"
                required
              >
                {COMPLAINT_STATUSES.map((s) => (
                  <option key={s} value={s}>{COMPLAINT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Remark / Admin Note
                {['resolved', 'rejected'].includes(statusForm.status) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <textarea
                value={statusForm.admin_note}
                onChange={(e) => setStatusForm((f) => ({ ...f, admin_note: e.target.value }))}
                rows={3}
                className="input resize-none"
                placeholder="Add a remark visible to the complainant…"
                required={['resolved', 'rejected'].includes(statusForm.status)}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={isSaving} className="btn-primary">
                {isSaving ? 'Saving…' : 'Update Status'}
              </button>
              <button type="button" onClick={() => setSelected(null)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Detail Modal ── */}
      {detailModal && (
        <Modal
          isOpen
          title="Complaint Detail"
          onClose={() => setDetailModal(null)}
        >
          <div className="space-y-4 text-sm">
            {/* Complainant identity */}
            <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-3">
              <InfoRow label="Complainant Name" value={detailModal.complainant_name} />
              <InfoRow label="School Name"      value={detailModal.school_name} />
              <InfoRow label="UDISE Code"       value={detailModal.udise_code} />
              <InfoRow label="Account"          value={detailModal.user?.email} />
            </div>

            {/* Status & title */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">{detailModal.title}</p>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                  {detailModal.category && <span>{detailModal.category.name}</span>}
                  {detailModal.sub_category && <span className="text-slate-300">/ {detailModal.sub_category.name}</span>}
                </div>
              </div>
              <StatusBadge status={detailModal.status} />
            </div>

            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
              {detailModal.description}
            </p>

            {detailModal.admin_note && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-600 mb-1">Admin Remark</p>
                <p className="text-slate-700">{detailModal.admin_note}</p>
                {detailModal.resolver && (
                  <p className="text-xs text-slate-400 mt-1">
                    by {detailModal.resolver.name}
                  </p>
                )}
              </div>
            )}

            {/* Attachments */}
            {detailModal.attachments?.length > 0 && (
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2 bg-slate-50 border-b border-slate-100">
                  Attachments ({detailModal.attachments.length})
                </p>
                <ul className="divide-y divide-slate-100">
                  {detailModal.attachments.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate flex-1"
                      >
                        {a.file_name}
                      </a>
                      <span className="text-xs text-slate-400 shrink-0">{a.file_size_human}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-slate-400">
              Submitted: {new Date(detailModal.created_at).toLocaleString()}
            </p>

            {!FINALIZED.includes(detailModal.status) && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    setDetailModal(null)
                    openStatusModal(detailModal)
                  }}
                  className="btn-primary btn-sm"
                >
                  Update Status
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
