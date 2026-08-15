# Relatório de Testes — Allugme

> Execução independente baseada em `docs/handoff/CLAUDE-CODE-COWORK-TESTING.md`. Este relatório não contém senhas, tokens ou dados pessoais reais.

## Estado vigente após a rodada corretiva

O veredito inicial abaixo é preservado como histórico da primeira execução. Após as correções, a nova bateria, o CI verde, o merge da PR #6 e o deploy na OCI, o resultado vigente passou a ser **GO técnico com ressalvas operacionais** para a baseline `dc60252` em `main`.

Ressalvas aceitas e adiadas: homologação da Evolution API/WhatsApp real e captura com câmera física. Elas não bloquearam a entrega técnica acordada.

## Identificação da rodada

- Data: 2026-08-14
- Commit testado: `5e6950cd092d4f3fa1a958807a40974105d063c3`
- Branch: `feat/client-journey-broker-testing`
- Ambiente: Docker local, `http://192.168.15.157/allugme/`
- Dados: contas e imóveis sintéticos com domínio reservado `example.test`
- Resultado recomendado: **GO com ressalvas para continuar na branch; NO-GO para merge/deploy de produção nesta etapa**

## Resumo executivo

| Área | Resultado |
|---|---|
| Stack e health check | PASS |
| Frontend lint/build | PASS |
| Testes frontend | PASS — 1/1 |
| Testes backend unitários | PASS — 38/38 |
| Testes backend de integração | PASS — 2/2 |
| Playwright público desktop/mobile | PASS — 6/6 |
| Inicialização em banco vazio | PASS — 10 migrações e API operacional |
| Auditoria de dependências | PASS — nenhuma vulnerabilidade conhecida reportada |
| Tenancy sintética por API | PASS na amostragem executada |
| Jornada cliente/visita por API | PASS na amostragem executada |
| E2E autenticado no navegador | PASS parcial — corretor, cliente e agência sintéticos |
| WhatsApp e e-mail reais | NÃO HOMOLOGADO nesta rodada |

## Evidências automatizadas

- `npm run lint`: aprovado.
- `npm run build`: aprovado, 81 módulos transformados.
- Vitest: 1 arquivo e 1 teste aprovados.
- Backend unitário: 38 aprovados, nenhum ignorado ou reprovado.
- Backend integração: 2 aprovados, nenhum ignorado ou reprovado.
- Playwright: 6 cenários aprovados em desktop e mobile.
- `npm audit --omit=dev`: zero vulnerabilidades.
- `dotnet list package --vulnerable`: nenhum pacote vulnerável encontrado.
- Banco descartável: API aplicou 10 migrações e iniciou com PostgreSQL/Redis vazios.
- Logs locais: nenhum `UnhandledException`, `DbUpdateException`, `NpgsqlException` ou `RedisConnectionException`. Foram observados avisos SMTP esperados porque a rodada utiliza destinatários `example.test` e envio real não está configurado para esses testes.

## Jornadas e regras validadas por API

| Caso | Resultado | Evidência resumida |
|---|---|---|
| Cadastro de agência, independente e cliente | PASS | Respostas de sucesso com identidades sintéticas |
| Isolamento Tenant A → Tenant B | PASS | leitura e atualização cruzadas de imóvel retornaram 404 |
| Convite de corretor por agência | PASS parcial | criação 201 e status `invited`; aceite por token não executado |
| Convite por independente | PASS | operação proibida com 403 |
| Gate de foto | PASS parcial | contador de logins sem foto progrediu de 1 a 9; tipo inválido retornou 400 |
| Foto e publicação | PASS | JPG pequeno aceito; imóvel publicado após foto |
| Solicitação de visita | PASS | visita criada com 201 |
| Concorrência no mesmo horário | PASS | segunda solicitação retornou 409 |
| Confirmação e conclusão | PASS | estados `confirmed` e `done` |
| Avaliação pós-visita | PASS | primeira avaliação aceita; duplicada bloqueada com 409 |
| Cancelamento | PASS | cancelamento dentro da regra retornou 200 |
| Reagendamento | PASS | reagendamento para slot disponível retornou 200 |
| Recuperação de senha | PASS parcial | e-mail existente e desconhecido retornaram a mesma resposta; token inválido retornou 400 |
| Enumeração de usuário | PASS na amostragem | resposta uniforme no fluxo de recuperação |

