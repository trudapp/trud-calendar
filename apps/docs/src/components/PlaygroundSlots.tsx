import { useCalendarContext } from "trud-calendar";
import type {
  CalendarSlots,
  ToolbarSlotProps,
  DayCellSlotProps,
  TimeEventSlotProps,
  AgendaEventSlotProps,
  PopoverSlotProps,
} from "trud-calendar-core";

// ── Helpers ──────────────────────────────────────────────────────────────

type Category = "work" | "health" | "social" | "personal";

const CATS: Record<Category, { emoji: string; label: string; grad: string; bg: string }> = {
  work:     { emoji: "💼", label: "Work",     grad: "linear-gradient(135deg, #6366f1, #8b5cf6)", bg: "rgba(99,102,241,0.12)" },
  health:   { emoji: "🏋️", label: "Health",   grad: "linear-gradient(135deg, #10b981, #34d399)", bg: "rgba(16,185,129,0.12)" },
  social:   { emoji: "🎉", label: "Social",   grad: "linear-gradient(135deg, #f59e0b, #fbbf24)", bg: "rgba(245,158,11,0.12)" },
  personal: { emoji: "✨", label: "Personal", grad: "linear-gradient(135deg, #ec4899, #f472b6)", bg: "rgba(236,72,153,0.12)" },
};

function cat(title: string): Category {
  const t = title.toLowerCase();
  if (/gym|yoga|session/i.test(t)) return "health";
  if (/lunch|outing|conference/i.test(t)) return "social";
  if (/standup|sprint|review|deploy|workshop|all-hands|planning|demo|meeting|product|design|1:1|manager/i.test(t)) return "work";
  return "personal";
}

