import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDateFormat } from "../hooks/useDateFormat";
import { createWrapper } from "./test-utils";

describe("useDateFormat", () => {
  const wrapper = createWrapper({
    locale: { locale: "en-US", weekStartsOn: 0 },
  });

  describe("toolbarTitle", () => {
    it("formats month view title as 'Month Year'", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      expect(result.current.toolbarTitle("2024-06-15", "month")).toBe(
        "June 2024",
      );
    });

    it("formats day view title with full weekday", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const title = result.current.toolbarTitle("2024-06-15", "day");
      expect(title).toContain("Saturday");
      expect(title).toContain("June");
      expect(title).toContain("15");
      expect(title).toContain("2024");
    });

    it("formats week view title with short month + day + year", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const title = result.current.toolbarTitle("2024-06-15", "week");
      expect(title).toContain("Jun");
      expect(title).toContain("15");
      expect(title).toContain("2024");
    });

    it("formats agenda view title as 'Month Year'", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      expect(result.current.toolbarTitle("2024-06-15", "agenda")).toBe(
        "June 2024",
      );
    });
  });

  describe("time", () => {
    it("formats ISO time string", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const formatted = result.current.time("2024-06-15T14:30:00");
      // en-US: "2:30 PM"
      expect(formatted).toContain("2");
      expect(formatted).toContain("30");
      expect(formatted).toMatch(/PM/i);
    });

    it("formats morning time", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const formatted = result.current.time("2024-06-15T09:00:00");
      expect(formatted).toContain("9");
      expect(formatted).toContain("00");
      expect(formatted).toMatch(/AM/i);
    });
  });

  describe("timeRange", () => {
    it("formats start-end time range", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const formatted = result.current.timeRange(
        "2024-06-15T10:00:00",
        "2024-06-15T11:30:00",
      );
      expect(formatted).toContain("10");
      expect(formatted).toContain("11");
      expect(formatted).toContain("30");
      // Should contain a separator
      expect(formatted).toContain("–");
    });
  });

  describe("weekdayShort", () => {
    it("returns short day name for Saturday", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      // 2024-06-15 is Saturday
      const day = result.current.weekdayShort("2024-06-15");
      expect(day).toBe("Sat");
    });

    it("returns short day name for Monday", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      // 2024-06-10 is Monday
      const day = result.current.weekdayShort("2024-06-10");
      expect(day).toBe("Mon");
    });

    it("returns short day name for Sunday", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      // 2024-06-09 is Sunday
      const day = result.current.weekdayShort("2024-06-09");
      expect(day).toBe("Sun");
    });
  });

  describe("weekdayNarrow", () => {
    it("returns narrow weekday letter", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      // 2024-06-10 is Monday -> "M"
      const day = result.current.weekdayNarrow("2024-06-10");
      expect(day).toBe("M");
    });
  });

  describe("dayNumber", () => {
    it("returns day number as string", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      expect(result.current.dayNumber("2024-06-15")).toBe("15");
      expect(result.current.dayNumber("2024-06-01")).toBe("1");
    });
  });

  describe("agendaDate", () => {
    it("formats full date for agenda view", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const formatted = result.current.agendaDate("2024-06-15");
      expect(formatted).toContain("Saturday");
      expect(formatted).toContain("June");
      expect(formatted).toContain("15");
    });
  });

  describe("monthDay", () => {
    it("formats month and day for column headers", () => {
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const formatted = result.current.monthDay("2024-06-15");
      expect(formatted).toContain("Jun");
      expect(formatted).toContain("15");
    });
  });

  describe("with different locale", () => {
    it("formats correctly with es-ES locale", () => {
      const esWrapper = createWrapper({
        locale: { locale: "es-ES", weekStartsOn: 1 },
      });

      const { result } = renderHook(() => useDateFormat(), {
        wrapper: esWrapper,
      });

      const title = result.current.toolbarTitle("2024-06-15", "month");
      // Spanish: "junio 2024" (lowercase month in Spanish)
      expect(title.toLowerCase()).toContain("junio");
      expect(title).toContain("2024");
    });
  });
});
