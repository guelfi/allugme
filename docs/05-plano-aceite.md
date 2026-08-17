# Plano de Aceite — Allugme

**Versão:** 1.3
**Data:** 2026-08-10
**Stack:** ASP.NET Core 10 + React  
**Objetivo:** Validar o MVP antes de considerar a ferramenta entregue (GO / NO-GO).  
**Inclui:** WhatsApp via Evolution API + Redis (fila, locks, idempotência).

---

## 0. Estratégia de execução — rodada MVP

### Princípios

1. Fixar um único commit/tag e não promover código durante uma onda de testes.
2. Executar primeiro os Blockers; qualquer `FAIL` interrompe a promoção para P0/P1.
3. Usar tenants, usuários e imóveis diferentes dos utilizados pelo implementador no desenvolvimento diário.
4. Registrar request/response, screenshot e correlação de logs para todo Blocker.
5. Repetir a onda completa afetada depois de uma correção; não validar apenas o caso que falhou.

### Preparação — responsável: Implementador

- [ ] Fixar commit/tag, URLs e data na seção 2.
- [ ] Subir Postgres e Redis limpos e registrar health checks.
- [ ] Executar o seed duas vezes e guardar contagens antes/depois.
- [ ] Separar credenciais de Tenant A, Tenant B, dois brokers do mesmo tenant e SaaS admin.
- [ ] Configurar Evolution real, webhook secreto, número do corretor e um número não autorizado.
- [ ] Criar `docs/handoff/checkpoints/aceite-YYYYMMDD/` a partir do README/template.
- [ ] Habilitar logs necessários sem registrar senha, JWT completo, apikey ou dados pessoais além do mínimo.

### Ondas de execução

As ondas 1→5 formam a **Porta de Blockers**. Nenhum caso P0 ou P1 pode ser iniciado enquanto houver Blocker `PENDENTE` ou `FAIL`.

| Ordem | Onda | Casos mínimos | Critério para avançar |
|------:|------|---------------|-----------------------|
| 1 | Baseline, Auth e Segurança | `AC-AUTH-01`, `AC-SEC-01`, `AC-SEC-03`, `AC-SEC-04` | Cadastro/login, upload, hash de senha e bundle seguro = PASS |
| 2 | Tenancy e RBAC | `AC-RBAC-01`, `AC-RBAC-02`, `AC-TEN-01`, `AC-TEN-02`, `AC-TEN-03`, `AC-SEC-02` | Todos PASS; nenhuma resposta contém dados do outro tenant |
| 3 | Publicação e vitrine | `AC-PROP-01`, `AC-PROP-03`, `AC-SRC-01`, `AC-SRC-02`, `AC-SRC-03`, `AC-SRC-04`, `AC-SEED-01` | Imóvel só aparece publicado e tenant ativo |
| 4 | Visitas e concorrência | `AC-VIS-01`, `AC-VIS-02`, `AC-VIS-03`, `AC-VIS-04`, `AC-VIS-06`, `AC-VIS-09`, `AC-INF-01`, `AC-INF-03` | Slots/buffer corretos e exatamente um POST concorrente bem-sucedido |
| 5 | WhatsApp real e webhook | `AC-WA-01`, `AC-WA-03`, `AC-WA-04`, `AC-WA-05`, `AC-WA-06`, `AC-SEC-05` | Envio real, confirmação/recusa, autorização e secret PASS |
| **Gate** | **Porta de Blockers** | **Todos os casos Blocker da matriz** | **Todos em PASS; zero PENDENTE/FAIL** |
| 6 | P0 e regressão crítica | Todos os casos P0 restantes | Nenhum P0 aberto |
| 7 | P1: e-mail, LGPD, portal e demais | Todos os casos P1 restantes | PASS ou até 3 ressalvas com responsável e prazo |

### Automação-alvo

| Área | Camada | Automação mínima |
|------|--------|------------------|
| Tenancy/RBAC | Integração API + PostgreSQL | Tokens A/B; list/get/update cruzados; suspensão e catálogo público |
| Publicação | Integração API | Draft → upload válido → publish → busca/detalhe → unpublish |
| Visitas | Unitário + integração API/Redis | disponibilidade/buffer; bloqueio; dois POSTs simultâneos |
| WhatsApp | Unitário + integração fake + aceite real | parser; remetente; idempotência; fail-soft; smoke real Evolution |

O smoke real de Evolution permanece manual/operacional: um mock não comprova entrega no WhatsApp nem configuração externa.

