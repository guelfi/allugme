# Resumo Executivo — [Nome do Projeto]

**Versão:** _preencher_  
**Data:** _preencher_  
**Trilha:** B — PHP + HTML/CSS/JS  
**Autor:** _preencher_

| Campo | Valor (definido por você) |
|-------|---------------------------|
| Nome do produto | `[Nome do Projeto]` |
| Slug / identificador técnico | _preencher — ex.: pasta do repo, tenant path_ |
| Domínio ou URL prevista (dev/prod) | _preencher — **obrigatório ser próprio**; não copiar marca/domínio da Trilha A_ |

> Marca e domínio desta trilha são **independentes**. Não use o nome nem o domínio da outra implementação (nem variantes).

---

## 1. Problema

_preencher — qual dor de imobiliárias/corretores este produto resolve_

## 2. Proposta

**[Nome do Projeto]** é um SaaS multi-tenant que oferece:

1. _preencher — painel / carteira_  
2. _preencher — vitrine / temas_  
3. _preencher — busca pública_  
4. _preencher — agendamento de visitas / agenda_  
5. _preencher — WhatsApp / Evolution API (aviso e confirmação de visita)_

## 3. Público

| Segmento | Uso |
|----------|-----|
| Imobiliária | _preencher_ |
| Corretor independente | _preencher_ |
| Visitante | _preencher_ |
| Admin da plataforma | _preencher_ |

## 4. Posicionamento

_preencher — como se diferencia de portais de classificados e de plataformas end-to-end_

| Não somos | Somos |
|-----------|--------|
| _preencher_ | _preencher_ |

## 5. Escopo MVP

Alinhar com o documento compartilhado `../compartilhado/escopo-mvp-rinha.md`.

**Inclui:**  
_preencher lista — incluir WhatsApp/Evolution_

**Exclui (MVP):**  
_preencher lista_

## 6. Stack (Trilha B)

| Camada | Tecnologia |
|--------|------------|
| Backend | PHP _versão_ — _puro / framework leve (especificar)_ |
| Banco | PostgreSQL _(ou outro — especificar)_ |
| Painel | HTML/CSS/JS |
| Vitrine | HTML/CSS/JS (temas) |
| Auth | _preencher_ |
| WhatsApp | Evolution API — _preencher como integra_ |
| Cache / fila / locks | Redis _(ou equivalente)_ — _preencher_ |
| Hospedagem alvo | _preencher_ |

## 7. Premissas

- _preencher — multi-tenant_  
- _preencher — RBAC_  
- _preencher — buffer de agenda (padrão 60 min; precedência)_  
- _preencher — status inicial da visita_  
- _preencher — regra de edição de imóvel por corretor_  
- _preencher — WhatsApp: falha de envio não bloqueia criação da visita_

## 8. Riscos

| Risco | Mitigação |
|-------|-----------|
| _preencher_ | _preencher_ |

## 9. Prazo-alvo

| Ritmo | MVP |
|-------|-----|
| _preencher_ | _preencher_ |

Checkpoints sugeridos: S4 / S8 / S12 / S14–16 (ver escopo compartilhado).

## 10. Critérios de sucesso

1. _preencher_  
2. _preencher_  
3. _preencher — WhatsApp aviso + confirmação_  
4. _preencher_  

## 11. Documentos relacionados

- Especificação Técnica: `MODELO-especificacao-tecnica.md` (preenchido)  
- Escopo MVP: `../compartilhado/escopo-mvp-rinha.md`  
- RBAC: `../compartilhado/rbac-matriz.md`  
