# Checkpoint de aceite — 2026-08-14

## Baseline

- Repositório: `https://github.com/guelfi/allugme`
- Branch implantada: `main`
- Commit: `dc6025233f9184f9ae216acb13d97a6b926d1ef5`
- Origem: merge da PR #6
- Resultado: **GO técnico com ressalvas operacionais**

## Evidências principais

- Containers locais saudáveis após rebuild.
- Backend: 38/38 unitários e 2/2 de integração.
- Frontend: lint, 2/2 Vitest e build aprovados.
- Playwright: 3/3 desktop e 3/3 mobile.
- Isolamento multi-tenant amostrado sem exposição cruzada.
- Concorrência de visita bloqueada com HTTP 409.
- Upload real de 2,30 MiB aceito e servido pelo gateway.
- E-mail de recuperação entregue pelo Resend.
- CI da PR, merge e deploy OCI concluídos.

## Ressalvas não bloqueantes

- Homologar Evolution API/WhatsApp com instância e números reais.
- Homologar câmera física/selfie no celular e desktop.

## Continuidade

Antes de trabalhar em outro equipamento:

1. atualizar `main` a partir de `origin/main`;
2. confirmar este commit ou um sucessor no `git log`;
3. configurar secrets e `.env` por canal seguro, nunca pelo Git;
4. ler `docs/handoff/CURRENT.md` e o relatório em `docs/test-results/CLAUDE-COWORK-TEST-RESULT.md`;
5. registrar novas evidências e atualizar a baseline ao concluir outra rodada.

Nenhuma senha, token, certificado ou chave privada faz parte deste checkpoint.
