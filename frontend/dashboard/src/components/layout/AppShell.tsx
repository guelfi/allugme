import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  canEditTheme,
  canEditTenantSettings,
  canManageTeam,
  isBroker,
  isSaasReadOnly,
} from '../../permissions'
import { BrandMark } from '../BrandMark'

type NavItem = { to: string; label: string; end?: boolean }

export function AppShell() {
  const { user, logout, isSaasAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const navItems = useMemo(() => {
    const items: NavItem[] = [{ to: '/painel', label: 'Início', end: true }]

    if (isSaasReadOnly(user)) {
      items.push(
        { to: '/admin/tenants', label: 'Tenants' },
        { to: '/properties', label: 'Imóveis' },
        { to: '/visits', label: 'Visitas' },
        { to: '/clients', label: 'Clientes' },
      )
      return items
    }

    if (isBroker(user)) {
      items.push(
        { to: '/properties', label: 'Imóveis' },
        { to: '/visits', label: 'Agenda' },
        { to: '/clients', label: 'Clientes' },
        { to: '/settings', label: 'Configurações' },
      )
      return items
    }

    // Admin imobiliária / corretor independente
    items.push(
      { to: '/properties', label: 'Imóveis' },
      { to: '/visits', label: 'Visitas' },
      { to: '/clients', label: 'Clientes' },
    )
    if (canManageTeam(user)) items.push({ to: '/team', label: 'Equipe' })
    if (canEditTenantSettings(user) || isBroker(user)) {
      items.push({ to: '/settings', label: 'Configurações' })
    }
    if (canEditTheme(user)) items.push({ to: '/theme', label: 'Tema' })
    if (isSaasAdmin) items.push({ to: '/admin/tenants', label: 'Tenants' })
    return items
  }, [user, isSaasAdmin])

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
    </>
  )

  const bottomItems = navItems.slice(0, 4)
  const roleHint = isSaasReadOnly(user)
    ? 'SaaS · somente leitura'
    : isBroker(user)
      ? 'Corretor'
      : user?.tenantType === 'independent'
        ? 'Corretor independente'
        : 'Imobiliária'

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
        <div className="brand brand-compact" aria-label="Allugme">
          <BrandMark className="brand-mark" />
          <strong aria-hidden="true">llugme</strong>
        </div>
        {!isSaasReadOnly(user) && user?.tenantName && (
          <div className="topbar-tenant" title={user.tenantName}>
            {user.tenantName}
          </div>
        )}
        <div className="user-menu">
          <span className="user-name">
            {user?.name ?? user?.email}
            <small className="muted" style={{ display: 'block', fontSize: '0.7rem' }}>
              {roleHint}
            </small>
          </span>
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
        <div className="brand brand-sidebar" aria-label="Allugme">
          <BrandMark className="brand-mark" />
          <strong aria-hidden="true">llugme</strong>
        </div>
        <nav className="nav">{links}</nav>
      </aside>

      <div className="main-column">
        <main className="content">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {bottomItems.map((item) => (
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
