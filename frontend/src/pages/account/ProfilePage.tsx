import { useEffect, useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye,
  EyeOff,
  Mail,
  User as UserIcon,
  Phone,
  Pencil,
  X,
  ShoppingBag,
  Calendar,
  Shield,
  LogOut,
  ChevronRight,
  Lock,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'
import { Spinner } from '@/components/ui/spinner'
import { showToast, handleApiError } from '@/utils/toast'
import { cn } from '@/lib/utils'

// ==================== TYPES ====================

interface ProfileData {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: 'CUSTOMER' | 'ADMIN'
  createdAt: string
  _count?: { orders: number }
}

// ==================== SCHEMAS ====================

const buildProfileSchema = (t: (k: string) => string) =>
  z.object({
    firstName: z.string().trim().min(1, t('auth.fieldRequired')).max(100),
    lastName: z.string().trim().min(1, t('auth.fieldRequired')).max(100),
    phone: z
      .string()
      .trim()
      .max(20)
      .optional()
      .or(z.literal('')),
  })

const buildPasswordSchema = (t: (k: string) => string) =>
  z
    .object({
      currentPassword: z.string().min(1, t('auth.fieldRequired')),
      newPassword: z.string().min(6, t('auth.passwordHint')),
      confirmNewPassword: z.string().min(1, t('auth.fieldRequired')),
    })
    .refine((d) => d.newPassword === d.confirmNewPassword, {
      path: ['confirmNewPassword'],
      message: t('auth.confirmPasswordMismatch'),
    })
    .refine((d) => d.currentPassword !== d.newPassword, {
      path: ['newPassword'],
      message: t('account.newPasswordSame'),
    })

type ProfileFormValues = {
  firstName: string
  lastName: string
  phone?: string
}

type PasswordFormValues = {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

// ==================== HELPERS ====================

function formatMemberSince(dateStr: string, lang: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    year: 'numeric',
  })
}

// ==================== STATS CARD ====================

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
}

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  )
}

// ==================== PERSONAL INFO SECTION ====================

interface PersonalInfoSectionProps {
  profile: ProfileData
  onUpdated: (updated: ProfileData) => void
}

