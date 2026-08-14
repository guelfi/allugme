import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats, type AdminStats } from '../api/admin'
import type { PixQuote } from '../api/auth'
import { fetchTeam } from '../api/brokers'
import { listClients } from '../api/clients'
import { listProperties } from '../api/properties'
import { getMyPix } from '../api/tenants'
import { listVisits } from '../api/visits'
import { Modal } from '../components/Modal'
import { useAuth } from '../contexts/AuthContext'
import { countActiveBrokersMissingAvatar } from '../utils/team'
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

type TenantCounts = {
  properties: number
  visits: number
  clients: number
  teamUsed?: number
  teamMax?: number
  brokersMissingAvatar: number
}

export function DashboardPage() {
  const { user } = useAuth()
  const saas = isSaasReadOnly(user)
  const broker = isBroker(user)
  const manageTeam = canManageTeam(user)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [counts, setCounts] = useState<TenantCounts | null>(null)
  const [showPixModal, setShowPixModal] = useState(false)
  const [pixQuote, setPixQuote] = useState<PixQuote | null>(null)
  const [pixLoading, setPixLoading] = useState(false)
  const [pixError, setPixError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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

  useEffect(() => {
    if (saas) return
    let active = true
    Promise.all([
      listProperties().catch(() => []),
      listVisits().catch(() => []),
      listClients().catch(() => []),
      manageTeam ? fetchTeam().catch(() => null) : Promise.resolve(null),
    ]).then(([properties, visits, clients, team]) => {
      if (!active) return
      setCounts({
        properties: properties.length,
        visits: visits.length,
        clients: clients.length,
        teamUsed: team?.quota.usedBrokerSlots,
        teamMax: team?.quota.maxBrokerSlots,
        brokersMissingAvatar: team ? countActiveBrokersMissingAvatar(team.members) : 0,
      })
    })
    return () => {
      active = false
    }
  }, [saas, manageTeam])

  const showOwnAvatarWarning = !saas && !manageTeam && !user?.avatarUrl
  const showTeamAvatarWarning = !saas && manageTeam && (counts?.brokersMissingAvatar ?? 0) > 0

  const isTrial = !saas && user?.tenantStatus === 'trial' && Boolean(user?.trialEndsAt)
  const trialDaysLeft = isTrial
    ? Math.max(0, Math.ceil((new Date(user!.trialEndsAt!).getTime() - Date.now()) / 86_400_000))
    : 0

  async function openPixModal() {
    setShowPixModal(true)
    setCopied(false)
    if (pixQuote) return
    setPixLoading(true)
    setPixError(null)
    try {
      setPixQuote(await getMyPix())
    } catch (err) {
      setPixError(err instanceof Error ? err.message : 'Não foi possível carregar o Pix.')
    } finally {
      setPixLoading(false)
    }
  }

  async function handleCopyPix() {
    if (!pixQuote) return
    try {
      await navigator.clipboard.writeText(pixQuote.copyPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard indisponível — usuário pode selecionar e copiar manualmente */
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title-row">
            <h1>Olá, {user?.name?.split(' ')[0] ?? 'usuário'}</h1>
            <span className="page-title-sep" aria-hidden="true">
              -
            </span>
            <span className="page-title-hint">
              {saas
                ? 'Painel SaaS — visualização de toda a plataforma'
                : broker
                  ? 'Painel do corretor — imóveis e agenda'
                  : 'Painel da imobiliária — operação do tenant'}
            </span>
          </div>
        </div>
      </header>
      {isTrial && (
        <div className="alert alert-trial">
          <span>
            Período de teste grátis: restam <strong>{trialDaysLeft}</strong>{' '}
            {trialDaysLeft === 1 ? 'dia' : 'dias'} (expira em{' '}
            <strong>{new Date(user!.trialEndsAt!).toLocaleDateString('pt-BR')}</strong>). Pague via
            Pix para manter o acesso depois desse prazo.
          </span>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => void openPixModal()}>
            Pagar agora via Pix
          </button>
        </div>
      )}
      {showOwnAvatarWarning && (
        <div className="alert alert-warning">
          Você ainda não tem uma foto de rosto cadastrada. Ela é exibida ao visitante ao agendar
          uma visita e é obrigatória para publicar imóveis.{' '}
          <Link to="/settings">Enviar foto agora</Link>
        </div>
      )}
      {showTeamAvatarWarning && (
        <div className="alert alert-warning">
          {counts!.brokersMissingAvatar === 1
            ? '1 corretor afiliado ainda não cadastrou a foto de rosto.'
            : `${counts!.brokersMissingAvatar} corretores afiliados ainda não cadastraram a foto de rosto.`}{' '}
          A foto é obrigatória para que o corretor afiliado possa usar o sistema (agendar visitas e
          ter imóveis publicados).{' '}
          <Link to="/team">Ver equipe</Link>
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
              <strong className="stat-number">{formatCount(counts?.properties)}</strong>
              <p className="muted">
                {broker ? 'Imóveis sob sua responsabilidade' : 'Cadastro e publicação na vitrine'}
              </p>
            </Link>
            <Link to="/visits" className="card stat-card">
              <span className="stat-label">Visitas</span>
              <strong className="stat-number">{formatCount(counts?.visits)}</strong>
              <p className="muted">{broker ? 'Minha agenda' : 'Confirmar e organizar horários'}</p>
            </Link>
            <Link to="/clients" className="card stat-card">
              <span className="stat-label">Clientes</span>
              <strong className="stat-number">{formatCount(counts?.clients)}</strong>
              <p className="muted">Leads gerados pela vitrine</p>
            </Link>
          </>
        )}
        {manageTeam && (
          <Link to="/team" className="card stat-card">
            <span className="stat-label">Equipe</span>
            <strong className="stat-number">
              {counts?.teamUsed !== undefined && counts?.teamMax !== undefined
                ? `${counts.teamUsed}/${counts.teamMax}`
                : '—'}
            </strong>
            <p className="muted">Corretores · limite do plano e cadastros</p>
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

      {showPixModal && (
        <Modal title="Pagamento via Pix" onClose={() => setShowPixModal(false)}>
          {pixLoading && <p className="muted">Calculando Pix…</p>}
          {pixError && <div className="alert alert-error">{pixError}</div>}
          {pixQuote && (
            <div className="register-pix">
              <img
                src={`data:image/png;base64,${pixQuote.qrCodePngBase64}`}
                alt="QR Code Pix para pagamento"
                width={190}
                height={190}
              />
              <p className="register-pix-amount">
                R$&nbsp;{pixQuote.amount.toFixed(2).replace('.', ',')}
              </p>
              <div className="register-pix-copy">
                <input readOnly value={pixQuote.copyPaste} onFocus={(e) => e.target.select()} />
                <button type="button" className="btn btn-ghost" onClick={() => void handleCopyPix()}>
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="muted register-pix-ref">Referência: {pixQuote.txId}</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
