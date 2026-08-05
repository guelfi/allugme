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
import { Icon, type IconName } from '../Icon'

type NavItem = { to: string; label: string; icon: IconName; end?: boolean }

const SIDEBAR_PIN_KEY = 'allugme:sidebarPinned'

export function AppShell() {
  const { user, logout, isSaasAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState<boolean>(() => {
    const stored = localStorage.getItem(SIDEBAR_PIN_KEY)
    return stored === null ? true : stored === 'true'
  })
  const [sidebarHover, setSidebarHover] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_PIN_KEY, String(sidebarPinned))
  }, [sidebarPinned])

  const navItems = useMemo(() => {
    const items: NavItem[] = [{ to: '/painel', label: 'Início', icon: 'dashboard', end: true }]

    if (isSaasReadOnly(user)) {
      items.push(
        { to: '/admin/tenants', label: 'Tenants', icon: 'building' },
        { to: '/properties', label: 'Imóveis', icon: 'home' },
        { to: '/visits', label: 'Visitas', icon: 'calendar' },
        { to: '/clients', label: 'Clientes', icon: 'users' },
      )
      return items
    }

    if (isBroker(user)) {
      items.push(
        { to: '/properties', label: 'Imóveis', icon: 'home' },
        { to: '/visits', label: 'Agenda', icon: 'calendar' },
        { to: '/clients', label: 'Clientes', icon: 'users' },
        { to: '/settings', label: 'Configurações', icon: 'settings' },
      )
      return items
    }

    // Admin imobiliária / corretor independente
    items.push(
      { to: '/properties', label: 'Imóveis', icon: 'home' },
      { to: '/visits', label: 'Visitas', icon: 'calendar' },
      { to: '/clients', label: 'Clientes', icon: 'users' },
    )
    if (canManageTeam(user)) items.push({ to: '/team', label: 'Equipe', icon: 'team' })
    if (canEditTenantSettings(user) || isBroker(user)) {
      items.push({ to: '/settings', label: 'Configurações', icon: 'settings' })
    }
    if (canEditTheme(user)) items.push({ to: '/theme', label: 'Tema', icon: 'palette' })
    if (isSaasAdmin) items.push({ to: '/admin/tenants', label: 'Tenants', icon: 'building' })
    return items
  }, [user, isSaasAdmin])

  const links = (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          title={item.label}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          onClick={() => setMenuOpen(false)}
        >
          <Icon name={item.icon} />
          <span className="nav-label">{item.label}</span>
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

  const sidebarClassName = [
    'sidebar',
    !sidebarPinned && 'sidebar-rail',
    !sidebarPinned && sidebarHover && 'sidebar-hover',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={`app-shell${menuOpen ? ' menu-open' : ''}${!sidebarPinned ? ' sidebar-rail-mode' : ''}`}
    >
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

      <aside
        id="app-sidebar"
        className={sidebarClassName}
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
      >
        <div className="brand brand-sidebar" aria-label="Allugme">
          <BrandMark className="brand-mark" />
          <strong aria-hidden="true" className="nav-label">
            llugme
          </strong>
        </div>
        <nav className="nav">{links}</nav>
        <label className="sidebar-pin-toggle">
          <input
            type="checkbox"
            checked={sidebarPinned}
            onChange={(e) => setSidebarPinned(e.target.checked)}
          />
          <span className="nav-label">Manter sidebar fixo</span>
        </label>
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
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
