import { describe, it, expect } from "vitest";
import { filterVisibleEvents, scrollToViewportRange } from "./virtualize";
import type { PositionedEvent } from "../types";

function makeEvent(id: string, top: number, height: number): PositionedEvent {
  return {
    event: {
      id,
      title: `Event ${id}`,
      start: "2025-01-01T09:00:00",
      end: "2025-01-01T10:00:00",
    },
    column: 0,
    totalColumns: 1,
    top,
    height,
  };
}

describe("filterVisibleEvents", () => {
  it("returns empty array for empty input", () => {
    expect(filterVisibleEvents([], 0, 50, 10)).toEqual([]);
  });

  it("includes events within the viewport", () => {
    const events = [
      makeEvent("a", 20, 10), // 20-30, within 10-60
      makeEvent("b", 40, 10), // 40-50, within 10-60
    ];
    const result = filterVisibleEvents(events, 10, 60, 0);
    expect(result).toHaveLength(2);
  });

  it("excludes events fully above the viewport", () => {
    const events = [
      makeEvent("above", 0, 5), // 0-5, viewport starts at 20 (overscan 10 → effective 10)
    ];
    const result = filterVisibleEvents(events, 20, 60, 10);
    // effective top = 20 - 10 = 10, event bottom = 5, 5 < 10 → excluded
    expect(result).toHaveLength(0);
  });

  it("excludes events fully below the viewport", () => {
    const events = [
      makeEvent("below", 80, 10), // 80-90, viewport ends at 60 (overscan 10 → effective 70)
    ];
    const result = filterVisibleEvents(events, 20, 60, 10);
    // effective bottom = 60 + 10 = 70, event top = 80, 80 >= 70 → excluded
    expect(result).toHaveLength(0);
  });

  it("includes events partially in viewport (top edge)", () => {
    const events = [
      makeEvent("partial-top", 15, 10), // 15-25, viewport 20-60
    ];
    // Without overscan: top + height (25) > 20 && top (15) < 60 → included
    const result = filterVisibleEvents(events, 20, 60, 0);
    expect(result).toHaveLength(1);
    expect(result[0].event.id).toBe("partial-top");
  });

  it("includes events partially in viewport (bottom edge)", () => {
    const events = [
      makeEvent("partial-bottom", 55, 10), // 55-65, viewport 20-60
    ];
    // Without overscan: top + height (65) > 20 && top (55) < 60 → included
    const result = filterVisibleEvents(events, 20, 60, 0);
    expect(result).toHaveLength(1);
    expect(result[0].event.id).toBe("partial-bottom");
  });

  it("includes events within overscan buffer", () => {
    const events = [
      makeEvent("overscan-above", 8, 5), // 8-13, viewport 20-60 overscan 15 → effective top 5
      makeEvent("overscan-below", 65, 5), // 65-70, viewport 20-60 overscan 15 → effective bottom 75
    ];
    const result = filterVisibleEvents(events, 20, 60, 15);
    expect(result).toHaveLength(2);
  });

  it("includes all events when viewport is 0-100 (full range)", () => {
    const events = [
      makeEvent("a", 0, 5),
      makeEvent("b", 25, 10),
      makeEvent("c", 50, 15),
      makeEvent("d", 90, 10),
    ];
    const result = filterVisibleEvents(events, 0, 100, 0);
    expect(result).toHaveLength(4);
  });

  it("uses default overscan of 10 when not specified", () => {
    const events = [
      makeEvent("near-top", 8, 5), // 8-13, viewport 20-60, default overscan 10 → effective top 10
    ];
    // top + height (13) > 10 → included
    const result = filterVisibleEvents(events, 20, 60);
    expect(result).toHaveLength(1);
  });

  it("excludes events just outside the overscan buffer", () => {
    const events = [
      makeEvent("far-above", 0, 2), // 0-2, viewport 20-60, overscan 5 → effective top 15
    ];
    // top + height (2) > 15 → false → excluded
    const result = filterVisibleEvents(events, 20, 60, 5);
    expect(result).toHaveLength(0);
  });
});

describe("scrollToViewportRange", () => {
  it("returns full day range when totalHeight is 0", () => {
    const range = scrollToViewportRange(0, 500, 0, 0, 24);
    expect(range.startHour).toBe(0);
    expect(range.endHour).toBe(24);
  });

  it("computes range for scroll at top", () => {
    // scrollTop=0, container=500, total=2400, hours 0-24
    const range = scrollToViewportRange(0, 500, 2400, 0, 24);
    expect(range.startHour).toBe(0);
    expect(range.endHour).toBe(5); // (500/2400)*24 = 5
  });

  it("computes range for scroll in middle", () => {
    // scrollTop=1200, container=500, total=2400, hours 0-24
    const range = scrollToViewportRange(1200, 500, 2400, 0, 24);
    expect(range.startHour).toBe(12); // (1200/2400)*24
    expect(range.endHour).toBeCloseTo(17); // ((1200+500)/2400)*24
  });

  it("respects dayStartHour offset", () => {
    // scrollTop=0, container=500, total=1000, hours 8-18
    const range = scrollToViewportRange(0, 500, 1000, 8, 18);
    expect(range.startHour).toBe(8);
    expect(range.endHour).toBe(13); // 8 + (500/1000)*10
  });
});
