import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'
import BrandLogo from '@/components/BrandLogo'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()

  const [form, setForm] = useState({ login: '', password: '' })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.login)    errs.login    = 'Email or UDISE Code is required.'
    if (!form.password) errs.password = 'Password is required.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const result = await login(form.login, form.password)

    if (result.success) {
      toast.success('Welcome back!')
      navigate('/dashboard', { replace: true })
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <BrandLogo
            size="lg"
            tagline="Sign in to your account"
            taglineClassName="block text-sm text-slate-500 mt-3 text-center"
          />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email / UDISE Code */}
          <div className="mb-4">
            <label htmlFor="login" className="label">Email / UDISE Code</label>
            <input
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              value={form.login}
              onChange={handleChange}
              className={`input ${errors.login ? 'input-error' : ''}`}
              placeholder="you@example.com or UDISE Code"
            />
            {errors.login && (
              <p className="mt-1 text-xs text-red-500">{errors.login}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="label mb-0">Password</label>
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full justify-center py-2.5"
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Teachers: login with your UDISE Code as both username and password.
        </p>
      </div>
    </div>
  )
}
