# Prompts — Claude Design (vitrine)

> Referência canônica da **tela de busca** (padrão QuintoAndar): ver [referencia-busca-quintoandar.md](referencia-busca-quintoandar.md).

Use estes prompts no **Claude Design** (ou ferramenta equivalente).  
Objetivo: gerar HTML/CSS/JS (ou exportação importável) para os 3 temas em `themes/official/{moderno,classico,minimal}/`.

## Contrato técnico (colar em todo prompt)

```
CONTEXTO DO PRODUTO
- SaaS imobiliário BR: vitrine pública de imobiliária/corretor independente.
- Idioma da UI: português do Brasil.
- Páginas obrigatórias por tema: home, listing (busca/resultados), property (detalhe), schedule (agendar visita).
- Partials: header, footer, property-card.
- O backend injeta dados via placeholders — NÃO inventar framework React/Vue; entregar HTML semântico + CSS + JS vanilla leve.
- Placeholders obrigatórios (manter literais no HTML):
  {{tenant.name}} {{tenant.logo_url}} {{tenant.phone}}
  {{property.title}} {{property.price}} {{property.city}} {{property.neighborhood}}
  {{property.bedrooms}} {{property.operation}} {{property.images}} {{property.description}}
  {{properties}} (loop de cards) {{search.filters}}
  {{visit.slots_endpoint}} {{visit.submit_endpoint}}
- Formulário de visita: nome, telefone, e-mail, escolha de slot (slots vêm da API).
- Busca: cidade, bairro, valor até, quartos, operação (alugar/comprar).
- Mobile-first, responsivo até desktop wide.
- Acessibilidade básica: contraste AA, labels, foco visível, alt em imagens.
- Entregar: estrutura de arquivos pages/, partials/, assets/css, assets/js; tokens CSS (:root).
- Usar imagens placeholder de imóveis/lifestyle (Unsplash/Pexels URLs reais ou slots claros).
- Iconografia: Lucide ou Phosphor via CDN (SVG), estilo consistente.
- Tipografia: Google Fonts — evitar Inter/Roboto/Arial como display; escolher pares expressivos e profissionais.
- NÃO usar: tema roxo-indigo genérico de IA; fundo cream + terracota clichê; dark mode glow; pills excessivas; emojis decorativos.
```

---

## Prompt 1 — Tema `moderno`

```
Você é um designer de produto sênior de proptech. Desenhe o tema oficial "moderno" para uma vitrine imobiliária SaaS no Brasil.

[COLAR BLOCO CONTEXTO DO PRODUTO ACIMA]

DIREÇÃO VISUAL — MODERNO
- Sensação: proptech contemporâneo, limpo, alta conversão (referência de mercado: clareza QuintoAndar/Loft, sem copiar marca).
- Cores: azul oceano profundo (#0B3D91) + ciano de ação (#00A3A1) + neutros frios (branco, slate 50–900). Sem roxo.
- Tipografia: display "Fraunces" ou "Newsreader"; corpo "Source Sans 3" ou "IBM Plex Sans".
- Hero full-bleed com foto de apartamento/varanda urbana BR; marca/tenant.name como sinal forte; 1 headline; 1 subtítulo curto; CTA "Buscar imóveis" + secundário "Agendar visita".
- Cards de imóvel: foto dominante, preço claro, badges Alugar/Comprar, bairro/cidade, quartos — sem card excessivo de sombra.
- Listing: filtros sticky laterais (desktop) / drawer (mobile); grid 2–3 colunas.
- Property: galeria grande, faixa de preço, CTA fixo mobile "Agendar visita".
- Schedule: calendário/slots limpos, formulário curto, trust line ("Resposta via WhatsApp do corretor").
- Microinterações: hover suave na foto do card, underline no nav, transição de filtros — 2–3 motions só.
- Entregável: HTML/CSS/JS completo dos 4 pages + 3 partials + tokens em :root + README curto de como encaixar placeholders.
```

---

## Prompt 2 — Tema `classico`

