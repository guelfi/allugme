import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { registerClient } from '../api/auth'
import { AuthCardHeader } from '../components/AuthCardHeader'
import { Modal } from '../components/Modal'
import { PasswordInput } from '../components/PasswordInput'
import { PrivacyPolicyContent } from '../components/PrivacyPolicyContent'
import { useAuth } from '../contexts/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatBrPhone, isValidBrPhone, phoneToE164 } from '../utils/phone'

type Step = 'dados' | 'acesso'

export function ClientRegisterPage() {
  const { applySession, user, isInitializing } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [step, setStep] = useState<Step>('dados')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isInitializing && user) {
    const isClient = user.role === 'client' || user.isClient
    return <Navigate to={isClient ? '/portal' : '/painel'} replace />
  }

  function validateDados(): string | null {
    if (!name.trim()) return 'Informe seu nome completo.'
    if (!email.trim()) return 'Informe seu e-mail.'
    if (!isValidBrPhone(phone)) return 'Informe um WhatsApp/celular válido, com DDD.'
    return null
  }

  function goToAcesso() {
    setError(null)
    const err = validateDados()
    if (err) {
      setError(err)
      return
    }
    setStep('acesso')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (isMobile && step === 'dados') {
      goToAcesso()
      return
    }

    const dadosErr = validateDados()
    if (dadosErr) {
      setError(dadosErr)
      if (isMobile) setStep('dados')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.')
      return
    }
    if (!acceptPrivacy) {
      setError('Aceite a Política de Privacidade para continuar.')
      return
    }

    setLoading(true)
    try {
      const result = await registerClient({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phoneToE164(phone),
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
  const showFields = !isMobile || step === 'dados'
  const showAccess = !isMobile || step === 'acesso'

  return (
    <div
      className="login-page client-register-page"
      style={{ ['--login-bg-image' as string]: `url(${bgUrl})` }}
    >
      <form className="login-card card client-register-card" onSubmit={(e) => void handleSubmit(e)}>
        <header className="client-register-head">
          <AuthCardHeader backTo="/login" backLabel="Voltar ao login" />
          <h1 className="register-title-line client-register-title">Conta de visitante</h1>
          <p className="muted client-register-lead">
            Salve favoritos e acompanhe suas visitas. WhatsApp obrigatório para avisos.
          </p>
          {isMobile && (
            <ol className="register-steps" aria-label="Etapas do cadastro">
              <li className={step === 'dados' ? 'is-active' : ''}>1. Dados</li>
              <li className={step === 'acesso' ? 'is-active' : ''}>2. Acesso</li>
            </ol>
          )}
        </header>

        {error && <div className="alert alert-error">{error}</div>}

        {showFields && (
          <div className="client-register-grid">
            <label>
              Nome completo
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
              WhatsApp / celular
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(formatBrPhone(e.target.value))}
                placeholder="(99) 99999-9999"
                required
                autoComplete="tel"
              />
            </label>
            {!isMobile && (
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
            )}
          </div>
        )}

        {showAccess && (
          <div className="client-register-footer-block">
            {isMobile && (
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
            )}

            <label className="checkbox-row client-register-privacy">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                required
              />
              <span>
                Li e aceito a{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={(e) => {
                    e.preventDefault()
                    setPrivacyOpen(true)
                  }}
                >
                  Política de Privacidade
                </button>
              </span>
            </label>

            <p className="client-reg-pro-line muted">
              É imobiliária ou corretor?{' '}
              <Link className="client-reg-pro-link" to="/register">
                Cadastre sua conta profissional
              </Link>
            </p>
          </div>
        )}

        <div className="client-register-actions">
          {isMobile && step === 'acesso' && (
            <button type="button" className="btn btn-ghost" onClick={() => setStep('dados')}>
              Voltar
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              loading ||
              (isMobile ? step === 'acesso' && !acceptPrivacy : !acceptPrivacy)
            }
          >
            {loading
              ? 'Criando…'
              : isMobile && step === 'dados'
                ? 'Continuar'
                : 'Criar conta'}
          </button>
        </div>

        <p className="muted client-register-footer">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>

      {privacyOpen && (
        <Modal
          title="Política de Privacidade"
          className="privacy-policy-modal"
          onClose={() => setPrivacyOpen(false)}
        >
          <PrivacyPolicyContent />
        </Modal>
      )}
    </div>
  )
}
