import type { Meta, StoryObj } from "@storybook/react";
import { Calendar } from "trud-calendar";
import type { CalendarEvent } from "trud-calendar-core";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();
const d = today.getDate();
const dow = today.getDay();

/** Monday of the current week */
const monday = new Date(y, m, d - ((dow + 6) % 7));

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalISO(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function dt(offsetDays: number, hour: number, minute = 0): string {
  const t = new Date(monday);
  t.setDate(monday.getDate() + offsetDays);
  t.setHours(hour, minute, 0, 0);
  return toLocalISO(t);
}

function allDay(offsetDays: number): string {
  const t = new Date(monday);
  t.setDate(monday.getDate() + offsetDays);
  return toLocalISO(t).slice(0, 10) + "T00:00:00";
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
  teal: "#14b8a6",
  cyan: "#06b6d4",
  rose: "#f43f5e",
  lime: "#84cc16",
  sky: "#0ea5e9",
  violet: "#7c3aed",
  fuchsia: "#d946ef",
  emerald: "#059669",
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Calendar> = {
  title: "Views",
  component: Calendar,
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
type Story = StoryObj<typeof Calendar>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * A single timed event that spans from Wednesday 10:00 to Friday 16:00,
 * demonstrating how multi-day timed events render across day columns in
 * the week view.
 */
export const MultiDayTimedEvent: Story = {
  args: {
    events: [
      {
        id: "multi-timed-1",
        title: "Product Conference",
        start: dt(2, 10, 0), // Wednesday 10:00
        end: dt(4, 16, 0),   // Friday 16:00
        color: COLORS.indigo,
      },
      // A few regular events to provide visual context
      {
        id: "multi-ctx-1",
        title: "Morning Standup",
        start: dt(0, 9, 0),
        end: dt(0, 9, 30),
        color: COLORS.blue,
      },
      {
        id: "multi-ctx-2",
        title: "Team Lunch",
        start: dt(1, 12, 0),
        end: dt(1, 13, 0),
        color: COLORS.amber,
      },
    ],
    defaultView: "week",
  },
};

/**
 * Multiple events that overlap in time, demonstrating the column-packing
 * algorithm. Events are positioned side-by-side within their overlap group.
 */
export const OverlappingEvents: Story = {
  args: {
    events: [
      // Overlap group 1: Three events overlapping on Monday 10:00-12:00
      {
        id: "overlap-1",
        title: "Design Review",
        start: dt(0, 10, 0),
        end: dt(0, 12, 0),
        color: COLORS.blue,
      },
      {
        id: "overlap-2",
        title: "Code Review",
        start: dt(0, 10, 30),
        end: dt(0, 11, 30),
        color: COLORS.purple,
      },
      {
        id: "overlap-3",
        title: "Product Sync",
        start: dt(0, 11, 0),
        end: dt(0, 12, 30),
        color: COLORS.green,
      },
      // Overlap group 2: Two events overlapping on Tuesday afternoon
      {
        id: "overlap-4",
        title: "Sprint Planning",
        start: dt(1, 14, 0),
        end: dt(1, 16, 0),
        color: COLORS.orange,
      },
      {
        id: "overlap-5",
        title: "1:1 with Manager",
        start: dt(1, 14, 30),
        end: dt(1, 15, 30),
        color: COLORS.red,
      },
      // Overlap group 3: Four events on Wednesday morning
      {
        id: "overlap-6",
        title: "Standup",
        start: dt(2, 9, 0),
        end: dt(2, 9, 30),
        color: COLORS.teal,
      },
      {
        id: "overlap-7",
        title: "Backlog Grooming",
        start: dt(2, 9, 0),
        end: dt(2, 10, 30),
        color: COLORS.amber,
      },
      {
        id: "overlap-8",
        title: "Architecture Review",
        start: dt(2, 9, 15),
        end: dt(2, 11, 0),
        color: COLORS.indigo,
      },
      {
        id: "overlap-9",
        title: "Quick Sync",
        start: dt(2, 9, 30),
        end: dt(2, 10, 0),
        color: COLORS.pink,
      },
      // Non-overlapping event for contrast
      {
        id: "overlap-solo",
        title: "Lunch Break",
        start: dt(3, 12, 0),
        end: dt(3, 13, 0),
        color: COLORS.lime,
      },
    ],
    defaultView: "week",
  },
};

/**
 * A month view packed with 20+ events to demonstrate the "+N more" popover
 * that appears when too many events fit in a single day cell.
 */
export const ManyEvents: Story = {
  args: {
    events: (() => {
      const events: CalendarEvent[] = [];
      const colorList = Object.values(COLORS);

      // Cluster many events on the same days to trigger "+N more"
      const eventNames = [
        "Team Standup", "Code Review", "Design Sync", "Sprint Planning",
        "Retrospective", "Backlog Grooming", "Architecture Review",
        "Security Audit", "Performance Review", "Client Demo",
        "Stakeholder Update", "Budget Review", "Hiring Meeting",
        "Onboarding Session", "Knowledge Transfer", "Tech Talk",
        "Pair Programming", "Bug Triage", "Release Planning",
        "Feature Kickoff", "User Research", "A/B Test Review",
        "Data Pipeline Sync", "ML Model Review", "QA Handoff",
      ];

      // Day 0 (Monday): 6 events
      for (let i = 0; i < 6; i++) {
        events.push({
          id: `many-d0-${i}`,
          title: eventNames[i],
          start: dt(0, 8 + i * 2, 0),
          end: dt(0, 9 + i * 2, 0),
          color: colorList[i % colorList.length],
        });
      }

      // Day 1 (Tuesday): 5 events
      for (let i = 0; i < 5; i++) {
        events.push({
          id: `many-d1-${i}`,
          title: eventNames[6 + i],
          start: dt(1, 9 + i, 0),
          end: dt(1, 10 + i, 0),
          color: colorList[(6 + i) % colorList.length],
        });
      }

      // Day 2 (Wednesday): 7 events — most crowded day
      for (let i = 0; i < 7; i++) {
        events.push({
          id: `many-d2-${i}`,
          title: eventNames[11 + i],
          start: dt(2, 8 + i, 30),
          end: dt(2, 9 + i, 30),
          color: colorList[(11 + i) % colorList.length],
        });
      }

      // Day 3 (Thursday): 4 events
      for (let i = 0; i < 4; i++) {
        events.push({
          id: `many-d3-${i}`,
          title: eventNames[18 + i],
          start: dt(3, 10 + i * 2, 0),
          end: dt(3, 11 + i * 2, 0),
          color: colorList[(18 + i) % colorList.length],
        });
      }

      // Multi-day all-day events that span several days
      events.push({
        id: "many-allday-1",
        title: "Company Retreat",
        start: allDay(0),
        end: allDay(4),
        allDay: true,
        color: COLORS.indigo,
      });
      events.push({
        id: "many-allday-2",
        title: "Marketing Week",
        start: allDay(0),
        end: allDay(2),
        allDay: true,
        color: COLORS.pink,
      });
      events.push({
        id: "many-allday-3",
        title: "Hackathon",
        start: allDay(3),
        end: allDay(4),
        allDay: true,
        color: COLORS.green,
      });

      return events;
    })(),
    defaultView: "month",
  },
};
