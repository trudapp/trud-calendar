/** ISO 8601 date string (YYYY-MM-DD) */
export type DateString = string;

/** ISO 8601 datetime string (YYYY-MM-DDTHH:mm:ss) */
export type DateTimeString = string;

/** Calendar view types */
export type CalendarView = "month" | "week" | "day" | "agenda";

/** A calendar event */
export interface CalendarEvent {
  /** Unique identifier */
  id: string;
  /** Event title */
  title: string;
  /** Start date/time as ISO 8601 string */
  start: DateTimeString;
  /** End date/time as ISO 8601 string */
  end: DateTimeString;
  /** Whether this is an all-day event */
  allDay?: boolean;
  /** Event color (CSS color value) */
  color?: string;
  /** Arbitrary metadata */
  [key: string]: unknown;
}

/** Positioned event for rendering in a time grid */
export interface PositionedEvent {
  event: CalendarEvent;
  /** Column index (0-based) within overlap group */
  column: number;
  /** Total number of columns in the overlap group */
  totalColumns: number;
  /** Top position as percentage of day (0-100) */
  top: number;
  /** Height as percentage of day */
  height: number;
}

/** A segment of a multi-day event clipped to a single day */
export interface EventSegment {
  event: CalendarEvent;
  /** The date this segment falls on */
  date: DateString;
  /** Whether this is the first day of the event */
  isStart: boolean;
  /** Whether this is the last day of the event */
  isEnd: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentType<P = any> = (props: P) => any;

/** Slot component overrides */
export interface CalendarSlots {
  toolbar?: ComponentType<ToolbarSlotProps>;
  event?: ComponentType<EventSlotProps>;
  dayCell?: ComponentType<DayCellSlotProps>;
  timeEvent?: ComponentType<TimeEventSlotProps>;
  allDayEvent?: ComponentType<AllDayEventSlotProps>;
  popover?: ComponentType<PopoverSlotProps>;
  agendaEvent?: ComponentType<AgendaEventSlotProps>;
}

export interface ToolbarSlotProps {
  currentDate: DateString;
  view: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
  formattedDate: string;
}

export interface EventSlotProps {
  event: CalendarEvent;
}

export interface DayCellSlotProps {
  date: DateString;
  isToday: boolean;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
}

export interface TimeEventSlotProps {
  event: CalendarEvent;
  positioned: PositionedEvent;
}

export interface AllDayEventSlotProps {
  event: CalendarEvent;
  segment: EventSegment;
}

export interface PopoverSlotProps {
  event: CalendarEvent;
  onClose: () => void;
}

export interface AgendaEventSlotProps {
  event: CalendarEvent;
}

/** Locale configuration */
export interface CalendarLocale {
  /** BCP 47 locale string (e.g., "en-US", "es-ES") */
  locale: string;
  /** First day of week: 0 = Sunday, 1 = Monday */
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/** Calendar configuration */
export interface CalendarConfig {
  /** Events to display */
  events: CalendarEvent[];
  /** Initial or controlled date */
  date?: DateString;
  /** Initial or controlled view */
  view?: CalendarView;
  /** Default view when uncontrolled */
  defaultView?: CalendarView;
  /** Default date when uncontrolled */
  defaultDate?: DateString;
  /** Locale settings */
  locale?: Partial<CalendarLocale>;
  /** Slot overrides */
  slots?: Partial<CalendarSlots>;
  /** Callback when an event is clicked */
  onEventClick?: (event: CalendarEvent) => void;
  /** Callback when an empty slot is clicked */
  onSlotClick?: (date: DateTimeString) => void;
  /** Callback when date changes */
  onDateChange?: (date: DateString) => void;
  /** Callback when view changes */
  onViewChange?: (view: CalendarView) => void;
  /** Hour the time grid starts (0-23), default 0 */
  dayStartHour?: number;
  /** Hour the time grid ends (0-24), default 24 */
  dayEndHour?: number;
}

/** Calendar state */
export interface CalendarState {
  currentDate: DateString;
  view: CalendarView;
}

/** Calendar action types */
export type CalendarAction =
  | { type: "NAVIGATE_PREV" }
  | { type: "NAVIGATE_NEXT" }
  | { type: "NAVIGATE_TODAY" }
  | { type: "SET_DATE"; payload: DateString }
  | { type: "SET_VIEW"; payload: CalendarView };
