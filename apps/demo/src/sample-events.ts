import type { CalendarEvent, RecurrenceRule } from "trud-calendar-core";

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

/** Generate ~18 realistic sample events spread across the current and next week */
export function generateSampleEvents(): CalendarEvent[] {
  const now = new Date();
  const today = stripTime(now);
  const dow = today.getDay(); // 0=Sun

  // Monday of the current week
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
    // ---- Current week ----
    {
      id: "evt-1",
      title: "Team Standup",
      start: d(0, 9, 0),
      end: d(0, 9, 30),
      color: COLORS.blue,
    },
    {
      id: "evt-2",
      title: "Product Roadmap Review",
      start: d(0, 14, 0),
      end: d(0, 15, 30),
      color: COLORS.purple,
    },
    {
      id: "evt-3",
      title: "Gym - Chest & Tris",
      start: d(1, 7, 0),
      end: d(1, 8, 0),
      color: COLORS.green,
    },
    {
      id: "evt-4",
      title: "Lunch with Sarah",
      start: d(1, 12, 0),
      end: d(1, 13, 0),
      color: COLORS.amber,
    },
    {
      id: "evt-5",
      title: "Design Sprint Workshop",
      start: d(2, 10, 0),
      end: d(2, 12, 0),
      color: COLORS.pink,
    },
    {
      id: "evt-6",
      title: "1:1 with Manager",
      start: d(2, 15, 0),
      end: d(2, 15, 45),
      color: COLORS.red,
    },
    {
      id: "evt-7",
      title: "Company All-Hands",
      start: d(3, 11, 0),
      end: d(3, 12, 0),
      color: COLORS.indigo,
    },
    {
      id: "evt-8",
      title: "Sprint Planning",
      start: d(3, 14, 0),
      end: d(3, 16, 0),
      color: COLORS.blue,
    },
    {
      id: "evt-9",
      title: "Yoga Class",
      start: d(4, 7, 0),
      end: d(4, 8, 0),
      color: COLORS.green,
    },
    {
      id: "evt-10",
      title: "Client Presentation",
      start: d(4, 10, 0),
      end: d(4, 11, 30),
      color: COLORS.orange,
    },
    {
      id: "evt-11",
      title: "Tech Conference",
      start: allDay(5),
      end: allDay(6),
      allDay: true,
      color: COLORS.indigo,
    },
    {
      id: "evt-12",
      title: "Team Outing",
      start: allDay(6),
      end: allDay(6),
      allDay: true,
      color: COLORS.pink,
    },

    // ---- Multi-day timed event ----
    {
      id: "evt-multiday-timed",
      title: "Product Conference",
      start: d(2, 10, 0),
      end: d(4, 16, 0),
      color: COLORS.indigo,
    },

    // ---- Next week ----
    {
      id: "evt-13",
      title: "Quarterly OKR Review",
      start: d(7, 9, 0),
      end: d(7, 10, 30),
      color: COLORS.red,
    },
    {
      id: "evt-14",
      title: "Dentist Appointment",
      start: d(8, 8, 0),
      end: d(8, 9, 0),
      color: COLORS.amber,
    },
    {
      id: "evt-15",
      title: "Code Review Session",
      start: d(8, 14, 0),
      end: d(8, 15, 0),
      color: COLORS.purple,
    },
    {
      id: "evt-16",
      title: "Deployment Window",
      start: d(9, 16, 0),
      end: d(9, 18, 0),
      color: COLORS.orange,
    },
    {
      id: "evt-17",
      title: "Marketing Sync",
      start: d(10, 11, 0),
      end: d(10, 11, 45),
      color: COLORS.blue,
    },
    {
      id: "evt-18",
      title: "Hackathon",
      start: allDay(11),
      end: allDay(12),
      allDay: true,
      color: COLORS.green,
    },

    // ---- Recurring events ----
    {
      id: "rec-standup",
      title: "Daily Standup",
      start: d(0, 9, 0),
      end: d(0, 9, 15),
      color: COLORS.blue,
      recurrence: { freq: "daily" } as RecurrenceRule,
    },
    {
      id: "rec-gym",
      title: "Gym",
      start: d(0, 7, 0),
      end: d(0, 8, 0),
      color: COLORS.green,
      recurrence: { freq: "weekly", byDay: ["MO", "WE", "FR"] } as RecurrenceRule,
    },
  ];
}

// ── Helpers ──────────────────────────────────────────────────────────────

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Format a Date as a local ISO-like string (YYYY-MM-DDTHH:mm:ss) */
function toLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}
