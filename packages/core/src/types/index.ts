/** ISO 8601 date string (YYYY-MM-DD) */
export type DateString = string;

/** ISO 8601 datetime string (YYYY-MM-DDTHH:mm:ss) */
export type DateTimeString = string;

/** Calendar view types */
export type CalendarView = "month" | "week" | "day" | "agenda";

// ── Recurrence types ────────────────────────────────────────────

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type RecurrenceDay = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

export interface RecurrenceRule {
  /** Frequency of recurrence */
  freq: RecurrenceFrequency;
  /** Interval between occurrences (default 1) */
  interval?: number;
  /** Max number of occurrences */
  count?: number;
  /** End date (inclusive) */
  until?: DateString;
  /** Days of the week (for weekly/monthly) */
  byDay?: RecurrenceDay[];
  /** Days of the month (for monthly, 1-31) */
  byMonthDay?: number[];
  /** Position within the month (e.g. 1 = first, -1 = last, for "first Monday") */
  bySetPos?: number;
}

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
  /** Recurrence rule */
  recurrence?: RecurrenceRule;
  /** Dates excluded from recurrence (YYYY-MM-DD) */
  exDates?: DateString[];
  /** ID of the parent recurring event (set on expanded instances) */
  recurringEventId?: string;
  /** Original date of this recurring instance (YYYY-MM-DD) */
  originalDate?: DateString;
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
  /** Whether this is the first segment of a multi-day timed event */
  isSegmentStart?: boolean;
  /** Whether this is the last segment of a multi-day timed event */
  isSegmentEnd?: boolean;
}

/** A segment of a multi-day timed event for week/day view rendering */
export interface TimedEventSegment {
  event: CalendarEvent;
  /** The date this segment falls on */
  day: DateString;
  /** Start fractional hour for this segment */
  startHour: number;
  /** End fractional hour for this segment */
  endHour: number;
  /** Whether this is the first day of the event */
  isStart: boolean;
  /** Whether this is the last day of the event */
  isEnd: boolean;
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

type ComponentType<P = any> = (props: P) => any; // eslint-disable-line @typescript-eslint/no-explicit-any

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

/** UI label strings — provide your own for i18n */
export interface CalendarLabels {
  today: string;
  month: string;
  week: string;
  day: string;
  agenda: string;
  allDay: string;
  noEvents: string;
  more: (count: number) => string;
}

/** Locale configuration */
export interface CalendarLocale {
  /** BCP 47 locale string (e.g., "en-US", "es-ES") */
  locale: string;
  /** First day of week: 0 = Sunday, 1 = Monday */
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** UI labels for buttons, views, etc. */
  labels?: Partial<CalendarLabels>;
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
  /** Callback when an event is dropped on a new time slot (drag & drop) */
  onEventDrop?: (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => void;
  /** Callback when an event is resized (drag bottom edge) */
  onEventResize?: (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => void;
  /** Callback when a time range is selected by dragging on empty slots */
  onSlotSelect?: (start: DateTimeString, end: DateTimeString) => void;
  /** Enable drag and drop */
  enableDnD?: boolean;
  /** Enable multi-select events (Ctrl+click, Shift+click, Ctrl+A) */
  enableMultiSelect?: boolean;
  /** Callback when selected events are deleted (Delete/Backspace key) */
  onEventsDelete?: (events: CalendarEvent[]) => void;
  /** Enable virtual scrolling for time grid events (opt-in, default false) */
  enableVirtualization?: boolean;
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
