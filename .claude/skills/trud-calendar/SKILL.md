---
name: trud-calendar
description: Guide for building calendar UIs with the trud-calendar React component library. Use when installing, configuring, or customizing trud-calendar in a project.
user-invocable: true
---

# trud-calendar — React Calendar Component Library

A modern, headless-first calendar for React. Two packages:

- **`trud-calendar-core`** — Pure logic, zero dependencies, framework-agnostic
- **`trud-calendar`** — React components + hooks (depends on core)

## Installation

```bash
npm install trud-calendar trud-calendar-core
```

Both packages are required. `trud-calendar` is the React layer; `trud-calendar-core` provides types, utilities, and recurrence expansion.

## Fundamental rule: ISO 8601 strings, never Date objects

ALL dates are strings. Never use `new Date()` in event data.

```ts
type DateString = string;     // "YYYY-MM-DD"
type DateTimeString = string; // "YYYY-MM-DDTHH:mm:ss"
```

## Quick start

```tsx
import { Calendar } from "trud-calendar";
import type { CalendarEvent } from "trud-calendar-core";

const events: CalendarEvent[] = [
  {
    id: "1",                           // required
    title: "Team Meeting",
    start: "2026-03-13T09:00:00",      // ISO string, not Date
    end: "2026-03-13T10:00:00",
    color: "#3b82f6",                  // optional
  },
  {
    id: "2",
    title: "Conference",
    start: "2026-03-14T00:00:00",
    end: "2026-03-16T00:00:00",
    allDay: true,                      // optional
  },
];

function App() {
  return <Calendar events={events} />;
}
```

## Calendar props

```tsx
<Calendar
  // Data
  events={events}                    // CalendarEvent[] — required

  // Controlled state (optional — uncontrolled by default)
  date={date}                        // DateString "YYYY-MM-DD"
  view={view}                        // "month" | "week" | "day" | "agenda"
  defaultDate="2026-03-13"           // initial date (uncontrolled)
  defaultView="week"                 // initial view (uncontrolled)

  // Callbacks
  onDateChange={setDate}             // (date: DateString) => void
  onViewChange={setView}             // (view: CalendarView) => void
  onEventClick={handleClick}         // (event: CalendarEvent) => void
  onSlotClick={handleSlotClick}      // (dateTime: DateTimeString) => void
  onSlotSelect={handleSelect}        // (start: DateTimeString, end: DateTimeString) => void
  onEventDrop={handleDrop}           // (event, newStart, newEnd) => void
  onEventResize={handleResize}       // (event, newStart, newEnd) => void
  onEventsDelete={handleDelete}      // (events: CalendarEvent[]) => void

  // Features
  enableDnD                          // boolean — enable drag-and-drop event move
  enableMultiSelect                  // boolean — Ctrl+click, Shift+click, Ctrl+A
  enableVirtualization               // boolean — virtual scrolling for large datasets

  // Time grid
  dayStartHour={7}                   // 0-23, default 0
  dayEndHour={20}                    // 1-24, default 24

  // Locale
  locale={{
    locale: "es-ES",                 // BCP 47 tag
    weekStartsOn: 1,                 // 0=Sunday, 1=Monday
    labels: {                        // optional i18n overrides
      today: "Hoy",
      month: "Mes",
      week: "Semana",
      day: "Dia",
      agenda: "Agenda",
      allDay: "Todo el dia",
      noEvents: "No hay eventos",
      more: (n) => `+${n} mas`,
    },
  }}

  // Custom slots (component overrides)
  slots={{
    toolbar: MyToolbar,
    dayCell: MyDayCell,
    timeEvent: MyTimeEvent,
    allDayEvent: MyAllDayEvent,
    agendaEvent: MyAgendaEvent,
    popover: MyPopover,
  }}

  className="my-custom-class"
/>
```

## CalendarEvent interface

```ts
interface CalendarEvent {
  id: string;                   // unique identifier — required
  title: string;
  start: DateTimeString;        // "YYYY-MM-DDTHH:mm:ss"
  end: DateTimeString;
  allDay?: boolean;
  color?: string;               // CSS color for the event
  recurrence?: RecurrenceRule;  // RFC 5545 RRULE
  exDates?: DateString[];       // exception dates for recurrence
  recurringEventId?: string;    // set on expanded instances
  originalDate?: DateString;    // set on expanded instances
  [key: string]: unknown;       // custom fields allowed
}
```

## Recurrence (RFC 5545)

The calendar does NOT auto-expand recurring events. You must call `expandRecurringEvents()` before passing events to `<Calendar />`:

```tsx
import { expandRecurringEvents } from "trud-calendar-core";

const baseEvents: CalendarEvent[] = [
  {
    id: "daily-standup",
    title: "Standup",
    start: "2026-03-01T09:00:00",
    end: "2026-03-01T09:15:00",
    recurrence: { freq: "daily" },
  },
  {
    id: "gym",
    title: "Gym",
    start: "2026-03-02T07:00:00",
    end: "2026-03-02T08:00:00",
    recurrence: { freq: "weekly", byDay: ["MO", "WE", "FR"] },
  },
];

// Expand within a visible range
const expanded = expandRecurringEvents(baseEvents, "2026-03-01", "2026-03-31");
// Each instance gets recurringEventId and originalDate properties

<Calendar events={expanded} />
```

### RecurrenceRule

```ts
interface RecurrenceRule {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;         // every N periods (default 1)
  count?: number;            // stop after N occurrences
  until?: DateString;        // stop after this date
  byDay?: RecurrenceDay[];   // "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU"
  byMonthDay?: number[];     // day of month (1-31)
  bySetPos?: number[];       // e.g., [-1] = last occurrence
}
```

## Custom slots

Override any visual part of the calendar. The parent handles all positioning — your slot only renders content.

### Slot props

```ts
// Toolbar
interface ToolbarSlotProps {
  currentDate: DateString;
  view: CalendarView;
  formattedDate: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
}

// Month day cell
interface DayCellSlotProps {
  date: DateString;
  isToday: boolean;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
}

// Week/Day time event — DO NOT set position: absolute, the parent wrapper handles it
interface TimeEventSlotProps {
  event: CalendarEvent;
  positioned: PositionedEvent;
}

// All-day event in week/day header
interface AllDayEventSlotProps {
  event: CalendarEvent;
  segment: EventSegment;
}

// Agenda list item
interface AgendaEventSlotProps {
  event: CalendarEvent;
}

// Event detail popover
interface PopoverSlotProps {
  event: CalendarEvent;
  onClose: () => void;
}
```

### Important: TimeEvent slot positioning

When creating a custom `timeEvent` slot, the WeekView wraps your component in an absolutely-positioned container. **Do NOT add your own absolute positioning** — just fill the container:

```tsx
// WRONG — double positioning, events will be tiny
function MyTimeEvent({ event, positioned }: TimeEventSlotProps) {
  return (
    <div style={{
      position: "absolute",           // DON'T DO THIS
      top: `${positioned.top}%`,      // The parent already does this
      height: `${positioned.height}%`,
    }}>
      {event.title}
    </div>
  );
}

// CORRECT — fill the parent container
function MyTimeEvent({ event }: TimeEventSlotProps) {
  return (
    <button style={{ width: "100%", height: "100%", borderRadius: "6px" }}>
      {event.title}
    </button>
  );
}
```

### Example: custom toolbar

```tsx
function MyToolbar({ view, onPrev, onNext, onToday, onViewChange, formattedDate }: ToolbarSlotProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px" }}>
      <div>
        <button onClick={onPrev}>Prev</button>
        <button onClick={onToday}>Today</button>
        <button onClick={onNext}>Next</button>
      </div>
      <span>{formattedDate}</span>
      <div>
        {(["month", "week", "day", "agenda"] as const).map((v) => (
          <button key={v} onClick={() => onViewChange(v)}>{v}</button>
        ))}
      </div>
    </div>
  );
}

<Calendar slots={{ toolbar: MyToolbar }} events={events} />
```

## Drag and drop

Enable with `enableDnD`. Uses Pointer Events API (works on touch devices):

```tsx
function App() {
  const [events, setEvents] = useState(initialEvents);

  return (
    <Calendar
      events={events}
      enableDnD
      onEventDrop={(event, newStart, newEnd) => {
        setEvents((prev) =>
          prev.map((e) => e.id === event.id ? { ...e, start: newStart, end: newEnd } : e)
        );
      }}
      onEventResize={(event, newStart, newEnd) => {
        setEvents((prev) =>
          prev.map((e) => e.id === event.id ? { ...e, start: newStart, end: newEnd } : e)
        );
      }}
    />
  );
}
```

Note: `enableDnD` gates event **move** only. Resize and slot selection (drag-to-create) work independently.

## Drag-to-create (slot selection)

```tsx
<Calendar
  events={events}
  onSlotSelect={(start, end) => {
    // User dragged across time slots
    const newEvent = {
      id: crypto.randomUUID(),
      title: "New Event",
      start,
      end,
    };
    setEvents((prev) => [...prev, newEvent]);
  }}
/>
```

## Undo/redo support

```tsx
import { useUndoableEvents } from "trud-calendar";

function App() {
  const {
    events,
    setEvents,
    onEventDrop,
    onEventResize,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoableEvents(initialEvents);

  return (
    <>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
      <Calendar
        events={events}
        enableDnD
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
      />
    </>
  );
}
```

## Multi-select and delete

```tsx
<Calendar
  events={events}
  enableMultiSelect          // Ctrl+click, Shift+click, Ctrl+A
  onEventsDelete={(deleted) => {
    // Triggered on Delete/Backspace key
    setEvents((prev) => prev.filter((e) => !deleted.some((d) => d.id === e.id)));
  }}
/>
```

## Theming with CSS variables

