import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import { useCalendarSlots } from "../context/SlotsContext";
import { useSelectionContext } from "../context/SelectionContext";
import { useEventDrag } from "../hooks/useEventDrag";
import { useGridKeyboard } from "../hooks/useGridKeyboard";
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
  filterHiddenDays,
  getISOWeekNumber,
  type CalendarEvent,
  type DateString,
  type EventSegment,
} from "trud-calendar-core";

const MAX_VISIBLE_EVENTS = 3;

interface MonthEventPillProps {
  event: CalendarEvent;
  segment?: EventSegment;
  locale: string;
  onClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
  enableDnD?: boolean;
  isDragging?: boolean;
  onDragPointerDown?: (e: React.PointerEvent, event: CalendarEvent) => void;
  didDrag?: React.MutableRefObject<boolean>;
  isSelected?: boolean;
}

function MonthEventPill({
  event,
  segment,
  locale,
  onClick,
  enableDnD,
  isDragging,
  onDragPointerDown,
  didDrag,
  isSelected,
}: MonthEventPillProps) {
  const isStart = segment ? segment.isStart : true;
  const isEnd = segment ? segment.isEnd : true;
  const color = event.color || "var(--trc-event-default)";

  return (
    <button
      data-event-id={event.id}
      className={cn(
        "w-full text-left text-[10px] @[640px]:text-xs truncate px-1 @[640px]:px-1.5 py-0 @[640px]:py-0.5",
        "transition-opacity hover:opacity-80",
        isStart ? "rounded-l-sm" : "",
        isEnd ? "rounded-r-sm" : "",
        !isStart && !isEnd ? "" : "",
        event.allDay || (segment && !isStart && !isEnd)
          ? "text-white font-medium"
          : "text-[var(--trc-foreground)]",
        isSelected && "ring-2 ring-[var(--trc-primary)] ring-offset-1",
      )}
      style={{
        backgroundColor:
          event.allDay || isMultiDayEvent(event) ? color : `${color}20`,
        borderLeft:
          !event.allDay && !isMultiDayEvent(event) ? `2px solid ${color}` : undefined,
        opacity: isDragging ? 0.4 : undefined,
        transition: isDragging ? "opacity 150ms" : undefined,
        touchAction: enableDnD ? "none" : undefined,
      }}
      onPointerDown={
        enableDnD && onDragPointerDown
          ? (e) => {
              e.stopPropagation();
              onDragPointerDown(e, event);
            }
          : undefined
      }
      onClick={(e) => {
        e.stopPropagation();
        if (didDrag?.current) return;
        onClick?.(event, e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClick?.(event, e as unknown as React.MouseEvent);
        }
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
    onSlotClick,
    onEventDrop,
    enableDnD,
    dragConstraint,
    longPressDelay,
    slotClickTime,
    hiddenDays,
    highlightedDates,
    showWeekNumbers,
    labels,
  } = useCalendarContext();
  const slots = useCalendarSlots();
  const selectionCtx = useSelectionContext();
  const [morePopover, setMorePopover] = useState<MorePopoverState | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Event drag hook (pointer events based)
  const {
    dragState,
    onPointerDown: onDragPointerDown,
    didDrag,
  } = useEventDrag({
    enabled: !!enableDnD,
    onEventDrop,
    dragConstraint,
    mode: "date",
    selectedIds: selectionCtx.selectedIds,
    events: visibleEvents,
    longPressDelay,
  });

  // Selection-aware click handler
  const handleEventClick = useCallback(
    (event: CalendarEvent, e: React.MouseEvent) => {
      selectionCtx.handleEventClick(event, e);
    },
    [selectionCtx],
  );

  const range = useMemo(
    () => getMonthViewRange(state.currentDate, weekStartsOn),
    [state.currentDate, weekStartsOn],
  );

  const days = useMemo(() => eachDayOfRange(range.start, range.end), [range]);

  const weekDayHeaders = useMemo(() => {
    const weekStart = startOfWeek(range.start, weekStartsOn);
    return filterHiddenDays(getWeekDays(weekStart), hiddenDays);
  }, [range.start, weekStartsOn, hiddenDays]);

  const weeks = useMemo(() => {
    const result: DateString[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(filterHiddenDays(days.slice(i, i + 7), hiddenDays));
    }
    return result;
  }, [days, hiddenDays]);

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

  // Keyboard navigation
  const gridKeyboard = useGridKeyboard({
    rows: weeks.length,
    cols: 7,
    onActivate: useCallback(
      (row: number, col: number) => {
        const day = weeks[row]?.[col];
        if (day) {
          onSlotClick?.(`${day}T${slotClickTime}`);
        }
      },
      [weeks, onSlotClick, slotClickTime],
    ),
    onEscape: useCallback(() => {
      setMorePopover(null);
    }, []),
  });

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
      onSlotClick?.(`${date}T${slotClickTime}`);
    },
    [onSlotClick, slotClickTime],
  );

  const visibleColCount = weekDayHeaders.length;
  const weekNumCol = showWeekNumbers ? "2rem " : "";
  const gridColsStyle = { gridTemplateColumns: `${weekNumCol}repeat(${visibleColCount}, minmax(0, 1fr))` };

  return (
    <div className="flex flex-col flex-1 overflow-hidden" role="grid" aria-label="Month view">
      {/* Weekday headers */}
      <div
        className={cn(
          "grid",
          "border-b border-[var(--trc-border)]",
          "bg-[var(--trc-muted)]",
        )}
        style={gridColsStyle}
        role="row"
      >
        {showWeekNumbers && (
          <div
            className="py-1 @[640px]:py-2 text-center text-[10px] @[640px]:text-xs font-medium text-[var(--trc-muted-foreground)]"
            role="columnheader"
          >
            W
          </div>
        )}
        {weekDayHeaders.map((day) => (
          <div
            key={day}
            className="py-1 @[640px]:py-2 text-center text-[10px] @[640px]:text-xs font-medium text-[var(--trc-muted-foreground)] uppercase"
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
              "grid flex-1 min-h-0",
              weekIdx < weeks.length - 1 && "border-b border-[var(--trc-border)]",
            )}
            style={gridColsStyle}
            role="row"
          >
            {showWeekNumbers && week.length > 0 && (
              <div className="flex items-start justify-center pt-1 text-[10px] @[640px]:text-xs text-[var(--trc-muted-foreground)] border-r border-[var(--trc-border)]">
                {getISOWeekNumber(week[0])}
              </div>
            )}
            {week.map((day, colIdx) => {
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

              const isDragOver = dragState?.targetDay === day;
              const isHighlighted = highlightedDates.has(day);

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
                  ref={(el) => gridKeyboard.registerCell(weekIdx, colIdx, el)}
                  role="gridcell"
                  data-day={day}
                  tabIndex={gridKeyboard.getTabIndex(weekIdx, colIdx)}
                  onKeyDown={gridKeyboard.handleKeyDown}
                  onFocus={() => gridKeyboard.handleFocus(weekIdx, colIdx)}
                  className={cn(
                    "flex flex-col p-0.5 @[640px]:p-1 overflow-hidden cursor-pointer",
                    "border-r border-[var(--trc-border)] last:border-r-0",
                    "hover:bg-[var(--trc-accent)]/50 transition-colors",
                    !currentMonth && "opacity-40",
                    "outline-none focus-visible:ring-2 focus-visible:ring-[var(--trc-primary)] focus-visible:ring-inset",
                  )}
                  style={{
                    backgroundColor: isDragOver
                      ? "var(--trc-accent)"
                      : isHighlighted
                        ? "var(--trc-accent)"
                        : undefined,
                    opacity: isDragOver && currentMonth ? 0.6 : undefined,
                  }}
                  onClick={() => handleSlotClick(day)}
                  aria-label={day}
                >
                  {/* Day number */}
                  <div className="flex justify-center mb-0 @[640px]:mb-0.5">
                    <span
                      className={cn(
                        "text-xs @[640px]:text-sm w-5 h-5 @[640px]:w-7 @[640px]:h-7 flex items-center justify-center rounded-full",
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
                    {dayData?.multiDay.slice(0, visibleEventsSlice).map((seg, idx) => (
                      <div
                        key={`${seg.event.id}-${seg.date}`}
                        className={cn(idx >= 2 && "hidden @[640px]:block")}
                      >
                        <MonthEventPill
                          event={seg.event}
                          segment={seg}
                          locale={locale}
                          onClick={handleEventClick}
                          enableDnD={enableDnD}
                          isDragging={dragState?.event.id === seg.event.id}
                          onDragPointerDown={onDragPointerDown}
                          didDrag={didDrag}
                          isSelected={selectionCtx.isSelected(seg.event.id)}
                        />
                      </div>
                    ))}
                    {dayData?.singleDay
                      .slice(0, Math.max(0, visibleEventsSlice - (dayData?.multiDay.length ?? 0)))
                      .map((event, idx) => {
                        const overallIdx = (dayData?.multiDay.length ?? 0) + idx;
                        return (
                          <div
                            key={event.id}
                            className={cn(overallIdx >= 2 && "hidden @[640px]:block")}
                          >
                            <MonthEventPill
                              event={event}
                              locale={locale}
                              onClick={handleEventClick}
                              enableDnD={enableDnD}
                              isDragging={dragState?.event.id === event.id}
                              onDragPointerDown={onDragPointerDown}
                              didDrag={didDrag}
                              isSelected={selectionCtx.isSelected(event.id)}
                            />
                          </div>
                        );
                      })}
                    {hiddenCount > 0 && (
                      <button
                        className="text-[10px] @[640px]:text-xs text-[var(--trc-muted-foreground)] text-left px-1 @[640px]:px-1.5 hover:text-[var(--trc-foreground)] transition-colors"
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
                  onClick={(ev, e) => {
                    setMorePopover(null);
                    handleEventClick(ev, e);
                  }}
                  isSelected={selectionCtx.isSelected(event.id)}
                />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Drag ghost */}
      {dragState && (() => {
        const color = dragState.event.color || "var(--trc-event-default)";
        return (
          <div
            className="fixed z-50 pointer-events-none opacity-80"
            style={{
              left: dragState.ghostX,
              top: dragState.ghostY,
              width: 150,
            }}
          >
            <div
              className="rounded-sm px-1.5 py-0.5 text-xs font-medium truncate shadow-md text-white"
              style={{ backgroundColor: color }}
            >
              {dragState.event.title}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
