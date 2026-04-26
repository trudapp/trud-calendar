import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "../types";
import { computeTimelinePositions } from "../utils/timeline";

const evt = (over: Partial<CalendarEvent> & Pick<CalendarEvent, "id" | "start" | "end">): CalendarEvent => ({
  title: "Event",
  ...over,
});

describe("computeTimelinePositions", () => {
  it("returns an entry for every requested resource, even when empty", () => {
    const result = computeTimelinePositions([], ["r1", "r2"], "2026-04-26");
    expect(result.size).toBe(2);
    expect(result.get("r1")).toEqual([]);
    expect(result.get("r2")).toEqual([]);
  });

  it("positions a single in-day event by left/width percentage", () => {
    const events: CalendarEvent[] = [
      evt({ id: "e1", resourceId: "r1", start: "2026-04-26T09:00:00", end: "2026-04-26T10:30:00" }),
    ];
    const result = computeTimelinePositions(events, ["r1"], "2026-04-26", 0, 24);
    const positioned = result.get("r1")!;
    expect(positioned).toHaveLength(1);
    expect(positioned[0].leftPct).toBeCloseTo((9 / 24) * 100);
    expect(positioned[0].widthPct).toBeCloseTo((1.5 / 24) * 100);
    expect(positioned[0].row).toBe(0);
    expect(positioned[0].totalRows).toBe(1);
    expect(positioned[0].isSegmentStart).toBe(true);
    expect(positioned[0].isSegmentEnd).toBe(true);
  });

  it("scales positions to the visible window when dayStartHour > 0", () => {
    const events: CalendarEvent[] = [
      evt({ id: "e1", resourceId: "r1", start: "2026-04-26T10:00:00", end: "2026-04-26T11:00:00" }),
    ];
    const result = computeTimelinePositions(events, ["r1"], "2026-04-26", 8, 18);
    const p = result.get("r1")![0];
    // Visible range is 10 hours; event starts 2 hours into it.
    expect(p.leftPct).toBeCloseTo((2 / 10) * 100);
    expect(p.widthPct).toBeCloseTo((1 / 10) * 100);
  });

  it("excludes events without a resourceId", () => {
    const events: CalendarEvent[] = [
      evt({ id: "e1", start: "2026-04-26T09:00:00", end: "2026-04-26T10:00:00" }),
    ];
    const result = computeTimelinePositions(events, ["r1"], "2026-04-26");
    expect(result.get("r1")).toEqual([]);
  });

  it("excludes events whose resourceId is not in the requested list", () => {
    const events: CalendarEvent[] = [
      evt({ id: "e1", resourceId: "r2", start: "2026-04-26T09:00:00", end: "2026-04-26T10:00:00" }),
    ];
    const result = computeTimelinePositions(events, ["r1"], "2026-04-26");
    expect(result.get("r1")).toEqual([]);
  });

  it("excludes all-day events", () => {
    const events: CalendarEvent[] = [
      evt({ id: "e1", resourceId: "r1", start: "2026-04-26T00:00:00", end: "2026-04-26T23:59:59", allDay: true }),
    ];
    const result = computeTimelinePositions(events, ["r1"], "2026-04-26");
    expect(result.get("r1")).toEqual([]);
  });

  it("excludes background events", () => {
    const events: CalendarEvent[] = [
      evt({ id: "e1", resourceId: "r1", start: "2026-04-26T09:00:00", end: "2026-04-26T17:00:00", display: "background" }),
    ];
    const result = computeTimelinePositions(events, ["r1"], "2026-04-26");
    expect(result.get("r1")).toEqual([]);
  });

  it("clips multi-day events to the visible day", () => {
    const events: CalendarEvent[] = [
      evt({
        id: "trip",
        resourceId: "r1",
        start: "2026-04-25T22:00:00",
        end: "2026-04-26T06:00:00",
      }),
    ];
    const result = computeTimelinePositions(events, ["r1"], "2026-04-26", 0, 24);
    const p = result.get("r1")![0];
    expect(p.leftPct).toBeCloseTo(0); // Clipped at left edge
    expect(p.widthPct).toBeCloseTo((6 / 24) * 100);
    expect(p.isSegmentStart).toBe(false); // Started yesterday
    expect(p.isSegmentEnd).toBe(true); // Ends today
  });

  it("clips events that extend past the visible day end", () => {
    const events: CalendarEvent[] = [
      evt({
        id: "long",
        resourceId: "r1",
        start: "2026-04-26T20:00:00",
        end: "2026-04-27T04:00:00",
      }),
    ];
    const result = computeTimelinePositions(events, ["r1"], "2026-04-26", 0, 24);
    const p = result.get("r1")![0];
    expect(p.leftPct).toBeCloseTo((20 / 24) * 100);
    expect(p.widthPct).toBeCloseTo((4 / 24) * 100);
    expect(p.isSegmentStart).toBe(true);
    expect(p.isSegmentEnd).toBe(false);
  });

  it("excludes events that fall entirely outside the visible day", () => {
    const events: CalendarEvent[] = [
      evt({ id: "yesterday", resourceId: "r1", start: "2026-04-25T09:00:00", end: "2026-04-25T10:00:00" }),
      evt({ id: "tomorrow", resourceId: "r1", start: "2026-04-27T09:00:00", end: "2026-04-27T10:00:00" }),
    ];
    const result = computeTimelinePositions(events, ["r1"], "2026-04-26");
    expect(result.get("r1")).toEqual([]);
  });

  it("excludes events that fall entirely outside the configured hour window", () => {
    const events: CalendarEvent[] = [
      evt({ id: "early", resourceId: "r1", start: "2026-04-26T05:00:00", end: "2026-04-26T06:00:00" }),
    ];
    const result = computeTimelinePositions(events, ["r1"], "2026-04-26", 8, 18);
    expect(result.get("r1")).toEqual([]);
  });

  it("stacks overlapping events into multiple sub-rows", () => {
    const events: CalendarEvent[] = [
      evt({ id: "a", resourceId: "r1", start: "2026-04-26T09:00:00", end: "2026-04-26T11:00:00" }),
      evt({ id: "b", resourceId: "r1", start: "2026-04-26T10:00:00", end: "2026-04-26T12:00:00" }),
      evt({ id: "c", resourceId: "r1", start: "2026-04-26T10:30:00", end: "2026-04-26T11:30:00" }),
    ];
    const result = computeTimelinePositions(events, ["r1"], "2026-04-26", 0, 24);
    const positioned = result.get("r1")!;
    expect(positioned).toHaveLength(3);
    // All three overlap, so they share the same group with totalRows = 3.
    for (const p of positioned) {
      expect(p.totalRows).toBe(3);
    }
    const rows = positioned.map((p) => p.row).sort();
    expect(rows).toEqual([0, 1, 2]);
  });

  it("non-overlapping events stay on row 0 with totalRows 1", () => {
    const events: CalendarEvent[] = [
      evt({ id: "a", resourceId: "r1", start: "2026-04-26T09:00:00", end: "2026-04-26T10:00:00" }),
      evt({ id: "b", resourceId: "r1", start: "2026-04-26T11:00:00", end: "2026-04-26T12:00:00" }),
    ];
    const result = computeTimelinePositions(events, ["r1"], "2026-04-26", 0, 24);
    const positioned = result.get("r1")!;
    expect(positioned).toHaveLength(2);
    for (const p of positioned) {
      expect(p.row).toBe(0);
      expect(p.totalRows).toBe(1);
    }
  });

  it("groups events independently per resource", () => {
    const events: CalendarEvent[] = [
      evt({ id: "a", resourceId: "r1", start: "2026-04-26T09:00:00", end: "2026-04-26T10:00:00" }),
      evt({ id: "b", resourceId: "r2", start: "2026-04-26T09:00:00", end: "2026-04-26T10:00:00" }),
    ];
    const result = computeTimelinePositions(events, ["r1", "r2"], "2026-04-26");
    expect(result.get("r1")).toHaveLength(1);
    expect(result.get("r2")).toHaveLength(1);
    // Same time slot in different resources — both at row 0 since they don't share a resource.
    expect(result.get("r1")![0].row).toBe(0);
    expect(result.get("r2")![0].row).toBe(0);
  });

  it("clamps minimum width so tiny events stay visible", () => {
    const events: CalendarEvent[] = [
      evt({ id: "tiny", resourceId: "r1", start: "2026-04-26T09:00:00", end: "2026-04-26T09:01:00" }),
    ];
    const result = computeTimelinePositions(events, ["r1"], "2026-04-26", 0, 24);
    const p = result.get("r1")![0];
    expect(p.widthPct).toBeGreaterThanOrEqual(0.5);
  });

  it("preserves the original event reference in the positioned output", () => {
    const original = evt({ id: "e1", resourceId: "r1", start: "2026-04-26T09:00:00", end: "2026-04-26T10:00:00" });
    const result = computeTimelinePositions([original], ["r1"], "2026-04-26");
    expect(result.get("r1")![0].event).toBe(original);
  });
});
