using AlugueMe.Infrastructure.Urls;

namespace AlugueMe.UnitTests.Urls;

public class DashboardUrlTests
{
    private const string Configured = "http://192.168.15.119/allugme";

    [Fact]
    public void Production_always_uses_configured_url()
    {
        var result = DashboardUrl.Resolve(
            Configured,
            isDevelopment: false,
            scheme: "http",
            hostHeader: "10.0.0.4",
            publicBasePath: "/allugme");

        Assert.Equal(Configured, result);
    }

    [Fact]
    public void Development_without_request_uses_configured_url()
    {
        var result = DashboardUrl.Resolve(
            Configured,
            isDevelopment: true,
            scheme: null,
            hostHeader: null,
            publicBasePath: "/allugme");

        Assert.Equal(Configured, result);
    }

    [Fact]
    public void Development_ignores_untrusted_host_header()
    {
        var result = DashboardUrl.Resolve(
            "https://app.allugme.online",
            isDevelopment: true,
            scheme: "https",
            hostHeader: "evil.example",
            publicBasePath: "/allugme");

        Assert.Equal("https://app.allugme.online", result);
    }

    [Fact]
    public void Development_derives_from_private_lan_host()
    {
        var result = DashboardUrl.Resolve(
            Configured,
            isDevelopment: true,
            scheme: "http",
            hostHeader: "192.168.15.40",
            publicBasePath: "/allugme");

        Assert.Equal("http://192.168.15.40/allugme", result);
    }

    [Fact]
    public void Development_keeps_non_default_port()
    {
        var result = DashboardUrl.Resolve(
            Configured,
            isDevelopment: true,
            scheme: "https, http",
            hostHeader: "10.1.1.8:8443",
            publicBasePath: "/allugme");

        Assert.Equal("https://10.1.1.8:8443/allugme", result);
    }
}
