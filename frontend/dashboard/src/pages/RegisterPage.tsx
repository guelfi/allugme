import { type FormEvent, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { registerAccount } from '../api/auth'

export function RegisterPage() {
  const [params] = useSearchParams()
  const initialType = params.get('type') === 'independent' ? 'independent' : 'agency'
  const initialPlan = params.get('plan') === 'yearly' ? 'yearly' : 'monthly'

  const [accountType, setAccountType] = useState<'agency' | 'independent'>(initialType)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>(initialPlan)
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ message: string; plan: string } | null>(null)

  const planLabel = useMemo(
    () => (plan === 'yearly' ? 'Anual — R$ 500,00' : 'Mensal — R$ 59,00'),
    [plan],
  )

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
        <div className="login-card card">
          <h1>Cadastro recebido</h1>
          <p className="muted">{done.message}</p>
          <div className="alert" style={{ background: '#ecfdf5', color: '#065f46' }}>
            Plano: <strong>{done.plan || planLabel}</strong>
            <br />
            Pagamento: <strong>Pix</strong> — liberação pelo administrador Alugue.me.
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
        <p className="lp-kicker">Alugue.me</p>
        <h1>Criar conta</h1>
        <p className="muted">Imobiliária ou corretor — ativação após Pix.</p>
        {error && <div className="alert alert-error">{error}</div>}

        <fieldset className="segmented">
          <legend>Tipo de conta</legend>
          <label>
            <input
              type="radio"
              name="type"
              checked={accountType === 'agency'}
              onChange={() => setAccountType('agency')}
            />
            Imobiliária
          </label>
          <label>
            <input
              type="radio"
              name="type"
              checked={accountType === 'independent'}
              onChange={() => setAccountType('independent')}
            />
            Corretor independente
          </label>
        </fieldset>

        <fieldset className="segmented">
          <legend>Plano</legend>
          <label>
            <input
              type="radio"
              name="plan"
              checked={plan === 'monthly'}
              onChange={() => setPlan('monthly')}
            />
            Mensal — R$ 59,00
          </label>
          <label>
            <input
              type="radio"
              name="plan"
              checked={plan === 'yearly'}
              onChange={() => setPlan('yearly')}
            />
            Anual — R$ 500,00
          </label>
        </fieldset>

        <label>
          Seu nome
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          {accountType === 'agency' ? 'Nome da imobiliária' : 'Nome comercial / marca'}
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
        </label>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          WhatsApp (opcional)
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55…" />
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

        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Após enviar, realize o Pix do plano escolhido. O administrador libera o acesso — não há
          cobrança automática por cartão nesta etapa.
        </p>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar cadastro'}
        </button>
        <p className="muted" style={{ textAlign: 'center' }}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  )
}
