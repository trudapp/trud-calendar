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
export type { EventDropHandler, EventResizeHandler, SlotSelectHandler } from "./context/CalendarContext";
export { SlotsProvider, useCalendarSlots } from "./context/SlotsContext";
export { SelectionProvider, useSelectionContext, type SelectionContextValue } from "./context/SelectionContext";

// Hooks
export { useCalendar, type UseCalendarReturn } from "./hooks/useCalendar";
export { useNavigation, type UseNavigationReturn } from "./hooks/useNavigation";
export { useEvents, type UseEventsReturn } from "./hooks/useEvents";
export { useEventLayout } from "./hooks/useEventLayout";
export { useCurrentTime, type UseCurrentTimeReturn } from "./hooks/useCurrentTime";
export { useDateFormat, type UseDateFormatReturn } from "./hooks/useDateFormat";
export { useEventResize, type UseEventResizeReturn } from "./hooks/useEventResize";
export { useSlotSelection, type UseSlotSelectionReturn } from "./hooks/useSlotSelection";
export { useEventDrag, type UseEventDragReturn, type DragState } from "./hooks/useEventDrag";
export { useGridKeyboard, type UseGridKeyboardReturn } from "./hooks/useGridKeyboard";
export { useSwipeNavigation, type UseSwipeNavigationOptions } from "./hooks/useSwipeNavigation";
export { useResponsiveView } from "./hooks/useResponsiveView";
export { useEventSelection, type UseEventSelectionReturn } from "./hooks/useEventSelection";
export { useVirtualScroll, type UseVirtualScrollOptions, type UseVirtualScrollReturn } from "./hooks/useVirtualScroll";

export {
  useUndoableEvents,
  type UseUndoableEventsOptions,
  type UseUndoableEventsReturn,
} from "./hooks/useUndoableEvents";

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
  TimedEventSegment,
  ToolbarSlotProps,
  EventSlotProps,
  DayCellSlotProps,
  TimeEventSlotProps,
  AllDayEventSlotProps,
  PopoverSlotProps,
  AgendaEventSlotProps,
  RecurrenceFrequency,
  RecurrenceDay,
  RecurrenceRule,
} from "trud-calendar-core";
