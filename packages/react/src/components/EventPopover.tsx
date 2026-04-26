import { useState, useCallback } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useInteractions,
  FloatingPortal,
} from "@floating-ui/react";
import { useCalendarSlots } from "../context/SlotsContext";
import { cn } from "../lib/cn";
import {
  formatTimeRange,
  formatAgendaDate,
  eventWallToDisplay,
  getBrowserTimeZone,
  isMultiDayEvent,
  type CalendarEvent,
} from "trud-calendar-core";

interface EventPopoverState {
  event: CalendarEvent | null;
  referenceEl: HTMLElement | null;
}

export function useEventPopover() {
  const [state, setState] = useState<EventPopoverState>({
    event: null,
    referenceEl: null,
  });

  const open = useCallback((event: CalendarEvent, referenceEl: HTMLElement) => {
    setState({ event, referenceEl });
  }, []);

  const close = useCallback(() => {
    setState({ event: null, referenceEl: null });
  }, []);

  return { ...state, isOpen: state.event !== null, open, close };
}

interface EventPopoverContentProps {
  event: CalendarEvent;
  referenceEl: HTMLElement;
  onClose: () => void;
  locale?: string;
  /**
   * IANA zone in which times are rendered. Defaults to the runtime's local
   * zone so the popover keeps working when used standalone (outside a
   * CalendarProvider).
   */
  displayTimeZone?: string;
}

export function EventPopoverContent({
  event,
  referenceEl,
  onClose,
  locale = "en-US",
  displayTimeZone,
}: EventPopoverContentProps) {
  const resolvedDisplayTz = displayTimeZone ?? getBrowserTimeZone();
  const slots = useCalendarSlots();
  const color = event.color || "var(--trc-event-default)";

  const { refs, floatingStyles, context } = useFloating({
    open: true,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
    elements: { reference: referenceEl },
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: "bottom",
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  if (slots.popover) {
    const SlotPopover = slots.popover;
    return (
      <FloatingPortal>
        <div
          ref={refs.setFloating}
          style={{ ...floatingStyles, zIndex: 50 }}
          {...getFloatingProps()}
        >
          <SlotPopover event={event} onClose={onClose} />
        </div>
      </FloatingPortal>
    );
  }

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        {...getFloatingProps()}
        className={cn(
          "z-50 w-72 rounded-[var(--trc-radius)] border border-[var(--trc-border)]",
          "bg-[var(--trc-card)] shadow-lg",
          "p-4",
        )}
        role="dialog"
        aria-label={`Event: ${event.title}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2 min-w-0">
            <div
              className="w-3 h-3 rounded-full shrink-0 mt-1"
              style={{ backgroundColor: color }}
            />
            <h3 className="font-semibold text-[var(--trc-card-foreground)] text-base break-words">
              {event.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "shrink-0 p-1 rounded-[calc(var(--trc-radius)*0.5)]",
              "hover:bg-[var(--trc-accent)] transition-colors",
              "text-[var(--trc-muted-foreground)]",
            )}
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Time */}
        <div className="text-sm text-[var(--trc-muted-foreground)]">
          {event.allDay ? (
            <span>All day — {formatAgendaDate(event.start.slice(0, 10), locale)}</span>
          ) : isMultiDayEvent(event) ? (
            <span>
              {formatAgendaDate(event.start.slice(0, 10), locale)} — {formatAgendaDate(event.end.slice(0, 10), locale)}
            </span>
          ) : (
            <span>
              {formatAgendaDate(event.start.slice(0, 10), locale)}
              <br />
              {formatTimeRange(
                eventWallToDisplay(event.start, event.timeZone, resolvedDisplayTz),
                eventWallToDisplay(event.end, event.timeZone, resolvedDisplayTz),
                locale,
              )}
            </span>
          )}
        </div>
      </div>
    </FloatingPortal>
  );
}
