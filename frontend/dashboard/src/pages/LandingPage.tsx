import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CookieConsent } from '../components/CookieConsent'
import {
  contactEmail,
  contactMailto,
  contactWhatsAppDisplay,
  contactWhatsAppUrl,
} from '../contact'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1.15em"
      height="1.15em"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.91.51 3.77 1.48 5.4L2 22l4.93-1.58a10 10 0 0 0 5.11 1.41h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2m0 17.94h-.01a8.1 8.1 0 0 1-4.13-1.13l-.3-.17-2.92.94.98-2.85-.19-.3a8.08 8.08 0 0 1-1.25-4.3c0-4.47 3.67-8.1 8.18-8.1s8.18 3.63 8.18 8.1-3.67 8.11-8.18 8.11m4.49-6.07c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.25-.63.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.38-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07s.89 2.4 1.01 2.56c.12.16 1.75 2.67 4.24 3.74 1.49.64 2.07.7 2.81.59.45-.07 1.46-.6 1.67-1.17.2-.58.2-1.07.14-1.17-.06-.11-.22-.17-.47-.29"
      />
    </svg>
  )
}
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
  return `/${slug}/`
}

function HeroLayoutCarousel({ items }: { items: readonly ThemeItem[] }) {
  const [paused, setPaused] = useState(false)
  const loop = [...items, ...items]

  return (
    <div
      className="lp-hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className={`lp-hero-carousel-track${paused ? ' is-paused' : ''}`}>
        {loop.map((t, index) => (
          <figure key={`${t.key}-${index}`} className="lp-hero-carousel-card" aria-hidden={index >= items.length}>
            <img src={thumbSrc(t.key)} alt="" loading="lazy" draggable={false} />
            <figcaption>{t.name}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
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

function PricingCards({ audience }: { audience: PlanAudience }) {
  const isAgency = audience === 'agency'

  if (isAgency) {
    return (
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
          <Link to="/register?type=agency&plan=monthly" className="btn btn-primary btn-block">
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
          <Link to="/register?type=agency&plan=yearly" className="btn btn-primary btn-block">
            Assinar anual
          </Link>
        </article>
      </>
    )
  }

  return (
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
        <Link to="/register?type=independent&plan=monthly" className="btn btn-primary btn-block">
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
        <Link to="/register?type=independent&plan=yearly" className="btn btn-primary btn-block">
          Assinar anual
        </Link>
      </article>
    </>
  )
}

export function LandingPage() {
  const [preview, setPreview] = useState<ThemeItem | null>(null)
  const [planAudience, setPlanAudience] = useState<PlanAudience>('agency')
  const [planInView, setPlanInView] = useState(false)
  const [planAutoPaused, setPlanAutoPaused] = useState(false)
  const planSectionRef = useRef<HTMLElement | null>(null)
  const manualPauseUntil = useRef(0)

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

  useEffect(() => {
    const el = planSectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setPlanInView(entry.isIntersecting && entry.intersectionRatio >= 0.35),
      { threshold: [0.35, 0.5, 0.7] },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!planInView || planAutoPaused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const id = window.setInterval(() => {
      if (Date.now() < manualPauseUntil.current) return
      setPlanAudience((prev) => (prev === 'agency' ? 'independent' : 'agency'))
    }, 4000)

    return () => window.clearInterval(id)
  }, [planInView, planAutoPaused])

  function selectAudience(audience: PlanAudience) {
    manualPauseUntil.current = Date.now() + 12000
    setPlanAudience(audience)
  }

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
          <div className="lp-hero-visual">
            <HeroLayoutCarousel items={themes} />
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
            <ThemeCarousel items={themes} onSelect={setPreview} paused={Boolean(preview)} />
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

        <section
          id="planos"
          ref={planSectionRef}
          className="lp-viewport lp-section lp-section-alt"
          onMouseEnter={() => setPlanAutoPaused(true)}
          onMouseLeave={() => setPlanAutoPaused(false)}
          onFocusCapture={() => setPlanAutoPaused(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setPlanAutoPaused(false)
            }
          }}
          onTouchStart={() => {
            setPlanAutoPaused(true)
            manualPauseUntil.current = Date.now() + 12000
          }}
        >
          <div className="lp-section-inner">
            <header className="lp-section-head">
              <h2>Planos claros. Pagamento via Pix.</h2>
              <p>
                Escolha o perfil da sua conta. Imobiliária inclui equipe; corretor independente é
                conta individual. Liberação pelo administrador após o Pix.
              </p>
            </header>

            <div className="lp-plan-layout">
              <aside className="lp-plan-audience">
                <p className="lp-plan-audience-label">Perfil da conta</p>
                <div className="lp-plan-switch" role="tablist" aria-label="Tipo de plano">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isAgency}
                    className={isAgency ? 'is-active' : undefined}
                    onClick={() => selectAudience('agency')}
                  >
                    Imobiliária
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!isAgency}
                    className={!isAgency ? 'is-active' : undefined}
                    onClick={() => selectAudience('independent')}
                  >
                    Corretor independente
                  </button>
                </div>
                <p className="lp-plan-audience-note">
                  {isAgency
                    ? `Até ${agencyPricing.monthly.includedBrokers} corretores inclusos. Extra: ${agencyPricing.extraBrokerMonthly}/mês (mensal) ou ${agencyPricing.extraBrokerYearly}/mês (anual).`
                    : 'Conta individual: vitrine, agenda e WhatsApp só seus — sem assentos de equipe.'}
                </p>
              </aside>

              <div className="lp-pricing" key={planAudience}>
                <PricingCards audience={planAudience} />
              </div>
            </div>

            <p className="lp-section-foot">
              Após o cadastro, envie o comprovante Pix conforme as instruções. O administrador ativa
              a conta — aí o painel e a vitrine ficam liberados.
            </p>
          </div>
        </section>

        <section id="contato" className="lp-viewport lp-close" aria-label="Contato e cadastro">
          <div className="lp-close-inner">
            <p className="lp-kicker lp-close-kicker">Contato</p>
            <h2>Coloque sua carteira no ar</h2>
            <p>
              Imobiliária com equipe ou corretor independente: cadastre-se, pague via Pix e aguarde a
              ativação. Ou fale conosco agora.
            </p>
            <div className="lp-close-cta">
              <Link to="/register?type=agency" className="btn btn-primary btn-lg">
                Cadastrar imobiliária
              </Link>
              <Link to="/register?type=independent" className="btn btn-ghost-light btn-lg">
                Cadastrar corretor
              </Link>
            </div>
            <div className="lp-close-contact" aria-label="Canais de contato">
              <a
                className="lp-close-channel lp-close-wa"
                href={contactWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="lp-close-wa-icon" />
                <span>{contactWhatsAppDisplay}</span>
              </a>
              <a className="lp-close-channel" href={contactMailto}>
                <span>{contactEmail}</span>
              </a>
            </div>
          </div>
          <footer className="lp-footer lp-footer-on-close">
            <div>
              <strong>Allugme</strong>
              <span>Vitrine · Agenda · WhatsApp</span>
            </div>
            <div className="lp-footer-links">
              <Link to="/login">Entrar no painel</Link>
              <a href="#privacidade">Política de Privacidade</a>
              <a href="#privacidade">Cookies</a>
              <a
                className="lp-footer-wa"
                href={contactWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                <span>{contactWhatsAppDisplay}</span>
              </a>
              <a href={contactMailto}>{contactEmail}</a>
            </div>
          </footer>
        </section>

        <section id="privacidade" className="lp-viewport lp-section lp-privacy" aria-label="Privacidade">
          <div className="lp-section-inner lp-privacy-inner">
            <header className="lp-section-head">
              <p className="lp-kicker">LGPD</p>
              <h2>Política de Privacidade e Cookies</h2>
              <p>
                Esta política descreve, de forma resumida, como o Allugme trata dados pessoais na
                landing e no uso inicial da plataforma, em conformidade com a Lei Geral de Proteção
                de Dados (LGPD).
              </p>
            </header>
            <div className="lp-privacy-grid">
              <article>
                <h3>Controlador</h3>
                <p>
                  Allugme — contato: <a href={contactMailto}>{contactEmail}</a> · WhatsApp{' '}
                  <a href={contactWhatsAppUrl} target="_blank" rel="noopener noreferrer">
                    {contactWhatsAppDisplay}
                  </a>
                  .
                </p>
              </article>
              <article>
                <h3>Dados e finalidades</h3>
                <p>
                  Dados de cadastro (nome, e-mail, telefone, dados da imobiliária/corretor) são usados
                  para criar conta, comunicação operacional e ativação após Pix. Dados de navegação
                  e cookies ajudam a manter sessão e preferências.
                </p>
              </article>
              <article>
                <h3>Cookies</h3>
                <p>
                  Utilizamos cookies necessários ao funcionamento do site. Com o seu consentimento,
                  podemos usar cookies para melhorar a experiência. Você pode aceitar ou recusar no
                  banner exibido na primeira visita; a escolha fica salva neste navegador.
                </p>
              </article>
              <article>
                <h3>Seus direitos</h3>
                <p>
                  Você pode solicitar acesso, correção, eliminação ou informações sobre o tratamento
                  dos seus dados pelos canais acima. Em dúvidas sobre LGPD, fale conosco por e-mail
                  ou WhatsApp.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <CookieConsent />

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
