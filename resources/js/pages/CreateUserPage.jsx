import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import { USER_ROLES, USER_STATUSES } from '@/constants/user'

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'student',
  status: 'active',
  phone: '',
  gender: '',
  date_of_birth: '',
  school_name: '',
  udise_code: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postal_code: '',
}

export default function CreateUserPage() {
  const navigate = useNavigate()

  const [form, setForm]       = useState(INITIAL_FORM)
  const [errors, setErrors]   = useState({})
  const [isSaving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      await api.post('/v1/users', form)
      toast.success('User created successfully.')
      navigate('/users')
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
        toast.error('Please fix the validation errors.')
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to create user.')
      }
    } finally {
      setSaving(false)
    }
  }

  const field = (label, name, type = 'text', extra = {}) => (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name] ?? ''}
        onChange={handleChange}
        className={`input ${errors[name] ? 'border-red-400' : ''}`}
        {...extra}
      />
      {errors[name] && (
        <p className="text-xs text-red-500 mt-1">{errors[name][0]}</p>
      )}
    </div>
  )

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <div>
          <button
            onClick={() => navigate('/users')}
            className="text-sm text-blue-600 hover:underline mb-1 block"
          >
            ← Back to Users
          </button>
          <h1 className="page-title">Create User</h1>
          <p className="page-subtitle">Add a new portal account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Account Info */}
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Account Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {field('Full Name', 'name', 'text', { required: true, autoFocus: true })}
          {field('Email Address', 'email', 'email', { required: true })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field('Password', 'password', 'password', { required: true })}
          {field('Confirm Password', 'password_confirmation', 'password', { required: true })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={`select ${errors.role ? 'border-red-400' : ''}`}
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role[0]}</p>}
          </div>

          <div>
            <label className="label">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="select"
            >
              {USER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Profile Info */}
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide pt-2 border-t border-slate-100">
          Profile Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {field('Phone', 'phone')}
          <div>
            <label className="label">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="select"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field('Date of Birth', 'date_of_birth', 'date')}
          {field('School Name', 'school_name')}
        </div>

        {field('UDISE Code', 'udise_code')}
        {field('Address', 'address')}

        <div className="grid grid-cols-3 gap-4">
          {field('City', 'city')}
          {field('State', 'state')}
          {field('Postal Code', 'postal_code')}
        </div>

        {field('Country', 'country')}

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button type="submit" disabled={isSaving} className="btn-primary">
            {isSaving ? 'Creating…' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
