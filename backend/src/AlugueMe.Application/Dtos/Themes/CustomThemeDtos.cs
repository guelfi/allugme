namespace AlugueMe.Application.Dtos.Themes;

public record CustomThemeSubmissionDto(
    Guid Id,
    Guid TenantId,
    string TenantName,
    int Version,
    string Status,
    string ThemeKey,
    string OriginalFileName,
    string? ReviewNotes,
    DateTime SubmittedAt,
    DateTime? ReviewedAt);

public record ReviewCustomThemeRequest(string Decision, string? Notes);

public record ThemeModelResponse(
    IReadOnlyList<string> OfficialKeys,
    IReadOnlyList<string> RequiredFiles,
    IReadOnlyList<string> RequiredPages,
    IReadOnlyList<string> RequiredPlaceholders,
    string Notes);
