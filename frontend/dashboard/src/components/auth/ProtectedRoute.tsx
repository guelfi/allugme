import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

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
