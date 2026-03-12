import { describe, it, expect } from "vitest";
import { calendarReducer, createInitialState } from "./reducer";

describe("createInitialState", () => {
  it("creates state with defaults", () => {
    const state = createInitialState();
    expect(state.view).toBe("month");
    expect(state.currentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("accepts custom date and view", () => {
    const state = createInitialState("2024-06-15", "week");
    expect(state.currentDate).toBe("2024-06-15");
    expect(state.view).toBe("week");
  });
});

describe("calendarReducer", () => {
  const initialState = createInitialState("2024-06-15", "month");

  it("NAVIGATE_NEXT moves forward by view", () => {
    const next = calendarReducer(initialState, { type: "NAVIGATE_NEXT" });
    expect(next.currentDate).toBe("2024-07-15");
  });

  it("NAVIGATE_PREV moves backward by view", () => {
    const prev = calendarReducer(initialState, { type: "NAVIGATE_PREV" });
    expect(prev.currentDate).toBe("2024-05-15");
  });

  it("NAVIGATE_NEXT in week view moves 7 days", () => {
    const weekState = createInitialState("2024-06-15", "week");
    const next = calendarReducer(weekState, { type: "NAVIGATE_NEXT" });
    expect(next.currentDate).toBe("2024-06-22");
  });

  it("NAVIGATE_NEXT in day view moves 1 day", () => {
    const dayState = createInitialState("2024-06-15", "day");
    const next = calendarReducer(dayState, { type: "NAVIGATE_NEXT" });
    expect(next.currentDate).toBe("2024-06-16");
  });

  it("NAVIGATE_TODAY sets to today", () => {
    const result = calendarReducer(initialState, { type: "NAVIGATE_TODAY" });
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    expect(result.currentDate).toBe(`${y}-${m}-${d}`);
  });

  it("SET_DATE sets specific date", () => {
    const result = calendarReducer(initialState, {
      type: "SET_DATE",
      payload: "2024-12-25",
    });
    expect(result.currentDate).toBe("2024-12-25");
  });

  it("SET_VIEW changes the view", () => {
    const result = calendarReducer(initialState, {
      type: "SET_VIEW",
      payload: "week",
    });
    expect(result.view).toBe("week");
  });
});
