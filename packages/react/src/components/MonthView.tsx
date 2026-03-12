import { useMemo, useCallback } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import { useCalendarSlots } from "../context/SlotsContext";
import { cn } from "../lib/cn";
import {
  getMonthViewRange,
  eachDayOfRange,
  getWeekDays,
  startOfWeek,
  isSameMonth,
  isToday,
  formatWeekdayShort,
  formatDayNumber,
  segmentMultiDayEvent,
  isMultiDayEvent,
  sortEvents,
  formatTime,
  type CalendarEvent,
  type DateString,
  type EventSegment,
} from "trud-calendar-core";

const MAX_VISIBLE_EVENTS = 3;

interface MonthEventPillProps {
  event: CalendarEvent;
  segment?: EventSegment;
  locale: string;
  onClick?: (event: CalendarEvent) => void;
}

function MonthEventPill({ event, segment, locale, onClick }: MonthEventPillProps) {
  const isStart = segment ? segment.isStart : true;
  const isEnd = segment ? segment.isEnd : true;
  const color = event.color || "var(--trc-event-default)";

  return (
    <button
      className={cn(
        "w-full text-left text-xs truncate px-1.5 py-0.5",
        "transition-opacity hover:opacity-80",
        isStart ? "rounded-l-sm" : "",
        isEnd ? "rounded-r-sm" : "",
        !isStart && !isEnd ? "" : "",
        event.allDay || (segment && !isStart && !isEnd)
          ? "text-white font-medium"
          : "text-[var(--trc-foreground)]",
      )}
      style={{
        backgroundColor:
          event.allDay || isMultiDayEvent(event) ? color : `${color}20`,
        borderLeft:
          !event.allDay && !isMultiDayEvent(event) ? `2px solid ${color}` : undefined,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      title={event.title}
    >
      {!event.allDay && isStart && !isMultiDayEvent(event) && (
        <span className="text-[var(--trc-muted-foreground)] mr-1">
          {formatTime(event.start, locale)}
        </span>
      )}
      {event.title}
    </button>
  );
}

export function MonthView() {
  const {
    state,
    visibleEvents,
    locale,
    weekStartsOn,
    onEventClick,
    onSlotClick,
  } = useCalendarContext();
  const slots = useCalendarSlots();

  const range = useMemo(
    () => getMonthViewRange(state.currentDate, weekStartsOn),
    [state.currentDate, weekStartsOn],
  );

  const days = useMemo(() => eachDayOfRange(range.start, range.end), [range]);

  const weekDayHeaders = useMemo(() => {
    const weekStart = startOfWeek(range.start, weekStartsOn);
    return getWeekDays(weekStart);
  }, [range.start, weekStartsOn]);

  // Build event segments by day for multi-day events + single day events
  const eventsByDay = useMemo(() => {
    const map = new Map<DateString, { multiDay: EventSegment[]; singleDay: CalendarEvent[] }>();

    // Initialize all days
    for (const day of days) {
      map.set(day, { multiDay: [], singleDay: [] });
    }

    const sorted = sortEvents(visibleEvents);

    for (const event of sorted) {
      if (event.allDay || isMultiDayEvent(event)) {
        const segments = segmentMultiDayEvent(event, range.start, range.end);
        for (const seg of segments) {
          const dayEntry = map.get(seg.date);
          if (dayEntry) dayEntry.multiDay.push(seg);
        }
      } else {
        const dayStr = event.start.slice(0, 10) as DateString;
        const dayEntry = map.get(dayStr);
        if (dayEntry) dayEntry.singleDay.push(event);
      }
    }

    return map;
  }, [visibleEvents, days, range]);

  const handleSlotClick = useCallback(
    (date: DateString) => {
      onSlotClick?.(`${date}T09:00:00`);
    },
    [onSlotClick],
  );

  const weeks = useMemo(() => {
    const result: DateString[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden" role="grid" aria-label="Month view">
      {/* Weekday headers */}
      <div
        className={cn(
          "grid grid-cols-7",
          "border-b border-[var(--trc-border)]",
          "bg-[var(--trc-muted)]",
        )}
        role="row"
      >
        {weekDayHeaders.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-[var(--trc-muted-foreground)] uppercase"
            role="columnheader"
          >
            {formatWeekdayShort(day, locale)}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="flex flex-col flex-1">
        {weeks.map((week, weekIdx) => (
          <div
            key={weekIdx}
            className={cn(
              "grid grid-cols-7 flex-1 min-h-0",
              weekIdx < weeks.length - 1 && "border-b border-[var(--trc-border)]",
            )}
            role="row"
          >
            {week.map((day) => {
              const todayFlag = isToday(day);
              const currentMonth = isSameMonth(day, state.currentDate);
              const dayData = eventsByDay.get(day);
              const allEvents = [
                ...(dayData?.multiDay.map((s) => s.event) ?? []),
                ...(dayData?.singleDay ?? []),
              ];
              const totalEvents = allEvents.length;
              const visibleEventsSlice = totalEvents > MAX_VISIBLE_EVENTS ? MAX_VISIBLE_EVENTS - 1 : totalEvents;
              const hiddenCount = totalEvents - visibleEventsSlice;

              if (slots.dayCell) {
                const SlotDayCell = slots.dayCell;
                return (
                  <div key={day} role="gridcell">
                    <SlotDayCell
                      date={day}
                      isToday={todayFlag}
                      isCurrentMonth={currentMonth}
                      events={allEvents}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={day}
                  role="gridcell"
                  className={cn(
                    "flex flex-col p-1 overflow-hidden cursor-pointer",
                    "border-r border-[var(--trc-border)] last:border-r-0",
                    "hover:bg-[var(--trc-accent)]/50 transition-colors",
                    !currentMonth && "opacity-40",
                  )}
                  onClick={() => handleSlotClick(day)}
                  aria-label={day}
                >
                  {/* Day number */}
                  <div className="flex justify-center mb-0.5">
                    <span
                      className={cn(
                        "text-sm w-7 h-7 flex items-center justify-center rounded-full",
                        todayFlag
                          ? "bg-[var(--trc-today-bg)] text-[var(--trc-today-text)] font-bold"
                          : "text-[var(--trc-foreground)]",
                      )}
                      aria-current={todayFlag ? "date" : undefined}
                    >
                      {formatDayNumber(day, locale)}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="flex flex-col gap-0.5 min-h-0 overflow-hidden">
                    {dayData?.multiDay.slice(0, visibleEventsSlice).map((seg) => (
                      <MonthEventPill
                        key={`${seg.event.id}-${seg.date}`}
                        event={seg.event}
                        segment={seg}
                        locale={locale}
                        onClick={onEventClick}
                      />
                    ))}
                    {dayData?.singleDay
                      .slice(0, Math.max(0, visibleEventsSlice - (dayData?.multiDay.length ?? 0)))
                      .map((event) => (
                        <MonthEventPill
                          key={event.id}
                          event={event}
                          locale={locale}
                          onClick={onEventClick}
                        />
                      ))}
                    {hiddenCount > 0 && (
                      <button
                        className="text-xs text-[var(--trc-muted-foreground)] text-left px-1.5 hover:text-[var(--trc-foreground)] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        +{hiddenCount} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
