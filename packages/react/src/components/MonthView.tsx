import { useMemo, useCallback, useState, useRef, useEffect } from "react";
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
  formatAgendaDate,
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
  enableDnD?: boolean;
  draggingId?: string | null;
}

function MonthEventPill({ event, segment, locale, onClick, enableDnD, draggingId }: MonthEventPillProps) {
  const isStart = segment ? segment.isStart : true;
  const isEnd = segment ? segment.isEnd : true;
  const color = event.color || "var(--trc-event-default)";
  const isDragging = draggingId === event.id;

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!enableDnD) return;
      e.stopPropagation();
      const payload = JSON.stringify({
        id: event.id,
        start: event.start,
        end: event.end,
      });
      e.dataTransfer.setData("application/trud-calendar-event", payload);
      e.dataTransfer.effectAllowed = "move";
    },
    [enableDnD, event.id, event.start, event.end],
  );

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
      draggable={!!enableDnD}
      onDragStart={handleDragStart}
      style={{
        backgroundColor:
          event.allDay || isMultiDayEvent(event) ? color : `${color}20`,
        borderLeft:
          !event.allDay && !isMultiDayEvent(event) ? `2px solid ${color}` : undefined,
        opacity: isDragging ? 0.4 : undefined,
        transition: isDragging ? "opacity 150ms" : undefined,
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

interface MorePopoverState {
  day: DateString;
  rect: { top: number; left: number; width: number };
}

export function MonthView() {
  const {
    state,
    visibleEvents,
    locale,
    weekStartsOn,
    onEventClick,
    onSlotClick,
    onEventDrop,
    enableDnD,
    labels,
  } = useCalendarContext();
  const slots = useCalendarSlots();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [morePopover, setMorePopover] = useState<MorePopoverState | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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

  // Close popover on click outside or Escape
  useEffect(() => {
    if (!morePopover) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setMorePopover(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMorePopover(null);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [morePopover]);

  const handleMoreClick = useCallback(
    (e: React.MouseEvent, day: DateString) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMorePopover({ day, rect: { top: rect.bottom, left: rect.left, width: rect.width } });
    },
    [],
  );

  const handleSlotClick = useCallback(
    (date: DateString) => {
      onSlotClick?.(`${date}T09:00:00`);
    },
    [onSlotClick],
  );

  const handleMonthDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverDay(null);
  }, []);

  const handleDayCellDrop = useCallback(
    (e: React.DragEvent, targetDay: DateString) => {
      if (!enableDnD || !onEventDrop) return;
      e.preventDefault();
      setDragOverDay(null);
      setDraggingId(null);

      const raw = e.dataTransfer.getData("application/trud-calendar-event");
      if (!raw) return;

      try {
        const data = JSON.parse(raw) as { id: string; start: string; end: string };

        const original = visibleEvents.find((ev) => ev.id === data.id);
        if (!original) return;

        // Compute duration in ms
        const durationMs = new Date(data.end).getTime() - new Date(data.start).getTime();

        // Preserve original time, change date
        const originalTime = data.start.slice(11); // HH:mm:ss
        const newStartStr = `${targetDay}T${originalTime}`;
        const newStartMs = new Date(newStartStr).getTime();
        const newEndDate = new Date(newStartMs + durationMs);

        const endHH = String(newEndDate.getHours()).padStart(2, "0");
        const endMM = String(newEndDate.getMinutes()).padStart(2, "0");
        const endSS = String(newEndDate.getSeconds()).padStart(2, "0");
        const endDay = newEndDate.toISOString().slice(0, 10);
        const newEndStr = `${endDay}T${endHH}:${endMM}:${endSS}`;

        onEventDrop(original, newStartStr, newEndStr);
      } catch {
        // Ignore malformed data
      }
    },
    [enableDnD, onEventDrop, visibleEvents],
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
      <div
        className="flex flex-col flex-1"
        onDragEnd={handleMonthDragEnd}
        onDragStartCapture={(e) => {
          if (!enableDnD) return;
          // Find which event is being dragged by walking up to the draggable button
          const target = e.target as HTMLElement;
          const draggable = target.closest("[draggable='true']");
          if (draggable) {
            // Search all visible events for a title match
            const title = draggable.getAttribute("title");
            if (title) {
              const ev = visibleEvents.find((ev) => ev.title === title);
              if (ev) setDraggingId(ev.id);
            }
          }
        }}
      >
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

              const isDragOver = enableDnD && dragOverDay === day;

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
                  style={{
                    backgroundColor: isDragOver ? "var(--trc-accent)" : undefined,
                    opacity: isDragOver && currentMonth ? 0.6 : undefined,
                  }}
                  onClick={() => handleSlotClick(day)}
                  onDragOver={(e) => {
                    if (!enableDnD) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setDragOverDay(day);
                  }}
                  onDragLeave={(e) => {
                    const related = e.relatedTarget as Node | null;
                    const current = e.currentTarget as Node;
                    if (related && current.contains(related)) return;
                    setDragOverDay(null);
                  }}
                  onDrop={(e) => handleDayCellDrop(e, day)}
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
                        enableDnD={enableDnD}
                        draggingId={draggingId}
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
                          enableDnD={enableDnD}
                          draggingId={draggingId}
                        />
                      ))}
                    {hiddenCount > 0 && (
                      <button
                        className="text-xs text-[var(--trc-muted-foreground)] text-left px-1.5 hover:text-[var(--trc-foreground)] transition-colors"
                        onClick={(e) => handleMoreClick(e, day)}
                      >
                        {labels.more(hiddenCount)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* "+N more" popover */}
      {morePopover && (() => {
        const dayData = eventsByDay.get(morePopover.day);
        const allDayEvents = [
          ...(dayData?.multiDay.map((s) => s.event) ?? []),
          ...(dayData?.singleDay ?? []),
        ];
        return (
          <div
            ref={popoverRef}
            className={cn(
              "fixed z-50 min-w-[200px] max-w-[280px] max-h-[300px] overflow-y-auto",
              "rounded-[var(--trc-radius)] border border-[var(--trc-border)]",
              "bg-[var(--trc-background)] shadow-lg",
              "p-2",
            )}
            style={{
              top: morePopover.rect.top + 4,
              left: morePopover.rect.left,
            }}
          >
            <div className="text-xs font-semibold text-[var(--trc-foreground)] px-1.5 pb-1.5 border-b border-[var(--trc-border)] mb-1.5">
              {formatAgendaDate(morePopover.day, locale)}
            </div>
            <div className="flex flex-col gap-0.5">
              {allDayEvents.map((event) => (
                <MonthEventPill
                  key={event.id}
                  event={event}
                  locale={locale}
                  onClick={(ev) => {
                    setMorePopover(null);
                    onEventClick?.(ev);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
