# Roadmap — Allugme

Único documento de trabalho em `docs/`.  
O que já está em `main` **não fica listado**. Ao publicar um item, **apague a linha** (e o bloco, se o lote acabar).

**Atualizado:** 2026-09-23  
Local: `http://192.168.15.119/allugme/` · vitrine `/loja/{slug}/`  
Produção: `https://allugme.online/` · painel `https://app.allugme.online/` · `https://{slug}.allugme.online/`

Fluxo: um lote → plano → local → `main` (CI/CD). Temas oficiais não misturam com P1/P2.

---

## P1 — plataforma

- Homologar Evolution / WhatsApp real (cliente existe; default ainda é fake).
- Gateway Pix + webhook + ativação automática (hoje Pix estático + admin).
- Cache Redis de busca/slots + invalidação.
- Rate limit na API pública / webhook.
- Evidência P95 da busca.
- Observabilidade (logs estruturados, alertas).
- Testes de integração API/DB/Redis e fluxos autenticados.
- Deploy recusar secrets padrão em produção.
- Homologar câmera física (avatar do corretor).

---

## P2 — depois

- Domínio próprio / white-label DNS (hoje só `{slug}.allugme.online`).
- Geração estática / CDN das vitrines.
- OAuth Google/Apple.
- Chat WhatsApp livre (fora da visita).
- Google Calendar.
- Distribuição automática entre corretores.
- App mobile.
- Contratos / boletos / garantia locatícia.
- Favicon e logo por tenant no admin (gancho `{{tenant.favicon_url}}` já no lote 1).
