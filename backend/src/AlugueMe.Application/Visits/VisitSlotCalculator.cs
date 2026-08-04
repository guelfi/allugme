namespace AlugueMe.Application.Visits;

public record OccupiedInterval(DateTime Start, DateTime End);

public record VisitSlotSettings(int DurationMinutes, int BufferMinutes);

public class VisitSlotCalculator
{
    private static readonly TimeZoneInfo SaoPauloTz =
        TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows() ? "E. South America Standard Time" : "America/Sao_Paulo");

    public IReadOnlyList<(DateTime Start, DateTime End)> CalculateSlots(
        DateOnly date,
        VisitSlotSettings settings,
        IEnumerable<OccupiedInterval> occupiedIntervals,
        TimeSpan step = default,
        TimeOnly workStart = default,
        TimeOnly workEnd = default)
    {
        step = step == default ? TimeSpan.FromMinutes(30) : step;
        workStart = workStart == default ? new TimeOnly(9, 0) : workStart;
        workEnd = workEnd == default ? new TimeOnly(18, 0) : workEnd;

        var occupied = occupiedIntervals
            .Select(i => (Start: i.Start, End: i.End))
            .OrderBy(i => i.Start)
            .ToList();

        var dayStart = ToUtc(date, workStart);
        var dayEnd = ToUtc(date, workEnd);
        var duration = TimeSpan.FromMinutes(settings.DurationMinutes);
        var buffer = TimeSpan.FromMinutes(settings.BufferMinutes);
        var slotSpan = duration + buffer;

        var slots = new List<(DateTime Start, DateTime End)>();
        var cursor = dayStart;

        while (cursor + duration <= dayEnd)
        {
            var slotEnd = cursor + duration;
            var occupiedEnd = cursor + slotSpan;

            if (!Intersects(cursor, occupiedEnd, occupied))
            {
                slots.Add((cursor, slotEnd));
            }

            cursor += step;
        }

        return slots;
    }

    public static DateTime ToUtc(DateOnly date, TimeOnly time)
    {
        var local = date.ToDateTime(time, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(local, SaoPauloTz);
    }

    public static DateTime ToSaoPaulo(DateTime utc)
    {
        return TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(utc, DateTimeKind.Utc), SaoPauloTz);
    }

    public static OccupiedInterval FromVisit(DateTime startAt, DateTime endAt, int bufferMinutesApplied)
        => new(startAt, endAt.AddMinutes(bufferMinutesApplied));

    private static bool Intersects(DateTime start, DateTime end, List<(DateTime Start, DateTime End)> occupied)
    {
        foreach (var interval in occupied)
        {
            if (start < interval.End && end > interval.Start)
                return true;
        }

        return false;
    }
}
