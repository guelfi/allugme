# Changelog de desenvolvimento — Alugue.me

Registro cronológico de evolução (decisões, entregas, mudanças de escopo).

---

## 2026-08-04

### Documentação
- Criado pacote em `docs/` (Resumo, PRD, DET, Fases, Aceite, handoff) na raiz.  
- Referências comuns na raiz: glossário, RBAC, escopo MVP rinha.  
- Modelos da trilha B apenas em `docs/Oscar/` (sem marca Alugue.me).  
- **v1.1:** WhatsApp via Evolution API incluído no MVP (docs atualizados).  
- **v1.2:** Redis incluído no MVP (fila WA, locks, cache, idempotência).

### Decisões de produto/tech
- Stack MVP: ASP.NET Core 10 + PostgreSQL + **Redis** + React; sem MAUI.  
- Vitrine: **5 temas** HTML oficiais (moderno, urbano, classico, minimal, porto); custom em P2.  
- Visita inicia como `pending` até confirmação do corretor.  
- Buffer: corretor > tenant > 60 min.  
- Broker edita apenas imóveis em que é responsável; agency_admin edita todos do tenant.  
- **WhatsApp:** Evolution API; config no painel; aviso de solicitação; confirmação `SIM/NAO {codigo}`; envio via **fila Redis**; falha de envio não bloqueia criação da visita; chat livre fora do MVP.  
- **Redis:** fila WhatsApp, lock de agenda, cache busca/slots (P1), idempotência webhook, rate limit (P1).

### Código
- Estrutura de pastas da Trilha A criada na raiz do repo (`backend/`, `frontend/dashboard/`, `themes/official/*`, `storage/`).  
- Stubs dos 3 temas (theme.json + pages/partials/assets).  
- `docker-compose.yml` (Postgres + Redis), `.env.example`, `.gitignore`, READMEs.  
- Scaffold `.csproj` / Vite ainda pendente.  
- **Temas oficiais:** import do Open Design → `moderno`; **`urbano` alinhado ao design system QuintoAndar** (azul royal, card de busca, pills, tabs Alugar/Comprar); + `classico`, `minimal`, `porto`. Preview: `themes/official/index.html`.  
- **Referência formal da busca:** `docs/design/referencia-busca-quintoandar.md` — home (card) + listagem (lista+mapa); imagens em `docs/design/references/`.  
- **Seed planejado:** 5 tenants (um por tema) — ver `docs/06-seed-demo-tenants.md` (`REQ-SEED-*`, Fase 4).
