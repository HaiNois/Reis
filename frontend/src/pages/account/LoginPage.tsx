import { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShoppingBag } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'

/**
 * Whitelist redirect targets — only allow relative paths starting with "/" and
 * not "//" (protocol-relative URL). Prevents open-redirect attacks.
 */
function safeRedirectPath(raw: string | null, fallback: string): string {
  if (!raw) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback
  return raw
}

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const redirectParam = searchParams.get('redirect')
  const isCheckoutFlow = redirectParam === '/checkout' || redirectParam?.startsWith('/checkout')

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

        // Resolve redirect target (priority: query param > location.state > default)
        const fromState = (location.state as { from?: string } | null)?.from
        const fallback = user.role === 'ADMIN' ? '/admin' : '/account'
        const target = safeRedirectPath(redirectParam, safeRedirectPath(fromState ?? null, fallback))

        navigate(target, { replace: true })
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

  // Build register link preserving redirect param
  const registerHref = redirectParam
    ? `/register?redirect=${encodeURIComponent(redirectParam)}`
    : '/register'

  return (
    <div className="min-h-screen flex items-center justify-center px-8 py-12 bg-white">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-serif font-bold mb-2">Rei.s</h1>
        <p className="text-gray-500 mb-8">{t('auth.signInToContinue')}</p>

        {/* Contextual checkout banner */}
        {isCheckoutFlow && (
          <div className="mb-6 px-4 py-3 bg-gray-50 border border-gray-200 flex items-start gap-3">
            <ShoppingBag className="w-4 h-4 text-gray-700 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <p className="text-sm text-gray-700 leading-relaxed">
              {t('auth.loginRequiredCheckout')}
            </p>
          </div>
        )}

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
              placeholder={t('auth.email')}
              className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('auth.password')}
              className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 border-gray-300" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-gray-600 hover:text-black">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-black text-white font-medium tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-60"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-600">
          {t('auth.noAccount')}{' '}
          <Link to={registerHref} className="font-medium hover:underline">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
