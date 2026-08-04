# Resumo Executivo — Allugme

**Versão:** 1.2  
**Data:** 2026-08-04  
**Stack:** ASP.NET Core 10 + React  
**Status:** Baseline (+ WhatsApp/Evolution + Redis no MVP)

---

## 1. Problema

Imobiliárias e corretores independentes precisam de uma vitrine digital e de controle da carteira de imóveis (venda e locação), com agendamento de visitas e comunicação rápida via WhatsApp, sem disputar tráfego nacional com OLX/ZAP nem construir um clone end-to-end do QuintoAndar.

## 2. Proposta

**Allugme** é um SaaS multi-tenant que oferece:

1. **Painel** para cadastrar e publicar imóveis da carteira  
2. **Vitrine** por imobiliária/corretor (temas HTML)  
3. **Busca pública** por características  
4. **Agendamento de visitas** com controle de agenda e buffer entre compromissos  
5. **WhatsApp (Evolution API)** — aviso de solicitação de visita e confirmação/recusa pelo corretor  

## 3. Público

| Segmento | Uso |
|----------|-----|
| Imobiliária | Tenant com vários corretores |
| Corretor independente | Tenant individual |
| Visitante (locatário/comprador) | Busca e solicita visita |
| Admin da plataforma | Opera tenants e (futuro) aprova temas |

## 4. Posicionamento de mercado

Com base no benchmark QuintoAndar / OLX / Loft / redes tradicionais:

| Não somos | Somos |
|-----------|--------|
| Marketplace de tráfego massivo (OLX) | Ferramenta da **carteira** do corretor |
| Plataforma D2C end-to-end com garantia (QuintoAndar) | SaaS B2B + vitrine + agenda |
| Fintech completa (Loft) | MVP sem crédito/fiança (P2) |

**Diretriz:** nicho + conversão + utilidade operacional; não competir em mídia com ZAP/OLX no dia 1.

## 5. Escopo MVP

Ver [escopo-mvp.md](escopo-mvp.md).

**Inclui:** multi-tenant, RBAC, imóveis, busca, visitas com buffer (padrão 1h), WhatsApp via Evolution API, **Redis**, **5 temas oficiais**, **seed com 5 tenants** (um por tema) para demo de troca de layout, painel React, API .NET 10.  
**Exclui (MVP):** MAUI, billing, tema custom com aprovação, contratos/boletos, fintech, chat livre contínuo.

## 6. Stack

| Camada | Tecnologia |
|--------|------------|
| API | ASP.NET Core 10 |
| Banco | PostgreSQL + EF Core |
| Cache / fila / locks | Redis |
| Painel | React (SPA) |
| Vitrine | HTML/CSS/JS (temas oficiais) |
| Auth | Identity / JWT (ou cookie + SPA) |
| WhatsApp | Evolution API (envio + webhook; fila via Redis) |
| Mobile | Fora do MVP |

## 7. Premissas

- Uma API única alimenta painel e vitrine  
- Isolamento rigoroso por `tenant_id`  
- Buffer de agenda: corretor > imobiliária > padrão 60 min  
- Visita no MVP inicia como `pending` até confirmação do corretor  
- Broker edita apenas imóveis em que é responsável; `agency_admin` edita todos do tenant  

## 8. Riscos

| Risco | Mitigação |
|-------|-----------|
| Furo de tenant | Filtro obrigatório + testes de aceite de isolamento |
| Double-booking | Transação + validação de intervalo no backend |
| Escopo inchado (clone QuintoAndar) | Escopo MVP fechado |
| Temas inconsistentes | Contrato `theme.json` + placeholders obrigatórios |

## 9. Prazo-alvo

| Ritmo | MVP web |
|-------|---------|
| ~20h/semana | 11–15 semanas |
| Full-time | 5–8 semanas |

Checkpoints: S4 / S8 / S12 / S14–16 (ver plano de fases).

## 10. Critérios de sucesso

1. Duas tenants isoladas não acessam dados uma da outra  
2. Visitante encontra imóvel e solicita visita com slot válido  
3. Buffer configurado é respeitado na geração de slots  
4. Corretor recebe WhatsApp da solicitação e confirma/recusa pelo mesmo canal  
5. Cinco temas oficiais renderizam home, listagem, detalhe e agendar visita  
6. Plano de Aceite com status GO (sem bloqueadores abertos)

## 11. Documentos relacionados

- [PRD](02-prd.md)  
- [DET](03-det.md)  
- [Plano de Fases](04-plano-implementacao-fases.md)  
- [Plano de Aceite](05-plano-aceite.md)  
- [Benchmark de mercado](Resumo_Executivo_Analise_Mercado_QuintoAndar.pdf)  
