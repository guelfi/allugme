using System.Text.Json;
using AlugueMe.Application.Dtos.Settings;

namespace AlugueMe.UnitTests.Settings;

public class WhatsAppTestRequestSerializationTests
{
    [Fact]
    public void Deserialize_accepts_frontend_camel_case_contract()
    {
        const string json = """{"toE164":"+5511999999999","message":"teste"}""";

        var request = JsonSerializer.Deserialize<WhatsAppTestRequest>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(request);
        Assert.Equal("+5511999999999", request.ToE164);
        Assert.Equal("teste", request.Message);
    }
}
