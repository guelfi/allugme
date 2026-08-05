using AlugueMe.Application.Interfaces;
using QRCoder;

namespace AlugueMe.Infrastructure.Payments;

/// <summary>Gera PNGs de QR Code sem depender de System.Drawing (compatível com Linux/containers).</summary>
public class QrCodeImageGenerator : IQrCodeGenerator
{
    public byte[] GeneratePng(string content, int pixelsPerModule = 8) =>
        PngByteQRCodeHelper.GetQRCode(content, QRCodeGenerator.ECCLevel.M, pixelsPerModule);
}
