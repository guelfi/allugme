import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const assetBase = (import.meta.env.BASE_URL || '/allugme/').replace(/\/?$/, '/')

const themes = [
  {
    key: 'moderno',
    name: 'Moderno',
    blurb: 'Vitrine clean com foco em conversão e busca rápida.',
    demoSlug: 'horizon',
  },
  {
    key: 'urbano',
    name: 'Urbano',
    blurb: 'Estilo marketplace: hero forte, card de busca e listagem com mapa.',
    demoSlug: 'vista-urbana',
  },
  {
    key: 'classico',
    name: 'Clássico',
    blurb: 'Tom consultivo para imobiliárias tradicionais e de alto padrão.',
    demoSlug: 'casa-tradicao',
  },
  {
    key: 'minimal',
    name: 'Minimal',
    blurb: 'Editorial e sofisticado — menos ruído, mais presença do imóvel.',
    demoSlug: 'atlas',
  },
  {
    key: 'porto',
    name: 'Porto',
    blurb: 'Identidade costeira, leve e memorável para marcas regionais.',
    demoSlug: 'porto-lar',
  },
] as const

type ThemeItem = (typeof themes)[number]

const features = [
  {
    title: 'Vitrine multi-tenant',
    text: 'Cada imobiliária ou corretor sobe com slug próprio, identidade visual e carteira isolada.',
  },
  {
    title: 'Layouts oficiais + customização',
    text: 'Comece com 5 layouts prontos e evolua para novos temas sob medida — a vitrine se adapta à sua marca.',
  },
  {
    title: 'Agenda com buffer inteligente',
    text: 'Slots de visita com intervalo configurável (padrão 60 min) para evitar sobreposição na agenda.',
  },
  {
    title: 'WhatsApp operacional',
    text: 'Solicitação de visita dispara aviso ao corretor. Confirme ou recuse com SIM/NAO — o visitante recebe o retorno.',
  },
  {
    title: 'Busca pública de imóveis',
    text: 'Filtros por cidade, bairro, preço, quartos e operação — prontos para o site da sua carteira.',
  },
  {
    title: 'Painel simples de verdade',
    text: 'Cadastro de imóveis, publicação, visitas e configurações em um só lugar, sem bagunça.',
  },
]

function thumbSrc(key: string) {
  return `${assetBase}theme-previews/${key}.jpg`
}

function demoUrl(slug: string) {
  return `${assetBase}t/${slug}/`
}

