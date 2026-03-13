import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCurrentTime } from "../hooks/useCurrentTime";

describe("useCurrentTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns now, today, and timeOfDay", () => {
    vi.setSystemTime(new Date(2024, 5, 15, 14, 30, 0)); // June 15, 2024, 2:30 PM

    const { result } = renderHook(() => useCurrentTime());

    expect(result.current.now).toBe("2024-06-15T14:30:00");
    expect(result.current.today).toBe("2024-06-15");
    expect(result.current.timeOfDay).toBe(14.5);
  });

  it("timeOfDay is fractional hour", () => {
    vi.setSystemTime(new Date(2024, 0, 1, 9, 15, 0)); // 9:15 AM

    const { result } = renderHook(() => useCurrentTime());

    expect(result.current.timeOfDay).toBe(9.25);
  });

  it("timeOfDay is 0 at midnight", () => {
    vi.setSystemTime(new Date(2024, 0, 1, 0, 0, 0));

    const { result } = renderHook(() => useCurrentTime());

    expect(result.current.timeOfDay).toBe(0);
  });

  it("updates on interval", () => {
    vi.setSystemTime(new Date(2024, 5, 15, 10, 0, 0));

    const { result } = renderHook(() => useCurrentTime(1000));

    expect(result.current.timeOfDay).toBe(10);

    act(() => {
      vi.setSystemTime(new Date(2024, 5, 15, 10, 30, 0));
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timeOfDay).toBe(10.5);
  });

  it("uses default interval of 60 seconds", () => {
    vi.setSystemTime(new Date(2024, 5, 15, 10, 0, 0));

    const { result } = renderHook(() => useCurrentTime());

    expect(result.current.timeOfDay).toBe(10);

    // Advance less than 60s - should NOT update (interval hasn't fired)
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    // timeOfDay still reflects initial value since interval hasn't fired yet
    expect(result.current.timeOfDay).toBe(10);

    // Advance to 60s total - interval fires, reads new system time
    act(() => {
      vi.setSystemTime(new Date(2024, 5, 15, 10, 30, 0));
      vi.advanceTimersByTime(30_000);
    });

    expect(result.current.timeOfDay).toBe(10.5);
  });

  it("cleans up interval on unmount", () => {
    vi.setSystemTime(new Date(2024, 5, 15, 10, 0, 0));

    const { unmount } = renderHook(() => useCurrentTime(1000));

    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
