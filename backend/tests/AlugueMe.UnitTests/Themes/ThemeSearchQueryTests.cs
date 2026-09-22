using AlugueMe.Application.Themes;
using AlugueMe.Domain.Enums;

namespace AlugueMe.UnitTests.Themes;

public class ThemeSearchQueryTests
{
    [Fact]
    public void Maps_portuguese_and_english_aliases()
    {
        var query = ThemeSearchQuery.From(new Dictionary<string, string?>
        {
            ["cidade"] = "São Paulo",
            ["bairro"] = "Pinheiros",
            ["operacao"] = "alugar",
            ["valor_max"] = "4000",
            ["quartos"] = "2"
        });

        Assert.Equal("São Paulo", query.City);
        Assert.Equal("Pinheiros", query.Neighborhood);
        Assert.Equal(4000m, query.MaxPrice);
        Assert.Equal(2, query.Bedrooms);
        Assert.Equal(PropertyOperation.Rent, query.Operation);
    }

    [Fact]
    public void Empty_operation_means_all()
    {
        var query = ThemeSearchQuery.From(new Dictionary<string, string?> { ["city"] = "Santos" });
        Assert.Null(query.Operation);
        Assert.Equal("Santos", query.City);
    }

    [Fact]
    public void Parses_property_id_aliases()
    {
        var id = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        var parsed = ThemeSearchQuery.ParsePropertyId(new Dictionary<string, string?>
        {
            ["propertyId"] = id.ToString()
        });
        Assert.Equal(id, parsed);
    }
}
