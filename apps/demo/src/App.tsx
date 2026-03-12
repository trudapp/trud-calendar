import { useState, useMemo } from "react";
import { Calendar } from "trud-calendar";
import type { CalendarView, CalendarEvent } from "trud-calendar-core";
import { generateSampleEvents } from "./sample-events";

export function App() {
  const events = useMemo(() => generateSampleEvents(), []);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[var(--trc-background)] text-[var(--trc-foreground)] p-4 sm:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--trc-foreground)]">
                trud-calendar
              </h1>
              <p className="text-sm text-[var(--trc-muted-foreground)]">
                A beautiful, fully-featured React calendar. MIT licensed.
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-[var(--trc-radius)] border border-[var(--trc-border)] px-3 py-1.5 text-sm hover:bg-[var(--trc-accent)] transition-colors"
            >
              {darkMode ? "Light" : "Dark"} Mode
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
          <Calendar
            events={events}
            defaultView="month"
            onEventClick={(event) => {
              console.log("Event clicked:", event);
            }}
            onSlotClick={(date) => {
              console.log("Slot clicked:", date);
            }}
          />
        </div>
      </div>
    </div>
  );
}
