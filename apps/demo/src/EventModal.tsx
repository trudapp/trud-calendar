import { useEffect, useRef, useState } from "react";
import type { CalendarEvent, RecurrenceRule, RecurrenceDay } from "trud-calendar-core";

const PRESET_COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ef4444", label: "Red" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#10b981", label: "Green" },
  { value: "#ec4899", label: "Pink" },
  { value: "#f97316", label: "Orange" },
  { value: "#6366f1", label: "Indigo" },
];

type RecurrencePreset = "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";

const WEEKDAYS: { value: RecurrenceDay; label: string }[] = [
  { value: "MO", label: "Mon" },
  { value: "TU", label: "Tue" },
  { value: "WE", label: "Wed" },
  { value: "TH", label: "Thu" },
  { value: "FR", label: "Fri" },
  { value: "SA", label: "Sat" },
  { value: "SU", label: "Sun" },
];

function recurrenceToPreset(r?: RecurrenceRule): RecurrencePreset {
  if (!r) return "none";
  if (r.freq === "daily" && !r.interval && !r.byDay?.length) return "daily";
  if (r.freq === "weekly" && !r.interval && !r.byDay?.length) return "weekly";
  if (r.freq === "monthly" && !r.interval) return "monthly";
  if (r.freq === "yearly" && !r.interval) return "yearly";
  return "custom";
}

export interface EventModalProps {
  /** If editing, the existing event. Null means creating a new one. */
  event: CalendarEvent | null;
  /** The pre-populated start time (ISO string) from a slot click */
  defaultStart?: string;
  /** The pre-populated end time (ISO string) from a slot selection */
  defaultEnd?: string;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function EventModal({
  event,
  defaultStart,
  defaultEnd: defaultEndProp,
  onSave,
  onDelete,
  onClose,
}: EventModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isEditing = event !== null;

  const initialStart = event?.start ?? defaultStart ?? new Date().toISOString().slice(0, 16);
  const startDate = initialStart.slice(0, 10);
  const startTime = initialStart.length > 10 ? initialStart.slice(11, 16) : "09:00";

  // Compute default end = start + 1h
  const defaultEnd = (() => {
    const d = new Date(`${startDate}T${startTime}:00`);
    d.setHours(d.getHours() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  })();

  const initialEnd = event?.end ?? defaultEndProp ?? `${defaultEnd.date}T${defaultEnd.time}:00`;
  const endDate = initialEnd.slice(0, 10);
  const endTime = initialEnd.length > 10 ? initialEnd.slice(11, 16) : defaultEnd.time;

  const [title, setTitle] = useState(event?.title ?? "");
  const [sDate, setSDate] = useState(startDate);
  const [sTime, setSTime] = useState(startTime);
  const [eDate, setEDate] = useState(endDate);
  const [eTime, setETime] = useState(endTime);
  const [color, setColor] = useState(event?.color ?? "#3b82f6");
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Recurrence state
  const [recurrencePreset, setRecurrencePreset] = useState<RecurrencePreset>(
    recurrenceToPreset(event?.recurrence),
  );
  const [recInterval, setRecInterval] = useState(event?.recurrence?.interval ?? 1);
  const [recByDay, setRecByDay] = useState<RecurrenceDay[]>(event?.recurrence?.byDay ?? []);
  const [recEndType, setRecEndType] = useState<"never" | "count" | "until">(
    event?.recurrence?.count ? "count" : event?.recurrence?.until ? "until" : "never",
  );
  const [recCount, setRecCount] = useState(event?.recurrence?.count ?? 10);
  const [recUntil, setRecUntil] = useState(event?.recurrence?.until ?? "");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const buildRecurrence = (): RecurrenceRule | undefined => {
    if (recurrencePreset === "none") return undefined;

    const rule: RecurrenceRule = {
      freq: recurrencePreset === "custom" ? "weekly" : recurrencePreset,
    };

    if (recurrencePreset === "custom") {
      if (recInterval > 1) rule.interval = recInterval;
      if (recByDay.length > 0) rule.byDay = recByDay;
    }

    if (recEndType === "count") rule.count = recCount;
    if (recEndType === "until" && recUntil) rule.until = recUntil;

    return rule;
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const startISO = allDay ? `${sDate}T00:00:00` : `${sDate}T${sTime}:00`;
    const endISO = allDay ? `${eDate}T23:59:00` : `${eDate}T${eTime}:00`;
    const recurrence = buildRecurrence();

    const saved: CalendarEvent = {
      id: event?.id ?? crypto.randomUUID(),
      title: title.trim(),
      start: startISO,
      end: endISO,
      color,
      allDay,
    };
    if (recurrence) saved.recurrence = recurrence;

    onSave(saved);
  };

  const handleDelete = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    if (event && onDelete) {
      onDelete(event.id);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const toggleDay = (day: RecurrenceDay) => {
    setRecByDay((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClick={handleBackdropClick}
      className="event-modal-dialog"
    >
      <div className="event-modal-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[var(--trc-foreground)]">
            {isEditing ? "Edit Event" : "New Event"}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--trc-muted-foreground)] hover:text-[var(--trc-foreground)] transition-colors text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--trc-foreground)] mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            autoFocus
            className="modal-input"
          />
        </div>

        {/* All day toggle */}
        <div className="mb-4 flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-[var(--trc-muted)] rounded-full peer peer-checked:bg-[var(--trc-primary)] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
          <span className="text-sm text-[var(--trc-foreground)]">All day</span>
        </div>

        {/* Date / Time fields */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--trc-foreground)] mb-1">
              Start date
            </label>
            <input
              type="date"
              value={sDate}
              onChange={(e) => setSDate(e.target.value)}
              className="modal-input"
            />
          </div>
          {!allDay && (
            <div>
              <label className="block text-sm font-medium text-[var(--trc-foreground)] mb-1">
                Start time
              </label>
              <input
                type="time"
                value={sTime}
                onChange={(e) => setSTime(e.target.value)}
                className="modal-input"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--trc-foreground)] mb-1">
              End date
            </label>
            <input
              type="date"
              value={eDate}
              onChange={(e) => setEDate(e.target.value)}
              className="modal-input"
            />
          </div>
          {!allDay && (
            <div>
              <label className="block text-sm font-medium text-[var(--trc-foreground)] mb-1">
                End time
              </label>
              <input
                type="time"
                value={eTime}
                onChange={(e) => setETime(e.target.value)}
                className="modal-input"
              />
            </div>
          )}
        </div>

        {/* Recurrence */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--trc-foreground)] mb-1">
            Repeat
          </label>
          <select
            value={recurrencePreset}
            onChange={(e) => setRecurrencePreset(e.target.value as RecurrencePreset)}
            className="modal-input"
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Every day</option>
            <option value="weekly">Every week</option>
            <option value="monthly">Every month</option>
            <option value="yearly">Every year</option>
            <option value="custom">Custom...</option>
          </select>
        </div>