---

## 0.1 Resultado vigente — baseline de 2026-08-14

**Commit implantado:** `dc6025233f9184f9ae216acb13d97a6b926d1ef5`

**Branch:** `main`

**Origem:** merge da PR #6 (`feat/client-journey-broker-testing`)

**Resultado:** **GO técnico com ressalvas operacionais**

### Evidências consolidadas

| Verificação | Resultado |
|---|---|
| Containers locais após rebuild | PASS |
| Backend unitário | PASS — 38/38 |
| Backend integração | PASS — 2/2 |
| Frontend lint/Vitest/build | PASS — lint, 2/2 e build |
| Playwright desktop/mobile | PASS — 3/3 + 3/3 |
| Isolamento de tenant amostrado por API | PASS — leitura e atualização cruzadas retornaram 404 |
| Concorrência de visitas | PASS — segunda solicitação no mesmo horário retornou 409 |
| Upload real pelo proxy | PASS — JPEG de 2,30 MiB persistido e servido com HTTP 200 |
| E-mail transacional real | PASS — recuperação entregue pelo Resend |
| GitHub Actions da PR #6 | PASS |
| Merge em `main` e deploy OCI | PASS |

### Ressalvas aceitas sem bloqueio desta baseline

- Evolution API/WhatsApp com instância e números reais.
- Captura de selfie usando câmera física de celular e desktop.

Os campos `Status` da matriz abaixo permanecem como checklist granular para futuras rodadas formais. O resultado consolidado desta baseline está nesta seção e no [relatório de testes](test-results/CLAUDE-COWORK-TEST-RESULT.md); não se deve interpretar um `PENDENTE` granular como regressão automática da baseline já aprovada quando o caso estiver fora da amostragem ou da ressalva acordada.

---

## 1. Papéis

| Papel | Responsabilidade |
|-------|------------------|
| **Implementador** | Prepara ambiente, seed, corrige defeitos |
| **Avaliador** | Executa casos AC-*; registra evidências |
| **Avaliador cruzado (opcional)** | Terceiro (ex.: Oscar) valida fluxo sem conhecer a stack |

## 2. Ambiente de aceite

| Item | Valor (preencher no dia) |
|------|--------------------------|
| URL API | `_` |
| URL Dashboard | `_` |
| URL Vitrine (base) | `_` — ex. `/loja/{slug}/` |
| Commit / tag | `_` |
| Data da rodada | `_` |

### Seed mínimo (ver [06-seed-demo-tenants.md](06-seed-demo-tenants.md))
- 1 `saas_admin`
- **5 tenants ativos**, um por tema: `horizon`→moderno, `vista-urbana`→urbano, `casa-tradicao`→classico, `atlas`→minimal, `porto-lar`→porto
- 1 tenant suspenso (`suspenso-demo`) — recomendado
- ≥ 3 imóveis publicados (sale e rent) **em cada** tenant ativo
- Usuários agency_admin + brokers (ou independent em `atlas`)

---

## 3. Critérios GO / NO-GO

### GO
- Todos os casos **Blocker** = PASS  
- Nenhum defeito P0 aberto  
- Fluxo J1→J2→J3 demonstrado com evidência  

### GO com ressalvas
- Blockers PASS  
- Até 3 defeitos P1 documentados com prazo  

### NO-GO
- Qualquer Blocker FAIL  
- Furo de isolamento tenant  
- Double-booking reproduzível  
- WhatsApp: impossível notificar e confirmar visita com config válida  
- Menos de 5 temas com páginas mínimas  

---

## 4. Severidade

| Nível | Significado |
|-------|-------------|
| **Blocker** | Impede GO |
| **P0** | Função MVP quebrada |
| **P1** | Importante, workaround possível |
| **P2** | Cosmético / nice-to-have |

---

## 5. Matriz de casos de aceite

Legenda status: `PENDENTE` · `PASS` · `FAIL` · `N/A`

### 5.1 Auth e RBAC

| ID | REQ | Pré-condição | Passos | Esperado | Sev. | Status |
|----|-----|--------------|--------|----------|------|--------|
| AC-AUTH-01 | REQ-AUTH-01 | Ambiente limpo | Registrar usuário e logar | Sessão válida; acesso ao painel | Blocker | PENDENTE |
| AC-AUTH-02 | REQ-AUTH-02 | Usuário logado | Logout | Token/sessão invalidada; rotas protegidas 401 | P0 | PENDENTE |
| AC-RBAC-01 | REQ-TEN-03 | Broker logado | Acessar endpoint saas admin | 403 | Blocker | PENDENTE |
| AC-RBAC-02 | REQ-PROP-06 | 2 brokers no tenant | Broker1 edita imóvel do Broker2 | 403 | Blocker | PENDENTE |
| AC-RBAC-03 | REQ-PROP-06 | Agency admin | Admin edita imóvel de qualquer broker | 200 OK | P0 | PENDENTE |

