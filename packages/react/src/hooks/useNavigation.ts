import { useCallback } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import { formatToolbarTitle, type CalendarView, type DateString } from "trud-calendar-core";

export interface UseNavigationReturn {
  currentDate: DateString;
  view: CalendarView;
  /** Formatted title for the toolbar (e.g., "June 2024") */
  formattedDate: string;
  prev: () => void;
  next: () => void;
  today: () => void;
  setDate: (date: DateString) => void;
  setView: (view: CalendarView) => void;
}

export function useNavigation(): UseNavigationReturn {
  const { state, dispatch, locale } = useCalendarContext();

  const formattedDate = formatToolbarTitle(state.currentDate, state.view, locale);

  const prev = useCallback(() => dispatch({ type: "NAVIGATE_PREV" }), [dispatch]);
  const next = useCallback(() => dispatch({ type: "NAVIGATE_NEXT" }), [dispatch]);
  const today = useCallback(() => dispatch({ type: "NAVIGATE_TODAY" }), [dispatch]);
  const setDate = useCallback(
    (date: DateString) => dispatch({ type: "SET_DATE", payload: date }),
    [dispatch],
  );
  const setView = useCallback(
    (view: CalendarView) => dispatch({ type: "SET_VIEW", payload: view }),
    [dispatch],
  );

  return {
    currentDate: state.currentDate,
    view: state.view,
    formattedDate,
    prev,
    next,
    today,
    setDate,
    setView,
  };
}
