import { describe, it, expect } from "vitest";
import {
  parseDate,
  toDateString,
  toDateTimeString,
  addDays,
  addMonths,
  addWeeks,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
  rangesOverlap,
  dateInRange,
  daysBetween,
  eachDayOfRange,
  getWeekDays,
  getMonthViewRange,
  getWeekViewRange,
  getVisibleRange,
  getTimeOfDay,
  getDurationHours,
  getHourLabels,
} from "./date";

describe("parseDate", () => {
  it("parses date-only strings as local time", () => {
    const d = parseDate("2024-06-15");
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(5); // 0-indexed
    expect(d.getDate()).toBe(15);
  });

  it("parses datetime strings", () => {
    const d = parseDate("2024-06-15T14:30:00");
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(30);
  });
});

describe("toDateString", () => {
  it("formats date as YYYY-MM-DD", () => {
    expect(toDateString(new Date(2024, 0, 5))).toBe("2024-01-05");
    expect(toDateString(new Date(2024, 11, 25))).toBe("2024-12-25");
  });
});

describe("toDateTimeString", () => {
  it("formats date as ISO datetime", () => {
    const d = new Date(2024, 5, 15, 9, 30, 0);
    expect(toDateTimeString(d)).toBe("2024-06-15T09:30:00");
  });
});

describe("addDays", () => {
  it("adds positive days", () => {
    expect(addDays("2024-01-30", 3)).toBe("2024-02-02");
  });
  it("adds negative days", () => {
    expect(addDays("2024-02-02", -3)).toBe("2024-01-30");
  });
  it("crosses month boundaries", () => {
    expect(addDays("2024-01-31", 1)).toBe("2024-02-01");
  });
});

describe("addMonths", () => {
  it("adds months", () => {
    expect(addMonths("2024-01-15", 1)).toBe("2024-02-15");
    expect(addMonths("2024-12-15", 1)).toBe("2025-01-15");
  });
  it("subtracts months", () => {
    expect(addMonths("2024-03-15", -1)).toBe("2024-02-15");
  });
});

describe("addWeeks", () => {
  it("adds weeks", () => {
    expect(addWeeks("2024-01-01", 1)).toBe("2024-01-08");
    expect(addWeeks("2024-01-01", 2)).toBe("2024-01-15");
  });
});

describe("startOfWeek", () => {
  it("returns Sunday for weekStartsOn=0", () => {
    // 2024-06-12 is Wednesday
    expect(startOfWeek("2024-06-12", 0)).toBe("2024-06-09");
  });
  it("returns Monday for weekStartsOn=1", () => {
    expect(startOfWeek("2024-06-12", 1)).toBe("2024-06-10");
  });
  it("returns same day if already start of week", () => {
    // 2024-06-09 is Sunday
    expect(startOfWeek("2024-06-09", 0)).toBe("2024-06-09");
  });
});

describe("startOfMonth / endOfMonth", () => {
  it("returns first day of month", () => {
    expect(startOfMonth("2024-06-15")).toBe("2024-06-01");
  });
  it("returns last day of month", () => {
    expect(endOfMonth("2024-02-15")).toBe("2024-02-29"); // 2024 is leap year
    expect(endOfMonth("2023-02-15")).toBe("2023-02-28");
    expect(endOfMonth("2024-06-15")).toBe("2024-06-30");
  });
});

describe("isSameDay", () => {
  it("returns true for same day", () => {
    expect(isSameDay("2024-06-15", "2024-06-15")).toBe(true);
    expect(isSameDay("2024-06-15T10:00:00", "2024-06-15T22:00:00")).toBe(true);
  });
  it("returns false for different days", () => {
    expect(isSameDay("2024-06-15", "2024-06-16")).toBe(false);
  });
});

describe("isSameMonth", () => {
  it("returns true for same month", () => {
    expect(isSameMonth("2024-06-01", "2024-06-30")).toBe(true);
  });
  it("returns false for different months", () => {
    expect(isSameMonth("2024-06-01", "2024-07-01")).toBe(false);
  });
});