### 5.2 Tenancy

| ID | REQ | Pré-condição | Passos | Esperado | Sev. | Status |
|----|-----|--------------|--------|----------|------|--------|
| AC-TEN-01 | REQ-TEN-02 | Tenants A e B | Broker A lista properties | Só imóveis de A | Blocker | PENDENTE |
| AC-TEN-02 | REQ-TEN-02 | ID de imóvel de B | Broker A GET/PUT imóvel B | 404 ou 403 | Blocker | PENDENTE |
| AC-TEN-03 | REQ-TEN-05 | SaaS admin | Suspender tenant A | Imóveis A somem da busca pública | Blocker | PENDENTE |

### 5.3 Imóveis

| ID | REQ | Pré-condição | Passos | Esperado | Sev. | Status |
|----|-----|--------------|--------|----------|------|--------|
| AC-PROP-01 | REQ-PROP-01 | Broker | Criar imóvel rent com campos obrigatórios | Persistido Draft | Blocker | PENDENTE |
| AC-PROP-02 | REQ-PROP-03 | Imóvel criado | Upload 2 fotos | Fotos listáveis no detalhe | P0 | PENDENTE |
| AC-PROP-03 | REQ-PROP-04 | Draft completo | Publicar | Status Published; visível no público | Blocker | PENDENTE |
| AC-PROP-04 | REQ-PROP-01 | — | Criar imóvel sale | Operação sale na busca | P0 | PENDENTE |

### 5.4 Busca e vitrine

| ID | REQ | Pré-condição | Passos | Esperado | Sev. | Status |
|----|-----|--------------|--------|----------|------|--------|
| AC-SRC-01 | REQ-SRC-01 | Dados seed | Filtrar cidade + preço | Resultados coerentes | Blocker | PENDENTE |
| AC-SRC-02 | REQ-SRC-02 | Imóvel publicado | Abrir detalhe na vitrine | Dados e fotos corretos | Blocker | PENDENTE |
| AC-SRC-03 | REQ-SRC-03 | 5 temas + seed | Abrir `/loja/{slug}/` dos 5 tenants seed | Cada slug com layout visual distinto | Blocker | PENDENTE |
| AC-SRC-04 | REQ-SRC-04 | admin@horizon | Trocar tema moderno→porto e recarregar vitrine | Mesmos imóveis, layout Porto | Blocker | PENDENTE |
| AC-SEED-01 | REQ-SEED-01 | DB limpa / idempotente | Executar seed | 5 tenants ativos com ThemeKey correto | Blocker | PENDENTE |
| AC-SEED-02 | REQ-SEED-02 | Seed ok | Contar imóveis publicados por tenant | ≥ 3 em cada um dos 5 | P0 | PENDENTE |
| AC-SEED-03 | REQ-SEED-03 | Seed já aplicado | Reexecutar seed | Sem duplicar slug/e-mail | P0 | PENDENTE |

### 5.5 Visitas e buffer

| ID | REQ | Pré-condição | Passos | Esperado | Sev. | Status |
|----|-----|--------------|--------|----------|------|--------|
| AC-VIS-01 | REQ-VIS-01/07 | Imóvel publicado | GET slots para data útil | Lista de horários | Blocker | PENDENTE |
| AC-VIS-02 | REQ-VIS-01/02 | Slot livre | POST visita com contato | Status pending; aparece na agenda | Blocker | PENDENTE |
| AC-VIS-03 | REQ-VIS-05/08 | Visita 14:00–15:00 buffer 60 | Pedir slot 15:00 | Rejeitado / não listado | Blocker | PENDENTE |
| AC-VIS-04 | REQ-VIS-05/08 | Mesmo cenário | Pedir slot 16:00 | Aceito | Blocker | PENDENTE |
| AC-VIS-05 | REQ-VIS-06 | Tenant buffer 60; broker 90 | Criar visita | Buffer aplicado 90; slots respeitam 90 | P0 | PENDENTE |
| AC-VIS-06 | REQ-VIS-09 | Visita pending | Corretor confirma | Status confirmed | Blocker | PENDENTE |
| AC-VIS-07 | REQ-VIS-09 | Visita pending | Corretor recusa | Status rejected; slot libera | P0 | PENDENTE |
| AC-VIS-08 | REQ-VIS-10 | Broker | Criar bloqueio 10:00–12:00 | Slots no intervalo ausentes | P0 | PENDENTE |
| AC-VIS-09 | REQ-VIS-08 | Dois POSTs simultâneos mesmo slot | Concorrência | Apenas um sucesso | Blocker | PENDENTE |
| AC-VIS-10 | REQ-VIS-12 | — | Criar visita perto de meia-noite | Horários corretos em America/Sao_Paulo | P1 | PENDENTE |

