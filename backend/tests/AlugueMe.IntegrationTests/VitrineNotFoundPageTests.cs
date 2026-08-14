using AlugueMe.Api.Pages;

namespace AlugueMe.IntegrationTests;

public class VitrineNotFoundPageTests
{
    [Fact]
    public void Render_includes_brand_message_and_home_action()
    {
        var html = VitrineNotFoundPage.Render("https://allugme.online/");

        Assert.Contains("<title>Vitrine não encontrada — Allugme</title>", html);
        Assert.Contains("Vitrine não encontrada", html);
        Assert.Contains("href=\"https://allugme.online\"", html);
        Assert.Contains("Ir para a página principal", html);
        Assert.Contains("noindex, nofollow", html);
    }

    [Fact]
    public void Render_encodes_the_configured_home_url()
    {
        var html = VitrineNotFoundPage.Render("https://example.test/?next=\"unsafe\"");

        Assert.DoesNotContain("href=\"https://example.test/?next=\"unsafe\"\"", html);
        Assert.Contains("&quot;unsafe&quot;", html);
    }
}
