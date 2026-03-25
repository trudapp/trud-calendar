import { describe, it, expect } from "vitest";
import {
  snapToIncrement,
  fractionalHourToDateTime,
  normalizeRange,
  computeDropPosition,
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

describe("computeDropPosition", () => {
  // 1440px tall column = 1px per minute for a 24-hour day
  const mockRect = {
    top: 0,
    left: 0,
    right: 200,
    bottom: 1440,
    width: 200,
    height: 1440,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;

  it("snaps to 30-min boundary with snapMinutes=30", () => {
    // clientY=135 → fractionalHour = (135/1440)*24 = 2.25 (2:15)
    // snapToIncrement(2.25, 30) → round(135/30)*30/60 = 5*30/60 = 2.5 → 02:30
    const result = computeDropPosition("2026-03-25", 135, mockRect, 0, 24, 3600000, 30);
    expect(result.newStart).toBe("2026-03-25T02:30:00");
    expect(result.newEnd).toBe("2026-03-25T03:30:00");
  });

  it("snaps to 15-min boundary with snapMinutes=15", () => {
    // clientY=135 → fractionalHour = 2.25 (2:15)
    // snapToIncrement(2.25, 15) → round(135/15)*15/60 = 9*15/60 = 2.25 → 02:15
    const result = computeDropPosition("2026-03-25", 135, mockRect, 0, 24, 3600000, 15);
    expect(result.newStart).toBe("2026-03-25T02:15:00");
    expect(result.newEnd).toBe("2026-03-25T03:15:00");
  });

  it("produces different results for 30-min vs 15-min snap at the same position", () => {
    const result30 = computeDropPosition("2026-03-25", 135, mockRect, 0, 24, 3600000, 30);
    const result15 = computeDropPosition("2026-03-25", 135, mockRect, 0, 24, 3600000, 15);
    expect(result30.newStart).not.toBe(result15.newStart);
  });
});
