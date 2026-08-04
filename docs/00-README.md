# Documentação do Projeto — Allugme

Índice do pacote documental. Arquivos da trilha **.NET 10 + React** na raiz desta pasta; material exclusivo do Oscar em [`Oscar/`](Oscar/).  
MVP inclui **WhatsApp via Evolution API** e **Redis** (fila, locks, cache, idempotência).

**Design:** [Referência de busca/listagem (QuintoAndar)](design/referencia-busca-quintoandar.md) — home (card) + resultados (lista+mapa); tema `urbano`.

## Estrutura

| Item | Conteúdo |
|------|----------|
| `01`–`05` + `handoff/` | Documentos oficiais da implementação .NET 10 + React |
| `glossario.md`, `rbac-matriz.md`, `escopo-mvp-rinha.md` | Referências comuns (linguagem neutra) |
| [`Oscar/`](Oscar/) | Modelos (templates) para a trilha PHP — sem marca/domínio Allugme |
| `Resumo_Executivo_Analise_Mercado_QuintoAndar.pdf` | Benchmark de mercado (contexto) |

## Documentos principais

1. [Resumo Executivo](01-resumo-executivo.md)
2. [PRD — Product Requirements Document](02-prd.md)
3. [DET — Detalhamento da Especificação Técnica](03-det.md)
4. [Plano de Implementação em Fases](04-plano-implementacao-fases.md)
5. [Plano de Aceite](05-plano-aceite.md)
6. [Seed demo — 5 tenants × 5 temas](06-seed-demo-tenants.md)
7. [Handoff / controle de sessão](handoff/)

## Referências comuns

- [Glossário](glossario.md)
- [Matriz RBAC](rbac-matriz.md)
- [Escopo MVP da rinha](escopo-mvp-rinha.md)

## Pacote Oscar

Ver [Oscar/README.md](Oscar/README.md).  

**Regra:** o pacote em `Oscar/` não cita **Allugme** / `allugme.com.br`; ele define `[Nome do Projeto]`, slug e domínio próprios. Ao enviar, inclua também os três arquivos comuns da raiz (`glossario.md`, `rbac-matriz.md`, `escopo-mvp-rinha.md`) se quiser o escopo alinhado.

## Como manter

1. Ao iniciar uma sessão, use `handoff/SESSION-TEMPLATE.md` e atualize `handoff/CURRENT.md`.
2. Ao fechar a sessão, registre decisões em `handoff/CHANGELOG-DEV.md`.
3. Ao atingir um marco (S4, S8…), atualize `handoff/checkpoints/`.
4. Alterações de escopo: atualize PRD + DET + Plano de Aceite (rastreabilidade REQ-xxx).
