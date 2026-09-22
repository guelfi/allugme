using AlugueMe.Infrastructure.Security;

namespace AlugueMe.UnitTests.Security;

public class PrivateNetworkTests
{
    [Theory]
    [InlineData("http://192.168.15.50")]
    [InlineData("http://192.168.15.50:5173")]
    [InlineData("https://10.0.0.8")]
    [InlineData("http://172.16.0.1")]
    [InlineData("http://172.31.255.1:8080")]
    [InlineData("http://localhost")]
    [InlineData("http://localhost:5173")]
    [InlineData("http://127.0.0.1:3000")]
    [InlineData("http://[::1]")]
    [InlineData("http://[fd12:3456:789a::1]")]
    public void Allows_private_and_loopback_http_origins(string origin)
    {
        Assert.True(PrivateNetwork.IsAllowedDevelopmentOrigin(origin));
    }

    [Theory]
    [InlineData("https://app.allugme.online")]
    [InlineData("http://8.8.8.8")]
    [InlineData("https://evil.example")]
    [InlineData("http://172.32.0.1")]
    [InlineData("ftp://192.168.1.1")]
    [InlineData("http://169.254.1.1")]
    [InlineData("")]
    public void Rejects_non_private_origins(string origin)
    {
        Assert.False(PrivateNetwork.IsAllowedDevelopmentOrigin(origin));
    }

    [Fact]
    public void Production_list_keeps_previous_explicit_origins()
    {
        Assert.Equal(
        [
            "http://localhost",
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://192.168.15.119",
            "http://129.153.86.168",
            "https://allugme.com.br",
            "https://www.allugme.com.br",
            "https://allugme.online",
            "https://www.allugme.online",
            "https://app.allugme.online"
        ], ProductionCorsOrigins.Values);
    }
}
