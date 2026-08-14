import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPortalSummary, type PortalSummary } from '../api/portal'
import { useAuth } from '../contexts/AuthContext'
import { resendEmailVerification } from '../api/auth'

export function PortalHomePage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<PortalSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    getPortalSummary().then(setSummary).catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar o resumo.'))
  }, [])

  return <div>
    <header className="page-header"><div className="page-title-row"><h1>Olá, {user?.name?.split(' ')[0] ?? 'visitante'}</h1><span className="page-title-sep">-</span><span className="page-title-hint">Seus imóveis e visitas em um só lugar</span></div></header>
    {error && <div className="alert alert-error">{error}</div>}
    {notice && <div className="alert alert-success">{notice}</div>}
    {user?.isEmailVerified === false && <div className="alert alert-warning">Confirme seu e-mail para vincular visitas anteriores com segurança. <button type="button" className="btn btn-secondary btn-sm" onClick={() => void resendEmailVerification(user.email).then((r) => setNotice(r.message)).catch((err) => setError(err instanceof Error ? err.message : 'Falha ao reenviar'))}>Reenviar link</button></div>}
    <div className="stats-grid portal-stats">
      <Link to="/portal/visits" className="stat-card card"><span className="stat-label">Aguardando confirmação</span><strong>{summary?.pendingVisits ?? '—'}</strong></Link>
      <Link to="/portal/favorites" className="stat-card card"><span className="stat-label">Imóveis favoritos</span><strong>{summary?.favoriteCount ?? '—'}</strong></Link>
      <Link to="/portal/visits" className="stat-card card"><span className="stat-label">Avaliações pendentes</span><strong>{summary?.feedbackPending ?? '—'}</strong></Link>
    </div>
    <section className="card portal-next-visit"><h2>Próxima visita</h2>{summary?.nextVisit ? <div className="portal-next-content">{summary.nextVisit.photoUrl && <img src={summary.nextVisit.photoUrl} alt="" />}<div><h3>{summary.nextVisit.propertyTitle}</h3><p>{new Date(summary.nextVisit.startAt).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p><p className="muted">Corretor: {summary.nextVisit.brokerName}</p></div></div> : <p className="muted">Você não possui visita confirmada futura.</p>}</section>
    <div className="portal-home-grid"><Link to="/portal/favorites" className="card portal-home-card"><h2>Favoritos</h2><p className="muted">Consulte os imóveis que você salvou.</p></Link><Link to="/portal/visits" className="card portal-home-card"><h2>Minhas visitas</h2><p className="muted">Acompanhe solicitações, compromissos e avaliações.</p></Link></div>
  </div>
}
