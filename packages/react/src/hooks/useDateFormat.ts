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
  type CalendarView,
  type DateString,
  type DateTimeString,
} from "trud-calendar-core";

export interface UseDateFormatReturn {
  toolbarTitle: (date: DateString, view: CalendarView) => string;
  weekdayShort: (date: DateString) => string;
  weekdayNarrow: (date: DateString) => string;
  dayNumber: (date: DateString) => string;
  time: (datetime: DateTimeString) => string;
  timeRange: (start: DateTimeString, end: DateTimeString) => string;
  agendaDate: (date: DateString) => string;
  monthDay: (date: DateString) => string;
}

export function useDateFormat(): UseDateFormatReturn {
  const { locale } = useCalendarContext();

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
      (datetime: DateTimeString) => formatTime(datetime, locale),
      [locale],
    ),
    timeRange: useCallback(
      (start: DateTimeString, end: DateTimeString) =>
        formatTimeRange(start, end, locale),
      [locale],
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
