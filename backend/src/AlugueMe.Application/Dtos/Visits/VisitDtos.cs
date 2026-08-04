namespace AlugueMe.Application.Dtos.Visits;

public record VisitSlotDto(DateTime StartAt, DateTime EndAt);

public record VisitSlotsResponse(IReadOnlyList<VisitSlotDto> Slots);

public record CreateVisitRequest(
    Guid PropertyId,
    string VisitorName,
    string VisitorPhone,
    string? VisitorEmail,
    DateTime StartAt);

public record VisitDto(
    Guid Id,
    Guid PropertyId,
    string PropertyTitle,
    Guid TenantId,
    Guid BrokerId,
    string BrokerName,
    string VisitorName,
    string VisitorPhone,
    string? VisitorEmail,
    DateTime StartAt,
    DateTime EndAt,
    int BufferMinutesApplied,
    string Status,
    string ConfirmationCode,
    DateTime? NotifiedAt,
    string? ConfirmedVia,
    DateTime CreatedAt);

public record PatchVisitRequest(string Status);

public record CalendarBlockDto(
    Guid Id,
    Guid BrokerId,
    DateTime StartAt,
    DateTime EndAt,
    string? Reason);

public record CreateCalendarBlockRequest(
    DateTime StartAt,
    DateTime EndAt,
    string? Reason);
