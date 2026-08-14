# Allugme — protocolo de testes para Claude Code/Cowork

Este arquivo é a instrução padrão para uma sessão de implementação ou execução de testes do Allugme. Leia também `docs/handoff/CURRENT.md`, `docs/02-prd.md`, `docs/05-plano-aceite.md` e `docs/rbac-matriz.md` antes de alterar código.

## Objetivo

Elevar a entrega atual até o gate de publicação, cobrindo frontend, API, banco, RBAC/tenancy, jornadas críticas e E2E. Não declarar sucesso apenas porque o projeto compila.

## Regras obrigatórias

1. Preserve mudanças existentes no working tree e não use `git reset --hard`, `git checkout --` ou exclusões abrangentes.
2. Não faça commit, push, deploy ou alterações em serviços externos sem solicitação expressa do usuário.
3. Nunca registre senhas, tokens, cookies, chaves, dados pessoais reais ou conteúdo de `.env` em código, fixtures, screenshots ou logs.
4. Use dados sintéticos, e-mails reservados (`example.test`) e números fictícios.
5. Todo teste de tenant deve criar pelo menos dois tenants independentes e provar tanto o acesso permitido quanto o acesso negado.
6. Todo teste de autorização deve validar o código HTTP e confirmar que o corpo não revela dados do recurso protegido.
7. Testes devem ser determinísticos, independentes, repetíveis e limpar os próprios dados quando aplicável.
8. Não desabilite validações, lint ou testes para obter execução verde.
9. Se encontrar defeito, registre reprodução, causa, impacto, correção e teste de regressão.
10. Ao finalizar, atualize a matriz deste documento e os casos correspondentes em `docs/05-plano-aceite.md`.

## Arquitetura e comandos-base

- Backend: .NET 10, EF Core, PostgreSQL e Redis.
- Frontend: React 19, TypeScript 6 e Vite 8.
- Ambiente local: `docker-compose.local.yml`.
- Frontend local: `http://localhost/allugme/`.
- Health: `http://localhost/allugme/health`.

```powershell
docker-compose -f docker-compose.local.yml up -d --build
docker-compose -f docker-compose.local.yml ps

cd frontend/dashboard
npm.cmd run lint
npm.cmd run build

cd ../..
docker run --rm -v "${PWD}:/src" -w /src/backend mcr.microsoft.com/dotnet/sdk:10.0 dotnet test tests/AlugueMe.UnitTests/AlugueMe.UnitTests.csproj --verbosity minimal
docker run --rm -v "${PWD}:/src" -w /src/backend mcr.microsoft.com/dotnet/sdk:10.0 dotnet test tests/AlugueMe.IntegrationTests/AlugueMe.IntegrationTests.csproj --verbosity minimal
```

## Ordem de implementação

### Onda 1 — testes unitários

- Convite: criação, validade, expiração, uso único e reenvio.
- Senha: somente o convidado define; redefinição exige token válido.
- Membership: inativa bloqueia acesso sem remover histórico.
- Avatar: contador, gate no nono login, formato e tamanho.
- E-mail do cliente: confirmação, expiração, reenvio e uso único.
- Visitas: cancelamento, reagendamento, buffer, bloqueio e conflito.
- Lembretes: janelas de 24h/2h e idempotência.
- Feedback: somente visita concluída, vínculo correto e unicidade.
- CRM: SaaS global; agência por tenant; corretor pelas próprias visitas.

### Onda 2 — integração API/banco

- Banco vazio aplica todas as migrações.
- Banco na versão anterior migra sem perda de histórico.
- Convite → aceite → login → inativação → reenvio → reativação.
- Cliente → confirmação de e-mail → login → favorito → visita.
- Visita → confirmação → reagendamento/cancelamento → conclusão → feedback.
- Dois agendamentos concorrentes para o mesmo corretor/horário: somente um vence.
- Tenant A nunca lê ou altera recurso do tenant B.
- Corretor A nunca lê cliente relacionado apenas ao corretor B.
- SaaS admin lista todos os clientes em modo somente leitura.

### Onda 3 — componentes frontend

- Configure Vitest, Testing Library, `user-event` e `jest-dom`.
- Teste estados de sucesso, carregamento, erro e formulário inválido.
- Cubra login, recuperação, convite, confirmação de e-mail, gate da foto, dashboard do cliente, cancelamento, reagendamento e feedback.
- Simule `navigator.mediaDevices.getUserMedia` para sucesso, permissão negada e dispositivo sem câmera.
- Faça verificações básicas de acessibilidade: nome acessível, foco, teclado e mensagens de erro.

