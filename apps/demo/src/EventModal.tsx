import { useEffect, useRef, useState } from "react";
import type { CalendarEvent } from "trud-calendar-core";

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

export interface EventModalProps {
  /** If editing, the existing event. Null means creating a new one. */
  event: CalendarEvent | null;
  /** The pre-populated start time (ISO string) from a slot click */
  defaultStart?: string;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function EventModal({
  event,
  defaultStart,
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

  const initialEnd = event?.end ?? `${defaultEnd.date}T${defaultEnd.time}:00`;
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const handleSave = () => {
    if (!title.trim()) return;
    const startISO = allDay ? `${sDate}T00:00:00` : `${sDate}T${sTime}:00`;
    const endISO = allDay ? `${eDate}T23:59:00` : `${eDate}T${eTime}:00`;
    onSave({
      id: event?.id ?? crypto.randomUUID(),
      title: title.trim(),
      start: startISO,
      end: endISO,
      color,
      allDay,
    });
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
