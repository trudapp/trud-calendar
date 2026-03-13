import { useState, useRef } from "react";
import { CalendarProvider, useCalendarContext } from "../context/CalendarContext";
import { SlotsProvider } from "../context/SlotsContext";
import { SelectionProvider } from "../context/SelectionContext";
import { useNavigation } from "../hooks/useNavigation";
import { useSwipeNavigation } from "../hooks/useSwipeNavigation";
import { Toolbar } from "./Toolbar";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import { AgendaView } from "./AgendaView";
import { EventPopoverContent } from "./EventPopover";
import { cn } from "../lib/cn";
import type { CalendarConfig, CalendarEvent } from "trud-calendar-core";

export interface CalendarProps extends CalendarConfig {
  /** Additional CSS class names */
  className?: string;
}

export function Calendar({ className, ...config }: CalendarProps) {
  const [popover, setPopover] = useState<{
    event: CalendarEvent;
    ref: HTMLElement;
  } | null>(null);

  const internalEventClick = config.onEventClick
    ? config.onEventClick
    : (event: CalendarEvent) => {
        const el = document.activeElement as HTMLElement;
        if (el) setPopover({ event, ref: el });
      };

  const configWithPopover = {
    ...config,
    onEventClick: internalEventClick,
  };

  return (
    <CalendarProvider config={configWithPopover}>
      <SlotsProvider slots={config.slots}>
        <SelectionProvider
          enableMultiSelect={config.enableMultiSelect ?? false}
          onEventClick={internalEventClick}
          onEventsDelete={config.onEventsDelete}
        >
          <CalendarShell className={className}>
            <Toolbar />
            <ViewRenderer />
            {popover && (
              <EventPopoverContent
                event={popover.event}
                referenceEl={popover.ref}
                onClose={() => setPopover(null)}
                locale={config.locale?.locale}
              />
            )}
          </CalendarShell>
        </SelectionProvider>
      </SlotsProvider>
    </CalendarProvider>
  );
}

function CalendarShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nav = useNavigation();

  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: nav.next,
    onSwipeRight: nav.prev,
  });

  return (
    <div
      ref={containerRef}
      data-trc-calendar=""
      className={cn(
        "@container flex flex-col h-full bg-[var(--trc-background)] text-[var(--trc-foreground)]",
        "border border-[var(--trc-border)] rounded-[var(--trc-radius)] overflow-hidden",
        className,
      )}
      onPointerDown={swipeHandlers.onPointerDown}
      onPointerMove={swipeHandlers.onPointerMove}
      onPointerUp={swipeHandlers.onPointerUp}
    >
      {children}
    </div>
  );
}

function ViewRenderer() {
  const { state } = useCalendarContext();
  switch (state.view) {
    case "month":
      return <MonthView />;
    case "week":
      return <WeekView />;
    case "day":
      return <DayView />;
    case "agenda":
      return <AgendaView />;
  }
}
