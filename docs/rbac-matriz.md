# Matriz RBAC (compartilhado)

## Papéis

| Role | Escopo | Descrição |
|------|--------|-----------|
| `saas_admin` | Plataforma | Opera tenants, auditoria, aprovação de temas (P1+) |
| `agency_admin` | Tenant imobiliária | Dono/gestor; convida corretores; configura buffer do tenant |
| `broker` | Tenant imobiliária | Corretor; gerencia imóveis e agenda (próprios ou conforme regra) |
| `independent_broker` | Tenant próprio | Equivale a admin + corretor de um tenant individual |
| `visitor` | Público | Busca imóveis e solicita visitas |

> Implementação sugerida: unificar `independent_broker` como `tenant_admin` + `tenant_type = independent`, se preferir menos roles.

## Matriz de permissões (MVP)

| Capacidade | SaaS Admin | Agency Admin | Broker | Indep. | Visitante |
|------------|:----------:|:------------:|:------:|:------:|:---------:|
| Gerenciar tenants | ✅ | — | — | — | — |
| Convidar/remover corretores | — | ✅ | — | —* | — |
| Cadastrar/editar imóvel | — | ✅ | ✅** | ✅ | — |
| Publicar / despublicar imóvel | — | ✅ | ✅** | ✅ | — |
| Buscar / ver imóveis publicados | ✅ | ✅ | ✅ | ✅ | ✅ |
| Solicitar visita | — | — | — | — | ✅ |
| Ver agenda do tenant | ✅ | ✅ | própria | ✅ | — |
| Confirmar/recusar visita | ✅ | ✅ | próprias*** | ✅ | — |
| Configurar buffer do tenant | — | ✅ | — | ✅ | — |
| Configurar buffer próprio | — | — | ✅ | ✅ | — |
| Configurar WhatsApp do tenant (Evolution) | — | ✅ | — | ✅ | — |
| Configurar WhatsApp próprio (corretor) | — | — | ✅ | ✅ | — |
| Receber aviso / confirmar visita via WhatsApp | — | ✅ | ✅ | ✅ | — |
| Criar bloqueios na agenda | — | ✅ | próprios | ✅ | — |
| Escolher tema oficial | — | ✅ | — | ✅ | — |

\* Independente não convida time no MVP.  
\*\* No MVP: broker edita imóveis em que é `responsible_broker` **ou** todos do tenant — **regra adotada na trilha A: broker edita apenas os próprios; agency_admin edita todos do tenant.**  
\*\*\* Agency admin gerencia visitas de todos os corretores do tenant.

## Policies nomeadas (referência)

- `tenant.manage` → `saas_admin`
- `users.invite` → `agency_admin`
- `property.create` → `agency_admin`, `broker`, `independent_broker`
- `property.update` → dono do imóvel **ou** `agency_admin` **ou** `saas_admin`
- `property.publish` → mesmos + tenant ativo
- `property.view_public` → qualquer um se `status = published` e tenant ativo
- `visit.request` → visitante (ou anônimo com dados de contato)
- `visit.manage` → corretor responsável / agency_admin / saas_admin
- `settings.buffer.tenant` → agency_admin / independent_broker
- `settings.buffer.broker` → broker / independent_broker
- `settings.whatsapp.tenant` → agency_admin / independent_broker
- `settings.whatsapp.broker` → broker / independent_broker
- `visit.manage.whatsapp` → mesmo escopo de `visit.manage` (via webhook autenticado da Evolution)
