import { useCallback } from "react";
import { useNavigation } from "../hooks/useNavigation";
import { useCalendarContext } from "../context/CalendarContext";
import { useCalendarSlots } from "../context/SlotsContext";
import { cn } from "../lib/cn";
import { VIEWS, type CalendarView } from "trud-calendar-core";

export function Toolbar() {
  const nav = useNavigation();
  const { labels, validRange, visibleRange, customButtons } = useCalendarContext();
  const slots = useCalendarSlots();

  const canGoPrev = !validRange?.start || visibleRange.start > validRange.start;
  const canGoNext = !validRange?.end || visibleRange.end < validRange.end;

  const handleViewKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIdx = VIEWS.indexOf(nav.view);
      let newIdx = currentIdx;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          newIdx = Math.max(0, currentIdx - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          newIdx = Math.min(VIEWS.length - 1, currentIdx + 1);
          break;
        case "Home":
          e.preventDefault();
          newIdx = 0;
          break;
        case "End":
          e.preventDefault();
          newIdx = VIEWS.length - 1;
          break;
        default:
          return;
      }

      if (newIdx !== currentIdx) {
        nav.setView(VIEWS[newIdx]);
        // Focus the new tab
        const tablist = e.currentTarget.closest("[role='tablist']");
        if (tablist) {
          const tabs = tablist.querySelectorAll<HTMLElement>("[role='tab']");
          tabs[newIdx]?.focus();
        }
      }
    },
    [nav],
  );

  if (slots.toolbar) {
    const SlotToolbar = slots.toolbar;
    return (
      <SlotToolbar
        currentDate={nav.currentDate}
        view={nav.view}
        onPrev={nav.prev}
        onNext={nav.next}
        onToday={nav.today}
        onViewChange={nav.setView}
        formattedDate={nav.formattedDate}
      />
    );
  }

  const viewLabels: Record<CalendarView, string> = {
    month: labels.month,
    week: labels.week,
    day: labels.day,
    agenda: labels.agenda,
    year: labels.year,
  };

  return (
    <div
      className={cn(
        "flex flex-col @[640px]:flex-row items-center justify-between px-2 @[640px]:px-4 py-1.5 @[640px]:py-2 gap-1.5 @[640px]:gap-0",
        "border-b border-[var(--trc-border)]",
      )}
      role="toolbar"
      aria-label="Calendar navigation"
    >
      {/* Left: Navigation */}
      <div className="flex items-center gap-1 @[640px]:gap-2">
        <button
          onClick={nav.today}
          className={cn(
            "rounded-[var(--trc-radius)] border border-[var(--trc-border)]",
            "px-2 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm font-medium",
            "text-[var(--trc-foreground)] bg-[var(--trc-background)]",
            "hover:bg-[var(--trc-accent)]",
            "transition-colors",
          )}
          aria-label={labels.today}
        >
          {labels.today}
        </button>
        <button
          onClick={nav.prev}
          disabled={!canGoPrev}
          className={cn(
            "rounded-[var(--trc-radius)] p-1 @[640px]:p-1.5",
            "text-[var(--trc-foreground)]",
            "hover:bg-[var(--trc-accent)]",
            "transition-colors",
            !canGoPrev && "opacity-30 cursor-not-allowed",
          )}
          aria-label="Previous"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          onClick={nav.next}
          disabled={!canGoNext}
          className={cn(
            "rounded-[var(--trc-radius)] p-1 @[640px]:p-1.5",
            "text-[var(--trc-foreground)]",
            "hover:bg-[var(--trc-accent)]",
            "transition-colors",
            !canGoNext && "opacity-30 cursor-not-allowed",
          )}
          aria-label="Next"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
        <h2 className="text-sm @[640px]:text-base @[1024px]:text-lg font-semibold text-[var(--trc-foreground)] ml-1 @[640px]:ml-2">
          {nav.formattedDate}
        </h2>
      </div>

      {/* Right: View Switcher */}
      <div
        className={cn(
          "flex rounded-[var(--trc-radius)] border border-[var(--trc-border)]",
          "overflow-hidden",
        )}
        role="tablist"
        aria-label="Calendar view"
      >
        {VIEWS.map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={nav.view === v}
            tabIndex={nav.view === v ? 0 : -1}
            onClick={() => nav.setView(v)}
            onKeyDown={handleViewKeyDown}
            className={cn(
              "px-2 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm font-medium transition-colors",
              nav.view === v
                ? "bg-[var(--trc-primary)] text-[var(--trc-primary-foreground)]"
                : "text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)]",
            )}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>

      {/* Custom buttons */}
      {customButtons.length > 0 && (
        <div className="flex items-center gap-1">
          {customButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={btn.onClick}
              className={cn(
                "rounded-[var(--trc-radius)] border border-[var(--trc-border)]",
                "px-2 @[640px]:px-3 py-1 @[640px]:py-1.5 text-xs @[640px]:text-sm font-medium",
                "text-[var(--trc-foreground)] bg-[var(--trc-background)]",
                "hover:bg-[var(--trc-accent)]",
                "transition-colors",
                btn.className,
              )}
            >
              {btn.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