## Jornadas validadas no navegador

- Corretor independente autenticado foi direcionado para `/allugme/painel`, com acesso apenas ao tenant sintético correto.
- Corretor sem foto recebeu o modal progressivo **Aviso 1 de 9**, com ações `Usar câmera` e `Escolher foto`.
- Ao solicitar a câmera, o navegador controlado informou corretamente que não oferece captura e manteve a alternativa de selecionar arquivo. A captura com hardware real continua pendente.
- Cliente autenticado foi direcionado para `/allugme/portal`; o resumo exibiu uma visita aguardando confirmação.
- A grade `Minhas visitas` exibiu três registros sintéticos nos estados pendente, cancelada e concluída, com paginação e ações coerentes.
- Agência autenticada visualizou `Equipe`; o formulário de convite pede somente nome, e-mail e WhatsApp opcional — não permite que a imobiliária escolha a senha.
- Convite sintético enviado pela interface apareceu como `Convidado`, com ações de reenviar convite e inativar.

## Matriz E2E mínima

| ID | Jornada | Status | Observação |
|---|---|---|---|
| E2E-AUTH-01 | Login e recuperação | PASS parcial | logins e redirecionamentos de agência, independente e cliente aprovados; SaaS admin pendente |
| E2E-BROKER-01 | Convite e aceite | PASS parcial | convite criado pela interface sem campo de senha; aceite real do link não executado |
| E2E-BROKER-02 | Foto via câmera | PARCIAL | modal 1/9 e fallback validados; navegador controlado não disponibiliza câmera física |
| E2E-CLIENT-01 | Cadastro e confirmação | PASS parcial | cadastro, redirecionamento e portal aprovados; confirmação foi simulada diretamente apenas no banco local |
| E2E-VISIT-01 | Solicitação e confirmação | PASS por API | inclui conflito de horário 409 |
| E2E-VISIT-02 | Cancelar/reagendar | PASS por API | slots distintos e regras positivas validados |
| E2E-VISIT-03 | Concluir e avaliar | PASS por API | duplicidade de avaliação bloqueada |
| E2E-TENANT-01 | Acesso cruzado | PASS por API | nenhuma leitura ou alteração cruzada na amostragem |
| E2E-ADMIN-01 | CRM global somente leitura | PENDENTE | credencial seed documentada não autentica mais no banco persistente |

## Defeitos e lacunas encontrados

| Severidade | Item | Evidência | Recomendação |
|---|---|---|---|
| Alta | Credenciais seed documentadas estão obsoletas | todos os usuários de `docs/usuarios-teste.local.md` retornam 401; o seeder não redefine hashes existentes | criar procedimento seguro de reset apenas para ambiente local ou dados descartáveis |
| Média | Proxy bloqueia avatar permitido pela API | arquivo maior que 1 MB retorna nginx 413, embora a API declare limite de 5 MB | configurar `client_max_body_size 5m` ou superior na rota local/OCI e testar novamente |
| Baixa | Aviso de foto da equipe contabiliza o administrador como “corretor afiliado” | agência recém-criada exibe “1 corretor afiliado” sem foto, mas a única linha é o próprio administrador | ajustar contagem e texto para considerar somente membros com papel `broker`, ou tornar a mensagem genérica |
| Média | Cobertura automatizada muito pequena para o volume implementado | frontend tem 1 teste; integração cobre apenas renderer de 404; jornadas críticas dependem desta rodada ad hoc | transformar os cenários sintéticos aprovados em testes permanentes |
| Média | Convite, confirmação de e-mail e câmera não têm E2E completo | dependem de token recebido por e-mail e permissão real do dispositivo | homologar com caixa de teste/mail catcher e Playwright com fixture de câmera |
| Alta para produção | WhatsApp/Evolution e e-mail real não homologados nesta rodada | fake mode/SMTP sintético | executar aceite controlado com destinatários reais antes do merge de produção |

