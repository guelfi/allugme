import { type FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { login, isLoading, user, isInitializing } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isInitializing && user) {
    return <Navigate to="/painel" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const result = await login(email, password)
    if (!result.success) {
      setError(result.error ?? 'Credenciais inválidas')
    }
  }

  return (
    <div className="login-page">
      <form className="login-card card" onSubmit={(e) => void handleSubmit(e)}>
        <h1>Alugue.me</h1>
        <p className="muted">Acesse o painel</p>
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="muted" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          Novo por aqui? <Link to="/register">Cadastre-se</Link>
          {' · '}
          <Link to="/">Página inicial</Link>
        </p>
      </form>
    </div>
  )
}
