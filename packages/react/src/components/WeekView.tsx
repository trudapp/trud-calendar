import { useMemo, useRef, useEffect, useCallback } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import { useCalendarSlots } from "../context/SlotsContext";
import { useSelectionContext } from "../context/SelectionContext";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { useEventResize } from "../hooks/useEventResize";
import { useSlotSelection } from "../hooks/useSlotSelection";
import { useEventDrag } from "../hooks/useEventDrag";
import { useGridKeyboard } from "../hooks/useGridKeyboard";
import { useResponsiveView } from "../hooks/useResponsiveView";
import { useVirtualScroll } from "../hooks/useVirtualScroll";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { cn } from "../lib/cn";
import {
  getWeekViewRange,
  eachDayOfRange,
  isToday,
  isSameDay,
  formatWeekdayShort,
  formatDayNumber,
  formatTime,
  formatTimeRange,
  eventWallToDisplay,
  getEventsForDay,
  partitionEvents,
  computeTimePositions,
  segmentTimedMultiDayEvent,
  getHourLabels,
  getTimeOfDay,
  filterVisibleEvents,
  filterHiddenDays,
  type CalendarEvent,
  type DateString,
  type PositionedEvent,
} from "trud-calendar-core";
import type { DragState } from "../hooks/useEventDrag";

interface TimeEventProps {
  positioned: PositionedEvent;
  locale: string;
  displayTimeZone: string;
  onEventClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
  enableDnD?: boolean;
  isDragging?: boolean;
  /** Drag handle props — only present when DnD is enabled */
  dragProps?: {
    onPointerDown: (e: React.PointerEvent, event: CalendarEvent) => void;
    didDrag: React.MutableRefObject<boolean>;
  };
  /** Resize handle props — only present when resize is enabled */
  resizeProps?: {
    topOverride?: number;
    heightOverride?: number;
    onResizeHandlePointerDown: (e: React.PointerEvent) => void;
    onResizeStartHandlePointerDown: (e: React.PointerEvent) => void;
  };
  /** Ref to suppress click after resize */
  didResize?: React.MutableRefObject<boolean>;
  /** Whether this event is selected (multi-select) */
  isSelected?: boolean;
}

