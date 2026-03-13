import { describe, it, expect } from "vitest";
import {
  snapToIncrement,
  fractionalHourToDateTime,
  normalizeRange,
} from "./time";

describe("snapToIncrement", () => {
  it("snaps to nearest 15 min by default", () => {
    expect(snapToIncrement(9.0)).toBe(9.0);
    expect(snapToIncrement(9.1)).toBe(9.0); // 9:06 → 9:00
    expect(snapToIncrement(9.13)).toBe(9.25); // 9:07.8 → 9:15
    expect(snapToIncrement(9.25)).toBe(9.25);
    expect(snapToIncrement(9.37)).toBe(9.25); // 9:22.2 → 9:15
    expect(snapToIncrement(9.38)).toBe(9.5); // 9:22.8 → 9:30
    expect(snapToIncrement(9.5)).toBe(9.5);
    expect(snapToIncrement(9.75)).toBe(9.75);
    expect(snapToIncrement(9.87)).toBe(9.75);
    expect(snapToIncrement(9.88)).toBe(10.0);
  });

  it("snaps to 30-min increments", () => {
    expect(snapToIncrement(9.1, 30)).toBe(9.0);
    expect(snapToIncrement(9.3, 30)).toBe(9.5);
    expect(snapToIncrement(9.7, 30)).toBe(9.5);
    expect(snapToIncrement(9.8, 30)).toBe(10.0);
  });

  it("handles midnight and end of day", () => {
    expect(snapToIncrement(0)).toBe(0);
    expect(snapToIncrement(23.9)).toBe(24.0);
  });
});

describe("fractionalHourToDateTime", () => {
  it("converts whole hours", () => {
    expect(fractionalHourToDateTime("2026-03-13", 9)).toBe("2026-03-13T09:00:00");
    expect(fractionalHourToDateTime("2026-03-13", 14)).toBe("2026-03-13T14:00:00");
    expect(fractionalHourToDateTime("2026-03-13", 0)).toBe("2026-03-13T00:00:00");
  });

  it("converts fractional hours", () => {
    expect(fractionalHourToDateTime("2026-03-13", 9.5)).toBe("2026-03-13T09:30:00");
    expect(fractionalHourToDateTime("2026-03-13", 9.25)).toBe("2026-03-13T09:15:00");
    expect(fractionalHourToDateTime("2026-03-13", 9.75)).toBe("2026-03-13T09:45:00");
  });

  it("clamps to valid range", () => {
    expect(fractionalHourToDateTime("2026-03-13", -1)).toBe("2026-03-13T00:00:00");
  });
});

describe("normalizeRange", () => {
  it("returns as-is if a <= b", () => {
    expect(normalizeRange(9, 10)).toEqual({ start: 9, end: 10 });
    expect(normalizeRange(9, 9)).toEqual({ start: 9, end: 9 });
  });

  it("swaps if a > b (dragged upward)", () => {
    expect(normalizeRange(10, 9)).toEqual({ start: 9, end: 10 });
  });
});
