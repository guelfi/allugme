# Estado atual — Allugme

**Última atualização:** 2026-08-06  
**Auditoria docs×código:** 2026-08-06 (ver seção abaixo)  
**Fase:** MVP operacional (0→5) + polish de LP/cadastro/dashboard; aceite formal e Evolution real pendentes  
**Repo GitHub:** https://github.com/guelfi/allugme  
**Progresso estimado MVP:** ~90% (código + CI/CD + DNS/TLS + trial/Pix estático + UX painel; falta aceite formal e WhatsApp real)

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

SSH OCI: `ssh -i /home/guelfi/Projetos/oci-key-2026-07-29 ubuntu@129.153.86.168`  
Path no servidor: `/var/www/allugme`

---

## Status por fase

| Fase | Status |
|------|--------|
| 0 Foundation | ✅ Solution .NET 10, Vite React, Docker, health, Redis |
| 1 Auth + Tenancy + RBAC | ✅ JWT, tenants, memberships, shells por papel |
| 2 Imóveis + Busca | ✅ CRUD + public search + mídia (até 13 fotos + 1 vídeo) |
| 3 Visitas + Buffer | ✅ Slots + buffer + agenda |
| 3b WhatsApp (Evolution) | ✅ Cliente + fila Redis + webhook + **fake mode** (real pendente); débitos UI abaixo |
| 4 Temas + Vitrine | ✅ 5 temas + seed 5 tenants + `/{slug}/` |
| 5 Polish + Aceite | 🔄 LP/cadastro/dashboard avançados; **aceite formal** ainda não executado |

---

## Entregas recentes (após 2026-08-04)

- **E-mail / LGPD / portal (fases 0–6):** Resend + templates; reset senha; convite corretor; e-mails de visita; horário de funcionamento; consentimentos LGPD; portal do cliente (`/portal`).
- Landing page: marca unificada (logo SVG), favicon, Contato/Layouts/Planos, CTA “7 dias grátis”, chip “Ver modelo” clicável, vídeo de fundo no cadastro.
- Cadastro B2B em etapas (dados → plano → confirmação): WhatsApp obrigatório com máscara, Pix estático (QR + copia e cola), e-mail com dados do plano.
- **Trial 7 dias:** status `Trial` + `TrialEndsAt`; auto-login após cadastro; banner no dashboard com dias restantes e opção de pagar via Pix; expiração → `PendingPayment` no login.
- Dashboard SaaS admin: mobile-first, totais reais, detalhe de tenant (abas imobiliária/corretores + visitas); leitura de conteúdo + ações operacionais (ativar/suspender/plano/assentos).
- Dashboard imobiliária/corretor: sidebar retrátil com ícones, topbar com `Nome - Perfil`, Equipe com grid clicável e aviso de foto obrigatória, PropertyForm/Visitas com abas (menos scroll no desktop), padrão de título `Título - subtítulo`.
- Credenciais de seed: só em `docs/usuarios-teste.local.md` (`.gitignore`); docs versionados não trazem senhas.

---

## Credenciais seed

Ver **`docs/usuarios-teste.local.md`** (arquivo local, fora do Git — não versionar/commitar).

Slugs: `horizon`, `vista-urbana`, `casa-tradicao`, `atlas`, `porto-lar`

---

## Auditoria docs × código (2026-08-06)

Cruzamento de `CURRENT`, aceite, PRD/P1 e `04-fases` com controllers, workers e páginas React.

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

### Realmente pendente (código ausente ou só operacional)

| Item | Situação |
|------|----------|
| Aceite formal | Todos `AC-*` em `05-plano-aceite.md` ainda `PENDENTE` (execução, não código) |
| Evolution API real | `Evolution:Enabled = false` → Fake client por default |
| Spec UX painel por perfil | Combinado na sessão; sem spec formal |
| Gateway Pix + conciliação automática | Pix estático; ativação manual pelo SaaS |
| Recuperação de senha | Sem endpoints/UI |
| Convite corretor por e-mail | Create no painel com senha; sem e-mail de convite |
| AvailabilityRule / horário comercial | Janela fixa 09–18 dias úteis |
| E-mail de notificação de visita | SMTP só no cadastro; visita usa WA |
| LGPD checkbox no cadastro | LP tem privacidade/cookies; Register sem aceite obrigatório |
| Cache Redis busca/slots + rate limit | Não implementados (só lock/fila/idempotência) |
| Billing automático pós-Pix | Não implementado |

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

## Pendências imediatas

1. Executar [05-plano-aceite.md](../05-plano-aceite.md) e registrar evidências.
2. Corrigir débitos WhatsApp na UI (`EvolutionInstanceName` + payload `ToE164`) e ligar **Evolution API real**.
3. Descrever e implementar UX/funcionalidades do painel ao logar como:
   - Administrador de imobiliária  
   - Corretor afiliado  
   - Corretor independente  
4. Avaliar gateway Pix real (hoje: chave estática / QR + copia e cola; sem conciliação automática).
5. Manter renovação Let's Encrypt (`renew-allugme-cert.sh` na OCI).
6. Pacote aprovado: e-mail / LGPD / horário / portal do cliente — ver [plano-email-lgpd-portal-cliente.md](plano-email-lgpd-portal-cliente.md) (Fase 0 SMTP ✅; próximo: template HTML + Fase 1 recuperação de senha).

## Blockers ativos

_Nenhum._ Aceite formal, Evolution real e spec do painel por perfil são próximos passos operacionais/produto.

---

## Roadmap — features futuras

Sugestão priorizada a partir de [escopo-mvp.md](../escopo-mvp.md), [02-prd.md](../02-prd.md) e [04-plano-implementacao-fases.md](../04-plano-implementacao-fases.md).  
**Validado em 2026-08-06:** nenhum item P1 abaixo já está implementado de ponta a ponta.

### P1 — próximo ciclo (pós-aceite / pós-Evolution real)

| Feature | Origem | Notas |
|---------|--------|-------|
| Recuperação de senha | REQ-AUTH-03 | Sem forgot/reset no código |
| Convite de corretor por e-mail | REQ-TEN-04 | Hoje o admin cria corretor no painel |
| Horário comercial / AvailabilityRule | REQ-VIS-11 | MVP usa janela fixa 09–18 dias úteis |
| Notificação de visita por e-mail | REQ-VIS-13 | Complementa WhatsApp |
| LGPD no cadastro (checkbox aceite) | REQ-NFR-04 | LP estática existe; falta aceite no Register |
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
5. Pacote P1 (senha, convite, horário comercial, e-mail, LGPD, cache/rate limit)  
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
| Changelog | ✅ [CHANGELOG-DEV.md](CHANGELOG-DEV.md) |
