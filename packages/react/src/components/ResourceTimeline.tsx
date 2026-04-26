import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import { useCalendarSlots } from "../context/SlotsContext";
import { useSelectionContext } from "../context/SelectionContext";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { cn } from "../lib/cn";
import { anchorTimesToEventZone, anchorWallToEventZone } from "../lib/anchorTimes";
import {
  flattenResources,
  formatTime,
  fractionalHourToDateTime,
  eventWallToDisplay,
  getHourLabels,
  getTimeOfDay,
  isToday,
  snapToIncrement,
  computeTimelinePositions,
  type CalendarEvent,
  type DateTimeString,
  type Resource,
  type TimelinePositionedEvent,
} from "trud-calendar-core";

const RESOURCE_COL_WIDTH = "var(--trc-resource-col, 160px)";
const ROW_MIN_HEIGHT = "var(--trc-timeline-row, 56px)";
const DRAG_THRESHOLD = 5;

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

function buildEndFromStart(displayStart: DateTimeString, durationMs: number): DateTimeString {
  const startMs = new Date(displayStart).getTime();
  const endDate = new Date(startMs + durationMs);
  return `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:${pad(endDate.getSeconds())}`;
}

interface DragPreview {
  eventId: string;
  resourceId: string;
  leftPct: number;
  widthPct: number;
}

interface ResizePreview {
  eventId: string;
  resourceId: string;
  widthPct: number;
}

interface TimelineEventBarProps {
  positioned: TimelinePositionedEvent;
  locale: string;
  displayTimeZone: string;
  isSelected: boolean;
  isInteracting: boolean;
  enableDnD: boolean;
  enableResize: boolean;
  onClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
  onDragPointerDown?: (e: React.PointerEvent, event: CalendarEvent, resourceId: string) => void;
  onResizePointerDown?: (e: React.PointerEvent, event: CalendarEvent, resourceId: string) => void;
}

function TimelineEventBar({
  positioned,
  locale,
  displayTimeZone,
  isSelected,
  isInteracting,
  enableDnD,
  enableResize,
  onClick,
  onDragPointerDown,
  onResizePointerDown,
}: TimelineEventBarProps) {
  const { event, leftPct, widthPct, row, totalRows, isSegmentStart, isSegmentEnd, resourceId } = positioned;
  const color = event.color || "var(--trc-event-default)";
  const rowHeightPct = 100 / totalRows;
  const topPct = row * rowHeightPct;

  return (
    <div
      data-event-id={event.id}
      role="button"
      tabIndex={0}
      aria-label={event.title}
      className={cn(
        "absolute text-left overflow-hidden rounded-[calc(var(--trc-radius)*0.5)]",
        "border-l-2 transition-opacity",
        "hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--trc-primary)] focus-visible:outline-none",
        isSelected && "ring-2 ring-[var(--trc-primary)] ring-offset-1",
      )}
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        top: `calc(${topPct}% + 2px)`,
        height: `calc(${rowHeightPct}% - 4px)`,
        backgroundColor: `${color}20`,
        borderLeftColor: color,
        borderTopLeftRadius: isSegmentStart ? undefined : 0,
        borderBottomLeftRadius: isSegmentStart ? undefined : 0,
        borderTopRightRadius: isSegmentEnd ? undefined : 0,
        borderBottomRightRadius: isSegmentEnd ? undefined : 0,
        opacity: isInteracting ? 0.4 : undefined,
        touchAction: enableDnD ? "none" : undefined,
        cursor: enableDnD ? "grab" : undefined,
      }}
      onPointerDown={enableDnD && onDragPointerDown ? (e) => onDragPointerDown(e, event, resourceId) : undefined}
      onClick={(e) => onClick?.(event, e)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(event, e as unknown as React.MouseEvent);
        }
      }}
      title={event.title}
    >
      <div className="px-1.5 py-0.5 text-xs font-medium pointer-events-none">
        <div className="truncate text-[var(--trc-foreground)]">{event.title}</div>
        <div className="truncate text-[10px] text-[var(--trc-muted-foreground)]">
          {formatTime(eventWallToDisplay(event.start, event.timeZone, displayTimeZone), locale)}
        </div>
      </div>

      {enableResize && isSegmentEnd && onResizePointerDown && (
        <div
          aria-hidden
          className="absolute top-0 bottom-0 right-0 w-1.5 cursor-e-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{ touchAction: "none", backgroundColor: color }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizePointerDown(e, event, resourceId);
          }}
        />
      )}
    </div>
  );
}

