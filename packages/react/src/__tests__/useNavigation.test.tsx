import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNavigation } from "../hooks/useNavigation";
import { createWrapper } from "./test-utils";

describe("useNavigation", () => {
  describe("initial state", () => {
    it("returns currentDate and view", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper({ defaultDate: "2024-06-15", defaultView: "month" }),
      });

      expect(result.current.currentDate).toBe("2024-06-15");
      expect(result.current.view).toBe("month");
    });

    it("returns formattedDate for month view", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper({
          defaultDate: "2024-06-15",
          defaultView: "month",
          locale: { locale: "en-US", weekStartsOn: 0 },
        }),
      });

      // formatToolbarTitle for month view: "June 2024"
      expect(result.current.formattedDate).toBe("June 2024");
    });

    it("returns formattedDate for day view", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper({
          defaultDate: "2024-06-15",
          defaultView: "day",
          locale: { locale: "en-US", weekStartsOn: 0 },
        }),
      });

      // formatToolbarTitle for day view includes weekday, month, day, year
      expect(result.current.formattedDate).toContain("Saturday");
      expect(result.current.formattedDate).toContain("June");
      expect(result.current.formattedDate).toContain("15");
      expect(result.current.formattedDate).toContain("2024");
    });
  });

  describe("navigation methods", () => {
    it("prev moves backward in month view", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper({ defaultDate: "2024-06-15", defaultView: "month" }),
      });

      act(() => {
        result.current.prev();
      });

      expect(result.current.currentDate).toBe("2024-05-15");
    });

    it("next moves forward in month view", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper({ defaultDate: "2024-06-15", defaultView: "month" }),
      });

      act(() => {
        result.current.next();
      });

      expect(result.current.currentDate).toBe("2024-07-15");
    });

    it("prev moves backward by 7 days in week view", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper({ defaultDate: "2024-06-15", defaultView: "week" }),
      });

      act(() => {
        result.current.prev();
      });

      expect(result.current.currentDate).toBe("2024-06-08");
    });

    it("next moves forward by 1 day in day view", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper({ defaultDate: "2024-06-15", defaultView: "day" }),
      });

      act(() => {
        result.current.next();
      });

      expect(result.current.currentDate).toBe("2024-06-16");
    });

    it("today navigates to current date", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper({ defaultDate: "2024-01-01", defaultView: "month" }),
      });

      act(() => {
        result.current.today();
      });

      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      expect(result.current.currentDate).toBe(`${y}-${m}-${d}`);
    });

    it("setDate sets a specific date", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper({ defaultDate: "2024-06-15" }),
      });

      act(() => {
        result.current.setDate("2024-12-25");
      });

      expect(result.current.currentDate).toBe("2024-12-25");
    });

    it("setView changes the view", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper({ defaultView: "month" }),
      });

      act(() => {
        result.current.setView("week");
      });

      expect(result.current.view).toBe("week");
    });
  });

  describe("formattedDate updates with navigation", () => {
    it("updates formattedDate after prev navigation", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper({
          defaultDate: "2024-06-15",
          defaultView: "month",
          locale: { locale: "en-US", weekStartsOn: 0 },
        }),
      });

      expect(result.current.formattedDate).toBe("June 2024");

      act(() => {
        result.current.prev();
      });

      expect(result.current.formattedDate).toBe("May 2024");
    });
  });
});
