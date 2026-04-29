import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  /** Optional role gate. If provided, user must have one of these roles. */
  allowedRoles?: Array<'CUSTOMER' | 'ADMIN'>
  /** Where to send unauthenticated users. Defaults to /login. */
  redirectTo?: string
}

/**
 * Auth guard for routes that require authentication.
 * Preserves intended path via ?redirect= query param so login/register can return user there.
 */
export default function ProtectedRoute({
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    const intended = `${location.pathname}${location.search}`
    const target = `${redirectTo}?redirect=${encodeURIComponent(intended)}`
    return <Navigate to={target} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
