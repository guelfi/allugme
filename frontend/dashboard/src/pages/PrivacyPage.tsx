import { Link } from 'react-router-dom'
import { PrivacyPolicyContent } from '../components/PrivacyPolicyContent'

export function PrivacyPage() {
  const bgUrl = `${import.meta.env.BASE_URL}login-buildings.jpg`

  return (
    <div className="login-page" style={{ ['--login-bg-image' as string]: `url(${bgUrl})` }}>
      <div className="login-card card privacy-page-card">
        <div className="login-brand-block">
          <Link to="/" className="login-back-link">
            ← Voltar
          </Link>
          <span className="login-brand-sep" aria-hidden="true">
            -
          </span>
          <Link to="/" className="login-brand-name">
            Allugme
          </Link>
        </div>
        <h1 className="register-title-line privacy-page-title">Política de Privacidade</h1>
        <PrivacyPolicyContent />
        <p className="muted privacy-page-links">
          <Link to="/register">Voltar ao cadastro</Link>
          {' · '}
          <Link to="/portal/register">Cadastro de visitante</Link>
          {' · '}
          <Link to="/">Página inicial</Link>
        </p>
      </div>
    </div>
  )
}