function fmtTime(iso: string) {
  const h = parseInt(iso.slice(11, 13), 10);
  const m = iso.slice(14, 16);
  return `${h % 12 || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
}

// ── Custom Toolbar ───────────────────────────────────────────────────────

function CustomToolbar({ view, onPrev, onNext, onToday, onViewChange, formattedDate }: ToolbarSlotProps) {
  const views = ["month", "week", "day", "agenda"] as const;
  const icons: Record<string, string> = { month: "▦", week: "▤", day: "▥", agenda: "☰" };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 16px", borderBottom: "2px solid transparent",
      borderImage: "linear-gradient(90deg, #6366f1, #ec4899, #f59e0b) 1",
      background: "var(--trc-background)", gap: "8px", flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <RoundBtn onClick={onPrev}>‹</RoundBtn>
        <button onClick={onToday} style={{
          padding: "5px 14px", borderRadius: "20px", border: "none",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700,
          letterSpacing: "0.03em", textTransform: "uppercase",
        }}>Today</button>
        <RoundBtn onClick={onNext}>›</RoundBtn>
      </div>
      <span style={{
        fontWeight: 800, fontSize: "1.1rem",
        background: "linear-gradient(135deg, #6366f1, #ec4899)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        letterSpacing: "-0.02em",
      }}>{formattedDate}</span>
      <div style={{ display: "flex", gap: "2px", background: "var(--trc-muted)", borderRadius: "10px", padding: "3px" }}>
        {views.map((v) => (
          <button key={v} onClick={() => onViewChange(v)} style={{
            padding: "5px 12px", borderRadius: "8px", border: "none",
            background: view === v ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
            color: view === v ? "#fff" : "var(--trc-muted-foreground)",
            cursor: "pointer", fontSize: "0.75rem", fontWeight: view === v ? 700 : 500,
            transition: "all 0.2s",
          }}>{icons[v]} {v[0].toUpperCase() + v.slice(1)}</button>
        ))}
      </div>
    </div>
  );
}

function RoundBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      width: "30px", height: "30px", borderRadius: "50%",
      border: "1px solid var(--trc-border)", background: "transparent",
      color: "var(--trc-foreground)", cursor: "pointer", fontSize: "1.1rem",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background 0.15s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--trc-muted)")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >{children}</button>
  );
}

// ── Custom Day Cell ──────────────────────────────────────────────────────

function CustomDayCell({ date, isToday, isCurrentMonth, events }: DayCellSlotProps) {
  const { onEventClick } = useCalendarContext();
  const day = parseInt(date.slice(8, 10), 10);

  return (
    <div style={{
      padding: "4px 4px 2px", minHeight: "80px",
      opacity: isCurrentMonth ? 1 : 0.3, position: "relative",
      borderRight: "1px solid var(--trc-border)",
    }}>
      <div style={{
        width: "26px", height: "26px", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.75rem", fontWeight: isToday ? 800 : 500,
        background: isToday ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
        color: isToday ? "#fff" : "var(--trc-muted-foreground)", marginBottom: "3px",
      }}>{day}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {events.slice(0, 3).map((e) => {
          const c = CATS[cat(e.title)];
          return (
            <button key={e.id} onClick={() => onEventClick?.(e)} style={{
              width: "100%", fontSize: "0.62rem", padding: "2px 6px", borderRadius: "4px",
              border: "none", background: c.bg, borderLeft: "3px solid",
              borderImage: `${c.grad} 1`, whiteSpace: "nowrap", overflow: "hidden",
              textOverflow: "ellipsis", color: "var(--trc-foreground)",
              lineHeight: "1.5", cursor: "pointer", textAlign: "left", fontWeight: 500,
            }}>{c.emoji} {e.title}</button>
          );
        })}
        {events.length > 3 && (
          <span style={{
            fontSize: "0.6rem", fontWeight: 700, paddingLeft: "6px",
            background: "linear-gradient(135deg, #6366f1, #ec4899)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>+{events.length - 3} more</span>
        )}
      </div>
    </div>
  );
}

// ── Custom Time Event ────────────────────────────────────────────────────

function CustomTimeEvent({ event, positioned }: TimeEventSlotProps) {
  const { onEventClick } = useCalendarContext();
  const c = CATS[cat(event.title)];

  return (
    <div style={{
      position: "absolute",
      top: `${positioned.top}%`,
      height: `${Math.max(positioned.height, 2.5)}%`,
      left: `${(positioned.column / positioned.totalColumns) * 100}%`,
      width: `${(1 / positioned.totalColumns) * 100}%`,
      padding: "1px 2px", boxSizing: "border-box",
    }}>
      <button onClick={() => onEventClick?.(event)} style={{
        width: "100%", height: "100%", borderRadius: "8px",
        padding: "6px 8px", background: c.grad, color: "#fff",
        fontSize: "0.72rem", overflow: "hidden", display: "flex",
        flexDirection: "column", gap: "2px", border: "none",
        cursor: "pointer", textAlign: "left",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)", position: "relative",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)"; }}
      >
        <div style={{ position: "absolute", inset: 0, borderRadius: "8px", background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", zIndex: 1 }}>
          <span style={{ fontSize: "0.85rem" }}>{c.emoji}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</span>
        </div>
        <div style={{ opacity: 0.85, fontSize: "0.65rem", zIndex: 1 }}>{fmtTime(event.start)}</div>
      </button>
    </div>
  );
}

// ── Custom Agenda Event ──────────────────────────────────────────────────

function CustomAgendaEvent({ event }: AgendaEventSlotProps) {
  const { onEventClick } = useCalendarContext();
  const c = CATS[cat(event.title)];

  return (
    <button onClick={() => onEventClick?.(event)} style={{
      display: "flex", alignItems: "center", gap: "14px",
      padding: "12px 16px", borderRadius: "12px",
      background: "var(--trc-background)", border: "1px solid var(--trc-border)",
      cursor: "pointer", width: "100%", textAlign: "left",
      transition: "all 0.2s", position: "relative", overflow: "hidden",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.borderColor = "#6366f1"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.borderColor = "var(--trc-border)"; }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: c.grad, borderRadius: "12px 0 0 12px" }} />
      <div style={{
        width: "36px", height: "36px", borderRadius: "8px", background: c.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.1rem", flexShrink: 0,
      }}>{c.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--trc-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</div>
        <div style={{ fontSize: "0.72rem", color: "var(--trc-muted-foreground)", marginTop: "2px" }}>
          {event.allDay ? "All day" : `${fmtTime(event.start)} – ${fmtTime(event.end)}`}
        </div>
      </div>
      <span style={{
        fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.06em", color: "#fff", padding: "3px 8px",
        borderRadius: "20px", background: c.grad, flexShrink: 0,
      }}>{c.label}</span>
    </button>
  );
}

// ── Custom Popover ───────────────────────────────────────────────────────

function CustomPopover({ event, onClose }: PopoverSlotProps) {
  const c = CATS[cat(event.title)];

  return (
    <div style={{
      width: "280px", borderRadius: "14px", overflow: "hidden",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
      background: "var(--trc-background)", border: "1px solid var(--trc-border)",
      animation: "pgSlotPopIn 0.2s ease-out",
    }}>
      {/* Gradient header */}
      <div style={{ background: c.grad, padding: "18px 18px 14px", position: "relative" }}>
        <button onClick={onClose} style={{
          position: "absolute", top: "8px", right: "8px", width: "22px", height: "22px",
          borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.2)",
          color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "0.75rem", backdropFilter: "blur(4px)",
        }}>✕</button>
        <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>{c.emoji}</div>
        <h3 style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{event.title}</h3>
        <span style={{
          display: "inline-block", marginTop: "6px", padding: "2px 8px", borderRadius: "20px",
          background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)",
          color: "#fff", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}>{c.label}</span>
      </div>
      {/* Body */}
      <div style={{ padding: "14px 18px 18px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 12px", borderRadius: "8px", background: "var(--trc-muted)",
        }}>
          <span style={{ fontSize: "1rem" }}>🕐</span>
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--trc-foreground)" }}>
              {event.allDay ? "All day" : `${fmtTime(event.start)} – ${fmtTime(event.end)}`}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--trc-muted-foreground)", marginTop: "1px" }}>
              {new Date(event.start).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </div>
          </div>
        </div>
        {event.color && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 12px", borderRadius: "8px", background: "var(--trc-muted)", marginTop: "8px",
          }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: event.color, boxShadow: `0 0 8px ${event.color}60` }} />
            <span style={{ fontSize: "0.72rem", color: "var(--trc-muted-foreground)" }}>Calendar color</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────

export const playgroundSlots: Partial<CalendarSlots> = {
  toolbar: CustomToolbar,
  dayCell: CustomDayCell,
  timeEvent: CustomTimeEvent,
  agendaEvent: CustomAgendaEvent,
  popover: CustomPopover,
};
