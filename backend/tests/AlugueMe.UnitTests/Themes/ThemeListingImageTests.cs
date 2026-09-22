using AlugueMe.Application.Interfaces;
using AlugueMe.Application.Themes;

namespace AlugueMe.UnitTests.Themes;

public class ThemeListingImageTests
{
    [Fact]
    public void VariantFor_stays_between_1_and_6()
    {
        for (var i = 0; i < 40; i++)
        {
            var variant = ThemeListingImage.VariantFor(Guid.NewGuid());
            Assert.InRange(variant, 1, ThemeListingImage.VariantCount);
        }
    }

    [Fact]
    public void FallbackUrl_uses_theme_file_when_present()
    {
        var root = Path.Combine(Path.GetTempPath(), $"allugme-theme-{Guid.NewGuid():N}");
        var img = Path.Combine(root, "assets", "img");
        Directory.CreateDirectory(img);
        File.WriteAllBytes(Path.Combine(img, "imovel-2.jpg"), [1, 2, 3]);

        var url = ThemeListingImage.FallbackUrl(new ThemeLocation("porto", root, true), 2);

        Assert.Equal("/themes/porto/assets/img/imovel-2.jpg", url);
        Directory.Delete(root, recursive: true);
    }

    [Fact]
    public void FallbackUrl_uses_moderno_when_theme_has_no_photos()
    {
        var url = ThemeListingImage.FallbackUrl(new ThemeLocation("porto", "/tmp/does-not-exist", true), 3);
        Assert.Equal("/themes/moderno/assets/img/imovel-3.jpg", url);
    }
}
