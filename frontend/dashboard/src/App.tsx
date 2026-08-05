import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute, SaasAdminRoute } from './components/auth/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
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

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/allugme'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

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
