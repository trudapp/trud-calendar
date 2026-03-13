// Components
export { Calendar, type CalendarProps } from "./components/Calendar";
export { Toolbar } from "./components/Toolbar";
export { MonthView } from "./components/MonthView";
export { WeekView } from "./components/WeekView";
export { DayView } from "./components/DayView";
export { AgendaView } from "./components/AgendaView";
export { EventPopoverContent, useEventPopover } from "./components/EventPopover";

// Context
export { CalendarProvider, useCalendarContext } from "./context/CalendarContext";
export type { EventDropHandler } from "./context/CalendarContext";
export { SlotsProvider, useCalendarSlots } from "./context/SlotsContext";

// Hooks
export { useCalendar, type UseCalendarReturn } from "./hooks/useCalendar";
export { useNavigation, type UseNavigationReturn } from "./hooks/useNavigation";
export { useEvents, type UseEventsReturn } from "./hooks/useEvents";
export { useEventLayout } from "./hooks/useEventLayout";
export { useCurrentTime, type UseCurrentTimeReturn } from "./hooks/useCurrentTime";
export { useDateFormat, type UseDateFormatReturn } from "./hooks/useDateFormat";

// Utilities
export { cn } from "./lib/cn";

// Re-export core types for convenience
export type {
  CalendarEvent,
  CalendarView,
  CalendarConfig,
  CalendarSlots,
  CalendarLocale,
  CalendarLabels,
  DateString,
  DateTimeString,
  PositionedEvent,
  EventSegment,
  ToolbarSlotProps,
  EventSlotProps,
  DayCellSlotProps,
  TimeEventSlotProps,
  AllDayEventSlotProps,
  PopoverSlotProps,
  AgendaEventSlotProps,
} from "trud-calendar-core";