trud-calendar uses CSS variables prefixed with `--trc-`. Override them to match your design system:

```css
:root {
  --trc-primary: #6366f1;
  --trc-primary-foreground: #ffffff;
  --trc-background: #ffffff;
  --trc-foreground: #0a0a0a;
  --trc-muted: #f5f5f5;
  --trc-muted-foreground: #737373;
  --trc-border: hsl(0 0% 90%);
  --trc-accent: hsl(0 0% 96%);
  --trc-radius: 0.5rem;
  --trc-today-bg: hsl(262 80% 95%);
  --trc-today-text: hsl(262 80% 50%);
  --trc-event-default: hsl(262 80% 55%);
  --trc-hour-height: 4rem;
}

/* Dark mode */
.dark {
  --trc-background: #0a0a0a;
  --trc-foreground: #fafafa;
  --trc-muted: #262626;
  --trc-muted-foreground: #a3a3a3;
  --trc-border: hsl(0 0% 20%);
  --trc-accent: hsl(0 0% 15%);
}
```

If you use **shadcn/ui**, the calendar inherits your theme automatically — no extra CSS needed.

## Hooks (advanced / headless usage)

For building completely custom UIs, use hooks directly:

```tsx
import {
  CalendarProvider,
  useCalendarContext,
  useNavigation,
  useEvents,
  useCurrentTime,
  useDateFormat,
  useEventDrag,
  useEventResize,
  useSlotSelection,
  useGridKeyboard,
  useSwipeNavigation,
  useResponsiveView,
  useEventSelection,
  useVirtualScroll,
} from "trud-calendar";
```

### useCalendarContext()

Access all calendar state from within `<Calendar>` or `<CalendarProvider>`:

```tsx
const {
  state,           // { currentDate, view }
  visibleEvents,   // CalendarEvent[]
  locale,          // string (BCP 47)
  weekStartsOn,    // number
  onEventClick,    // callback
  onSlotClick,     // callback
  dayStartHour,    // number
  dayEndHour,      // number
  enableDnD,       // boolean
  labels,          // CalendarLabels
} = useCalendarContext();
```

## Core utilities

Import from `trud-calendar-core` for pure date/event logic:

```ts
import {
  // Date arithmetic
  addDays, addWeeks, addMonths,
  startOfWeek, startOfMonth, endOfMonth,
  eachDayOfRange, daysBetween,
  isSameDay, isSameMonth, isToday, isBefore, isAfter,
  dateInRange, rangesOverlap,

  // Formatting (uses Intl.DateTimeFormat)
  formatToolbarTitle, formatWeekdayShort, formatTime,
  formatTimeRange, formatAgendaDate,

  // Event operations
  sortEvents, filterEventsInRange, getEventsForDay,
  isMultiDayEvent, partitionEvents,
  computeTimePositions, groupEventsByDate,

  // Recurrence
  expandRecurringEvents, toRRuleString,

  // Undo/redo
  createUndoStack, pushState, undo, redo,
} from "trud-calendar-core";
```

## Responsive behavior

The calendar adapts automatically using container queries:

| Container width | Days shown (week view) | Behavior |
|----------------|----------------------|----------|
| < 640px | 1 day | Mobile layout |
| 640–1024px | 3 days | Tablet layout |
| > 1024px | 7 days | Full week |

Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) for additional customization, not media queries.

## Common patterns

### Controlled calendar with URL state

```tsx
function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get("date") || undefined;
  const view = searchParams.get("view") as CalendarView || undefined;

  return (
    <Calendar
      events={events}
      date={date}
      view={view}
      onDateChange={(d) => setSearchParams({ ...Object.fromEntries(searchParams), date: d })}
      onViewChange={(v) => setSearchParams({ ...Object.fromEntries(searchParams), view: v })}
    />
  );
}
```

### Event CRUD with backend

```tsx
function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  return (
    <Calendar
      events={events}
      enableDnD
      onEventClick={(event) => openEditModal(event)}
      onSlotSelect={async (start, end) => {
        const created = await api.createEvent({ title: "New", start, end });
        setEvents((prev) => [...prev, created]);
      }}
      onEventDrop={async (event, newStart, newEnd) => {
        await api.updateEvent(event.id, { start: newStart, end: newEnd });
        setEvents((prev) =>
          prev.map((e) => e.id === event.id ? { ...e, start: newStart, end: newEnd } : e)
        );
      }}
      onEventResize={async (event, newStart, newEnd) => {
        await api.updateEvent(event.id, { start: newStart, end: newEnd });
        setEvents((prev) =>
          prev.map((e) => e.id === event.id ? { ...e, start: newStart, end: newEnd } : e)
        );
      }}
      onEventsDelete={async (deleted) => {
        await Promise.all(deleted.map((e) => api.deleteEvent(e.id)));
        setEvents((prev) => prev.filter((e) => !deleted.some((d) => d.id === e.id)));
      }}
      enableMultiSelect
    />
  );
}
```
