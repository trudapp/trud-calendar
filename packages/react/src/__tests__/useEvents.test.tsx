import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEvents } from "../hooks/useEvents";
import { createWrapper, makeEvent } from "./test-utils";

describe("useEvents", () => {
  const baseEvents = [
    makeEvent("e1", "2024-06-15T10:00:00", "2024-06-15T11:00:00"),
    makeEvent("e2", "2024-06-15T14:00:00", "2024-06-15T15:00:00"),
    makeEvent("e3", "2024-06-20T09:00:00", "2024-06-20T10:00:00"),
    makeEvent("allday", "2024-06-15T00:00:00", "2024-06-15T23:59:00", true),
    makeEvent("multi", "2024-06-14T10:00:00", "2024-06-16T10:00:00"),
    makeEvent("out-of-range", "2025-03-01T10:00:00", "2025-03-01T11:00:00"),
  ];

  describe("visibleEvents", () => {
    it("filters events to the visible range", () => {
      const { result } = renderHook(() => useEvents(), {
        wrapper: createWrapper({
          events: baseEvents,
          defaultDate: "2024-06-15",
          defaultView: "month",
        }),
      });

      // out-of-range event should be excluded
      const ids = result.current.visibleEvents.map((e) => e.id);
      expect(ids).toContain("e1");
      expect(ids).toContain("e2");
      expect(ids).toContain("e3");
      expect(ids).not.toContain("out-of-range");
    });
  });

  describe("getForDay", () => {
    it("returns events for a specific day", () => {
      const { result } = renderHook(() => useEvents(), {
        wrapper: createWrapper({
          events: baseEvents,
          defaultDate: "2024-06-15",
          defaultView: "month",
        }),
      });

      const june15Events = result.current.getForDay("2024-06-15");
      const ids = june15Events.map((e) => e.id);
      expect(ids).toContain("e1");
      expect(ids).toContain("e2");
      expect(ids).toContain("allday");
      expect(ids).toContain("multi"); // multi-day spans this day
    });

    it("returns empty array for days with no events", () => {
      const { result } = renderHook(() => useEvents(), {
        wrapper: createWrapper({
          events: baseEvents,
          defaultDate: "2024-06-15",
          defaultView: "month",
        }),
      });

      const noEvents = result.current.getForDay("2024-06-25");
      expect(noEvents).toHaveLength(0);
    });

    it("returns events for a day that only has one event", () => {
      const { result } = renderHook(() => useEvents(), {
        wrapper: createWrapper({
          events: baseEvents,
          defaultDate: "2024-06-15",
          defaultView: "month",
        }),
      });

      const june20Events = result.current.getForDay("2024-06-20");
      expect(june20Events).toHaveLength(1);
      expect(june20Events[0].id).toBe("e3");
    });
  });

  describe("partitioned", () => {
    it("separates allDay and timed events", () => {
      const { result } = renderHook(() => useEvents(), {
        wrapper: createWrapper({
          events: baseEvents,
          defaultDate: "2024-06-15",
          defaultView: "month",
        }),
      });

      const { allDay, timed } = result.current.partitioned;

      // allDay includes allDay=true events and multi-day events
      const allDayIds = allDay.map((e) => e.id);
      expect(allDayIds).toContain("allday");
      expect(allDayIds).toContain("multi");

      // timed events are single-day non-allDay events
      const timedIds = timed.map((e) => e.id);
      expect(timedIds).toContain("e1");
      expect(timedIds).toContain("e2");
      expect(timedIds).toContain("e3");
    });
  });

  describe("segments", () => {
    it("returns multi-day event segments", () => {
      const { result } = renderHook(() => useEvents(), {
        wrapper: createWrapper({
          events: baseEvents,
          defaultDate: "2024-06-15",
          defaultView: "month",
        }),
      });

      // The multi-day event spans June 14-16, should have segments
      const multiSegments = result.current.segments.filter(
        (s) => s.event.id === "multi",
      );
      expect(multiSegments.length).toBeGreaterThanOrEqual(2);

      // Check isStart / isEnd markers
      const startSegment = multiSegments.find((s) => s.isStart);
      const endSegment = multiSegments.find((s) => s.isEnd);
      expect(startSegment).toBeDefined();
      expect(endSegment).toBeDefined();
    });
  });

  describe("groupedByDate", () => {
    it("groups events by date", () => {
      const { result } = renderHook(() => useEvents(), {
        wrapper: createWrapper({
          events: [
            makeEvent("a", "2024-06-15T10:00:00", "2024-06-15T11:00:00"),
            makeEvent("b", "2024-06-15T14:00:00", "2024-06-15T15:00:00"),
            makeEvent("c", "2024-06-20T09:00:00", "2024-06-20T10:00:00"),
          ],
          defaultDate: "2024-06-15",
          defaultView: "month",
        }),
      });

      const groups = result.current.groupedByDate;
      expect(groups.get("2024-06-15")).toHaveLength(2);
      expect(groups.get("2024-06-20")).toHaveLength(1);
    });
  });

  describe("empty events", () => {
    it("handles empty event array gracefully", () => {
      const { result } = renderHook(() => useEvents(), {
        wrapper: createWrapper({
          events: [],
          defaultDate: "2024-06-15",
          defaultView: "month",
        }),
      });

      expect(result.current.visibleEvents).toHaveLength(0);
      expect(result.current.partitioned.allDay).toHaveLength(0);
      expect(result.current.partitioned.timed).toHaveLength(0);
      expect(result.current.segments).toHaveLength(0);
      expect(result.current.getForDay("2024-06-15")).toHaveLength(0);
    });
  });
});
