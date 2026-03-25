import { useCallback, useRef } from "react";
import {
  snapToIncrement,
  yPositionToFractionalHour,
  fractionalHourToDateTime,
  type DateString,
  type DateTimeString,
} from "trud-calendar-core";

export interface ExternalDragData {
  [key: string]: unknown;
}

export interface ExternalDropInfo {
  /** The day the item was dropped on */
  day: DateString;
  /** The start time (snapped to increment) */
  start: DateTimeString;
  /** Resource ID if dropped on a resource column */
  resourceId?: string;
  /** The data attached to the dragged element */
  data: ExternalDragData;
}

export interface UseExternalDragOptions {
  /** Called when an external item is dropped onto the calendar */
  onExternalDrop?: (info: ExternalDropInfo) => void;
  /** Day start hour for time calculation */
  dayStartHour?: number;
  /** Day end hour for time calculation */
  dayEndHour?: number;
  /** Snap increment in minutes */
  snapDuration?: number;
}

export interface UseExternalDragReturn {
  /**
   * Call this to make an element draggable into the calendar.
   * Returns props to spread on the element.
   */
  makeDraggable: (data: ExternalDragData) => {
    draggable: true;
    onDragStart: (e: React.DragEvent) => void;
  };
  /**
   * Props to spread on the calendar container to accept drops.
   * Use on a wrapper div around `<Calendar>`.
   */
  dropTargetProps: {
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
  };
}

const EXTERNAL_DRAG_KEY = "trc-external-drag";

/**
 * Hook for dragging external items onto the calendar.
 *
 * Uses the native HTML5 Drag and Drop API (not Pointer Events)
 * because the drag source is outside the calendar — Pointer Events
 * can't track across separate DOM trees cleanly.
 */
export function useExternalDrag({
  onExternalDrop,
  dayStartHour = 0,
  dayEndHour = 24,
  snapDuration = 15,
}: UseExternalDragOptions): UseExternalDragReturn {
  const dataRef = useRef<ExternalDragData | null>(null);

  const makeDraggable = useCallback(
    (data: ExternalDragData) => ({
      draggable: true as const,
      onDragStart: (e: React.DragEvent) => {
        dataRef.current = data;
        e.dataTransfer.setData(EXTERNAL_DRAG_KEY, JSON.stringify(data));
        e.dataTransfer.effectAllowed = "copy";
      },
    }),
    [],
  );

  const dropTargetProps = {
    onDragOver: useCallback((e: React.DragEvent) => {
      // Allow drop only if this is our external drag
      if (e.dataTransfer.types.includes(EXTERNAL_DRAG_KEY)) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }
    }, []),

    onDrop: useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        if (!onExternalDrop) return;

        const raw = e.dataTransfer.getData(EXTERNAL_DRAG_KEY);
        if (!raw) return;

        let data: ExternalDragData;
        try {
          data = JSON.parse(raw) as ExternalDragData;
        } catch {
          data = dataRef.current ?? {};
        }

        // Find target day and resource from DOM
        const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY);
        let targetDay: DateString | null = null;
        let targetEl: HTMLElement | null = null;
        let resourceId: string | undefined;

        for (const el of elementsUnder) {
          const htmlEl = el as HTMLElement;
          if (!targetDay && htmlEl.dataset?.day) {
            targetDay = htmlEl.dataset.day as DateString;
            targetEl = htmlEl;
          }
          if (!resourceId && htmlEl.dataset?.resourceId) {
            resourceId = htmlEl.dataset.resourceId;
          }
          if (targetDay) break;
        }

        if (!targetDay || !targetEl) return;

        // Calculate time from Y position
        const rect = targetEl.getBoundingClientRect();
        let fractionalHour = yPositionToFractionalHour(
          e.clientY,
          rect,
          dayStartHour,
          dayEndHour,
        );
        fractionalHour = snapToIncrement(fractionalHour, snapDuration);
        fractionalHour = Math.max(dayStartHour, Math.min(dayEndHour, fractionalHour));

        const start = fractionalHourToDateTime(targetDay, fractionalHour);

        onExternalDrop({
          day: targetDay,
          start,
          resourceId,
          data,
        });

        dataRef.current = null;
      },
      [onExternalDrop, dayStartHour, dayEndHour, snapDuration],
    ),

    onDragLeave: useCallback((e: React.DragEvent) => {
      // Only handle leaves from the container itself, not bubbled from children
      if (e.currentTarget === e.target) {
        // Could add visual feedback reset here
      }
    }, []),
  };

  return { makeDraggable, dropTargetProps };
}
