import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function isClientUser(user: { role: string; isClient?: boolean } | null): boolean {
  return Boolean(user && (user.role === 'client' || user.isClient))
}

export function ProtectedRoute() {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <div className="splash">
        <p>Carregando…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isClientUser(user)) {
    return <Navigate to="/portal" replace />
  }

  return <Outlet />
}

export function ClientPortalRoute() {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <div className="splash">
        <p>Carregando…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isClientUser(user)) {
    return <Navigate to="/painel" replace />
  }

  return <Outlet />
}

export function SaasAdminRoute() {
  const { isSaasAdmin, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <div className="splash">
        <p>Carregando…</p>
      </div>
    )
  }

  if (!isSaasAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
