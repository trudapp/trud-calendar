import { describe, expect, it } from "vitest";
import {
  convertWallTime,
  getTimeZoneAbbreviation,
  getTimeZoneOffset,
  isValidTimeZone,
  listTimeZones,
  utcToWallTime,
  wallTimeToUtc,
} from "../utils/timezone";

// ── isValidTimeZone ─────────────────────────────────────────────

describe("isValidTimeZone", () => {
  it("accepts UTC", () => {
    expect(isValidTimeZone("UTC")).toBe(true);
  });

  it("accepts standard IANA names", () => {
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("Europe/Berlin")).toBe(true);
    expect(isValidTimeZone("Asia/Kolkata")).toBe(true);
    expect(isValidTimeZone("Asia/Kathmandu")).toBe(true);
    expect(isValidTimeZone("Australia/Sydney")).toBe(true);
    expect(isValidTimeZone("Pacific/Auckland")).toBe(true);
  });

  it("rejects invalid identifiers", () => {
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
    expect(isValidTimeZone("not_a_zone")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });

  it("rejects non-string inputs without throwing", () => {
    expect(isValidTimeZone(undefined as unknown as string)).toBe(false);
    expect(isValidTimeZone(null as unknown as string)).toBe(false);
    expect(isValidTimeZone(42 as unknown as string)).toBe(false);
  });
});

// ── listTimeZones ───────────────────────────────────────────────

describe("listTimeZones", () => {
  it("returns a non-empty array", () => {
    const zones = listTimeZones();
    expect(Array.isArray(zones)).toBe(true);
    expect(zones.length).toBeGreaterThan(50);
  });

  it("includes major IANA zones", () => {
    const zones = listTimeZones();
    expect(zones).toContain("UTC");
    expect(zones).toContain("America/New_York");
    expect(zones).toContain("Europe/London");
    expect(zones).toContain("Asia/Tokyo");
  });

  it("returns a fresh array (mutations do not leak)", () => {
    const a = listTimeZones();
    const originalLength = a.length;
    a.push("Mars/Olympus");
    const b = listTimeZones();
    expect(b.length).toBe(originalLength);
  });
});

// ── getTimeZoneOffset ───────────────────────────────────────────

describe("getTimeZoneOffset", () => {
  it("returns 0 for UTC at any instant", () => {
    expect(getTimeZoneOffset("2026-01-15T12:00:00Z", "UTC")).toBe(0);
    expect(getTimeZoneOffset("2026-07-15T12:00:00Z", "UTC")).toBe(0);
  });

  it("returns -300 for America/New_York in winter (EST)", () => {
    expect(getTimeZoneOffset("2026-01-15T12:00:00Z", "America/New_York")).toBe(-300);
  });

  it("returns -240 for America/New_York in summer (EDT)", () => {
    expect(getTimeZoneOffset("2026-07-15T12:00:00Z", "America/New_York")).toBe(-240);
  });

  it("returns +60 for Europe/Berlin in winter (CET)", () => {
    expect(getTimeZoneOffset("2026-01-15T12:00:00Z", "Europe/Berlin")).toBe(60);
  });

  it("returns +120 for Europe/Berlin in summer (CEST)", () => {
    expect(getTimeZoneOffset("2026-07-15T12:00:00Z", "Europe/Berlin")).toBe(120);
  });

  it("returns +330 for Asia/Kolkata (no DST, half-hour offset)", () => {
    expect(getTimeZoneOffset("2026-01-15T12:00:00Z", "Asia/Kolkata")).toBe(330);
    expect(getTimeZoneOffset("2026-07-15T12:00:00Z", "Asia/Kolkata")).toBe(330);
  });

  it("returns +345 for Asia/Kathmandu (quarter-hour offset)", () => {
    expect(getTimeZoneOffset("2026-01-15T12:00:00Z", "Asia/Kathmandu")).toBe(345);
  });

  it("returns +1100 for Australia/Sydney in southern summer (Jan, AEDT)", () => {
    expect(getTimeZoneOffset("2026-01-15T12:00:00Z", "Australia/Sydney")).toBe(660);
  });

  it("returns +1000 for Australia/Sydney in southern winter (Jul, AEST)", () => {
    expect(getTimeZoneOffset("2026-07-15T12:00:00Z", "Australia/Sydney")).toBe(600);
  });

  it("accepts both Z-suffixed and bare wall-clock UTC strings", () => {
    expect(getTimeZoneOffset("2026-01-15T12:00:00Z", "America/New_York")).toBe(-300);
    expect(getTimeZoneOffset("2026-01-15T12:00:00", "America/New_York")).toBe(-300);
  });

  it("throws on malformed input", () => {
    expect(() => getTimeZoneOffset("not-a-date", "UTC")).toThrow();
  });
});

