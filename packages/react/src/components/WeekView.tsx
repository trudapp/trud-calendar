import { useMemo, useRef, useEffect, useCallback } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import { useCalendarSlots } from "../context/SlotsContext";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { cn } from "../lib/cn";
import {
  getWeekViewRange,
  eachDayOfRange,
  isToday,
  isSameDay,
  formatWeekdayShort,
  formatDayNumber,
  formatTime,
  getEventsForDay,
  partitionEvents,
  computeTimePositions,
  getHourLabels,
  type CalendarEvent,
  type DateString,
  type PositionedEvent,
} from "trud-calendar-core";

interface TimeEventProps {
  positioned: PositionedEvent;
  locale: string;
  onEventClick?: (event: CalendarEvent) => void;
}

function TimeEvent({ positioned, locale, onEventClick }: TimeEventProps) {
  const { event, column, totalColumns, top, height } = positioned;
  const slots = useCalendarSlots();
  const color = event.color || "var(--trc-event-default)";

  const left = (column / totalColumns) * 100;
  const width = 100 / totalColumns;

  if (slots.timeEvent) {
    const SlotTimeEvent = slots.timeEvent;
    return (
      <div
        className="absolute px-0.5"
        style={{
          top: `${top}%`,
          height: `${height}%`,
          left: `${left}%`,
          width: `${width}%`,
        }}
      >
        <SlotTimeEvent event={event} positioned={positioned} />
      </div>
    );
  }

  return (
    <button
      className={cn(
        "absolute px-0.5 group",
      )}
      style={{
        top: `${top}%`,
        height: `${height}%`,
        left: `${left}%`,
        width: `${width}%`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick?.(event);
      }}
    >
      <div
        className={cn(
          "h-full rounded-[calc(var(--trc-radius)*0.5)]",
          "border-l-2 px-1.5 py-0.5",
          "overflow-hidden text-left",
          "group-hover:opacity-80 transition-opacity",
        )}
        style={{
          backgroundColor: `${color}20`,
          borderLeftColor: color,
        }}
      >
        <div className="text-xs font-medium text-[var(--trc-foreground)] truncate">
          {event.title}
        </div>
        {height > 4 && (
          <div className="text-xs text-[var(--trc-muted-foreground)] truncate">
            {formatTime(event.start, locale)}
          </div>
        )}
      </div>
    </button>
  );
}

interface AllDayRowProps {
  days: DateString[];
  events: CalendarEvent[];
  locale: string;
  onEventClick?: (event: CalendarEvent) => void;
}

