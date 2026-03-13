import { useState, useCallback, useMemo } from "react";
import { Calendar } from "trud-calendar";
import type { CalendarEvent, DateTimeString } from "trud-calendar-core";
import { expandRecurringEvents } from "trud-calendar-core";

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

// ── Playground ──────────────────────────────────────────────────────────

export default function Playground() {
  const [baseEvents, setBaseEvents] = useState(makeSampleEvents);
  const [darkMode, setDarkMode] = useState(false);
  const [locale, setLocale] = useState("en-US");
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(0);

  // Expand recurring events
  const events = useMemo(() => {
    const now = new Date();
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const toDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

  const localeLabels: Record<string, Record<string, string | ((n: number) => string)>> = {
    "es-ES": {
      today: "Hoy", month: "Mes", week: "Semana", day: "Dia", agenda: "Agenda",
      allDay: "todo el dia", noEvents: "No hay eventos", more: (n: number) => `+${n} mas`,
    },
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div style={{
        background: "var(--trc-background, #fff)",
        borderRadius: "0.75rem",
        border: "1px solid var(--trc-border, #e5e5e5)",
        overflow: "hidden",
      }}>
        {/* Controls bar */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--trc-border, #e5e5e5)",
          background: "var(--trc-muted, #f5f5f5)",
          fontSize: "0.8rem",
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--trc-foreground, #0a0a0a)" }}>
            <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
            Dark mode
          </label>

          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "0.375rem",
              border: "1px solid var(--trc-border, #e5e5e5)",
              fontSize: "0.8rem",
              background: "var(--trc-background, #fff)",
              color: "var(--trc-foreground, #0a0a0a)",
            }}
          >
            <option value="en-US">English</option>
            <option value="es-ES">Espanol</option>
            <option value="fr-FR">Francais</option>
            <option value="de-DE">Deutsch</option>
            <option value="ja-JP">Japanese</option>
            <option value="pt-BR">Portugues</option>
          </select>

          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--trc-foreground, #0a0a0a)" }}>
            <input
              type="checkbox"
              checked={weekStartsOn === 1}
              onChange={() => setWeekStartsOn(weekStartsOn === 0 ? 1 : 0)}
            />
            Week starts Monday
          </label>
        </div>

        {/* Calendar */}
        <div style={{ height: "70vh", minHeight: "500px" }}>
          <Calendar
            events={events}
            defaultView="week"
            enableDnD
            locale={{
              locale,
              weekStartsOn,
              labels: localeLabels[locale] as any,
            }}
            onEventClick={(event) => alert(`Clicked: ${event.title}`)}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            onSlotSelect={(start, end) => alert(`Create event: ${start} → ${end}`)}
          />
        </div>
      </div>
    </div>
  );
}
