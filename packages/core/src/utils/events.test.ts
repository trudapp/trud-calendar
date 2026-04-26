import { describe, it, expect } from "vitest";
import {
  sortEvents,
  filterEventsInRange,
  getEventsForDay,
  isMultiDayEvent,
  partitionEvents,
  segmentMultiDayEvent,
  buildOverlapGroups,
  assignColumns,
  computeTimePositions,
  groupEventsByDate,
} from "./events";
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

describe("sortEvents", () => {
  it("sorts by start time, then longest first", () => {
    const events = [
      makeEvent("1", "2024-06-15T12:00:00", "2024-06-15T13:00:00"),
      makeEvent("2", "2024-06-15T10:00:00", "2024-06-15T14:00:00"),
      makeEvent("3", "2024-06-15T10:00:00", "2024-06-15T11:00:00"),
    ];
    const sorted = sortEvents(events);
    expect(sorted.map((e) => e.id)).toEqual(["2", "3", "1"]);
  });
});

describe("filterEventsInRange", () => {
  it("filters events within date range", () => {
    const events = [
      makeEvent("1", "2024-06-14T10:00:00", "2024-06-14T11:00:00"),
      makeEvent("2", "2024-06-15T10:00:00", "2024-06-15T11:00:00"),
      makeEvent("3", "2024-06-16T10:00:00", "2024-06-16T11:00:00"),
    ];
    const filtered = filterEventsInRange(events, "2024-06-15", "2024-06-15");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("2");
  });

  it("includes multi-day events that span the range", () => {
    const events = [
      makeEvent("1", "2024-06-14T10:00:00", "2024-06-16T11:00:00"),
    ];
    const filtered = filterEventsInRange(events, "2024-06-15", "2024-06-15");
    expect(filtered).toHaveLength(1);
  });
});

describe("getEventsForDay", () => {
  it("returns events for specific day", () => {
    const events = [
      makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00"),
      makeEvent("2", "2024-06-16T10:00:00", "2024-06-16T11:00:00"),
    ];
    const dayEvents = getEventsForDay(events, "2024-06-15");
    expect(dayEvents).toHaveLength(1);
    expect(dayEvents[0].id).toBe("1");
  });
});

describe("isMultiDayEvent", () => {
  it("detects multi-day events", () => {
    expect(
      isMultiDayEvent(
        makeEvent("1", "2024-06-15T10:00:00", "2024-06-16T10:00:00"),
      ),
    ).toBe(true);
  });
  it("detects all-day events", () => {
    expect(
      isMultiDayEvent(
        makeEvent("1", "2024-06-15T00:00:00", "2024-06-15T23:59:00", true),
      ),
    ).toBe(true);
  });
  it("returns false for single-day timed events", () => {
    expect(
      isMultiDayEvent(
        makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T12:00:00"),
      ),
    ).toBe(false);
  });
});

describe("partitionEvents", () => {
  it("separates all-day and timed events", () => {
    const events = [
      makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T12:00:00"),
      makeEvent("2", "2024-06-15T00:00:00", "2024-06-15T23:59:00", true),
      makeEvent("3", "2024-06-15T10:00:00", "2024-06-17T10:00:00"),
    ];
    const { allDay, timed } = partitionEvents(events);
    expect(allDay).toHaveLength(2);
    expect(timed).toHaveLength(1);
  });

  it("puts display:background events in the background array", () => {
    const events: CalendarEvent[] = [
      {
        ...makeEvent("bg1", "2024-06-15T08:00:00", "2024-06-15T12:00:00"),
        display: "background",
      },
      {
        ...makeEvent("bg2", "2024-06-15T00:00:00", "2024-06-15T23:59:00", true),
        display: "background",
      },
    ];
    const { allDay, timed, background } = partitionEvents(events);
    expect(background).toHaveLength(2);
    expect(background.map((e) => e.id)).toEqual(["bg1", "bg2"]);
    expect(allDay).toHaveLength(0);
    expect(timed).toHaveLength(0);
  });

  it("does not put background events in timed or allDay", () => {
    const events: CalendarEvent[] = [
      {
        ...makeEvent("bg", "2024-06-15T10:00:00", "2024-06-15T12:00:00"),
        display: "background",
      },
      makeEvent("timed", "2024-06-15T10:00:00", "2024-06-15T12:00:00"),
      makeEvent("allday", "2024-06-15T00:00:00", "2024-06-15T23:59:00", true),
    ];
    const { allDay, timed, background } = partitionEvents(events);
    expect(background).toHaveLength(1);
    expect(background[0].id).toBe("bg");
    expect(timed).toHaveLength(1);
    expect(timed[0].id).toBe("timed");
    expect(allDay).toHaveLength(1);
    expect(allDay[0].id).toBe("allday");
  });

  it("treats events with display:auto as regular events", () => {
    const events: CalendarEvent[] = [
      {
        ...makeEvent("auto-timed", "2024-06-15T10:00:00", "2024-06-15T12:00:00"),
        display: "auto",
      },
      {
        ...makeEvent("auto-allday", "2024-06-15T00:00:00", "2024-06-15T23:59:00", true),
        display: "auto",
      },
    ];
    const { allDay, timed, background } = partitionEvents(events);
    expect(background).toHaveLength(0);
    expect(timed).toHaveLength(1);
    expect(timed[0].id).toBe("auto-timed");
    expect(allDay).toHaveLength(1);
    expect(allDay[0].id).toBe("auto-allday");
  });
});

