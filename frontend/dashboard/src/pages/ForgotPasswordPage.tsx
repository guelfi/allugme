import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { AuthCardHeader } from '../components/AuthCardHeader'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await forgotPassword(email.trim())
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o e-mail.')
    } finally {
      setLoading(false)
    }
  }

  const bgUrl = `${import.meta.env.BASE_URL}login-buildings.jpg`

  return (
    <div className="login-page" style={{ ['--login-bg-image' as string]: `url(${bgUrl})` }}>
      <form className="login-card card" onSubmit={(e) => void handleSubmit(e)}>
        <AuthCardHeader backTo="/login" backLabel="Voltar ao login" />
        <h1 className="register-title-line" style={{ fontSize: '1.25rem', margin: 0 }}>
          Esqueci a senha
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Informe o e-mail da conta. Se estiver cadastrado, enviaremos um link para redefinir a senha.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        {done ? (
          <div className="alert alert-success">
            Se o e-mail estiver cadastrado, você receberá o link em alguns minutos. Confira também a pasta de spam.
          </div>
        ) : (
          <>
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar link'}
            </button>
          </>
        )}
        <p className="muted" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          <Link to="/login">Voltar ao login</Link>
        </p>
      </form>
    </div>
  )
}
