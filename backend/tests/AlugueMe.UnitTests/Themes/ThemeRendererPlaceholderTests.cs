using AlugueMe.Application.Interfaces;
using AlugueMe.Infrastructure.Options;
using AlugueMe.Infrastructure.Themes;
using Microsoft.Extensions.Options;

namespace AlugueMe.UnitTests.Themes;

public class ThemeRendererPlaceholderTests
{
    [Fact]
    public async Task Encodes_text_and_keeps_raw_html_cards()
    {
        var root = Path.Combine(Path.GetTempPath(), "allugme-theme-" + Guid.NewGuid().ToString("N"));
        var themeDir = Path.Combine(root, "minimal");
        Directory.CreateDirectory(Path.Combine(themeDir, "pages"));
        Directory.CreateDirectory(Path.Combine(themeDir, "partials"));
        await File.WriteAllTextAsync(Path.Combine(themeDir, "pages", "home.html"),
            "<html><body><!-- partial:header -->{{tenant.name}}{{properties}}</body></html>");
        await File.WriteAllTextAsync(Path.Combine(themeDir, "partials", "header.html"), "<header>ok</header>");

        var renderer = new ThemeRenderer(Options.Create(new ThemesOptions { RootPath = root }));
        var location = new ThemeLocation("minimal", themeDir, true);
        var html = await renderer.RenderPageAsync(
            location,
            "home",
            new Dictionary<string, string>
            {
                ["tenant.name"] = "<script>x</script>",
                ["properties"] = "<article>card</article>"
            },
            new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "properties" });

        Assert.Contains("&lt;script&gt;x&lt;/script&gt;", html);
        Assert.Contains("<article>card</article>", html);
        Assert.Contains("<header>ok</header>", html);
        Assert.DoesNotContain("partial:header", html);
    }
}
