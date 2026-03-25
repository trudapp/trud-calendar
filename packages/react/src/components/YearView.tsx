import { useMemo, useCallback } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import { cn } from "../lib/cn";
import {
  parseDate,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  eachDayOfRange,
  isToday,
  isSameMonth,
  formatWeekdayNarrow,
  getEventsForDay,
  type DateString,
} from "trud-calendar-core";

export function YearView() {
  const {
    state,
    visibleEvents,
    locale,
    weekStartsOn,
    highlightedDates,
    dispatch,
  } = useCalendarContext();

  const year = parseDate(state.currentDate).getFullYear();

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthDate = `${year}-${String(i + 1).padStart(2, "0")}-01` as DateString;
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const gridStart = startOfWeek(mStart, weekStartsOn);
      const gridEnd = addDays(startOfWeek(addDays(mEnd, 6), weekStartsOn), 6);
      const days = eachDayOfRange(gridStart, gridEnd);
      // Ensure 6 rows (42 days)
      while (days.length < 42) {
        days.push(addDays(days[days.length - 1], 1));
      }
      return { monthDate, mStart, days: days.slice(0, 42) };
    });
  }, [year, weekStartsOn]);

  // Weekday headers (narrow)
  const weekdayHeaders = useMemo(() => {
    const base = `${year}-01-01` as DateString;
    const ws = startOfWeek(base, weekStartsOn);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(ws, i);
      return formatWeekdayNarrow(d, locale);
    });
  }, [year, weekStartsOn, locale]);

  const handleDayClick = useCallback(
    (day: DateString) => {
      dispatch({ type: "SET_DATE", payload: day });
      dispatch({ type: "SET_VIEW", payload: "day" });
    },
    [dispatch],
  );

  const monthFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale, { month: "long" });
  }, [locale]);

  return (
    <div className="flex-1 overflow-y-auto p-2 @[640px]:p-4">
      <div className="grid grid-cols-2 @[640px]:grid-cols-3 @[1024px]:grid-cols-4 gap-4 @[640px]:gap-6">
        {months.map(({ monthDate, mStart, days }) => {
          const monthName = monthFormatter.format(parseDate(monthDate));
          return (
            <div key={monthDate} className="min-w-0">
              {/* Month title */}
              <div className="text-sm font-semibold text-[var(--trc-foreground)] mb-1 capitalize">
                {monthName}
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-0.5">
                {weekdayHeaders.map((wd, i) => (
                  <div
                    key={i}
                    className="text-[9px] @[640px]:text-[10px] text-center text-[var(--trc-muted-foreground)] font-medium"
                  >
                    {wd}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7">
                {days.map((day) => {
                  const inMonth = isSameMonth(day, mStart);
                  const todayFlag = isToday(day);
                  const isHighlighted = highlightedDates.has(day);
                  const dayEvents = getEventsForDay(visibleEvents, day);
                  const hasEvents = dayEvents.length > 0;
                  const dayNum = parseDate(day).getDate();

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "relative text-[10px] @[640px]:text-xs p-0.5 text-center rounded-sm transition-colors",
                        "hover:bg-[var(--trc-accent)]/50",
                        !inMonth && "opacity-25",
                        isHighlighted && inMonth && "bg-[var(--trc-accent)]/30",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-5 h-5 @[640px]:w-6 @[640px]:h-6 rounded-full",
                          todayFlag && "bg-[var(--trc-today-bg)] text-[var(--trc-today-text)]",
                        )}
                      >
                        {dayNum}
                      </span>
                      {hasEvents && inMonth && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--trc-primary)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
