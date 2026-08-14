import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../api/auth'
import { AuthCardHeader } from '../components/AuthCardHeader'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const [message, setMessage] = useState('Confirmando seu e-mail…')
  const [error, setError] = useState(false)

  useEffect(() => {
    const token = params.get('token') ?? ''
    verifyEmail(token)
      .then((result) => setMessage(result.claimed > 0 ? `${result.message} ${result.claimed} visita(s) foram vinculadas.` : result.message))
      .catch((err) => { setError(true); setMessage(err instanceof Error ? err.message : 'Não foi possível confirmar o e-mail.') })
  }, [params])

  return <main className="auth-card auth-card-compact">
    <AuthCardHeader backTo="/login" backLabel="Voltar ao login" />
    <h1>Confirmação de e-mail</h1>
    <div className={`alert ${error ? 'alert-error' : 'alert-success'}`}>{message}</div>
    <Link className="btn btn-primary btn-block" to="/login">Entrar</Link>
  </main>
}
