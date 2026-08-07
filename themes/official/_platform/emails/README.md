# Templates de e-mail (Allugme)

## Resolução (ordem)

1. **Tenant custom** — `storage/email-templates/{tenantId}/{template}.html`  
   Futuro: upload/edição no painel da imobiliária/corretor para identidade própria.
2. **Tema oficial** — `themes/official/{themeKey}/emails/{template}.html`  
   Alinhado ao layout da vitrine (`ThemeKey` do tenant).
3. **Plataforma** — `themes/official/_platform/emails/{template}.html`  
   Fallback Allugme.

## Placeholders

| Chave | Encoding | Uso |
|-------|----------|-----|
| `{{user_name}}` | HTML | Nome do destinatário |
| `{{user_email}}` | HTML | E-mail da conta |
| `{{brand_name}}` | HTML | Nome do tenant ou Allugme |
| `{{platform_name}}` | HTML | Allugme |
| `{{expires_minutes}}` | HTML | Validade do link |
| `{{brand_color}}` / `{{accent_color}}` / `{{soft_color}}` | HTML | Cores do tema |
| `{{{reset_url}}}` | raw | URL do reset (href e texto) |
| `{{year}}` | HTML | Ano corrente |

Use `{{{chave}}}` apenas para URLs; demais campos com `{{chave}}`.

## Templates atuais

- `password-reset.html` — recuperação de senha
