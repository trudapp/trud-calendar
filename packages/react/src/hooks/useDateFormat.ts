import { useCallback } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import {
  formatToolbarTitle,
  formatWeekdayShort,
  formatWeekdayNarrow,
  formatDayNumber,
  formatTime,
  formatTimeRange,
  formatAgendaDate,
  formatMonthDay,
  eventWallToDisplay,
  type CalendarView,
  type DateString,
  type DateTimeString,
} from "trud-calendar-core";

export interface UseDateFormatReturn {
  toolbarTitle: (date: DateString, view: CalendarView) => string;
  weekdayShort: (date: DateString) => string;
  weekdayNarrow: (date: DateString) => string;
  dayNumber: (date: DateString) => string;
  /**
   * Format an event time. Pass `eventTimeZone` for events anchored to a
   * specific zone — the time will be converted to the calendar's display
   * zone before formatting. Floating events omit the second argument.
   */
  time: (datetime: DateTimeString, eventTimeZone?: string) => string;
  timeRange: (
    start: DateTimeString,
    end: DateTimeString,
    eventTimeZone?: string,
  ) => string;
  agendaDate: (date: DateString) => string;
  monthDay: (date: DateString) => string;
}

export function useDateFormat(): UseDateFormatReturn {
  const { locale, displayTimeZone } = useCalendarContext();

  return {
    toolbarTitle: useCallback(
      (date: DateString, view: CalendarView) =>
        formatToolbarTitle(date, view, locale),
      [locale],
    ),
    weekdayShort: useCallback(
      (date: DateString) => formatWeekdayShort(date, locale),
      [locale],
    ),
    weekdayNarrow: useCallback(
      (date: DateString) => formatWeekdayNarrow(date, locale),
      [locale],
    ),
    dayNumber: useCallback(
      (date: DateString) => formatDayNumber(date, locale),
      [locale],
    ),
    time: useCallback(
      (datetime: DateTimeString, eventTimeZone?: string) =>
        formatTime(eventWallToDisplay(datetime, eventTimeZone, displayTimeZone), locale),
      [locale, displayTimeZone],
    ),
    timeRange: useCallback(
      (start: DateTimeString, end: DateTimeString, eventTimeZone?: string) =>
        formatTimeRange(
          eventWallToDisplay(start, eventTimeZone, displayTimeZone),
          eventWallToDisplay(end, eventTimeZone, displayTimeZone),
          locale,
        ),
      [locale, displayTimeZone],
    ),
    agendaDate: useCallback(
      (date: DateString) => formatAgendaDate(date, locale),
      [locale],
    ),
    monthDay: useCallback(
      (date: DateString) => formatMonthDay(date, locale),
      [locale],
    ),
  };
}
