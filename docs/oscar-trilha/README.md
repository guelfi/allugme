# Pacote de modelos — Trilha B (PHP)

Este pacote contém **templates** para você preencher a especificação da sua implementação (PHP + HTML/CSS/JS).

## Arquivos nesta pasta

| Arquivo | Uso |
|---------|-----|
| [MODELO-resumo-executivo.md](MODELO-resumo-executivo.md) | Preencha o resumo do **seu** projeto |
| [MODELO-especificacao-tecnica.md](MODELO-especificacao-tecnica.md) | Preencha a especificação técnica da stack PHP |

## Arquivos comuns (`docs/compartilhado/`)

Se receberem junto com este pacote:

| Arquivo | Uso |
|---------|-----|
| [`../compartilhado/glossario.md`](../compartilhado/glossario.md) | Termos comuns |
| [`../compartilhado/rbac-matriz.md`](../compartilhado/rbac-matriz.md) | Papéis e permissões |
| [`../compartilhado/escopo-mvp-rinha.md`](../compartilhado/escopo-mvp-rinha.md) | Escopo MVP para comparação justa |

## Como usar

1. Copie os modelos para a pasta do seu repositório.
2. Substitua `[Nome do Projeto]` pelo nome que você escolher.
3. Preencha as seções marcadas com `_preencher_`.
4. Mantenha o **mesmo escopo MVP** descrito em [`../compartilhado/escopo-mvp-rinha.md`](../compartilhado/escopo-mvp-rinha.md) para a comparação ser justa.
5. Stack esperada nesta trilha: **PHP** (sua escolha de estrutura) + **HTML/CSS/JS** na vitrine e painel.

## Nomenclatura, marca e domínio (obrigatório)

- Defina **`[Nome do Projeto]`**, slug e **domínio/URL** próprios da Trilha B.
- **Não reutilize** marca, nome fantasia, slug, subdomínio ou domínio da Trilha A — nem variantes ortográficas, com ou sem ponto, nem TLDs derivados desse nome.
- Exemplos do que evitar: copiar o nome da outra trilha como pasta, repositório, `theme.json`, host local (`*.localhost`) ou domínio de produção.
- Nas comparações documentais, use apenas **Trilha A** (.NET/React) e **Trilha B** (PHP).
- Este pacote propositalmente **não cita** o nome/domínio da outra trilha, para não induzir adoção.

## Escopo mínimo (lembrete)

Auth, multi-tenant, RBAC, CRUD imóveis (venda/locação), busca pública, visitas com buffer (padrão 60 min), **WhatsApp via Evolution API**, **Redis (ou equivalente)** para fila/locks/cache/idempotência, temas HTML oficiais (mínimo 3), painel para corretor/imobiliária, admin da plataforma básico.

Detalhes: [escopo-mvp-rinha.md](../compartilhado/escopo-mvp-rinha.md).
