# Temas oficiais — vitrine (5 modelos)

Layouts HTML/CSS/JS para a vitrine pública do SaaS.

## Preview

```bash
xdg-open themes/official/index.html
```

| Tema | Origem | Direção |
|------|--------|---------|
| `moderno` | Open Design (importado) | Newsreader + Source Sans 3 · azul/ciano · imagens locais |
| `urbano` | Vitrine interna | **Ref. QuintoAndar** — Nunito Sans · azul `#2D4EB9` · card de busca ([doc](../docs/design/referencia-busca-quintoandar.md)) |
| `classico` | Vitrine interna | Cormorant + Karla · verde/dourado |
| `minimal` | Vitrine interna | DM Serif + DM Sans · preto/oliva |
| `porto` | Vitrine interna (5º) | Sora + IBM Plex Sans · navy/seafoam |

## Estrutura por tema

```
{tema}/
  theme.json
  pages/home|listing|property|schedule.html
  partials/header|footer|property-card.html
  assets/css/main.css
  assets/js/main.js
  assets/img/   # (moderno tem fotos locais)
```

## Placeholders

`{{tenant.*}}`, `{{property.*}}`, `{{properties}}`, `{{search.filters}}`, `{{visit.slots_endpoint}}`, `{{visit.submit_endpoint}}`

## Nota sobre o Moderno

O tema `moderno` usa partials via `fetch` no preview. Prefira:

```bash
npx --yes serve themes/official/moderno -p 5179
```

Depois abra `http://localhost:5179/pages/home.html`.
