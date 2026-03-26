# trud-calendar

[Documentation](https://trud-calendar-docs.vercel.app/) | [Playground](https://trud-calendar-docs.vercel.app/playground/) | [npm](https://www.npmjs.com/package/trud-calendar)

The most complete open-source React calendar. Google Calendar-level UX with a dead-simple API. MIT licensed, zero config, works everywhere.

> **Resource views free.** Other libraries charge $500+/year for resource scheduling. We include it at no cost.

## Why trud-calendar?

| | trud-calendar | FullCalendar | react-big-calendar | vkurko/calendar |
|---|:---:|:---:|:---:|:---:|
| **5 views** (month/week/day/agenda/year) | **Free** | Free | 4 views | 4 views |
| **Resource views** | **Free** | $500+/yr | No | Free |
| **Drag & drop + resize** (both edges) | **Free** | Free | Limited | Plugin |
| **Recurring events (RRULE)** | **Built-in** | Plugin | No | No |
| **TypeScript strict** | **Native** | Yes | Yes | No |
| **React hooks API** | **15+ hooks** | Wrapper | No | No |
| **Zero-dep headless core** | **Yes** | No | No | No |
| **RTL + Print CSS** | **Built-in** | Partial | No | No |
| **iCal export** | **Built-in** | No | No | No |
| **Bundle size** | **~95kb** | ~200kb+ | ~90kb | ~35kb |

## Install

```bash
npm install trud-calendar
# or
pnpm add trud-calendar
```

**Peer dependencies:** `react >=18`, `react-dom >=18`

### AI-assisted setup

Using [Claude Code](https://claude.com/claude-code), [Cursor](https://cursor.com), or any AI coding agent?

```bash
npx skills add trudapp/trud-calendar
```

Your AI will know every prop, slot, hook, and pattern — no docs needed.

### CSS setup

```css
@import "tailwindcss";
@source "../node_modules/trud-calendar/dist";
@import "trud-calendar/styles.css"; /* optional if using shadcn — variables auto-inherit */
```

Without Tailwind: just `@import "trud-calendar/styles.css"`.

## Quick start

```tsx
import { Calendar } from "trud-calendar";

<Calendar
  events={[
    { id: "1", title: "Meeting", start: "2026-03-25T09:00:00", end: "2026-03-25T10:00:00" },
    { id: "2", title: "Lunch", start: "2026-03-25T12:00:00", end: "2026-03-25T13:00:00", color: "#10b981" },
  ]}
  enableDnD
  onEventDrop={(event, newStart, newEnd) => updateEvent(event.id, newStart, newEnd)}
  onEventResize={(event, newStart, newEnd) => updateEvent(event.id, newStart, newEnd)}
/>
```

That's it. Month view, English locale, full drag & drop. Zero config.

## Feature highlights

### 5 views

```ts
type CalendarView = "month" | "week" | "day" | "agenda" | "year";
```

Year view shows a 12-month overview with event dots. Click any day to jump to day view.

### Resource scheduling (free)

```tsx
<Calendar
  events={events}
  resources={[
    { id: "room-a", title: "Room A", color: "#3b82f6" },
    { id: "room-b", title: "Room B", color: "#22c55e" },
  ]}
  defaultView="day"
  enableDnD
  onEventDrop={(event, newStart, newEnd, extra) => {
    // extra?.resourceId — the new resource after drag
  }}
/>
```

Just add `resources` — day/week views automatically become resource columns. Drag events between resources.

### Interactions

- **Drag & drop** — move events across days and time slots with snapped preview
- **Resize from both edges** — drag top or bottom handle to change start/end time
- **Drag-to-create** — drag across empty slots to select a time range
- **Configurable snap** — `snapDuration={30}` for 30-minute increments (5/10/15/30/60)
- **Constraints** — `dragConstraint`, `resizeConstraint`, `selectConstraint` return `false` to block
- **Auto-scroll** — container scrolls when dragging near edges
- **Long press** — `longPressDelay={300}` for touch devices
- **Multi-select** — Ctrl/Shift+click to select multiple events
- **Undo/redo** — `useUndoableEvents()` with Ctrl+Z/Y

### Background events & business hours

```tsx
const events = [
  { id: "bh", title: "Business Hours", start: "...T09:00:00", end: "...T17:00:00", display: "background", color: "#22c55e" },
  // ...regular events
];
```

### View customization

```tsx
<Calendar
  events={events}
  hiddenDays={[0, 6]}           // Hide weekends
  showWeekNumbers                // ISO week numbers
  highlightedDates={["2026-12-25"]}  // Highlight specific dates
  validRange={{ start: "2026-01-01", end: "2026-12-31" }}  // Restrict navigation
  flexibleSlotTimeLimits        // Auto-expand time grid for out-of-bounds events
  dayStartHour={8}
  dayEndHour={20}
/>
```

### Custom toolbar buttons

```tsx
<Calendar
  events={events}
  customButtons={[
    { key: "export", text: "Export .ics", onClick: () => downloadICal(events) },
    { key: "print", text: "Print", onClick: () => window.print() },
  ]}
/>
```

### Recurring events (RFC 5545)

```tsx
const events = [
  {
    id: "standup",
    title: "Daily Standup",
    start: "2026-03-25T09:00:00",
    end: "2026-03-25T09:30:00",
    recurrence: { freq: "daily" },
    exDates: ["2026-03-28"], // Skip this date
  },
];
```

### iCal export

```ts
import { eventsToICal, downloadICal } from "trud-calendar-core";

downloadICal(events, "my-calendar.ics"); // Browser download
const icsString = eventsToICal(events);  // Get .ics content
```

### Async event sources

```tsx
import { useEventSources, useCalendar } from "trud-calendar";

const { visibleRange } = useCalendar();
const { events, isLoading, refetch } = useEventSources({
  sources: [
    { url: "/api/events" },
    { fetcher: (start, end) => fetchTeamEvents(start, end) },
  ],
  start: visibleRange.start,
  end: visibleRange.end,
});
```

Range-based caching, deduplication, loading state.

### External drag-in

```tsx
import { useExternalDrag } from "trud-calendar";

const { makeDraggable, dropTargetProps } = useExternalDrag({
  onExternalDrop: (info) => createEvent(info.day, info.start, info.resourceId, info.data),
});

<div {...makeDraggable({ taskId: "123" })}>Drag me to calendar</div>
<div {...dropTargetProps}><Calendar events={events} /></div>
```

### Slots API — replace any component

```tsx
<Calendar
  events={events}
  slots={{
    toolbar: MyToolbar,        // Full toolbar control (receives customButtons, canGoPrev/canGoNext)
    dayCell: MyDayCell,        // Month view cells
    timeEvent: MyTimeEvent,    // Week/day event cards
    allDayEvent: MyAllDay,     // All-day row events
    popover: MyPopover,        // Event detail popover
    agendaEvent: MyAgenda,     // Agenda list items
    resourceHeader: MyResHdr,  // Resource column headers
  }}
/>
```

### i18n — any locale, zero extra deps

```tsx
<Calendar events={events} locale={{ locale: "ja-JP", weekStartsOn: 1 }} />
```

All formatting via native `Intl` API. 50+ locales supported.

### Theming

- Auto-inherits **shadcn/ui** CSS variables
- **Dark mode** — just add `.dark` class to parent
- **RTL** — add `dir="rtl"` to parent
- **Print** — `@media print` CSS built-in
- 16+ CSS variables (`--trc-*`) for full control

### 15+ React hooks

`useCalendar`, `useNavigation`, `useEvents`, `useEventLayout`, `useCurrentTime`, `useDateFormat`, `useEventDrag`, `useEventResize`, `useSlotSelection`, `useGridKeyboard`, `useUndoableEvents`, `useEventSelection`, `useResponsiveView`, `useSwipeNavigation`, `useVirtualScroll`, `useAutoScroll`, `useEventSources`, `useExternalDrag`

### Zero-dep headless core

```bash
npm install trud-calendar-core
```

All calendar logic as pure TypeScript functions — date utils, event layout, recurrence expansion, iCal export, resource grouping. Use in any framework.

## Architecture

```
packages/core    — Zero dependencies, pure functions, framework-agnostic
packages/react   — React components and hooks (depends only on core + react)
```

- **TypeScript strict** — no `any`, full type inference
- **Tree-shakeable** — named exports only
- **Pointer Events API** — mouse + touch + stylus, no HTML5 Drag
- **All dates are ISO 8601 strings** — serializable, memoizable
- **319 tests** across 22 test files

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
