using AlugueMe.Domain.Entities;
using AlugueMe.Domain.Enums;

namespace AlugueMe.Application.Themes;

public static class ThemeActivation
{
    public static bool CanActivate(string themeKey, CustomThemeSubmission? submission, Guid tenantId)
    {
        if (OfficialThemeCatalog.IsOfficial(themeKey))
            return true;

        if (!OfficialThemeCatalog.TryParseCustomKey(themeKey, out var submissionId))
            return false;

        return submission is not null
            && submission.Id == submissionId
            && submission.TenantId == tenantId
            && submission.Status == CustomThemeStatus.Approved;
    }
}
