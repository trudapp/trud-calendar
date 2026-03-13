import { useState, useCallback, useRef, useEffect } from "react";
import {
  snapToIncrement,
  yPositionToFractionalHour,
  fractionalHourToDateTime,
  type CalendarEvent,
  type DateString,
  type DateTimeString,
} from "trud-calendar-core";

/** Drag threshold in px to distinguish click from drag */
const DRAG_THRESHOLD = 5;

export interface DragState {
  event: CalendarEvent;
  /** Current ghost position (viewport-relative) */
  ghostX: number;
  ghostY: number;
  /** Target day being hovered over */
  targetDay: DateString | null;
}

export interface UseEventDragOptions {
  enabled?: boolean;
  dayStartHour?: number;
  dayEndHour?: number;
  onEventDrop?: (
    event: CalendarEvent,
    newStart: DateTimeString,
    newEnd: DateTimeString,
  ) => void;
  /** 'time' for week/day views (calculates time from Y position), 'date' for month view (preserves original time) */
  mode: "time" | "date";
  /** Set of selected event IDs for multi-drag */
  selectedIds?: Set<string>;
  /** All visible events (needed to resolve selected events for multi-drag) */
  events?: CalendarEvent[];
}

export interface UseEventDragReturn {
  dragState: DragState | null;
  onPointerDown: (e: React.PointerEvent, event: CalendarEvent) => void;
  isDragging: boolean;
  /** Did a drag just finish? Used to suppress click. */
  didDrag: React.MutableRefObject<boolean>;
}

export function useEventDrag({
  enabled = false,
  dayStartHour = 0,
  dayEndHour = 24,
  onEventDrop,
  mode,
  selectedIds,
  events,
}: UseEventDragOptions): UseEventDragReturn {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const didDrag = useRef(false);

  const activeRef = useRef<{
    event: CalendarEvent;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    isDragging: boolean;
  } | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const active = activeRef.current;
      if (!active) return;

      const deltaX = Math.abs(e.clientX - active.startX);
      const deltaY = Math.abs(e.clientY - active.startY);

      if (!active.isDragging && Math.max(deltaX, deltaY) < DRAG_THRESHOLD)
        return;

      if (!active.isDragging) {
        active.isDragging = true;
        document.body.style.userSelect = "none";
      }

      // Find target day column/cell under cursor
      const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY);
      let targetDay: DateString | null = null;
      for (const el of elementsUnder) {
        const day = (el as HTMLElement).dataset?.day;
        if (day) {
          targetDay = day as DateString;
          break;
        }
      }

      setDragState({
        event: active.event,
        ghostX: e.clientX - active.offsetX,
        ghostY: e.clientY - active.offsetY,
        targetDay,
      });
    },
    [],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      const active = activeRef.current;
      if (!active) return;

      if (active.isDragging && onEventDrop) {
        // Find target day
        const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY);
        let targetDay: DateString | null = null;
        let targetEl: HTMLElement | null = null;
        for (const el of elementsUnder) {
          const day = (el as HTMLElement).dataset?.day;
          if (day) {
            targetDay = day as DateString;
            targetEl = el as HTMLElement;
            break;
          }
        }

        if (targetDay) {
          const pad = (n: number) => String(n).padStart(2, "0");

          const applyDeltaToEvent = (
            ev: CalendarEvent,
            deltaMs: number,
          ): { newStart: DateTimeString; newEnd: DateTimeString } => {
            const evStartMs = new Date(ev.start).getTime();
            const evEndMs = new Date(ev.end).getTime();
            const ns = new Date(evStartMs + deltaMs);
            const ne = new Date(evEndMs + deltaMs);
            const newStart = `${ns.getFullYear()}-${pad(ns.getMonth() + 1)}-${pad(ns.getDate())}T${pad(ns.getHours())}:${pad(ns.getMinutes())}:${pad(ns.getSeconds())}` as DateTimeString;
            const newEnd = `${ne.getFullYear()}-${pad(ne.getMonth() + 1)}-${pad(ne.getDate())}T${pad(ne.getHours())}:${pad(ne.getMinutes())}:${pad(ne.getSeconds())}` as DateTimeString;
            return { newStart, newEnd };
          };

          const durationMs =
            new Date(active.event.end).getTime() -
            new Date(active.event.start).getTime();

          let primaryNewStartMs: number | null = null;

          if (mode === "time" && targetEl) {
            const rect = targetEl.getBoundingClientRect();
            let fractionalHour = yPositionToFractionalHour(
              e.clientY,
              rect,
              dayStartHour,
              dayEndHour,
            );
            fractionalHour = snapToIncrement(fractionalHour, 15);
            fractionalHour = Math.max(
              dayStartHour,
              Math.min(dayEndHour, fractionalHour),
            );

            const newStart = fractionalHourToDateTime(targetDay, fractionalHour);
            primaryNewStartMs = new Date(newStart).getTime();
            const newEndDate = new Date(primaryNewStartMs + durationMs);

            const endDay = `${newEndDate.getFullYear()}-${pad(newEndDate.getMonth() + 1)}-${pad(newEndDate.getDate())}`;
            const newEnd =
              `${endDay}T${pad(newEndDate.getHours())}:${pad(newEndDate.getMinutes())}:${pad(newEndDate.getSeconds())}` as DateTimeString;

            onEventDrop(active.event, newStart, newEnd);
          } else if (mode === "date") {
            // Preserve original time, change date
            const originalTime = active.event.start.slice(11);
            const newStart =
              `${targetDay}T${originalTime}` as DateTimeString;
            primaryNewStartMs = new Date(newStart).getTime();
            const newEndDate = new Date(primaryNewStartMs + durationMs);

            const endDay = `${newEndDate.getFullYear()}-${pad(newEndDate.getMonth() + 1)}-${pad(newEndDate.getDate())}`;
            const newEnd =
              `${endDay}T${pad(newEndDate.getHours())}:${pad(newEndDate.getMinutes())}:${pad(newEndDate.getSeconds())}` as DateTimeString;

            onEventDrop(active.event, newStart, newEnd);
          }

          // Multi-drag: if the dragged event is in the selection, apply same delta to all other selected events
          if (
            primaryNewStartMs !== null &&
            selectedIds &&
            selectedIds.size > 1 &&
            selectedIds.has(active.event.id) &&
            events
          ) {
            const originalStartMs = new Date(active.event.start).getTime();
            const deltaMs = primaryNewStartMs - originalStartMs;

            if (deltaMs !== 0) {
              for (const ev of events) {
                if (ev.id === active.event.id) continue;
                if (!selectedIds.has(ev.id)) continue;
                const { newStart, newEnd } = applyDeltaToEvent(ev, deltaMs);
                onEventDrop(ev, newStart, newEnd);
              }
            }
          }
        }
      }

      // Set didDrag to prevent click, reset after a tick
      if (active.isDragging) {
        didDrag.current = true;
        requestAnimationFrame(() => {
          didDrag.current = false;
        });
      }

      // Clean up
      activeRef.current = null;
      setDragState(null);
      document.body.style.userSelect = "";

      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    },
    [onEventDrop, mode, dayStartHour, dayEndHour, handlePointerMove, selectedIds, events],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent, event: CalendarEvent) => {
      if (!enabled || !onEventDrop) return;
      if (e.button !== 0) return;

      e.stopPropagation();

      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();

      activeRef.current = {
        event,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        isDragging: false,
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [enabled, onEventDrop, handlePointerMove, handlePointerUp],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.body.style.userSelect = "";
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    dragState,
    onPointerDown,
    isDragging: dragState !== null,
    didDrag,
  };
}
