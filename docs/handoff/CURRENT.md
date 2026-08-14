# Estado atual — Allugme

**Última atualização:** 2026-08-14
**Fase:** MVP funcional; Fase 5 (polish, automação e aceite formal) em andamento
**Repo GitHub:** https://github.com/guelfi/allugme  
**Progresso estimado MVP:** ~95% de implementação; entrega comercial condicionada ao aceite formal e à homologação da Evolution API real

---

## Resumo executivo

O núcleo do produto está implementado: SaaS multi-tenant, RBAC, imóveis e mídia, busca/vitrine, agenda e visitas, cinco temas, trial/Pix estático, e-mail transacional, LGPD e portal do cliente. A infraestrutura de WhatsApp (fila Redis, worker, webhook, idempotência e comandos `SIM/NAO`) está pronta e opera em fake mode por padrão; a integração real ainda precisa ser configurada e homologada.

O critério de conclusão do MVP não é mais quantidade de features. É obter `GO` ou `GO com ressalvas` no [Plano de Aceite](../05-plano-aceite.md), com todos os casos Blocker em `PASS`.

## URLs e ambientes

| Ambiente | URL |
|----------|-----|
| Local Windows (validação) | http://192.168.15.157/allugme/ |
| Local Windows Swagger | http://192.168.15.157/allugme/swagger/index.html |
| OCI (IP) | http://129.153.86.168/allugme |
| Site comercial | https://allugme.online/ |
| Painel produção | https://app.allugme.online/ |
| Produção Swagger | https://api.allugme.online/swagger/index.html |
| Vitrine tenant | https://{slug}.allugme.online/ |
| Portal cliente | https://app.allugme.online/portal |
| Cadastro visitante | https://app.allugme.online/portal/register |

Path OCI: `/var/www/allugme`.

## Status por fase

| Fase | Status | Observação |
|------|--------|------------|
| 0 — Foundation | ✅ | .NET 10, React/Vite, Docker, PostgreSQL, Redis, health e CI/CD |
| 1 — Auth, Tenancy e RBAC | ✅ | JWT, memberships, papéis, administração de tenants |
| 2 — Imóveis e Busca | ✅ | CRUD, publicação, filtros, até 13 fotos e 1 vídeo |
| 3 — Visitas e Buffer | ✅ | Slots, conflito, bloqueios, buffer e disponibilidade configurável |
| 3b — WhatsApp | 🟡 | Código/fake mode completos; Evolution real pendente de homologação |
| 4 — Temas e Vitrine | ✅ | Cinco temas, cinco tenants seed e rota pública por slug |
| 4b — E-mail, LGPD e Portal | ✅ | Fases 0→6 do pacote concluídas em 2026-08-07 |
| 5 — Polish e Aceite | 🔄 | Lint/testes em evolução; todos os `AC-*` ainda precisam de rodada formal |

## Baseline implementada

- Cadastro/login B2B, trial de sete dias, bloqueio por expiração e Pix estático.
- Recuperação de senha por e-mail.
- Pré-cadastro de corretor afiliado e convite por e-mail; a senha é definida exclusivamente pelo convidado.
- Perfis SaaS admin, agency admin, broker, independent broker e cliente.
- CRUD/publicação de imóveis, mídia e avatar do corretor.
- Busca pública, cinco vitrines temáticas e seleção de tema.
- Agenda, slots, bloqueios, buffer corretor > tenant > plataforma e `AvailabilityRule` corretor > tenant > padrão.
- E-mails de visita com comportamento fail-soft.
- Consentimentos LGPD versionados e página de privacidade.
- Portal do cliente: cadastro/login, favoritos e minhas visitas.
- Jornada do cliente: confirmação de e-mail, dashboard ampliado, cancelamento, agenda, lembretes e avaliação pós-visita.
- Isolamento de CRM: visão global somente para SaaS admin; agência por relacionamento no tenant; corretor por próprias visitas.
- Dashboard SaaS contabiliza e lista contas Cliente cadastradas, em modo somente leitura.
- Grids administrativos compactos e paginados em blocos de até dez registros.
- WhatsApp: fila Redis, worker, logs, webhook, autorização do remetente, idempotência e retorno ao visitante.
- CI com build backend/frontend, testes, Gitleaks e build Docker; CD automatizado para OCI após CI verde.

## Estado de qualidade

| Área | Estado atual | Próxima evidência exigida |
|------|--------------|---------------------------|
| Tenancy/RBAC | Implementada; teste manual histórico | `AC-RBAC-*` e `AC-TEN-*` com evidência reproduzível |
| Publicação | Implementada | `AC-PROP-01/03` + busca/detalhe público |
| Visitas | Implementada + testes unitários do cálculo | `AC-VIS-01..09`, incluindo dois POSTs concorrentes |
| WhatsApp | Fake mode funcional; UI expõe `EvolutionInstanceName` e teste envia `ToE164` | `AC-WA-*` com instância Evolution e números reais |
| Testes backend | Unitários em expansão; integração era placeholder | Automatizar API/DB para tenancy, publicação e visitas |
| Frontend | Build no CI | Oxlint real, sem warnings, no CI |

## Pendências imediatas — ordem de execução

1. Preparar ambiente imutável de aceite: commit/tag, URLs, seed, Postgres, Redis, Evolution, SMTP e contas de teste.
2. Executar a Porta de Blockers completa: baseline/Auth/segurança → tenancy/RBAC → publicação/vitrine → visitas/concorrência → WhatsApp real/webhook.
3. Corrigir qualquer Blocker e repetir a onda afetada até que **todos** estejam em `PASS`; nenhum P0/P1 começa antes desse gate.
4. Executar os P0 restantes e a regressão crítica.
5. Executar os P1, incluindo `AC-EMAIL-*`, `AC-LGPD-*` e `AC-PORTAL-*`.
6. Emitir ata `GO`, `GO com ressalvas` ou `NO-GO` e atualizar este arquivo.

Plano operacional detalhado: seção “Estratégia de execução” em [05-plano-aceite.md](../05-plano-aceite.md).

## Blockers ativos

Nenhum defeito Blocker conhecido está aberto, mas os Blockers do plano permanecem **não homologados**. Falta de evidência não equivale a `PASS`.

## Roadmap pós-aceite

### P1

- Gateway Pix, webhook e conciliação/ativação automáticas.
- Cache Redis para busca/slots e rate limiting.
- Métrica e teste de performance P95 da busca.
- Observabilidade estruturada, alertas e painéis operacionais.
- Testes de integração da API com banco/Redis e testes de fluxo do frontend.
- Endurecimento do bootstrap/deploy para rejeitar secrets padrão em produção.

### P2

- OAuth Google/Apple.
- Tema custom com upload e aprovação.
- Geração estática/CDN e domínio próprio/white-label.
- Chat WhatsApp livre, Google Calendar e distribuição automática entre corretores.
- Aplicativo mobile e módulos de contratos/boletos/garantias.

## Documentos relacionados

- [PRD](../02-prd.md)
- [Plano de fases](../04-plano-implementacao-fases.md)
- [Plano de aceite](../05-plano-aceite.md)
- [Plano concluído de e-mail/LGPD/portal](plano-email-lgpd-portal-cliente.md)
- [Changelog](CHANGELOG-DEV.md)
