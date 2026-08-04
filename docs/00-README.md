# Documentação do Projeto — Allugme

Índice do pacote documental. Fonte da verdade para a trilha de implementação **.NET 10 + React** e modelos para a trilha paralela em PHP.

MVP inclui **WhatsApp via Evolution API** e **Redis** (fila, locks, cache, idempotência).

**Design:** [Referência de busca/listagem (QuintoAndar)](design/referencia-busca-quintoandar.md) — home (card) + resultados (lista+mapa); tema `urbano`.

## Estrutura

```
docs/
├── 00-README.md
├── sua-trilha/                 # Opção 2 (.NET 10 + React)
│   ├── 01-resumo-executivo.md
│   ├── 02-prd.md
│   ├── 03-det.md
│   ├── 04-plano-implementacao-fases.md
│   ├── 05-plano-aceite.md
│   ├── 06-seed-demo-tenants.md
│   └── handoff/
├── oscar-trilha/               # Modelos para a Trilha B (PHP)
│   ├── README.md
│   ├── MODELO-resumo-executivo.md
│   └── MODELO-especificacao-tecnica.md
├── compartilhado/              # Glossário, RBAC, escopo MVP (neutro)
├── design/                     # Referências de UX/UI da vitrine
└── Resumo_Executivo_Analise_Mercado_QuintoAndar.pdf
```

| Pasta | Conteúdo |
|-------|----------|
| [sua-trilha/](sua-trilha/) | Documentos oficiais da implementação .NET 10 + React |
| [oscar-trilha/](oscar-trilha/) | Modelos (templates) para a trilha PHP — sem marca/domínio Allugme |
| [compartilhado/](compartilhado/) | Glossário, RBAC e escopo MVP comum (linguagem neutra) |
| [design/](design/) | Referências de design da vitrine |
| `Resumo_Executivo_Analise_Mercado_QuintoAndar.pdf` | Benchmark de mercado (contexto; produto é mais enxuto) |

## Sua trilha (.NET 10 + React)

1. [Resumo Executivo](sua-trilha/01-resumo-executivo.md)
2. [PRD — Product Requirements Document](sua-trilha/02-prd.md)
3. [DET — Detalhamento da Especificação Técnica](sua-trilha/03-det.md)
4. [Plano de Implementação em Fases](sua-trilha/04-plano-implementacao-fases.md)
5. [Plano de Aceite](sua-trilha/05-plano-aceite.md)
6. [Seed demo — 5 tenants × 5 temas](sua-trilha/06-seed-demo-tenants.md)
7. [Handoff / controle de sessão](sua-trilha/handoff/)

## Referências comuns

- [Glossário](compartilhado/glossario.md)
- [Matriz RBAC](compartilhado/rbac-matriz.md)
- [Escopo MVP da rinha](compartilhado/escopo-mvp-rinha.md)

## Pacote Oscar (Trilha B)

Ver [oscar-trilha/README.md](oscar-trilha/README.md).

**Regra:** o pacote em `oscar-trilha/` não cita **Allugme** / `allugme.com.br`; ele define `[Nome do Projeto]`, slug e domínio próprios. Ao enviar, inclua também os três arquivos de [`compartilhado/`](compartilhado/) se quiser o escopo alinhado.

## Como manter

1. Ao iniciar uma sessão, use `sua-trilha/handoff/SESSION-TEMPLATE.md` e atualize `sua-trilha/handoff/CURRENT.md`.
2. Ao fechar a sessão, registre decisões em `sua-trilha/handoff/CHANGELOG-DEV.md`.
3. Ao atingir um marco (S4, S8…), atualize `sua-trilha/handoff/checkpoints/`.
4. Alterações de escopo: atualize PRD + DET + Plano de Aceite (rastreabilidade REQ-xxx).
