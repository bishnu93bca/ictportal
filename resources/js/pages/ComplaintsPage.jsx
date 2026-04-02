import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Paperclip, Eye, Pencil, Trash2, Phone, Copy, Check } from 'lucide-react'
import api from '@/lib/axios'
import { buildComplaintCopyText, coordinatorForComplaint } from '@/lib/complaintCopy'
import { useComplaintStore } from '@/store/complaint'
import { useCategoryStore } from '@/store/category'
import { useAuthStore } from '@/store/auth'
import {
  COMPLAINT_STATUSES,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_STATUS_COLORS,
} from '@/constants/complaint'
import Modal from '@/components/ui/Modal'
import DataTable from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'

function StatusBadge({ status }) {
  const color = COMPLAINT_STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {COMPLAINT_STATUS_LABELS[status] ?? status}
    </span>
  )
}

function InfoRow({ label, value }) {
  const empty = value === undefined || value === null || value === ''
  return (
    <div>
      <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-slate-700 font-medium">{empty ? '—' : value}</dd>
    </div>
  )
}

export default function ComplaintsPage() {
  const navigate = useNavigate()
  const authUser = useAuthStore((s) => s.user)
  const canCopyHelpdesk = ['admin', 'super_admin'].includes(authUser?.role ?? '')
  const { complaints, meta, isLoading, fetchComplaints, deleteComplaint } = useComplaintStore()
  const { allCategories, fetchAllCategories } = useCategoryStore()

  const [filters, setFilters]     = useState({ status: '', category_id: '', page: 1 })
  const [detailModal, setDetail]  = useState(null)
  const [districtCoordinator, setDistrictCoordinator] = useState({ name: '', phone: '' })
  const [copyDone, setCopyDone] = useState(false)

  useEffect(() => {
    api.get('/v1/portal-config')
      .then(({ data }) => setDistrictCoordinator(data.district_coordinator ?? { name: '', phone: '' }))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchAllCategories() }, [fetchAllCategories])

  useEffect(() => {
    const params = { page: filters.page, per_page: 15 }
    if (filters.status)      params.status      = filters.status
    if (filters.category_id) params.category_id = filters.category_id
    fetchComplaints(params)
  }, [filters, fetchComplaints])

  const detailCoord = detailModal
    ? coordinatorForComplaint(detailModal, districtCoordinator)
    : { name: '', phone: '' }

  const copyComplaintDetails = async (c) => {
    const coord = coordinatorForComplaint(c, districtCoordinator)
    const text = buildComplaintCopyText({
      schoolName:        c.school_name,
      udiseCode:         c.udise_code,
      district:          c.user?.district,
      address:           c.user?.address,
      complainantName:   c.complainant_name,
      complainantPhone:  c.user?.phone,
      coordinatorName:   coord.name,
      coordinatorPhone:  coord.phone,
      brandName:         c.sub_category?.name,
      modelNo:           c.equipment_model?.name,
      machineSerialNo:   c.serial_number,
      exactProblem:      c.description,
    })
    try {
      await navigator.clipboard.writeText(text)
      setCopyDone(true)
      toast.success('Copied to clipboard.')
      setTimeout(() => setCopyDone(false), 2000)
    } catch {
      toast.error('Could not copy.')
    }
  }

  const handleDelete = async (row) => {
    if (!confirm(`Delete complaint "${row.title}"?`)) return
    try {
      await deleteComplaint(row.id)
      toast.success('Complaint deleted.')
      // refresh current page
      const params = { page: filters.page, per_page: 15 }
      if (filters.status)      params.status      = filters.status
      if (filters.category_id) params.category_id = filters.category_id
      fetchComplaints(params)
    } catch {
      toast.error('Failed to delete complaint.')
    }
  }

  const columns = [
    {
      label: 'Title',
      key: 'title',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800 text-sm">{row.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {row.category && (
              <span className="text-xs text-slate-400">{row.category.name}</span>
            )}
            {row.sub_category && (
              <span className="text-xs text-slate-300">/ {row.sub_category.name}</span>
            )}
            {row.equipment_model && (
              <span className="text-xs text-slate-300">/ {row.equipment_model.name}</span>
            )}
            {row.attachments?.length > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-slate-400">
                <Paperclip className="w-3 h-3" />
                {row.attachments.length}
              </span>
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
      label: 'Admin Note',
      key: 'admin_note',
      render: (row) => (
        <span className="text-xs text-slate-500 line-clamp-2">
          {row.admin_note || '—'}
        </span>
      ),
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
        const canEdit = row.status === 'pending'
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              title="View"
              onClick={() => setDetail(row)}
              className="btn btn-ghost btn-icon text-slate-400 hover:text-blue-600"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              title={canEdit ? 'Edit' : 'Only pending complaints can be edited'}
              onClick={() => navigate(`/complaints/${row.id}/edit`)}
              disabled={!canEdit}
              className={`btn btn-ghost btn-icon ${canEdit ? 'text-slate-400 hover:text-amber-600' : 'text-slate-400 cursor-not-allowed hover:text-amber-600'}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              title="Delete"
              onClick={() => handleDelete(row)}
              disabled={!canEdit}
              className="btn btn-ghost btn-icon text-slate-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
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
          <h1 className="page-title">My Complaints</h1>
          <p className="page-subtitle">Track and manage your submitted complaints</p>
        </div>
        <button
          onClick={() => navigate('/complaints/create')}
          className="btn-primary"
        >
          + New Complaint
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
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

      {/* Table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={complaints}
          isLoading={isLoading}
          emptyMessage="No complaints yet. Click '+ New Complaint' to submit one."
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

      {/* ── Detail Modal ── */}
      {detailModal && (
        <Modal
          isOpen
          title="Complaint Detail"
          onClose={() => setDetail(null)}
          size="lg"
        >
          <div className="space-y-4 text-sm">
            {/* Complainant identity */}
            <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-3">
              <InfoRow label="Complainant Name" value={detailModal.complainant_name} />
              <InfoRow label="School Name"      value={detailModal.school_name} />
              <InfoRow label="UDISE Code"       value={detailModal.udise_code} />
              <InfoRow label="Submitted"      value={new Date(detailModal.created_at).toLocaleString()} />
              <InfoRow
                label="Mobile"
                value={
                  detailModal.user?.phone ? (
                    <a href={`tel:${detailModal.user.phone}`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {detailModal.user.phone}
                    </a>
                  ) : '—'
                }
              />
              <InfoRow label="District" value={detailModal.user?.district} />
              <div className="col-span-2">
                <InfoRow label="Address" value={detailModal.user?.address} />
              </div>
            </div>

            {/* Title, category, status */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">{detailModal.title}</p>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                  {detailModal.category    && <span>{detailModal.category.name}</span>}
                  {detailModal.sub_category && <span className="text-slate-300">/ {detailModal.sub_category.name}</span>}
                  {detailModal.equipment_model && (
                    <span className="text-slate-300">/ {detailModal.equipment_model.name}</span>
                  )}
                </div>
              </div>
              <StatusBadge status={detailModal.status} />
            </div>

            {(detailModal.serial_number || detailModal.equipment_model) && (
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 rounded-lg p-3 border border-slate-100">
                <InfoRow label="Brand (sub-category)" value={detailModal.sub_category?.name} />
                <InfoRow label="Model" value={detailModal.equipment_model?.name} />
                <div className="col-span-2">
                  <InfoRow label="Machine serial no." value={detailModal.serial_number} />
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-3">
              {detailModal.description}
            </p>

            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 space-y-2">
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">District coordinator (district admin)</p>
              {detailModal.district_admin ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <InfoRow label="Name" value={detailModal.district_admin.name} />
                  <InfoRow
                    label="Phone"
                    value={
                      detailModal.district_admin.phone ? (
                        <a href={`tel:${detailModal.district_admin.phone}`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {detailModal.district_admin.phone}
                        </a>
                      ) : '—'
                    }
                  />
                  <div className="sm:col-span-2">
                    <InfoRow label="Email" value={detailModal.district_admin.email} />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  No district admin account found for this district. Helpdesk copy uses portal coordinator settings when set.
                </p>
              )}
            </div>

            {canCopyHelpdesk && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Copy format (helpdesk)</span>
                  <button
                    type="button"
                    onClick={() => copyComplaintDetails(detailModal)}
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                  >
                    {copyDone ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copyDone ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="text-xs text-slate-700 p-3 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono bg-white">
                  {buildComplaintCopyText({
                    schoolName:        detailModal.school_name,
                    udiseCode:         detailModal.udise_code,
                    district:          detailModal.user?.district,
                    address:           detailModal.user?.address,
                    complainantName:   detailModal.complainant_name,
                    complainantPhone:  detailModal.user?.phone,
                    coordinatorName:   detailCoord.name,
                    coordinatorPhone:  detailCoord.phone,
                    brandName:         detailModal.sub_category?.name,
                    modelNo:           detailModal.equipment_model?.name,
                    machineSerialNo:   detailModal.serial_number,
                    exactProblem:      detailModal.description,
                  })}
                </pre>
              </div>
            )}

            {/* Admin remark */}
            {detailModal.admin_note && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-600 mb-1">Admin Remark</p>
                <p className="text-slate-700">{detailModal.admin_note}</p>
                {detailModal.resolver && (
                  <p className="text-xs text-slate-400 mt-1">by {detailModal.resolver.name}</p>
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

            {/* Footer actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {detailModal.status === 'pending' && (
                <button
                  onClick={() => {
                    setDetail(null)
                    navigate(`/complaints/${detailModal.id}/edit`)
                  }}
                  className="btn btn-ghost btn-sm flex items-center gap-1.5 text-amber-600"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              <button
                onClick={() => setDetail(null)}
                className="btn btn-ghost btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
