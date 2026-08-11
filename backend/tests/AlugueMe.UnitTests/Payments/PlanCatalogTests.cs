using AlugueMe.Application.Payments;

namespace AlugueMe.UnitTests.Payments;

public class PlanCatalogTests
{
    [Theory]
    [InlineData("independent")]
    [InlineData(" CORRETOR ")]
    [InlineData("Broker")]
    public void IsIndependent_accepts_supported_aliases(string accountType)
    {
        Assert.True(PlanCatalog.IsIndependent(accountType));
    }

    [Theory]
    [InlineData("independent", "monthly", 49)]
    [InlineData("broker", "yearly", 490)]
    [InlineData("agency", "monthly", 99)]
    [InlineData("agency", "yearly", 900)]
    public void GetAmount_returns_catalog_price(string accountType, string plan, int expected)
    {
        Assert.Equal((decimal)expected, PlanCatalog.GetAmount(accountType, plan));
    }

    [Fact]
    public void GetLabel_matches_selected_account_type_and_period()
    {
        var label = PlanCatalog.GetLabel("independent", "yearly");

        Assert.Contains("Anual", label);
        Assert.Contains("corretor independente", label);
        Assert.Contains("490,00", label);
    }
}
