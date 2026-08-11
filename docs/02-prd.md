# PRD — Product Requirements Document — Allugme

**Versão:** 1.3
**Data:** 2026-08-09
**Stack:** ASP.NET Core 10 + React  
**Referências:** [Resumo Executivo](01-resumo-executivo.md) · [RBAC](rbac-matriz.md) · [Escopo MVP](escopo-mvp.md)

---

## 1. Visão do produto

Permitir que imobiliárias e corretores independentes publiquem sua carteira (venda/locação) em uma vitrine própria (tema), que visitantes busquem imóveis e agendem visitas com respeito à agenda do corretor, e que a comunicação operacional de visitas ocorra via **WhatsApp** (Evolution API).

## 2. Personas

| ID | Persona | Objetivo principal |
|----|---------|-------------------|
| P-SA | SaaS Admin | Ativar/suspender tenants; visão da plataforma |
| P-AA | Agency Admin | Gerir corretores, imóveis do tenant, configurações |
| P-BR | Broker | Cadastrar imóveis, gerir agenda e visitas |
| P-IB | Independent Broker | Tudo do tenant individual |
| P-VI | Visitante | Buscar imóvel e solicitar visita |
| P-CL | Cliente autenticado | Favoritar imóveis e acompanhar suas visitas |

## 3. Jornadas principais

### J1 — Publicar imóvel
Agency Admin / Broker autentica → cria imóvel (sale/rent) → envia fotos → publica → imóvel aparece na vitrine/busca.

### J2 — Buscar e visitar
Visitante abre vitrine → filtra → abre detalhe → solicita visita → escolhe slot → informa contato → status `pending` → corretor é notificado no WhatsApp.

### J3 — Confirmar visita (painel ou WhatsApp)
Corretor confirma/recusa no painel **ou** responde ao WhatsApp (comando com código) → status atualizado → buffer aplicado se confirmada → (opcional MVP) visitante recebe WhatsApp de retorno se houver telefone.

### J4 — Operar tenant (Admin SaaS)
SaaS Admin lista tenants → ativa/suspende → tenants suspensos não aparecem na busca pública.

### J5 — Configurar WhatsApp
Agency Admin / Independent / Broker abre configurações → informa número WhatsApp e dados da instância Evolution → testa conexão → ativa notificações de visita.

### J6 — Recuperar acesso e integrar corretor
Usuário solicita redefinição de senha → recebe link por e-mail → define nova senha. Agency Admin pode convidar corretor por e-mail, que aceita o convite e ativa a membership, ou adicioná-lo diretamente com senha.

### J7 — Usar o portal do cliente
Visitante aceita a política de privacidade e cria conta → entra no portal separado do B2B → favorita imóveis → consulta visitas vinculadas ou reivindicadas pelo mesmo e-mail.

## 4. Requisitos funcionais

### 4.1 Auth e contas

| ID | Requisito | Prioridade |
|----|-----------|------------|
| REQ-AUTH-01 | Cadastro e login com e-mail e senha | P0 |
| REQ-AUTH-02 | Logout e sessão segura | P0 |
| REQ-AUTH-03 | Recuperação de senha por e-mail | P1 |
| REQ-AUTH-04 | OAuth Google/Apple | P2 |

### 4.2 Tenancy e RBAC

| ID | Requisito | Prioridade |
|----|-----------|------------|
| REQ-TEN-01 | Criação de tenant (agency \| independent) | P0 |
| REQ-TEN-02 | Isolamento de dados por `tenant_id` | P0 |
| REQ-TEN-03 | Roles conforme matriz RBAC compartilhada | P0 |
| REQ-TEN-04 | Agency admin convida broker (e-mail) | P1 |
| REQ-TEN-05 | SaaS admin ativa/suspende tenant | P0 |

### 4.3 Imóveis

| ID | Requisito | Prioridade |
|----|-----------|------------|
| REQ-PROP-01 | CRUD imóvel com operação sale/rent | P0 |
| REQ-PROP-02 | Campos: título, descrição, cidade, bairro, preço, quartos, área, tipo, status | P0 |
| REQ-PROP-03 | Upload de fotos | P0 |
| REQ-PROP-04 | Publicar / despublicar | P0 |
| REQ-PROP-05 | `responsible_broker_id` obrigatório no MVP | P0 |
| REQ-PROP-06 | Broker edita só os próprios; agency_admin edita todos do tenant | P0 |

### 4.4 Busca e vitrine

