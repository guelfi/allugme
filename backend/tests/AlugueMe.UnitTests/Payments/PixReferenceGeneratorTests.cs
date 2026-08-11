using AlugueMe.Application.Payments;

namespace AlugueMe.UnitTests.Payments;

public class PixReferenceGeneratorTests
{
    [Fact]
    public void Generate_uses_expected_prefix_length_and_unambiguous_alphabet()
    {
        var reference = PixReferenceGenerator.Generate();

        Assert.StartsWith("ALG", reference);
        Assert.Equal(11, reference.Length);
        Assert.Matches("^ALG[A-HJ-NP-Z2-9]{8}$", reference);
    }

    [Fact]
    public void Generate_produces_distinct_references_in_sample()
    {
        var references = Enumerable.Range(0, 100)
            .Select(_ => PixReferenceGenerator.Generate())
            .ToHashSet(StringComparer.Ordinal);

        Assert.Equal(100, references.Count);
    }
}
