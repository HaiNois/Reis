import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      })

      if (response.data.success) {
        const { user, accessToken } = response.data.data
        login(user, accessToken)

        const from = location.state?.from || (user.role === 'ADMIN' ? '/admin' : '/account')
        navigate(from, { replace: true })
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('auth.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-8 py-12 bg-white">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-serif font-bold mb-2">Rei.s</h1>
        <p className="text-gray-500 mb-8">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}
          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors"
              required
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 border-gray-300" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-gray-600 hover:text-black">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-black text-white font-medium tracking-wide hover:bg-gray-800 transition-colors"
            disabled={loading}
          >
            {loading ? t('common.loading') : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
