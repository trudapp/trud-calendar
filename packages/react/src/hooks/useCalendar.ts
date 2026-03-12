import { useCalendarContext } from "../context/CalendarContext";
import type {
  CalendarEvent,
  CalendarView,
  DateString,
  DateTimeString,
} from "trud-calendar-core";

export interface UseCalendarReturn {
  /** Current date (center of visible range) */
  currentDate: DateString;
  /** Current view */
  view: CalendarView;
  /** All events */
  events: CalendarEvent[];
  /** Events visible in current range */
  visibleEvents: CalendarEvent[];
  /** Visible date range */
  visibleRange: { start: DateString; end: DateString };
  /** Locale string */
  locale: string;
  /** First day of week (0=Sun, 1=Mon, ...) */
  weekStartsOn: number;
  /** Navigate to previous period */
  prev: () => void;
  /** Navigate to next period */
  next: () => void;
  /** Navigate to today */
  today: () => void;
  /** Set a specific date */
  setDate: (date: DateString) => void;
  /** Set a specific view */
  setView: (view: CalendarView) => void;
  /** Event click handler */
  onEventClick?: (event: CalendarEvent) => void;
  /** Slot click handler */
  onSlotClick?: (date: DateTimeString) => void;
}

export function useCalendar(): UseCalendarReturn {
  const ctx = useCalendarContext();

  return {
    currentDate: ctx.state.currentDate,
    view: ctx.state.view,
    events: ctx.events,
    visibleEvents: ctx.visibleEvents,
    visibleRange: ctx.visibleRange,
    locale: ctx.locale,
    weekStartsOn: ctx.weekStartsOn,
    prev: () => ctx.dispatch({ type: "NAVIGATE_PREV" }),
    next: () => ctx.dispatch({ type: "NAVIGATE_NEXT" }),
    today: () => ctx.dispatch({ type: "NAVIGATE_TODAY" }),
    setDate: (date) => ctx.dispatch({ type: "SET_DATE", payload: date }),
    setView: (view) => ctx.dispatch({ type: "SET_VIEW", payload: view }),
    onEventClick: ctx.onEventClick,
    onSlotClick: ctx.onSlotClick,
  };
}
