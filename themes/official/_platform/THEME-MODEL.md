# Modelo de layout da vitrine Allugme

Imobiliárias e corretores independentes podem enviar um layout próprio. Ele só entra no ar depois da validação no painel administrativo da Allugme.

## Pacote (ZIP)

O ZIP deve conter, na raiz (ou em uma pasta única):

- `theme.json`
- `pages/home.html`
- `pages/listing.html`
- `pages/property.html`
- `pages/schedule.html`
- `partials/header.html`
- `partials/footer.html`
- `partials/property-card.html`
- `assets/css/main.css`
- `assets/js/main.js`

Extensões permitidas: html, css, js, json, svg, png, jpg, jpeg, webp, woff, woff2, ico, txt, md. Tamanho máximo: 8 MB.

## `theme.json`

```json
{
  "key": "minha-marca",
  "name": "Minha marca",
  "version": "1.0.0",
  "pages": ["home", "listing", "property", "schedule"]
}
```

## Placeholders obrigatórios

O backend injeta estes tokens. Não altere a grafia.

| Token | Uso |
| --- | --- |
| `{{tenant.name}}` | Nome da vitrine |
| `{{tenant.logo_url}}` | Logo |
| `{{tenant.phone}}` | Telefone / WhatsApp |
| `{{properties}}` | Loop de cards em home e listing |
| `{{search.filters}}` | Estado dos filtros |
| `{{property.id}}` | Id do imóvel (detalhe e agenda) |
| `{{property.title}}` `{{property.price}}` `{{property.city}}` `{{property.neighborhood}}` `{{property.bedrooms}}` `{{property.operation}}` `{{property.description}}` `{{property.images}}` | Detalhe / card |
| `{{visit.slots_endpoint}}` | GET de horários |
| `{{visit.submit_endpoint}}` | POST da visita |
| `{{api.base}}` | API pública |
| `{{app.dashboard_url}}` | Painel / cadastro de visitante |

Busca: o formulário de listing deve usar `method="get"` e aceitar `city`/`cidade`, `neighborhood`/`bairro`, `operation`/`operacao` (`rent`/`alugar`, `sale`/`comprar`), `bedrooms`/`quartos`, `price`/`valor_max`.

Cards: o `partials/property-card.html` deve ter um link `href="property.html"`. O backend acrescenta `?id=`.

Agenda: incluir `name="propertyId"` e um campo de slot. A runtime da plataforma envia `startAt` ISO para `POST {{api.base}}/public/visits`.

Favoritar: a runtime adiciona o botão e encaminha o visitante ao portal (`/portal/register`) quando não há sessão de cliente.

## Ativação

1. Envie o ZIP em **Tema da vitrine**.
2. O status fica `pending` até o administrador Allugme aprovar ou recusar.
3. Só um layout `approved` pode ser selecionado para a vitrine pública.
