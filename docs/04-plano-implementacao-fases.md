# Plano de Implementação em Fases — Allugme

**Versão:** 1.2  
**Data:** 2026-08-04  
**Trilha:** A — ASP.NET Core 10 + React  
**Prazo-alvo:** 11–15 semanas (~20h/semana) ou 5–8 semanas full-time

---

## Visão geral

| Fase | Nome | Semanas (part-time) | Checkpoint rinha |
|------|------|---------------------|------------------|
| 0 | Foundation | 0,5–1 | — |
| 1 | Auth + Tenancy + RBAC | 2–3 | S4 (parcial) |
| 2 | Imóveis + Busca | 2–3 | S4 / S8 |
| 3 | Visitas + Buffer | 2 | S12 (parcial) |
| 3b | WhatsApp (Evolution API) | 1,5–2 | S12 |
| 4 | Temas + Vitrine | 2 | S8 / S14 |
| 5 | Polish + Aceite | 1–2 | S14–16 |

Ordem sugerida: 0 → 1 → 2 → 3 → 3b; fase 4 pode overlap com 3/3b (temas HTML em paralelo) → 5.

---

## Fase 0 — Foundation

**Objetivo:** solução compilando, Postgres + Redis no ar, OpenAPI vazio.

### Entregáveis
- Solution `AlugueMe` (Domain, Application, Infrastructure, Api)
- EF Core + PostgreSQL + migration inicial vazia/Users
- Docker Compose (**postgres + redis**; evolution opcional)
- Registro de `IConnectionMultiplexer` / stack Redis em Infrastructure
- Projeto React (Vite) com rota placeholder
- Pasta `themes/official` com 3 skeletons
- `.env.example` com connection strings
- Atualizar `handoff/CURRENT.md`

### DoD
- [ ] `dotnet build` OK  
- [ ] `npm run build` OK  
- [ ] API health check responde  
- [ ] Redis ping OK via API/health ou smoke test  
- [ ] Docs lidas (PRD + DET)

---

## Fase 1 — Auth + Tenancy + RBAC

**Objetivo:** usuários, tenants, roles, isolamento.

### Entregáveis
- Register/login/logout (`REQ-AUTH-01/02`)
- Tenant + Membership (`REQ-TEN-01..03`)
- Policies de autorização
- SaaS admin: listar/ativar/suspender (`REQ-TEN-05`)
- Telas React: login, shell do painel, switch de contexto tenant

### DoD
- [ ] Dois tenants não compartilham dados em teste manual  
- [ ] Roles bloqueiam rotas indevidas  
- [ ] OpenAPI atualizado  

### Checkpoint S4 (parcial)
Auth + tenant + (idealmente início do CRUD imóvel na Fase 2).

---

## Fase 2 — Imóveis + Busca

**Objetivo:** carteira e busca pública.

### Entregáveis
- CRUD Property + media (`REQ-PROP-*`)
- Publish/unpublish
- `GET /public/properties` com filtros (`REQ-SRC-01/02`)
- React: listagem, formulário, upload
- Seed parcial aceitável (1–2 tenants) para desenvolvimento  
- Estrutura `Persistence/Seed/DemoSeed.cs` (esqueleto)

### DoD
- [ ] Broker publica imóvel visível na API pública  
- [ ] Filtros cidade/bairro/preço/quartos/operação  
- [ ] Tenant suspenso não aparece no público  

### Checkpoint S4 / início S8
CRUD imóvel + busca API.

---

## Fase 3 — Visitas + Buffer

**Objetivo:** agenda confiável.

### Entregáveis
- TenantSettings / BrokerSettings  
- Visit + CalendarBlock  
- `visit-slots` + `POST /public/visits`  
- Confirmar/recusar/cancelar  
- React: agenda semanal/diária  
- Testes unitários do algoritmo de buffer  

### DoD
- [ ] Buffer 60 min evidenciado  
- [ ] Override tenant e corretor  
- [ ] Conflito rejeitado pela API  
- [ ] Timezone SP  

### Checkpoint S12 (parcial)
Visitas + buffer OK (WhatsApp na 3b).

