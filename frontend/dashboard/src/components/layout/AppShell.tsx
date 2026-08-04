import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/painel', label: 'Início', end: true },
  { to: '/properties', label: 'Imóveis' },
  { to: '/visits', label: 'Visitas' },
  { to: '/settings', label: 'Configurações' },
  { to: '/theme', label: 'Tema' },
]

export function AppShell() {
  const { user, logout, isSaasAdmin } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <strong>Alugue.me</strong>
            <small>Painel</small>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
          {isSaasAdmin && (
            <NavLink
              to="/admin/tenants"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Tenants
            </NavLink>
          )}
        </nav>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div />
          <div className="user-menu">
            <span>{user?.name ?? user?.email}</span>
            <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
              Sair
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