| ID | Requisito | Prioridade |
|----|-----------|------------|
| REQ-SRC-01 | Busca pública por cidade, bairro, preço máx., quartos, operação | P0 |
| REQ-SRC-02 | Listagem e detalhe do imóvel publicado | P0 |
| REQ-SRC-03 | Cinco temas oficiais (moderno, urbano, classico, minimal, porto); **urbano** segue design system inspirado no QuintoAndar | P0 |
| REQ-SRC-04 | Tenant escolhe tema oficial ativo | P0 |
| REQ-SRC-05 | Tema custom (upload + aprovação) | P2 |
| REQ-SRC-06 | Geração estática / CDN | P2 |
| REQ-SEED-01 | Seed de demo com 5 tenants ativos, um por tema oficial | P0 |
| REQ-SEED-02 | Cada tenant seed com ≥ 3 imóveis publicados (mix sale/rent) | P0 |
| REQ-SEED-03 | Seed idempotente (reexecutar não duplica por slug/e-mail) | P0 |
| REQ-SEED-04 | Credenciais e URLs de vitrine documentadas para demo/aceite | P0 |

### 4.5 Visitas e agenda

| ID | Requisito | Prioridade |
|----|-----------|------------|
| REQ-VIS-01 | Visitante solicita visita em imóvel publicado | P0 |
| REQ-VIS-02 | Dados: nome, telefone, e-mail, start_at | P0 |
| REQ-VIS-03 | Status: pending \| confirmed \| rejected \| cancelled \| done | P0 |
| REQ-VIS-04 | Duração padrão configurável (default 60 min) | P0 |
| REQ-VIS-05 | Buffer padrão 60 min; override tenant e corretor | P0 |
| REQ-VIS-06 | Precedência buffer: corretor > tenant > plataforma | P0 |
| REQ-VIS-07 | API de slots livres (`GET .../visit-slots`) | P0 |
| REQ-VIS-08 | Validação de conflito no backend (transação) | P0 |
| REQ-VIS-09 | Corretor confirma/recusa/cancela | P0 |
| REQ-VIS-10 | Bloqueios manuais na agenda | P0 |
| REQ-VIS-11 | Horário comercial (regras por weekday) | P1 |
| REQ-VIS-12 | Timezone `America/Sao_Paulo` | P0 |
| REQ-VIS-13 | Notificação e-mail | P1 |
| REQ-VIS-14 | Notificação WhatsApp ao corretor na criação da visita (`pending`) | P0 |
| REQ-VIS-15 | Confirmar/recusar visita via resposta WhatsApp (mesmo efeito do painel) | P0 |
| REQ-VIS-16 | Notificar visitante por WhatsApp ao confirmar/recusar (se telefone informado) | P0 |

### 4.6 WhatsApp / Evolution API

| ID | Requisito | Prioridade |
|----|-----------|------------|
| REQ-WA-01 | Configurar no painel número WhatsApp (E.164) do tenant e/ou corretor | P0 |
| REQ-WA-02 | Configurar vínculo com Evolution API (URL base da plataforma + instance name / apikey conforme modelo DET) | P0 |
| REQ-WA-03 | Ativar/desativar notificações de visita por WhatsApp | P0 |
| REQ-WA-04 | Precedência do destinatário: WhatsApp do corretor responsável > WhatsApp do tenant | P0 |
| REQ-WA-05 | Envio via Evolution API ao criar visita, preferencialmente pela fila Redis (não bloqueia criação se envio falhar; registrar falha + retry) | P0 |
| REQ-WA-06 | Webhook Evolution para mensagens recebidas; parse de comando de confirmação/recusa | P0 |
| REQ-WA-07 | Mensagem de aviso contém dados da visita + código curto + instruções SIM/NAO | P0 |
| REQ-WA-08 | Apenas número configurado do corretor/tenant pode alterar status daquela visita via WhatsApp | P0 |
| REQ-WA-09 | Tela React de configurações WhatsApp + teste de envio (“Enviar mensagem de teste”) | P0 |
| REQ-WA-10 | Chat livre contínuo / atendimento genérico fora do fluxo de visita | P2 |

### 4.7 Painel (React)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| REQ-UI-01 | Telas: login, imóveis, agenda/visitas, configurações (buffer + WhatsApp), admin SaaS | P0 |
| REQ-UI-02 | Consumo exclusivo da API .NET (OpenAPI) | P0 |

### 4.8 E-mail, LGPD e portal do cliente

| ID | Requisito | Prioridade |
|----|-----------|------------|
| REQ-EMAIL-01 | Templates transacionais com fallback tenant → tema → plataforma | P1 |
| REQ-EMAIL-02 | Convite e recuperação de senha por e-mail | P1 |
| REQ-EMAIL-03 | Notificar corretor na criação e visitante na confirmação/recusa da visita | P1 |
| REQ-LGPD-01 | Registrar consentimento versionado, data, IP e user-agent nos fluxos aplicáveis | P1 |
| REQ-LGPD-02 | Disponibilizar política de privacidade e preferências de cookies | P1 |
| REQ-PORTAL-01 | Cadastro/login de cliente em shell separado do painel B2B | P1 |
| REQ-PORTAL-02 | Cliente autenticado favorita/desfavorita imóveis | P1 |
| REQ-PORTAL-03 | Cliente acompanha e reivindica visitas pelo e-mail verificado no fluxo | P1 |

