import type { CalendarEvent } from "trud-calendar-core";

/** Generate sample events around a given date (today by default) */
export function generateSampleEvents(
  baseDate: string = new Date().toISOString().slice(0, 10),
): CalendarEvent[] {
  const [y, m, d] = baseDate.split("-").map(Number);
  const date = (day: number) => {
    const dd = String(day).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  return [
    {
      id: "1",
      title: "Team Standup",
      start: `${baseDate}T09:00:00`,
      end: `${baseDate}T09:30:00`,
      color: "#3b82f6",
    },
    {
      id: "2",
      title: "Product Review",
      start: `${baseDate}T10:00:00`,
      end: `${baseDate}T11:30:00`,
      color: "#8b5cf6",
    },
    {
      id: "3",
      title: "Lunch with Sarah",
      start: `${baseDate}T12:00:00`,
      end: `${baseDate}T13:00:00`,
      color: "#f59e0b",
    },
    {
      id: "4",
      title: "Sprint Planning",
      start: `${baseDate}T14:00:00`,
      end: `${baseDate}T15:30:00`,
      color: "#10b981",
    },
    {
      id: "5",
      title: "1:1 with Manager",
      start: `${baseDate}T15:00:00`,
      end: `${baseDate}T15:45:00`,
      color: "#ef4444",
    },
    {
      id: "6",
      title: "Design Workshop",
      start: `${date(d + 1)}T10:00:00`,
      end: `${date(d + 1)}T12:00:00`,
      color: "#ec4899",
    },
    {
      id: "7",
      title: "Conference",
      start: `${date(d + 2)}T00:00:00`,
      end: `${date(d + 4)}T23:59:00`,
      allDay: true,
      color: "#6366f1",
    },
    {
      id: "8",
      title: "Code Review",
      start: `${date(d + 1)}T14:00:00`,
      end: `${date(d + 1)}T15:00:00`,
      color: "#14b8a6",
    },
    {
      id: "9",
      title: "Yoga Class",
      start: `${date(d - 1)}T07:00:00`,
      end: `${date(d - 1)}T08:00:00`,
      color: "#a855f7",
    },
    {
      id: "10",
      title: "Quarterly Review",
      start: `${date(d + 3)}T09:00:00`,
      end: `${date(d + 3)}T10:00:00`,
      color: "#f97316",
    },
    {
      id: "11",
      title: "Team Outing",
      start: `${date(d + 5)}T00:00:00`,
      end: `${date(d + 5)}T23:59:00`,
      allDay: true,
      color: "#22c55e",
    },
    {
      id: "12",
      title: "Client Call",
      start: `${date(d - 2)}T16:00:00`,
      end: `${date(d - 2)}T17:00:00`,
      color: "#0ea5e9",
    },
  ];
}