function TimeEvent({
  positioned,
  locale,
  displayTimeZone,
  onEventClick,
  enableDnD,
  isDragging,
  dragProps,
  resizeProps,
  didResize,
  isSelected,
}: TimeEventProps) {
  const { event, column, totalColumns, top, height, isSegmentStart, isSegmentEnd } = positioned;
  const slots = useCalendarSlots();
  const color = event.color || "var(--trc-event-default)";

  const left = (column / totalColumns) * 100;
  const width = 100 / totalColumns;

  const displayTop = resizeProps?.topOverride ?? top;
  const displayHeight = resizeProps?.heightOverride ?? height;

  // Determine border radius based on segment position
  const isStart = isSegmentStart !== false; // undefined or true → show rounded top
  const isEnd = isSegmentEnd !== false; // undefined or true → show rounded bottom

  if (slots.timeEvent) {
    const SlotTimeEvent = slots.timeEvent;
    return (
      <div
        className="absolute px-0.5"
        data-event-id={event.id}
        style={{
          top: `${displayTop}%`,
          height: `${displayHeight}%`,
          left: `${left}%`,
          width: `${width}%`,
          opacity: isDragging ? 0.4 : 1,
          transition: "opacity 150ms",
          touchAction: enableDnD ? "none" : undefined,
        }}
        onPointerDown={
          enableDnD && dragProps
            ? (e) => dragProps.onPointerDown(e, event)
            : undefined
        }
      >
        <SlotTimeEvent event={event} positioned={positioned} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute px-0.5 group",
      )}
      data-event-id={event.id}
      style={{
        top: `${displayTop}%`,
        height: `${displayHeight}%`,
        left: `${left}%`,
        width: `${width}%`,
        opacity: isDragging ? 0.4 : 1,
        transition: "opacity 150ms",
        touchAction: enableDnD ? "none" : undefined,
      }}
    >
      {/* Top resize handle — changes start time */}
      {resizeProps && (
        <div
          className={cn(
            "absolute top-0 left-0 right-0 cursor-n-resize z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity",
            displayHeight < 5 ? "h-1" : "h-3"
          )}
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            resizeProps.onResizeStartHandlePointerDown(e);
          }}
        >
          <div
            className="w-8 h-[3px] rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      )}

      <div
        className={cn(
          "h-full",
          "border-l-2 px-1.5 py-0.5",
          "overflow-hidden text-left cursor-pointer",
          "hover:opacity-80 transition-opacity",
          "relative",
          isStart && isEnd && "rounded-[calc(var(--trc-radius)*0.5)]",
          isStart && !isEnd && "rounded-t-[calc(var(--trc-radius)*0.5)]",
          !isStart && isEnd && "rounded-b-[calc(var(--trc-radius)*0.5)]",
          isSelected && "ring-2 ring-[var(--trc-primary)] ring-offset-1",
        )}
        onPointerDown={
          enableDnD && dragProps
            ? (e) => dragProps.onPointerDown(e, event)
            : undefined
        }
        onClick={(e) => {
          e.stopPropagation();
          if (didResize?.current) return;
          if (dragProps?.didDrag.current) return;
          onEventClick?.(event, e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onEventClick?.(event, e as unknown as React.MouseEvent);
          }
        }}
        tabIndex={-1}
        role="button"
        aria-label={event.title}
        style={{
          backgroundColor: `${color}20`,
          borderLeftColor: color,
        }}
      >
        <div className="text-xs font-medium text-[var(--trc-foreground)] truncate">
          {event.title}
        </div>
        {displayHeight > 4 && (
          <div className="text-xs text-[var(--trc-muted-foreground)] truncate">
            {formatTime(eventWallToDisplay(event.start, event.timeZone, displayTimeZone), locale)}
          </div>
        )}
      </div>

      {/* Bottom resize handle — changes end time */}
      {resizeProps && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 cursor-s-resize z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity",
            displayHeight < 5 ? "h-1" : "h-3"
          )}
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            resizeProps.onResizeHandlePointerDown(e);
          }}
        >
          <div
            className="w-8 h-[3px] rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
}

interface AllDayRowProps {
  days: DateString[];
  events: CalendarEvent[];
  locale: string;
  allDayLabel: string;
  onEventClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
  isEventSelected?: (id: string) => boolean;
  gutterWidth?: string;
}

function AllDayRow({ days, events, allDayLabel, onEventClick, isEventSelected, gutterWidth = "4rem" }: AllDayRowProps) {
  if (events.length === 0) return null;

  return (
    <div
      className={cn(
        "grid border-b border-[var(--trc-border)]",
        "bg-[var(--trc-background)]",
      )}
      style={{ gridTemplateColumns: `${gutterWidth} repeat(${days.length}, 1fr)` }}
    >
      <div className="text-[10px] @[640px]:text-xs text-[var(--trc-muted-foreground)] p-0.5 @[640px]:p-1 text-right pr-1 @[640px]:pr-2 border-r border-[var(--trc-border)]">
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
                    isEventSelected?.(event.id) && "ring-2 ring-[var(--trc-primary)] ring-offset-1",
                  )}
                  style={{ backgroundColor: color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event, e);
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

export function CurrentTimeIndicator({
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

/** Ghost overlay for slot selection (drag to create) */
export function SelectionGhost({
  startPercent,
  endPercent,
  startTime,
  endTime,
  locale,
}: {
  startPercent: number;
  endPercent: number;
  startTime: string;
  endTime: string;
  locale: string;
}) {
  return (
    <div
      className="absolute left-1 right-1 z-20 pointer-events-none rounded-[calc(var(--trc-radius)*0.5)]"
      style={{
        top: `${startPercent}%`,
        height: `${endPercent - startPercent}%`,
        backgroundColor: "var(--trc-primary)",
        opacity: 0.15,
        border: "2px dashed var(--trc-primary)",
      }}
    >
      <div className="text-xs font-medium text-[var(--trc-primary)] px-1.5 py-0.5">
        {formatTimeRange(startTime, endTime, locale)}
      </div>
    </div>
  );
}

/** Floating ghost for event drag */
export function DragGhost({ dragState }: { dragState: DragState }) {
  const color = dragState.event.color || "var(--trc-event-default)";
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: dragState.ghostX,
        top: dragState.ghostY,
        width: 180,
        opacity: 0.85,
      }}
    >
      <div
        className="rounded-[calc(var(--trc-radius)*0.5)] border-l-2 px-1.5 py-1 text-xs font-medium truncate shadow-lg backdrop-blur-sm"
        style={{
          backgroundColor: `${color}30`,
          borderLeftColor: color,
          color: "var(--trc-foreground)",
        }}
      >
        <div className="truncate">{dragState.event.title}</div>
        {dragState.previewTime && (
          <div className="text-[10px] opacity-70 mt-0.5">{dragState.previewTime}</div>
        )}
      </div>
    </div>
  );
}

