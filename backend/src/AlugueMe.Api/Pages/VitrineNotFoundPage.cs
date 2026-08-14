using System.Net;

namespace AlugueMe.Api.Pages;

public static class VitrineNotFoundPage
{
    public static string Render(string marketingBaseUrl)
    {
        var homeUrl = WebUtility.HtmlEncode(marketingBaseUrl.TrimEnd('/'));

        return $$"""
            <!doctype html>
            <html lang="pt-BR">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <meta name="robots" content="noindex, nofollow">
              <title>Vitrine não encontrada — Allugme</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet">
              <style>
                :root {
                  color-scheme: light;
                  font-family: "Source Sans 3", system-ui, sans-serif;
                  color: #1a2332;
                  background: #f4f6f8;
                }
                * { box-sizing: border-box; }
                body { margin: 0; min-height: 100svh; }
                .page {
                  min-height: 100svh;
                  display: grid;
                  grid-template-rows: auto 1fr auto;
                  background:
                    radial-gradient(circle at 82% 18%, rgba(15, 118, 110, .13), transparent 26rem),
                    #f7faf9;
                }
                .header, .footer {
                  width: min(70rem, calc(100% - 2rem));
                  margin: 0 auto;
                  display: flex;
                  align-items: center;
                }
                .header { min-height: 5rem; border-bottom: 1px solid #d8e2df; }
                .brand { display: inline-flex; align-items: center; gap: .45rem; color: #12211e; text-decoration: none; }
                .mark {
                  width: 2.2rem;
                  height: 2.2rem;
                  display: grid;
                  place-items: center;
                  border-radius: .72rem;
                  color: #fff;
                  background: linear-gradient(135deg, #0f766e, #0b5a54);
                  font: 700 1.15rem/1 Fraunces, Georgia, serif;
                }
                .wordmark { font: 700 1.15rem/1 Fraunces, Georgia, serif; }
                main { display: grid; place-items: center; padding: 3rem 1rem; }
                .content { width: min(36rem, 100%); text-align: center; }
                .code {
                  margin: 0 0 .5rem;
                  color: #0f766e;
                  font: 700 clamp(5.5rem, 18vw, 9rem)/.9 Fraunces, Georgia, serif;
                  letter-spacing: -.06em;
                }
                h1 {
                  margin: 0;
                  color: #12211e;
                  font: 700 clamp(2rem, 5vw, 3rem)/1.08 Fraunces, Georgia, serif;
                }
                p { margin: 1rem auto 0; max-width: 31rem; color: #5c6b67; font-size: 1.08rem; line-height: 1.6; }
                .action {
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 3rem;
                  margin-top: 2rem;
                  padding: .75rem 1.35rem;
                  border-radius: .55rem;
                  color: #fff;
                  background: #0f766e;
                  box-shadow: 0 .55rem 1.5rem rgba(15, 118, 110, .2);
                  font-weight: 700;
                  text-decoration: none;
                  transition: background .18s ease, transform .18s ease;
                }
                .action:hover { background: #0d655e; transform: translateY(-1px); }
                .action:focus-visible { outline: 3px solid rgba(15, 118, 110, .3); outline-offset: 3px; }
                .footer { min-height: 4rem; justify-content: center; color: #71807c; font-size: .9rem; }
                @media (max-width: 36rem) {
                  .header { min-height: 4.25rem; }
                  main { padding-block: 2rem; }
                }
              </style>
            </head>
            <body>
              <div class="page">
                <header class="header">
                  <a class="brand" href="{{homeUrl}}" aria-label="Ir para o Allugme">
                    <span class="mark" aria-hidden="true">A</span>
                    <span class="wordmark">llugme</span>
                  </a>
                </header>
                <main>
                  <section class="content" aria-labelledby="not-found-title">
                    <div class="code" aria-hidden="true">404</div>
                    <h1 id="not-found-title">Vitrine não encontrada</h1>
                    <p>Não encontramos a imobiliária ou o corretor deste endereço. Confira o link ou volte para conhecer o Allugme.</p>
                    <a class="action" href="{{homeUrl}}">Ir para a página principal</a>
                  </section>
                </main>
                <footer class="footer">Allugme · Vitrines imobiliárias</footer>
              </div>
            </body>
            </html>
            """;
    }
}
