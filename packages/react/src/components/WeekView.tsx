import { useMemo, useRef, useEffect, useCallback, useState } from "react";
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
  enableDnD?: boolean;
  draggingId?: string | null;
}

function TimeEvent({ positioned, locale, onEventClick, enableDnD, draggingId }: TimeEventProps) {
  const { event, column, totalColumns, top, height } = positioned;
  const slots = useCalendarSlots();
  const color = event.color || "var(--trc-event-default)";

  const left = (column / totalColumns) * 100;
  const width = 100 / totalColumns;

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

  if (slots.timeEvent) {
    const SlotTimeEvent = slots.timeEvent;
    return (
      <div
        className="absolute px-0.5"
        draggable={!!enableDnD}
        onDragStart={handleDragStart}
        style={{
          top: `${top}%`,
          height: `${height}%`,
          left: `${left}%`,
          width: `${width}%`,
          opacity: isDragging ? 0.4 : 1,
          transition: "opacity 150ms",
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
      draggable={!!enableDnD}
      onDragStart={handleDragStart}
      style={{
        top: `${top}%`,
        height: `${height}%`,
        left: `${left}%`,
        width: `${width}%`,
        opacity: isDragging ? 0.4 : 1,
        transition: "opacity 150ms",
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
  allDayLabel: string;
  onEventClick?: (event: CalendarEvent) => void;
}

function AllDayRow({ days, events, allDayLabel, onEventClick }: AllDayRowProps) {
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
        {allDayLabel}
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

interface DayColumnProps {
  day: DateString;
  dayIdx: number;
  hourLabels: string[];
  positioned: PositionedEvent[];
  todayFlag: boolean;
  locale: string;
  dayStartHour: number;
  dayEndHour: number;
  timeOfDay: number;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick: (day: DateString, hour: number) => void;
  enableDnD?: boolean;
  draggingId: string | null;
  dragOverSlot: string | null;
  onDragOver: (e: React.DragEvent, slotKey: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, day: DateString, el: HTMLDivElement) => void;
  onDragStartEvent: (id: string) => void;
}

function DayColumn({
  day,
  dayIdx,
  hourLabels,
  positioned,
  todayFlag,
  locale,
  dayStartHour,
  dayEndHour,
  timeOfDay,
  onEventClick,
  onSlotClick,
  enableDnD,
  draggingId,
  dragOverSlot,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStartEvent,
}: DayColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={columnRef}
      key={day}
      className={cn(
        "relative",
        "border-r border-[var(--trc-border)] last:border-r-0",
      )}
      style={{
        gridColumn: dayIdx + 2,
        gridRow: `1 / ${hourLabels.length + 1}`,
      }}
      onDragOver={(e) => {
        if (!enableDnD) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(e, `${day}`);
      }}
      onDragLeave={(e) => {
        // Only fire if we actually left this column
        const related = e.relatedTarget as Node | null;
        if (columnRef.current && related && columnRef.current.contains(related)) return;
        onDragLeave();
      }}
      onDrop={(e) => {
        if (!enableDnD || !columnRef.current) return;
        onDrop(e, day, columnRef.current);
      }}
      onDragStartCapture={(e) => {
        if (!enableDnD) return;
        // Try to read the event id that was just set
        // Use a microtask so the dataTransfer is populated
        const target = e.target as HTMLElement;
        const draggable = target.closest("[draggable='true']");
        if (draggable) {
          // We can't read dataTransfer during dragstart in some browsers,
          // so search in our events for the matching element
          for (const p of positioned) {
            // Check if this button/div contains the dragged element
            if (draggable.textContent?.includes(p.event.title)) {
              onDragStartEvent(p.event.id);
              break;
            }
          }
        }
      }}
    >
      {/* Hour slots (clickable + droppable) */}
      {hourLabels.map((_, hourIdx) => {
        const isDropTarget = enableDnD && dragOverSlot === `${day}`;
        return (
          <div
            key={hourIdx}
            className={cn(
              "border-b border-[var(--trc-border)] hover:bg-[var(--trc-accent)]/30 transition-colors cursor-pointer",
            )}
            style={{
              height: "var(--trc-hour-height)",
              backgroundColor: isDropTarget ? "var(--trc-accent)" : undefined,
              opacity: isDropTarget ? 0.3 : undefined,
            }}
            onClick={() => onSlotClick(day, dayStartHour + hourIdx)}
          />
        );
      })}

      {/* Positioned events */}
      {positioned.map((p) => (
        <TimeEvent
          key={p.event.id}
          positioned={p}
          locale={locale}
          onEventClick={onEventClick}
          enableDnD={enableDnD}
          draggingId={draggingId}
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
    onEventDrop,
    enableDnD,
    labels,
  } = useCalendarContext();

  const { timeOfDay } = useCurrentTime();

  const gridRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

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

  const handleWeekDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverSlot(null);
  }, []);

  const handleSlotDragOver = useCallback(
    (e: React.DragEvent, slotKey: string) => {
      if (!enableDnD) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverSlot(slotKey);
    },
    [enableDnD],
  );

  const handleSlotDragLeave = useCallback(() => {
    setDragOverSlot(null);
  }, []);

  const handleSlotDrop = useCallback(
    (e: React.DragEvent, day: DateString, dayColumnEl: HTMLDivElement) => {
      if (!enableDnD || !onEventDrop) return;
      e.preventDefault();
      setDragOverSlot(null);
      setDraggingId(null);

      const raw = e.dataTransfer.getData("application/trud-calendar-event");
      if (!raw) return;

      try {
        const data = JSON.parse(raw) as { id: string; start: string; end: string };

        // Find the original event
        const original = visibleEvents.find((ev) => ev.id === data.id);
        if (!original) return;

        // Calculate duration in ms
        const durationMs = new Date(data.end).getTime() - new Date(data.start).getTime();

        // Get mouse Y relative to the day column
        const rect = dayColumnEl.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const totalHeight = rect.height;
        const totalHours = dayEndHour - dayStartHour;
        const hoursFromTop = (relativeY / totalHeight) * totalHours;
        const absoluteHour = dayStartHour + hoursFromTop;

        // Snap to 15-minute increments
        const snappedMinutes = Math.round(absoluteHour * 60 / 15) * 15;
        const snappedHour = Math.floor(snappedMinutes / 60);
        const snappedMin = snappedMinutes % 60;

        const hh = String(Math.max(dayStartHour, Math.min(dayEndHour - 1, snappedHour))).padStart(2, "0");
        const mm = String(snappedMin).padStart(2, "0");

        const newStartStr = `${day}T${hh}:${mm}:00`;
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
    [enableDnD, onEventDrop, visibleEvents, dayStartHour, dayEndHour],
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
        allDayLabel={labels.allDay}
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
          onDragEnd={handleWeekDragEnd}
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
              <DayColumn
                key={day}
                day={day}
                dayIdx={dayIdx}
                hourLabels={hourLabels}
                positioned={positioned}
                todayFlag={todayFlag}
                locale={locale}
                dayStartHour={dayStartHour}
                dayEndHour={dayEndHour}
                timeOfDay={timeOfDay}
                onEventClick={onEventClick}
                onSlotClick={handleSlotClick}
                enableDnD={enableDnD}
                draggingId={draggingId}
                dragOverSlot={dragOverSlot}
                onDragOver={handleSlotDragOver}
                onDragLeave={handleSlotDragLeave}
                onDrop={handleSlotDrop}
                onDragStartEvent={setDraggingId}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
