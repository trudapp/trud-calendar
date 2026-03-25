// Types
export type {
  DateString,
  DateTimeString,
  CalendarView,
  CalendarEvent,
  PositionedEvent,
  TimedEventSegment,
  EventSegment,
  CalendarSlots,
  ToolbarSlotProps,
  EventSlotProps,
  DayCellSlotProps,
  TimeEventSlotProps,
  AllDayEventSlotProps,
  PopoverSlotProps,
  AgendaEventSlotProps,
  CalendarLabels,
  CalendarLocale,
  CalendarConfig,
  CalendarState,
  CalendarAction,
  RecurrenceFrequency,
  RecurrenceDay,
  RecurrenceRule,
  Resource,
  ResourceHeaderSlotProps,
  EventDropExtra,
  CustomButton,
} from "./types";

// Constants
export {
  DEFAULT_LABELS,
  DEFAULT_LOCALE,
  DEFAULT_VIEW,
  HOURS_IN_DAY,
  MINUTES_IN_HOUR,
  MINUTES_IN_DAY,
  VIEWS,
  DEFAULT_DAY_START_HOUR,
  DEFAULT_DAY_END_HOUR,
  DEFAULT_SNAP_DURATION,
} from "./constants";

// Date utilities
export {
  parseDate,
  toDateString,
  toDateTimeString,
  addDays,
  addMonths,
  addWeeks,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isSameMonth,
  isToday,
  isBefore,
  isAfter,
  rangesOverlap,
  dateInRange,
  daysBetween,
  eachDayOfRange,
  getWeekDays,
  getMonthViewRange,
  getWeekViewRange,
  getVisibleRange,
  getTimeOfDay,
  getDurationHours,
  getHourLabels,
  filterHiddenDays,
  getISOWeekNumber,
} from "./utils/date";

// Formatting utilities
export {
  formatToolbarTitle,
  formatWeekdayShort,
  formatWeekdayNarrow,
  formatDayNumber,
  formatTime,
  formatTimeRange,
  formatAgendaDate,
  formatMonthDay,
} from "./utils/format";

// State
export { calendarReducer, createInitialState } from "./state/reducer";

// Event utilities
export {
  sortEvents,
  filterEventsInRange,
  getEventsForDay,
  isMultiDayEvent,
  partitionEvents,
  segmentMultiDayEvent,
  segmentTimedMultiDayEvent,
  getEventSegments,
  buildOverlapGroups,
  assignColumns,
  computeTimePositions,
  groupEventsByDate,
} from "./utils/events";

// Time utilities (shared by resize, create, drop)
export {
  snapToIncrement,
  fractionalHourToDateTime,
  yPositionToFractionalHour,
  normalizeRange,
  computeDropPosition,
} from "./utils/time";

// Recurrence utilities
export {
  generateOccurrences,
  expandRecurringEvents,
  parseRRule,
  toRRuleString,
} from "./utils/recurrence";

// Virtualization utilities
export type { VirtualRange } from "./utils/virtualize";
export { filterVisibleEvents, scrollToViewportRange } from "./utils/virtualize";

// Undo/redo utilities
export type { UndoStack } from "./utils/undo";
// iCal export
export { eventsToICal, downloadICal } from "./utils/ical";

// Resource utilities
export {
  flattenResources,
  getEventsForResource,
  groupEventsByResource,
} from "./utils/resources";

export {
  createUndoStack,
  pushState,
  undo,
  redo,
  canUndo,
  canRedo,
} from "./utils/undo";