function PersonalInfoSection({ profile, onUpdated }: PersonalInfoSectionProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(buildProfileSchema(t)),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone ?? '',
    },
    mode: 'onBlur',
  })

  const handleEdit = () => {
    reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone ?? '',
    })
    setEditing(true)
  }

  const handleCancel = () => {
    reset()
    setEditing(false)
  }

  const onSubmit = async (values: ProfileFormValues) => {
    if (!isDirty) {
      showToast.info(t('account.noChanges'))
      return
    }

    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone?.trim() ? values.phone.trim() : null,
      }
      const response = await api.patch('/auth/profile', payload)
      if (response.data.success) {
        onUpdated(response.data.data)
        showToast.success(t('account.profileUpdated'))
        setEditing(false)
      }
    } catch (err) {
      handleApiError(err, t('account.profileUpdateFailed'))
    }
  }

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full px-4 py-2.5 border focus:outline-none transition-colors text-sm bg-white',
      hasError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-black'
    )

  const readOnlyRow = (
    icon: React.ElementType,
    label: string,
    value: string | null,
    extra?: React.ReactNode
  ) => {
    const Icon = icon
    return (
      <div className="flex items-start gap-3 py-2.5">
        <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
          <p className="text-sm text-gray-900 break-words">{value || '—'}</p>
          {extra}
        </div>
      </div>
    )
  }

  return (
    <section className="bg-white border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {t('account.personalInfo')}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('account.personalInfoDesc')}</p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 hover:border-black transition-colors"
          >
            <Pencil className="w-3 h-3" strokeWidth={1.5} />
            <span>{t('account.edit')}</span>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        {!editing ? (
          // ----- View mode -----
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8">
              {readOnlyRow(UserIcon, t('auth.firstName'), profile.firstName)}
              {readOnlyRow(UserIcon, t('auth.lastName'), profile.lastName)}
            </div>
            {readOnlyRow(
              Mail,
              t('auth.email'),
              profile.email,
              <p className="text-[11px] text-gray-400 mt-1 italic">
                {t('account.emailReadonly')}
              </p>
            )}
            {readOnlyRow(Phone, t('auth.phone'), profile.phone || '—')}
          </div>
        ) : (
          // ----- Edit mode -----
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">
                  {t('auth.firstName')}
                </label>
                <input
                  type="text"
                  autoComplete="given-name"
                  aria-invalid={!!errors.firstName}
                  className={inputClass(!!errors.firstName)}
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">
                  {t('auth.lastName')}
                </label>
                <input
                  type="text"
                  autoComplete="family-name"
                  aria-invalid={!!errors.lastName}
                  className={inputClass(!!errors.lastName)}
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
              />
              <p className="text-[11px] text-gray-400 mt-1 italic">
                {t('account.emailReadonly')}
              </p>
            </div>

            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">
                {t('auth.phoneOptional')}
              </label>
              <input
                type="tel"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                className={inputClass(!!errors.phone)}
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-black text-white text-sm tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && <Spinner size="sm" className="text-white" />}
                <span>{t('account.save')}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {t('account.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

// ==================== CHANGE PASSWORD SECTION ====================

function ChangePasswordSection() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(buildPasswordSchema(t)),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    mode: 'onBlur',
  })

  const handleCancel = () => {
    reset()
    setOpen(false)
  }

  const onSubmit = async (values: PasswordFormValues) => {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      if (response.data.success) {
        showToast.success(t('account.passwordChanged'))
        reset()
        setOpen(false)
      }
    } catch (err: any) {
      const code = err?.response?.status
      // 401 → current password wrong
      if (code === 401) {
        showToast.error(t('account.currentPasswordWrong'))
      } else {
        handleApiError(err, t('account.passwordChangeFailed'))
      }
    }
  }

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full px-4 py-2.5 pr-11 border focus:outline-none transition-colors text-sm bg-white',
      hasError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-black'
    )

  const PasswordField = ({
    name,
    label,
    show,
    setShow,
    autoComplete,
    error,
    hint,
  }: {
    name: keyof PasswordFormValues
    label: string
    show: boolean
    setShow: (v: boolean) => void
    autoComplete: string
    error?: string
    hint?: string
  }) => (
    <div>
      <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className={inputClass(!!error)}
          {...register(name)}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          tabIndex={-1}
          className="absolute right-0 top-0 h-full px-3 flex items-center text-gray-500 hover:text-black transition-colors"
          aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
        >
          {show ? (
            <EyeOff className="w-4 h-4" strokeWidth={1.5} />
          ) : (
            <Eye className="w-4 h-4" strokeWidth={1.5} />
          )}
        </button>
      </div>
      {error ? (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      ) : hint ? (
        <p className="text-gray-400 text-xs mt-1">{hint}</p>
      ) : null}
    </div>
  )

  return (
    <section className="bg-white border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <Lock className="w-4 h-4 text-gray-700 mt-0.5" strokeWidth={1.5} />
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t('account.changePassword')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('account.changePasswordDesc')}
            </p>
          </div>
        </div>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 hover:border-black transition-colors"
          >
            <Pencil className="w-3 h-3" strokeWidth={1.5} />
            <span>{t('account.edit')}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 hover:bg-gray-100 transition-colors"
            aria-label={t('account.cancel')}
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Body */}
      {open && (
        <div className="px-6 py-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <PasswordField
              name="currentPassword"
              label={t('account.currentPassword')}
              show={showCurrent}
              setShow={setShowCurrent}
              autoComplete="current-password"
              error={errors.currentPassword?.message}
            />
            <PasswordField
              name="newPassword"
              label={t('account.newPassword')}
              show={showNew}
              setShow={setShowNew}
              autoComplete="new-password"
              error={errors.newPassword?.message}
              hint={t('auth.passwordHint')}
            />
            <PasswordField
              name="confirmNewPassword"
              label={t('account.confirmNewPassword')}
              show={showConfirm}
              setShow={setShowConfirm}
              autoComplete="new-password"
              error={errors.confirmNewPassword?.message}
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-black text-white text-sm tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && <Spinner size="sm" className="text-white" />}
                <span>{t('account.save')}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {t('account.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

// ==================== QUICK LINKS SECTION ====================

interface QuickLinksProps {
  onLogout: () => void
}

function QuickLinks({ onLogout }: QuickLinksProps) {
  const { t } = useTranslation()

  const links = [
    {
      to: '/account/orders',
      icon: ShoppingBag,
      label: t('account.viewOrders'),
    },
    {
      to: '/account/addresses',
      icon: Mail,
      label: t('account.manageAddresses'),
    },
  ]

  return (
    <section className="bg-white border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">{t('account.profile')}</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
              <span className="text-sm text-gray-900">{label}</span>
            </div>
            <ChevronRight
              className="w-4 h-4 text-gray-300 group-hover:text-gray-700 transition-colors"
              strokeWidth={1.5}
            />
          </Link>
        ))}
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-red-50 transition-colors group text-left"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 text-red-500" strokeWidth={1.5} />
            <span className="text-sm text-red-600">{t('account.logout')}</span>
          </div>
          <ChevronRight
            className="w-4 h-4 text-red-200 group-hover:text-red-500 transition-colors"
            strokeWidth={1.5}
          />
        </button>
      </div>
    </section>
  )
}

// ==================== MAIN PAGE ====================

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, isAuthenticated, updateUser, logout } = useAuthStore()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch fresh profile (with _count.orders)
  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile')
        if (!cancelled && response.data.success) {
          setProfile(response.data.data)
        }
      } catch (err) {
        if (!cancelled) {
          handleApiError(err, t('common.error'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProfile()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, t])

  // Redirect if not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: '/account' }} replace />
  }

  if (loading || !profile) {
    return (
      <div className="container-custom py-16 flex justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const handleProfileUpdated = (updated: ProfileData) => {
    setProfile(updated)
    // Sync auth store so Header/other components see latest name
    updateUser({
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone ?? undefined,
    })
  }

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {})
    } catch {
      // ignore — even if BE call fails, clear client state
    }
    logout()
    showToast.success(t('auth.logoutSuccess'))
    navigate('/', { replace: true })
  }

  const lang = i18n.language?.startsWith('en') ? 'en' : 'vi'
  const fullName = `${profile.firstName} ${profile.lastName}`.trim()
  const totalOrders = profile._count?.orders ?? 0

  return (
    <div className="container-custom py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
            {fullName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <StatCard
            icon={Calendar}
            label={t('account.memberSince')}
            value={formatMemberSince(profile.createdAt, lang)}
          />
          <StatCard
            icon={ShoppingBag}
            label={t('account.totalOrders')}
            value={totalOrders}
          />
          <StatCard
            icon={Shield}
            label={t('account.accountRole')}
            value={profile.role === 'ADMIN' ? 'Admin' : 'Customer'}
          />
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <PersonalInfoSection profile={profile} onUpdated={handleProfileUpdated} />
          <ChangePasswordSection />
          <QuickLinks onLogout={handleLogout} />
        </div>
      </div>
    </div>
  )
}
