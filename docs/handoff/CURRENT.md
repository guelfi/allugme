# Estado atual — Allugme

**Última atualização:** 2026-08-07  
**Auditoria docs×código:** 2026-08-06 (parcialmente supersedida pelo pacote e-mail/LGPD/portal)  
**Fase:** MVP operacional (0→5) + pacote e-mail/LGPD/portal (0→6) + polish login/cadastro visitante; aceite formal e Evolution real pendentes  
**Repo GitHub:** https://github.com/guelfi/allugme  
**Progresso estimado MVP:** ~95% (código + CI/CD + DNS/TLS + trial/Pix estático + portal cliente + e-mail; falta aceite formal, WhatsApp real e billing automático)

---

## URLs

| Ambiente | URL |
|----------|-----|
| Local | http://192.168.15.119/allugme |
| Local Swagger | http://192.168.15.119/allugme/swagger/index.html |
| OCI (IP) | http://129.153.86.168/allugme |
| Produção | https://allugme.com.br/allugme |
| Produção Swagger | https://allugme.com.br/allugme/swagger/index.html |
| Vitrine tenant | https://www.allugme.com.br/{slug}/ |
| Portal cliente | https://www.allugme.com.br/allugme/portal |
| Cadastro visitante | https://www.allugme.com.br/allugme/portal/register |

SSH OCI: `ssh -i /home/guelfi/Projetos/oci-key-2026-07-29 ubuntu@129.153.86.168`  
Path no servidor: `/var/www/allugme`

---

## Status por fase

| Fase | Status |
|------|--------|
| 0 Foundation | ✅ Solution .NET 10, Vite React, Docker, health, Redis |
| 1 Auth + Tenancy + RBAC | ✅ JWT, tenants, memberships, shells por papel (+ cliente) |
| 2 Imóveis + Busca | ✅ CRUD + public search + mídia (até 13 fotos + 1 vídeo) |
| 3 Visitas + Buffer | ✅ Slots + buffer + agenda + AvailabilityRule |
| 3b WhatsApp (Evolution) | ✅ Cliente + fila Redis + webhook + **fake mode** (real pendente); débitos UI abaixo |
| 4 Temas + Vitrine | ✅ 5 temas + seed 5 tenants + `/{slug}/` |
| 5 Polish + Aceite | 🔄 LP/cadastro/dashboard/portal avançados; **aceite formal** ainda não executado |
| E-mail / LGPD / portal | ✅ Fases 0→6 — ver [plano-email-lgpd-portal-cliente.md](plano-email-lgpd-portal-cliente.md) |

---

## Entregas recentes (2026-08-06 → 2026-08-07)

### Pacote e-mail / LGPD / horário / portal (`817dd23`)
- Resend SMTP + templates HTML (`_platform/emails`)
- Recuperação de senha (forgot/reset)
- Convite de corretor por e-mail (+ “adicionar com senha”)
- E-mails de visita (criação / confirm / reject)
- `AvailabilityRule` (horário comercial; corretor > tenant > 09–18 úteis)
- Consentimentos LGPD + página `/privacy`
- Portal do cliente: `/portal` (favoritos, visitas, claim por e-mail)

### UX login / cadastro visitante / Contato
- Login único (sem seletor Visitante/Allugme); pós-auth → `/portal` (cliente) ou `/painel` (demais) — `f2050ba`
- Cadastro visitante: grid desktop 2×2; mobile em 2 passos; WhatsApp obrigatório
- Aceite de privacidade + link abre modal flutuante; “Já tem conta” abaixo do CTA
- Contato na LP: “Falem conosco” (WA) sem expor número no bloco Contato
- Conta teste cliente (local/doc): ver `docs/usuarios-teste.local.md`

### Antes (2026-08-04 → 06)
- Landing, trial 7 dias, Pix estático, dashboards SaaS/imobiliária, sidebar retrátil, mídia 13+1, seed 5 tenants

---

## Credenciais seed

