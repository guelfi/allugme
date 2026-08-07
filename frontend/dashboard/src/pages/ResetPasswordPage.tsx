import { type FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { PasswordInput } from '../components/PasswordInput'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => params.get('token')?.trim() ?? '', [params])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!token) {
      setError('Link inválido. Solicite uma nova redefinição.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      window.setTimeout(() => navigate('/login', { replace: true }), 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  const bgUrl = `${import.meta.env.BASE_URL}login-buildings.jpg`

  return (
    <div className="login-page" style={{ ['--login-bg-image' as string]: `url(${bgUrl})` }}>
      <form className="login-card card" onSubmit={(e) => void handleSubmit(e)}>
        <div className="login-brand-block">
          <Link to="/login" className="login-back-link">
            ← Voltar ao login
          </Link>
          <span className="login-brand-sep" aria-hidden="true">
            -
          </span>
          <Link to="/" className="login-brand-name">
            Allugme
          </Link>
        </div>
        <h1 className="register-title-line" style={{ fontSize: '1.25rem', margin: 0 }}>
          Nova senha
        </h1>
        {!token && <div className="alert alert-error">Link inválido ou incompleto.</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {done ? (
          <div className="alert alert-success">Senha atualizada. Redirecionando para o login…</div>
        ) : (
          <>
            <label>
              Nova senha
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
              />
            </label>
            <label>
              Confirmar senha
              <PasswordInput
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading || !token}>
              {loading ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
