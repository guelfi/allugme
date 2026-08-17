# Pendência — regex da "vitrine" do Allugme pode quebrar assets de outros projetos no gateway compartilhado

**Registrado em:** 2026-08-17
**Origem:** incidente real em produção no projeto `Batuara.net` (`https://batuara.org.br`), diagnosticado e corrigido de forma paliativa **fora deste repositório**, diretamente no `nginx-proxy` da OCI.
**Componente:** `deploy/nginx-allugme.locations.conf` (fragmento injetado por `deploy/apply-nginx-allugme.py`)
**Severidade sugerida:** P1 — não é um bug ativo no Allugme, mas é uma falha latente que já causou uma indisponibilidade real em outro projeto e pode se repetir.

---

## O que aconteceu

Em 2026-08-17, `https://batuara.org.br` (domínio apex, sem `www`) carregava uma tela em branco. `https://www.batuara.org.br` funcionava normalmente.

**Causa raiz:** o `nginx-proxy` da OCI é compartilhado entre vários projetos (Batuara, Allugme, Barbear.IA, Driverhub, Hako, Unisystem, etc.), todos no mesmo `nginx.conf`. O script `deploy/apply-nginx-allugme.py` deste repositório injeta, dentro do `server_name batuara.org.br www.batuara.org.br` (bloco HTTPS do Batuara), o fragmento de `deploy/nginx-allugme.locations.conf` — incluindo a location "vitrine" (linha ~65):

```nginx
# Vitrine na raiz: /{slug}/… → API /t/{slug}/…
# Exclui prefixos de outros projetos no gateway compartilhado.
location ~ ^/(?!allugme(?:/|$)|themes(?:/|$)|media(?:/|$)|api(?:/|$)|swagger(?:/|$)|health(?:/|$)|driverhub(?:/|$)|hako(?:/|$)|unisystem(?:/|$)|batuara(?:/|$)|bela360(?:/|$)|barbear(?:/|$)|barbear-ia(?:/|$)|portainer(?:/|$)|favicon\.ico$|robots\.txt$)([a-z0-9][a-z0-9-]*)(/.*)?$ {
  set $upstream_allugme_api http://allugme-api:8080;
  rewrite ^/([^/]+)(/.*)?$ /t/$1$2 break;
  proxy_pass $upstream_allugme_api;
  ...
}
```

Essa regex captura **qualquer** primeiro segmento de path que não esteja na lista de exclusão entre parênteses — e `static` **não está nessa lista**. O PublicWebsite do Batuara (Create React App) serve seus bundles em `/static/js/...` e `/static/css/...` **na raiz do domínio** (sem prefixo de projeto, porque `batuara.org.br` é servido no domínio puro, diferente dos outros projetos que ficam sob um path tipo `/driverhub/`, `/hako/`, etc.).

Resultado: toda requisição a `/static/js/main.*.js` era capturada por essa regex, reescrita para `/t/static/js/main.*.js` e enviada para `allugme-api`, que responde 404 — quebrando o carregamento do React no domínio apex.

O `www.batuara.org.br` não apresentou o sintoma porque o Cloudflare já tinha em cache (imutável, ~1 ano de TTL) uma cópia **boa** desse mesmo arquivo, de um deploy anterior — mascarando o problema. Quando testado com bypass de cache, `www` também retornava 404 na origem, confirmando que o bug afeta os dois hosts igualmente; só não tinha sido percebido no `www` por sorte de cache.

## Por que isso pode voltar a acontecer com outros projetos

A regex funciona por **lista de exclusão** (blocklist), não por lista de inclusão. Qualquer projeto futuro que:

1. seja servido no **domínio raiz** (sem prefixo de path) através deste gateway compartilhado — hoje só o Batuara está nessa situação, mas pode não ser o único no futuro — **e**
2. use um bundler que sirva assets numa pasta de topo comum e não listada (`static`, `assets`, `_next`, `dist`, etc.),

vai sofrer o mesmo tipo de quebra, de forma silenciosa, só aparecendo quando o cache de CDN expirar ou for purgado.

## O que já foi corrigido (mitigação, não a causa raiz)

Diretamente em produção (`/var/www/nginx/nginx.conf` na OCI, fora deste repositório) e replicado em `Batuara.net/scripts/oracle/nginx-proxy.nginx.conf`:

