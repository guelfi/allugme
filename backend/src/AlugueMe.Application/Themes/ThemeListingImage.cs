using AlugueMe.Application.Interfaces;

namespace AlugueMe.Application.Themes;

public static class ThemeListingImage
{
    public const int VariantCount = 6;

    public static int VariantFor(Guid propertyId)
    {
        var bytes = propertyId.ToByteArray();
        var n = BitConverter.ToUInt32(bytes, 0);
        return (int)(n % VariantCount) + 1;
    }

    public static string FallbackUrl(ThemeLocation? location, int variant = 1)
    {
        var n = variant is >= 1 and <= VariantCount ? variant : 1;
        if (location is not null)
        {
            var local = Path.Combine(location.RootDirectory, "assets", "img", $"imovel-{n}.jpg");
            if (File.Exists(local))
                return $"/themes/{location.PublicAssetKey}/assets/img/imovel-{n}.jpg";

            var first = Path.Combine(location.RootDirectory, "assets", "img", "imovel-1.jpg");
            if (File.Exists(first))
                return $"/themes/{location.PublicAssetKey}/assets/img/imovel-1.jpg";
        }

        return $"/themes/moderno/assets/img/imovel-{n}.jpg";
    }
}