### Onda 4 — E2E

- Configure Playwright com Chromium e projetos opcionais para viewport mobile e desktop.
- Inicialize a stack local antes da suíte e espere `/allugme/health` responder 200.
- Use API/fixtures para preparar estado; use a interface para provar a jornada do usuário.
- Grave trace e screenshot somente em falha; não versionar artefatos gerados.

### Onda 5 — segurança e resiliência

- Testes negativos para cada endpoint autenticado.
- Tokens opacos, expirados, reutilizados e pertencentes a outro usuário.
- Upload de avatar inválido e arquivo acima do limite.
- Ausência de enumeração de contas em recuperação/confirmacão.
- Falha de Resend/Redis não corrompe estado transacional.
- Logs não contêm tokens, senhas ou dados pessoais completos.
- Validar rate limiting antes do aceite de produção.

### Onda 6 — CI e qualidade

- CI deve executar lint, build, unitários frontend/backend, integração e E2E crítico.
- Upload de traces do Playwright apenas em falha.
- Cobertura é indicador, não substituto de cenários; publicar relatório sem reduzir o gate existente.
- Auditoria de dependências High/Critical deve bloquear o pipeline após triagem inicial.
- O CD não deve iniciar se qualquer gate obrigatório falhar.

### Onda 7 — aceite e produção

- Executar `docs/05-plano-aceite.md` e anexar evidências reproduzíveis.
- Todos os Blockers devem estar `PASS`.
- Aplicar migrações em cópia/backup antes de produção.
- Após autorização: commit, push, CI, CD e smoke tests na OCI.
- Validar `allugme.online`, `www`, `app`, `api` e uma vitrine real.
- Emitir `GO`, `GO com ressalvas` ou `NO-GO`.

## Matriz mínima E2E

| ID | Jornada | Perfis | Resultado obrigatório |
|---|---|---|---|
| E2E-AUTH-01 | Login e recuperação | SaaS, agência, corretor, cliente | Redirecionamento e RBAC corretos |
| E2E-BROKER-01 | Convite e aceite | Agência + corretor | Agência não escolhe senha |
| E2E-BROKER-02 | Foto via câmera | Corretor | Gate progressivo e captura funcional |
| E2E-CLIENT-01 | Cadastro e confirmação | Cliente | Acesso somente após confirmação |
| E2E-VISIT-01 | Solicitação e confirmação | Cliente + corretor | Status e mensagens consistentes |
| E2E-VISIT-02 | Cancelar/reagendar | Cliente | Regras de prazo e conflito respeitadas |
| E2E-VISIT-03 | Concluir e avaliar | Corretor + cliente | Uma única avaliação válida |
| E2E-TENANT-01 | Acesso cruzado | Tenant A + Tenant B | Nenhum dado cruzado em UI/API |
| E2E-ADMIN-01 | CRM global | SaaS admin | Todos os clientes, sem edição |

## Variáveis esperadas para E2E

Não salve valores neste arquivo. Leia do ambiente:

```text
E2E_BASE_URL
E2E_API_URL
E2E_SAAS_EMAIL
E2E_SAAS_PASSWORD
E2E_AGENCY_EMAIL
E2E_AGENCY_PASSWORD
E2E_BROKER_EMAIL
E2E_BROKER_PASSWORD
E2E_CLIENT_EMAIL
E2E_CLIENT_PASSWORD
```

## Formato do relatório final

```markdown
## Resultado
- Commit/base testada:
- Ambiente:
- Suites: aprovadas/falhas/ignoradas

## Cobertura executada
- Unitários:
- Integração:
- Frontend:
- E2E:
- Segurança:

## Defeitos
| Severidade | Cenário | Reprodução | Evidência | Estado |

## Riscos residuais
-

## Recomendação
- GO / GO com ressalvas / NO-GO
```

## Critério de encerramento

Não considerar o trabalho concluído enquanto houver Blocker sem automação ou evidência formal, falha de isolamento multi-tenant, migração não ensaiada, fluxo crítico sem E2E ou CI/CD capaz de publicar apesar de um gate obrigatório falhar.
