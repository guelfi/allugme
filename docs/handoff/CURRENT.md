# Estado atual — Allugme

**Última atualização:** 2026-08-14
**Fase:** MVP funcional; Fase 5 concluída com GO técnico e ressalvas operacionais
**Repo GitHub:** https://github.com/guelfi/allugme  
**Baseline implantada:** `dc6025233f9184f9ae216acb13d97a6b926d1ef5` (`main`, merge da PR #6)
**Progresso estimado MVP:** 100% do escopo técnico acordado; homologações externas de Evolution API e câmera física foram adiadas sem bloquear esta entrega

---

## Resumo executivo

O núcleo do produto está implementado: SaaS multi-tenant, RBAC, imóveis e mídia, busca/vitrine, agenda e visitas, cinco temas, trial/Pix estático, e-mail transacional, LGPD e portal do cliente. A infraestrutura de WhatsApp (fila Redis, worker, webhook, idempotência e comandos `SIM/NAO`) está pronta e opera em fake mode por padrão; a integração real ainda precisa ser configurada e homologada.

A rodada de 2026-08-14 obteve **GO técnico com ressalvas operacionais**. Build, testes automatizados, isolamento multi-tenant amostrado, upload real, e-mail transacional, CI, merge e deploy na OCI foram aprovados. WhatsApp real via Evolution API e câmera física permanecem para homologação posterior.

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
| 5 — Polish e Aceite | ✅ | GO técnico em 2026-08-14; Evolution real e câmera física seguem como ressalvas operacionais |

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

## Estado de qualidade e entrega

| Área | Evidência vigente |
|------|-------------------|
| Containers locais | API, frontend e PostgreSQL saudáveis; Redis e Nginx ativos após rebuild |
| Backend | 38/38 testes unitários e 2/2 testes de integração aprovados |
| Frontend | Oxlint, Vitest 2/2 e build de produção aprovados |
| E2E público | Playwright 3/3 desktop e 3/3 mobile aprovados |
| Tenancy/RBAC | Isolamento A→B aprovado na amostragem por API; acesso cruzado retornou 404 |
| Visitas | Criação, concorrência 409, confirmação, conclusão, avaliação, cancelamento e reagendamento aprovados por API |
| Upload | JPEG real de 2,30 MiB aprovado pelo proxy, persistido e servido publicamente |
| E-mail | Recuperação transacional entregue pelo Resend em destinatário controlado |
| CI/CD | PR #6 com checks verdes, merge em `main` e deploy OCI concluído |
| WhatsApp | Código/fake mode cobertos; Evolution API real não homologada nesta rodada |
| Câmera | Gate, contador e fallback validados; hardware físico não homologado nesta rodada |

Relatório detalhado: [CLAUDE-COWORK-TEST-RESULT.md](../test-results/CLAUDE-COWORK-TEST-RESULT.md).

## Próximos passos para outra estação de trabalho

1. Clonar ou atualizar `https://github.com/guelfi/allugme` e confirmar a `main` em `dc60252` ou commit posterior.
2. Manter certificados, chaves privadas, senhas e arquivos `.env` fora do Git; recuperar secrets pelos canais operacionais autorizados.
3. Homologar Evolution API/WhatsApp real quando a instância e os números controlados estiverem disponíveis.
4. Homologar captura de selfie em câmera física no celular e no desktop.
5. Expandir continuamente os testes de integração API/PostgreSQL/Redis e E2E autenticados.
6. Atualizar o plano de aceite e este handoff a cada nova rodada ou mudança de baseline.

Plano operacional detalhado: seção “Estratégia de execução” em [05-plano-aceite.md](../05-plano-aceite.md).

## Blockers ativos

Nenhum defeito Blocker conhecido está aberto no escopo técnico aprovado. Evolution API real e câmera física são ressalvas de homologação externa e não bloquearam o GO desta baseline.

## Estado de contas operacionais

- A conta cliente `marco@guelfi.com.br` existe no ambiente local e na OCI.
- Em 2026-08-14 foi solicitado um reset de senha oficial na OCI; a conclusão depende do link recebido pelo titular. Nenhuma senha é documentada ou versionada.

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
