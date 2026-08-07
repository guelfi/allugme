import { Link } from 'react-router-dom'

export function PrivacyPage() {
  const bgUrl = `${import.meta.env.BASE_URL}login-buildings.jpg`

  return (
    <div className="login-page" style={{ ['--login-bg-image' as string]: `url(${bgUrl})` }}>
      <div className="login-card card" style={{ width: 'min(640px, 100%)', maxHeight: '90svh', overflow: 'auto' }}>
        <div className="login-brand-block">
          <Link to="/" className="login-back-link">
            ← Voltar
          </Link>
          <span className="login-brand-sep" aria-hidden="true">
            -
          </span>
          <Link to="/" className="login-brand-name">
            Allugme
          </Link>
        </div>
        <h1 className="register-title-line" style={{ fontSize: '1.25rem', margin: 0 }}>
          Política de Privacidade
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </p>
        <div style={{ display: 'grid', gap: '0.85rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
          <section>
            <h2 style={{ fontSize: '1rem', margin: '0 0 0.35rem' }}>Quem somos</h2>
            <p style={{ margin: 0 }}>
              O Allugme é uma plataforma de vitrine imobiliária, agenda de visitas e comunicação
              operacional. Ao utilizar o serviço, você nos confia dados pessoais necessários à
              prestação dessas funcionalidades.
            </p>
          </section>
          <section>
            <h2 style={{ fontSize: '1rem', margin: '0 0 0.35rem' }}>Dados que coletamos</h2>
            <p style={{ margin: 0 }}>
              Podemos tratar nome, e-mail, telefone/WhatsApp, foto de perfil (corretores), dados de
              cadastro comercial, preferências de notificação e registros de visitas agendadas. Em
              logs técnicos, podemos registrar endereço IP e navegador no momento do aceite desta
              política.
            </p>
          </section>
          <section>
            <h2 style={{ fontSize: '1rem', margin: '0 0 0.35rem' }}>Finalidades</h2>
            <p style={{ margin: 0 }}>
              Os dados são usados para criar e autenticar contas, operar a agenda de visitas,
              enviar notificações (e-mail e/ou WhatsApp, conforme configuração), manter a
              segurança da plataforma e cumprir obrigações legais.
            </p>
          </section>
          <section>
            <h2 style={{ fontSize: '1rem', margin: '0 0 0.35rem' }}>Bases legais e compartilhamento</h2>
            <p style={{ margin: 0 }}>
              Tratamos dados com base na execução de contrato, no legítimo interesse (segurança e
              melhoria do serviço) e no consentimento quando exigido (por exemplo, aceite desta
              política no cadastro). Dados de visitas podem ser compartilhados com a imobiliária ou
              corretor responsável pelo imóvel.
            </p>
          </section>
          <section>
            <h2 style={{ fontSize: '1rem', margin: '0 0 0.35rem' }}>Seus direitos</h2>
            <p style={{ margin: 0 }}>
              Você pode solicitar acesso, correção, portabilidade, anonimização ou exclusão dos
              seus dados, bem como revogar consentimentos, pelos canais de contato disponíveis no
              site. Responderemos no prazo legal aplicável.
            </p>
          </section>
          <section>
            <h2 style={{ fontSize: '1rem', margin: '0 0 0.35rem' }}>Retenção e segurança</h2>
            <p style={{ margin: 0 }}>
              Mantemos os dados pelo tempo necessário às finalidades acima ou exigido por lei.
              Adotamos medidas técnicas e organizacionais razoáveis para proteger as informações
              contra acessos não autorizados.
            </p>
          </section>
          <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            Versão 1.0 — atualizada em agosto de 2026.
          </p>
        </div>
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
          <Link to="/register">Voltar ao cadastro</Link>
          {' · '}
          <Link to="/portal/register">Cadastro de visitante</Link>
          {' · '}
          <Link to="/">Página inicial</Link>
        </p>
      </div>
    </div>
  )
}
