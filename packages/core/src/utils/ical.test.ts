import { describe, it, expect } from "vitest";
import { eventsToICal } from "./ical";
import type { CalendarEvent } from "../types";

const makeEvent = (
  id: string,
  start: string,
  end: string,
  allDay = false,
): CalendarEvent => ({
  id,
  title: `Event ${id}`,
  start,
  end,
  allDay,
});

describe("eventsToICal", () => {
  it("produces valid VCALENDAR wrapper", () => {
    const result = eventsToICal([]);
    expect(result).toContain("BEGIN:VCALENDAR");
    expect(result).toContain("VERSION:2.0");
    expect(result).toContain("PRODID:-//trud-calendar//EN");
    expect(result).toContain("CALSCALE:GREGORIAN");
    expect(result).toContain("METHOD:PUBLISH");
    expect(result).toContain("END:VCALENDAR");
  });

  it("handles empty event array", () => {
    const result = eventsToICal([]);
    expect(result).not.toContain("BEGIN:VEVENT");
    expect(result).not.toContain("END:VEVENT");
  });

  it("formats DTSTART/DTEND correctly for timed events", () => {
    const events = [makeEvent("1", "2024-06-15T09:30:00", "2024-06-15T11:00:00")];
    const result = eventsToICal(events);
    expect(result).toContain("DTSTART:20240615T093000");
    expect(result).toContain("DTEND:20240615T110000");
  });

  it("uses VALUE=DATE for all-day events", () => {
    const events = [makeEvent("1", "2024-06-15T00:00:00", "2024-06-15T23:59:00", true)];
    const result = eventsToICal(events);
    expect(result).toContain("DTSTART;VALUE=DATE:20240615");
    expect(result).toContain("DTEND;VALUE=DATE:20240615");
    // Should NOT contain bare DTSTART: with time format
    expect(result).not.toMatch(/DTSTART:20240615T/);
  });

  it("includes RRULE for daily recurring events", () => {
    const events: CalendarEvent[] = [
      {
        ...makeEvent("1", "2024-06-15T09:00:00", "2024-06-15T10:00:00"),
        recurrence: { freq: "daily", count: 5 },
      },
    ];
    const result = eventsToICal(events);
    expect(result).toContain("RRULE:FREQ=DAILY;COUNT=5");
  });

  it("includes RRULE for weekly recurring events with byDay", () => {
    const events: CalendarEvent[] = [
      {
        ...makeEvent("1", "2024-06-15T09:00:00", "2024-06-15T10:00:00"),
        recurrence: { freq: "weekly", interval: 2, byDay: ["MO", "WE", "FR"] },
      },
    ];
    const result = eventsToICal(events);
    expect(result).toContain("RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR");
  });

  it("includes EXDATE for events with exception dates", () => {
    const events: CalendarEvent[] = [
      {
        ...makeEvent("1", "2024-06-15T09:00:00", "2024-06-15T10:00:00"),
        recurrence: { freq: "daily" },
        exDates: ["2024-06-17", "2024-06-20"],
      },
    ];
    const result = eventsToICal(events);
    expect(result).toContain("EXDATE;VALUE=DATE:20240617,20240620");
  });

  it("escapes special characters in SUMMARY", () => {
    const events: CalendarEvent[] = [
      {
        id: "1",
        title: "Meeting; with, backslash\\ and\nnewline",
        start: "2024-06-15T09:00:00",
        end: "2024-06-15T10:00:00",
      },
    ];
    const result = eventsToICal(events);
    expect(result).toContain("SUMMARY:Meeting\\; with\\, backslash\\\\ and\\nnewline");
  });

  it("uses custom calendar name in PRODID", () => {
    const result = eventsToICal([], "My Calendar");
    expect(result).toContain("PRODID:-//My Calendar//EN");
  });

  it("wraps each event in VEVENT block with UID", () => {
    const events = [
      makeEvent("abc-123", "2024-06-15T09:00:00", "2024-06-15T10:00:00"),
    ];
    const result = eventsToICal(events);
    expect(result).toContain("BEGIN:VEVENT");
    expect(result).toContain("UID:abc-123");
    expect(result).toContain("END:VEVENT");
  });
});
