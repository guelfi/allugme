# Changelog de desenvolvimento — Allugme

Registro cronológico de evolução (decisões, entregas, mudanças de escopo).

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
