namespace AlugueMe.Application.Dtos.Payments;

public record PixQuoteRequest(
    /// <summary>agency | independent</summary>
    string AccountType,
    /// <summary>monthly | yearly</summary>
    string Plan);

public record PixQuoteResponse(
    decimal Amount,
    string PlanLabel,
    string PixKey,
    string MerchantName,
    string MerchantCity,
    string TxId,
    string CopyPaste,
    string QrCodePngBase64);
