import { useMemo, useRef, useEffect, useCallback } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import { useCalendarSlots } from "../context/SlotsContext";
import { useSelectionContext } from "../context/SelectionContext";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { useEventResize } from "../hooks/useEventResize";
import { useSlotSelection } from "../hooks/useSlotSelection";
import { useEventDrag } from "../hooks/useEventDrag";
import { useGridKeyboard } from "../hooks/useGridKeyboard";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { DayColumn, DragGhost } from "./WeekView";
import { cn } from "../lib/cn";
import {
  getWeekViewRange,
  eachDayOfRange,
  isToday,
  isSameDay,
  formatWeekdayShort,
  formatDayNumber,
  getEventsForDay,
  getTimeOfDay,
  computeTimePositions,
  segmentTimedMultiDayEvent,
  getHourLabels,
  filterHiddenDays,
  getEventsForResource,
  type CalendarEvent,
  type DateString,
} from "trud-calendar-core";

export interface ResourceTimeGridProps {
  /** When set, renders a single day with resource columns (day mode) */
  singleDay?: DateString;
}

export function ResourceTimeGrid({ singleDay }: ResourceTimeGridProps) {
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
    dragConstraint,
    resizeConstraint,
    selectConstraint,
    hiddenDays,
    highlightedDates,
    longPressDelay,
    resources,
    displayTimeZone,
  } = useCalendarContext();
  const slots = useCalendarSlots();
  const selectionCtx = useSelectionContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { timeOfDay } = useCurrentTime({ timeZone: displayTimeZone });

  // Hooks
  const { resizeState, didResize, onResizeHandlePointerDown, onResizeStartHandlePointerDown } = useEventResize({
    dayStartHour,
    dayEndHour,
    snapDuration,
    enabled: !!onEventResize,
    onEventResize,
    resizeConstraint,
    displayTimeZone,
  });

  const { selection, onSlotPointerDown } = useSlotSelection({
    dayStartHour,
    dayEndHour,
    snapDuration,
    onSlotClick,
    onSlotSelect,
    selectConstraint,
  });

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

  // Auto-scroll
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

  // Compute days
  const days = useMemo(() => {
    if (singleDay) return [singleDay];
    const range = getWeekViewRange(state.currentDate, weekStartsOn);
    return filterHiddenDays(eachDayOfRange(range.start, range.end), hiddenDays);
  }, [state.currentDate, weekStartsOn, singleDay, hiddenDays]);

  const hourLabels = useMemo(
    () => getHourLabels(dayStartHour, dayEndHour, locale),
    [dayStartHour, dayEndHour, locale],
  );

  // Total columns = days × resources
  const totalCols = days.length * resources.length;

  // Grid keyboard
  const gridKeyboard = useGridKeyboard({
    rows: hourLabels.length,
    cols: totalCols,
    onActivate: useCallback(
      (row: number, col: number) => {
        const dayIdx = Math.floor(col / resources.length);
        const day = days[dayIdx];
        if (day) {
          const hour = dayStartHour + row;
          const dateTime = `${day}T${String(hour).padStart(2, "0")}:00:00`;
          onSlotClick?.(dateTime);
        }
      },
      [days, resources.length, dayStartHour, onSlotClick],
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

  const handleEventClick = useCallback(
    (event: CalendarEvent, e: React.MouseEvent) => {
      selectionCtx.handleEventClick(event, e);
    },
    [selectionCtx],
  );

  const gutterWidth = "4rem";

  return (
    <div ref={containerRef} className="flex flex-col flex-1 overflow-hidden" role="grid" aria-label="Resource time grid">
      <div className="flex-1 overflow-y-auto" ref={gridRef}>
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-[var(--trc-background)]">
          {/* Day header row (only for multi-day / week mode) */}
          {days.length > 1 && (
            <div
              className="grid border-b border-[var(--trc-border)] bg-[var(--trc-muted)]"
              style={{ gridTemplateColumns: `${gutterWidth} repeat(${totalCols}, 1fr)` }}
            >
              <div className="border-r border-[var(--trc-border)]" />
              {days.map((day) => {
                const todayFlag = isToday(day);
                const isHighlighted = highlightedDates.has(day);
                return (
                  <div
                    key={day}
                    className={cn(
                      "text-center py-1 border-r border-[var(--trc-border)] last:border-r-0",
                      isHighlighted && "bg-[var(--trc-accent)]/30",
                    )}
                    style={{ gridColumn: `span ${resources.length}` }}
                  >
                    <div className="text-[10px] @[640px]:text-xs font-medium text-[var(--trc-muted-foreground)] uppercase">
                      {formatWeekdayShort(day, locale)}
                    </div>
                    <div
                      className={cn(
                        "text-sm @[640px]:text-base font-semibold mx-auto w-7 h-7 flex items-center justify-center rounded-full",
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
          )}

          {/* Resource header row */}
          <div
            className="grid border-b border-[var(--trc-border)] bg-[var(--trc-muted)]"
            style={{ gridTemplateColumns: `${gutterWidth} repeat(${totalCols}, 1fr)` }}
          >
            <div className="border-r border-[var(--trc-border)]" />
            {days.map((day) =>
              resources.map((resource) => {
                if (slots.resourceHeader) {
                  const SlotHeader = slots.resourceHeader;
                  return (
                    <div key={`${day}-${resource.id}`} className="border-r border-[var(--trc-border)] last:border-r-0">
                      <SlotHeader resource={resource} />
                    </div>
                  );
                }
                return (
                  <div
                    key={`${day}-${resource.id}`}
                    className="text-center py-1 @[640px]:py-2 border-r border-[var(--trc-border)] last:border-r-0"
                  >
                    <div
                      className="text-[10px] @[640px]:text-xs font-medium truncate px-1"
                      style={{ color: resource.color || "var(--trc-foreground)" }}
                    >
                      {resource.title}
                    </div>
                    {/* In single-day mode, also show date */}
                    {days.length === 1 && (
                      <div className="text-[10px] text-[var(--trc-muted-foreground)]">
                        {formatWeekdayShort(day, locale)} {formatDayNumber(day, locale)}
                      </div>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* Time grid */}
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `${gutterWidth} repeat(${totalCols}, 1fr)`,
            gridTemplateRows: `repeat(${hourLabels.length}, var(--trc-hour-height))`,
          }}
        >
          {/* Hour labels */}
          {hourLabels.map((label, idx) => (
            <div
              key={idx}
              className="text-[10px] @[640px]:text-xs text-[var(--trc-muted-foreground)] text-right pr-1 @[640px]:pr-2 border-r border-[var(--trc-border)] -mt-2"
              style={{ gridColumn: 1, gridRow: idx + 1 }}
            >
              {label}
            </div>
          ))}

          {/* Resource columns */}
          {days.map((day, dayIdx) =>
            resources.map((resource, resIdx) => {
              const colIdx = dayIdx * resources.length + resIdx;

              // Filter events for this day + resource
              const dayEvents = getEventsForDay(visibleEvents, day);
              const resourceEvents = getEventsForResource(dayEvents, resource.id);

              const singleDayEvents = resourceEvents.filter(
                (e) => !e.allDay && e.display !== "background" && isSameDay(e.start, e.end),
              );

              const bgEvents = resourceEvents.filter(
                (e) => e.display === "background" && !e.allDay,
              );
              const totalHoursForBg = dayEndHour - dayStartHour;
              const backgroundPositions = bgEvents.map((e) => {
                const startH = Math.max(dayStartHour, getTimeOfDay(e.start));
                const endH = Math.min(dayEndHour, getTimeOfDay(e.end));
                return {
                  event: e,
                  top: ((startH - dayStartHour) / totalHoursForBg) * 100,
                  height: ((endH - startH) / totalHoursForBg) * 100,
                };
              });

              // Multi-day segments
              const multiDayTimedEvents = resourceEvents.filter(
                (e) => !e.allDay && e.display !== "background" && !isSameDay(e.start, e.end),
              );
              const timedSegments = multiDayTimedEvents.flatMap((e) =>
                segmentTimedMultiDayEvent(e, [day], dayStartHour, dayEndHour),
              );

              const syntheticEvents: CalendarEvent[] = timedSegments.map((seg) => {
                const sh = seg.startHour;
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

              // Annotate segments
              const segmentMap = new Map(
                timedSegments.map((s) => [`${s.event.id}::seg::${s.day}`, s]),
              );
              for (const p of positioned) {
                const seg = segmentMap.get(p.event.id);
                if (seg) {
                  p.isSegmentStart = seg.isStart;
                  p.isSegmentEnd = seg.isEnd;
                  p.event = seg.event;
                } else {
                  p.isSegmentStart = true;
                  p.isSegmentEnd = true;
                }
              }

              const todayFlag = isToday(day);

              return (
                <DayColumn
                  key={`${day}-${resource.id}`}
                  day={day}
                  dayIdx={colIdx}
                  resourceId={resource.id}
                  hourLabels={hourLabels}
                  positioned={positioned}
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
            }),
          )}
        </div>
      </div>

      {/* Drag ghost */}
      {dragState && <DragGhost dragState={dragState} />}
    </div>
  );
}
