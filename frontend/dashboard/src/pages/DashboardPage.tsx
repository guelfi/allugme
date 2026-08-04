import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function DashboardPage() {
  const { user, isSaasAdmin } = useAuth()

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Olá, {user?.name?.split(' ')[0] ?? 'corretor'}</h1>
          <p className="muted">Resumo do painel Allugme</p>
        </div>
      </header>
      <div className="grid-cards">
        <Link to="/properties" className="card stat-card">
          <span className="stat-label">Imóveis</span>
          <strong>Gerenciar vitrine</strong>
          <p className="muted">Cadastro, publicação e mídia</p>
        </Link>
        <Link to="/visits" className="card stat-card">
          <span className="stat-label">Visitas</span>
          <strong>Agenda</strong>
          <p className="muted">Confirmar, recusar ou cancelar</p>
        </Link>
        <Link to="/settings" className="card stat-card">
          <span className="stat-label">Configurações</span>
          <strong>Buffer & WhatsApp</strong>
          <p className="muted">Duração, intervalo e notificações</p>
        </Link>
        <Link to="/theme" className="card stat-card">
          <span className="stat-label">Tema</span>
          <strong>Vitrine pública</strong>
          <p className="muted">Escolha o layout oficial</p>
        </Link>
        {isSaasAdmin && (
          <Link to="/admin/tenants" className="card stat-card">
            <span className="stat-label">Admin</span>
            <strong>Tenants</strong>
            <p className="muted">Imobiliárias da plataforma</p>
          </Link>
        )}
      </div>
    </div>
  )
}
