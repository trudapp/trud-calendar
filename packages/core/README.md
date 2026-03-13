# trud-calendar-core

Headless calendar engine — types, state, date utils, layout algorithms, recurrence. **Zero dependencies.**

This is the framework-agnostic core of [trud-calendar](https://www.npmjs.com/package/trud-calendar). Use it to build calendar UIs in any framework — React, Vue, Svelte, Angular, or vanilla JS.

## Installation

```bash
npm install trud-calendar-core
```

## What's included

- **Types** — `CalendarEvent`, `CalendarView`, `DateString`, `PositionedEvent`, `EventSegment`, `RecurrenceRule`, `UndoStack`, `VirtualRange`
- **Date utils** — `addDays`, `startOfWeek`, `startOfMonth`, `isSameDay`, `eachDayOfRange`, `getVisibleRange`, ...
- **Formatting** — `formatToolbarTitle`, `formatTime`, `formatTimeRange`, `formatAgendaDate` (all via `Intl`)
- **Event utils** — `sortEvents`, `filterEventsInRange`, `segmentMultiDayEvent`, `computeTimePositions`, `groupEventsByDate`
- **Recurrence** — `expandRecurringEvents`, `generateOccurrences` (RFC 5545 RRULE)
- **Undo/Redo** — `createUndoStack`, `pushState`, `undo`, `redo` (generic, framework-agnostic)
- **Virtualization** — `filterVisibleEvents`, `scrollToViewportRange`
- **Layout** — `buildOverlapGroups`, `assignColumns`, `computeTimePositions` (column-packing)
- **State** — `calendarReducer`, `createInitialState`

## Quick example

```ts
import {
  getVisibleRange,
  filterEventsInRange,
  computeTimePositions,
  formatTime,
} from "trud-calendar-core";

const range = getVisibleRange("2026-03-13", "week", 1);
const visible = filterEventsInRange(events, range.start, range.end);
const positioned = computeTimePositions(timedEvents, 8, 20);

for (const { event, top, height, column, totalColumns } of positioned) {
  console.log(`${formatTime(event.start, "en-US")} ${event.title}`);
}
```

All dates use **ISO 8601 strings** — no `Date` objects.

## Documentation

Full docs at [github.com/trudapp/trud-calendar](https://github.com/trudapp/trud-calendar)

## License

MIT
