import { useEffect, useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const links = (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          onClick={() => setMenuOpen(false)}
        >
          {item.label}
        </NavLink>
      ))}
      {isSaasAdmin && (
        <NavLink
          to="/admin/tenants"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          onClick={() => setMenuOpen(false)}
        >
          Tenants
        </NavLink>
      )}
    </>
  )

  return (
    <div className={`app-shell${menuOpen ? ' menu-open' : ''}`}>
      <header className="app-topbar">
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="menu-toggle-bars" aria-hidden="true" />
          <span className="sr-only">{menuOpen ? 'Fechar menu' : 'Abrir menu'}</span>
        </button>
        <div className="brand brand-compact">
          <span className="brand-mark">A</span>
          <strong>Allugme</strong>
        </div>
        <div className="user-menu">
          <span className="user-name">{user?.name ?? user?.email}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside id="app-sidebar" className="sidebar">
        <div className="brand brand-sidebar">
          <span className="brand-mark">A</span>
          <div>
            <strong>Allugme</strong>
            <small>Painel</small>
          </div>
        </div>
        <nav className="nav">{links}</nav>
      </aside>

      <div className="main-column">
        <main className="content">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'bottom-nav-link active' : 'bottom-nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
