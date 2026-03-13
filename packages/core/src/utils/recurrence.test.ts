import { describe, it, expect } from "vitest";
import {
  generateOccurrences,
  expandRecurringEvents,
  parseRRule,
  toRRuleString,
} from "./recurrence";
import type { CalendarEvent, RecurrenceRule } from "../types";

// ── generateOccurrences ─────────────────────────────────────────

describe("generateOccurrences", () => {
  describe("daily", () => {
    it("generates daily occurrences within range", () => {
      const rule: RecurrenceRule = { freq: "daily" };
      const result = generateOccurrences(rule, "2026-03-01", "2026-03-01", "2026-03-05");
      expect(result).toEqual([
        "2026-03-01", "2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05",
      ]);
    });

    it("respects interval", () => {
      const rule: RecurrenceRule = { freq: "daily", interval: 2 };
      const result = generateOccurrences(rule, "2026-03-01", "2026-03-01", "2026-03-07");
      expect(result).toEqual(["2026-03-01", "2026-03-03", "2026-03-05", "2026-03-07"]);
    });

    it("respects count", () => {
      const rule: RecurrenceRule = { freq: "daily", count: 3 };
      const result = generateOccurrences(rule, "2026-03-01", "2026-03-01", "2026-12-31");
      expect(result).toEqual(["2026-03-01", "2026-03-02", "2026-03-03"]);
    });

    it("respects until", () => {
      const rule: RecurrenceRule = { freq: "daily", until: "2026-03-03" };
      const result = generateOccurrences(rule, "2026-03-01", "2026-03-01", "2026-12-31");
      expect(result).toEqual(["2026-03-01", "2026-03-02", "2026-03-03"]);
    });

    it("excludes exDates", () => {
      const rule: RecurrenceRule = { freq: "daily" };
      const result = generateOccurrences(
        rule, "2026-03-01", "2026-03-01", "2026-03-05", ["2026-03-02", "2026-03-04"],
      );
      expect(result).toEqual(["2026-03-01", "2026-03-03", "2026-03-05"]);
    });

    it("only returns dates within visible range", () => {
      const rule: RecurrenceRule = { freq: "daily" };
      const result = generateOccurrences(rule, "2026-03-01", "2026-03-03", "2026-03-05");
      expect(result).toEqual(["2026-03-03", "2026-03-04", "2026-03-05"]);
    });
  });

  describe("weekly", () => {
    it("generates weekly occurrences on same day", () => {
      const rule: RecurrenceRule = { freq: "weekly" };
      // 2026-03-02 is Monday
      const result = generateOccurrences(rule, "2026-03-02", "2026-03-01", "2026-03-31");
      expect(result).toContain("2026-03-02");
      expect(result).toContain("2026-03-09");
      expect(result).toContain("2026-03-16");
      expect(result).toContain("2026-03-23");
      expect(result).toContain("2026-03-30");
    });

    it("generates on specific byDay", () => {
      const rule: RecurrenceRule = { freq: "weekly", byDay: ["MO", "WE", "FR"] };
      const result = generateOccurrences(rule, "2026-03-02", "2026-03-02", "2026-03-08");
      // 2026-03-02=Mon, 2026-03-04=Wed, 2026-03-06=Fri
      expect(result).toContain("2026-03-02");
      expect(result).toContain("2026-03-04");
      expect(result).toContain("2026-03-06");
    });

    it("respects interval (every 2 weeks)", () => {
      const rule: RecurrenceRule = { freq: "weekly", interval: 2 };
      // 2026-03-02 is Monday
      const result = generateOccurrences(rule, "2026-03-02", "2026-03-01", "2026-04-15");
      expect(result).toContain("2026-03-02");
      expect(result).toContain("2026-03-16");
      expect(result).toContain("2026-03-30");
      expect(result).toContain("2026-04-13");
      // Should NOT contain the weeks in between
      expect(result).not.toContain("2026-03-09");
      expect(result).not.toContain("2026-03-23");
    });
  });

  describe("monthly", () => {
    it("generates on same day of month", () => {
      const rule: RecurrenceRule = { freq: "monthly" };
      // 15th of month
      const result = generateOccurrences(rule, "2026-01-15", "2026-01-01", "2026-06-30");
      expect(result).toEqual([
        "2026-01-15", "2026-02-15", "2026-03-15",
        "2026-04-15", "2026-05-15", "2026-06-15",
      ]);
    });

    it("handles 31st in months with fewer days", () => {
      const rule: RecurrenceRule = { freq: "monthly" };
      const result = generateOccurrences(rule, "2026-01-31", "2026-01-01", "2026-04-30");
      // Jan 31, Feb has 28 days → Feb 28, Mar 31, Apr 30
      expect(result).toContain("2026-01-31");
      expect(result).toContain("2026-02-28");
      expect(result).toContain("2026-03-31");
      expect(result).toContain("2026-04-30");
    });

    it("handles byMonthDay", () => {
      const rule: RecurrenceRule = { freq: "monthly", byMonthDay: [1, 15] };
      const result = generateOccurrences(rule, "2026-01-01", "2026-01-01", "2026-03-31");
      expect(result).toContain("2026-01-01");
      expect(result).toContain("2026-01-15");
      expect(result).toContain("2026-02-01");
      expect(result).toContain("2026-02-15");
    });

    it("handles first Monday (byDay + bySetPos)", () => {
      const rule: RecurrenceRule = { freq: "monthly", byDay: ["MO"], bySetPos: 1 };
      const result = generateOccurrences(rule, "2026-01-05", "2026-01-01", "2026-04-30");
      // First Mondays: Jan 5, Feb 2, Mar 2, Apr 6
      expect(result).toContain("2026-01-05");
      expect(result).toContain("2026-02-02");
      expect(result).toContain("2026-03-02");
      expect(result).toContain("2026-04-06");
    });

    it("handles last Friday (byDay + bySetPos -1)", () => {
      const rule: RecurrenceRule = { freq: "monthly", byDay: ["FR"], bySetPos: -1 };
      const result = generateOccurrences(rule, "2026-01-30", "2026-01-01", "2026-04-30");
      // Last Fridays: Jan 30, Feb 27, Mar 27, Apr 24
      expect(result).toContain("2026-01-30");
      expect(result).toContain("2026-02-27");
      expect(result).toContain("2026-03-27");
      expect(result).toContain("2026-04-24");
    });
  });

  describe("yearly", () => {
    it("generates yearly on same date", () => {
      const rule: RecurrenceRule = { freq: "yearly" };
      const result = generateOccurrences(rule, "2024-06-15", "2024-01-01", "2027-12-31");
      expect(result).toEqual(["2024-06-15", "2025-06-15", "2026-06-15", "2027-06-15"]);
    });

    it("handles Feb 29 in non-leap years", () => {
      const rule: RecurrenceRule = { freq: "yearly" };
      const result = generateOccurrences(rule, "2024-02-29", "2024-01-01", "2028-12-31");
      expect(result).toContain("2024-02-29");
      // 2025, 2026, 2027 are not leap years → Feb 28
      expect(result).toContain("2025-02-28");
      expect(result).toContain("2026-02-28");
      expect(result).toContain("2027-02-28");
      expect(result).toContain("2028-02-29");
    });
  });
});

