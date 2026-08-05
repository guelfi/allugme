namespace AlugueMe.Application.Interfaces;

public interface IQrCodeGenerator
{
    /// <summary>Gera um PNG (bytes) do QR Code para o conteúdo informado.</summary>
    byte[] GeneratePng(string content, int pixelsPerModule = 8);
}
