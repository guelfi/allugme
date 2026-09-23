using AlugueMe.Infrastructure.Themes;

namespace AlugueMe.UnitTests.Themes;

public class VitrineFaviconTests
{
    [Fact]
    public void Ensure_Inserts_platform_icon_when_head_has_none()
    {
        var html = "<html><head><title>x</title></head><body></body></html>";
        var result = VitrineFavicon.Ensure(html);

        Assert.Contains($"href=\"{VitrineFavicon.PlatformHref}\"", result);
        Assert.Contains("rel=\"icon\"", result);
        Assert.Contains("type=\"image/svg+xml\"", result);
    }

    [Fact]
    public void Ensure_Keeps_existing_icon_link()
    {
        var html = """<html><head><link rel="icon" href="/custom.ico" /></head></html>""";
        var result = VitrineFavicon.Ensure(html, "/themes/_platform/favicon.svg");

        Assert.Contains("href=\"/custom.ico\"", result);
        Assert.DoesNotContain(VitrineFavicon.PlatformHref, result);
    }

    [Fact]
    public void Ensure_Uses_explicit_href_for_future_tenant_override()
    {
        var html = "<html><head></head></html>";
        var result = VitrineFavicon.Ensure(html, "/media/tenant-favicon.svg");

        Assert.Contains("href=\"/media/tenant-favicon.svg\"", result);
        Assert.DoesNotContain(VitrineFavicon.PlatformHref, result);
    }
}