// ── expandRecurringEvents ───────────────────────────────────────

describe("expandRecurringEvents", () => {
  it("passes through non-recurring events unchanged", () => {
    const events: CalendarEvent[] = [
      { id: "1", title: "Regular", start: "2026-03-10T09:00:00", end: "2026-03-10T10:00:00" },
    ];
    const result = expandRecurringEvents(events, "2026-03-09", "2026-03-15");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("expands a daily recurring event", () => {
    const events: CalendarEvent[] = [
      {
        id: "standup",
        title: "Daily Standup",
        start: "2026-03-09T09:00:00",
        end: "2026-03-09T09:30:00",
        recurrence: { freq: "daily" },
      },
    ];
    const result = expandRecurringEvents(events, "2026-03-09", "2026-03-13");
    expect(result).toHaveLength(5);
    expect(result[0].id).toBe("standup::2026-03-09");
    expect(result[0].start).toBe("2026-03-09T09:00:00");
    expect(result[0].end).toBe("2026-03-09T09:30:00");
    expect(result[0].recurringEventId).toBe("standup");
    expect(result[0].originalDate).toBe("2026-03-09");
    expect(result[4].id).toBe("standup::2026-03-13");
    expect(result[4].start).toBe("2026-03-13T09:00:00");
  });

  it("mixes recurring and non-recurring events", () => {
    const events: CalendarEvent[] = [
      { id: "1", title: "One-off", start: "2026-03-10T14:00:00", end: "2026-03-10T15:00:00" },
      {
        id: "gym",
        title: "Gym",
        start: "2026-03-09T07:00:00",
        end: "2026-03-09T08:00:00",
        color: "#10b981",
        recurrence: { freq: "weekly", byDay: ["MO", "WE", "FR"] },
      },
    ];
    const result = expandRecurringEvents(events, "2026-03-09", "2026-03-15");
    // 1 one-off + 3 gym instances (Mon, Wed, Fri)
    expect(result.filter((e) => e.recurringEventId === "gym")).toHaveLength(3);
    expect(result.find((e) => e.id === "1")).toBeDefined();
  });

  it("respects exDates", () => {
    const events: CalendarEvent[] = [
      {
        id: "daily",
        title: "Daily",
        start: "2026-03-09T09:00:00",
        end: "2026-03-09T09:30:00",
        recurrence: { freq: "daily" },
        exDates: ["2026-03-11"],
      },
    ];
    const result = expandRecurringEvents(events, "2026-03-09", "2026-03-13");
    expect(result).toHaveLength(4); // 5 days - 1 exDate
    expect(result.find((e) => e.originalDate === "2026-03-11")).toBeUndefined();
  });

  it("instances carry parent event properties (color, etc.)", () => {
    const events: CalendarEvent[] = [
      {
        id: "r1",
        title: "Recurring",
        start: "2026-03-09T10:00:00",
        end: "2026-03-09T11:00:00",
        color: "#ef4444",
        recurrence: { freq: "daily", count: 2 },
      },
    ];
    const result = expandRecurringEvents(events, "2026-03-09", "2026-03-15");
    expect(result[0].color).toBe("#ef4444");
    expect(result[0].title).toBe("Recurring");
    // Instances should NOT have recurrence or exDates
    expect(result[0].recurrence).toBeUndefined();
    expect(result[0].exDates).toBeUndefined();
  });

  it("performance: daily forever rule within 1 month range", () => {
    const events: CalendarEvent[] = [
      {
        id: "perf",
        title: "Daily forever",
        start: "2020-01-01T09:00:00",
        end: "2020-01-01T09:30:00",
        recurrence: { freq: "daily" },
      },
    ];
    const start = performance.now();
    const result = expandRecurringEvents(events, "2026-03-01", "2026-03-31");
    const elapsed = performance.now() - start;
    expect(result).toHaveLength(31);
    expect(elapsed).toBeLessThan(100); // should be very fast
  });
});

// ── parseRRule / toRRuleString ──────────────────────────────────

describe("parseRRule", () => {
  it("parses basic FREQ", () => {
    expect(parseRRule("FREQ=DAILY")).toEqual({ freq: "daily" });
    expect(parseRRule("FREQ=WEEKLY")).toEqual({ freq: "weekly" });
    expect(parseRRule("FREQ=MONTHLY")).toEqual({ freq: "monthly" });
    expect(parseRRule("FREQ=YEARLY")).toEqual({ freq: "yearly" });
  });

  it("parses interval", () => {
    const rule = parseRRule("FREQ=WEEKLY;INTERVAL=2");
    expect(rule.interval).toBe(2);
  });

  it("parses count", () => {
    const rule = parseRRule("FREQ=DAILY;COUNT=10");
    expect(rule.count).toBe(10);
  });

  it("parses until", () => {
    const rule = parseRRule("FREQ=DAILY;UNTIL=20260315");
    expect(rule.until).toBe("2026-03-15");
  });

  it("parses until with time component", () => {
    const rule = parseRRule("FREQ=DAILY;UNTIL=20260315T120000Z");
    expect(rule.until).toBe("2026-03-15");
  });

  it("parses byDay", () => {
    const rule = parseRRule("FREQ=WEEKLY;BYDAY=MO,WE,FR");
    expect(rule.byDay).toEqual(["MO", "WE", "FR"]);
  });

  it("parses byMonthDay", () => {
    const rule = parseRRule("FREQ=MONTHLY;BYMONTHDAY=1,15");
    expect(rule.byMonthDay).toEqual([1, 15]);
  });

  it("parses bySetPos", () => {
    const rule = parseRRule("FREQ=MONTHLY;BYDAY=MO;BYSETPOS=1");
    expect(rule.bySetPos).toBe(1);
    expect(rule.byDay).toEqual(["MO"]);
  });

  it("strips RRULE: prefix", () => {
    const rule = parseRRule("RRULE:FREQ=DAILY;COUNT=5");
    expect(rule.freq).toBe("daily");
    expect(rule.count).toBe(5);
  });
});

describe("toRRuleString", () => {
  it("serializes basic frequency", () => {
    expect(toRRuleString({ freq: "daily" })).toBe("FREQ=DAILY");
    expect(toRRuleString({ freq: "weekly" })).toBe("FREQ=WEEKLY");
  });

  it("serializes interval", () => {
    expect(toRRuleString({ freq: "weekly", interval: 2 })).toBe("FREQ=WEEKLY;INTERVAL=2");
  });

  it("serializes count", () => {
    expect(toRRuleString({ freq: "daily", count: 10 })).toBe("FREQ=DAILY;COUNT=10");
  });

  it("serializes until", () => {
    expect(toRRuleString({ freq: "daily", until: "2026-03-15" })).toBe("FREQ=DAILY;UNTIL=20260315");
  });

  it("serializes byDay", () => {
    expect(toRRuleString({ freq: "weekly", byDay: ["MO", "WE", "FR"] })).toBe(
      "FREQ=WEEKLY;BYDAY=MO,WE,FR",
    );
  });

  it("round-trips with parseRRule", () => {
    const rules: RecurrenceRule[] = [
      { freq: "daily", count: 10 },
      { freq: "weekly", interval: 2, byDay: ["MO", "WE", "FR"] },
      { freq: "monthly", byMonthDay: [1, 15] },
      { freq: "monthly", byDay: ["MO"], bySetPos: 1 },
      { freq: "yearly", until: "2030-12-31" },
    ];

    for (const rule of rules) {
      const serialized = toRRuleString(rule);
      const parsed = parseRRule(serialized);
      expect(toRRuleString(parsed)).toBe(serialized);
    }
  });
});
