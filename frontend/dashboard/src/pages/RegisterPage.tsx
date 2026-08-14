import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { mapUser, quotePix, registerAccount, type PixQuote } from '../api/auth'
import { AuthCardHeader } from '../components/AuthCardHeader'
import { PasswordInput } from '../components/PasswordInput'
import { useAuth } from '../contexts/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { agencyPricing, independentPricing, planFullLabel, yearlySavingsLabel } from '../pricing'
import { formatBrPhone, isValidBrPhone, phoneToE164 } from '../utils/phone'

const TRIAL_DAYS = 7

type AccountType = 'agency' | 'independent'
type Plan = 'monthly' | 'yearly'
type Step = 'data' | 'plan' | 'confirm'

function parseAccountType(value: string | null): AccountType {
  return value === 'independent' ? 'independent' : 'agency'
}

function parsePlan(value: string | null): Plan {
  return value === 'yearly' ? 'yearly' : 'monthly'
}

function RegisterBgVideo() {
  return (
    <video
      className="lp-register-bg-video"
      src={`${import.meta.env.BASE_URL}videos/register-bg.mp4`}
      autoPlay
      loop
      muted
      playsInline
      aria-hidden="true"
    />
  )
}

export function RegisterPage() {
  const [params, setParams] = useSearchParams()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { applySession } = useAuth()
  const accountType = parseAccountType(params.get('type'))
  const plan = parsePlan(params.get('plan'))

  const [step, setStep] = useState<Step>('data')
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)

  const [quoteLoading, setQuoteLoading] = useState(false)
  const [pixQuote, setPixQuote] = useState<PixQuote | null>(null)
  const [copied, setCopied] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ message: string; plan: string; trialEndsAt: string } | null>(
    null,
  )

  const planLabel = useMemo(() => planFullLabel(plan, accountType), [plan, accountType])
  const isAgency = accountType === 'agency'

  function updateParam(key: 'type' | 'plan', value: string) {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next, { replace: true })
  }

  function validateDataFields(): string | null {
    if (!name.trim()) return 'Informe seu nome.'
    if (!businessName.trim())
      return isAgency ? 'Informe o nome da imobiliária.' : 'Informe seu nome comercial.'
    if (!email.trim() || !email.includes('@')) return 'Informe um e-mail válido.'
    if (!isValidBrPhone(phone)) return 'Informe um WhatsApp/celular válido, com DDD.'
    if (password.length < 8) return 'A senha deve ter ao menos 8 caracteres.'
    return null
  }

  function goToPlanStep() {
    const message = validateDataFields()
    if (message) {
      setError(message)
      return
    }
    setError(null)
    setStep('plan')
  }

  async function goToConfirm() {
    const message = validateDataFields()
    if (message) {
      setError(message)
      return
    }
    setError(null)
    setQuoteLoading(true)
    try {
      const quote = await quotePix({ accountType, plan })
      setPixQuote(quote)
      setCopied(false)
      setStep('confirm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível calcular o Pix. Tente novamente.')
    } finally {
      setQuoteLoading(false)
    }
  }

  function goBack() {
    setError(null)
    setStep(isMobile ? 'plan' : 'data')
  }

  async function handleCopy() {
    if (!pixQuote) return
    try {
      await navigator.clipboard.writeText(pixQuote.copyPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard indisponível — usuário pode selecionar e copiar manualmente */
    }
  }

  async function handleRegister() {
    setError(null)
    if (!acceptPrivacy) {
      setError('Aceite a Política de Privacidade para continuar.')
      return
    }
    setLoading(true)
    try {
      const result = await registerAccount({
        email,
        password,
        name,
        phone: phoneToE164(phone),
        accountType,
        businessName,
        plan,
        pixReferenceCode: pixQuote?.txId,
        acceptPrivacy: true,
      })
      applySession(result.accessToken, mapUser(result.user))
      setDone({ message: result.message, plan: result.plan, trialEndsAt: result.trialEndsAt })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="login-page lp-register-wrap">
        <RegisterBgVideo />
        <div className="login-card card register-card">
          <AuthCardHeader backTo="/" backLabel="Voltar à página inicial" />
          <h1>Cadastro concluído</h1>
          <p className="muted">{done.message}</p>
          <div className="alert" style={{ background: '#ecfdf5', color: '#065f46' }}>
            Plano: <strong>{done.plan || planLabel}</strong>
            <br />
            Teste grátis: <strong>{TRIAL_DAYS} dias</strong>, até{' '}
            <strong>{new Date(done.trialEndsAt).toLocaleDateString('pt-BR')}</strong>.
            <br />
            Pague o Pix abaixo quando quiser para manter o acesso depois desse prazo. Também
            enviamos os detalhes e o QR Code para o seu e-mail.
          </div>
          {pixQuote && (
            <div className="register-pix register-pix-done">
              <img
                src={`data:image/png;base64,${pixQuote.qrCodePngBase64}`}
                alt="QR Code Pix para pagamento"
                width={180}
                height={180}
              />
              <div className="register-pix-copy">
                <input readOnly value={pixQuote.copyPaste} onFocus={(e) => e.target.select()} />
                <button type="button" className="btn btn-ghost" onClick={() => void handleCopy()}>
                  {copied ? 'Copiado!' : 'Pix copia e cola'}
                </button>
              </div>
            </div>
          )}
          <button type="button" className="btn btn-primary" onClick={() => navigate('/painel')}>
            Ir para o Dashboard
          </button>
          <Link to="/" className="btn btn-ghost">
            Voltar à página inicial
          </Link>
        </div>
      </div>
    )
  }

  const showData = step === 'data' || !isMobile
  const showPlan = step === 'plan' || !isMobile
  const showConfirm = step === 'confirm'

  const dataFields = (
    <div className="register-fields">
      <label>
        Seu nome
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        {isAgency ? 'Nome da imobiliária' : 'Nome comercial / marca'}
        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
      </label>
      <label>
        E-mail
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <div className="register-fields-row">
        <label>
          WhatsApp / celular
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(formatBrPhone(e.target.value))}
            placeholder="(99) 99999-9999"
            required
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
      </div>
    </div>
  )

  const planFields = (
    <fieldset className="register-plans">
      <legend>Escolha o plano</legend>
      <div className="register-plan-grid">
        <label className={`register-plan-card${plan === 'monthly' ? ' is-selected' : ''}`}>
          <input
            type="radio"
            name="plan"
            checked={plan === 'monthly'}
            onChange={() => updateParam('plan', 'monthly')}
          />
          <span className="register-plan-name">Mensal</span>
          <span className="register-plan-price">
            R$&nbsp;
            {isAgency ? agencyPricing.monthly.amount : independentPricing.monthly.amount}
            <small>/mês</small>
          </span>
          <ul>
            {isAgency ? (
              <>
                <li>Até {agencyPricing.monthly.includedBrokers} corretores inclusos</li>
                <li>Extra: {agencyPricing.extraBrokerMonthly}</li>
                <li>Vitrine, agenda e WhatsApp</li>
              </>
            ) : (
              <>
                <li>Conta individual (1 corretor)</li>
                <li>Vitrine, agenda e WhatsApp</li>
                <li>Sem equipe</li>
              </>
            )}
          </ul>
        </label>

        <label
          className={`register-plan-card register-plan-card-featured${plan === 'yearly' ? ' is-selected' : ''}`}
        >
          <input
            type="radio"
            name="plan"
            checked={plan === 'yearly'}
            onChange={() => updateParam('plan', 'yearly')}
          />
          <span className="register-plan-badge">Melhor custo</span>
          <span className="register-plan-name">Anual</span>
          <span className="register-plan-price">
            R$&nbsp;
            {isAgency ? agencyPricing.yearly.amount : independentPricing.yearly.amount}
            <small>/ano</small>
          </span>
          <ul>
            {isAgency ? (
              <>
                <li>Até {agencyPricing.yearly.includedBrokers} corretores inclusos</li>
                <li>Extra: {agencyPricing.extraBrokerYearly}</li>
                <li>{yearlySavingsLabel('agency')}</li>
              </>
            ) : (
              <>
                <li>Conta individual (1 corretor)</li>
                <li>Mesmos recursos do mensal</li>
                <li>{yearlySavingsLabel('independent')}</li>
              </>
            )}
          </ul>
        </label>
      </div>
    </fieldset>
  )

  return (
    <div className="login-page lp-register-wrap">
      <RegisterBgVideo />
      <div className="login-card card register-card">
        <header className="register-head">
          <AuthCardHeader backTo="/" backLabel="Voltar à página inicial" />
          <h1 className="register-title-line">
            <span>Cadastre-se</span>
            <span className="login-brand-sep" aria-hidden="true">
              -
            </span>
            <span className="register-lead-inline muted">
              {isAgency
                ? `Equipe, vitrine e agenda — ${TRIAL_DAYS} dias grátis para testar.`
                : 'Conta individual, vitrine e agenda só suas.'}
            </span>
          </h1>
          {!isAgency && (
            <p className="register-trial-note muted">{TRIAL_DAYS} dias grátis para testar.</p>
          )}

          {!showConfirm && (
            <div className="register-context" role="group" aria-label="Tipo de conta">
              <button
                type="button"
                className={`register-context-option${isAgency ? ' is-active' : ''}`}
                aria-pressed={isAgency}
                onClick={() => updateParam('type', 'agency')}
              >
                Sou Imobiliária
              </button>
              <button
                type="button"
                className={`register-context-option${!isAgency ? ' is-active' : ''}`}
                aria-pressed={!isAgency}
                onClick={() => updateParam('type', 'independent')}
              >
                Sou Corretor
              </button>
            </div>
          )}

          {isMobile && !showConfirm && (
            <ol className="register-steps" aria-label="Etapas do cadastro">
              <li className={step === 'data' ? 'is-active' : ''}>1. Dados</li>
              <li className={step === 'plan' ? 'is-active' : ''}>2. Plano</li>
              <li>3. Confirmação</li>
            </ol>
          )}

          {error && <div className="alert alert-error">{error}</div>}
        </header>

        {!showConfirm && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (isMobile && step === 'data') goToPlanStep()
              else void goToConfirm()
            }}
          >
            <div className="register-layout">
              {showPlan && planFields}
              {showData && dataFields}
            </div>

            <div className="register-actions">
              {isMobile && step === 'plan' && (
                <button type="button" className="btn btn-ghost" onClick={() => setStep('data')}>
                  ← Voltar
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={quoteLoading}>
                {quoteLoading
                  ? 'Calculando Pix…'
                  : isMobile && step === 'data'
                    ? 'Avançar'
                    : isAgency
                      ? 'Cadastrar imobiliária'
                      : 'Cadastrar corretor'}
              </button>
            </div>
            <p className="muted register-login-link">
              Já tem conta? <Link to="/login">Entrar</Link>
            </p>
          </form>
        )}

        {showConfirm && pixQuote && (
          <div className="register-confirm">
            <button type="button" className="btn btn-ghost register-back" onClick={goBack}>
              ← Voltar e editar
            </button>

            <div className="register-confirm-grid">
              <div className="register-summary">
                <h3>Confira seus dados</h3>
                <dl>
                  <dt>Nome</dt>
                  <dd>{name}</dd>
                  <dt>{isAgency ? 'Imobiliária' : 'Nome comercial'}</dt>
                  <dd>{businessName}</dd>
                  <dt>E-mail</dt>
                  <dd>{email}</dd>
                  <dt>WhatsApp</dt>
                  <dd>{phone}</dd>
                  <dt>Plano</dt>
                  <dd>{pixQuote.planLabel}</dd>
                </dl>
              </div>

              <div className="register-pix">
                <h3>Pagamento via Pix</h3>
                <img
                  src={`data:image/png;base64,${pixQuote.qrCodePngBase64}`}
                  alt="QR Code Pix para pagamento"
                  width={190}
                  height={190}
                />
                <p className="register-pix-amount">
                  R$&nbsp;{pixQuote.amount.toFixed(2).replace('.', ',')}
                </p>
                <div className="register-pix-copy">
                  <input readOnly value={pixQuote.copyPaste} onFocus={(e) => e.target.select()} />
                  <button type="button" className="btn btn-ghost" onClick={() => void handleCopy()}>
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <p className="muted register-pix-ref">Referência: {pixQuote.txId}</p>
              </div>
            </div>

            <p className="register-trial-note muted">
              Você terá {TRIAL_DAYS} dias grátis para usar o Allugme a partir do cadastro. Pague o
              Pix agora ou quando quiser dentro desse prazo.
            </p>

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

            {error && <div className="alert alert-error">{error}</div>}

            <button
              type="button"
              className="btn btn-primary register-submit"
              onClick={() => void handleRegister()}
              disabled={loading || !acceptPrivacy}
            >
              {loading ? 'Gravando…' : 'Gravar cadastro'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
