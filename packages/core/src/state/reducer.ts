import type { CalendarState, CalendarAction, CalendarView } from "../types";
import { addMonths, addWeeks, addDays, toDateString } from "../utils/date";

export function createInitialState(
  date?: string,
  view?: CalendarView,
): CalendarState {
  return {
    currentDate: date ?? toDateString(new Date()),
    view: view ?? "month",
  };
}

function navigateByView(date: string, view: CalendarView, direction: 1 | -1): string {
  switch (view) {
    case "month":
      return addMonths(date, direction);
    case "week":
      return addWeeks(date, direction);
    case "day":
      return addDays(date, direction);
    case "agenda":
      return addMonths(date, direction);
  }
}

export function calendarReducer(
  state: CalendarState,
  action: CalendarAction,
): CalendarState {
  switch (action.type) {
    case "NAVIGATE_PREV":
      return {
        ...state,
        currentDate: navigateByView(state.currentDate, state.view, -1),
      };
    case "NAVIGATE_NEXT":
      return {
        ...state,
        currentDate: navigateByView(state.currentDate, state.view, 1),
      };
    case "NAVIGATE_TODAY":
      return {
        ...state,
        currentDate: toDateString(new Date()),
      };
    case "SET_DATE":
      return {
        ...state,
        currentDate: action.payload,
      };
    case "SET_VIEW":
      return {
        ...state,
        view: action.payload,
      };
  }
}
