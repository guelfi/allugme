import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppShell } from './components/layout/AppShell'
import { PublicSiteLayout } from './components/layout/PublicSiteLayout'
import { ClientPortalRoute, ProtectedRoute, SaasAdminRoute } from './components/auth/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { RegisterPage } from './pages/RegisterPage'
import { AcceptInvitePage } from './pages/AcceptInvitePage'
import { PrivacyPage } from './pages/PrivacyPage'
import { ClientRegisterPage } from './pages/ClientRegisterPage'
import { ClientShell } from './pages/ClientShell'
import { PortalHomePage } from './pages/PortalHomePage'
import { PortalFavoritesPage } from './pages/PortalFavoritesPage'
import { PortalVisitsPage } from './pages/PortalVisitsPage'
import { DashboardPage } from './pages/DashboardPage'
import { PropertiesPage } from './pages/PropertiesPage'
import { PropertyFormPage } from './pages/PropertyFormPage'
import { VisitsPage } from './pages/VisitsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TenantsPage } from './pages/TenantsPage'
import { TenantDetailPage } from './pages/TenantDetailPage'
import { ThemePage } from './pages/ThemePage'
import { TeamPage } from './pages/TeamPage'
import { ClientsPage } from './pages/ClientsPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

const routeTitles: Record<string, string> = {
  '/': 'Allugme',
  '/login': 'Allugme — Entrar',
  '/forgot-password': 'Allugme — Recuperar senha',
  '/reset-password': 'Allugme — Redefinir senha',
  '/verify-email': 'Allugme — Confirmar e-mail',
  '/register': 'Allugme — Criar conta',
  '/privacy': 'Allugme — Privacidade',
  '/accept-invite': 'Allugme — Aceitar convite',
  '/portal/register': 'Allugme — Cadastro de cliente',
  '/portal': 'Allugme — Portal do cliente',
  '/portal/favorites': 'Allugme — Favoritos',
  '/portal/visits': 'Allugme — Minhas visitas',
  '/painel': 'Allugme — Painel',
  '/properties': 'Allugme — Imóveis',
  '/properties/new': 'Allugme — Novo imóvel',
  '/visits': 'Allugme — Visitas',
  '/team': 'Allugme — Equipe',
  '/clients': 'Allugme — Clientes',
  '/settings': 'Allugme — Configurações',
  '/theme': 'Allugme — Tema',
  '/admin/tenants': 'Allugme — Tenants',
}

function DocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const title =
      routeTitles[pathname] ??
      (pathname.startsWith('/properties/')
        ? 'Allugme — Editar imóvel'
        : pathname.startsWith('/admin/tenants/')
          ? 'Allugme — Detalhes do tenant'
          : 'Allugme')

    document.title = title
  }, [pathname])

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <DocumentTitle />
        <Routes>
          <Route element={<PublicSiteLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
            <Route path="/portal/register" element={<ClientRegisterPage />} />
          </Route>

          <Route element={<ClientPortalRoute />}>
            <Route path="portal" element={<ClientShell />}>
              <Route index element={<PortalHomePage />} />
              <Route path="favorites" element={<PortalFavoritesPage />} />
              <Route path="visits" element={<PortalVisitsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="painel" element={<DashboardPage />} />
              <Route path="properties" element={<PropertiesPage />} />
              <Route path="properties/new" element={<PropertyFormPage />} />
              <Route path="properties/:id" element={<PropertyFormPage />} />
              <Route path="visits" element={<VisitsPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="theme" element={<ThemePage />} />
              <Route element={<SaasAdminRoute />}>
                <Route path="admin/tenants" element={<TenantsPage />} />
                <Route path="admin/tenants/:id" element={<TenantDetailPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