interface ResourceRowProps {
  resource: Resource;
  positioned: TimelinePositionedEvent[];
  hourCount: number;
  locale: string;
  displayTimeZone: string;
  enableDnD: boolean;
  enableResize: boolean;
  draggingEventId: string | null;
  resizingEventId: string | null;
  dragPreview: DragPreview | null;
  resizePreview: ResizePreview | null;
  isSelected: (id: string) => boolean;
  onEventClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
  onSlotClick?: (resourceId: string) => void;
  onDragPointerDown: (e: React.PointerEvent, event: CalendarEvent, resourceId: string) => void;
  onResizePointerDown: (e: React.PointerEvent, event: CalendarEvent, resourceId: string) => void;
  customHeader?: (resource: Resource) => React.ReactNode;
}

function ResourceRow({
  resource,
  positioned,
  hourCount,
  locale,
  displayTimeZone,
  enableDnD,
  enableResize,
  draggingEventId,
  resizingEventId,
  dragPreview,
  resizePreview,
  isSelected,
  onEventClick,
  onSlotClick,
  onDragPointerDown,
  onResizePointerDown,
  customHeader,
}: ResourceRowProps) {
  const totalRows = positioned.reduce((max, p) => Math.max(max, p.totalRows), 1);
  const showDragPreview = dragPreview && dragPreview.resourceId === resource.id;
  return (
    <>
      <div
        className={cn(
          "sticky left-0 z-10 px-3 py-2 flex items-center gap-2",
          "border-r border-b border-[var(--trc-border)]",
          "bg-[var(--trc-background)]",
        )}
        style={{ minHeight: ROW_MIN_HEIGHT }}
      >
        {customHeader ? (
          customHeader(resource)
        ) : (
          <>
            {resource.color && (
              <span
                aria-hidden
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: resource.color }}
              />
            )}
            <span className="text-sm font-medium text-[var(--trc-foreground)] truncate">
              {resource.title}
            </span>
          </>
        )}
      </div>
      <div
        data-timeline-resource-id={resource.id}
        className={cn("relative border-b border-[var(--trc-border)]")}
        style={{
          minHeight: `calc(${ROW_MIN_HEIGHT} * ${totalRows})`,
          backgroundImage: `repeating-linear-gradient(to right, transparent, transparent calc(100% / ${hourCount} - 1px), var(--trc-border) calc(100% / ${hourCount} - 1px), var(--trc-border) calc(100% / ${hourCount}))`,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onSlotClick?.(resource.id);
        }}
      >
        {positioned.map((p) => {
          const isDragging = draggingEventId === p.event.id;
          const isResizing = resizingEventId === p.event.id;
          const widthOverride =
            isResizing && resizePreview && resizePreview.eventId === p.event.id
              ? resizePreview.widthPct
              : null;
          return (
            <TimelineEventBar
              key={p.event.id}
              positioned={widthOverride !== null ? { ...p, widthPct: widthOverride } : p}
              locale={locale}
              displayTimeZone={displayTimeZone}
              isSelected={isSelected(p.event.id)}
              isInteracting={isDragging}
              enableDnD={enableDnD}
              enableResize={enableResize}
              onClick={onEventClick}
              onDragPointerDown={onDragPointerDown}
              onResizePointerDown={onResizePointerDown}
            />
          );
        })}

        {showDragPreview && (
          <div
            className="absolute pointer-events-none rounded-[calc(var(--trc-radius)*0.5)] border-2 border-dashed"
            style={{
              left: `${dragPreview.leftPct}%`,
              width: `${dragPreview.widthPct}%`,
              top: 2,
              bottom: 2,
              borderColor: "var(--trc-primary)",
              backgroundColor: "var(--trc-primary)",
              opacity: 0.15,
            }}
            aria-hidden
          />
        )}
      </div>
    </>
  );
}

