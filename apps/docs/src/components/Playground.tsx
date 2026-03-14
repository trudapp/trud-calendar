import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Calendar } from "trud-calendar";
import type { CalendarEvent, DateTimeString } from "trud-calendar-core";
import { expandRecurringEvents } from "trud-calendar-core";
import { playgroundSlots } from "./PlaygroundSlots";

// ── Sample events ───────────────────────────────────────────────────────

const COLORS = {
  blue: "#3b82f6",
  purple: "#8b5cf6",
  red: "#ef4444",
  amber: "#f59e0b",
  green: "#10b981",
  pink: "#ec4899",
  orange: "#f97316",
  indigo: "#6366f1",
};

function toLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function makeSampleEvents(): CalendarEvent[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));

  const d = (offsetDays: number, hour: number, minute = 0): string => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + offsetDays);
    dt.setHours(hour, minute, 0, 0);
    return toLocalISO(dt);
  };

  const allDay = (offsetDays: number): string => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + offsetDays);
    return toLocalISO(dt).slice(0, 10) + "T00:00:00";
  };

  return [
    { id: "1", title: "Team Standup", start: d(0, 9, 0), end: d(0, 9, 30), color: COLORS.blue },
    { id: "2", title: "Product Review", start: d(0, 14, 0), end: d(0, 15, 30), color: COLORS.purple },
    { id: "3", title: "Gym", start: d(1, 7, 0), end: d(1, 8, 0), color: COLORS.green },
    { id: "4", title: "Lunch with Sarah", start: d(1, 12, 0), end: d(1, 13, 0), color: COLORS.amber },
    { id: "5", title: "Design Workshop", start: d(2, 10, 0), end: d(2, 12, 0), color: COLORS.pink },
    { id: "6", title: "1:1 with Manager", start: d(2, 15, 0), end: d(2, 15, 45), color: COLORS.red },
    { id: "7", title: "All-Hands", start: d(3, 11, 0), end: d(3, 12, 0), color: COLORS.indigo },
    { id: "8", title: "Sprint Planning", start: d(3, 14, 0), end: d(3, 16, 0), color: COLORS.blue },
    { id: "9", title: "Client Demo", start: d(4, 10, 0), end: d(4, 11, 30), color: COLORS.orange },
    { id: "10", title: "Conference", start: allDay(5), end: allDay(6), allDay: true, color: COLORS.indigo },
    { id: "11", title: "Product Conference", start: d(2, 10, 0), end: d(4, 16, 0), color: COLORS.purple },
    {
      id: "rec-1", title: "Daily Standup", start: d(0, 9, 0), end: d(0, 9, 15), color: COLORS.blue,
      recurrence: { freq: "daily" as const },
    },
    {
      id: "rec-2", title: "Gym Session", start: d(0, 7, 0), end: d(0, 8, 0), color: COLORS.green,
      recurrence: { freq: "weekly" as const, byDay: ["MO" as const, "WE" as const, "FR" as const] },
    },
  ];
}

// ── Color palette for create dialog ──────────────────────────────────────

const EVENT_COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ef4444", label: "Red" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#10b981", label: "Green" },
  { value: "#ec4899", label: "Pink" },
  { value: "#f97316", label: "Orange" },
  { value: "#6366f1", label: "Indigo" },
];

// ── Create Event Dialog ──────────────────────────────────────────────────

function CreateEventDialog({
  start,
  end,
  onSave,
  onCancel,
}: {
  start: string;
  end: string;
  onSave: (title: string, color: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(EVENT_COLORS[0].value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const formatDT = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) onSave(title.trim(), color);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%", maxWidth: "380px", borderRadius: "12px",
          background: "var(--trc-background)", border: "1px solid var(--trc-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden",
          animation: "pgDialogIn 0.15s ease-out",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "14px 18px", borderBottom: "1px solid var(--trc-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--trc-foreground)" }}>
            New Event
          </h3>
          <button type="button" onClick={onCancel} style={{
            border: "none", background: "transparent", color: "var(--trc-muted-foreground)",
            cursor: "pointer", padding: "4px", borderRadius: "4px", display: "flex",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--trc-muted-foreground)", display: "block", marginBottom: "6px" }}>
              Title
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              style={{
                width: "100%", padding: "8px 12px", borderRadius: "8px",
                border: "1px solid var(--trc-border)", background: "var(--trc-background)",
                color: "var(--trc-foreground)", fontSize: "0.85rem", outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--trc-primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--trc-border)")}
            />
          </div>

          {/* Time */}
          <div style={{
            padding: "10px 12px", borderRadius: "8px", background: "var(--trc-muted)",
            display: "flex", flexDirection: "column", gap: "2px",
          }}>
            <div style={{ fontSize: "0.8rem", color: "var(--trc-foreground)", fontWeight: 500 }}>
              {formatDT(start)}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--trc-muted-foreground)" }}>
              to {formatDT(end)}
            </div>
          </div>

          {/* Color */}
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--trc-muted-foreground)", display: "block", marginBottom: "8px" }}>
              Color
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    border: color === c.value ? "2px solid var(--trc-foreground)" : "2px solid transparent",
                    background: c.value, cursor: "pointer", padding: 0,
                    transition: "transform 0.1s, border-color 0.15s",
                    transform: color === c.value ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "10px 18px 14px", display: "flex", justifyContent: "flex-end", gap: "8px",
        }}>
          <button type="button" onClick={onCancel} style={{
            padding: "7px 16px", borderRadius: "8px",
            border: "1px solid var(--trc-border)", background: "transparent",
            color: "var(--trc-foreground)", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer",
          }}>Cancel</button>
          <button type="submit" disabled={!title.trim()} style={{
            padding: "7px 16px", borderRadius: "8px", border: "none",
            background: title.trim() ? "var(--trc-primary)" : "var(--trc-muted)",
            color: title.trim() ? "var(--trc-primary-foreground)" : "var(--trc-muted-foreground)",
            fontSize: "0.8rem", fontWeight: 600,
            cursor: title.trim() ? "pointer" : "default",
          }}>Create</button>
        </div>
      </form>
    </div>
  );
}