export interface DayColumnProps {
  day: DateString;
  dayIdx: number;
  /** Resource ID for this column (resource views only) */
  resourceId?: string;
  hourLabels: string[];
  positioned: PositionedEvent[];
  todayFlag: boolean;
  locale: string;
  displayTimeZone: string;
  dayStartHour: number;
  dayEndHour: number;
  timeOfDay: number;
  onEventClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
  isEventSelected?: (id: string) => boolean;
  // Drag (pointer events)
  enableDnD?: boolean;
  dragState: DragState | null;
  onDragPointerDown: (e: React.PointerEvent, event: CalendarEvent) => void;
  didDrag: React.MutableRefObject<boolean>;
  // Resize
  enableResize: boolean;
  resizeState: { eventId: string; day: DateString; edge: string; topOverride?: number; heightOverride: number } | null;
  onResizeHandlePointerDown: (
    e: React.PointerEvent,
    event: CalendarEvent,
    day: DateString,
    columnEl: HTMLDivElement,
  ) => void;
  onResizeStartHandlePointerDown: (
    e: React.PointerEvent,
    event: CalendarEvent,
    day: DateString,
    columnEl: HTMLDivElement,
  ) => void;
  didResize: React.MutableRefObject<boolean>;
  // Slot selection
  selection: {
    isSelecting: boolean;
    day: DateString;
    startPercent: number;
    endPercent: number;
    startTime: string;
    endTime: string;
  } | null;
  onSlotPointerDown: (e: React.PointerEvent, day: DateString, columnEl: HTMLDivElement) => void;
  // Background events
  backgroundPositions: { event: CalendarEvent; top: number; height: number }[];
  // Keyboard
  gridKeyboard: {
    registerCell: (row: number, col: number, el: HTMLElement | null) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    getTabIndex: (row: number, col: number) => number;
    handleFocus: (row: number, col: number) => void;
  };
}

