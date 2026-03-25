import { describe, it, expect } from "vitest";
import { formatToolbarTitle } from "./format";

describe("formatToolbarTitle", () => {
  it("returns only the year for 'year' view in en-US", () => {
    expect(formatToolbarTitle("2026-03-25", "year", "en-US")).toBe("2026");
  });

  it("returns only the year for 'year' view in es-ES", () => {
    expect(formatToolbarTitle("2026-03-25", "year", "es-ES")).toBe("2026");
  });

  it("returns month and year for 'month' view", () => {
    const result = formatToolbarTitle("2026-03-25", "month", "en-US");
    expect(result).toContain("March");
    expect(result).toContain("2026");
  });

  it("returns weekday, month, day, and year for 'day' view", () => {
    const result = formatToolbarTitle("2026-03-25", "day", "en-US");
    expect(result).toContain("March");
    expect(result).toContain("25");
    expect(result).toContain("2026");
  });
});