export function LandingPage() {
  const [preview, setPreview] = useState<ThemeItem | null>(null)

  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [preview])

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <a className="lp-brand" href="#topo">
            <span className="lp-brand-mark">A</span>
            <span>Alugue.me</span>
          </a>
          <nav className="lp-nav-links">
            <a href="#recursos">Recursos</a>
            <a href="#layouts">Layouts</a>
            <a href="#planos">Planos</a>
            <a href="#whatsapp">WhatsApp</a>
          </nav>
          <div className="lp-nav-actions">
            <Link to="/login" className="btn btn-ghost">
              Entrar
            </Link>
            <Link to="/register" className="btn btn-primary">
              Começar agora
            </Link>
          </div>
        </div>
      </header>

      <main id="topo">
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <p className="lp-kicker">SaaS imobiliário brasileiro</p>
            <h1 className="lp-logo-hero">Alugue.me</h1>
            <p className="lp-hero-lead">
              A vitrine e a agenda da sua imobiliária — com layouts prontos, visitas pelo WhatsApp e
              liberação simples via Pix.
            </p>
            <div className="lp-hero-cta">
              <Link to="/register?type=agency" className="btn btn-primary btn-lg">
                Sou imobiliária
              </Link>
              <Link to="/register?type=independent" className="btn btn-secondary btn-lg">
                Sou corretor
              </Link>
            </div>
            <p className="lp-hero-note">
              Cadastro em minutos. Pagamento via Pix. Ativação pelo administrador.
            </p>
          </div>
          <div className="lp-hero-visual" aria-hidden="true">
            <div className="lp-hero-panel">
              <span>Vitrine pública</span>
              <strong>5 layouts oficiais</strong>
              <em>Adaptável à sua marca</em>
            </div>
          </div>
        </section>

        <section id="recursos" className="lp-section">
          <header className="lp-section-head">
            <h2>Tudo que a operação precisa — sem complexidade de marketplace.</h2>
            <p>
              O Alugue.me não tenta ser um clone genérico: é a plataforma da sua carteira, com
              presença digital e rotina de visitas sob controle.
            </p>
          </header>
          <div className="lp-feature-grid">
            {features.map((f) => (
              <article key={f.title} className="lp-feature">
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="layouts" className="lp-section lp-section-alt">
          <header className="lp-section-head">
            <h2>Layouts que vestem a marca — e espaço para criar os seus.</h2>
            <p>
              Clique na miniatura para ver o modelo em ação. Depois, personalize ou solicite novos
              layouts: a ferramenta se adapta à imobiliária ou ao corretor independente.
            </p>
          </header>
          <div className="lp-theme-grid">
            {themes.map((t) => (
              <article key={t.key} className={`lp-theme lp-theme-${t.key}`}>
                <button
                  type="button"
                  className="lp-theme-thumb"
                  onClick={() => setPreview(t)}
                  aria-label={`Ver preview do layout ${t.name}`}
                >
                  <img src={thumbSrc(t.key)} alt={`Preview do layout ${t.name}`} loading="lazy" />
                  <span className="lp-theme-thumb-label">Ver modelo</span>
                </button>
                <h3>{t.name}</h3>
                <p>{t.blurb}</p>
              </article>
            ))}
          </div>
          <p className="lp-section-foot">
            Precisa de um visual exclusivo? Gere novos layouts sob demanda — a vitrine acompanha a
            identidade do seu negócio.
          </p>
        </section>

        <section id="whatsapp" className="lp-section">
          <header className="lp-section-head">
            <h2>Agendamento com controle via WhatsApp.</h2>
            <p>
              O visitante solicita a visita na vitrine. O corretor recebe no WhatsApp, responde{' '}
              <strong>SIM</strong> ou <strong>NAO</strong> com o código, e o status atualiza no
              painel — com aviso de retorno ao interessado.
            </p>
          </header>
          <ol className="lp-steps">
            <li>
              <strong>Solicitação</strong>
              <span>Lead escolhe horário disponível na agenda com buffer.</span>
            </li>
            <li>
              <strong>Aviso no WhatsApp</strong>
              <span>Mensagem automática para o número do corretor ou da imobiliária.</span>
            </li>
            <li>
              <strong>Confirmação rápida</strong>
              <span>SIM/NAO no chat — sem abrir o computador na rua.</span>
            </li>
          </ol>
        </section>

        <section id="planos" className="lp-section lp-section-alt">
          <header className="lp-section-head">
            <h2>Planos claros. Pagamento via Pix.</h2>
            <p>
              Escolha o ciclo, faça o Pix e aguarde a liberação pelo administrador do Alugue.me.
              Sem cartão obrigatório no lançamento.
            </p>
          </header>
          <div className="lp-pricing">
            <article className="lp-price-card">
              <h3>Mensal</h3>
              <p className="lp-price">
                R$&nbsp;59<span>/mês</span>
              </p>
              <ul>
                <li>Vitrine com layouts oficiais</li>
                <li>Agenda de visitas + buffer</li>
                <li>WhatsApp operacional</li>
                <li>Ativação após Pix</li>
              </ul>
              <Link to="/register?plan=monthly" className="btn btn-primary btn-block">
                Assinar mensal
              </Link>
            </article>
            <article className="lp-price-card lp-price-card-featured">
              <p className="lp-badge">Melhor custo</p>
              <h3>Anual</h3>
              <p className="lp-price">
                R$&nbsp;500<span>/ano</span>
              </p>
              <ul>
                <li>Tudo do plano mensal</li>
                <li>Economia equivalente a ~2 meses</li>
                <li>Prioridade em novos layouts</li>
                <li>Liberação pelo administrador</li>
              </ul>
              <Link to="/register?plan=yearly" className="btn btn-primary btn-block">
                Assinar anual
              </Link>
            </article>
          </div>
          <p className="lp-section-foot">
            Após o cadastro, envie o comprovante Pix conforme as instruções. O administrador ativa a
            conta — aí o painel e a vitrine ficam liberados.
          </p>
        </section>

        <section className="lp-cta-band">
          <h2>Pronto para colocar sua carteira no ar?</h2>
          <p>Imobiliária ou corretor: escolha seu caminho e comece pelo cadastro.</p>
          <div className="lp-hero-cta">
            <Link to="/register?type=agency" className="btn btn-primary btn-lg">
              Cadastrar imobiliária
            </Link>
            <Link to="/register?type=independent" className="btn btn-secondary btn-lg">
              Cadastrar corretor
            </Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div>
          <strong>Alugue.me</strong>
          <span>Vitrine · Agenda · WhatsApp</span>
        </div>
        <div className="lp-footer-links">
          <Link to="/login">Entrar no painel</Link>
          <a href={`${assetBase}swagger/index.html`} target="_blank" rel="noreferrer">
            API / Swagger
          </a>
        </div>
      </footer>

      {preview && (
        <div
          className="lp-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview do layout ${preview.name}`}
          onClick={() => setPreview(null)}
        >
          <div className="lp-modal-panel" onClick={(e) => e.stopPropagation()}>
            <header className="lp-modal-head">
              <div>
                <p className="lp-kicker">Layout {preview.name}</p>
                <h3>{preview.blurb}</h3>
              </div>
              <div className="lp-modal-actions">
                <a
                  className="btn btn-secondary"
                  href={demoUrl(preview.demoSlug)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir em nova aba
                </a>
                <button type="button" className="btn btn-ghost" onClick={() => setPreview(null)}>
                  Fechar
                </button>
              </div>
            </header>
            <div className="lp-modal-frame-wrap">
              <iframe
                title={`Preview ${preview.name}`}
                src={demoUrl(preview.demoSlug)}
                className="lp-modal-frame"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
