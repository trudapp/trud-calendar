import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { Calendar } from "trud-calendar";
import type { CalendarEvent } from "trud-calendar-core";

// ---------------------------------------------------------------------------
// Helpers – dates relative to "today" so stories always look current
// ---------------------------------------------------------------------------

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();
const d = today.getDate();
const dow = today.getDay(); // 0 = Sun

/** Monday of the current week */
const monday = new Date(y, m, d - ((dow + 6) % 7));

function dt(offsetDays: number, hour: number, minute = 0): string {
  const t = new Date(monday);
  t.setDate(monday.getDate() + offsetDays);
  t.setHours(hour, minute, 0, 0);
  return toLocalISO(t);
}

function toLocalISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

// ---------------------------------------------------------------------------
// Sample events for interaction stories
// ---------------------------------------------------------------------------

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

const dragDropEvents: CalendarEvent[] = [
  {
    id: "dnd-1",
    title: "Morning Standup",
    start: dt(0, 9, 0),
    end: dt(0, 9, 30),
    color: COLORS.blue,
  },
  {
    id: "dnd-2",
    title: "Design Review (2h)",
    start: dt(1, 10, 0),
    end: dt(1, 12, 0),
    color: COLORS.purple,
  },
  {
    id: "dnd-3",
    title: "Quick Sync (15m)",
    start: dt(2, 14, 0),
    end: dt(2, 14, 15),
    color: COLORS.green,
  },
  {
    id: "dnd-4",
    title: "Sprint Retro (1.5h)",
    start: dt(3, 15, 0),
    end: dt(3, 16, 30),
    color: COLORS.orange,
  },
  {
    id: "dnd-5",
    title: "All-Day Workshop",
    start: dt(4, 0, 0),
    end: dt(4, 23, 59),
    allDay: true,
    color: COLORS.indigo,
  },
];

const resizeEvents: CalendarEvent[] = [
  {
    id: "resize-1",
    title: "Flexible Meeting",
    start: dt(0, 10, 0),
    end: dt(0, 11, 0),
    color: COLORS.blue,
  },
  {
    id: "resize-2",
    title: "Extended Workshop",
    start: dt(1, 13, 0),
    end: dt(1, 15, 0),
    color: COLORS.purple,
  },
  {
    id: "resize-3",
    title: "Short Call",
    start: dt(2, 9, 0),
    end: dt(2, 9, 30),
    color: COLORS.green,
  },
  {
    id: "resize-4",
    title: "Planning Session",
    start: dt(3, 14, 0),
    end: dt(3, 16, 0),
    color: COLORS.amber,
  },
];

const allInteractionsEvents: CalendarEvent[] = [
  {
    id: "all-1",
    title: "Draggable Standup",
    start: dt(0, 9, 0),
    end: dt(0, 9, 30),
    color: COLORS.blue,
  },
  {
    id: "all-2",
    title: "Resizable Workshop",
    start: dt(1, 10, 0),
    end: dt(1, 12, 0),
    color: COLORS.purple,
  },
  {
    id: "all-3",
    title: "Movable Lunch",
    start: dt(2, 12, 0),
    end: dt(2, 13, 0),
    color: COLORS.amber,
  },
  {
    id: "all-4",
    title: "Adjustable Retro",
    start: dt(3, 15, 0),
    end: dt(3, 16, 30),
    color: COLORS.red,
  },
  {
    id: "all-5",
    title: "Client Demo",
    start: dt(4, 14, 0),
    end: dt(4, 15, 0),
    color: COLORS.orange,
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Calendar> = {
  title: "Interactions",
  component: Calendar,
  decorators: [
    (Story) => (
      <div style={{ height: "90vh", padding: "1rem" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    enableDnD: { control: "boolean" },
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
 * Drag events to a new time slot. The `onEventDrop` callback logs to the
 * Actions panel whenever an event is moved.
 */
export const DragAndDrop: Story = {
  args: {
    events: dragDropEvents,
    defaultView: "week",
    enableDnD: true,
    onEventDrop: action("onEventDrop"),
  },
};

/**
 * Resize events by dragging their bottom edge. The `onEventResize` callback
 * logs to the Actions panel.
 */
export const EventResize: Story = {
  args: {
    events: resizeEvents,
    defaultView: "week",
    enableDnD: true,
    onEventResize: action("onEventResize"),
  },
};

/**
 * Click and drag on an empty time slot to create a new event. The
 * `onSlotSelect` callback logs the selected time range.
 */
export const DragToCreate: Story = {
  args: {
    events: [],
    defaultView: "week",
    enableDnD: true,
    onSlotSelect: action("onSlotSelect"),
  },
};

/**
 * All interaction callbacks enabled together: drag-and-drop, resize, and
 * slot selection. Check the Actions panel to see each callback fire.
 */
export const AllInteractions: Story = {
  args: {
    events: allInteractionsEvents,
    defaultView: "week",
    enableDnD: true,
    onEventDrop: action("onEventDrop"),
    onEventResize: action("onEventResize"),
    onSlotSelect: action("onSlotSelect"),
  },
};