### 5.6 WhatsApp / Evolution API

| ID | REQ | Pré-condição | Passos | Esperado | Sev. | Status |
|----|-----|--------------|--------|----------|------|--------|
| AC-WA-01 | REQ-WA-01/03 | Agency admin | Configurar E.164 + ativar notify | Settings salvos | Blocker | PENDENTE |
| AC-WA-02 | REQ-WA-09 | Config salva | Enviar mensagem de teste | Mensagem chega no WhatsApp | P0 | PENDENTE |
| AC-WA-03 | REQ-VIS-14 | Notify on; broker com WA | Visitante solicita visita | Corretor recebe WA com código | Blocker | PENDENTE |
| AC-WA-04 | REQ-VIS-15 | Visita pending + WA enviado | Corretor responde `SIM {codigo}` | Status confirmed; ConfirmedVia WhatsApp | Blocker | PENDENTE |
| AC-WA-05 | REQ-VIS-15 | Visita pending | Corretor responde `NAO {codigo}` | Status rejected; slot libera | Blocker | PENDENTE |
| AC-WA-06 | REQ-WA-08 | Visita pending | Número estranho envia `SIM {codigo}` | Status permanece pending | Blocker | PENDENTE |
| AC-WA-07 | REQ-WA-05 | Evolution down / mock fail | Solicitar visita | Visita criada; falha só no log | P0 | PENDENTE |
| AC-WA-08 | REQ-WA-04 | Broker e tenant com WA distintos | Solicitar visita | Destino = WA do corretor responsável | P0 | PENDENTE |
| AC-WA-09 | REQ-VIS-16 | VisitorPhone preenchido | Confirmar via WA | Visitante recebe WA de confirmação | P0 | PENDENTE |
| AC-WA-10 | REQ-WA-01 | Sem WA configurado | Solicitar visita | Fluxo painel/vitrine OK; sem envio | P0 | PENDENTE |

### 5.6b Redis / infraestrutura

| ID | REQ | Pré-condição | Passos | Esperado | Sev. | Status |
|----|-----|--------------|--------|----------|------|--------|
| AC-INF-01 | REQ-INF-01 | Compose no ar | Health/ping Redis | Redis disponível | Blocker | PENDENTE |
| AC-INF-02 | REQ-INF-02 | Notify on | Criar visita | Job na fila; WA enviado pelo worker | P0 | PENDENTE |
| AC-INF-03 | REQ-INF-03 | Dois POSTs mesmo slot | Concorrência | Apenas um sucesso (lock+DB) | Blocker | PENDENTE |
| AC-INF-04 | REQ-INF-05 | Reenviar mesmo webhook | Duplicar event id | Segunda chamada não altera status de novo | P0 | PENDENTE |

### 5.7 E-mail transacional

| ID | REQ | Pré-condição | Passos | Esperado | Sev. | Status |
|----|-----|--------------|--------|----------|------|--------|
| AC-EMAIL-01 | REQ-AUTH-03, REQ-EMAIL-02 | Usuário ativo + SMTP de teste | Solicitar reset, abrir link e definir nova senha | Token funciona uma vez; senha nova autentica e antiga não | P1 | PENDENTE |
| AC-EMAIL-02 | REQ-TEN-04, REQ-EMAIL-02 | Agency admin + SMTP de teste | Convidar broker e aceitar convite | E-mail recebido; membership passa de Invited para Active | P1 | PENDENTE |
| AC-EMAIL-03 | REQ-VIS-13, REQ-EMAIL-03 | Notificação e-mail ativa | Visitante cria visita | Corretor responsável recebe e-mail com dados da visita | P1 | PENDENTE |
| AC-EMAIL-04 | REQ-VIS-13, REQ-EMAIL-03 | Visita pending com e-mail | Confirmar e depois repetir cenário com recusa | Visitante recebe o template correspondente a cada resultado | P1 | PENDENTE |
| AC-EMAIL-05 | REQ-EMAIL-03 | SMTP indisponível | Criar e confirmar/recusar visita | Operação principal conclui; falha de e-mail fica registrada (fail-soft) | P1 | PENDENTE |
| AC-EMAIL-06 | REQ-EMAIL-01 | Templates tenant/tema/plataforma preparados em cenários separados | Disparar o mesmo tipo de e-mail removendo a camada mais específica a cada rodada | Renderer usa tenant; sem tenant usa tema; sem ambos usa `_platform` | P1 | PENDENTE |

