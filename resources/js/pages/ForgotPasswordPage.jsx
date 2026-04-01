import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import BrandLogo from '@/components/BrandLogo'

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [isLoading, setLoading] = useState(false)
  const [sent, setSent]         = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      await api.post('/v1/auth/forgot-password', { email })
      setSent(true)
      toast.success('Reset link sent! Check your inbox.')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <BrandLogo
            size="lg"
            tagline="Reset your password"
            taglineClassName="block text-sm text-slate-500 mt-3 text-center"
          />
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-4">
              A password reset link has been sent to <strong>{email}</strong>.
              Please check your inbox.
            </p>
            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="btn-primary w-full justify-center py-2.5 mb-3"
            >
              {isLoading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <p className="text-center text-sm text-slate-500">
              Remembered?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
