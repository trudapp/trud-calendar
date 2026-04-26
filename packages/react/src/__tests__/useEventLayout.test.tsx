import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEventLayout } from "../hooks/useEventLayout";
import { createWrapper, makeEvent } from "./test-utils";

describe("useEventLayout", () => {
  const wrapper = createWrapper({
    defaultDate: "2024-06-15",
    defaultView: "day",
    dayStartHour: 0,
    dayEndHour: 24,
  });

  it("returns empty array for no events", () => {
    const { result } = renderHook(() => useEventLayout([]), { wrapper });

    expect(result.current).toEqual([]);
  });

  it("positions a single event with correct top and height", () => {
    const events = [
      makeEvent("1", "2024-06-15T06:00:00", "2024-06-15T12:00:00"),
    ];

    const { result } = renderHook(() => useEventLayout(events), { wrapper });

    expect(result.current).toHaveLength(1);
    const positioned = result.current[0];
    // 6/24 * 100 = 25
    expect(positioned.top).toBe(25);
    // (12-6)/24 * 100 = 25
    expect(positioned.height).toBe(25);
    expect(positioned.column).toBe(0);
    expect(positioned.totalColumns).toBe(1);
  });

  it("non-overlapping events get separate columns with totalColumns=1", () => {
    const events = [
      makeEvent("1", "2024-06-15T08:00:00", "2024-06-15T09:00:00"),
      makeEvent("2", "2024-06-15T10:00:00", "2024-06-15T11:00:00"),
    ];

    const { result } = renderHook(() => useEventLayout(events), { wrapper });

    expect(result.current).toHaveLength(2);
    // Non-overlapping events are in their own overlap groups, each with 1 column
    expect(result.current[0].totalColumns).toBe(1);
    expect(result.current[1].totalColumns).toBe(1);
    expect(result.current[0].column).toBe(0);
    expect(result.current[1].column).toBe(0);
  });

  it("overlapping events share columns (totalColumns > 1)", () => {
    const events = [
      makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T12:00:00"),
      makeEvent("2", "2024-06-15T11:00:00", "2024-06-15T13:00:00"),
    ];

    const { result } = renderHook(() => useEventLayout(events), { wrapper });

    expect(result.current).toHaveLength(2);
    expect(result.current[0].totalColumns).toBe(2);
    expect(result.current[1].totalColumns).toBe(2);
    expect(result.current[0].column).not.toBe(result.current[1].column);
  });

  it("three overlapping events get three columns", () => {
    const events = [
      makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T12:00:00"),
      makeEvent("2", "2024-06-15T10:30:00", "2024-06-15T11:30:00"),
      makeEvent("3", "2024-06-15T11:00:00", "2024-06-15T13:00:00"),
    ];

    const { result } = renderHook(() => useEventLayout(events), { wrapper });

    expect(result.current).toHaveLength(3);
    // All three overlap, so totalColumns should be >= 2
    const totalCols = result.current[0].totalColumns;
    expect(totalCols).toBeGreaterThanOrEqual(2);

    // Each event should have a unique column
    const columns = result.current.map((p) => p.column);
    const uniqueColumns = new Set(columns);
    expect(uniqueColumns.size).toBe(totalCols);
  });

  it("returns correct top/height for custom dayStartHour/dayEndHour", () => {
    const customWrapper = createWrapper({
      defaultDate: "2024-06-15",
      defaultView: "day",
      dayStartHour: 8,
      dayEndHour: 20,
    });

    const events = [
      makeEvent("1", "2024-06-15T08:00:00", "2024-06-15T14:00:00"),
    ];

    const { result } = renderHook(() => useEventLayout(events), {
      wrapper: customWrapper,
    });

    expect(result.current).toHaveLength(1);
    const positioned = result.current[0];
    // dayStart=8, dayEnd=20, total=12h
    // top = (8-8)/12 * 100 = 0
    expect(positioned.top).toBe(0);
    // height = (14-8)/12 * 100 = 50
    expect(positioned.height).toBe(50);
  });

  it("positions event mid-day correctly", () => {
    const events = [
      makeEvent("1", "2024-06-15T12:00:00", "2024-06-15T13:00:00"),
    ];

    const { result } = renderHook(() => useEventLayout(events), { wrapper });

    expect(result.current).toHaveLength(1);
    const positioned = result.current[0];
    // top = 12/24 * 100 = 50
    expect(positioned.top).toBe(50);
    // height = 1/24 * 100 ≈ 4.1667
    expect(positioned.height).toBeCloseTo(100 / 24, 2);
  });

  // ── Phase 6.7: TZ-aware positioning via context ──────────────────
  it("converts anchored event positions to displayTimeZone wall-clock", () => {
    // April 27 2026 is in EDT (UTC-4). NY 9:00 → UTC 13:00 → Tokyo 22:00.
    const tokyoWrapper = createWrapper({
      defaultDate: "2026-04-27",
      defaultView: "day",
      dayStartHour: 0,
      dayEndHour: 24,
      displayTimeZone: "Asia/Tokyo",
    });

    const events = [
      {
        id: "1",
        title: "OKR",
        start: "2026-04-27T09:00:00",
        end: "2026-04-27T10:00:00",
        timeZone: "America/New_York",
      },
    ];

    const { result } = renderHook(() => useEventLayout(events), {
      wrapper: tokyoWrapper,
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].top).toBeCloseTo((22 / 24) * 100, 5);
  });

  it("leaves floating events at literal wall-clock when displayTimeZone is set", () => {
    const tokyoWrapper = createWrapper({
      defaultDate: "2026-04-27",
      defaultView: "day",
      dayStartHour: 0,
      dayEndHour: 24,
      displayTimeZone: "Asia/Tokyo",
    });

    const events = [makeEvent("1", "2026-04-27T09:00:00", "2026-04-27T10:00:00")];

    const { result } = renderHook(() => useEventLayout(events), {
      wrapper: tokyoWrapper,
    });

    expect(result.current[0].top).toBeCloseTo((9 / 24) * 100, 5);
  });
});
