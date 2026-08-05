import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats, type AdminStats } from '../api/admin'
import { useAuth } from '../contexts/AuthContext'
import {
  canEditTheme,
  canEditTenantSettings,
  canManageTeam,
  isBroker,
  isSaasReadOnly,
} from '../permissions'

function formatCount(n: number | undefined): string {
  if (n === undefined) return '—'
  return n.toLocaleString('pt-BR')
}

export function DashboardPage() {
  const { user } = useAuth()
  const saas = isSaasReadOnly(user)
  const broker = isBroker(user)
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    if (!saas) return
    let active = true
    getAdminStats()
      .then((data) => {
        if (active) setStats(data)
      })
      .catch(() => {
        if (active) setStats(null)
      })
    return () => {
      active = false
    }
  }, [saas])

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
      {!saas && !user?.avatarUrl && (
        <div className="alert alert-warning">
          Você ainda não tem uma foto de rosto cadastrada. Ela é exibida ao visitante ao agendar
          uma visita e é obrigatória para publicar imóveis.{' '}
          <Link to="/settings">Enviar foto agora</Link>
        </div>
      )}
      <div className="grid-cards">
        {saas && (
          <>
            <Link to="/admin/tenants" className="card stat-card">
              <span className="stat-label">Imobiliárias</span>
              <strong className="stat-number">{formatCount(stats?.agencies)}</strong>
              <p className="muted">Contas de imobiliária ativas na plataforma</p>
            </Link>
            <Link to="/admin/tenants" className="card stat-card">
              <span className="stat-label">Corretores (independentes)</span>
              <strong className="stat-number">{formatCount(stats?.independentBrokers)}</strong>
              <p className="muted">Contas individuais na plataforma</p>
            </Link>
            <Link to="/properties" className="card stat-card">
              <span className="stat-label">Imóveis</span>
              <strong className="stat-number">{formatCount(stats?.properties)}</strong>
              <p className="muted">Carteira global — somente leitura</p>
            </Link>
            <Link to="/clients" className="card stat-card">
              <span className="stat-label">Clientes</span>
              <strong className="stat-number">{formatCount(stats?.clients)}</strong>
              <p className="muted">Visitantes gerados pelas vitrines</p>
            </Link>
          </>
        )}
        {!saas && (
          <>
            <Link to="/properties" className="card stat-card">
              <span className="stat-label">Imóveis</span>
              <strong>{broker ? 'Meus imóveis' : 'Vitrine'}</strong>
              <p className="muted">Cadastro e publicação</p>
            </Link>
            <Link to="/visits" className="card stat-card">
              <span className="stat-label">Visitas</span>
              <strong>{broker ? 'Minha agenda' : 'Agenda'}</strong>
              <p className="muted">Confirmar e organizar horários</p>
            </Link>
            <Link to="/clients" className="card stat-card">
              <span className="stat-label">Clientes</span>
              <strong>Visitantes</strong>
              <p className="muted">Leads gerados pela vitrine</p>
            </Link>
          </>
        )}
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
