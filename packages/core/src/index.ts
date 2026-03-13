// Types
export type {
  DateString,
  DateTimeString,
  CalendarView,
  CalendarEvent,
  PositionedEvent,
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
  getEventSegments,
  buildOverlapGroups,
  assignColumns,
  computeTimePositions,
  groupEventsByDate,
} from "./utils/events";
