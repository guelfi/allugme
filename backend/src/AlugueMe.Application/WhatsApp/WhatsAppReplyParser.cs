using System.Text.RegularExpressions;

namespace AlugueMe.Application.WhatsApp;

public enum WhatsAppReplyAction
{
    Confirm,
    Reject
}

public record WhatsAppReplyParseResult(WhatsAppReplyAction Action, string ConfirmationCode);

public static partial class WhatsAppReplyParser
{
    [GeneratedRegex(@"^(SIM|NAO)\s+([A-Z0-9]{4,8})$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ReplyPattern();

    public static WhatsAppReplyParseResult? TryParse(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return null;

        var normalized = text.Trim();
        var match = ReplyPattern().Match(normalized);
        if (!match.Success)
            return null;

        var verb = match.Groups[1].Value.ToUpperInvariant();
        var code = match.Groups[2].Value.ToUpperInvariant();
        var action = verb == "SIM" ? WhatsAppReplyAction.Confirm : WhatsAppReplyAction.Reject;
        return new WhatsAppReplyParseResult(action, code);
    }
}