## 5. Regras de negócio — agenda

Seja visita com `start_at`, `end_at = start_at + duration`, `buffer = B` minutos efetivos:

1. Intervalo ocupado considerado: `[start_at, end_at + B]` (ou política documentada equivalente no DET).  
2. Novo slot só é válido se não intersectar ocupados (visitas pending/confirmed + bloqueios).  
3. Slots só dentro da disponibilidade efetiva: regra do corretor > regra do tenant > padrão 09:00–18:00 em dias úteis.
4. Imóvel suspenso/despublicado não aceita novas visitas.  
5. Confirmação via WhatsApp aplica as **mesmas** regras de conflito/status que o painel.  
6. Sem número WhatsApp configurado, o fluxo de visita no site/painel continua válido (só não há notificação).

## 6. Requisitos não funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| REQ-NFR-01 | Toda query de negócio filtra tenant (exceto saas_admin e catálogo público) | P0 |
| REQ-NFR-02 | Senhas com hash forte; HTTPS em deploy | P0 |
| REQ-NFR-03 | Uploads: tipos/tamanho validados; sem execução de código | P0 |
| REQ-NFR-04 | LGPD: termos/privacidade na vitrine e cadastro | P1 |
| REQ-NFR-05 | API documentada OpenAPI | P0 |
| REQ-NFR-06 | Tempo de resposta busca P95 &lt; 1s em dataset MVP (milhares de imóveis) | P1 |
| REQ-NFR-07 | Segredos Evolution (apikey) só em config de servidor / secrets; não expor no front | P0 |
| REQ-NFR-08 | Webhook Evolution validado (token/header secreto) | P0 |
| REQ-INF-01 | Redis disponível em dev/prod (Docker Compose / gerenciado) | P0 |
| REQ-INF-02 | Envio WhatsApp via fila Redis (criação de visita não espera Evolution) | P0 |
| REQ-INF-03 | Lock Redis + DB na reserva de slot (mitigar double-booking) | P0 |
| REQ-INF-04 | Cache Redis com TTL para busca pública e/ou slots (invalidar ao publicar/mudar visita) | P1 |
| REQ-INF-05 | Idempotência de webhook Evolution com chave no Redis | P0 |
| REQ-INF-06 | Rate limiting básico (API pública / webhook) com Redis | P1 |

## 7. User stories (P0)

1. Como **broker**, quero cadastrar um imóvel para locação para publicá-lo na vitrine.  
2. Como **visitante**, quero filtrar imóveis por cidade e preço para encontrar opções.  
3. Como **visitante**, quero solicitar uma visita em um horário livre.  
4. Como **broker**, quero ver minha agenda e confirmar visitas.  
5. Como **agency_admin**, quero configurar o buffer padrão da imobiliária.  
6. Como **saas_admin**, quero suspender um tenant que viola regras.  
7. Como **agency_admin**, quero escolher um dos 5 temas oficiais.  
8. Como **broker/imobiliária**, quero configurar meu WhatsApp no painel para receber pedidos de visita.  
9. Como **broker**, quero confirmar ou recusar uma visita respondendo no WhatsApp.

## 8. Fora de escopo (MVP)

App mobile, billing automático/conciliação de gateway, tema custom, propostas/contratos/boletos, fintech, iBuyer, consórcio, QPreço e chat WhatsApp livre fora do fluxo de visita.

## 9. Baseline de implementação em 2026-08-09

Os requisitos P0 do núcleo e o pacote P1 de e-mail/LGPD/portal estão implementados no código. WhatsApp permanece habilitado em fake mode por padrão e precisa de homologação com Evolution real. O status de implementação não substitui aceite: todos os casos Blocker do [Plano de Aceite](05-plano-aceite.md) devem obter `PASS` antes do GO.

## 10. Métricas de aceite de produto

Ligadas ao [Plano de Aceite](05-plano-aceite.md):

- 100% dos casos P0 de isolamento tenant = PASS  
- Fluxo J1→J2→J3 demonstrável em demo (painel **e** WhatsApp)  
- Buffer evidenciado com 2 visitas sequenciais  
- Aviso WhatsApp + confirmação/recusa via WhatsApp = PASS  
- 5 temas com as 4 páginas mínimas  
- Seed com 5 tenants (um por tema) permite demo de troca de layout  

## 11. Rastreabilidade

IDs `REQ-*` são referenciados no DET, no [Seed](06-seed-demo-tenants.md) e no Plano de Aceite (`AC-*`).  
Detalhe dos tenants/slugs/temas: [06-seed-demo-tenants.md](06-seed-demo-tenants.md).
