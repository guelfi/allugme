using AlugueMe.Application.Visits;

namespace AlugueMe.UnitTests.Visits;

public class VisitSlotCalculatorTests
{
    private readonly VisitSlotCalculator _calculator = new();

    [Fact]
    public void CalculateSlots_respects_buffer_between_visits()
    {
        var date = new DateOnly(2026, 8, 4); // Tuesday
        var settings = new VisitSlotSettings(DurationMinutes: 60, BufferMinutes: 60);

        var visitStart = VisitSlotCalculator.ToUtc(date, new TimeOnly(10, 0));
        var visitEnd = visitStart.AddMinutes(60);
        var occupied = new[] { VisitSlotCalculator.FromVisit(visitStart, visitEnd, 60) };

        var slots = _calculator.CalculateSlots(date, settings, occupied);

        Assert.DoesNotContain(slots, s => s.Start == visitStart);
        Assert.DoesNotContain(slots, s => s.Start == visitStart.AddMinutes(30));
        Assert.Contains(slots, s => s.Start >= visitEnd.AddMinutes(60));
    }

    [Fact]
    public void CalculateSlots_returns_slots_within_working_hours()
    {
        var date = new DateOnly(2026, 8, 4);
        var settings = new VisitSlotSettings(60, 60);

        var slots = _calculator.CalculateSlots(date, settings, []);

        Assert.NotEmpty(slots);
        foreach (var slot in slots)
        {
            var local = VisitSlotCalculator.ToSaoPaulo(slot.Start);
            Assert.InRange(local.Hour, 9, 17);
        }
    }

    [Fact]
    public void CalculateSlots_excludes_calendar_blocks()
    {
        var date = new DateOnly(2026, 8, 4);
        var settings = new VisitSlotSettings(60, 60);
        var blockStart = VisitSlotCalculator.ToUtc(date, new TimeOnly(14, 0));
        var blockEnd = VisitSlotCalculator.ToUtc(date, new TimeOnly(16, 0));
        var occupied = new[] { new OccupiedInterval(blockStart, blockEnd) };

        var slots = _calculator.CalculateSlots(date, settings, occupied);

        Assert.DoesNotContain(slots, s => s.Start >= blockStart && s.Start < blockEnd);
    }
}
