using AlugueMe.Application.Themes;
using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;

namespace AlugueMe.UnitTests.Themes;

public class ThemeActivationTests
{
    [Fact]
    public void Official_keys_can_activate()
    {
        Assert.True(ThemeActivation.CanActivate("moderno", null, Guid.NewGuid()));
        Assert.True(ThemeActivation.CanActivate("porto", null, Guid.NewGuid()));
    }

    [Fact]
    public void Custom_key_requires_approved_submission_of_same_tenant()
    {
        var tenantId = Guid.NewGuid();
        var submission = new CustomThemeSubmission
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Status = CustomThemeStatus.Approved
        };

        Assert.True(ThemeActivation.CanActivate(submission.ThemeKey, submission, tenantId));
        Assert.False(ThemeActivation.CanActivate(submission.ThemeKey, submission, Guid.NewGuid()));

        submission.Status = CustomThemeStatus.Pending;
        Assert.False(ThemeActivation.CanActivate(submission.ThemeKey, submission, tenantId));
    }

    [Fact]
    public void Unknown_key_is_rejected()
    {
        Assert.False(ThemeActivation.CanActivate("hacked-theme", null, Guid.NewGuid()));
    }
}
