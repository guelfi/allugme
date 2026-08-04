import { type FormEvent, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { registerAccount } from '../api/auth'
import { agencyPricing, independentPricing, planFullLabel } from '../pricing'

type AccountType = 'agency' | 'independent'
type Plan = 'monthly' | 'yearly'

function parseAccountType(value: string | null): AccountType {
  return value === 'independent' ? 'independent' : 'agency'
}

function parsePlan(value: string | null): Plan {
  return value === 'yearly' ? 'yearly' : 'monthly'
}

export function RegisterPage() {
  const [params, setParams] = useSearchParams()
  const accountType = parseAccountType(params.get('type'))
  const plan = parsePlan(params.get('plan'))
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ message: string; plan: string } | null>(null)

  const planLabel = useMemo(() => planFullLabel(plan, accountType), [plan, accountType])
  const isAgency = accountType === 'agency'

  function updateParam(key: 'type' | 'plan', value: string) {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next, { replace: true })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await registerAccount({
        email,
        password,
        name,
        phone: phone || undefined,
        accountType,
        businessName,
        plan,
      })
      setDone({ message: result.message, plan: result.plan })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="login-page lp-register-wrap">
        <div className="login-card card register-card">
          <div className="login-brand-block">
            <Link to="/" className="login-back-link">
              ← Voltar à página inicial
            </Link>
            <p className="lp-kicker">
              <Link to="/" className="brand-home-link">
                Allugme
              </Link>
            </p>
          </div>
          <h1>Cadastro recebido</h1>
          <p className="muted">{done.message}</p>
          <div className="alert" style={{ background: '#ecfdf5', color: '#065f46' }}>
            Plano: <strong>{done.plan || planLabel}</strong>
            <br />
            Pagamento: <strong>Pix</strong> — liberação pelo administrador Allugme.
          </div>
          <Link to="/login" className="btn btn-primary">
            Ir para o login
          </Link>
          <Link to="/" className="btn btn-ghost">
            Voltar à página inicial
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page lp-register-wrap">
      <form className="login-card card register-card" onSubmit={(e) => void handleSubmit(e)}>
        <header className="register-head">
          <div className="login-brand-block">
            <Link to="/" className="login-back-link">
              ← Voltar à página inicial
            </Link>
            <p className="lp-kicker">
              <Link to="/" className="brand-home-link">
                Allugme
              </Link>
            </p>
          </div>
          <h1>{isAgency ? 'Cadastro de imobiliária' : 'Cadastro de corretor'}</h1>
          <p className="muted register-lead">
            {isAgency
              ? 'Equipe, vitrine e agenda — ativação após Pix.'
              : 'Conta individual — vitrine e agenda só suas, ativação após Pix.'}
          </p>

          <div className="register-context">
            <span className="register-context-badge">
              {isAgency ? 'Imobiliária' : 'Corretor independente'}
            </span>
            <button
              type="button"
              className="register-context-switch"
              onClick={() => updateParam('type', isAgency ? 'independent' : 'agency')}
            >
              {isAgency ? 'Quero ser corretor' : 'Quero imobiliária'}
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
        </header>

        <div className="register-layout">
          <fieldset className="register-plans">
            <legend>Escolha o plano</legend>
            <div className="register-plan-grid">
              <label
                className={`register-plan-card${plan === 'monthly' ? ' is-selected' : ''}`}
              >
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
                      <li>Extra: {agencyPricing.extraBrokerMonthly}/mês</li>
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
                      <li>Extra: {agencyPricing.extraBrokerYearly}/mês</li>
                      <li>Economia vs. 12× mensal</li>
                    </>
                  ) : (
                    <>
                      <li>Conta individual (1 corretor)</li>
                      <li>Mesmos recursos do mensal</li>
                      <li>Economia vs. 12× mensal</li>
                    </>
                  )}
                </ul>
              </label>
            </div>
            <p className="register-plan-note">
              Pagamento via Pix. Liberação pelo administrador Allugme.
            </p>
          </fieldset>

          <div className="register-fields">
            <label>
              Seu nome
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              {isAgency ? 'Nome da imobiliária' : 'Nome comercial / marca'}
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <div className="register-fields-row">
              <label>
                WhatsApp (opcional)
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+55…"
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </label>
            </div>

            <p className="muted register-footnote">
              Após enviar, realize o Pix do plano escolhido. O administrador libera o acesso — não há
              cobrança automática por cartão nesta etapa.
            </p>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando…' : isAgency ? 'Cadastrar imobiliária' : 'Cadastrar corretor'}
            </button>
            <p className="muted register-login-link">
              Já tem conta? <Link to="/login">Entrar</Link>
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
