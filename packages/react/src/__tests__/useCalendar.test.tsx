import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCalendar } from "../hooks/useCalendar";
import { createWrapper, makeEvent } from "./test-utils";

describe("useCalendar", () => {
  describe("initial state", () => {
    it("returns currentDate from config", () => {
      const { result } = renderHook(() => useCalendar(), {
        wrapper: createWrapper({ defaultDate: "2024-06-15" }),
      });

      expect(result.current.currentDate).toBe("2024-06-15");
    });

    it("returns view from config", () => {
      const { result } = renderHook(() => useCalendar(), {
        wrapper: createWrapper({ defaultView: "week" }),
      });

      expect(result.current.view).toBe("week");
    });

    it("returns events", () => {
      const events = [
        makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00"),
      ];
      const { result } = renderHook(() => useCalendar(), {
        wrapper: createWrapper({ events }),
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].id).toBe("1");
    });

    it("returns visibleEvents filtered to current range", () => {
      const events = [
        makeEvent("in-range", "2024-06-15T10:00:00", "2024-06-15T11:00:00"),
        makeEvent("out-of-range", "2025-01-15T10:00:00", "2025-01-15T11:00:00"),
      ];
      const { result } = renderHook(() => useCalendar(), {
        wrapper: createWrapper({ events, defaultDate: "2024-06-15", defaultView: "month" }),
      });

      expect(result.current.visibleEvents).toHaveLength(1);
      expect(result.current.visibleEvents[0].id).toBe("in-range");
    });

    it("returns visibleRange", () => {
      const { result } = renderHook(() => useCalendar(), {
        wrapper: createWrapper({ defaultDate: "2024-06-15", defaultView: "day" }),
      });

      expect(result.current.visibleRange.start).toBe("2024-06-15");
      expect(result.current.visibleRange.end).toBe("2024-06-15");
    });

    it("returns locale and weekStartsOn", () => {
      const { result } = renderHook(() => useCalendar(), {
        wrapper: createWrapper({ locale: { locale: "es-ES", weekStartsOn: 1 } }),
      });

      expect(result.current.locale).toBe("es-ES");
      expect(result.current.weekStartsOn).toBe(1);
    });
  });

  describe("navigation", () => {
    it("prev navigates to previous period", () => {
      const { result } = renderHook(() => useCalendar(), {
        wrapper: createWrapper({ defaultDate: "2024-06-15", defaultView: "month" }),
      });

      act(() => {
        result.current.prev();
      });

      expect(result.current.currentDate).toBe("2024-05-15");
    });

    it("next navigates to next period", () => {
      const { result } = renderHook(() => useCalendar(), {
        wrapper: createWrapper({ defaultDate: "2024-06-15", defaultView: "month" }),
      });

      act(() => {
        result.current.next();
      });

      expect(result.current.currentDate).toBe("2024-07-15");
    });

    it("today navigates to today's date", () => {
      const { result } = renderHook(() => useCalendar(), {
        wrapper: createWrapper({ defaultDate: "2024-01-01", defaultView: "month" }),
      });

      act(() => {
        result.current.today();
      });

      // Should be today's date
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      expect(result.current.currentDate).toBe(`${y}-${m}-${d}`);
    });
  });

  describe("setDate / setView", () => {
    it("setDate changes the current date", () => {
      const { result } = renderHook(() => useCalendar(), {
        wrapper: createWrapper({ defaultDate: "2024-06-15" }),
      });

      act(() => {
        result.current.setDate("2024-12-25");
      });

      expect(result.current.currentDate).toBe("2024-12-25");
    });

    it("setView changes the view", () => {
      const { result } = renderHook(() => useCalendar(), {
        wrapper: createWrapper({ defaultView: "month" }),
      });

      act(() => {
        result.current.setView("week");
      });

      expect(result.current.view).toBe("week");
    });
  });

  describe("callbacks", () => {
    it("exposes onEventClick from config", () => {
      const onEventClick = vi.fn();
      const { result } = renderHook(() => useCalendar(), {
        wrapper: createWrapper({ onEventClick }),
      });

      expect(result.current.onEventClick).toBe(onEventClick);
    });

    it("exposes onSlotClick from config", () => {
      const onSlotClick = vi.fn();
      const { result } = renderHook(() => useCalendar(), {
        wrapper: createWrapper({ onSlotClick }),
      });

      expect(result.current.onSlotClick).toBe(onSlotClick);
    });
  });
});