// ── utcToWallTime ───────────────────────────────────────────────

describe("utcToWallTime", () => {
  it("converts UTC to NY wall time in winter", () => {
    expect(utcToWallTime("2026-01-15T17:00:00Z", "America/New_York")).toBe("2026-01-15T12:00:00");
  });

  it("converts UTC to NY wall time in summer (DST)", () => {
    expect(utcToWallTime("2026-07-15T16:00:00Z", "America/New_York")).toBe("2026-07-15T12:00:00");
  });

  it("converts UTC to Tokyo (no DST, +09:00)", () => {
    expect(utcToWallTime("2026-03-13T03:00:00Z", "Asia/Tokyo")).toBe("2026-03-13T12:00:00");
  });

  it("handles Kathmandu (+05:45)", () => {
    expect(utcToWallTime("2026-03-13T00:00:00Z", "Asia/Kathmandu")).toBe("2026-03-13T05:45:00");
  });

  it("handles Sydney across midnight", () => {
    // 22:00Z on Jan 14 → 09:00 on Jan 15 in Sydney (AEDT +11)
    expect(utcToWallTime("2026-01-14T22:00:00Z", "Australia/Sydney")).toBe("2026-01-15T09:00:00");
  });

  it("returns the same wall-clock for UTC zone", () => {
    expect(utcToWallTime("2026-03-13T09:00:00Z", "UTC")).toBe("2026-03-13T09:00:00");
  });
});

// ── wallTimeToUtc — basic conversion ────────────────────────────

describe("wallTimeToUtc", () => {
  it("converts NY wall time in winter to UTC", () => {
    expect(wallTimeToUtc("2026-01-15T09:00:00", "America/New_York")).toBe("2026-01-15T14:00:00Z");
  });

  it("converts NY wall time in summer (DST) to UTC", () => {
    expect(wallTimeToUtc("2026-07-15T09:00:00", "America/New_York")).toBe("2026-07-15T13:00:00Z");
  });

  it("converts Berlin wall time in winter (CET) to UTC", () => {
    expect(wallTimeToUtc("2026-01-15T10:00:00", "Europe/Berlin")).toBe("2026-01-15T09:00:00Z");
  });

  it("converts Berlin wall time in summer (CEST) to UTC", () => {
    expect(wallTimeToUtc("2026-07-15T10:00:00", "Europe/Berlin")).toBe("2026-07-15T08:00:00Z");
  });

  it("converts Asia/Kolkata wall time (+05:30, no DST)", () => {
    expect(wallTimeToUtc("2026-01-15T17:30:00", "Asia/Kolkata")).toBe("2026-01-15T12:00:00Z");
  });

  it("converts Asia/Kathmandu wall time (+05:45)", () => {
    expect(wallTimeToUtc("2026-01-15T05:45:00", "Asia/Kathmandu")).toBe("2026-01-15T00:00:00Z");
  });

  it("converts UTC zone identity", () => {
    expect(wallTimeToUtc("2026-03-13T09:00:00", "UTC")).toBe("2026-03-13T09:00:00Z");
  });

  it("converts Sydney wall time in southern summer (AEDT)", () => {
    expect(wallTimeToUtc("2026-01-15T09:00:00", "Australia/Sydney")).toBe("2026-01-14T22:00:00Z");
  });
});

