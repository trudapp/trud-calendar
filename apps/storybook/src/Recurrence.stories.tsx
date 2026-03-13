import type { Meta, StoryObj } from "@storybook/react";
import { Calendar } from "trud-calendar";
import type { CalendarEvent, RecurrenceRule, DateString } from "trud-calendar-core";
import { expandRecurringEvents } from "trud-calendar-core";
import { useMemo } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();
const dow = today.getDay();

/** Monday of the current week */
const monday = new Date(y, m, today.getDate() - ((dow + 6) % 7));

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalISO(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function toDateString(date: Date): DateString {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dt(offsetDays: number, hour: number, minute = 0): string {
  const t = new Date(monday);
  t.setDate(monday.getDate() + offsetDays);
  t.setHours(hour, minute, 0, 0);
  return toLocalISO(t);
}

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

// ---------------------------------------------------------------------------
// Wrapper component that expands recurring events before rendering
// ---------------------------------------------------------------------------

function RecurrenceCalendar({
  events,
  rangeMonths = 3,
  ...props
}: {
  events: CalendarEvent[];
  rangeMonths?: number;
} & Omit<React.ComponentProps<typeof Calendar>, "events">) {
  const expanded = useMemo(() => {
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m + rangeMonths - 1, 0);
    return expandRecurringEvents(events, toDateString(start), toDateString(end));
  }, [events, rangeMonths]);

  return <Calendar events={expanded} {...props} />;
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof RecurrenceCalendar> = {
  title: "Recurrence",
  component: RecurrenceCalendar,
  decorators: [
    (Story) => (
      <div style={{ height: "90vh", padding: "1rem" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    defaultView: {
      control: "select",
      options: ["month", "week", "day", "agenda"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof RecurrenceCalendar>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * A daily recurring event shown in the week view. The "Daily Standup"
 * appears every day of the week.
 */
export const DailyRecurrence: Story = {
  args: {
    events: [
      {
        id: "rec-daily",
        title: "Daily Standup",
        start: dt(0, 9, 0),
        end: dt(0, 9, 15),
        color: COLORS.blue,
        recurrence: { freq: "daily" } as RecurrenceRule,
      },
    ],
    defaultView: "week",
  },
};

/**
 * A weekly recurring event on Monday, Wednesday, and Friday shown in the
 * month view. The "Gym Session" repeats on those three days every week.
 */
export const WeeklyRecurrence: Story = {
  args: {
    events: [
      {
        id: "rec-weekly",
        title: "Gym Session",
        start: dt(0, 7, 0),
        end: dt(0, 8, 0),
        color: COLORS.green,
        recurrence: {
          freq: "weekly",
          byDay: ["MO", "WE", "FR"],
        } as RecurrenceRule,
      },
    ],
    defaultView: "month",
  },
};

/**
 * A monthly recurring event shown across multiple months. Navigate forward
 * and backward to see the "Monthly Review" appear on the same day each month.
 */
export const MonthlyRecurrence: Story = {
  args: {
    events: [
      {
        id: "rec-monthly",
        title: "Monthly Review",
        start: dt(0, 14, 0),
        end: dt(0, 15, 30),
        color: COLORS.purple,
        recurrence: { freq: "monthly" } as RecurrenceRule,
      },
    ],
    defaultView: "month",
    rangeMonths: 4,
  },
};

/**
 * A daily recurring event that has specific dates excluded. The "Daily Check-in"
 * appears every day except for the excluded dates (Wednesday and Friday of the
 * current week).
 */
export const RecurrenceWithExDates: Story = {
  args: {
    events: [
      {
        id: "rec-exdates",
        title: "Daily Check-in",
        start: dt(0, 10, 0),
        end: dt(0, 10, 30),
        color: COLORS.red,
        recurrence: { freq: "daily" } as RecurrenceRule,
        exDates: (() => {
          // Exclude Wednesday and Friday of the current week
          const wed = new Date(monday);
          wed.setDate(monday.getDate() + 2);
          const fri = new Date(monday);
          fri.setDate(monday.getDate() + 4);
          return [toDateString(wed), toDateString(fri)];
        })(),
      },
    ],
    defaultView: "week",
  },
};

/**
 * A realistic mix of regular one-off events, all-day events, and recurring
 * events all displayed together.
 */
export const MixedEvents: Story = {
  args: {
    events: [
      // Regular timed events
      {
        id: "mix-1",
        title: "Project Kickoff",
        start: dt(1, 10, 0),
        end: dt(1, 11, 30),
        color: COLORS.orange,
      },
      {
        id: "mix-2",
        title: "Client Call",
        start: dt(3, 15, 0),
        end: dt(3, 16, 0),
        color: COLORS.amber,
      },
      // All-day events
      {
        id: "mix-3",
        title: "Company Holiday",
        start: toLocalISO(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 5))
          .slice(0, 10) + "T00:00:00",
        end: toLocalISO(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 5))
          .slice(0, 10) + "T00:00:00",
        allDay: true,
        color: COLORS.pink,
      },
      {
        id: "mix-4",
        title: "Team Offsite",
        start: toLocalISO(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 11))
          .slice(0, 10) + "T00:00:00",
        end: toLocalISO(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 13))
          .slice(0, 10) + "T00:00:00",
        allDay: true,
        color: COLORS.indigo,
      },
      // Recurring events
      {
        id: "mix-rec-standup",
        title: "Daily Standup",
        start: dt(0, 9, 0),
        end: dt(0, 9, 15),
        color: COLORS.blue,
        recurrence: { freq: "daily" } as RecurrenceRule,
      },
      {
        id: "mix-rec-gym",
        title: "Gym",
        start: dt(0, 7, 0),
        end: dt(0, 8, 0),
        color: COLORS.green,
        recurrence: {
          freq: "weekly",
          byDay: ["MO", "WE", "FR"],
        } as RecurrenceRule,
      },
    ],
    defaultView: "week",
  },
};
