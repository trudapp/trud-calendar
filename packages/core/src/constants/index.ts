import type { CalendarLabels, CalendarLocale, CalendarView } from "../types";

export const DEFAULT_LABELS: CalendarLabels = {
  today: "Today",
  month: "Month",
  week: "Week",
  day: "Day",
  agenda: "Agenda",
  year: "Year",
  allDay: "all-day",
  noEvents: "No events in this period",
  more: (n: number) => `+${n} more`,
};

export const DEFAULT_LOCALE: CalendarLocale = {
  locale: "en-US",
  weekStartsOn: 0,
};

export const DEFAULT_VIEW: CalendarView = "month";

export const HOURS_IN_DAY = 24;
export const MINUTES_IN_HOUR = 60;
export const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;

export const VIEWS: CalendarView[] = ["month", "week", "day", "agenda", "year"];

export const DEFAULT_DAY_START_HOUR = 0;
export const DEFAULT_DAY_END_HOUR = 24;
export const DEFAULT_SNAP_DURATION = 15;
