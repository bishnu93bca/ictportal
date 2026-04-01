import { useState } from 'react'
import toast from 'react-hot-toast'
import { KeyRound, Pencil, X, Check } from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/auth'
import Avatar from '@/components/ui/Avatar'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore()

  const [isEditing, setEditing]     = useState(false)
  const [isSaving, setSaving]       = useState(false)
  const [form, setForm]             = useState({})

  const [showPw, setShowPw]         = useState(false)
  const [pwSaving, setPwSaving]     = useState(false)
  const [pwForm, setPwForm]         = useState({ password: '', password_confirmation: '' })
  const [pwErrors, setPwErrors]     = useState({})

  const startEdit = () => {
    setForm({ ...user })
    setEditing(true)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/v1/profile', form)
      await fetchMe()
      setEditing(false)
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPwErrors({})
    if (pwForm.password !== pwForm.password_confirmation) {
      setPwErrors({ password_confirmation: ['Passwords do not match.'] })
      return
    }
    setPwSaving(true)
    try {
      await api.put('/v1/profile', {
        password: pwForm.password,
        password_confirmation: pwForm.password_confirmation,
      })
      toast.success('Password changed successfully.')
      setPwForm({ password: '', password_confirmation: '' })
      setShowPw(false)
    } catch (err) {
      if (err.response?.status === 422) {
        setPwErrors(err.response.data.errors ?? {})
        toast.error('Please fix the validation errors.')
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to change password.')
      }
    } finally {
      setPwSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information</p>
        </div>
        {!isEditing && (
          <button onClick={startEdit} className="btn-primary flex items-center gap-1.5">
            <Pencil className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* ── Profile Card ── */}
      <div className="card p-6">
        {/* Avatar + name header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <Avatar name={user.name} src={isEditing ? form.avatar : user.avatar} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-800 truncate">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
            </div>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-5">

            {/* ── Personal Info ── */}
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Personal Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name <span className="text-red-500">*</span></label>
                    <input
                      name="name"
                      value={form.name ?? ''}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      name="phone"
                      value={form.phone ?? ''}
                      onChange={handleChange}
                      className="input"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>

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
                    <input
                      type="date"
                      name="date_of_birth"
                      value={form.date_of_birth ?? ''}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Avatar URL</label>
                  <input
                    name="avatar"
                    value={form.avatar ?? ''}
                    onChange={handleChange}
                    className="input"
                    placeholder="https://…"
                    type="url"
                  />
                </div>
              </div>
            </section>

            {/* ── School / Institution ── */}
            <section className="border-t border-slate-100 pt-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                School / Institution
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">School Name</label>
                  <input
                    name="school_name"
                    value={form.school_name ?? ''}
                    onChange={handleChange}
                    className="input"
                    placeholder="Name of your school"
                  />
                </div>
                <div>
                  <label className="label">UDISE Code</label>
                  <input
                    name="udise_code"
                    value={form.udise_code ?? ''}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g. 09120101601"
                  />
                </div>
              </div>
            </section>

            {/* ── Address ── */}
            <section className="border-t border-slate-100 pt-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Street Address</label>
                  <input
                    name="address"
                    value={form.address ?? ''}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">City</label>
                    <input name="city" value={form.city ?? ''} onChange={handleChange} className="input" />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input name="state" value={form.state ?? ''} onChange={handleChange} className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Country</label>
                    <input name="country" value={form.country ?? ''} onChange={handleChange} className="input" />
                  </div>
                  <div>
                    <label className="label">Postal Code</label>
                    <input name="postal_code" value={form.postal_code ?? ''} onChange={handleChange} className="input" />
                  </div>
                </div>
              </div>
            </section>

            {/* ── Notifications ── */}
            <section className="border-t border-slate-100 pt-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Notification Preferences
              </h3>
              <div className="space-y-2">
                {[
                  ['email_notifications', 'Email Notifications'],
                  ['sms_notifications',   'SMS Notifications'],
                  ['push_notifications',  'Push Notifications'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name={key}
                      checked={form[key] ?? false}
                      onChange={handleChange}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </section>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn btn-ghost flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* ── Read view ── */
          <div className="space-y-5">
            <Section title="Personal Information">
              <Row label="Phone"         value={user.phone} />
              <Row label="Gender"        value={user.gender} />
              <Row label="Date of Birth" value={user.date_of_birth} />
            </Section>

            <Section title="School / Institution">
              <Row label="School Name" value={user.school_name} />
              <Row label="UDISE Code"  value={user.udise_code} />
            </Section>

            <Section title="Address">
              <Row label="Street"      value={user.address} />
              <Row label="City"        value={user.city} />
              <Row label="State"       value={user.state} />
              <Row label="Country"     value={user.country} />
              <Row label="Postal Code" value={user.postal_code} />
            </Section>

            <Section title="Notification Preferences">
              <Row label="Email"  value={user.email_notifications ? 'Enabled' : 'Disabled'} />
              <Row label="SMS"    value={user.sms_notifications   ? 'Enabled' : 'Disabled'} />
              <Row label="Push"   value={user.push_notifications  ? 'Enabled' : 'Disabled'} />
            </Section>
          </div>
        )}
      </div>

      {/* ── Change Password ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-slate-700">Change Password</p>
              <p className="text-xs text-slate-400">Update your login password</p>
            </div>
          </div>
          <button
            onClick={() => { setShowPw((v) => !v); setPwErrors({}) }}
            className="btn btn-ghost btn-sm"
          >
            {showPw ? 'Cancel' : 'Change'}
          </button>
        </div>

        {showPw && (
          <form onSubmit={handlePasswordSave} className="mt-4 space-y-3">
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

      {/* ── Security Info ── */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Security</h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Last Login</dt>
            <dd className="text-slate-700">{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Last Login IP</dt>
            <dd className="text-slate-700">{user.last_login_ip || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Member Since</dt>
            <dd className="text-slate-700">{new Date(user.created_at).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Email Verified</dt>
            <dd className="text-slate-700">{user.email_verified_at ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

/* ── Small helpers ── */
function Section({ title, children }) {
  return (
    <div className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{title}</p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</dl>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-slate-700 font-medium text-sm">{value || '—'}</dd>
    </div>
  )
}
