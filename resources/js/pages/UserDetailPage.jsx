import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShieldCheck, CheckSquare, Square } from 'lucide-react'
import api from '@/lib/axios'
import Avatar from '@/components/ui/Avatar'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/auth'
import { useRbacStore } from '@/store/rbac'
import { USER_ROLES, USER_STATUSES } from '@/constants/user'

export default function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const authUser = useAuthStore((s) => s.user)

  const { fetchUserRoles, syncUserRoles } = useRbacStore()

  const [user, setUser]             = useState(null)
  const [isLoading, setLoading]     = useState(true)
  const [isEditing, setEditing]     = useState(false)
  const [isSaving, setSaving]       = useState(false)
  const [form, setForm]             = useState({})
  const [pwForm, setPwForm]         = useState({ password: '', password_confirmation: '' })
  const [pwSaving, setPwSaving]     = useState(false)
  const [pwErrors, setPwErrors]     = useState({})
  const [showPwSection, setShowPw]  = useState(false)

  // RBAC role assignment
  const [userRoles, setUserRoles]   = useState([])
  const [rolesSaving, setRolesSaving] = useState(false)
  const [showRoles, setShowRoles]   = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/v1/users/${id}`)
        setUser(data.user)
        setForm(data.user)
      } catch {
        toast.error('Failed to load user.')
        navigate('/users')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put(`/v1/users/${id}`, form)
      setUser(data.user)
      setEditing(false)
      toast.success('User updated successfully.')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwErrors({})
    if (pwForm.password !== pwForm.password_confirmation) {
      setPwErrors({ password_confirmation: ['Passwords do not match.'] })
      return
    }
    setPwSaving(true)
    try {
      await api.put(`/v1/users/${id}`, { password: pwForm.password })
      toast.success('Password changed successfully.')
      setPwForm({ password: '', password_confirmation: '' })
      setShowPw(false)
    } catch (err) {
      if (err.response?.status === 422) {
        setPwErrors(err.response.data.errors ?? {})
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to change password.')
      }
    } finally {
      setPwSaving(false)
    }
  }

  if (isLoading) {
    return <div className="py-16 text-center text-slate-400">Loading…</div>
  }

  if (!user) return null

  const isAdmin      = authUser && ['admin', 'super_admin'].includes(authUser.role)
  const isSuperAdmin = authUser?.role === 'super_admin'

  // Super admin account password: only the account owner may change it here (not another admin).
  const canSetPasswordForThisUser =
    isAdmin &&
    (user.role !== 'super_admin' || String(user.id) === String(authUser?.id))

  const loadUserRoles = async () => {
    try {
      const roles = await fetchUserRoles(id)
      setUserRoles(roles)
    } catch { /* silently ignore */ }
  }

  const handleToggleRole = (roleId) => {
    setUserRoles((prev) =>
      prev.map((r) => r.id === roleId ? { ...r, assigned: !r.assigned } : r)
    )
  }

  const handleSaveRoles = async () => {
    setRolesSaving(true)
    try {
      const selected = userRoles.filter((r) => r.assigned).map((r) => r.id)
      await syncUserRoles(id, selected)
      toast.success('Roles updated.')
      setShowRoles(false)
    } catch { toast.error('Failed to update roles.') }
    finally { setRolesSaving(false) }
  }
  const isOwnProfile = authUser?.id === user.id
  const canEdit      = isAdmin || isOwnProfile

  return (
    <div className="max-w-2xl space-y-4">
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/users')} className="text-sm text-blue-600 hover:underline mb-1 block">
            ← Back to Users
          </button>
          <h1 className="page-title">User Details</h1>
        </div>
        {canEdit && !isEditing && (
          <button onClick={() => setEditing(true)} className="btn-primary">
            Edit
          </button>
        )}
      </div>

      {/* ── Profile Card ── */}
      <div className="card p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <Avatar name={user.name} src={user.avatar} size="lg" />
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex gap-2 mt-2">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
            </div>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input name="name" value={form.name ?? ''} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input name="phone" value={form.phone ?? ''} onChange={handleChange} className="input" />
              </div>
            </div>

            {/* Role / Status — admin only */}
            {isAdmin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Role</label>
                  <select name="role" value={form.role ?? ''} onChange={handleChange} className="select"
                    disabled={!isSuperAdmin && user.role === 'super_admin'}
                  >
                    {USER_ROLES.map((r) => (
                      <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select name="status" value={form.status ?? ''} onChange={handleChange} className="select">
                    {USER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Profile fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Gender</label>
                <select name="gender" value={form.gender ?? ''} onChange={handleChange} className="select">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input type="date" name="date_of_birth" value={form.date_of_birth ?? ''} onChange={handleChange} className="input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">School Name</label>
                <input name="school_name" value={form.school_name ?? ''} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">UDISE Code</label>
                <input name="udise_code" value={form.udise_code ?? ''} onChange={handleChange} className="input" />
              </div>
            </div>

            <div>
              <label className="label">Address</label>
              <input name="address" value={form.address ?? ''} onChange={handleChange} className="input" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">City</label>
                <input name="city" value={form.city ?? ''} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">State</label>
                <input name="state" value={form.state ?? ''} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">Postal Code</label>
                <input name="postal_code" value={form.postal_code ?? ''} onChange={handleChange} className="input" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSaving} className="btn-primary">
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {[
              ['Phone',         user.phone],
              ['Gender',        user.gender],
              ['Date of Birth', user.date_of_birth],
              ['School',        user.school_name],
              ['UDISE Code',    user.udise_code],
              ['Address',       user.address],
              ['City',          user.city],
              ['State',         user.state],
              ['Country',       user.country],
              ['Postal Code',   user.postal_code],
              ['Last Login',    user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '—'],
              ['Member Since',  new Date(user.created_at).toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">{label}</dt>
                <dd className="text-slate-700 font-medium">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* ── Change Password — admin/super_admin; not for another super_admin account ── */}
      {canSetPasswordForThisUser && (
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Change Password</h3>
              <p className="text-xs text-slate-400 mt-0.5">Set a new password for this account</p>
            </div>
            <button
              onClick={() => setShowPw((v) => !v)}
              className="btn btn-ghost btn-sm"
            >
              {showPwSection ? 'Cancel' : 'Change'}
            </button>
          </div>

          {showPwSection && (
            <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  value={pwForm.password}
                  onChange={(e) => setPwForm((f) => ({ ...f, password: e.target.value }))}
                  className={`input ${pwErrors.password ? 'border-red-400' : ''}`}
                  placeholder="Minimum 8 characters"
                  required
                  autoComplete="new-password"
                />
                {pwErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{pwErrors.password[0]}</p>
                )}
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  value={pwForm.password_confirmation}
                  onChange={(e) => setPwForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                  className={`input ${pwErrors.password_confirmation ? 'border-red-400' : ''}`}
                  placeholder="Repeat the new password"
                  required
                  autoComplete="new-password"
                />
                {pwErrors.password_confirmation && (
                  <p className="text-xs text-red-500 mt-1">{pwErrors.password_confirmation[0]}</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={pwSaving} className="btn-primary">
                  {pwSaving ? 'Saving…' : 'Set Password'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPw(false); setPwForm({ password: '', password_confirmation: '' }); setPwErrors({}) }}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── RBAC Role Assignment (super_admin only) ── */}
      {isSuperAdmin && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-semibold text-slate-700">Assigned Roles</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!showRoles) loadUserRoles()
                setShowRoles((v) => !v)
              }}
              className="btn btn-ghost btn-sm"
            >
              {showRoles ? 'Cancel' : 'Manage'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-3">RBAC roles determine which permissions this user inherits.</p>

          {showRoles && (
            <div className="space-y-2 mt-3">
              {userRoles.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Loading roles…</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {userRoles.map((role) => (
                      <label
                        key={role.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          role.assigned
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="accent-blue-500"
                          checked={role.assigned}
                          onChange={() => handleToggleRole(role.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{role.name}</p>
                          <p className="text-xs font-mono text-slate-400">{role.slug}</p>
                        </div>
                        {role.is_system && (
                          <span className="text-xs text-amber-500 shrink-0">system</span>
                        )}
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRoles(false)}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRoles}
                      disabled={rolesSaving}
                      className="btn btn-primary btn-sm"
                    >
                      {rolesSaving ? 'Saving…' : 'Save Roles'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