---

## Fase 3b — WhatsApp (Evolution API)

**Objetivo:** canal operacional de visitas via WhatsApp.

### Entregáveis
- Campos WhatsApp em TenantSettings / BrokerSettings (`REQ-WA-01..04`)  
- `IEvolutionWhatsAppClient` + config `Evolution:*`  
- Fila Redis + `WhatsAppOutboundWorker` (`REQ-INF-02`)  
- Lock Redis na criação/confirmação de visita (`REQ-INF-03`)  
- Idempotência de webhook no Redis (`REQ-INF-05`)  
- Envio na criação da visita + log (`REQ-VIS-14`, `REQ-WA-05/07`)  
- Webhook inbound + parse SIM/NAO (`REQ-VIS-15`, `REQ-WA-06/08`)  
- Notificação ao visitante no confirm/reject (`REQ-VIS-16`)  
- React: tela configurações WhatsApp + teste de envio (`REQ-WA-09`)  
- Fake/mock Evolution para testes  

### DoD
- [ ] Número configurável no painel (tenant e corretor)  
- [ ] Solicitação de visita enfileira e dispara WhatsApp ao corretor (quando ativo)  
- [ ] `SIM {codigo}` / `NAO {codigo}` alteram status corretamente  
- [ ] Remetente não autorizado é ignorado  
- [ ] Webhook duplicado não processa 2x  
- [ ] Falha Evolution não impede criar visita (retry na fila)  
- [ ] Visitante recebe retorno se tiver telefone  

### Checkpoint S12
Visitas + buffer + WhatsApp OK.

---

## Fase 4 — Temas + Vitrine

**Objetivo:** 3 layouts oficiais navegáveis.

### Entregáveis
- Temas `moderno`, `urbano`, `classico`, `minimal`, `porto` com 4 páginas cada  
- Engine de placeholders  
- Resolução por slug de tenant (`/t/{slug}/`)  
- Seleção de tema no painel (`REQ-SRC-03/04`)  
- **Seed completo 5 tenants × 5 temas** ([06-seed-demo-tenants.md](06-seed-demo-tenants.md)) — `REQ-SEED-*`  
- JS da vitrine chama slots/visita  

### DoD
- [ ] Cada tema: home, listing, property, schedule  
- [ ] Fluxo visitante completo sem usar o React  
- [ ] Seed cria 5 tenants com ThemeKey distintos e ≥ 3 imóveis cada  
- [ ] Demo: abrir 5 vitrines + trocar tema do `horizon` e ver layout mudar  

### Checkpoint S8 (1 tema) → S14 (5 temas + seed)

---

## Fase 5 — Polish + Aceite

**Objetivo:** GO no Plano de Aceite.

### Entregáveis
- Execução completa de [05-plano-aceite.md](05-plano-aceite.md)  
- Correção de bloqueadores  
- README de execução local  
- Demo script (J1→J2→J3 painel + J3 via WhatsApp)  
- Atualização handoff + checkpoint S14–16  

### DoD
- [ ] Ata de aceite GO ou GO com ressalvas documentadas  
- [ ] Nenhum bloqueador P0 aberto  
- [ ] `CURRENT.md` = Fase 5 concluída  

---

## Backlog pós-MVP (não bloqueia rinha)

| Item | Fase sugerida |
|------|----------------|
| Convite broker por e-mail | P1 |
| AvailabilityRule completa | P1 |
| E-mail de visita | P1 |
| Chat WhatsApp livre (fora do fluxo de visita) | P2 |
| Tema custom + aprovação | P2 |
| Static generation | P2 |
| MAUI | P2 |
| Billing | P2 |

---

## Controle de evolução

Ao concluir cada fase:
1. Atualizar [handoff/CURRENT.md](handoff/CURRENT.md)  
2. Entrada em [handoff/CHANGELOG-DEV.md](handoff/CHANGELOG-DEV.md)  
3. Marcar checkpoint em [handoff/checkpoints/](handoff/checkpoints/)  
4. Rodar casos de aceite relacionados (`AC-*`)
