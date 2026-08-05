using System.Globalization;
using System.Text;

namespace AlugueMe.Application.Payments;

/// <summary>
/// Monta o payload "Pix copia e cola" (BR Code / EMV QRCPS-MPM) para uma chave Pix estática,
/// conforme o Manual de Padrões para Iniciação do Pix (Bacen). Não depende de gateway/PSP.
/// </summary>
public static class PixBrCodeBuilder
{
    public static string Build(string pixKey, string merchantName, string merchantCity, decimal amount, string? txId)
    {
        var merchantAccountInfo = Tlv("26", Tlv("00", "br.gov.bcb.pix") + Tlv("01", pixKey));
        var additionalData = Tlv("62", Tlv("05", NormalizeTxId(txId)));

        var withoutCrc =
            Tlv("00", "01") +
            Tlv("01", "11") +
            merchantAccountInfo +
            Tlv("52", "0000") +
            Tlv("53", "986") +
            Tlv("54", amount.ToString("F2", CultureInfo.InvariantCulture)) +
            Tlv("58", "BR") +
            Tlv("59", Truncate(NormalizeAscii(merchantName), 25)) +
            Tlv("60", Truncate(NormalizeAscii(merchantCity), 15)) +
            additionalData +
            "6304";

        return withoutCrc + Crc16Ccitt(withoutCrc);
    }

    private static string Tlv(string id, string value) => $"{id}{value.Length:D2}{value}";

    private static string NormalizeTxId(string? txId)
    {
        if (string.IsNullOrWhiteSpace(txId))
            return "***";
        var sb = new StringBuilder();
        foreach (var c in txId)
            if (char.IsLetterOrDigit(c))
                sb.Append(c);
        var sanitized = sb.ToString();
        return Truncate(string.IsNullOrEmpty(sanitized) ? "***" : sanitized, 25);
    }

    private static string NormalizeAscii(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        return sb.ToString().Normalize(NormalizationForm.FormC).ToUpperInvariant();
    }

    private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max];

    private static string Crc16Ccitt(string payload)
    {
        var crc = 0xFFFF;
        foreach (var b in Encoding.ASCII.GetBytes(payload))
        {
            crc ^= b << 8;
            for (var i = 0; i < 8; i++)
                crc = (crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1;
            crc &= 0xFFFF;
        }
        return crc.ToString("X4", CultureInfo.InvariantCulture);
    }
}
