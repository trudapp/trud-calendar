import type { CalendarEvent } from "trud-calendar-core";

const today = new Date();
const y = today.getFullYear();
const m = String(today.getMonth() + 1).padStart(2, "0");
const d = today.getDate();

function date(day: number): string {
  return `${y}-${m}-${String(day).padStart(2, "0")}`;
}

export const sampleEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Team Standup",
    start: `${date(d)}T09:00:00`,
    end: `${date(d)}T09:30:00`,
    color: "#3b82f6",
  },
  {
    id: "2",
    title: "Product Review",
    start: `${date(d)}T10:00:00`,
    end: `${date(d)}T11:30:00`,
    color: "#8b5cf6",
  },
  {
    id: "3",
    title: "Lunch Break",
    start: `${date(d)}T12:00:00`,
    end: `${date(d)}T13:00:00`,
    color: "#f59e0b",
  },
  {
    id: "4",
    title: "Sprint Planning",
    start: `${date(d)}T14:00:00`,
    end: `${date(d)}T15:30:00`,
    color: "#10b981",
  },
  {
    id: "5",
    title: "1:1 Meeting",
    start: `${date(d)}T15:00:00`,
    end: `${date(d)}T15:45:00`,
    color: "#ef4444",
  },
  {
    id: "6",
    title: "Workshop",
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
    title: "Yoga",
    start: `${date(d - 1)}T07:00:00`,
    end: `${date(d - 1)}T08:00:00`,
    color: "#a855f7",
  },
  {
    id: "10",
    title: "Review",
    start: `${date(d + 3)}T09:00:00`,
    end: `${date(d + 3)}T10:00:00`,
    color: "#f97316",
  },
];
