import { describe, it, expect } from "vitest";
import { anchorWallToEventZone, anchorTimesToEventZone } from "../lib/anchorTimes";

describe("anchorWallToEventZone", () => {
  it("returns the wall unchanged for floating events", () => {
    expect(anchorWallToEventZone("2026-03-13T09:00:00", undefined, "Europe/Berlin")).toBe(
      "2026-03-13T09:00:00",
    );
  });

  it("returns the wall unchanged when zones match", () => {
    expect(anchorWallToEventZone("2026-03-13T09:00:00", "Europe/Berlin", "Europe/Berlin")).toBe(
      "2026-03-13T09:00:00",
    );
  });

  it("converts a Berlin display wall to NY event wall in winter", () => {
    // Berlin 15:00 CET → UTC 14:00 → NY 09:00 EST.
    expect(anchorWallToEventZone("2026-01-15T15:00:00", "America/New_York", "Europe/Berlin")).toBe(
      "2026-01-15T09:00:00",
    );
  });

  it("converts a Tokyo display wall to NY event wall (date crosses backward)", () => {
    // Tokyo 09:00 JST → UTC 00:00 → NY 19:00 EST previous day.
    expect(anchorWallToEventZone("2026-01-15T09:00:00", "America/New_York", "Asia/Tokyo")).toBe(
      "2026-01-14T19:00:00",
    );
  });
});

describe("anchorTimesToEventZone", () => {
  it("preserves duration through cross-zone conversion", () => {
    // A 2-hour drop at Berlin 15:00–17:00 lands on NY 09:00–11:00 (winter).
    const { newStart, newEnd } = anchorTimesToEventZone(
      "2026-01-15T15:00:00",
      "2026-01-15T17:00:00",
      "America/New_York",
      "Europe/Berlin",
    );
    expect(newStart).toBe("2026-01-15T09:00:00");
    expect(newEnd).toBe("2026-01-15T11:00:00");
  });

  it("returns wall unchanged for floating events", () => {
    const { newStart, newEnd } = anchorTimesToEventZone(
      "2026-01-15T15:00:00",
      "2026-01-15T17:00:00",
      undefined,
      "Europe/Berlin",
    );
    expect(newStart).toBe("2026-01-15T15:00:00");
    expect(newEnd).toBe("2026-01-15T17:00:00");
  });
});
