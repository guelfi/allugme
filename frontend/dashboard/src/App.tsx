import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute, SaasAdminRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PropertiesPage } from './pages/PropertiesPage'
import { PropertyFormPage } from './pages/PropertyFormPage'
import { VisitsPage } from './pages/VisitsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TenantsPage } from './pages/TenantsPage'
import { ThemePage } from './pages/ThemePage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/allugme'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="properties" element={<PropertiesPage />} />
              <Route path="properties/new" element={<PropertyFormPage />} />
              <Route path="properties/:id" element={<PropertyFormPage />} />
              <Route path="visits" element={<VisitsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="theme" element={<ThemePage />} />
              <Route element={<SaasAdminRoute />}>
                <Route path="admin/tenants" element={<TenantsPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
