# Changelog de desenvolvimento — Allugme

Registro cronológico de evolução (decisões, entregas, mudanças de escopo).

---

## 2026-08-07

### Pacote e-mail / LGPD / horário / portal (fases 0–6)
- Resend + templates; reset de senha; convite corretor; e-mails de visita; `AvailabilityRule`; consentimentos LGPD; portal `/portal`.
- Plano: [plano-email-lgpd-portal-cliente.md](plano-email-lgpd-portal-cliente.md) marcado como concluído.
- Commit âncora: `817dd23`.

### UX login, cadastro visitante e Contato
- Login unificado (sem toggle Visitante/Allugme); redirect por papel.
- Cadastro visitante: mobile 2 passos, WhatsApp obrigatório, grid desktop, modal de privacidade, CTA “Já tem conta” abaixo do botão.
- Contato LP: “Falem conosco” (WA) sem número no bloco Contato.
- Commits: `3e2f761`, `636f910`, `88f30bc`, `ee92890`, `f2050ba`.

### Docs / handoff
- `CURRENT.md` atualizado: P1 limpo dos itens já entregues; progresso ~95%; sessão `SESSION-2026-08-07.md`.

---

## 2026-08-05 / 2026-08-06

### Cadastro, trial e Pix
- Fluxo de cadastro B2B em etapas (dados → plano → confirmação); WhatsApp obrigatório com máscara.
- Pix estático (QR + copia e cola) na confirmação e no e-mail; chave configurável no backend.
- **Trial 7 dias** (`TenantStatus.Trial` + `TrialEndsAt`): auto-login após cadastro; banner no dashboard; expiração → `PendingPayment`.
- Landing: CTA “7 dias grátis”; chip “Ver modelo” abre preview; vídeo leve de fundo na tela de registro.

### Dashboard / UX
- SaaS admin mobile-first: totais, detalhe de tenant (abas + visitas), somente leitura.
- Sidebar retrátil com ícones; topbar `Nome do tenant - Perfil`.
- Equipe: grid clicável, aviso/badge de foto obrigatória do corretor.
- PropertyForm e Visitas com abas (menos scroll no desktop).
- Padrão de título: `Título - subtítulo / somente leitura / Visão global`.
- Mídia de imóvel: até 13 fotos + 1 vídeo curto; avatar de face do corretor.

### Segurança / docs
- Senhas de seed removidas dos docs versionados; arquivo local `docs/usuarios-teste.local.md` + `.gitignore`.
- Handoff `CURRENT.md` atualizado com roadmap P1/P2.
- **Auditoria docs×código (2026-08-06):** nenhum item P1 listado como “futuro” estava já implementado; DoD das fases 0–4 em `04-plano-implementacao-fases.md` alinhados; débitos WA UI e nuance SaaS “não 100% read-only” documentados; Redis “cache leve” corrigido para P1.

### Commits relevantes
- `2513448` cadastro + Pix estático  
- `1a5aa89` admin SaaS mobile-first / mídia / avatar / detalhe tenant  
- `0dea7bf` sidebar retrátil + telas sem scroll  
- `983b69e` trial 7 dias + padronização de títulos  
- `deab67c` vídeo de fundo no cadastro + texto Hero  

---

## 2026-08-04

### Vitrine na raiz do domínio
- URL pública: `https://www.allugme.com.br/{slug}/` (sem `/allugme/t/`).  
- Painel/API permanecem em `/allugme/`. Assets de tema em `/themes/`.  
- Legado `/allugme/t/{slug}/` redireciona para `/{slug}/`.  
- Apex `allugme.com.br` → `www.allugme.com.br`.

### Documentação
- Pacote em `docs/` (Resumo, PRD, DET, Fases, Aceite, handoff, glossário, RBAC, escopo).  
- **Limpeza:** removida `oscar-trilha/`; estrutura achatada (sem `sua-trilha/` / `compartilhado/`).  
- Removidos artefatos descartáveis (prompts Claude Design, webm de referência ~9 MB).  
- **v1.1:** WhatsApp via Evolution API incluído no MVP.  
- **v1.2:** Redis incluído no MVP (fila WA, locks, cache, idempotência).  
- Produção HTTPS: `https://allugme.com.br/allugme/` (DNS registro.br + Let's Encrypt).

### Decisões de produto/tech
- Stack MVP: ASP.NET Core 10 + PostgreSQL + **Redis** + React; sem MAUI.  
- Vitrine: **5 temas** HTML oficiais (moderno, urbano, classico, minimal, porto); custom em P2.  
- Visita inicia como `pending` até confirmação do corretor.  
- Buffer: corretor > tenant > 60 min.  
- Broker edita apenas imóveis em que é responsável; agency_admin edita todos do tenant.  
- **WhatsApp:** Evolution API; config no painel; aviso de solicitação; confirmação `SIM/NAO {codigo}`; envio via **fila Redis**; falha de envio não bloqueia criação da visita; chat livre fora do MVP.  
- **Redis:** fila WhatsApp, lock de agenda, cache busca/slots (P1), idempotência webhook, rate limit (P1).

### Código
- Estrutura na raiz (`backend/`, `frontend/dashboard/`, `themes/official/*`, `storage/`).  
- Temas oficiais: `moderno`, **`urbano`** (ref. QuintoAndar), `classico`, `minimal`, `porto`.  
- Referência formal da busca: `docs/design/referencia-busca-quintoandar.md` (+ PNGs em `references/`).  
- Seed: 5 tenants (um por tema) — ver `docs/06-seed-demo-tenants.md`.