describe("segmentMultiDayEvent", () => {
  it("creates segments for each day", () => {
    const event = makeEvent(
      "1",
      "2024-06-14T10:00:00",
      "2024-06-16T10:00:00",
    );
    const segments = segmentMultiDayEvent(event, "2024-06-14", "2024-06-16");
    expect(segments).toHaveLength(3);
    expect(segments[0].isStart).toBe(true);
    expect(segments[0].isEnd).toBe(false);
    expect(segments[2].isStart).toBe(false);
    expect(segments[2].isEnd).toBe(true);
  });

  it("clips to visible range", () => {
    const event = makeEvent(
      "1",
      "2024-06-10T10:00:00",
      "2024-06-20T10:00:00",
    );
    const segments = segmentMultiDayEvent(event, "2024-06-14", "2024-06-16");
    expect(segments).toHaveLength(3);
    expect(segments[0].isStart).toBe(false);
    expect(segments[2].isEnd).toBe(false);
  });
});

describe("buildOverlapGroups", () => {
  it("groups overlapping events together", () => {
    const events = [
      makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T12:00:00"),
      makeEvent("2", "2024-06-15T11:00:00", "2024-06-15T13:00:00"),
      makeEvent("3", "2024-06-15T15:00:00", "2024-06-15T16:00:00"),
    ];
    const groups = buildOverlapGroups(events);
    expect(groups).toHaveLength(2);
    expect(groups[0].events).toHaveLength(2);
    expect(groups[1].events).toHaveLength(1);
  });

  it("returns empty for no events", () => {
    expect(buildOverlapGroups([])).toHaveLength(0);
  });
});

describe("assignColumns", () => {
  it("assigns adjacent columns to overlapping events", () => {
    const events = [
      makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T12:00:00"),
      makeEvent("2", "2024-06-15T11:00:00", "2024-06-15T13:00:00"),
    ];
    const result = assignColumns({ events });
    expect(result).toHaveLength(2);
    expect(result[0].column).toBe(0);
    expect(result[1].column).toBe(1);
    expect(result[0].totalColumns).toBe(2);
  });

  it("reuses columns when events don't overlap", () => {
    const events = [
      makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00"),
      makeEvent("2", "2024-06-15T11:00:00", "2024-06-15T12:00:00"),
    ];
    const result = assignColumns({ events });
    expect(result[0].column).toBe(0);
    expect(result[1].column).toBe(0);
    expect(result[0].totalColumns).toBe(1);
  });
});

