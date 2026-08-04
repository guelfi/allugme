using AlugueMe.Application.WhatsApp;

namespace AlugueMe.UnitTests.WhatsApp;

public class WhatsAppReplyParserTests
{
    [Theory]
    [InlineData("SIM ABC123", WhatsAppReplyAction.Confirm, "ABC123")]
    [InlineData("sim abc123", WhatsAppReplyAction.Confirm, "ABC123")]
    [InlineData("NAO XYZ9", WhatsAppReplyAction.Reject, "XYZ9")]
    [InlineData("nao 1234ABCD", WhatsAppReplyAction.Reject, "1234ABCD")]
    public void TryParse_valid_commands(string input, WhatsAppReplyAction expectedAction, string expectedCode)
    {
        var result = WhatsAppReplyParser.TryParse(input);

        Assert.NotNull(result);
        Assert.Equal(expectedAction, result!.Action);
        Assert.Equal(expectedCode, result.ConfirmationCode);
    }

    [Theory]
    [InlineData("SIM")]
    [InlineData("CONFIRMAR ABC123")]
    [InlineData("SIM ABC123 EXTRA")]
    [InlineData("")]
    public void TryParse_invalid_commands_returns_null(string input)
    {
        Assert.Null(WhatsAppReplyParser.TryParse(input));
    }
}
