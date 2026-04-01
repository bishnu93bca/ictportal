import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Paperclip, X, Upload, Loader2, AlertTriangle, UserCircle } from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/auth'
import { useComplaintStore } from '@/store/complaint'
import { useCategoryStore } from '@/store/category'
import Avatar from '@/components/ui/Avatar'

const INITIAL_FORM = { title: '', description: '', category_id: '', sub_category_id: '' }

const ALLOWED_MIME_LABELS = 'JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP'
const MAX_FILES    = 5
const MAX_SIZE_MB  = 10

function formatBytes(bytes) {
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + ' MB'
  if (bytes >= 1_024)     return (bytes / 1_024).toFixed(1) + ' KB'
  return bytes + ' B'
}

function AttachmentChip({ name, size, url, onRemove, isUploading }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
      <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <div className="flex-1 min-w-0">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer"
            className="text-blue-600 hover:underline truncate block font-medium">{name}</a>
        ) : (
          <span className="text-slate-700 truncate block font-medium">{name}</span>
        )}
        {size != null && (
          <span className="text-xs text-slate-400">{formatBytes(size)}</span>
        )}
      </div>
      {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" />}
      {onRemove && !isUploading && (
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-red-500 transition shrink-0"
          title="Remove"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export default function ComplaintFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const authUser = useAuthStore((s) => s.user)
  const { createComplaint, updateComplaint, uploadAttachments, deleteAttachment } = useComplaintStore()
  const {
    allCategories,
    allSubCategories,
    fetchAllCategories,
    fetchSubCategoriesAll,
  } = useCategoryStore()

  const fileInputRef = useRef(null)

  const [form, setForm]         = useState(INITIAL_FORM)
  const [errors, setErrors]     = useState({})
  const [isSaving, setSaving]   = useState(false)
  const [isLoading, setLoading] = useState(isEdit)

  const [pendingFiles, setPendingFiles]   = useState([])
  const [savedAttachments, setSaved]      = useState([])
  const [deletingIds, setDeletingIds]     = useState(new Set())

  // Load categories dropdown once on mount
  useEffect(() => { fetchAllCategories() }, [fetchAllCategories])

  // When category changes, reload sub-categories
  useEffect(() => {
    fetchSubCategoriesAll(form.category_id || null)
  }, [form.category_id, fetchSubCategoriesAll])

  // Load existing complaint for edit
  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const { data } = await api.get(`/v1/complaints/${id}`)
        const c = data.complaint
        setForm({
          title:           c.title,
          description:     c.description,
          category_id:     c.category_id     ?? '',
          sub_category_id: c.sub_category_id ?? '',
        })
        setSaved(c.attachments ?? [])
      } catch {
        toast.error('Failed to load complaint.')
        navigate('/complaints')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isEdit, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      // reset sub-category when parent category changes
      ...(name === 'category_id' ? { sub_category_id: '' } : {}),
    }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  // File selection
  const handleFileChange = (e) => {
    const selected  = Array.from(e.target.files ?? [])
    const remaining = MAX_FILES - savedAttachments.length - pendingFiles.length

    if (selected.length > remaining) {
      toast.error(`You can attach at most ${MAX_FILES} files total.`)
    }

    const valid = selected.slice(0, remaining).filter((f) => {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds ${MAX_SIZE_MB} MB and was skipped.`)
        return false
      }
      return true
    })

    setPendingFiles((prev) => [...prev, ...valid])
    e.target.value = ''
  }

  const removePending = (index) =>
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))

  const handleRemoveSaved = async (attachment) => {
    if (!confirm(`Delete "${attachment.file_name}"?`)) return
    setDeletingIds((prev) => new Set(prev).add(attachment.id))
    try {
      await deleteAttachment(id, attachment.id)
      setSaved((prev) => prev.filter((a) => a.id !== attachment.id))
      toast.success('Attachment removed.')
    } catch {
      toast.error('Failed to remove attachment.')
    } finally {
      setDeletingIds((prev) => { const s = new Set(prev); s.delete(attachment.id); return s })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    // Build complainant fields from the logged-in user's account
    const complainantFields = {
      complainant_name: authUser?.name        ?? '',
      school_name:      authUser?.school_name ?? '',
      udise_code:       authUser?.udise_code  ?? '',
    }

    try {
      // Coerce IDs to numbers (select values are strings)
      const formPayload = {
        ...form,
        category_id:     form.category_id     ? Number(form.category_id)     : undefined,
        sub_category_id: form.sub_category_id ? Number(form.sub_category_id) : undefined,
      }

      if (isEdit) {
        await updateComplaint(id, formPayload)
        if (pendingFiles.length > 0) {
          const uploaded = await uploadAttachments(id, pendingFiles)
          setSaved((prev) => [...prev, ...uploaded])
          setPendingFiles([])
        }
        toast.success('Complaint updated.')
      } else {
        await createComplaint({ ...complainantFields, ...formPayload }, pendingFiles)
        toast.success('Complaint submitted.')
      }
      navigate('/complaints')
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
        toast.error('Please fix the validation errors.')
      } else {
        toast.error(err.response?.data?.message ?? 'Something went wrong.')
      }
    } finally {
      setSaving(false)
    }
  }

  const fieldErr = (name) =>
    errors[name] ? <p className="text-xs text-red-500 mt-1">{errors[name][0]}</p> : null

  const totalAttachments = savedAttachments.length + pendingFiles.length
  const canAddMore       = totalAttachments < MAX_FILES

  const missingProfile = authUser && (!authUser.school_name || !authUser.udise_code)

  if (isLoading) {
    return <div className="py-16 text-center text-slate-400">Loading…</div>
  }

  return (
    <div className="max-w-xl">
      <div className="page-header">
        <div>
          <button
            onClick={() => navigate('/complaints')}
            className="text-sm text-blue-600 hover:underline mb-1 block"
          >
            ← Back to Complaints
          </button>
          <h1 className="page-title">{isEdit ? 'Edit Complaint' : 'New Complaint'}</h1>
          <p className="page-subtitle">
            {isEdit
              ? 'Update your complaint (only while pending)'
              : 'Submit a new complaint for review'}
          </p>
        </div>
      </div>

      {/* Missing profile warning */}
      {missingProfile && !isEdit && (
        <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Your profile is missing <strong>School Name</strong> or <strong>UDISE Code</strong>.
            Please{' '}
            <Link to="/profile" className="underline font-semibold">
              update your profile
            </Link>{' '}
            before submitting a complaint.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">

        {/* ── Complainant — read-only from account ── */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <UserCircle className="w-3.5 h-3.5" />
            Filing As
          </h2>

          <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
            <Avatar name={authUser?.name} src={authUser?.avatar} size="sm" />
            <div className="flex-1 min-w-0 space-y-1 text-sm">
              <p className="font-semibold text-slate-800">{authUser?.name}</p>
              <p className="text-slate-500 text-xs">{authUser?.email}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-xs">
                <span className="text-slate-400">
                  School:{' '}
                  <strong className={authUser?.school_name ? 'text-slate-700' : 'text-red-500'}>
                    {authUser?.school_name || 'Not set'}
                  </strong>
                </span>
                <span className="text-slate-400">
                  UDISE:{' '}
                  <strong className={authUser?.udise_code ? 'text-slate-700' : 'text-red-500'}>
                    {authUser?.udise_code || 'Not set'}
                  </strong>
                </span>
              </div>
            </div>
            <Link
              to="/profile"
              className="text-xs text-blue-600 hover:underline shrink-0 mt-0.5"
              title="Edit profile"
            >
              Edit
            </Link>
          </div>
        </section>

        {/* ── Complaint Details ── */}
        <section className="border-t border-slate-100 pt-5">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Complaint Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className={`input ${errors.title ? 'border-red-400' : ''}`}
                placeholder="Brief summary of your complaint"
                required
                autoFocus
              />
              {fieldErr('title')}
            </div>

            <div>
              <label className="label">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className={`select ${errors.category_id ? 'border-red-400' : ''}`}
              >
                <option value="">— Select category —</option>
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {fieldErr('category_id')}
            </div>

            {form.category_id && (
              <div>
                <label className="label">
                  Sub-Category
                  {allSubCategories.length > 0 && <span className="text-slate-400 font-normal ml-1 text-xs">(optional)</span>}
                </label>
                {allSubCategories.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No sub-categories available for this category.</p>
                ) : (
                  <select
                    name="sub_category_id"
                    value={form.sub_category_id}
                    onChange={handleChange}
                    className={`select ${errors.sub_category_id ? 'border-red-400' : ''}`}
                  >
                    <option value="">— Select sub-category —</option>
                    {allSubCategories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
                {fieldErr('sub_category_id')}
              </div>
            )}

            <div>
              <label className="label">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={6}
                className={`input resize-none ${errors.description ? 'border-red-400' : ''}`}
                placeholder="Provide full details of your complaint…"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                {form.description.length} / 5000 characters
              </p>
              {fieldErr('description')}
            </div>
          </div>
        </section>

        {/* ── Attachments ── */}
        <section className="border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Attachments
              <span className="normal-case font-normal ml-1">
                ({totalAttachments}/{MAX_FILES})
              </span>
            </h2>
            {canAddMore && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-ghost btn-sm flex items-center gap-1.5 text-blue-600"
              >
                <Upload className="w-3.5 h-3.5" />
                Add Files
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            onChange={handleFileChange}
            className="hidden"
          />

          {savedAttachments.length > 0 && (
            <div className="space-y-2 mb-2">
              {savedAttachments.map((a) => (
                <AttachmentChip
                  key={a.id}
                  name={a.file_name}
                  size={a.file_size}
                  url={a.url}
                  isUploading={deletingIds.has(a.id)}
                  onRemove={() => handleRemoveSaved(a)}
                />
              ))}
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="space-y-2 mb-2">
              {pendingFiles.map((f, i) => (
                <AttachmentChip
                  key={i}
                  name={f.name}
                  size={f.size}
                  onRemove={() => removePending(i)}
                />
              ))}
            </div>
          )}

          {totalAttachments === 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl py-6 flex flex-col items-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-500 transition"
            >
              <Paperclip className="w-5 h-5" />
              <span className="text-sm">Click to attach files</span>
              <span className="text-xs">{ALLOWED_MIME_LABELS} · max {MAX_SIZE_MB} MB each</span>
            </button>
          )}

          {errors['attachments'] && (
            <p className="text-xs text-red-500 mt-1">{errors['attachments'][0]}</p>
          )}
        </section>

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSaving || (!isEdit && missingProfile)}
            className="btn-primary"
          >
            {isSaving
              ? (isEdit ? 'Saving…' : 'Submitting…')
              : (isEdit ? 'Save Changes' : 'Submit Complaint')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/complaints')}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