## Riscos residuais

- A alteração direta de `EmailVerifiedAt` foi feita somente para um cliente sintético local a fim de testar a jornada posterior; ela não substitui o teste do link real de confirmação.
- Os testes criaram dados sintéticos no banco local e não removeram contas, para preservar evidências e evitar exclusões destrutivas.
- A página pública, modal de layouts, link de nova aba, rota de recuperação e telas autenticadas de agência, independente e cliente foram inspecionados no navegador.
- O dashboard SaaS global não foi revalidado porque a senha descrita no documento local não corresponde ao hash persistido.

## Critério para conclusão

Antes de considerar a implementação 100% concluída:

1. corrigir o limite de upload no proxy;
2. restaurar um conjunto descartável e reproduzível de usuários de teste;
3. automatizar convite/aceite, confirmação de e-mail, câmera, visitas e tenancy;
4. executar E2E autenticado desktop/mobile com evidências visuais;
5. homologar Resend/Umbler e WhatsApp/Evolution com destinatários controlados;
6. executar CI na PR e somente então avaliar merge e CD na `main`.

## Veredito

O código está compilável, as suítes existentes passam, as migrações sobem do zero e a principal jornada de visitas funcionou por API. A execução anterior realmente ficou abaixo do esperado por não rodar essas verificações. Ainda não há evidência suficiente para declarar a implementação 100% concluída ou pronta para produção.

---

## Rodada corretiva — 2026-08-14

### Correções aplicadas

1. O aviso de foto agora considera exclusivamente membros ativos com papel `broker`; o administrador da imobiliária não é mais contado como corretor afiliado sem foto.
2. Foi criado teste unitário de regressão para a contagem, cobrindo administrador, convidado, inativo, corretor com foto e corretor ativo sem foto.
3. O proxy local e o template da OCI passaram a aceitar corpos de até 60 MB nas rotas da API, coerente com o limite máximo de vídeo (50 MB), fotos (10 MB) e avatar (5 MB) da aplicação.
4. O seed local recebeu a opção explícita `Seed__ResetPasswords=true`, restrita ao compose local, para restaurar as credenciais documentadas em bancos persistentes e tornar a homologação reproduzível.

### Nova bateria executada

| Verificação | Resultado |
|---|---|
| Frontend lint | PASS |
| Frontend Vitest | PASS — 2/2 |
| Frontend build de produção | PASS — 82 módulos |
| Build Docker frontend | PASS |
| Build/publish Docker API | PASS até a etapa registrada, sem erro de compilação |
| `npm audit --omit=dev --audit-level=high` | PASS — zero vulnerabilidades |
| `git diff --check` | PASS |
| Playwright desktop/mobile | BLOQUEADO PELO EXECUTOR — `spawn EPERM` antes de abrir o navegador |
| Navegador integrado no IP local | BLOQUEADO PELA POLÍTICA DA FERRAMENTA para IP privado |
| Consulta final de containers/.NET em SDK | BLOQUEADA pelo limite operacional da sessão |

As três linhas bloqueadas não representam reprovação funcional do Allugme: não houve requisição de teste concluída contra a aplicação. A rodada anterior permanece como evidência dos 6/6 E2E públicos, 38/38 testes backend, 2/2 de integração e das jornadas autenticadas sintéticas.

### Estado dos defeitos anteriores