describe("computeTimePositions", () => {
  it("positions events with correct top and height", () => {
    const events = [
      makeEvent("1", "2024-06-15T06:00:00", "2024-06-15T12:00:00"),
    ];
    const positioned = computeTimePositions(events, 0, 24);
    expect(positioned).toHaveLength(1);
    expect(positioned[0].top).toBe(25); // 6/24 * 100
    expect(positioned[0].height).toBe(25); // 6/24 * 100
  });

  it("handles overlapping events", () => {
    const events = [
      makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T12:00:00"),
      makeEvent("2", "2024-06-15T11:00:00", "2024-06-15T13:00:00"),
    ];
    const positioned = computeTimePositions(events, 0, 24);
    expect(positioned).toHaveLength(2);
    expect(positioned[0].totalColumns).toBe(2);
    expect(positioned[1].totalColumns).toBe(2);
    expect(positioned[0].column).not.toBe(positioned[1].column);
  });

  // ── Phase 6.7: TZ-aware positioning ──────────────────────────────
  it("positions anchored event in display zone wall-clock (NY → UTC)", () => {
    // April 27, 2026 — NY is on EDT (UTC-4). 9:00 AM NY = 13:00 UTC = 1:00 PM.
    const events: CalendarEvent[] = [
      {
        id: "1",
        title: "OKR",
        start: "2026-04-27T09:00:00",
        end: "2026-04-27T10:00:00",
        timeZone: "America/New_York",
      },
    ];
    const positioned = computeTimePositions(events, 0, 24, "UTC");
    expect(positioned[0].top).toBeCloseTo((13 / 24) * 100, 5);
    expect(positioned[0].height).toBeCloseTo((1 / 24) * 100, 5);
  });

  it("positions anchored event in display zone wall-clock (NY → Tokyo)", () => {
    // NY 9:00 AM EDT = UTC 13:00 = Tokyo 22:00. Same calendar day.
    const events: CalendarEvent[] = [
      {
        id: "1",
        title: "OKR",
        start: "2026-04-27T09:00:00",
        end: "2026-04-27T10:30:00",
        timeZone: "America/New_York",
      },
    ];
    const positioned = computeTimePositions(events, 0, 24, "Asia/Tokyo");
    expect(positioned[0].top).toBeCloseTo((22 / 24) * 100, 5);
    expect(positioned[0].height).toBeCloseTo((1.5 / 24) * 100, 5);
  });

  it("positions anchored event with half-hour offset zone (NY → Kolkata)", () => {
    // NY 9:00 AM EDT = UTC 13:00 = Kolkata 18:30 (UTC+5:30).
    const events: CalendarEvent[] = [
      {
        id: "1",
        title: "OKR",
        start: "2026-04-27T09:00:00",
        end: "2026-04-27T10:00:00",
        timeZone: "America/New_York",
      },
    ];
    const positioned = computeTimePositions(events, 0, 24, "Asia/Kolkata");
    expect(positioned[0].top).toBeCloseTo((18.5 / 24) * 100, 5);
  });

  it("falls back to literal wall-clock for floating events even with displayTimeZone", () => {
    // No timeZone field on the event → it's floating; display zone has no
    // effect on positioning.
    const events = [
      makeEvent("1", "2026-04-27T09:00:00", "2026-04-27T10:00:00"),
    ];
    const positioned = computeTimePositions(events, 0, 24, "Asia/Tokyo");
    expect(positioned[0].top).toBeCloseTo((9 / 24) * 100, 5);
    expect(positioned[0].height).toBeCloseTo((1 / 24) * 100, 5);
  });

  it("falls back to literal wall-clock when displayTimeZone is omitted", () => {
    // Anchored event but no displayTimeZone → use the event's own wall-clock
    // (backwards-compatible default).
    const events: CalendarEvent[] = [
      {
        id: "1",
        title: "OKR",
        start: "2026-04-27T09:00:00",
        end: "2026-04-27T10:00:00",
        timeZone: "America/New_York",
      },
    ];
    const positioned = computeTimePositions(events, 0, 24);
    expect(positioned[0].top).toBeCloseTo((9 / 24) * 100, 5);
  });

  it("positions anchored event the same as floating when zones match", () => {
    // NY anchored event displayed in NY zone — should match literal.
    const events: CalendarEvent[] = [
      {
        id: "1",
        title: "OKR",
        start: "2026-04-27T09:00:00",
        end: "2026-04-27T10:00:00",
        timeZone: "America/New_York",
      },
    ];
    const positioned = computeTimePositions(events, 0, 24, "America/New_York");
    expect(positioned[0].top).toBeCloseTo((9 / 24) * 100, 5);
  });
});

describe("groupEventsByDate", () => {
  it("groups events by their start date", () => {
    const events = [
      makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00"),
      makeEvent("2", "2024-06-15T14:00:00", "2024-06-15T15:00:00"),
      makeEvent("3", "2024-06-16T10:00:00", "2024-06-16T11:00:00"),
    ];
    const groups = groupEventsByDate(events, "2024-06-15", "2024-06-16");
    expect(groups.size).toBe(2);
    expect(groups.get("2024-06-15")).toHaveLength(2);
    expect(groups.get("2024-06-16")).toHaveLength(1);
  });
});