```
Você é um designer de produto sênior especializado em imobiliário de alto padrão. Desenhe o tema oficial "classico" para vitrine de imobiliária no Brasil.

[COLAR BLOCO CONTEXTO DO PRODUTO ACIMA]

DIREÇÃO VISUAL — CLÁSSICO
- Sensação: consultivo, confiança, lançamentos e ticket médio/alto (referência: redes tradicionais digitalizadas — Lopes-like, sem copiar).
- Cores: verde-floresta (#1F3D2B) + dourado contido (#C4A35A) só em detalhes + off-white quente suave (#F7F5F2) — evitar terracota/serifa genérica de "AI brochure".
- Tipografia: display "Cormorant Garamond" ou "Libre Baskerville"; corpo "Literata" ou "Source Serif 4" + UI sans "Karla" para forms.
- Layout: mais generoso em whitespace; header com logo + telefone {{tenant.phone}}; hero com imagem arquitetônica (fachada/sala ampla), headline elegante, CTA "Explorar imóveis".
- Cards: foto + tipografia refinada; preço em destaque discreto; menos "startup", mais "imobiliária".
- Listing: lista ou grid 2 colunas; filtros em barra superior fina.
- Property: narrativa (descrição longa), fichas técnicas em definição list, CTA "Solicitar visita".
- Schedule: tom formal, campos bem espaçados, horário em lista elegante.
- Iconografia: traço fino, monocromática no verde/dourado.
- Entregável: HTML/CSS/JS completo dos 4 pages + 3 partials + tokens :root + README de placeholders.
```

---

## Prompt 3 — Tema `minimal`

```
Você é um designer de produto sênior focado em minimalismo editorial. Desenhe o tema oficial "minimal" para vitrine imobiliária SaaS no Brasil.

[COLAR BLOCO CONTEXTO DO PRODUTO ACIMA]

DIREÇÃO VISUAL — MINIMAL
- Sensação: editorial, leve, muito espaço em branco, tipografia como herói.
- Cores: preto quase puro (#111111), branco, cinza médio; um único accent terracota NÃO — usar âmbar gráfico (#E85D04) ou vermelho-tijolo contido só em links/CTA, fundo branco puro. Alternativa accent: oliva seca (#6B7F4A). Escolha UMA accent e documente.
- Tipografia: display "DM Serif Display"; corpo "DM Sans". Escala tipográfica forte.
- Quase sem sombras; divisores hairline; fotos full-bleed intercaladas com texto.
- Hero: tipografia grande + uma imagem; busca inline minimalista (não card flutuante pesado).
- Cards: imagem + título + preço em linha; hover = leve fade, sem lift exagerado.
- Listing: grid denso mas respirável; filtros como chips simples (não pills arredondadas demais).
- Property: galeria tipográfica, sticky CTA texto+botão.
- Schedule: formulário de uma coluna, slots como botões retangulares de baixo radius (4–6px).
- Iconografia: Lucide stroke 1.5, tamanho pequeno, preto.
- Entregável: HTML/CSS/JS completo dos 4 pages + 3 partials + tokens :root + README de placeholders.
```

---

## Prompt 4 — Pacote unificado (opcional, se a ferramenta aceitar um brief só)

```
Crie um design system de 3 temas (moderno, classico, minimal) para a mesma vitrine imobiliária SaaS BR, compartilhando a mesma estrutura de páginas e placeholders, mas com identidade visual claramente distinta em cor, tipografia, densidade e fotografia.

[COLAR BLOCO CONTEXTO DO PRODUTO]

Para cada tema, entregar:
1) tokens CSS
2) header/footer/property-card
3) home, listing, property, schedule
4) guia de 5 linhas: quando a imobiliária deveria escolher este tema

Manter paridade funcional entre os 3 (mesmos filtros, mesmos campos de visita). Diferenciar só visual e hierarquia.
```

---

## Como importar no projeto

1. Exportar/copiar HTML/CSS/JS gerados.  
2. Substituir o conteúdo em:
   - `themes/official/moderno/`
   - `themes/official/classico/`
   - `themes/official/minimal/`
3. Garantir nomes: `theme.json`, `pages/*.html`, `partials/*.html`, `assets/...`  
4. Preservar placeholders `{{...}}` exatamente.  
5. Testar depois que o backend de temas existir (Fase 4); até lá, abrir HTML localmente no browser.
