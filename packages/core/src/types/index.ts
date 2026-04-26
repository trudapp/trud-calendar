/** ISO 8601 date string (YYYY-MM-DD) */
export type DateString = string;

/** ISO 8601 datetime string (YYYY-MM-DDTHH:mm:ss) */
export type DateTimeString = string;

/** Calendar view types */
export type CalendarView = "month" | "week" | "day" | "agenda" | "year";

// ── Resource types ──────────────────────────────────────────────

/** A resource (room, person, equipment, etc.) */
export interface Resource {
  /** Unique identifier */
  id: string;
  /** Display name */
  title: string;
  /** Optional color for resource header/events */
  color?: string;
  /** Nested child resources (for grouping) */
  children?: Resource[];
  /** Arbitrary metadata */
  [key: string]: unknown;
}

/** A custom button to inject into the toolbar */
export interface CustomButton {
  /** Unique key */
  key: string;
  /** Button text */
  text: string;
  /** Click handler */
  onClick: () => void;
  /** Optional CSS class */
  className?: string;
}

/** Extra information passed when an event is dropped (e.g., resource changes) */
export interface EventDropExtra {
  /** New resource ID if the event was dropped on a different resource */
  resourceId?: string;
}

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
  /** Display mode: "auto" (default) renders as a normal event, "background" renders as a colored time block */
  display?: "auto" | "background";
  /** Resource this event belongs to (for resource views) */
  resourceId?: string;
  /**
   * IANA timezone identifier (e.g., "America/New_York", "Europe/Berlin").
   *
   * When set, `start` and `end` are interpreted as wall-clock times in this
   * zone — they survive DST transitions (a 9 AM event stays at 9 AM in its
   * zone year-round). When unset, the event is "floating": its wall-clock
   * time is shown as written, regardless of the calendar's display zone.
   *
   * This matches RFC 5545 (TZID property on VEVENT) and the iCalendar spec.
   */
  timeZone?: string;
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
  resourceHeader?: ComponentType<ResourceHeaderSlotProps>;
}

export interface ToolbarSlotProps {
  currentDate: DateString;
  view: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
  formattedDate: string;
  /** Custom buttons passed via CalendarConfig — render these in your custom toolbar */
  customButtons: CustomButton[];
  /** Whether the prev button should be disabled (validRange reached) */
  canGoPrev: boolean;
  /** Whether the next button should be disabled (validRange reached) */
  canGoNext: boolean;
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

export interface ResourceHeaderSlotProps {
  resource: Resource;
}

/** UI label strings — provide your own for i18n */
export interface CalendarLabels {
  today: string;
  month: string;
  week: string;
  day: string;
  agenda: string;
  year: string;
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
  /**
   * IANA timezone in which times are rendered to the user (e.g., the
   * now-line position, event time labels, drag/resize previews).
   *
   * - Defaults to the runtime's local zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
   * - Events with a `timeZone` are converted to this zone for display.
   * - Floating events (no `timeZone`) are shown as written, unaffected.
   * - Drag/resize math is computed in this zone, then converted back to
   *   each event's anchored zone before the change is reported.
   */
  displayTimeZone?: string;
  /** Slot overrides */
  slots?: Partial<CalendarSlots>;
  /** Callback when an event is clicked */
  onEventClick?: (event: CalendarEvent) => void;
  /** Callback when an empty slot is clicked */
  onSlotClick?: (date: DateTimeString, extra?: { resourceId?: string }) => void;
  /** Callback when date changes */
  onDateChange?: (date: DateString) => void;
  /** Callback when view changes */
  onViewChange?: (view: CalendarView) => void;
  /** Hour the time grid starts (0-23), default 0 */
  dayStartHour?: number;
  /** Hour the time grid ends (0-24), default 24 */
  dayEndHour?: number;
  /** Callback when an event is dropped on a new time slot (drag & drop) */
  onEventDrop?: (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString, extra?: EventDropExtra) => void;
  /** Callback when an event is resized (drag bottom edge) */
  onEventResize?: (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => void;
  /** Callback when a time range is selected by dragging on empty slots */
  onSlotSelect?: (start: DateTimeString, end: DateTimeString, extra?: { resourceId?: string }) => void;
  /** Enable drag and drop */
  enableDnD?: boolean;
  /** Enable multi-select events (Ctrl+click, Shift+click, Ctrl+A) */
  enableMultiSelect?: boolean;
  /** Callback when selected events are deleted (Delete/Backspace key) */
  onEventsDelete?: (events: CalendarEvent[]) => void;
  /** Enable virtual scrolling for time grid events (opt-in, default false) */
  enableVirtualization?: boolean;
  /** Snap duration in minutes for drag, resize, and slot selection (default 15) */
  snapDuration?: number;
  /** Days of the week to hide (0=Sunday, 1=Monday, ..., 6=Saturday) */
  hiddenDays?: number[];
  /** Restrict navigable date range. Prev/next buttons are disabled at bounds. */
  validRange?: { start?: DateString; end?: DateString };
  /** Dates to visually highlight across all views */
  highlightedDates?: DateString[];
  /** Show ISO week numbers in month and week views */
  showWeekNumbers?: boolean;
  /** Long press delay in ms for touch drag (default 0 — immediate). Set to e.g. 300 to avoid interfering with scroll. */
  longPressDelay?: number;
  /** Default time (HH:mm:ss) used when clicking an empty day in month view (default "09:00:00") */
  slotClickTime?: string;
  /** Resources for resource views (day/week views gain one column per resource) */
  resources?: Resource[];
  /** Auto-expand dayStartHour/dayEndHour when events fall outside the configured range */
  flexibleSlotTimeLimits?: boolean;
  /** Custom buttons to inject into the toolbar (rendered after the view switcher) */
  customButtons?: CustomButton[];
  /** Constraint callback for drag-and-drop. Return false to prevent the drop. */
  dragConstraint?: (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => boolean;
  /** Constraint callback for event resize. Return false to prevent the resize. */
  resizeConstraint?: (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => boolean;
  /** Constraint callback for slot selection. Return false to prevent the selection. */
  selectConstraint?: (start: DateTimeString, end: DateTimeString) => boolean;
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
