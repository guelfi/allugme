namespace AlugueMe.Application.Dtos.Settings;

public record TenantSettingsDto(
    int BufferMinutes,
    int VisitDurationMinutes,
    string? WhatsAppE164,
    string? EvolutionInstanceName,
    bool WhatsAppNotifyEnabled);

public record UpdateTenantSettingsRequest(
    int? BufferMinutes,
    int? VisitDurationMinutes,
    string? WhatsAppE164,
    string? EvolutionInstanceName,
    bool? WhatsAppNotifyEnabled);

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
