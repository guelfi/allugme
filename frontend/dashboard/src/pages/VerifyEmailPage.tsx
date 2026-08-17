import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../api/auth'
import { AuthCardHeader } from '../components/AuthCardHeader'

type VerificationStatus = 'loading' | 'success' | 'error'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const [message, setMessage] = useState('Confirmando seu e-mail…')
  const [status, setStatus] = useState<VerificationStatus>('loading')

  useEffect(() => {
    const token = params.get('token') ?? ''
    if (!token) {
      setStatus('error')
      setMessage('Este link de confirmação é inválido ou está incompleto.')
      return
    }

    verifyEmail(token)
      .then((result) => {
        setStatus('success')
        setMessage(result.claimed > 0 ? `${result.message} ${result.claimed} visita(s) foram vinculadas.` : result.message)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Não foi possível confirmar o e-mail.')
      })
  }, [params])

  const bgUrl = `${import.meta.env.BASE_URL}login-buildings.jpg`

  return (
    <div className="login-page" style={{ ['--login-bg-image' as string]: `url(${bgUrl})` }}>
      <main className="login-card card verify-email-card">
        <AuthCardHeader backTo="/login" backLabel="Voltar ao login" />
        <div className="verify-email-heading">
          <span className={`verify-email-status-icon verify-email-status-${status}`} aria-hidden="true">
            {status === 'loading' ? '…' : status === 'success' ? '✓' : '!'}
          </span>
          <div>
            <h1>Confirmação de e-mail</h1>
            <p className="muted">
              {status === 'error'
                ? 'Não foi possível validar este endereço.'
                : 'Estamos protegendo o acesso à sua conta Allugme.'}
            </p>
          </div>
        </div>

        <div
          className={`alert ${status === 'error' ? 'alert-error' : status === 'success' ? 'alert-success' : 'alert-info'}`}
          role={status === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {message}
        </div>

        {status === 'error' && (
          <p className="muted verify-email-help">
            Entre na sua conta para solicitar um novo link de confirmação.
          </p>
        )}

        {status !== 'loading' && (
          <Link className="btn btn-primary btn-block" to="/login">
            {status === 'success' ? 'Entrar' : 'Ir para o login'}
          </Link>
        )}
      </main>
    </div>
  )
}
