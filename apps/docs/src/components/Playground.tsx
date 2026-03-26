import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Calendar } from "trud-calendar";
import type { CalendarEvent, DateTimeString, Resource, CustomButton } from "trud-calendar-core";
import { expandRecurringEvents, downloadICal, toDateString } from "trud-calendar-core";
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

const DEMO_RESOURCES: Resource[] = [
  { id: "room-a", title: "Room A", color: "#3b82f6" },
  { id: "room-b", title: "Room B", color: "#22c55e" },
  { id: "room-c", title: "Room C", color: "#f59e0b" },
];

function generateBackgroundEvents(): CalendarEvent[] {
  const now = new Date();
  const days: CalendarEvent[] = [];
  for (let i = -7; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const dateStr = toDateString(d);
    days.push({
      id: `bg-${dateStr}`,
      title: "Business Hours",
      start: `${dateStr}T09:00:00`,
      end: `${dateStr}T17:00:00`,
      display: "background",
      color: "#22c55e",
    });
  }
  return days;
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

function isoToDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function isoToTimeInput(iso: string): string {
  return iso.slice(11, 16);
}

function buildISO(date: string, time: string): string {
  return `${date}T${time}:00`;
}

function CreateEventDialog({
  start,
  end,
  onSave,
  onCancel,
}: {
  start: string;
  end: string;
  onSave: (title: string, color: string, start: string, end: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(EVENT_COLORS[0].value);
  const [startDate, setStartDate] = useState(isoToDateInput(start));
  const [startTime, setStartTime] = useState(isoToTimeInput(start));
  const [endDate, setEndDate] = useState(isoToDateInput(end));
  const [endTime, setEndTime] = useState(isoToTimeInput(end));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) onSave(title.trim(), color, buildISO(startDate, startTime), buildISO(endDate, endTime));
  };

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px", borderRadius: "6px",
    border: "1px solid var(--trc-border)", background: "var(--trc-background)",
    color: "var(--trc-foreground)", fontSize: "0.8rem", outline: "none",
    boxSizing: "border-box",
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
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--trc-muted-foreground)", display: "block", marginBottom: "6px" }}>Title</label>
            <input ref={inputRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title"
              style={{ ...inputStyle, width: "100%", padding: "8px 12px", borderRadius: "8px", fontSize: "0.85rem" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--trc-primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--trc-border)")}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--trc-muted-foreground)" }}>Start</label>
            <div style={{ display: "flex", gap: "6px" }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} step="900" style={{ ...inputStyle, width: "110px" }} />
            </div>
            <label style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--trc-muted-foreground)" }}>End</label>
            <div style={{ display: "flex", gap: "6px" }}>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} step="900" style={{ ...inputStyle, width: "110px" }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--trc-muted-foreground)", display: "block", marginBottom: "8px" }}>Color</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {EVENT_COLORS.map((c) => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)} title={c.label}
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
        <div style={{ padding: "10px 18px 14px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
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

// ── Pill button ─────────────────────────────────────────────────────────

function PillGroup({ options, active, onChange }: { options: { value: string; label: string }[]; active: string; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-[var(--trc-radius)] border border-[var(--trc-border)] overflow-hidden">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-2 py-1 text-[10px] font-medium transition-colors ${
            active === o.value
              ? "bg-[var(--trc-primary)] text-[var(--trc-primary-foreground)]"
              : "text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)]"
          }`}
        >
          {o.label}
        </button>
      ))}
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

  // New feature toggles
  const [snapDuration, setSnapDuration] = useState(15);
  const [hiddenDays, setHiddenDays] = useState<number[]>([]);
  const [showWeekNumbers, setShowWeekNumbers] = useState(false);
  const [enableResources, setEnableResources] = useState(false);
  const [enableBgEvents, setEnableBgEvents] = useState(false);
  const [enableConstraints, setEnableConstraints] = useState(false);
  const [flexibleLimits, setFlexibleLimits] = useState(false);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    return () => { document.documentElement.classList.remove("dark"); };
  }, [darkMode]);

  const bgEvents = useMemo(() => enableBgEvents ? generateBackgroundEvents() : [], [enableBgEvents]);

  const events = useMemo(() => {
    const now = new Date();
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const toDate = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    const expanded = expandRecurringEvents(baseEvents, toDate(rangeStart), toDate(rangeEnd));
    const withResources = enableResources
      ? expanded.map((e, i) => ({ ...e, resourceId: e.resourceId || DEMO_RESOURCES[i % DEMO_RESOURCES.length].id }))
      : expanded;
    return [...withResources, ...bgEvents];
  }, [baseEvents, enableResources, bgEvents]);

  const businessHoursConstraint = useCallback(
    (_event: CalendarEvent, newStart: DateTimeString) => {
      const hour = new Date(newStart).getHours();
      return hour >= 9 && hour < 17;
    },
    [],
  );

  const customButtons: CustomButton[] = useMemo(() => [
    { key: "ical", text: ".ics", onClick: () => downloadICal(baseEvents, "playground.ics") },
  ], [baseEvents]);

  const highlightedDates = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      return toDateString(d);
    });
  }, []);

  const handleEventDrop = useCallback(
    (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString, extra?: { resourceId?: string }) => {
      setBaseEvents((prev) => {
        if (event.recurringEventId) {
          const parentId = event.recurringEventId;
          const exDate = event.originalDate;
          if (!parentId || !exDate) return prev;
          const next = prev.map((e) =>
            e.id === parentId ? { ...e, exDates: [...(e.exDates ?? []), exDate] } : e,
          );
          const standalone: CalendarEvent = {
            ...event, id: `${parentId}::moved::${exDate}`,
            start: newStart, end: newEnd,
            recurringEventId: undefined, originalDate: undefined, recurrence: undefined, exDates: undefined,
          };
          if (extra?.resourceId) standalone.resourceId = extra.resourceId;
          return [...next, standalone];
        }
        return prev.map((e) => {
          if (e.id !== event.id) return e;
          const updated = { ...e, start: newStart, end: newEnd };
          if (extra?.resourceId) updated.resourceId = extra.resourceId;
          return updated;
        });
      });
    },
    [],
  );

  const handleEventResize = useCallback(
    (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => {
      setBaseEvents((prev) => {
        if (event.recurringEventId) {
          const parentId = event.recurringEventId;
          const exDate = event.originalDate;
          if (!parentId || !exDate) return prev;
          const next = prev.map((e) =>
            e.id === parentId ? { ...e, exDates: [...(e.exDates ?? []), exDate] } : e,
          );
          return [...next, {
            ...event, id: `${parentId}::resized::${exDate}`,
            start: newStart, end: newEnd,
            recurringEventId: undefined, originalDate: undefined, recurrence: undefined, exDates: undefined,
          }];
        }
        return prev.map((e) => (e.id === event.id ? { ...e, start: newStart, end: newEnd } : e));
      });
    },
    [],
  );

  const handleSlotSelect = useCallback((start: DateTimeString, end: DateTimeString) => {
    setCreateDialog({ start, end });
  }, []);

  const handleSlotClick = useCallback((dateTime: DateTimeString) => {
    const startDate = new Date(dateTime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    setCreateDialog({ start: dateTime, end: toLocalISO(endDate) });
  }, []);

  const handleCreateEvent = useCallback((title: string, color: string, start: string, end: string) => {
    const id = String(nextId);
    setNextId((n) => n + 1);
    setBaseEvents((prev) => [...prev, { id, title, start, end, color }]);
    setCreateDialog(null);
  }, [nextId]);

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
      today: "Hoy", month: "Mes", week: "Semana", day: "Dia", agenda: "Agenda", year: "Ano",
      allDay: "Todo el dia", noEvents: "No hay eventos", more: (n: number) => `+${n} mas`,
    },
  };

  return (
    <>
      <div className={`${darkMode ? "dark" : ""} flex flex-col h-full`}>
        {/* Controls bar — wraps on smaller screens */}
        <div className="flex items-center justify-center gap-2 px-3 py-2 border-b border-[var(--trc-border)] bg-[var(--trc-background)] flex-shrink-0 flex-wrap">
          {/* Dark mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-[var(--trc-radius)] border border-[var(--trc-border)] px-2 py-1 text-[10px] text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)] transition-colors flex items-center gap-1"
          >
            {darkMode ? "Light" : "Dark"}
          </button>

          <PillGroup options={locales} active={locale} onChange={setLocale} />

          <PillGroup
            options={[{ value: "0", label: "Sun" }, { value: "1", label: "Mon" }]}
            active={String(weekStartsOn)}
            onChange={(v) => setWeekStartsOn(Number(v) as 0 | 1)}
          />

          <div className="w-px h-4 bg-[var(--trc-border)]" />

          <PillGroup
            options={[{ value: "default", label: "Default" }, { value: "custom", label: "Custom Slots" }]}
            active={tab}
            onChange={(v) => setTab(v as "default" | "custom")}
          />

          <PillGroup
            options={[{ value: "15", label: "15m" }, { value: "30", label: "30m" }, { value: "60", label: "1h" }]}
            active={String(snapDuration)}
            onChange={(v) => setSnapDuration(Number(v))}
          />

          <div className="w-px h-4 bg-[var(--trc-border)]" />

          {/* Toggle buttons */}
          {[
            { label: "Wk#", active: showWeekNumbers, toggle: () => setShowWeekNumbers((v) => !v) },
            { label: "Hide Wknd", active: hiddenDays.length > 0, toggle: () => setHiddenDays((v) => v.length > 0 ? [] : [0, 6]) },
            { label: "Resources", active: enableResources, toggle: () => setEnableResources((v) => !v) },
            { label: "Bg Events", active: enableBgEvents, toggle: () => setEnableBgEvents((v) => !v) },
            { label: "9-5 Only", active: enableConstraints, toggle: () => setEnableConstraints((v) => !v) },
            { label: "Flex Hours", active: flexibleLimits, toggle: () => setFlexibleLimits((v) => !v) },
          ].map((t) => (
            <button
              key={t.label}
              onClick={t.toggle}
              className={`rounded-[var(--trc-radius)] border px-2 py-1 text-[10px] font-medium transition-colors ${
                t.active
                  ? "bg-[var(--trc-primary)] text-[var(--trc-primary-foreground)] border-[var(--trc-primary)]"
                  : "border-[var(--trc-border)] text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Calendar */}
        <div className="flex-1 min-h-0">
          <Calendar
            key={`${tab}-${enableResources}`}
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
            onSlotClick={handleSlotClick}
            onSlotSelect={handleSlotSelect}
            slots={tab === "custom" ? playgroundSlots : undefined}
            snapDuration={snapDuration}
            hiddenDays={hiddenDays}
            showWeekNumbers={showWeekNumbers}
            highlightedDates={highlightedDates}
            flexibleSlotTimeLimits={flexibleLimits}
            resources={enableResources ? DEMO_RESOURCES : undefined}
            dragConstraint={enableConstraints ? businessHoursConstraint : undefined}
            resizeConstraint={enableConstraints ? businessHoursConstraint : undefined}
            customButtons={customButtons}
            dayStartHour={8}
            dayEndHour={20}
          />
        </div>
      </div>

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