Ver **`docs/usuarios-teste.local.md`** (arquivo local, fora do Git — não versionar/commitar).

Slugs: `horizon`, `vista-urbana`, `casa-tradicao`, `atlas`, `porto-lar`

---

## Auditoria docs × código

### Confirmado implementado (não tratar como pendência de feature)

| Item | Evidência |
|------|-----------|
| Trial 7 dias | `AuthController` + `TenantStatus.Trial` + `DashboardPage` |
| Cadastro + Pix QR / copia e cola | `RegisterPage`, `PixBrCodeBuilder`, `POST .../pix/quote` |
| Avatar + gate foto no publish | `POST /brokers/me/avatar`, `PropertiesController` publish |
| Mídia 13 fotos + 1 vídeo | limites backend/front |
| Sidebar retrátil | `AppShell` rail + pin |
| Seed 5 tenants + suspenso-demo | `DemoSeed.cs` |
| Publish/unpublish, activate/suspend | API + painel |
| Buffer configurável (corretor > tenant > 60) | `SettingsController` + slots públicos |
| Fake Evolution + fila + webhook SIM/NAO | `FakeEvolutionWhatsAppClient`, `WhatsAppOutboundWorker`, `EvolutionWebhookController` |
| Redis: lock agenda + fila WA + idempotência webhook | `RedisServices.cs` |
| Recuperação de senha | forgot/reset API + UI |
| Convite corretor por e-mail | `POST /brokers/invite` + UI Equipe |
| AvailabilityRule / horário comercial | Settings + slots públicos |
| E-mail de notificação de visita | templates + workers/controllers |
| LGPD checkbox + ConsentRecord | Register B2B, portal, agendamento |
| Portal do cliente | `/portal`, favoritos, visitas |
| Login unificado | `LoginPage` → redirect por papel |

### Realmente pendente (código ausente ou só operacional)

| Item | Situação |
|------|----------|
| Aceite formal | Todos `AC-*` em `05-plano-aceite.md` ainda `PENDENTE` (execução, não código) |
| Evolution API real | `Evolution:Enabled = false` → Fake client por default |
| Spec UX painel por perfil | Combinado na sessão; sem spec formal |
| Gateway Pix + conciliação automática | Pix estático; ativação manual pelo SaaS |
| Cache Redis busca/slots + rate limit | Não implementados (só lock/fila/idempotência) |
| Billing automático pós-Pix | Não implementado |
| Performance busca P95 &lt; 1s | A medir / otimizar (dataset MVP) |

### Parcial / débitos técnicos (não confundir com “feature inexistente”)

| Item | O que falta |
|------|-------------|
| WhatsApp no painel | UI não expõe `EvolutionInstanceName`; teste WA envia `{ phone }` e DTO espera `ToE164` (`settings.ts` × `SettingsController`) |
| Admin SaaS | Conteúdo (imóveis/visitas/clientes) é leitura; **não** é 100% read-only — pode ativar/suspender e ajustar plano/assentos |
| Webhook SIM/NAO | Código pronto; runtime depende de Evolution real |

---

## E-mail (SMTP)

| Item | Status |
|------|--------|
| Envio (app) | **Resend** — `smtp.resend.com:587`, user `resend`, From `contato@allugme.com.br` |
| Domínio Resend | ✅ `allugme.com.br` verified (DKIM/SPF `send` + DMARC no Registro.br) |
| Inbox humana | Umbler `contato@` (só receber; envio Umbler bloqueado em Gmail/MSN — `554 domain blocked`) |
| Local / OCI `.env` | ✅ Resend (gitignored) |
| Smoke test Resend | ✅ enfileirado para Gmail + MSN (2026-08-06) — conferir caixa/spam |

---

## Pendências imediatas

1. Executar [05-plano-aceite.md](../05-plano-aceite.md) e registrar evidências.
2. Corrigir débitos WhatsApp na UI (`EvolutionInstanceName` + payload `ToE164`) e ligar **Evolution API real**.
3. Descrever e implementar UX/funcionalidades do painel ao logar como:
   - Administrador de imobiliária  
   - Corretor afiliado  
   - Corretor independente  
