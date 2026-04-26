import { useMemo } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import { useCalendarSlots } from "../context/SlotsContext";
import { useSelectionContext } from "../context/SelectionContext";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { cn } from "../lib/cn";
import {
  flattenResources,
  formatTime,
  eventWallToDisplay,
  getHourLabels,
  isToday,
  computeTimelinePositions,
  type CalendarEvent,
  type Resource,
  type TimelinePositionedEvent,
} from "trud-calendar-core";

const RESOURCE_COL_WIDTH = "var(--trc-resource-col, 160px)";
const ROW_MIN_HEIGHT = "var(--trc-timeline-row, 56px)";

interface TimelineEventBarProps {
  positioned: TimelinePositionedEvent;
  locale: string;
  displayTimeZone: string;
  isSelected: boolean;
  onClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
}

function TimelineEventBar({ positioned, locale, displayTimeZone, isSelected, onClick }: TimelineEventBarProps) {
  const { event, leftPct, widthPct, row, totalRows, isSegmentStart, isSegmentEnd } = positioned;
  const color = event.color || "var(--trc-event-default)";
  const rowHeightPct = 100 / totalRows;
  const topPct = row * rowHeightPct;

  return (
    <button
      data-event-id={event.id}
      className={cn(
        "absolute text-left overflow-hidden rounded-[calc(var(--trc-radius)*0.5)]",
        "px-1.5 py-0.5 text-xs font-medium",
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
      }}
      onClick={(e) => onClick?.(event, e)}
      title={event.title}
    >
      <div className="truncate text-[var(--trc-foreground)]">{event.title}</div>
      <div className="truncate text-[10px] text-[var(--trc-muted-foreground)]">
        {formatTime(eventWallToDisplay(event.start, event.timeZone, displayTimeZone), locale)}
      </div>
    </button>
  );
}

interface ResourceRowProps {
  resource: Resource;
  positioned: TimelinePositionedEvent[];
  hourCount: number;
  locale: string;
  displayTimeZone: string;
  isSelected: (id: string) => boolean;
  onEventClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
  onSlotClick?: () => void;
  customHeader?: (resource: Resource) => React.ReactNode;
}

function ResourceRow({
  resource,
  positioned,
  hourCount,
  locale,
  displayTimeZone,
  isSelected,
  onEventClick,
  onSlotClick,
  customHeader,
}: ResourceRowProps) {
  // A row has at least one sub-row; events stacked when overlapping.
  const totalRows = positioned.reduce((max, p) => Math.max(max, p.totalRows), 1);
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
        className={cn("relative border-b border-[var(--trc-border)]")}
        style={{
          minHeight: `calc(${ROW_MIN_HEIGHT} * ${totalRows})`,
          backgroundImage: `repeating-linear-gradient(to right, transparent, transparent calc(100% / ${hourCount} - 1px), var(--trc-border) calc(100% / ${hourCount} - 1px), var(--trc-border) calc(100% / ${hourCount}))`,
        }}
        onClick={(e) => {
          // Forward to onSlotClick if the click was on the empty area (not an event).
          if (e.target === e.currentTarget) onSlotClick?.();
        }}
      >
        {positioned.map((p) => (
          <TimelineEventBar
            key={p.event.id}
            positioned={p}
            locale={locale}
            displayTimeZone={displayTimeZone}
            isSelected={isSelected(p.event.id)}
            onClick={onEventClick}
          />
        ))}
      </div>
    </>
  );
}

export function ResourceTimeline() {
  const {
    state,
    visibleEvents,
    locale,
    dayStartHour,
    dayEndHour,
    resources,
    onEventClick,
    onSlotClick,
    slotClickTime,
    labels,
    displayTimeZone,
  } = useCalendarContext();
  const slots = useCalendarSlots();
  const selectionCtx = useSelectionContext();
  const { timeOfDay } = useCurrentTime({ timeZone: displayTimeZone });

  const day = state.currentDate;
  const flatResources = useMemo(() => flattenResources(resources), [resources]);
  const resourceIds = useMemo(() => flatResources.map((r) => r.id), [flatResources]);

  const hourLabels = useMemo(
    () => getHourLabels(dayStartHour, dayEndHour, locale),
    [dayStartHour, dayEndHour, locale],
  );

  const positionedByResource = useMemo(
    () => computeTimelinePositions(visibleEvents, resourceIds, day, dayStartHour, dayEndHour),
    [visibleEvents, resourceIds, day, dayStartHour, dayEndHour],
  );

  const isCurrentDay = isToday(day);
  const totalHours = Math.max(0.0001, dayEndHour - dayStartHour);
  const nowLeftPct = ((timeOfDay - dayStartHour) / totalHours) * 100;
  const nowVisible = isCurrentDay && nowLeftPct >= 0 && nowLeftPct <= 100;

  if (flatResources.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-[var(--trc-muted-foreground)]">
        {labels.timeline}: no resources configured
      </div>
    );
  }

  const slotClickHandler = onSlotClick
    ? () => onSlotClick(`${day}T${slotClickTime}`)
    : undefined;

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
      {/* Top-left corner */}
      <div
        className={cn(
          "sticky top-0 left-0 z-30 border-r border-b border-[var(--trc-border)]",
          "bg-[var(--trc-background)]",
        )}
      />

      {/* Hour header */}
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

      {/* Resource rows */}
      {flatResources.map((resource) => (
        <ResourceRow
          key={resource.id}
          resource={resource}
          positioned={positionedByResource.get(resource.id) ?? []}
          hourCount={hourLabels.length}
          locale={locale}
          displayTimeZone={displayTimeZone}
          isSelected={selectionCtx.isSelected}
          onEventClick={onEventClick ? (event) => onEventClick(event) : undefined}
          onSlotClick={slotClickHandler}
          customHeader={slots.resourceHeader ? (r) => {
            const Slot = slots.resourceHeader!;
            return <Slot resource={r} />;
          } : undefined}
        />
      ))}

      {/* Now-line — overlay across the whole right column */}
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