- Adicionada uma location `^~ /static/` dedicada dentro do bloco do Batuara. No nginx, uma location de prefixo (`^~`) sempre vence uma location regex (`~`), então isso blinda o Batuara independentemente da ordem de inserção no arquivo.
- Cache do Cloudflare purgado para eliminar qualquer resposta 404 já cacheada.

Essa mitigação está fora dos markers `# BEGIN ALLUGME ... # END ALLUGME`, então **sobrevive** a um novo `apply-nginx-allugme.py`. Mas ela só protege o Batuara — o bug em si continua presente no fragmento deste repositório e pode pegar o próximo projeto que for exposto na raiz do domínio.

## Correção sugerida (a fazer aqui no Alugue.me)

1. ✅ **Feito em 2026-08-17.** Em `deploy/nginx-allugme.locations.conf`, adicionado `static`, `assets`, `_next` e `dist` à lista de exclusão da regex da vitrine, junto dos demais prefixos já excluídos (`allugme|themes|media|api|swagger|health|driverhub|hako|unisystem|batuara|bela360|barbear|barbear-ia|portainer`). Validado com uma bateria de casos via regex Python (equivalente à PCRE do nginx): `/static/...`, `/assets/...`, `/_next/...` e `/dist/...` deixam de ser capturados pela vitrine, enquanto slugs legítimos que apenas começam com esses nomes (ex.: `/staticville`) continuam funcionando.
2. ✅ **Feito em 2026-08-17.** Commit `bf907fa` enviado direto para `main` e implantado via pipeline padrão: CI `CI - Build & Validate` ([run 32045876991](https://github.com/guelfi/allugme/actions/runs/32045876991)) seguido de CD `CD - Deploy to OCI` ([run 32046059879](https://github.com/guelfi/allugme/actions/runs/32046059879)), que já roda `apply-nginx-allugme.py` no host da OCI. Todas as etapas do deploy concluíram com sucesso, incluindo "Verify deployment" e "Verify canonical public domains".
3. ✅ **Feito em 2026-08-17.** Vitrine migrada para o prefixo dedicado `/loja/{slug}/` (`location ^~ /loja/` em `deploy/nginx-allugme.locations.conf`) — allowlist real, nunca colide com rotas de outros projetos, sem depender de lista de exclusão. `/{slug}/` (raiz) e `/allugme/t/{slug}/` continuam funcionando como legado, redirecionando (301) para `/loja/{slug}/`, para não quebrar links já compartilhados. Nenhuma mudança foi necessária em backend/frontend: o esquema canônico do Allugme já era por subdomínio (`https://{slug}.allugme.online/`, ver `LandingPage.tsx`) e a rota interna da API já era `/t/{slug}` — o path `/{slug}/` na raiz só existia neste fragmento compartilhado (injetado no bloco HTTPS do Batuara e no fallback de IP por `apply-nginx-allugme.py`).
   - **Achado adicional durante a implementação, fora do escopo original desta pendência:** `apply-nginx-allugme.py` injeta este fragmento *dentro do próprio bloco `server_name batuara.org.br www.batuara.org.br`* (não é coincidência de gateway — é injeção deliberada no bloco de outro projeto). Como uma `location` regex (`~`) sempre vence uma `location /` sem prefixo no nginx, **qualquer rota própria do Batuara** (ex.: `/orixas`, `/eventos`) que não esteja na blocklist já era capturada silenciosamente pela vitrine do Allugme antes desta correção — não só assets estáticos. O `/loja/` allowlist elimina esse risco para o caminho canônico; o location de redirect legado (item acima) ainda usa blocklist e, em tese, mantém esse risco residual (agora só para as rotas legadas, com impacto menor: um redirect indevido em vez de conteúdo quebrado). Reavaliar se vale a pena remover o redirect legado (ou trocar a estratégia de injeção no bloco do Batuara) fica registrado aqui para decisão futura — não implementado nesta rodada por exigir mudanças em `apply-nginx-allugme.py` e validação direta na infra da OCI, fora do alcance desta sessão.
4. ⏳ **Pendente (opcional).** Agora que a regex corrigida está em produção, remover a location `^~ /static/` paliativa do Batuara (fora deste repositório) é opcional — ela é inofensiva e serve como defesa extra, mas não é mais estritamente necessária.

## Referências

- Incidente documentado no lado do Batuara: `Batuara.net/docs/PLANO-MELHORIAS.md` (item `PM-036`).
- Config de produção corrigida (referência): `Batuara.net/scripts/oracle/nginx-proxy.nginx.conf`.
