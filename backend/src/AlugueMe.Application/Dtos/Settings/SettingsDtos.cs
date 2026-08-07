namespace AlugueMe.Application.Dtos.Settings;

public record TenantSettingsDto(
    int BufferMinutes,
    int VisitDurationMinutes,
    string? WhatsAppE164,
    string? EvolutionInstanceName,
    bool WhatsAppNotifyEnabled,
    bool EmailNotifyEnabled);

public record UpdateTenantSettingsRequest(
    int? BufferMinutes,
    int? VisitDurationMinutes,
    string? WhatsAppE164,
    string? EvolutionInstanceName,
    bool? WhatsAppNotifyEnabled,
    bool? EmailNotifyEnabled);

public record BrokerSettingsDto(
    int? BufferMinutes,
    int? VisitDurationMinutes,
    string? WhatsAppE164,
    bool? WhatsAppNotifyEnabled);

public record UpdateBrokerSettingsRequest(
    int? BufferMinutes,
    int? VisitDurationMinutes,
    string? WhatsAppE164,
    bool? WhatsAppNotifyEnabled);

public record WhatsAppTestRequest(string ToE164, string? Message);

public record AvailabilityRuleDto(
    int DayOfWeek,
    string StartTime,
    string EndTime,
    bool IsClosed);

public record AvailabilityRulesResponse(IReadOnlyList<AvailabilityRuleDto> Rules);

public record UpdateAvailabilityRulesRequest(IReadOnlyList<AvailabilityRuleDto> Rules);