4. Avaliar gateway Pix real (hoje: chave estática / QR + copia e cola; sem conciliação automática).
5. Manter renovação Let's Encrypt (`renew-allugme-cert.sh` na OCI).

## Blockers ativos

_Nenhum._ Aceite formal, Evolution real e spec do painel por perfil são próximos passos operacionais/produto.

---

## Roadmap — features futuras

Sugestão priorizada a partir de [escopo-mvp.md](../escopo-mvp.md), [02-prd.md](../02-prd.md) e [04-plano-implementacao-fases.md](../04-plano-implementacao-fases.md).  
**Atualizado em 2026-08-07:** itens do pacote e-mail/LGPD/portal saíram do P1 (já entregues).

### P1 — próximo ciclo (pós-aceite / pós-Evolution real)

| Feature | Origem | Notas |
|---------|--------|-------|
| Cache Redis busca/slots + rate limit | REQ-INF-04/06 | Redis hoje: fila + lock + idempotência |
| Performance busca P95 &lt; 1s | REQ-NFR-06 | Dataset MVP |
| Billing / assinatura real | Escopo P1 | UI planos + Pix estático ok; falta gateway + conciliação + ativação automática |
| UX painel por perfil (imobiliária / afiliado / independente) | Sessão produto | Spec a detalhar com o usuário |
| Débitos WhatsApp UI | Auditoria | Instance name + binding do teste |

### P2 — médio prazo

| Feature | Origem | Notas |
|---------|--------|-------|
| OAuth Google/Apple | REQ-AUTH-04 | — |
| Tema custom (upload ZIP + aprovação SaaS) | REQ-SRC-05 | Pasta por tenant + review |
| Geração estática / CDN | REQ-SRC-06 | Home/listagem/imóvel; agenda continua dinâmica |
| Domínio próprio / white-label DNS | Escopo | — |
| Chat WhatsApp livre (fora do fluxo de visita) | REQ-WA-10 | — |
| Sync Google Calendar | Escopo | — |
| Distribuição automática entre corretores | Escopo | — |
| App mobile nativo (MAUI ou outro) | Escopo | — |
| Propostas, contratos, boletos, garantia locatícia | Escopo | Fora do SaaS de vitrine/agenda |

### Ordem sugerida de execução

1. Aceite formal → fechar Fase 5  
2. Débitos WA na UI + Evolution API real  
3. Spec + implementação do painel por perfil  
4. Gateway Pix / billing real  
5. Cache Redis + rate limit + performance busca  
6. Itens P2 conforme demanda comercial  

---

## Documentação

| Doc | Status |
|-----|--------|
| Pacote docs (flat) | ✅ `docs/*.md` + `handoff/` + `design/` |
| Credenciais locais | ✅ `docs/usuarios-teste.local.md` (gitignored) |
| Handoff LP layout seções | ✅ [lp-layout-secoes.md](lp-layout-secoes.md) |
| Referência busca/listagem QA | ✅ `docs/design/referencia-busca-quintoandar.md` |
| CI/CD | ✅ `.github/workflows/{ci,deploy-oci}.yml` |
| HTTPS produção | ✅ Let's Encrypt `allugme.com.br` |
| Plano de aceite | 🔄 [05-plano-aceite.md](../05-plano-aceite.md) — executar (AC-* = rodada, não ausência de código) |
| Plano de fases DoD | ✅ checkboxes alinhados ao código em [04-plano-implementacao-fases.md](../04-plano-implementacao-fases.md) |
| Plano e-mail/LGPD/portal | ✅ [plano-email-lgpd-portal-cliente.md](plano-email-lgpd-portal-cliente.md) — fases 0→6 done |
| Changelog | ✅ [CHANGELOG-DEV.md](CHANGELOG-DEV.md) |
| Sessão 2026-08-07 | ✅ [SESSION-2026-08-07.md](SESSION-2026-08-07.md) |