describe("isBefore / isAfter", () => {
  it("compares dates correctly", () => {
    expect(isBefore("2024-01-01", "2024-01-02")).toBe(true);
    expect(isBefore("2024-01-02", "2024-01-01")).toBe(false);
    expect(isAfter("2024-01-02", "2024-01-01")).toBe(true);
  });
});

describe("rangesOverlap", () => {
  it("detects overlapping ranges", () => {
    expect(
      rangesOverlap(
        "2024-06-15T10:00:00",
        "2024-06-15T12:00:00",
        "2024-06-15T11:00:00",
        "2024-06-15T13:00:00",
      ),
    ).toBe(true);
  });
  it("detects non-overlapping ranges", () => {
    expect(
      rangesOverlap(
        "2024-06-15T10:00:00",
        "2024-06-15T12:00:00",
        "2024-06-15T12:00:00",
        "2024-06-15T14:00:00",
      ),
    ).toBe(false);
  });
});

describe("dateInRange", () => {
  it("checks if date is in range", () => {
    expect(dateInRange("2024-06-15", "2024-06-01", "2024-06-30")).toBe(true);
    expect(dateInRange("2024-07-01", "2024-06-01", "2024-06-30")).toBe(false);
  });
});

describe("daysBetween", () => {
  it("calculates days between dates", () => {
    expect(daysBetween("2024-01-01", "2024-01-10")).toBe(9);
    expect(daysBetween("2024-01-10", "2024-01-01")).toBe(-9);
  });
});

describe("eachDayOfRange", () => {
  it("generates array of dates", () => {
    const days = eachDayOfRange("2024-06-01", "2024-06-03");
    expect(days).toEqual(["2024-06-01", "2024-06-02", "2024-06-03"]);
  });
});

describe("getWeekDays", () => {
  it("returns 7 days starting from given date", () => {
    const days = getWeekDays("2024-06-09"); // Sunday
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2024-06-09");
    expect(days[6]).toBe("2024-06-15");
  });
});

describe("getMonthViewRange", () => {
  it("returns 42 days (6 weeks)", () => {
    const range = getMonthViewRange("2024-06-15", 0);
    const days = eachDayOfRange(range.start, range.end);
    expect(days).toHaveLength(42);
  });
});

describe("getWeekViewRange", () => {
  it("returns 7 days", () => {
    const range = getWeekViewRange("2024-06-12", 0);
    const days = eachDayOfRange(range.start, range.end);
    expect(days).toHaveLength(7);
  });
});

describe("getVisibleRange", () => {
  it("returns correct range for each view", () => {
    const day = getVisibleRange("2024-06-15", "day");
    expect(day.start).toBe("2024-06-15");
    expect(day.end).toBe("2024-06-15");

    const agenda = getVisibleRange("2024-06-15", "agenda");
    expect(agenda.start).toBe("2024-06-15");
    expect(daysBetween(agenda.start, agenda.end)).toBe(30);
  });
});

describe("getTimeOfDay", () => {
  it("returns fractional hours", () => {
    expect(getTimeOfDay("2024-06-15T14:30:00")).toBe(14.5);
    expect(getTimeOfDay("2024-06-15T00:00:00")).toBe(0);
    expect(getTimeOfDay("2024-06-15T12:15:00")).toBe(12.25);
  });
});

describe("getDurationHours", () => {
  it("returns duration in hours", () => {
    expect(
      getDurationHours("2024-06-15T10:00:00", "2024-06-15T12:30:00"),
    ).toBe(2.5);
  });
});

describe("getHourLabels", () => {
  it("returns labels for hour range", () => {
    const labels = getHourLabels(9, 12, "en-US");
    expect(labels).toHaveLength(3);
    expect(labels[0]).toContain("9");
    expect(labels[1]).toContain("10");
    expect(labels[2]).toContain("11");
  });
});