interface ActiveDrag {
  event: CalendarEvent;
  startResourceId: string;
  startMouseX: number;
  startMouseY: number;
  rowWidthPx: number;
  durationMs: number;
  didDrag: boolean;
}

interface ActiveResize {
  event: CalendarEvent;
  resourceId: string;
  startMouseX: number;
  rowWidthPx: number;
  originalEndHour: number;
  originalStartHour: number;
}

export function ResourceTimeline() {
  const {
    state,
    visibleEvents,
    locale,
    dayStartHour,
    dayEndHour,
    snapDuration,
    resources,
    onEventClick,
    onEventDrop,
    onEventResize,
    onSlotClick,
    slotClickTime,
    enableDnD,
    dragConstraint,
    resizeConstraint,
    labels,
    displayTimeZone,
  } = useCalendarContext();
  const slots = useCalendarSlots();
  const selectionCtx = useSelectionContext();
  const { timeOfDay } = useCurrentTime({ timeZone: displayTimeZone });

  const day = state.currentDate;
  const flatResources = useMemo(() => flattenResources(resources), [resources]);
  const resourceIds = useMemo(() => flatResources.map((r) => r.id), [flatResources]);
  const resourceIndex = useMemo(() => new Map(flatResources.map((r, i) => [r.id, i])), [flatResources]);

  const hourLabels = useMemo(
    () => getHourLabels(dayStartHour, dayEndHour, locale),
    [dayStartHour, dayEndHour, locale],
  );

  const positionedByResource = useMemo(
    () => computeTimelinePositions(visibleEvents, resourceIds, day, dayStartHour, dayEndHour),
    [visibleEvents, resourceIds, day, dayStartHour, dayEndHour],
  );

  const totalHours = Math.max(0.0001, dayEndHour - dayStartHour);
  const isCurrentDay = isToday(day);
  const nowLeftPct = ((timeOfDay - dayStartHour) / totalHours) * 100;
  const nowVisible = isCurrentDay && nowLeftPct >= 0 && nowLeftPct <= 100;

  // ── Drag and resize state machines ────────────────────────────
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const activeResizeRef = useRef<ActiveResize | null>(null);
  const didInteractRef = useRef(false);

  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const [resizingEventId, setResizingEventId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [resizePreview, setResizePreview] = useState<ResizePreview | null>(null);

  const findRowResourceId = (clientX: number, clientY: number): string | null => {
    const els = document.elementsFromPoint(clientX, clientY);
    for (const el of els) {
      if (el instanceof HTMLElement && el.dataset?.timelineResourceId) {
        return el.dataset.timelineResourceId;
      }
    }
    return null;
  };

  const onDragPointerDown = useCallback(
    (e: React.PointerEvent, event: CalendarEvent, resourceId: string) => {
      if (!enableDnD || !onEventDrop) return;
      // Find the row's time-area element to get its width.
      const rowEl = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-timeline-resource-id]");
      if (!rowEl) return;
      const rect = rowEl.getBoundingClientRect();
      const durationMs =
        new Date(event.end).getTime() - new Date(event.start).getTime();
      activeDragRef.current = {
        event,
        startResourceId: resourceId,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        rowWidthPx: rect.width,
        durationMs,
        didDrag: false,
      };
      e.preventDefault();
    },
    [enableDnD, onEventDrop],
  );

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent, event: CalendarEvent, resourceId: string) => {
      if (!onEventResize) return;
      const rowEl = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-timeline-resource-id]");
      if (!rowEl) return;
      const rect = rowEl.getBoundingClientRect();
      activeResizeRef.current = {
        event,
        resourceId,
        startMouseX: e.clientX,
        rowWidthPx: rect.width,
        originalEndHour: getTimeOfDay(event.end),
        originalStartHour: getTimeOfDay(event.start),
      };
      e.preventDefault();
    },
    [onEventResize],
  );

  // Global pointermove / pointerup listeners installed once.
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const drag = activeDragRef.current;
      const resize = activeResizeRef.current;

      if (drag) {
        const dx = e.clientX - drag.startMouseX;
        const dy = e.clientY - drag.startMouseY;
        if (!drag.didDrag && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        drag.didDrag = true;
        didInteractRef.current = true;

        const pixelsPerHour = drag.rowWidthPx / totalHours;
        const deltaHoursRaw = dx / pixelsPerHour;
        const originalStartHour = getTimeOfDay(drag.event.start);
        const newStartHour = snapToIncrement(originalStartHour + deltaHoursRaw, snapDuration);
        const widthPct = ((drag.durationMs / 3_600_000) / totalHours) * 100;
        const leftPct = ((newStartHour - dayStartHour) / totalHours) * 100;

        const targetResourceId = findRowResourceId(e.clientX, e.clientY) ?? drag.startResourceId;

        setDraggingEventId(drag.event.id);
        setDragPreview({
          eventId: drag.event.id,
          resourceId: targetResourceId,
          leftPct,
          widthPct,
        });
      } else if (resize) {
        const dx = e.clientX - resize.startMouseX;
        const pixelsPerHour = resize.rowWidthPx / totalHours;
        const deltaHoursRaw = dx / pixelsPerHour;
        const minDurationHours = snapDuration / 60;
        const newEndHourRaw = resize.originalEndHour + deltaHoursRaw;
        const minEnd = resize.originalStartHour + minDurationHours;
        const clamped = Math.max(minEnd, Math.min(dayEndHour, newEndHourRaw));
        const newEndHour = snapToIncrement(clamped, snapDuration);

        const widthPct = ((newEndHour - resize.originalStartHour) / totalHours) * 100;
        if (Math.abs(dx) >= DRAG_THRESHOLD) didInteractRef.current = true;

        setResizingEventId(resize.event.id);
        setResizePreview({
          eventId: resize.event.id,
          resourceId: resize.resourceId,
          widthPct,
        });
      }
    };

    const handleUp = (e: PointerEvent) => {
      const drag = activeDragRef.current;
      const resize = activeResizeRef.current;

      if (drag) {
        if (drag.didDrag && onEventDrop) {
          const dx = e.clientX - drag.startMouseX;
          const pixelsPerHour = drag.rowWidthPx / totalHours;
          const deltaHoursRaw = dx / pixelsPerHour;
          const originalStartHour = getTimeOfDay(drag.event.start);
          const newStartHour = Math.max(
            dayStartHour,
            Math.min(dayEndHour, snapToIncrement(originalStartHour + deltaHoursRaw, snapDuration)),
          );
          const targetResourceId = findRowResourceId(e.clientX, e.clientY) ?? drag.startResourceId;

          const displayStart = fractionalHourToDateTime(day, newStartHour);
          const displayEnd = buildEndFromStart(displayStart, drag.durationMs);
          const { newStart, newEnd } = anchorTimesToEventZone(
            displayStart,
            displayEnd,
            drag.event.timeZone,
            displayTimeZone,
          );

          if (!dragConstraint || dragConstraint(drag.event, newStart, newEnd)) {
            const extra = targetResourceId !== drag.startResourceId
              ? { resourceId: targetResourceId }
              : undefined;
            onEventDrop(drag.event, newStart, newEnd, extra);
          }
        }
        activeDragRef.current = null;
        setDraggingEventId(null);
        setDragPreview(null);
      } else if (resize) {
        const didMove = Math.abs(e.clientX - resize.startMouseX) >= DRAG_THRESHOLD;
        if (didMove && onEventResize) {
          const dx = e.clientX - resize.startMouseX;
          const pixelsPerHour = resize.rowWidthPx / totalHours;
          const deltaHoursRaw = dx / pixelsPerHour;
          const minDurationHours = snapDuration / 60;
          const newEndHourRaw = resize.originalEndHour + deltaHoursRaw;
          const minEnd = resize.originalStartHour + minDurationHours;
          const clamped = Math.max(minEnd, Math.min(dayEndHour, newEndHourRaw));
          const newEndHour = snapToIncrement(clamped, snapDuration);

          const displayNewEnd = fractionalHourToDateTime(day, newEndHour);
          const newEnd = displayTimeZone
            ? anchorWallToEventZone(displayNewEnd, resize.event.timeZone, displayTimeZone)
            : displayNewEnd;

          if (!resizeConstraint || resizeConstraint(resize.event, resize.event.start, newEnd)) {
            onEventResize(resize.event, resize.event.start, newEnd);
          }
        }
        activeResizeRef.current = null;
        setResizingEventId(null);
        setResizePreview(null);
      }

      // Reset the click-suppression flag after the current event loop tick so
      // the synthetic click event that follows pointerup is ignored.
      if (didInteractRef.current) {
        const reset = () => {
          didInteractRef.current = false;
        };
        if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(reset);
        else setTimeout(reset, 0);
      }
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    };
  }, [day, dayStartHour, dayEndHour, totalHours, snapDuration, displayTimeZone, onEventDrop, onEventResize, dragConstraint, resizeConstraint]);

  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      if (didInteractRef.current) return;
      onEventClick?.(event);
    },
    [onEventClick],
  );

  const handleSlotClick = useCallback(
    (resourceId: string) => {
      if (didInteractRef.current) return;
      onSlotClick?.(`${day}T${slotClickTime}`, { resourceId });
    },
    [onSlotClick, day, slotClickTime],
  );

  if (flatResources.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-[var(--trc-muted-foreground)]">
        {labels.timeline}: no resources configured
      </div>
    );
  }

  // Suppress unused variable warning — referenced for memo stability only.
  void resourceIndex;

  return (
    <div
      className={cn(
        "relative overflow-auto",
        "bg-[var(--trc-background)]",
      )}
      style={{
        gridTemplateColumns: `${RESOURCE_COL_WIDTH} 1fr`,
        display: "grid",
        position: "relative",
      }}
    >
      <div
        className={cn(
          "sticky top-0 left-0 z-30 border-r border-b border-[var(--trc-border)]",
          "bg-[var(--trc-background)]",
        )}
      />

      <div
        className={cn(
          "sticky top-0 z-20 border-b border-[var(--trc-border)] bg-[var(--trc-background)]",
        )}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${hourLabels.length}, 1fr)`,
        }}
      >
        {hourLabels.map((label, i) => (
          <div
            key={i}
            className={cn(
              "px-2 py-1.5 text-[10px] font-medium text-[var(--trc-muted-foreground)] uppercase tracking-wide",
              i > 0 && "border-l border-[var(--trc-border)]",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {flatResources.map((resource) => (
        <ResourceRow
          key={resource.id}
          resource={resource}
          positioned={positionedByResource.get(resource.id) ?? []}
          hourCount={hourLabels.length}
          locale={locale}
          displayTimeZone={displayTimeZone}
          enableDnD={!!enableDnD && !!onEventDrop}
          enableResize={!!onEventResize}
          draggingEventId={draggingEventId}
          resizingEventId={resizingEventId}
          dragPreview={dragPreview}
          resizePreview={resizePreview}
          isSelected={selectionCtx.isSelected}
          onEventClick={(event) => handleEventClick(event)}
          onSlotClick={handleSlotClick}
          onDragPointerDown={onDragPointerDown}
          onResizePointerDown={onResizePointerDown}
          customHeader={slots.resourceHeader ? (r) => {
            const Slot = slots.resourceHeader!;
            return <Slot resource={r} />;
          } : undefined}
        />
      ))}

      {nowVisible && (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            top: 0,
            bottom: 0,
            left: `calc(${RESOURCE_COL_WIDTH} + (100% - ${RESOURCE_COL_WIDTH}) * ${nowLeftPct / 100})`,
            width: 0,
            borderLeft: "2px solid var(--trc-now-line, #ef4444)",
          }}
          aria-hidden
        />
      )}
    </div>
  );
}
