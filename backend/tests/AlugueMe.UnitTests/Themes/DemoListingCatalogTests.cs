using AlugueMe.Infrastructure.Persistence.Seed;

namespace AlugueMe.UnitTests.Themes;

public class DemoListingCatalogTests
{
    [Fact]
    public void Every_listing_has_a_unique_title_and_photo()
    {
        Assert.Equal(15, DemoListingCatalog.All.Count);
        Assert.Equal(15, DemoListingCatalog.All.Select(x => x.Title).Distinct().Count());
        Assert.Equal(15, DemoListingCatalog.All.Select(x => x.PhotoFile).Distinct().Count());
    }

    [Fact]
    public void Each_demo_tenant_has_three_listings()
    {
        foreach (var slug in new[] { "horizon", "vista-urbana", "casa-tradicao", "atlas", "porto-lar" })
            Assert.Equal(3, DemoListingCatalog.ForTenant(slug).Count);
    }
}
