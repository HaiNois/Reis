import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  if (!user) {
    return (
      <div className="container-custom py-16 text-center">
        <p>{t('auth.login')}</p>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-serif font-bold mb-8">{t('account.profile')}</h1>

      <div className="max-w-2xl">
        <div className="bg-primary-50 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-primary-500">{t('auth.firstName')}</p>
              <p className="font-medium">{user.firstName}</p>
            </div>
            <div>
              <p className="text-sm text-primary-500">{t('auth.lastName')}</p>
              <p className="font-medium">{user.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-primary-500">{t('auth.email')}</p>
              <p className="font-medium">{user.email}</p>
            </div>
            {user.phone && (
              <div>
                <p className="text-sm text-primary-500">{t('auth.phone')}</p>
                <p className="font-medium">{user.phone}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <a href="/account/orders" className="btn btn-outline">
            {t('account.orders')}
          </a>
          <a href="/account/addresses" className="btn btn-outline">
            {t('account.addresses')}
          </a>
        </div>
      </div>
    </div>
  )
}