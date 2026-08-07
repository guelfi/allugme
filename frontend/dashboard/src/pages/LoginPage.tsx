import { type FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PasswordInput } from '../components/PasswordInput'
import { useAuth } from '../contexts/AuthContext'

type LoginAudience = 'visitor' | 'allugme'

export function LoginPage() {
  const { login, isLoading, user, isInitializing } = useAuth()
  const [audience, setAudience] = useState<LoginAudience>('visitor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isInitializing && user) {
    const isClient = user.role === 'client' || user.isClient
    return <Navigate to={isClient ? '/portal' : '/painel'} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const result = await login(email, password)
    if (!result.success) {
      setError(result.error ?? 'Credenciais inválidas')
    }
  }

  const bgUrl = `${import.meta.env.BASE_URL}login-buildings.jpg`
  const isVisitor = audience === 'visitor'

  return (
    <div
      className="login-page"
      style={{ ['--login-bg-image' as string]: `url(${bgUrl})` }}
    >
      <form className="login-card card" onSubmit={(e) => void handleSubmit(e)}>
        <div className="login-brand-block">
          <Link to="/" className="login-back-link">
            ← Voltar à página inicial
          </Link>
        </div>

        <div className="register-context" role="group" aria-label="Tipo de acesso">
          <button
            type="button"
            className={`register-context-option${isVisitor ? ' is-active' : ''}`}
            aria-pressed={isVisitor}
            onClick={() => setAudience('visitor')}
          >
            Visitante
          </button>
          <button
            type="button"
            className={`register-context-option${!isVisitor ? ' is-active' : ''}`}
            aria-pressed={!isVisitor}
            onClick={() => setAudience('allugme')}
          >
            Allugme
          </button>
        </div>

        <h1 className="register-title-line" style={{ fontSize: '1.25rem', margin: '0.35rem 0 0' }}>
          Entrar
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          {isVisitor
            ? 'Acompanhe visitas e favoritos'
            : 'Acesse o painel — admins, imobiliárias e corretores'}
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Senha
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <p className="muted" style={{ margin: '-0.35rem 0 0', textAlign: 'right', fontSize: '0.88rem' }}>
          <Link to="/forgot-password">Esqueci a senha</Link>
        </p>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="muted" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          Novo por aqui? <Link to="/portal/register">Cadastre-se</Link>
        </p>
      </form>
    </div>
  )
}
