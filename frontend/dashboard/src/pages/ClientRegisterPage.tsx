import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { registerClient } from '../api/auth'
import { PasswordInput } from '../components/PasswordInput'
import { useAuth } from '../contexts/AuthContext'
import { formatBrPhone, isValidBrPhone, phoneToE164 } from '../utils/phone'

export function ClientRegisterPage() {
  const { applySession, user, isInitializing } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isInitializing && user) {
    const isClient = user.role === 'client' || user.isClient
    return <Navigate to={isClient ? '/portal' : '/painel'} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!acceptPrivacy) {
      setError('Aceite a Política de Privacidade para continuar.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.')
      return
    }
    if (phone && !isValidBrPhone(phone)) {
      setError('Informe um WhatsApp/celular válido, com DDD.')
      return
    }

    setLoading(true)
    try {
      const result = await registerClient({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone ? phoneToE164(phone) : undefined,
        acceptPrivacy: true,
      })
      applySession(result.accessToken, result.user)
      navigate('/portal', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro')
    } finally {
      setLoading(false)
    }
  }

  const bgUrl = `${import.meta.env.BASE_URL}login-buildings.jpg`

  return (
    <div className="login-page" style={{ ['--login-bg-image' as string]: `url(${bgUrl})` }}>
      <form className="login-card card" onSubmit={(e) => void handleSubmit(e)}>
        <div className="login-brand-block">
          <Link to="/" className="login-back-link">
            ← Voltar à página inicial
          </Link>
          <span className="login-brand-sep" aria-hidden="true">
            -
          </span>
          <Link to="/" className="login-brand-name">
            Allugme
          </Link>
        </div>
        <h1 className="register-title-line" style={{ fontSize: '1.25rem', margin: 0 }}>
          Conta de visitante
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Salve favoritos e acompanhe suas visitas em um só lugar.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          Nome
          <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </label>
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          WhatsApp (opcional)
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(formatBrPhone(e.target.value))}
            placeholder="(99) 99999-9999"
          />
        </label>
        <label>
          Senha
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={acceptPrivacy}
            onChange={(e) => setAcceptPrivacy(e.target.checked)}
            required
          />
          <span>
            Li e aceito a{' '}
            <Link to="/privacy" target="_blank" rel="noopener noreferrer">
              Política de Privacidade
            </Link>
          </span>
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading || !acceptPrivacy}>
          {loading ? 'Criando…' : 'Criar conta'}
        </button>
        <div className="client-reg-pro-cta">
          <p className="muted" style={{ margin: 0, textAlign: 'center' }}>
            É imobiliária ou corretor? Cadastre sua conta profissional.
          </p>
          <Link to="/register" className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }}>
            Cadastro de imobiliária / corretor
          </Link>
        </div>
        <p className="muted" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  )
}
