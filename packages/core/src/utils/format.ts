import type { DateString, DateTimeString, CalendarView } from "../types";
import { parseDate } from "./date";

// ── Memoized Intl formatters ─────────────────────────────────────

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, fmt);
  }
  return fmt;
}

// ── Public formatting functions ──────────────────────────────────

/** Format a date for the toolbar title based on view */
export function formatToolbarTitle(
  date: DateString,
  view: CalendarView,
  locale: string = "en-US",
): string {
  const d = parseDate(date);
  switch (view) {
    case "month":
      return getFormatter(locale, { month: "long", year: "numeric" }).format(d);
    case "week": {
      const weekFmt = getFormatter(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return weekFmt.format(d);
    }
    case "day":
      return getFormatter(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(d);
    case "agenda":
      return getFormatter(locale, { month: "long", year: "numeric" }).format(d);
  }
}

/** Format a date as a short weekday name (Mon, Tue, ...) */
export function formatWeekdayShort(date: DateString, locale: string = "en-US"): string {
  return getFormatter(locale, { weekday: "short" }).format(parseDate(date));
}

/** Format a date as a narrow weekday name (M, T, ...) */
export function formatWeekdayNarrow(date: DateString, locale: string = "en-US"): string {
  return getFormatter(locale, { weekday: "narrow" }).format(parseDate(date));
}

/** Format a day number */
export function formatDayNumber(date: DateString, locale: string = "en-US"): string {
  return getFormatter(locale, { day: "numeric" }).format(parseDate(date));
}

/** Format a time (e.g., "2:30 PM") */
export function formatTime(datetime: DateTimeString, locale: string = "en-US"): string {
  return getFormatter(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parseDate(datetime));
}

/** Format a time range */
export function formatTimeRange(
  start: DateTimeString,
  end: DateTimeString,
  locale: string = "en-US",
): string {
  return `${formatTime(start, locale)} – ${formatTime(end, locale)}`;
}

/** Format a full date for agenda view */
export function formatAgendaDate(date: DateString, locale: string = "en-US"): string {
  return getFormatter(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(parseDate(date));
}

/** Format month + day for column headers */
export function formatMonthDay(date: DateString, locale: string = "en-US"): string {
  return getFormatter(locale, {
    month: "short",
    day: "numeric",
  }).format(parseDate(date));
}
