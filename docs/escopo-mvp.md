# Escopo MVP — Allugme

Lista fechada do que o MVP entrega.

## Em escopo

1. **Auth** — cadastro/login de usuários B2B (e-mail/senha no mínimo)
2. **Multi-tenant** — isolamento por tenant (imobiliária ou corretor independente)
3. **RBAC** — papéis conforme [rbac-matriz.md](rbac-matriz.md)
4. **CRUD de imóveis** — venda e locação; campos básicos; upload de fotos
5. **Busca pública** — filtros por características (cidade, bairro, preço, quartos, operação)
6. **Detalhe do imóvel** na vitrine
7. **Solicitar visita** — visitante informa contato + escolhe slot
8. **Agenda do corretor** — listar, confirmar/recusar/cancelar; bloqueios básicos
9. **Buffer** — padrão 60 minutos; configurável por tenant e/ou corretor (corretor > tenant > padrão)
10. **Temas oficiais** HTML/CSS/JS — **5**: moderno, urbano, classico, minimal, porto
11. **Seed de demo** — 5 tenants ativos (um por tema) + imóveis, para demonstrar troca de layout
12. **Painel** para imobiliária/corretor gerir imóveis e agenda
13. **SaaS Admin** básico — listar/ativar/suspender tenants
14. **WhatsApp via Evolution API** — configurar número no painel; notificar solicitação de visita; confirmar/recusar visita por WhatsApp
15. **Redis** — fila de notificações WhatsApp, lock/controle de concorrência na agenda e idempotência de webhook (cache de busca/slots e rate limit = P1)

## Fora do escopo (P1/P2)

- App mobile nativo (MAUI ou outro)
- Tema custom (upload ZIP + aprovação)
- Geração estática/CDN completa
- Planos, billing, assinatura (UI de preços pode existir; cobrança real é P1)
- Domínio próprio / white-label DNS
- Propostas, contratos, boletos, garantia locatícia
- Auth Google/Apple/SMS obrigatório
- Distribuição automática entre corretores
- Sync Google Calendar
- Chat livre contínuo visitante↔corretor (além do fluxo transacional de visita)

## Checkpoints sugeridos

| Marco | Meta |
|-------|------|
| S4 | Auth + tenant + CRUD de 1 imóvel |
| S8 | Busca pública + pelo menos 1 tema |
| S12 | Visitas + buffer + WhatsApp (aviso + confirmação) |
| S14–16 | Temas oficiais + polish → demo |

## Critérios de sucesso do MVP

| Peso | Critério |
|------|----------|
| 35% | Fluxo completo funciona (cadastro imóvel → busca → visita) |
| 20% | Isolamento tenant + RBAC básico |
| 15% | Agenda respeita buffer |
| 15% | WhatsApp: config + notificação + confirmação de visita |
| 15% | Qualidade dos temas oficiais |
