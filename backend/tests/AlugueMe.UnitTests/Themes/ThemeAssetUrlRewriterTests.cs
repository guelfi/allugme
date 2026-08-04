using AlugueMe.Infrastructure.Themes;

namespace AlugueMe.UnitTests.Themes;

public class ThemeAssetUrlRewriterTests
{
    [Fact]
    public void Rewrite_RelativeParentAssets_UsesRootThemesPath()
    {
        var html = """
            <link rel="stylesheet" href="../assets/css/main.css" />
            <img src="../assets/img/hero.jpg" alt="" />
            <script src="../assets/js/main.js"></script>
            """;

        var result = ThemeAssetUrlRewriter.Rewrite(html, "moderno");

        Assert.Contains("href=\"/themes/moderno/assets/css/main.css\"", result);
        Assert.Contains("src=\"/themes/moderno/assets/img/hero.jpg\"", result);
        Assert.Contains("src=\"/themes/moderno/assets/js/main.js\"", result);
        Assert.DoesNotContain("../assets/", result);
    }

    [Fact]
    public void Rewrite_RootRelativeAssets_UsesThemePrefix()
    {
        var html = """<link rel="stylesheet" href="assets/css/main.css" />""";
        var result = ThemeAssetUrlRewriter.Rewrite(html, "porto");
        Assert.Equal("""<link rel="stylesheet" href="/themes/porto/assets/css/main.css" />""", result);
    }

    [Fact]
    public void Rewrite_OptionalThemesBasePath_PrefixesAssets()
    {
        var html = """<link rel="stylesheet" href="../assets/css/main.css" />""";
        var result = ThemeAssetUrlRewriter.Rewrite(html, "urbano", "/allugme");
        Assert.Contains("href=\"/allugme/themes/urbano/assets/css/main.css\"", result);
    }
}