        {/* Custom recurrence options */}
        {recurrencePreset === "custom" && (
          <div className="mb-4 p-3 rounded-[var(--trc-radius)] border border-[var(--trc-border)] bg-[var(--trc-muted)]/30 space-y-3">
            {/* Interval */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--trc-foreground)]">Every</span>
              <input
                type="number"
                min={1}
                max={99}
                value={recInterval}
                onChange={(e) => setRecInterval(Math.max(1, parseInt(e.target.value) || 1))}
                className="modal-input w-16 text-center"
              />
              <span className="text-sm text-[var(--trc-foreground)]">week(s)</span>
            </div>

            {/* Days of week */}
            <div>
              <span className="text-sm text-[var(--trc-foreground)] block mb-1.5">On days</span>
              <div className="flex gap-1">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`w-9 h-8 text-xs rounded-[var(--trc-radius)] border transition-colors ${
                      recByDay.includes(d.value)
                        ? "bg-[var(--trc-primary)] text-[var(--trc-primary-foreground)] border-[var(--trc-primary)]"
                        : "border-[var(--trc-border)] text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recurrence end */}
        {recurrencePreset !== "none" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--trc-foreground)] mb-1">
              Ends
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-[var(--trc-foreground)] cursor-pointer">
                <input
                  type="radio"
                  name="recEnd"
                  checked={recEndType === "never"}
                  onChange={() => setRecEndType("never")}
                  className="accent-[var(--trc-primary)]"
                />
                Never
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--trc-foreground)] cursor-pointer">
                <input
                  type="radio"
                  name="recEnd"
                  checked={recEndType === "count"}
                  onChange={() => setRecEndType("count")}
                  className="accent-[var(--trc-primary)]"
                />
                After
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={recCount}
                  onChange={(e) => setRecCount(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={recEndType !== "count"}
                  className="modal-input w-16 text-center disabled:opacity-40"
                />
                occurrences
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--trc-foreground)] cursor-pointer">
                <input
                  type="radio"
                  name="recEnd"
                  checked={recEndType === "until"}
                  onChange={() => setRecEndType("until")}
                  className="accent-[var(--trc-primary)]"
                />
                On date
                <input
                  type="date"
                  value={recUntil}
                  onChange={(e) => setRecUntil(e.target.value)}
                  disabled={recEndType !== "until"}
                  className="modal-input disabled:opacity-40"
                />
              </label>
            </div>
          </div>
        )}

        {/* Color picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--trc-foreground)] mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                title={c.label}
                className="w-7 h-7 rounded-full transition-all flex items-center justify-center"
                style={{
                  backgroundColor: c.value,
                  outline: color === c.value ? `2px solid ${c.value}` : "none",
                  outlineOffset: "2px",
                }}
              >
                {color === c.value && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isEditing && onDelete && (
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-sm rounded-[var(--trc-radius)] bg-[var(--trc-destructive)] text-white hover:opacity-90 transition-opacity"
            >
              {showDeleteConfirm ? "Confirm Delete" : "Delete"}
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-[var(--trc-radius)] border border-[var(--trc-border)] text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm rounded-[var(--trc-radius)] bg-[var(--trc-primary)] text-[var(--trc-primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
