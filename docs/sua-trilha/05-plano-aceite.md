# Plano de Aceite — Allugme

**Versão:** 1.2  
**Data:** 2026-08-04  
**Trilha:** A — ASP.NET Core 10 + React  
**Objetivo:** Validar o MVP antes de considerar a ferramenta entregue (GO / NO-GO).  
**Inclui:** WhatsApp via Evolution API + Redis (fila, locks, idempotência).

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
| URL Vitrine (base) | `_` — ex. `/t/{slug}/` |
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
- Menos de 5 temas com páginas mínimas (Trilha A)  

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
| AC-SRC-03 | REQ-SRC-03 | 5 temas + seed | Abrir `/t/{slug}/` dos 5 tenants seed | Cada slug com layout visual distinto | Blocker | PENDENTE |
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

### 5.7 Segurança mínima

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
- [ ] Credenciais e URLs `/t/{slug}/` documentadas  
- [ ] Demo troca de layout (horizon: moderno ↔ porto) ensaiada  
- [ ] Postgres + Redis no ar  
- [ ] Evolution conectada (ou mock documentado para aceite)  
- [ ] Número WhatsApp de teste do corretor  
- [ ] Cinco temas navegáveis  
- [ ] Script demo J1→J2→J3 painel + confirmação WhatsApp (8–12 min)  
- [ ] Logs acessíveis para investigar FAIL  

---

## 7. Registro de evidências

Para cada FAIL/Blocker, anexar:
- ID do caso  
- Screenshot ou log  
- Passos para reproduzir  
- Severidade  
- Status correção  

Pasta sugerida: `docs/sua-trilha/handoff/checkpoints/aceite-YYYYMMDD/`

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
| AC-SEC-* | REQ-NFR-* |
