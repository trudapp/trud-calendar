import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import {
  calendarReducer,
  createInitialState,
  toDateString,
  getVisibleRange,
  filterEventsInRange,
  sortEvents,
  expandRecurringEvents,
  type CalendarEvent,
  type CalendarView,
  type CalendarState,
  type CalendarAction,
  type CalendarConfig,
  type DateString,
  type DateTimeString,
  type CalendarLabels,
  DEFAULT_LOCALE,
  DEFAULT_LABELS,
  DEFAULT_DAY_START_HOUR,
  DEFAULT_DAY_END_HOUR,
} from "trud-calendar-core";

export type EventDropHandler = (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => void;
export type EventResizeHandler = (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => void;
export type SlotSelectHandler = (start: DateTimeString, end: DateTimeString) => void;

interface CalendarContextValue {
  state: CalendarState;
  dispatch: React.Dispatch<CalendarAction>;
  events: CalendarEvent[];
  visibleEvents: CalendarEvent[];
  visibleRange: { start: DateString; end: DateString };
  locale: string;
  weekStartsOn: number;
  dayStartHour: number;
  dayEndHour: number;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: DateTimeString) => void;
  onDateChange?: (date: DateString) => void;
  onViewChange?: (view: CalendarView) => void;
  onEventDrop?: EventDropHandler;
  onEventResize?: EventResizeHandler;
  onSlotSelect?: SlotSelectHandler;
  enableDnD?: boolean;
  enableVirtualization?: boolean;
  labels: CalendarLabels;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function useCalendarContext(): CalendarContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error("useCalendarContext must be used within a CalendarProvider");
  }
  return ctx;
}

interface CalendarProviderProps {
  config: CalendarConfig;
  children: ReactNode;
}

export function CalendarProvider({ config, children }: CalendarProviderProps) {
  const locale = config.locale?.locale ?? DEFAULT_LOCALE.locale;
  const weekStartsOn = config.locale?.weekStartsOn ?? DEFAULT_LOCALE.weekStartsOn;
  const dayStartHour = config.dayStartHour ?? DEFAULT_DAY_START_HOUR;
  const dayEndHour = config.dayEndHour ?? DEFAULT_DAY_END_HOUR;
  const labels: CalendarLabels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...config.locale?.labels }),
    [config.locale?.labels],
  );

  // Support controlled & uncontrolled date/view
  const isDateControlled = config.date !== undefined;
  const isViewControlled = config.view !== undefined;

  const [internalState, dispatch] = useReducer(
    calendarReducer,
    createInitialState(
      config.date ?? config.defaultDate ?? toDateString(new Date()),
      config.view ?? config.defaultView ?? "month",
    ),
  );

  const state: CalendarState = {
    currentDate: isDateControlled ? config.date! : internalState.currentDate,
    view: isViewControlled ? config.view! : internalState.view,
  };

  const wrappedDispatch = useCallback(
    (action: CalendarAction) => {
      dispatch(action);

      // Fire callbacks for controlled mode
      if (action.type === "SET_VIEW" || action.type === "SET_DATE") {
        if (action.type === "SET_VIEW") config.onViewChange?.(action.payload);
        if (action.type === "SET_DATE") config.onDateChange?.(action.payload);
      }
      if (
        action.type === "NAVIGATE_PREV" ||
        action.type === "NAVIGATE_NEXT" ||
        action.type === "NAVIGATE_TODAY"
      ) {
        // We need to compute the new date to fire the callback
        const newState = calendarReducer(state, action);
        config.onDateChange?.(newState.currentDate);
      }
    },
    [state, config.onDateChange, config.onViewChange],
  );

  const visibleRange = useMemo(
    () => getVisibleRange(state.currentDate, state.view, weekStartsOn),
    [state.currentDate, state.view, weekStartsOn],
  );

  const visibleEvents = useMemo(
    () => {
      const expanded = expandRecurringEvents(config.events, visibleRange.start, visibleRange.end);
      return sortEvents(
        filterEventsInRange(expanded, visibleRange.start, visibleRange.end),
      );
    },
    [config.events, visibleRange.start, visibleRange.end],
  );

  const value = useMemo<CalendarContextValue>(
    () => ({
      state,
      dispatch: wrappedDispatch,
      events: config.events,
      visibleEvents,
      visibleRange,
      locale,
      weekStartsOn,
      dayStartHour,
      dayEndHour,
      onEventClick: config.onEventClick,
      onSlotClick: config.onSlotClick,
      onDateChange: config.onDateChange,
      onViewChange: config.onViewChange,
      onEventDrop: config.onEventDrop,
      onEventResize: config.onEventResize,
      onSlotSelect: config.onSlotSelect,
      enableDnD: config.enableDnD,
      enableVirtualization: config.enableVirtualization,
      labels,
    }),
    [
      state,
      wrappedDispatch,
      config.events,
      visibleEvents,
      visibleRange,
      locale,
      weekStartsOn,
      dayStartHour,
      dayEndHour,
      config.onEventClick,
      config.onSlotClick,
      config.onDateChange,
      config.onViewChange,
      config.onEventDrop,
      config.onEventResize,
      config.onSlotSelect,
      config.enableDnD,
      config.enableVirtualization,
      labels,
    ],
  );

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}
