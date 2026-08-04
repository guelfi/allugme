import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  canEditTheme,
  canEditTenantSettings,
  canManageTeam,
  isBroker,
  isSaasReadOnly,
} from '../permissions'

export function DashboardPage() {
  const { user } = useAuth()
  const saas = isSaasReadOnly(user)
  const broker = isBroker(user)

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Olá, {user?.name?.split(' ')[0] ?? 'usuário'}</h1>
          <p className="muted">
            {saas
              ? 'Painel SaaS — visualização de toda a plataforma'
              : broker
                ? 'Painel do corretor — imóveis e agenda'
                : 'Painel da imobiliária — operação do tenant'}
          </p>
        </div>
      </header>
      <div className="grid-cards">
        {saas && (
          <Link to="/admin/tenants" className="card stat-card">
            <span className="stat-label">Tenants</span>
            <strong>Imobiliárias</strong>
            <p className="muted">Ativar planos e assentos extras</p>
          </Link>
        )}
        <Link to="/properties" className="card stat-card">
          <span className="stat-label">Imóveis</span>
          <strong>{saas ? 'Carteira global' : broker ? 'Meus imóveis' : 'Vitrine'}</strong>
          <p className="muted">{saas ? 'Somente leitura' : 'Cadastro e publicação'}</p>
        </Link>
        <Link to="/visits" className="card stat-card">
          <span className="stat-label">Visitas</span>
          <strong>{broker ? 'Minha agenda' : 'Agenda'}</strong>
          <p className="muted">{saas ? 'Somente leitura' : 'Confirmar e organizar horários'}</p>
        </Link>
        <Link to="/clients" className="card stat-card">
          <span className="stat-label">Clientes</span>
          <strong>Visitantes</strong>
          <p className="muted">Leads gerados pela vitrine</p>
        </Link>
        {canManageTeam(user) && (
          <Link to="/team" className="card stat-card">
            <span className="stat-label">Equipe</span>
            <strong>Corretores</strong>
            <p className="muted">Limite do plano e cadastros</p>
          </Link>
        )}
        {canEditTenantSettings(user) && (
          <Link to="/settings" className="card stat-card">
            <span className="stat-label">Configurações</span>
            <strong>Buffer & WhatsApp</strong>
            <p className="muted">Agenda da imobiliária</p>
          </Link>
        )}
        {broker && (
          <Link to="/settings" className="card stat-card">
            <span className="stat-label">Configurações</span>
            <strong>Minha agenda</strong>
            <p className="muted">Buffer e WhatsApp do corretor</p>
          </Link>
        )}
        {canEditTheme(user) && (
          <Link to="/theme" className="card stat-card">
            <span className="stat-label">Tema</span>
            <strong>Vitrine pública</strong>
            <p className="muted">Layout oficial do tenant</p>
          </Link>
        )}
      </div>
    </div>
  )
}
