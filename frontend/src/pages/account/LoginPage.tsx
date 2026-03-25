import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo login
    login(
      {
        id: '1',
        email: formData.email,
        firstName: 'Nguyễn',
        lastName: 'Văn A',
        role: 'CUSTOMER',
      },
      'demo-token'
    )
    navigate('/account')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="container-custom py-16">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-serif font-bold text-center mb-8">{t('auth.login')}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t('auth.email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('auth.password')}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            {t('auth.login')}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-primary-600">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-primary-900 underline">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}