function AllDayRow({ days, events, onEventClick }: AllDayRowProps) {
  if (events.length === 0) return null;

  return (
    <div
      className={cn(
        "grid border-b border-[var(--trc-border)]",
        "bg-[var(--trc-background)]",
      )}
      style={{ gridTemplateColumns: `4rem repeat(${days.length}, 1fr)` }}
    >
      <div className="text-xs text-[var(--trc-muted-foreground)] p-1 text-right pr-2 border-r border-[var(--trc-border)]">
        all-day
      </div>
      {days.map((day) => {
        const dayEvents = events.filter(
          (e) => e.start.slice(0, 10) <= day && e.end.slice(0, 10) >= day,
        );
        return (
          <div
            key={day}
            className="p-0.5 border-r border-[var(--trc-border)] last:border-r-0 min-h-[1.5rem]"
          >
            {dayEvents.map((event) => {
              const color = event.color || "var(--trc-event-default)";
              return (
                <button
                  key={event.id}
                  className={cn(
                    "w-full text-xs text-white font-medium",
                    "truncate px-1.5 py-0.5 rounded-sm",
                    "hover:opacity-80 transition-opacity text-left",
                  )}
                  style={{ backgroundColor: color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                >
                  {event.title}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function CurrentTimeIndicator({
  timeOfDay,
  dayStartHour,
  dayEndHour,
}: {
  timeOfDay: number;
  dayStartHour: number;
  dayEndHour: number;
}) {
  const totalHours = dayEndHour - dayStartHour;
  const top = ((timeOfDay - dayStartHour) / totalHours) * 100;

  if (top < 0 || top > 100) return null;

  return (
    <div
      className="absolute left-0 right-0 z-10 pointer-events-none"
      style={{ top: `${top}%` }}
    >
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--trc-current-time)] -ml-1.5" />
        <div className="flex-1 h-0.5 bg-[var(--trc-current-time)]" />
      </div>
    </div>
  );
}

export interface WeekViewProps {
  /** Override to show a single day (used by DayView) */
  singleDay?: DateString;
}

export function WeekView({ singleDay }: WeekViewProps) {
  const {
    state,
    visibleEvents,
    locale,
    weekStartsOn,
    dayStartHour,
    dayEndHour,
    onEventClick,
    onSlotClick,
  } = useCalendarContext();

  const { timeOfDay } = useCurrentTime();

  const gridRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    if (singleDay) return [singleDay];
    const range = getWeekViewRange(state.currentDate, weekStartsOn);
    return eachDayOfRange(range.start, range.end);
  }, [state.currentDate, weekStartsOn, singleDay]);

  const hourLabels = useMemo(
    () => getHourLabels(dayStartHour, dayEndHour, locale),
    [dayStartHour, dayEndHour, locale],
  );

  const { allDay: allDayEvents } = useMemo(
    () => partitionEvents(visibleEvents),
    [visibleEvents],
  );

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (gridRef.current) {
      const totalHours = dayEndHour - dayStartHour;
      const scrollHour = Math.max(0, new Date().getHours() - 1 - dayStartHour);
      const scrollPercent = scrollHour / totalHours;
      gridRef.current.scrollTop = scrollPercent * gridRef.current.scrollHeight;
    }
  }, [dayStartHour, dayEndHour]);

  const handleSlotClick = useCallback(
    (day: DateString, hour: number) => {
      const h = String(hour).padStart(2, "0");
      onSlotClick?.(`${day}T${h}:00:00`);
    },
    [onSlotClick],
  );

  const colCount = days.length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden" role="grid" aria-label="Week view">
      {/* Day headers */}
      <div
        className={cn(
          "grid border-b border-[var(--trc-border)]",
          "bg-[var(--trc-muted)]",
        )}
        style={{ gridTemplateColumns: `4rem repeat(${colCount}, 1fr)` }}
        role="row"
      >
        <div className="border-r border-[var(--trc-border)]" />
        {days.map((day) => {
          const todayFlag = isToday(day);
          return (
            <div
              key={day}
              className={cn(
                "text-center py-2 border-r border-[var(--trc-border)] last:border-r-0",
              )}
              role="columnheader"
            >
              <div className="text-xs font-medium text-[var(--trc-muted-foreground)] uppercase">
                {formatWeekdayShort(day, locale)}
              </div>
              <div
                className={cn(
                  "text-xl font-semibold mx-auto w-10 h-10 flex items-center justify-center rounded-full",
                  todayFlag
                    ? "bg-[var(--trc-today-bg)] text-[var(--trc-today-text)]"
                    : "text-[var(--trc-foreground)]",
                )}
                aria-current={todayFlag ? "date" : undefined}
              >
                {formatDayNumber(day, locale)}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      <AllDayRow
        days={days}
        events={allDayEvents}
        locale={locale}
        onEventClick={onEventClick}
      />

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto" ref={gridRef}>
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `4rem repeat(${colCount}, 1fr)`,
            gridTemplateRows: `repeat(${hourLabels.length}, var(--trc-hour-height))`,
          }}
        >
          {/* Hour labels + grid lines */}
          {hourLabels.map((label, idx) => (
            <div
              key={idx}
              className={cn(
                "text-xs text-[var(--trc-muted-foreground)] text-right pr-2",
                "border-r border-[var(--trc-border)]",
                "border-b border-[var(--trc-border)]",
                "-mt-2",
              )}
              style={{ gridColumn: 1, gridRow: idx + 1 }}
            >
              {label}
            </div>
          ))}

          {/* Day columns */}
          {days.map((day, dayIdx) => {
            const dayEvents = getEventsForDay(visibleEvents, day).filter(
              (e) => !e.allDay && isSameDay(e.start, e.end),
            );
            const positioned = computeTimePositions(
              dayEvents,
              dayStartHour,
              dayEndHour,
            );
            const todayFlag = isToday(day);

            return (
              <div
                key={day}
                className={cn(
                  "relative",
                  "border-r border-[var(--trc-border)] last:border-r-0",
                )}
                style={{
                  gridColumn: dayIdx + 2,
                  gridRow: `1 / ${hourLabels.length + 1}`,
                }}
              >
                {/* Hour slots (clickable) */}
                {hourLabels.map((_, hourIdx) => (
                  <div
                    key={hourIdx}
                    className="border-b border-[var(--trc-border)] hover:bg-[var(--trc-accent)]/30 transition-colors cursor-pointer"
                    style={{ height: "var(--trc-hour-height)" }}
                    onClick={() => handleSlotClick(day, dayStartHour + hourIdx)}
                  />
                ))}

                {/* Positioned events */}
                {positioned.map((p) => (
                  <TimeEvent
                    key={p.event.id}
                    positioned={p}
                    locale={locale}
                    onEventClick={onEventClick}
                  />
                ))}

                {/* Current time indicator */}
                {todayFlag && (
                  <CurrentTimeIndicator
                    timeOfDay={timeOfDay}
                    dayStartHour={dayStartHour}
                    dayEndHour={dayEndHour}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
