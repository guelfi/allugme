# Documentação — Allugme

Fonte da verdade do MVP **ASP.NET Core 10 + React** (painel) + temas HTML (vitrine).

Inclui **WhatsApp via Evolution API** e **Redis** (fila, locks, cache, idempotência).

**Design:** [Referência de busca/listagem (QuintoAndar)](design/referencia-busca-quintoandar.md) — home (card) + resultados (lista+mapa); tema `urbano`.

## Estrutura

```
docs/
├── README.md
├── 01-resumo-executivo.md
├── 02-prd.md
├── 03-det.md
├── 04-plano-implementacao-fases.md
├── 05-plano-aceite.md
├── 06-seed-demo-tenants.md
├── glossario.md
├── rbac-matriz.md
├── escopo-mvp.md
├── handoff/                    # estado da sessão / changelog
├── design/                     # referências UX da vitrine
└── Resumo_Executivo_Analise_Mercado_QuintoAndar.pdf
```

## Produto

1. [Resumo Executivo](01-resumo-executivo.md)
2. [PRD](02-prd.md)
3. [DET](03-det.md)
4. [Plano de Implementação em Fases](04-plano-implementacao-fases.md)
5. [Plano de Aceite](05-plano-aceite.md)
6. [Seed demo — 5 tenants × 5 temas](06-seed-demo-tenants.md)
7. [Handoff](handoff/)

## Referências

- [Glossário](glossario.md)
- [Matriz RBAC](rbac-matriz.md)
- [Escopo MVP](escopo-mvp.md)
- [Design — busca QuintoAndar](design/referencia-busca-quintoandar.md)
- [Benchmark de mercado (PDF)](Resumo_Executivo_Analise_Mercado_QuintoAndar.pdf)

## Como manter

1. Ao iniciar uma sessão, use `handoff/SESSION-TEMPLATE.md` e atualize `handoff/CURRENT.md`.
2. Ao fechar a sessão, registre decisões em `handoff/CHANGELOG-DEV.md`.
3. Alterações de escopo: atualize PRD + DET + Plano de Aceite (rastreabilidade REQ-xxx).
