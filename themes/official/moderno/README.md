# Tema oficial — Moderno

Tema público de vitrine imobiliária (SaaS BR). HTML semântico + CSS + JS vanilla
leve, sem framework. O backend injeta dados substituindo os placeholders
literais `{{...}}` e os marcadores de partial.

## Estrutura

```
theme.json                 identidade do tema (key, nome, versão, páginas)
index.html                 launcher de apresentação do tema (não vai para produção)
pages/
  home.html                hero full-bleed + busca + destaques + passos + CTA
  listing.html             busca/resultados: filtros sticky (desktop) / drawer (mobile)
  property.html            detalhe: galeria, painel de preço, CTA fixo mobile
  schedule.html            agendamento: slots da API + formulário curto
partials/
  header.html              cabeçalho (logo, nav, telefone, CTA)
  footer.html              rodapé (marca, contato, links, CRECI/CNPJ)
  property-card.html       card canônico usado no loop {{properties}}
assets/
  css/main.css             tokens em :root + todos os componentes
  js/main.js               interações vanilla (menu, drawer, galeria, slots, preview)
  img/*.jpg                fotos reais de exemplo (Unsplash, baixadas localmente)
```

## Como o backend encaixa os placeholders

### 1. Partials

Cada página contém os marcadores literais:

```html
<!-- partial:header -->
<!-- partial:footer -->
```

Substitua o comentário pelo conteúdo renderizado de `partials/header.html` /
`partials/footer.html` (já com os `{{tenant.*}}` resolvidos). No loop de
resultados, cada iteração de `{{properties}}` renderiza
`partials/property-card.html`.

> Em preview local (arquivo aberto direto ou servido sem backend), o
> `assets/js/main.js` carrega os partials via `fetch` só para visualização.
> Quando o backend substitui o marcador, esse carregamento é no-op.

### 2. Placeholders obrigatórios

| Placeholder | Onde | O que injetar |
| --- | --- | --- |
| `{{tenant.name}}` | header, footer, títulos, hero | Nome da imobiliária/corretor |
| `{{tenant.logo_url}}` | header, footer | URL absoluta do logotipo |
| `{{tenant.phone}}` | header, footer, CTAs, trust lines | Telefone com DDD, só dígitos nos links `tel:`/`wa.me` |
| `{{property.title}}` | property, cards | Título do anúncio |
| `{{property.price}}` | property, cards | Preço formatado (ex.: `R$ 4.200/mês` ou `R$ 720.000`) |
| `{{property.city}}` | property, cards | Cidade |
| `{{property.neighborhood}}` | property, cards | Bairro |
| `{{property.bedrooms}}` | property, cards | Número de quartos |
| `{{property.operation}}` | property, cards | `Alugar` ou `Comprar` |
| `{{property.images}}` | property (galeria), cards (1ª foto) | Na galeria: as tags `<img>`/miniaturas; no card: URL da foto de capa |
| `{{property.description}}` | property | Texto do anúncio (parágrafos) |
| `{{properties}}` | home, listing | Loop: um `partials/property-card.html` por imóvel |
| `{{search.filters}}` | listing (form de filtros) | Estado serializado dos filtros ativos (hidden inputs ou valores selecionados) |
| `{{visit.slots_endpoint}}` | schedule (`data-endpoint`) | URL que responde JSON de slots |
| `{{visit.submit_endpoint}}` | schedule (`action` do form) | URL que recebe o POST do agendamento |

### 3. Contrato da API de slots

`GET {{visit.slots_endpoint}}` deve responder:

```json
[
  { "date": "2026-08-05", "times": ["09:00", "10:30", "15:00"] },
  { "date": "2026-08-06", "times": ["09:00", "13:30"] }
]
```

O `POST {{visit.submit_endpoint}}` recebe `nome`, `telefone`, `email` e
`slot` (string `"AAAA-MM-DD HH:MM"`). Em preview (endpoint ainda é o
placeholder ou a chamada falha), o JS gera dias úteis de demonstração e
simula a confirmação sem sair da página.

### 4. Blocos de preview (`data-preview-only`)

Home, listing e property incluem cards/imagens de exemplo marcados com
`data-preview-only data-preview-for="{{token}}"`. O `main.js` remove esses
blocos automaticamente quando o token correspondente **não existe mais no
HTML** (ou seja, o backend injetou dados reais). Não é preciso apagar nada
na integração — mas os blocos podem ser removidos à mão se preferir.

Os marcadores de injeção (`{{properties}}`, `{{property.images}}`,
`{{search.filters}}`) ficam dentro de `<span class="inject-marker">`, que tem
`display:none` — o token permanece literal no HTML sem aparecer na tela.

## Tokens e customização

Todos os valores visuais estão em `:root` no topo de `assets/css/main.css`:

- `--brand` `#0b3d91` (azul oceano) — marca, links, nav ativa, badge Comprar
- `--accent` `#00a3a1` (ciano) — reservado a CTAs primários e estados de seleção
- `--bg/--surface/--fg/--muted/--border` — neutros frios (branco + slate 50–900)
- `--font-display` Newsreader · `--font-body` Source Sans 3 (Google Fonts)
- Raio, sombras, container (`1200px`) e transições também são tokens

Badges de operação: `badge--comprar` (oceano sólido) e `badge--alugar`
(outline oceano). No card de exemplo do partial a classe está fixa em
`badge--alugar`; ao renderizar, escolha a classe conforme `{{property.operation}}`.

## Acessibilidade

- Contraste AA: texto sobre ciano usa `--on-accent` (#04302f); slate-600+ sobre branco
- Todos os campos com `<label>` visível, `:focus-visible` com anel ciano
- Ícones Lucide decorativos com `aria-hidden="true"`; imagens com `alt` real
- Alvos de toque ≥ 44px; drawer de filtros fecha com `Esc` e tem overlay
- `prefers-reduced-motion` desativa transições

## Microinterações (propositalmente poucas)

1. Zoom suave na foto do card no hover
2. Underline animado no nav
3. Transição do drawer de filtros (mobile) e seleção de slots
