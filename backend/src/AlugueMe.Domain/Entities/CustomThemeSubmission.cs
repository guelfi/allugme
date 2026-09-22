using AlugueMe.Domain.Enums;

namespace AlugueMe.Domain.Entities;

public class CustomThemeSubmission
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public int Version { get; set; }
    public CustomThemeStatus Status { get; set; } = CustomThemeStatus.Pending;
    public string OriginalFileName { get; set; } = string.Empty;
    public string StorageFolder { get; set; } = string.Empty;
    public string? ReviewNotes { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }

    public Tenant Tenant { get; set; } = null!;

    public string ThemeKey => $"custom:{Id:N}";
}
