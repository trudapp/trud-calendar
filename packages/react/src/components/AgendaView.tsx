import { useMemo } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import { useCalendarSlots } from "../context/SlotsContext";
import { cn } from "../lib/cn";
import {
  groupEventsByDate,
  formatAgendaDate,
  formatTime,
  formatTimeRange,
  isToday,
  isMultiDayEvent,
  type CalendarEvent,
} from "trud-calendar-core";

interface AgendaEventItemProps {
  event: CalendarEvent;
  locale: string;
  onEventClick?: (event: CalendarEvent) => void;
}

function AgendaEventItem({ event, locale, onEventClick }: AgendaEventItemProps) {
  const slots = useCalendarSlots();
  const color = event.color || "var(--trc-event-default)";

  if (slots.agendaEvent) {
    const SlotAgendaEvent = slots.agendaEvent;
    return (
      <button
        className="w-full text-left"
        onClick={() => onEventClick?.(event)}
      >
        <SlotAgendaEvent event={event} />
      </button>
    );
  }

  return (
    <button
      className={cn(
        "flex items-start gap-3 w-full text-left p-3",
        "rounded-[var(--trc-radius)]",
        "hover:bg-[var(--trc-accent)] transition-colors",
      )}
      onClick={() => onEventClick?.(event)}
    >
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[var(--trc-foreground)] truncate">
          {event.title}
        </div>
        <div className="text-sm text-[var(--trc-muted-foreground)]">
          {event.allDay
            ? "All day"
            : isMultiDayEvent(event)
              ? `${formatTime(event.start, locale)} — multi-day`
              : formatTimeRange(event.start, event.end, locale)}
        </div>
      </div>
    </button>
  );
}

export function AgendaView() {
  const { visibleEvents, visibleRange, locale, onEventClick } =
    useCalendarContext();

  const grouped = useMemo(
    () =>
      groupEventsByDate(visibleEvents, visibleRange.start, visibleRange.end),
    [visibleEvents, visibleRange],
  );

  if (grouped.size === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-[var(--trc-muted-foreground)] text-sm">
          No events in this period
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4" role="list" aria-label="Agenda view">
      {Array.from(grouped.entries()).map(([date, events]) => {
        const todayFlag = isToday(date);
        return (
          <div key={date} className="mb-4" role="listitem">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 mb-1",
                "sticky top-0 z-10",
                "bg-[var(--trc-background)]",
              )}
            >
              <h3
                className={cn(
                  "text-sm font-semibold",
                  todayFlag
                    ? "text-[var(--trc-today-text)]"
                    : "text-[var(--trc-foreground)]",
                )}
              >
                {formatAgendaDate(date, locale)}
              </h3>
              {todayFlag && (
                <span className="text-xs bg-[var(--trc-today-bg)] text-[var(--trc-today-text)] px-1.5 py-0.5 rounded-full font-medium">
                  Today
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              {events.map((event) => (
                <AgendaEventItem
                  key={event.id}
                  event={event}
                  locale={locale}
                  onEventClick={onEventClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