### 5.8 LGPD e privacidade

| ID | REQ | Pré-condição | Passos | Esperado | Sev. | Status |
|----|-----|--------------|--------|----------|------|--------|
| AC-LGPD-01 | REQ-LGPD-01, REQ-NFR-04 | Cadastro B2B | Enviar sem aceite e depois com aceite | Sem aceite é rejeitado; com aceite cria `ConsentRecord` versionado | P1 | PENDENTE |
| AC-LGPD-02 | REQ-LGPD-01 | Cadastro de cliente | Enviar sem aceite e depois com aceite | Sem aceite é rejeitado; com aceite registra versão, data, IP e user-agent | P1 | PENDENTE |
| AC-LGPD-03 | REQ-LGPD-01 | Solicitação pública de visita | Enviar sem aceite e depois com aceite | Sem aceite é rejeitada; com aceite registra consentimento ligado ao fluxo | P1 | PENDENTE |
| AC-LGPD-04 | REQ-LGPD-02 | Aplicação pública | Abrir política e preferências/banner de cookies | Conteúdo acessível; escolha do usuário é respeitada no navegador | P1 | PENDENTE |

### 5.9 Portal do cliente

| ID | REQ | Pré-condição | Passos | Esperado | Sev. | Status |
|----|-----|--------------|--------|----------|------|--------|
| AC-PORTAL-01 | REQ-PORTAL-01 | Cliente cadastrado | Login e acesso a `/portal`; tentar rota B2B | Shell do cliente abre; rota B2B é negada | P1 | PENDENTE |
| AC-PORTAL-02 | REQ-PORTAL-02 | Cliente logado + imóvel publicado | Favoritar, recarregar e desfavoritar | Estado persiste e depois é removido; outro cliente não vê o favorito | P1 | PENDENTE |
| AC-PORTAL-03 | REQ-PORTAL-03 | Visita com mesmo e-mail do cliente | Abrir Minhas visitas/reivindicar | Visita compatível aparece e fica vinculada ao cliente | P1 | PENDENTE |
| AC-PORTAL-04 | REQ-PORTAL-03 | Visitas com e-mails diferentes | Tentar consultar/reivindicar visita de terceiro | Visita não é exposta nem vinculada | P1 | PENDENTE |

### 5.10 Jornada do cliente e isolamento do CRM

| ID | REQ | Pré-condição | Passos | Esperado | Sev. | Status |
|----|-----|--------------|--------|----------|------|--------|
| AC-CLIENT-01 | REQ-PORTAL-04 | Cliente recém-cadastrado | Tentar reivindicar visita antes/depois da confirmação | Bloqueado antes; vinculado depois | Blocker | PENDENTE |
| AC-CLIENT-02 | REQ-PORTAL-05 | Visita confirmada futura | Cancelar com mais e menos de 2h | Cancela no prazo; orienta contato fora do prazo | P1 | PENDENTE |
| AC-CLIENT-03 | REQ-PORTAL-05 | Visita concluída | Avaliar duas vezes | Primeira aceita; duplicada rejeitada | P1 | PENDENTE |
| AC-CLIENT-04 | REQ-VIS-17 | Visita confirmada | Processar janelas 24h e 2h | Um lembrete por janela, sem duplicação | P1 | PENDENTE |
| AC-CLIENT-05 | REQ-PORTAL-05 | Visita futura e horários disponíveis | Reagendar e tentar escolher horário ocupado/bloqueado | Horário válido volta a `Pending`; conflitos e bloqueios são rejeitados | P1 | PENDENTE |
| AC-CRM-01 | REQ-CRM-01 | Dois tenants e cliente relacionado só ao A | Listar clientes como admin A e B | A vê; B não vê | Blocker | PENDENTE |
| AC-CRM-02 | REQ-CRM-02 | Dois corretores no tenant | Listar como cada corretor | Cada um vê somente suas próprias relações | Blocker | PENDENTE |
| AC-CRM-03 | REQ-CRM-01 | SaaS admin | Listar clientes | Vê todas as contas cliente, somente leitura | Blocker | PENDENTE |
| AC-BROKER-01 | REQ-TEN-04 | Agency admin e novo corretor | Pré-cadastrar, abrir convite e definir senha | Agência não define senha; convidado ativa a própria conta e aceita os termos | Blocker | PENDENTE |
| AC-BROKER-02 | REQ-TEN-04 | Corretor afiliado ativo | Inativar, tentar login e reenviar convite | Login perde acesso ao tenant; histórico permanece; novo convite permite reativação | Blocker | PENDENTE |
| AC-BROKER-03 | REQ-TEN-04 | Corretor sem avatar | Efetuar logins sucessivos e capturar foto pela câmera | Aviso progressivo; após 9 logins o fluxo é obrigatório; upload conclui o gate | P1 | PENDENTE |

