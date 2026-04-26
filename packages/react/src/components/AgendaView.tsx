import { useMemo, useCallback, useState } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import { useCalendarSlots } from "../context/SlotsContext";
import { useSelectionContext } from "../context/SelectionContext";
import { cn } from "../lib/cn";
import {
  groupEventsByDate,
  formatAgendaDate,
  formatTime,
  formatTimeRange,
  eventWallToDisplay,
  isToday,
  isMultiDayEvent,
  parseDate,
  type CalendarEvent,
  type DateString,
} from "trud-calendar-core";

interface AgendaEventItemProps {
  event: CalendarEvent;
  locale: string;
  displayTimeZone: string;
  onEventClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
  itemIndex: number;
  focusedIndex: number;
  onFocus: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isSelected?: boolean;
}

function AgendaEventItem({
  event,
  locale,
  displayTimeZone,
  onEventClick,
  itemIndex,
  focusedIndex,
  onFocus,
  onKeyDown,
  isSelected,
}: AgendaEventItemProps) {
  const slots = useCalendarSlots();
  const color = event.color || "var(--trc-event-default)";

  if (slots.agendaEvent) {
    const SlotAgendaEvent = slots.agendaEvent;
    return (
      <button
        className={cn(
          "w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--trc-primary)] rounded-[var(--trc-radius)]",
          isSelected && "ring-2 ring-[var(--trc-primary)] ring-offset-1",
        )}
        onClick={(e) => onEventClick?.(event, e)}
        tabIndex={itemIndex === focusedIndex ? 0 : -1}
        onFocus={() => onFocus(itemIndex)}
        onKeyDown={onKeyDown}
      >
        <SlotAgendaEvent event={event} />
      </button>
    );
  }

  return (
    <button
      className={cn(
        "flex items-start gap-3 w-full text-left p-3",
        "rounded-[var(--trc-radius)]",
        "hover:bg-[var(--trc-accent)] transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-[var(--trc-primary)]",
        isSelected && "ring-2 ring-[var(--trc-primary)] ring-offset-1",
      )}
      onClick={(e) => onEventClick?.(event, e)}
      tabIndex={itemIndex === focusedIndex ? 0 : -1}
      onFocus={() => onFocus(itemIndex)}
      onKeyDown={onKeyDown}
    >
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[var(--trc-foreground)] truncate">
          {event.title}
        </div>
        <div className="text-sm text-[var(--trc-muted-foreground)]">
          {event.allDay
            ? "All day"
            : isMultiDayEvent(event)
              ? `${formatTime(eventWallToDisplay(event.start, event.timeZone, displayTimeZone), locale)} — multi-day`
              : formatTimeRange(
                  eventWallToDisplay(event.start, event.timeZone, displayTimeZone),
                  eventWallToDisplay(event.end, event.timeZone, displayTimeZone),
                  locale,
                )}
        </div>
      </div>
    </button>
  );
}

export function AgendaView() {
  const { visibleEvents, visibleRange, locale, hiddenDays, labels, displayTimeZone } =
    useCalendarContext();
  const selectionCtx = useSelectionContext();

  const grouped = useMemo(() => {
    const all = groupEventsByDate(visibleEvents, visibleRange.start, visibleRange.end);
    if (hiddenDays.length === 0) return all;
    const hiddenSet = new Set(hiddenDays);
    const filtered = new Map<DateString, CalendarEvent[]>();
    for (const [date, events] of all) {
      if (!hiddenSet.has(parseDate(date as DateString).getDay())) {
        filtered.set(date as DateString, events);
      }
    }
    return filtered;
  }, [visibleEvents, visibleRange, hiddenDays]);

  // Flatten all events for keyboard navigation
  const allItems = useMemo(() => {
    const items: CalendarEvent[] = [];
    for (const [, events] of grouped) {
      items.push(...events);
    }
    return items;
  }, [grouped]);

  const [focusedIndex, setFocusedIndex] = useState(0);

  // Selection-aware click handler
  const handleEventClick = useCallback(
    (event: CalendarEvent, e: React.MouseEvent) => {
      selectionCtx.handleEventClick(event, e);
    },
    [selectionCtx],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newIndex = focusedIndex;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          newIndex = Math.max(0, focusedIndex - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          newIndex = Math.min(allItems.length - 1, focusedIndex + 1);
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = allItems.length - 1;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (allItems[focusedIndex]) {
            selectionCtx.handleEventClick(
              allItems[focusedIndex],
              e as unknown as React.MouseEvent,
            );
          }
          return;
        default:
          return;
      }

      setFocusedIndex(newIndex);
      // Focus the element at the new index
      const container = e.currentTarget.closest("[role='list']");
      if (container) {
        const buttons = container.querySelectorAll<HTMLElement>("button[tabindex]");
        buttons[newIndex]?.focus();
      }
    },
    [focusedIndex, allItems, selectionCtx],
  );

  if (grouped.size === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-[var(--trc-muted-foreground)] text-sm">
          {labels.noEvents}
        </p>
      </div>
    );
  }

  let itemCounter = 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4" role="list" aria-label="Agenda view">
      {Array.from(grouped.entries()).map(([date, events]) => {
        const todayFlag = isToday(date);
        return (
          <div key={date} className="mb-4" role="listitem">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 mb-1",
                "sticky top-0 z-[5]",
                "bg-[var(--trc-background)]",
              )}
            >
              <h3
                className={cn(
                  "text-sm font-semibold",
                  todayFlag
                    ? "text-[var(--trc-today-text)]"
                    : "text-[var(--trc-foreground)]",
                )}
              >
                {formatAgendaDate(date, locale)}
              </h3>
              {todayFlag && (
                <span className="text-xs bg-[var(--trc-today-bg)] text-[var(--trc-today-text)] px-1.5 py-0.5 rounded-full font-medium">
                  Today
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              {events.map((event) => {
                const idx = itemCounter++;
                return (
                  <AgendaEventItem
                    key={event.id}
                    event={event}
                    locale={locale}
                    displayTimeZone={displayTimeZone}
                    onEventClick={handleEventClick}
                    itemIndex={idx}
                    focusedIndex={focusedIndex}
                    onFocus={setFocusedIndex}
                    onKeyDown={handleKeyDown}
                    isSelected={selectionCtx.isSelected(event.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