export function DayColumn({
  day,
  dayIdx,
  resourceId,
  hourLabels,
  positioned,
  todayFlag,
  locale,
  displayTimeZone,
  dayStartHour,
  dayEndHour,
  timeOfDay,
  onEventClick,
  isEventSelected,
  enableDnD,
  dragState,
  onDragPointerDown,
  didDrag,
  enableResize,
  resizeState,
  onResizeHandlePointerDown,
  onResizeStartHandlePointerDown,
  didResize,
  selection,
  onSlotPointerDown,
  backgroundPositions,
  gridKeyboard,
}: DayColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const isDragTarget = dragState?.targetDay === day;

  return (
    <div
      ref={columnRef}
      key={day}
      data-day={day}
      data-resource-id={resourceId}
      className={cn(
        "relative",
        "border-r border-[var(--trc-border)] last:border-r-0",
      )}
      style={{
        gridColumn: dayIdx + 2,
        gridRow: `1 / ${hourLabels.length + 1}`,
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        if (!columnRef.current) return;
        onSlotPointerDown(e, day, columnRef.current);
      }}
    >
      {/* Background events — colored time blocks behind everything */}
      {backgroundPositions.map((bg) => (
        <div
          key={bg.event.id}
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: `${bg.top}%`,
            height: `${bg.height}%`,
            backgroundColor: `${bg.event.color || "var(--trc-event-default)"}20`,
          }}
        />
      ))}

      {/* Hour slots (visual grid lines) */}
      {hourLabels.map((_, hourIdx) => (
        <div
          key={hourIdx}
          ref={(el) => gridKeyboard.registerCell(hourIdx, dayIdx, el)}
          className={cn(
            "border-b border-[var(--trc-border)] hover:bg-[var(--trc-accent)]/30 transition-colors cursor-pointer",
          )}
          role="gridcell"
          tabIndex={gridKeyboard.getTabIndex(hourIdx, dayIdx)}
          onKeyDown={gridKeyboard.handleKeyDown}
          onFocus={() => gridKeyboard.handleFocus(hourIdx, dayIdx)}
          style={{
            height: "var(--trc-hour-height)",
          }}
        />
      ))}

      {/* Positioned events */}
      {positioned.map((p) => {
        const isResizing =
          resizeState?.eventId === p.event.id && resizeState?.day === day;
        const eventIsDragging = dragState?.event.id === p.event.id;

        return (
          <TimeEvent
            key={`${p.event.id}-${day}`}
            positioned={p}
            locale={locale}
            displayTimeZone={displayTimeZone}
            onEventClick={onEventClick}
            enableDnD={enableDnD}
            isDragging={eventIsDragging}
            isSelected={isEventSelected?.(p.event.id)}
            dragProps={
              enableDnD
                ? { onPointerDown: onDragPointerDown, didDrag }
                : undefined
            }
            didResize={didResize}
            resizeProps={
              enableResize
                ? {
                    topOverride: isResizing
                      ? resizeState!.topOverride
                      : undefined,
                    heightOverride: isResizing
                      ? resizeState!.heightOverride
                      : undefined,
                    onResizeHandlePointerDown: (e: React.PointerEvent) => {
                      if (columnRef.current) {
                        onResizeHandlePointerDown(
                          e,
                          p.event,
                          day,
                          columnRef.current,
                        );
                      }
                    },
                    onResizeStartHandlePointerDown: (e: React.PointerEvent) => {
                      if (columnRef.current) {
                        onResizeStartHandlePointerDown(
                          e,
                          p.event,
                          day,
                          columnRef.current,
                        );
                      }
                    },
                  }
                : undefined
            }
          />
        );
      })}

      {/* Selection ghost (drag to create) */}
      {selection?.isSelecting && selection.day === day && (
        <SelectionGhost
          startPercent={selection.startPercent}
          endPercent={selection.endPercent}
          startTime={selection.startTime}
          endTime={selection.endTime}
          locale={locale}
        />
      )}

      {/* Drop preview phantom — shows where the event will land */}
      {isDragTarget && dragState?.previewTop !== undefined && dragState.previewHeight !== undefined && (
        <div
          className="absolute left-0 right-0 pointer-events-none z-10 border-2 border-dashed border-[var(--trc-primary)] rounded-[calc(var(--trc-radius)*0.5)]"
          style={{
            top: `${dragState.previewTop}%`,
            height: `${dragState.previewHeight}%`,
            backgroundColor: `${dragState.event.color || "var(--trc-event-default)"}15`,
          }}
        >
          {dragState.previewTime && (
            <div className="text-[10px] font-medium text-[var(--trc-primary)] px-1 pt-0.5">
              {dragState.previewTime}
            </div>
          )}
        </div>
      )}

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
    snapDuration,
    onSlotClick,
    onEventDrop,
    onEventResize,
    onSlotSelect,
    enableDnD,
    enableVirtualization,
    dragConstraint,
    resizeConstraint,
    selectConstraint,
    hiddenDays,
    highlightedDates,
    longPressDelay,
    labels,
    displayTimeZone,
  } = useCalendarContext();

  const selectionCtx = useSelectionContext();

  const { timeOfDay } = useCurrentTime({ timeZone: displayTimeZone });

  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { visibleDays: responsiveDayCount } = useResponsiveView(containerRef);

  // Virtual scroll hook — only active when enableVirtualization is true
  const { viewportTop, viewportBottom, isVirtualized } = useVirtualScroll({
    containerRef: gridRef,
    totalHours: dayEndHour - dayStartHour,
    enabled: !!enableVirtualization,
  });

  // Resize hook
  const { resizeState, didResize, onResizeHandlePointerDown, onResizeStartHandlePointerDown } = useEventResize({
    dayStartHour,
    dayEndHour,
    snapDuration,
    enabled: !!onEventResize,
    onEventResize,
    resizeConstraint,
    displayTimeZone,
  });

  // Slot selection hook (drag to create)
  const { selection, onSlotPointerDown } = useSlotSelection({
    dayStartHour,
    dayEndHour,
    snapDuration,
    onSlotClick,
    onSlotSelect,
    selectConstraint,
  });

  // Event drag hook (pointer events based)
  const { dragState, onPointerDown: onDragPointerDown, didDrag } = useEventDrag({
    enabled: !!enableDnD,
    dayStartHour,
    dayEndHour,
    snapDuration,
    onEventDrop,
    dragConstraint,
    mode: "time",
    selectedIds: selectionCtx.selectedIds,
    events: visibleEvents,
    longPressDelay,
    displayTimeZone,
  });

  // Auto-scroll during drag, resize, or slot selection
  const isInteracting = !!(dragState || resizeState || selection);
  const { handleAutoScroll, stopAutoScroll } = useAutoScroll({
    containerRef: gridRef,
    enabled: isInteracting,
  });

  useEffect(() => {
    if (!isInteracting) {
      stopAutoScroll();
      return;
    }

    const onPointerMove = (e: PointerEvent) => handleAutoScroll(e.clientY);
    document.addEventListener("pointermove", onPointerMove);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      stopAutoScroll();
    };
  }, [isInteracting, handleAutoScroll, stopAutoScroll]);

  const allDays = useMemo(() => {
    if (singleDay) return [singleDay];
    const range = getWeekViewRange(state.currentDate, weekStartsOn);
    const days = eachDayOfRange(range.start, range.end);
    return filterHiddenDays(days, hiddenDays);
  }, [state.currentDate, weekStartsOn, singleDay, hiddenDays]);

  // Compute which days to show based on responsive day count
  const days = useMemo(() => {
    // If singleDay (DayView) or showing all 7, use the full set
    if (singleDay || responsiveDayCount >= allDays.length) return allDays;

    // Find the index of currentDate in allDays (or the closest day)
    const currentIdx = allDays.findIndex((d) => d === state.currentDate);
    const centerIdx = currentIdx >= 0 ? currentIdx : Math.floor(allDays.length / 2);

    // Center the visible window around currentDate
    const half = Math.floor(responsiveDayCount / 2);
    let startIdx = centerIdx - half;
    // Clamp to valid range
    if (startIdx < 0) startIdx = 0;
    if (startIdx + responsiveDayCount > allDays.length) {
      startIdx = allDays.length - responsiveDayCount;
    }

    return allDays.slice(startIdx, startIdx + responsiveDayCount);
  }, [allDays, responsiveDayCount, state.currentDate, singleDay]);

  const hourLabels = useMemo(
    () => getHourLabels(dayStartHour, dayEndHour, locale),
    [dayStartHour, dayEndHour, locale],
  );

  const { allDay: allDayEvents } = useMemo(
    () => partitionEvents(visibleEvents),
    [visibleEvents],
  );

  // Keyboard navigation
  const gridKeyboard = useGridKeyboard({
    rows: hourLabels.length,
    cols: days.length,
    onActivate: useCallback(
      (row: number, col: number) => {
        if (col < days.length) {
          const day = days[col];
          const hour = dayStartHour + row;
          const dateTime = `${day}T${String(hour).padStart(2, "0")}:00:00`;
          onSlotClick?.(dateTime);
        }
      },
      [days, dayStartHour, onSlotClick],
    ),
  });

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (gridRef.current) {
      const totalHours = dayEndHour - dayStartHour;
      const scrollHour = Math.max(0, new Date().getHours() - 1 - dayStartHour);
      const scrollPercent = scrollHour / totalHours;
      gridRef.current.scrollTop = scrollPercent * gridRef.current.scrollHeight;
    }
  }, [dayStartHour, dayEndHour]);

  // Selection-aware click handler — routes through SelectionContext
  const handleEventClick = useCallback(
    (event: CalendarEvent, e: React.MouseEvent) => {
      selectionCtx.handleEventClick(event, e);
    },
    [selectionCtx],
  );

  const colCount = days.length;

  // Responsive gutter width: narrower on mobile
  const gutterWidth = responsiveDayCount <= 1 ? "2.5rem" : responsiveDayCount <= 3 ? "3rem" : "4rem";

  return (
    <div ref={containerRef} className="flex flex-col flex-1 overflow-hidden" role="grid" aria-label="Week view">
      {/* Single scroll container — headers + grid share the same width so columns align with scrollbar */}
      <div className="flex-1 overflow-y-auto" ref={gridRef}>
        {/* Sticky header: day names + all-day row */}
        <div className="sticky top-0 z-20 bg-[var(--trc-background)]">
          {/* Day headers */}
          <div
            className={cn(
              "grid border-b border-[var(--trc-border)]",
              "bg-[var(--trc-muted)]",
            )}
            style={{ gridTemplateColumns: `${gutterWidth} repeat(${colCount}, 1fr)` }}
            role="row"
          >
            <div className="border-r border-[var(--trc-border)]" />
            {days.map((day) => {
              const todayFlag = isToday(day);
              const isHighlighted = highlightedDates.has(day);
              return (
                <div
                  key={day}
                  className={cn(
                    "text-center py-1 @[640px]:py-2 border-r border-[var(--trc-border)] last:border-r-0",
                    isHighlighted && "bg-[var(--trc-accent)]/30",
                  )}
                  role="columnheader"
                >
                  <div className="text-[10px] @[640px]:text-xs font-medium text-[var(--trc-muted-foreground)] uppercase">
                    {formatWeekdayShort(day, locale)}
                  </div>
                  <div
                    className={cn(
                      "text-base @[640px]:text-xl font-semibold mx-auto w-8 h-8 @[640px]:w-10 @[640px]:h-10 flex items-center justify-center rounded-full",
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
            onEventClick={handleEventClick}
            isEventSelected={selectionCtx.isSelected}
            gutterWidth={gutterWidth}
          />
        </div>
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `${gutterWidth} repeat(${colCount}, 1fr)`,
            gridTemplateRows: `repeat(${hourLabels.length}, var(--trc-hour-height))`,
          }}
        >
          {/* Hour labels + grid lines */}
          {hourLabels.map((label, idx) => (
            <div
              key={idx}
              className="text-[10px] @[640px]:text-xs text-[var(--trc-muted-foreground)] text-right pr-1 @[640px]:pr-2 border-r border-[var(--trc-border)] -mt-2"
              style={{ gridColumn: 1, gridRow: idx + 1 }}
            >
              {label}
            </div>
          ))}

          {/* Day columns */}
          {days.map((day, dayIdx) => {
            // Get single-day timed events (exclude background events)
            const singleDayEvents = getEventsForDay(visibleEvents, day).filter(
              (e) => !e.allDay && e.display !== "background" && isSameDay(e.start, e.end),
            );

            // Get background events for this day
            const bgEventsForDay = getEventsForDay(visibleEvents, day).filter(
              (e) => e.display === "background" && !e.allDay,
            );
            const totalHoursForBg = dayEndHour - dayStartHour;
            const backgroundPositions = bgEventsForDay.map((e) => {
              const startH = Math.max(dayStartHour, getTimeOfDay(e.start));
              const endH = Math.min(dayEndHour, getTimeOfDay(e.end));
              return {
                event: e,
                top: ((startH - dayStartHour) / totalHoursForBg) * 100,
                height: ((endH - startH) / totalHoursForBg) * 100,
              };
            });

            // Get multi-day timed event segments for this day
            const multiDayTimedEvents = visibleEvents.filter(
              (e) => !e.allDay && e.display !== "background" && !isSameDay(e.start, e.end),
            );
            const timedSegments = multiDayTimedEvents.flatMap((e) =>
              segmentTimedMultiDayEvent(e, [day], dayStartHour, dayEndHour),
            );

            // Build positioned events: single-day + multi-day segments
            // For segments, create synthetic events with adjusted times for layout
            const syntheticEvents: CalendarEvent[] = timedSegments.map((seg) => {
              const sh = seg.startHour;
              // Clamp endHour to 23:59 — "T24:00:00" is invalid ISO and getTimeOfDay returns 0
              const eh = seg.endHour >= 24 ? 23 + 59 / 60 : seg.endHour;
              return {
                ...seg.event,
                id: `${seg.event.id}::seg::${seg.day}`,
                start: `${seg.day}T${String(Math.floor(sh)).padStart(2, "0")}:${String(Math.round((sh % 1) * 60)).padStart(2, "0")}:00`,
                end: `${seg.day}T${String(Math.floor(eh)).padStart(2, "0")}:${String(Math.round((eh % 1) * 60)).padStart(2, "0")}:00`,
              };
            });

            const allTimedEvents = [...singleDayEvents, ...syntheticEvents];
            const positioned = computeTimePositions(
              allTimedEvents,
              dayStartHour,
              dayEndHour,
              displayTimeZone,
            );

            // Annotate positioned events with segment info
            const segmentMap = new Map(
              timedSegments.map((s) => [`${s.event.id}::seg::${s.day}`, s]),
            );
            for (const p of positioned) {
              const seg = segmentMap.get(p.event.id);
              if (seg) {
                p.isSegmentStart = seg.isStart;
                p.isSegmentEnd = seg.isEnd;
                // Restore original event reference for click handling
                p.event = seg.event;
              } else {
                p.isSegmentStart = true;
                p.isSegmentEnd = true;
              }
            }

            // Apply virtual scrolling filter when enabled
            const visiblePositioned = isVirtualized
              ? filterVisibleEvents(positioned, viewportTop, viewportBottom, 10)
              : positioned;

            const todayFlag = isToday(day);

            return (
              <DayColumn
                key={day}
                day={day}
                dayIdx={dayIdx}
                hourLabels={hourLabels}
                positioned={visiblePositioned}
                todayFlag={todayFlag}
                locale={locale}
                displayTimeZone={displayTimeZone}
                dayStartHour={dayStartHour}
                dayEndHour={dayEndHour}
                timeOfDay={timeOfDay}
                onEventClick={handleEventClick}
                isEventSelected={selectionCtx.isSelected}
                enableDnD={enableDnD}
                dragState={dragState}
                onDragPointerDown={onDragPointerDown}
                didDrag={didDrag}
                enableResize={!!onEventResize}
                resizeState={resizeState}
                onResizeHandlePointerDown={onResizeHandlePointerDown}
                onResizeStartHandlePointerDown={onResizeStartHandlePointerDown}
                didResize={didResize}
                selection={selection}
                onSlotPointerDown={onSlotPointerDown}
                backgroundPositions={backgroundPositions}
                gridKeyboard={gridKeyboard}
              />
            );
          })}
        </div>
      </div>

      {/* Drag ghost */}
      {dragState && <DragGhost dragState={dragState} />}
    </div>
  );
}
