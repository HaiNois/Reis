import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ShoppingBag } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'
import { showToast, handleApiError } from '@/utils/toast'
import { cn } from '@/lib/utils'

function safeRedirectPath(raw: string | null, fallback: string): string {
  if (!raw) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback
  return raw
}

const buildSchema = (t: (k: string) => string) =>
  z
    .object({
      firstName: z.string().trim().min(1, t('auth.fieldRequired')),
      lastName: z.string().trim().min(1, t('auth.fieldRequired')),
      email: z.string().trim().email(t('auth.emailInvalid')),
      phone: z.string().trim().optional().or(z.literal('')),
      password: z.string().min(6, t('auth.passwordHint')),
      confirmPassword: z.string().min(1, t('auth.fieldRequired')),
      acceptTerms: z.boolean().refine((v) => v === true, {
        message: t('auth.mustAcceptTerms'),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: t('auth.confirmPasswordMismatch'),
    })

type FormValues = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const redirectParam = searchParams.get('redirect')
  const isCheckoutFlow = redirectParam === '/checkout' || redirectParam?.startsWith('/checkout')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(t)),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    mode: 'onBlur',
  })

  const onSubmit = async (values: FormValues) => {
    setServerError('')
    try {
      const response = await api.post('/auth/register', {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      })

      if (response.data.success) {
        const { user, accessToken } = response.data.data
        login(user, accessToken)
        showToast.success(t('auth.registerSuccess'))
        const fallback = user.role === 'ADMIN' ? '/admin' : '/account'
        const target = safeRedirectPath(redirectParam, fallback)
        navigate(target, { replace: true })
      }
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || t('auth.registerFailed')
      setServerError(message)
      handleApiError(err, t('auth.registerFailed'))
    }
  }

  // Reusable input class — match LoginPage editorial style
  const inputBaseClass =
    'w-full px-4 py-3 border focus:outline-none transition-colors text-sm'
  const inputNormalClass = 'border-gray-300 focus:border-black'
  const inputErrorClass = 'border-red-400 focus:border-red-500'

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-white">
      <div className="w-full max-w-md">
        {/* Branding */}
        <Link to="/" className="block">
          <h1 className="text-3xl font-serif font-bold mb-2">Rei.s</h1>
        </Link>
        <p className="text-gray-500 mb-8 text-sm">{t('auth.createAccountTagline')}</p>

        {/* Contextual checkout banner */}
        {isCheckoutFlow && (
          <div className="mb-6 px-4 py-3 bg-gray-50 border border-gray-200 flex items-start gap-3">
            <ShoppingBag
              className="w-4 h-4 text-gray-700 mt-0.5 flex-shrink-0"
              strokeWidth={1.5}
            />
            <p className="text-sm text-gray-700 leading-relaxed">
              {t('auth.loginRequiredCheckout')}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Server error banner */}
          {serverError && (
            <div
              role="alert"
              className="bg-red-50 text-red-600 px-4 py-3 text-sm border border-red-100"
            >
              {serverError}
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                autoComplete="given-name"
                autoFocus
                placeholder={t('auth.firstName')}
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                className={cn(
                  inputBaseClass,
                  errors.firstName ? inputErrorClass : inputNormalClass
                )}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p id="firstName-error" className="text-red-500 text-xs mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <input
                type="text"
                autoComplete="family-name"
                placeholder={t('auth.lastName')}
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                className={cn(
                  inputBaseClass,
                  errors.lastName ? inputErrorClass : inputNormalClass
                )}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p id="lastName-error" className="text-red-500 text-xs mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              autoComplete="email"
              placeholder={t('auth.email')}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={cn(
                inputBaseClass,
                errors.email ? inputErrorClass : inputNormalClass
              )}
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone (optional) */}
          <div>
            <input
              type="tel"
              autoComplete="tel"
              placeholder={t('auth.phoneOptional')}
              className={cn(inputBaseClass, inputNormalClass)}
              {...register('phone')}
            />
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('auth.password')}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                className={cn(
                  inputBaseClass,
                  'pr-11',
                  errors.password ? inputErrorClass : inputNormalClass
                )}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-0 top-0 h-full px-3 flex items-center text-gray-500 hover:text-black transition-colors"
                aria-label={
                  showPassword ? t('auth.hidePassword') : t('auth.showPassword')
                }
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
            {errors.password ? (
              <p id="password-error" className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            ) : (
              <p id="password-hint" className="text-gray-400 text-xs mt-1">
                {t('auth.passwordHint')}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('auth.confirmPassword')}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? 'confirmPassword-error' : undefined
                }
                className={cn(
                  inputBaseClass,
                  'pr-11',
                  errors.confirmPassword ? inputErrorClass : inputNormalClass
                )}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                className="absolute right-0 top-0 h-full px-3 flex items-center text-gray-500 hover:text-black transition-colors"
                aria-label={
                  showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')
                }
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-red-500 text-xs mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Terms checkbox */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer text-sm text-gray-600 select-none">
              <input
                type="checkbox"
                aria-invalid={!!errors.acceptTerms}
                className="mt-0.5 w-4 h-4 border-gray-300 accent-black flex-shrink-0"
                {...register('acceptTerms')}
              />
              <span>
                {t('auth.acceptTerms')}{' '}
                <Link
                  to="/terms"
                  className="text-black underline underline-offset-2 hover:no-underline"
                >
                  {t('auth.termsLink')}
                </Link>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-red-500 text-xs mt-1">{errors.acceptTerms.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-black text-white font-medium tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('auth.registering') : t('auth.createAccount')}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-center mt-8 text-sm text-gray-600">
          {t('auth.hasAccount')}{' '}
          <Link
            to={
              redirectParam
                ? `/login?redirect=${encodeURIComponent(redirectParam)}`
                : '/login'
            }
            className="font-medium text-black hover:underline"
          >
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
