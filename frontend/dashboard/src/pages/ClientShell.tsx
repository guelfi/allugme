import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BrandMark } from '../components/BrandMark'

export function ClientShell() {
  const { user, logout } = useAuth()

  return (
    <div className="portal-shell">
      <header className="portal-topbar">
        <div className="brand brand-compact" aria-label="Allugme">
          <BrandMark className="brand-mark" />
          <strong aria-hidden="true">llugme</strong>
        </div>
        <span className="portal-user muted">{user?.name}</span>
      </header>
      <nav className="portal-nav" aria-label="Portal do visitante">
        <NavLink to="/portal" end>
          Início
        </NavLink>
        <NavLink to="/portal/favorites">Favoritos</NavLink>
        <NavLink to="/portal/visits">Minhas visitas</NavLink>
        <button type="button" className="portal-logout" onClick={() => void logout()}>
          Sair
        </button>
      </nav>
      <main className="portal-main">
        <Outlet />
      </main>
    </div>
  )
}
