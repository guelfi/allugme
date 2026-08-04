import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { agencyPricing, independentPricing } from '../pricing'

type CarouselDirection = 'forward' | 'reverse'
type PlanAudience = 'agency' | 'independent'

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

function ThemeCarousel({
  items,
  onSelect,
  paused,
}: {
  items: readonly ThemeItem[]
  onSelect: (theme: ThemeItem) => void
  paused?: boolean
}) {
  const [direction, setDirection] = useState<CarouselDirection>('forward')
  const [hoverPaused, setHoverPaused] = useState(false)
  const loop = [...items, ...items]
  const isPaused = Boolean(paused || hoverPaused)

  return (
    <div className="lp-carousel" aria-roledescription="carrossel">
      <div
        className="lp-carousel-stage"
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
        onFocusCapture={() => setHoverPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setHoverPaused(false)
          }
        }}
      >
        <button
          type="button"
          className={`lp-carousel-arrow lp-carousel-arrow-prev${direction === 'forward' ? ' is-active' : ''}`}
          aria-label="Direção: da direita para a esquerda"
          aria-pressed={direction === 'forward'}
          onClick={() => setDirection('forward')}
        >
          <span aria-hidden="true">←</span>
        </button>

        <div className="lp-carousel-mask">
          <div
            className={[
              'lp-carousel-track',
              direction === 'reverse' ? 'is-reverse' : 'is-forward',
              isPaused ? 'is-paused' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {loop.map((t, index) => (
              <article
                key={`${t.key}-${index}`}
                className={`lp-theme lp-theme-${t.key}`}
                aria-hidden={index >= items.length}
              >
                <button
                  type="button"
                  className="lp-theme-thumb"
                  tabIndex={index >= items.length ? -1 : 0}
                  onClick={() => onSelect(t)}
                  aria-label={`Ver preview do layout ${t.name}`}
                >
                  <img
                    src={thumbSrc(t.key)}
                    alt={index >= items.length ? '' : `Preview do layout ${t.name}`}
                    loading="lazy"
                    draggable={false}
                  />
                  <span className="lp-theme-thumb-label">Ver modelo</span>
                </button>
                <h3>{t.name}</h3>
                <p>{t.blurb}</p>
              </article>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`lp-carousel-arrow lp-carousel-arrow-next${direction === 'reverse' ? ' is-active' : ''}`}
          aria-label="Direção: da esquerda para a direita"
          aria-pressed={direction === 'reverse'}
          onClick={() => setDirection('reverse')}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}

export function LandingPage() {
  const [preview, setPreview] = useState<ThemeItem | null>(null)
  const [planAudience, setPlanAudience] = useState<PlanAudience>('agency')

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

  const isAgency = planAudience === 'agency'

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-nav-bar">
          <a className="lp-brand" href="#topo">
            <span className="lp-brand-mark">A</span>
            <span>Allugme</span>
          </a>

          <nav className="lp-section-nav" aria-label="Seções da página">
            <a href="#recursos">Recursos</a>
            <a href="#layouts">Layouts</a>
            <a href="#whatsapp">WhatsApp</a>
            <a href="#planos">Planos</a>
            <a href="#contato">Contato</a>
          </nav>

          <div className="lp-nav-actions">
            <Link to="/login" className="btn btn-ghost btn-sm">
              Entrar
            </Link>
            <Link to="/register?type=agency" className="btn btn-primary btn-sm">
              Começar
            </Link>
          </div>
        </div>
      </header>

      <main id="topo">
        <section className="lp-viewport lp-hero" aria-label="Apresentação">
          <div className="lp-hero-copy">
            <p className="lp-kicker">SaaS imobiliário brasileiro</p>
            <h1 className="lp-logo-hero">Allugme</h1>
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

        <section id="recursos" className="lp-viewport lp-section">
          <div className="lp-section-inner">
            <header className="lp-section-head">
              <h2>Tudo que a operação precisa — sem complexidade de marketplace.</h2>
              <p>
                O Allugme não tenta ser um clone genérico: é a plataforma da sua carteira, com
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
          </div>
        </section>

        <section id="layouts" className="lp-viewport lp-section lp-section-alt">
          <div className="lp-section-inner">
            <header className="lp-section-head">
              <h2>Layouts que vestem a marca — e espaço para criar os seus.</h2>
              <p>
                Clique na miniatura para ver o modelo em ação. Depois, personalize ou solicite novos
                layouts: a ferramenta se adapta à imobiliária ou ao corretor independente.
              </p>
            </header>
            <ThemeCarousel
              items={themes}
              onSelect={setPreview}
              paused={Boolean(preview)}
            />
            <p className="lp-section-foot">
              Precisa de um visual exclusivo? Gere novos layouts sob demanda — a vitrine acompanha a
              identidade do seu negócio.
            </p>
          </div>
        </section>

        <section id="whatsapp" className="lp-viewport lp-section">
          <div className="lp-section-inner">
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
          </div>
        </section>

        <section id="planos" className="lp-viewport lp-section lp-section-alt">
          <div className="lp-section-inner">
            <header className="lp-section-head">
              <h2>Planos claros. Pagamento via Pix.</h2>
              <p>
                Escolha o perfil da sua conta. Imobiliária inclui equipe; corretor independente é
                conta individual. Liberação pelo administrador após o Pix.
              </p>
            </header>

            <div className="lp-plan-switch" role="tablist" aria-label="Tipo de plano">
              <button
                type="button"
                role="tab"
                aria-selected={isAgency}
                className={isAgency ? 'is-active' : undefined}
                onClick={() => setPlanAudience('agency')}
              >
                Imobiliária
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isAgency}
                className={!isAgency ? 'is-active' : undefined}
                onClick={() => setPlanAudience('independent')}
              >
                Corretor independente
              </button>
            </div>

            <p className="lp-plan-audience-note">
              {isAgency
                ? `Até ${agencyPricing.monthly.includedBrokers} corretores inclusos. Extra: ${agencyPricing.extraBrokerMonthly}/mês (mensal) ou ${agencyPricing.extraBrokerYearly}/mês (anual).`
                : 'Conta individual: vitrine, agenda e WhatsApp só seus — sem assentos de equipe.'}
            </p>

            <div className="lp-pricing" key={planAudience}>
              {isAgency ? (
                <>
                  <article className="lp-price-card">
                    <h3>Mensal</h3>
                    <p className="lp-price">
                      R$&nbsp;{agencyPricing.monthly.amount}
                      <span>/mês</span>
                    </p>
                    <ul>
                      <li>Até {agencyPricing.monthly.includedBrokers} corretores inclusos</li>
                      <li>Corretor extra: {agencyPricing.extraBrokerMonthly}/mês</li>
                      <li>Vitrine, agenda com buffer e WhatsApp</li>
                      <li>Ativação após Pix</li>
                    </ul>
                    <Link
                      to="/register?type=agency&plan=monthly"
                      className="btn btn-primary btn-block"
                    >
                      Assinar mensal
                    </Link>
                  </article>
                  <article className="lp-price-card lp-price-card-featured">
                    <p className="lp-badge">Melhor custo</p>
                    <h3>Anual</h3>
                    <p className="lp-price">
                      R$&nbsp;{agencyPricing.yearly.amount}
                      <span>/ano</span>
                    </p>
                    <ul>
                      <li>Até {agencyPricing.yearly.includedBrokers} corretores inclusos</li>
                      <li>Corretor extra: {agencyPricing.extraBrokerYearly}/mês</li>
                      <li>Economia vs. 12× mensal</li>
                      <li>Liberação pelo administrador</li>
                    </ul>
                    <Link
                      to="/register?type=agency&plan=yearly"
                      className="btn btn-primary btn-block"
                    >
                      Assinar anual
                    </Link>
                  </article>
                </>
              ) : (
                <>
                  <article className="lp-price-card">
                    <h3>Mensal</h3>
                    <p className="lp-price">
                      R$&nbsp;{independentPricing.monthly.amount}
                      <span>/mês</span>
                    </p>
                    <ul>
                      <li>Conta individual (1 corretor)</li>
                      <li>Vitrine pública com layouts oficiais</li>
                      <li>Agenda com buffer e WhatsApp</li>
                      <li>Ativação após Pix</li>
                    </ul>
                    <Link
                      to="/register?type=independent&plan=monthly"
                      className="btn btn-primary btn-block"
                    >
                      Assinar mensal
                    </Link>
                  </article>
                  <article className="lp-price-card lp-price-card-featured">
                    <p className="lp-badge">Melhor custo</p>
                    <h3>Anual</h3>
                    <p className="lp-price">
                      R$&nbsp;{independentPricing.yearly.amount}
                      <span>/ano</span>
                    </p>
                    <ul>
                      <li>Conta individual (1 corretor)</li>
                      <li>Mesmos recursos do plano mensal</li>
                      <li>Economia vs. 12× mensal</li>
                      <li>Liberação pelo administrador</li>
                    </ul>
                    <Link
                      to="/register?type=independent&plan=yearly"
                      className="btn btn-primary btn-block"
                    >
                      Assinar anual
                    </Link>
                  </article>
                </>
              )}
            </div>

            <p className="lp-section-foot">
              Após o cadastro, envie o comprovante Pix conforme as instruções. O administrador ativa
              a conta — aí o painel e a vitrine ficam liberados.
            </p>
          </div>
        </section>

        <section
          id="contato"
          className="lp-viewport lp-close"
          aria-label="Contato e cadastro"
        >
          <div className="lp-close-inner">
            <p className="lp-kicker lp-close-kicker">Contato</p>
            <h2>Coloque sua carteira no ar</h2>
            <p>
              Imobiliária com equipe ou corretor independente: cadastre-se, pague via Pix e aguarde a
              ativação.
            </p>
            <div className="lp-close-cta">
              <Link to="/register?type=agency" className="btn btn-primary btn-lg">
                Cadastrar imobiliária
              </Link>
              <Link to="/register?type=independent" className="btn btn-ghost-light btn-lg">
                Cadastrar corretor
              </Link>
            </div>
          </div>
          <footer className="lp-footer lp-footer-on-close">
            <div>
              <strong>Allugme</strong>
              <span>Vitrine · Agenda · WhatsApp</span>
            </div>
            <div className="lp-footer-links">
              <Link to="/login">Entrar no painel</Link>
              <a href={`${assetBase}swagger/index.html`} target="_blank" rel="noreferrer">
                API / Swagger
              </a>
              <a href="mailto:admin@allugme.com.br">admin@allugme.com.br</a>
            </div>
          </footer>
        </section>
      </main>

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