### 5.11 Segurança mínima

| ID | REQ | Pré-condição | Passos | Esperado | Sev. | Status |
|----|-----|--------------|--------|----------|------|--------|
| AC-SEC-01 | REQ-NFR-03 | — | Upload .exe / .php disfarçado | Rejeitado | Blocker | PENDENTE |
| AC-SEC-02 | REQ-NFR-01 | Token broker | Chamar rota admin | 403 | Blocker | PENDENTE |
| AC-SEC-03 | REQ-NFR-02 | — | Senha armazenada | Não plaintext no DB | Blocker | PENDENTE |
| AC-SEC-04 | REQ-NFR-07 | — | Inspecionar bundle React | Sem Evolution ApiKey no front | Blocker | PENDENTE |
| AC-SEC-05 | REQ-NFR-08 | — | Webhook sem secret | 401/403 | Blocker | PENDENTE |

---

## 6. Checklist rápido pré-demo

- [ ] Seed carregado (5 tenants × temas)  
- [ ] Credenciais e URLs `/loja/{slug}/` documentadas  
- [ ] Demo troca de layout (horizon: moderno ↔ porto) ensaiada  
- [ ] Postgres + Redis no ar  
- [ ] Evolution conectada (ou mock documentado para aceite)  
- [ ] Número WhatsApp de teste do corretor  
- [ ] Cinco temas navegáveis  
- [ ] Script demo J1→J2→J3 painel + confirmação WhatsApp (8–12 min)  
- [ ] Logs acessíveis para investigar FAIL  
- [ ] SMTP de teste e caixa de entrada acessíveis
- [ ] Conta cliente e segundo cliente preparados para isolamento do portal
- [ ] Versão vigente dos termos/política registrada para conferir `ConsentRecord`

---

## 7. Registro de evidências

Para cada FAIL/Blocker, anexar:
- ID do caso  
- Screenshot ou log  
- Passos para reproduzir  
- Severidade  
- Status correção  

Pasta sugerida: `docs/handoff/checkpoints/aceite-YYYYMMDD/`

---

## 8. Ata de aceite (template)

```
ATA DE ACEITE — Allugme MVP
Data: _______________
Build/Tag: _______________
Avaliador: _______________
Implementador: _______________

Resultado: ( ) GO  ( ) GO com ressalvas  ( ) NO-GO

Blockers abertos: _______________
Ressalvas P1 (prazo): _______________

Assinaturas:
Avaliador: _______________
Implementador: _______________
```

---

## 9. Rastreabilidade

| Grupo AC | REQs |
|----------|------|
| AC-AUTH-* | REQ-AUTH-* |
| AC-RBAC-* | REQ-TEN-03, REQ-PROP-06 |
| AC-TEN-* | REQ-TEN-02, REQ-TEN-05 |
| AC-PROP-* | REQ-PROP-* |
| AC-SRC-* | REQ-SRC-* |
| AC-SEED-* | REQ-SEED-* |
| AC-VIS-* | REQ-VIS-* |
| AC-WA-* | REQ-WA-*, REQ-VIS-14..16 |
| AC-INF-* | REQ-INF-* |
| AC-EMAIL-* | REQ-EMAIL-*, REQ-AUTH-03, REQ-TEN-04, REQ-VIS-13 |
| AC-LGPD-* | REQ-LGPD-*, REQ-NFR-04 |
| AC-PORTAL-* | REQ-PORTAL-* |
| AC-SEC-* | REQ-NFR-* |
