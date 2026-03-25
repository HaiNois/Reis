import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo register
    login(
      {
        id: '1',
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
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
        <h1 className="text-3xl font-serif font-bold text-center mb-8">{t('auth.register')}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('auth.firstName')}</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('auth.lastName')}</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('auth.phone')}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input"
            />
          </div>
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
            {t('auth.register')}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-primary-600">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-primary-900 underline">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}