// ── DST gap (spring forward) ────────────────────────────────────

describe("wallTimeToUtc — DST gap (spring forward)", () => {
  // 2026-03-08 02:00 EST → 03:00 EDT in America/New_York. 02:30 does not exist.
  it("shifts forward through NY DST gap by default", () => {
    const result = wallTimeToUtc("2026-03-08T02:30:00", "America/New_York");
    // Forward shift: requested 02:30 becomes 03:30 EDT, which is 07:30Z.
    expect(result).toBe("2026-03-08T07:30:00Z");
    // Verify it round-trips to a valid wall time AFTER the gap.
    expect(utcToWallTime(result, "America/New_York")).toBe("2026-03-08T03:30:00");
  });

  it("throws on NY DST gap when invalid: 'throw'", () => {
    expect(() =>
      wallTimeToUtc("2026-03-08T02:30:00", "America/New_York", { invalid: "throw" }),
    ).toThrow(/DST gap/);
  });

  // 2026-03-29 02:00 CET → 03:00 CEST in Europe/Berlin. 02:30 does not exist.
  it("shifts forward through Berlin DST gap by default", () => {
    const result = wallTimeToUtc("2026-03-29T02:30:00", "Europe/Berlin");
    expect(utcToWallTime(result, "Europe/Berlin")).toBe("2026-03-29T03:30:00");
  });

  // Sydney spring forward: 2026-10-04 02:00 AEST → 03:00 AEDT.
  it("shifts forward through Sydney DST gap (southern hemisphere)", () => {
    const result = wallTimeToUtc("2026-10-04T02:30:00", "Australia/Sydney");
    expect(utcToWallTime(result, "Australia/Sydney")).toBe("2026-10-04T03:30:00");
  });
});

// ── DST overlap (fall back) ─────────────────────────────────────

describe("wallTimeToUtc — DST overlap (fall back)", () => {
  // 2026-11-01 02:00 EDT → 01:00 EST in America/New_York. 01:30 happens twice.
  it("returns the earlier instant by default during NY fallback overlap", () => {
    const result = wallTimeToUtc("2026-11-01T01:30:00", "America/New_York");
    // First 01:30 is still EDT (-240) → UTC 05:30Z.
    expect(result).toBe("2026-11-01T05:30:00Z");
  });

  it("returns the later instant when ambiguous: 'later'", () => {
    const result = wallTimeToUtc("2026-11-01T01:30:00", "America/New_York", { ambiguous: "later" });
    // Second 01:30 is EST (-300) → UTC 06:30Z.
    expect(result).toBe("2026-11-01T06:30:00Z");
  });

  // Berlin: 2026-10-25 03:00 CEST → 02:00 CET. 02:30 happens twice.
  it("handles Berlin fallback overlap", () => {
    const earlier = wallTimeToUtc("2026-10-25T02:30:00", "Europe/Berlin");
    const later = wallTimeToUtc("2026-10-25T02:30:00", "Europe/Berlin", { ambiguous: "later" });
    expect(later).not.toBe(earlier);
    expect(Date.parse(later) - Date.parse(earlier)).toBe(3600_000);
  });

  // Sydney fall back: 2026-04-05 03:00 AEDT → 02:00 AEST. 02:30 happens twice.
  it("handles Sydney fallback overlap (southern hemisphere)", () => {
    const earlier = wallTimeToUtc("2026-04-05T02:30:00", "Australia/Sydney");
    const later = wallTimeToUtc("2026-04-05T02:30:00", "Australia/Sydney", { ambiguous: "later" });
    expect(Date.parse(later) - Date.parse(earlier)).toBe(3600_000);
  });
});

// ── Round-trip identity ─────────────────────────────────────────

