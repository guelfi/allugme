using AlugueMe.Infrastructure.Themes;

namespace AlugueMe.UnitTests.Themes;

public class ThemeAssetUrlRewriterTests
{
    [Fact]
    public void Rewrite_RelativeParentAssets_UsesPublicBaseAndThemeKey()
    {
        var html = """
            <link rel="stylesheet" href="../assets/css/main.css" />
            <img src="../assets/img/hero.jpg" alt="" />
            <script src="../assets/js/main.js"></script>
            """;

        var result = ThemeAssetUrlRewriter.Rewrite(html, "moderno", "/allugme");

        Assert.Contains("href=\"/allugme/themes/moderno/assets/css/main.css\"", result);
        Assert.Contains("src=\"/allugme/themes/moderno/assets/img/hero.jpg\"", result);
        Assert.Contains("src=\"/allugme/themes/moderno/assets/js/main.js\"", result);
        Assert.DoesNotContain("../assets/", result);
    }

    [Fact]
    public void Rewrite_RootRelativeAssets_UsesThemePrefix()
    {
        var html = """<link rel="stylesheet" href="assets/css/main.css" />""";
        var result = ThemeAssetUrlRewriter.Rewrite(html, "porto", "/allugme");
        Assert.Equal("""<link rel="stylesheet" href="/allugme/themes/porto/assets/css/main.css" />""", result);
    }
}
