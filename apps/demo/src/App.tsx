import { useState, useCallback } from "react";
import { Calendar } from "trud-calendar";
import type { CalendarEvent, CalendarLabels, DateTimeString } from "trud-calendar-core";
import { useEvents } from "./use-events";
import { EventModal } from "./EventModal";
import { Sidebar } from "./Sidebar";
import { customSlots } from "./custom-slots";

// ── Translated labels per locale ────────────────────────────────────────
const LOCALE_LABELS: Record<string, Partial<CalendarLabels>> = {
  "en-US": {},
  "es-ES": {
    today: "Hoy",
    month: "Mes",
    week: "Semana",
    day: "Dia",
    agenda: "Agenda",
    allDay: "todo el dia",
    noEvents: "No hay eventos en este periodo",
    more: (n: number) => `+${n} mas`,
  },
  "fr-FR": {
    today: "Aujourd'hui",
    month: "Mois",
    week: "Semaine",
    day: "Jour",
    agenda: "Agenda",
    allDay: "toute la journee",
    noEvents: "Aucun evenement pour cette periode",
    more: (n: number) => `+${n} de plus`,
  },
  "de-DE": {
    today: "Heute",
    month: "Monat",
    week: "Woche",
    day: "Tag",
    agenda: "Agenda",
    allDay: "ganztaegig",
    noEvents: "Keine Termine in diesem Zeitraum",
    more: (n: number) => `+${n} weitere`,
  },
  "pt-BR": {
    today: "Hoje",
    month: "Mes",
    week: "Semana",
    day: "Dia",
    agenda: "Agenda",
    allDay: "dia inteiro",
    noEvents: "Nenhum evento neste periodo",
    more: (n: number) => `+${n} mais`,
  },
  "ja-JP": {
    today: "今日",
    month: "月",
    week: "週",
    day: "日",
    agenda: "予定表",
    allDay: "終日",
    noEvents: "この期間にイベントはありません",
    more: (n: number) => `他${n}件`,
  },
};

// ── Persisted preferences ───────────────────────────────────────────────

function loadPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function savePref(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── App ─────────────────────────────────────────────────────────────────

export function App() {
  const { events, upsertEvent, deleteEvent, moveEvent } = useEvents();

  // UI state
  const [darkMode, setDarkMode] = useState(() => loadPref("trc-dark", false));
  const [locale, setLocale] = useState(() => loadPref("trc-locale", "en-US"));
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(() => loadPref("trc-weekStart", 0));
  const [enableDnD, setEnableDnD] = useState(() => loadPref("trc-dnd", true));
  const [enableSlots, setEnableSlots] = useState(() => loadPref("trc-slots", false));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultStart, setDefaultStart] = useState<string | undefined>();

  // ── Handlers ────────────────────────────────────────────────────────

  const toggleDark = useCallback(() => {
    setDarkMode((v: boolean) => {
      savePref("trc-dark", !v);
      return !v;
    });
  }, []);

  const changeLocale = useCallback((v: string) => {
    setLocale(v);
    savePref("trc-locale", v);
  }, []);

  const changeWeekStart = useCallback((v: 0 | 1) => {
    setWeekStartsOn(v);
    savePref("trc-weekStart", v);
  }, []);

  const toggleDnD = useCallback(() => {
    setEnableDnD((v: boolean) => {
      savePref("trc-dnd", !v);
      return !v;
    });
  }, []);

  const toggleSlots = useCallback(() => {
    setEnableSlots((v: boolean) => {
      savePref("trc-slots", !v);
      return !v;
    });
  }, []);

  const handleSlotClick = useCallback((date: DateTimeString) => {
    setEditingEvent(null);
    setDefaultStart(date);
    setModalOpen(true);
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setDefaultStart(undefined);
    setModalOpen(true);
  }, []);

  const handleEventDrop = useCallback(
    (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => {
      moveEvent(event, newStart, newEnd);
    },
    [moveEvent],
  );

  const handleModalSave = useCallback(
    (event: CalendarEvent) => {
      upsertEvent(event);
      setModalOpen(false);
      setEditingEvent(null);
    },
    [upsertEvent],
  );

  const handleModalDelete = useCallback(
    (id: string) => {
      deleteEvent(id);
      setModalOpen(false);
      setEditingEvent(null);
    },
    [deleteEvent],
  );

  const handleNewEvent = useCallback(() => {
    setEditingEvent(null);
    setDefaultStart(undefined);
    setModalOpen(true);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="demo-shell">
        {/* Header */}
        <header className="demo-header">
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-[var(--trc-foreground)] hover:text-[var(--trc-muted-foreground)] transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[var(--trc-radius)] bg-[var(--trc-primary)] flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--trc-primary-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-[var(--trc-foreground)] leading-tight">
                  trud-calendar
                </h1>
                <p className="text-[11px] text-[var(--trc-muted-foreground)] leading-tight hidden sm:block">
                  A beautiful, fully-featured React calendar
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode (desktop shortcut) */}
            <button
              onClick={toggleDark}
              className="hidden sm:flex items-center gap-1.5 rounded-[var(--trc-radius)] border border-[var(--trc-border)] px-2.5 py-1.5 text-xs text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)] transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              {darkMode ? "Light" : "Dark"}
            </button>

            {/* GitHub */}
            <a
              href="https://github.com/trudcalendar/trud-calendar"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-[var(--trc-radius)] border border-[var(--trc-border)] px-2.5 py-1.5 text-xs text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)] transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </header>

        {/* Body */}
        <div className="demo-body">
          {/* Sidebar */}
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            darkMode={darkMode}
            onToggleDarkMode={toggleDark}
            locale={locale}
            onLocaleChange={changeLocale}
            weekStartsOn={weekStartsOn}
            onWeekStartChange={changeWeekStart}
            enableDnD={enableDnD}
            onToggleDnD={toggleDnD}
            enableSlots={enableSlots}
            onToggleSlots={toggleSlots}
            onNewEvent={handleNewEvent}
          />

          {/* Calendar */}
          <main className="demo-main">
            <Calendar
              events={events}
              defaultView="month"
              locale={{ locale, weekStartsOn, labels: LOCALE_LABELS[locale] }}
              enableDnD={enableDnD}
              slots={enableSlots ? customSlots : undefined}
              onEventClick={enableSlots ? undefined : handleEventClick}
              onSlotClick={handleSlotClick}
              onEventDrop={handleEventDrop}
            />
          </main>
        </div>

        {/* Event Modal */}
        {modalOpen && (
          <EventModal
            event={editingEvent}
            defaultStart={defaultStart}
            onSave={handleModalSave}
            onDelete={handleModalDelete}
            onClose={() => {
              setModalOpen(false);
              setEditingEvent(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