describe("wall ⇄ utc round-trips", () => {
  const cases: Array<[string, string]> = [
    ["America/New_York", "2026-01-15T09:00:00"],
    ["America/New_York", "2026-07-15T09:00:00"],
    ["America/New_York", "2026-03-08T01:30:00"], // before NY gap
    ["America/New_York", "2026-03-08T04:00:00"], // after NY gap
    ["America/New_York", "2026-12-31T23:59:59"],
    ["Europe/Berlin", "2026-01-15T10:00:00"],
    ["Europe/Berlin", "2026-07-15T10:00:00"],
    ["Asia/Tokyo", "2026-03-13T12:00:00"],
    ["Asia/Kolkata", "2026-03-13T17:30:00"],
    ["Asia/Kathmandu", "2026-03-13T05:45:00"],
    ["Australia/Sydney", "2026-01-15T09:00:00"],
    ["Australia/Sydney", "2026-07-15T09:00:00"],
    ["Pacific/Auckland", "2026-06-21T12:00:00"],
    ["UTC", "2026-03-13T09:00:00"],
  ];

  for (const [tz, wall] of cases) {
    it(`round-trips ${wall} in ${tz}`, () => {
      const utc = wallTimeToUtc(wall, tz);
      expect(utcToWallTime(utc, tz)).toBe(wall);
    });
  }
});

// ── convertWallTime ─────────────────────────────────────────────

describe("convertWallTime", () => {
  it("converts NY → Berlin in winter (5 hour difference, both standard)", () => {
    // NY 09:00 EST = 14:00 UTC = 15:00 CET in Berlin.
    expect(convertWallTime("2026-01-15T09:00:00", "America/New_York", "Europe/Berlin")).toBe("2026-01-15T15:00:00");
  });

  it("converts NY → Berlin in summer (6 hour difference, both DST)", () => {
    // NY 09:00 EDT = 13:00 UTC = 15:00 CEST in Berlin.
    expect(convertWallTime("2026-07-15T09:00:00", "America/New_York", "Europe/Berlin")).toBe("2026-07-15T15:00:00");
  });

  it("converts Tokyo → NY (crossing dateline backwards)", () => {
    // Tokyo 09:00 JST = 00:00 UTC = 19:00 EST previous day in NY.
    expect(convertWallTime("2026-01-15T09:00:00", "Asia/Tokyo", "America/New_York")).toBe("2026-01-14T19:00:00");
  });

  it("returns the same wall time when zones are identical", () => {
    expect(convertWallTime("2026-03-13T09:00:00", "UTC", "UTC")).toBe("2026-03-13T09:00:00");
    expect(convertWallTime("2026-03-13T09:00:00", "America/New_York", "America/New_York")).toBe("2026-03-13T09:00:00");
  });

  it("preserves the absolute instant across two-stage conversion", () => {
    const ny = "2026-06-15T09:00:00";
    const berlin = convertWallTime(ny, "America/New_York", "Europe/Berlin");
    const tokyo = convertWallTime(berlin, "Europe/Berlin", "Asia/Tokyo");
    const back = convertWallTime(tokyo, "Asia/Tokyo", "America/New_York");
    expect(back).toBe(ny);
  });
});

// ── getTimeZoneAbbreviation ─────────────────────────────────────

describe("getTimeZoneAbbreviation", () => {
  it("returns EST in NY winter", () => {
    expect(getTimeZoneAbbreviation("America/New_York", "2026-01-15T12:00:00Z")).toBe("EST");
  });

  it("returns EDT in NY summer", () => {
    expect(getTimeZoneAbbreviation("America/New_York", "2026-07-15T12:00:00Z")).toBe("EDT");
  });

  it("returns a non-empty string for any valid zone (defaults to now)", () => {
    expect(getTimeZoneAbbreviation("Europe/Berlin").length).toBeGreaterThan(0);
    expect(getTimeZoneAbbreviation("Asia/Kolkata").length).toBeGreaterThan(0);
  });

  it("returns UTC for UTC zone", () => {
    expect(getTimeZoneAbbreviation("UTC", "2026-01-15T12:00:00Z")).toBe("UTC");
  });
});