// ── Playground ──────────────────────────────────────────────────────────

export default function Playground() {
  const [baseEvents, setBaseEvents] = useState(makeSampleEvents);
  const [darkMode, setDarkMode] = useState(false);
  const [locale, setLocale] = useState("en-US");
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1);
  const [tab, setTab] = useState<"default" | "custom">("default");
  const [createDialog, setCreateDialog] = useState<{ start: string; end: string } | null>(null);
  const [nextId, setNextId] = useState(100);

  // Detect system preference
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(prefersDark);
  }, []);

  // Apply dark mode to entire page
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    return () => { document.documentElement.classList.remove("dark"); };
  }, [darkMode]);

  // Expand recurring events
  const events = useMemo(() => {
    const now = new Date();
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const toDate = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    return expandRecurringEvents(baseEvents, toDate(rangeStart), toDate(rangeEnd));
  }, [baseEvents]);

  const handleEventDrop = useCallback(
    (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => {
      setBaseEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, start: newStart, end: newEnd } : e))
      );
    },
    []
  );

  const handleEventResize = useCallback(
    (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => {
      setBaseEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, start: newStart, end: newEnd } : e))
      );
    },
    []
  );

  const handleSlotSelect = useCallback((start: DateTimeString, end: DateTimeString) => {
    setCreateDialog({ start, end });
  }, []);

  const handleCreateEvent = useCallback((title: string, color: string) => {
    if (!createDialog) return;
    const id = String(nextId);
    setNextId((n) => n + 1);
    setBaseEvents((prev) => [
      ...prev,
      { id, title, start: createDialog.start, end: createDialog.end, color },
    ]);
    setCreateDialog(null);
  }, [createDialog, nextId]);

  const locales = [
    { value: "en-US", label: "EN" },
    { value: "es-ES", label: "ES" },
    { value: "fr-FR", label: "FR" },
    { value: "de-DE", label: "DE" },
    { value: "ja-JP", label: "JA" },
    { value: "pt-BR", label: "PT" },
  ];

  const localeLabels: Record<string, Record<string, string | ((n: number) => string)>> = {
    "es-ES": {
      today: "Hoy", month: "Mes", week: "Semana", day: "Dia", agenda: "Agenda",
      allDay: "Todo el dia", noEvents: "No hay eventos", more: (n: number) => `+${n} mas`,
    },
  };

  return (
    <>
      <div className={`${darkMode ? "dark" : ""} flex flex-col h-full`}>
        {/* Controls bar */}
        <div className="flex items-center justify-center gap-3 px-4 py-2 border-b border-[var(--trc-border)] bg-[var(--trc-background)] flex-shrink-0 flex-wrap">
          {/* Dark mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-[var(--trc-radius)] border border-[var(--trc-border)] px-2.5 py-1.5 text-xs text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)] transition-colors flex items-center gap-1.5"
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

          {/* Locale pills */}
          <div className="flex rounded-[var(--trc-radius)] border border-[var(--trc-border)] overflow-hidden">
            {locales.map((l) => (
              <button
                key={l.value}
                onClick={() => setLocale(l.value)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  locale === l.value
                    ? "bg-[var(--trc-primary)] text-[var(--trc-primary-foreground)]"
                    : "text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)]"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Week start pills */}
          <div className="flex rounded-[var(--trc-radius)] border border-[var(--trc-border)] overflow-hidden">
            <button
              onClick={() => setWeekStartsOn(0)}
              className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                weekStartsOn === 0
                  ? "bg-[var(--trc-primary)] text-[var(--trc-primary-foreground)]"
                  : "text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)]"
              }`}
            >
              Sun
            </button>
            <button
              onClick={() => setWeekStartsOn(1)}
              className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                weekStartsOn === 1
                  ? "bg-[var(--trc-primary)] text-[var(--trc-primary-foreground)]"
                  : "text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)]"
              }`}
            >
              Mon
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-[var(--trc-border)]" />

          {/* Tab: Default | Custom Slots */}
          <div className="flex rounded-[var(--trc-radius)] border border-[var(--trc-border)] overflow-hidden">
            <button
              onClick={() => setTab("default")}
              className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                tab === "default"
                  ? "bg-[var(--trc-primary)] text-[var(--trc-primary-foreground)]"
                  : "text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)]"
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setTab("custom")}
              className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                tab === "custom"
                  ? "bg-[var(--trc-primary)] text-[var(--trc-primary-foreground)]"
                  : "text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)]"
              }`}
            >
              Custom Slots
            </button>
          </div>
        </div>

        {/* Calendar fills the rest */}
        <div className="flex-1 min-h-0">
          <Calendar
            key={tab}
            events={events}
            defaultView="week"
            enableDnD
            locale={{
              locale,
              weekStartsOn,
              labels: localeLabels[locale] as Record<string, string | ((n: number) => string)> | undefined,
            }}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            onSlotSelect={handleSlotSelect}
            slots={tab === "custom" ? playgroundSlots : undefined}
          />
        </div>
      </div>

      {/* Create Event Dialog */}
      {createDialog && (
        <CreateEventDialog
          start={createDialog.start}
          end={createDialog.end}
          onSave={handleCreateEvent}
          onCancel={() => setCreateDialog(null)}
        />
      )}
    </>
  );
}
