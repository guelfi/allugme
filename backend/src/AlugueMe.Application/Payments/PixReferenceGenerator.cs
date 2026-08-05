using System.Security.Cryptography;
using System.Text;

namespace AlugueMe.Application.Payments;

/// <summary>Gera um código curto e legível para conciliação manual do Pix estático (ex.: ALG7K9QX2P).</summary>
public static class PixReferenceGenerator
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I para evitar ambiguidade

    public static string Generate()
    {
        var bytes = RandomNumberGenerator.GetBytes(8);
        var sb = new StringBuilder("ALG", 11);
        foreach (var b in bytes)
            sb.Append(Alphabet[b % Alphabet.Length]);
        return sb.ToString();
    }
}