| Item | Estado |
|---|---|
| Credenciais seed locais obsoletas | CORRIGIDO NO CÓDIGO; falta confirmar após reinício completo |
| Upload bloqueado em 1 MB pelo proxy | CORRIGIDO NO CÓDIGO; falta repetir upload >1 MB no proxy recarregado |
| Administrador contado como corretor sem foto | CORRIGIDO E COBERTO POR TESTE |
| Cobertura automatizada insuficiente | MELHORADA, porém ainda insuficiente para GO irrestrito |
| E-mail/WhatsApp/câmera reais | PENDENTE DE HOMOLOGAÇÃO controlada |

### Veredito atualizado

**NO-GO para produção por enquanto.** Os defeitos internos confirmados foram corrigidos e a parte executável da bateria ficou verde. Para chegar ao GO restam: confirmar o reload/rebuild dos containers; repetir upload real de 1–5 MB; executar a suíte .NET e o Playwright fora do sandbox; homologar convite/confirmação/recuperação por e-mail, WhatsApp real e câmera física; e obter CI verde na PR. Nenhum commit, push, merge ou deploy foi executado nesta rodada.

---

## Rodada de validação para PR — 2026-08-14

### Escopo e critérios acordados

- WhatsApp real via Evolution API, câmera física e upload manual de foto ficam adiados para uma homologação posterior.
- Esses itens não bloqueiam o GO técnico desta implementação.
- O upload continua protegido por limites na aplicação e o proxy foi alinhado aos limites funcionais, mas o ensaio real de 1–5 MB será feito manualmente.

### Resultados confirmados

| Verificação | Resultado |
|---|---|
| Containers após rebuild | PASS — API, frontend e PostgreSQL `healthy`; Redis e Nginx ativos |
| Backend unitário | PASS — 38/38 |
| Backend integração | PASS — 2/2 |
| Playwright desktop Chromium | PASS — 3/3 |
| Playwright mobile Pixel 7 | PASS — 3/3 |
| CI atual da PR #6 antes do novo commit | PASS — 4/4 checks verdes |

### Observações

- O Playwright foi executado contra `http://192.168.15.157/allugme/`.
- Os testes automatizados de WhatsApp validam regras e parsing local, sem acionar a Evolution API real.
- O GO final desta rodada depende de o novo commit da branch concluir novamente todos os checks da PR em verde.

---

## Homologação de upload e e-mail transacional — 2026-08-14

### Upload real pelo proxy

| Verificação | Resultado |
|---|---|
| Arquivo JPEG real | PASS — 2.411.059 bytes (2,30 MiB) |
| Autenticação de corretor seed | PASS — HTTP 200 |
| `POST /allugme/api/v1/brokers/me/avatar` | PASS — HTTP 200 |
| Gravação e retorno da URL pública | PASS |
| Leitura da URL `/allugme/media/{arquivo}` | PASS — HTTP 200, `Content-Length: 2411059` |

O primeiro ensaio identificou que o upload era aceito e persistido, mas a URL pública retornava 404 porque `/allugme/media/` caía no frontend. A configuração do Nginx local e o template legado da OCI foram corrigidos para encaminhar `/media/` e `/allugme/media/` à API. A sintaxe do Nginx foi validada antes do reload.

### E-mail transacional real

| Verificação | Resultado |
|---|---|
| `https://api.allugme.online/health` | PASS — HTTP 200 |
| Recuperação de senha para `admin@allugme.com.br` | PASS — API HTTP 200 |
| Evento no Resend | PASS — `delivered`, assunto `Allugme — Redefinir senha` |

O teste foi executado no ambiente OCI/produção porque o ambiente local não possui credenciais SMTP configuradas. O fluxo apenas gerou e enviou o link de recuperação; nenhuma senha foi alterada.

### Escopo adiado sem bloqueio

- Evolution API/WhatsApp real.
- Câmera física e captura manual de selfie.

Com os critérios acordados, upload de 1–5 MB e e-mail transacional deixam de ser pendências técnicas desta rodada.
