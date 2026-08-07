import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function PortalHomePage() {
  const { user } = useAuth()

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title-row">
            <h1>Olá, {user?.name?.split(' ')[0] ?? 'visitante'}</h1>
            <span className="page-title-sep" aria-hidden="true">
              -
            </span>
            <span className="page-title-hint">Seu espaço de favoritos e visitas</span>
          </div>
        </div>
      </header>
      <div className="portal-home-grid">
        <Link to="/portal/favorites" className="card portal-home-card">
          <h2>Favoritos</h2>
          <p className="muted">Imóveis que você salvou para consultar depois.</p>
        </Link>
        <Link to="/portal/visits" className="card portal-home-card">
          <h2>Minhas visitas</h2>
          <p className="muted">Acompanhe pendentes, confirmadas e o histórico.</p>
        </Link>
      </div>
    </div>
  )
}
