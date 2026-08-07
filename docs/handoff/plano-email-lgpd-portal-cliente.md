# Plano aprovado — E-mail, LGPD, horário e portal do cliente

**Status:** Fases 0→6 implementadas (2026-08-07)  
**Ordem:** sequencial 0 → 1 → 2 → 3 → 4 → 5 → 6  

---

## Decisões fechadas

| Decisão | Resposta |
|---------|----------|
| SMTP | **Resend** (`contato@allugme.com.br`); inbox humana Umbler (suporte em andamento) |
| Convite corretor | **Ambas** as formas: convite por e-mail **e** “Adicionar com senha” |
| Portal do cliente (Fase 6) | **Incluir** neste pacote |
| Ordem | Sequencial |

---

## Fase 0 — Fundação de e-mail ✅

- [x] SMTP Resend + domínio verificado
- [x] Motor de templates (tenant → tema → `_platform`)
- [x] Templates: password-reset, broker-invite, visit-* 

## Fase 1 — Recuperação de senha ✅

- [x] forgot/reset + UI + e-mail

## Fase 2 — Convite de corretor ✅

- [x] `POST /brokers/invite` + resend + cancel (delete)
- [x] Status `Invited` → `Active` após `POST /auth/accept-invite`
- [x] Mantém `POST /brokers` com senha
- [x] UI Equipe: convidar / adicionar com senha

## Fase 3 — E-mail de visitas ✅

- [x] E-mail ao corretor na criação
- [x] E-mail ao visitante no confirm/reject (painel + WhatsApp webhook)
- [x] `EmailNotifyEnabled` em Settings
- [x] Fail-soft

## Fase 4 — Horário de funcionamento ✅

- [x] `AvailabilityRule` tenant/corretor
- [x] Precedência corretor > tenant > 09–18 úteis
- [x] UI Configurações; slots públicos

## Fase 5 — LGPD ✅

- [x] Checkbox cadastro B2B + portal cliente + agendamento visita
- [x] `ConsentRecord` (versão, data, IP, UA)
- [x] Página `/privacy`

## Fase 6 — Portal do cliente ✅

- [x] Cadastro/login cliente (`IsClient`)
- [x] Favoritos
- [x] Minhas visitas (+ claim por e-mail)
- [x] Shell `/portal` separado do B2B

---

## Nota Umbler

Inbox `contato@` (receber respostas humanas) é operacional e não bloqueia o app.
