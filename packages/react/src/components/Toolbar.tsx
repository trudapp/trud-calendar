import { useNavigation } from "../hooks/useNavigation";
import { useCalendarSlots } from "../context/SlotsContext";
import { cn } from "../lib/cn";
import { VIEWS, type CalendarView } from "trud-calendar-core";

const viewLabels: Record<CalendarView, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
  agenda: "Agenda",
};

export function Toolbar() {
  const nav = useNavigation();
  const slots = useCalendarSlots();

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

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2",
        "border-b border-[var(--trc-border)]",
      )}
      role="toolbar"
      aria-label="Calendar navigation"
    >
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={nav.today}
          className={cn(
            "rounded-[var(--trc-radius)] border border-[var(--trc-border)]",
            "px-3 py-1.5 text-sm font-medium",
            "text-[var(--trc-foreground)] bg-[var(--trc-background)]",
            "hover:bg-[var(--trc-accent)]",
            "transition-colors",
          )}
          aria-label="Go to today"
        >
          Today
        </button>
        <button
          onClick={nav.prev}
          className={cn(
            "rounded-[var(--trc-radius)] p-1.5",
            "text-[var(--trc-foreground)]",
            "hover:bg-[var(--trc-accent)]",
            "transition-colors",
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
          className={cn(
            "rounded-[var(--trc-radius)] p-1.5",
            "text-[var(--trc-foreground)]",
            "hover:bg-[var(--trc-accent)]",
            "transition-colors",
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
        <h2 className="text-lg font-semibold text-[var(--trc-foreground)] ml-2">
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
            onClick={() => nav.setView(v)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors",
              nav.view === v
                ? "bg-[var(--trc-primary)] text-[var(--trc-primary-foreground)]"
                : "text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)]",
            )}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>
    </div>
  );
}
