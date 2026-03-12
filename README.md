# trud-calendar

A beautiful, fully-featured React calendar component. Google Calendar-level UX, MIT license, shadcn-compatible, zero-config theming.

## Features

- **4 views**: Month, Week, Day, Agenda
- **Overlap handling**: Column-packing algorithm for overlapping events
- **Multi-day events**: Spanning pills in month view, all-day row in week/day
- **i18n**: Native `Intl` API — zero moment/date-fns dependency
- **Theming**: CSS variables with shadcn fallback chain — works standalone or inherits your theme
- **Dark mode**: Works out of the box via `.dark` class
- **Slots pattern**: Replace any sub-component (toolbar, event pill, popover, etc.)
- **Headless core**: `trud-calendar-core` is framework-agnostic with zero dependencies
- **Tiny footprint**: ~40KB (react) + ~12KB (core) unminified

## Quick Start

```bash
npm install trud-calendar
```

```tsx
import { Calendar } from "trud-calendar";
import "trud-calendar/styles.css";

function App() {
  return (
    <Calendar
      events={[
        {
          id: "1",
          title: "Team Standup",
          start: "2024-06-15T09:00:00",
          end: "2024-06-15T09:30:00",
          color: "#3b82f6",
        },
      ]}
      defaultView="month"
      onEventClick={(event) => console.log(event)}
    />
  );
}
```

### Tailwind v4 users

Add the `@source` directive so Tailwind scans trud-calendar classes:

```css
@import "tailwindcss";
@source "../node_modules/trud-calendar/dist/**/*.js";
@import "trud-calendar/styles.css";
```

## API

### `<Calendar>` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `events` | `CalendarEvent[]` | `[]` | Events to display |
| `defaultView` | `CalendarView` | `"month"` | Initial view (uncontrolled) |
| `view` | `CalendarView` | — | Controlled view |
| `defaultDate` | `string` | today | Initial date (uncontrolled) |
| `date` | `string` | — | Controlled date (YYYY-MM-DD) |
| `locale` | `{ locale: string, weekStartsOn: 0-6 }` | `en-US`, Sun | Locale config |
| `slots` | `CalendarSlots` | — | Component overrides |
| `onEventClick` | `(event) => void` | popover | Event click handler |
| `onSlotClick` | `(date) => void` | — | Empty slot click |
| `onDateChange` | `(date) => void` | — | Date change callback |
| `onViewChange` | `(view) => void` | — | View change callback |
| `dayStartHour` | `number` | `0` | Time grid start hour |
| `dayEndHour` | `number` | `24` | Time grid end hour |
| `className` | `string` | — | Additional CSS classes |

### Hooks

```tsx
import { useCalendar, useNavigation, useEvents, useEventLayout, useCurrentTime, useDateFormat } from "trud-calendar";
```

All hooks must be used within a `<CalendarProvider>` context.

### Headless Core

```bash
npm install trud-calendar-core
```

```ts
import { computeTimePositions, getMonthViewRange, calendarReducer } from "trud-calendar-core";
```

Zero dependencies. All pure functions. Works in any framework.

## Theming

trud-calendar uses CSS variables that automatically inherit from shadcn/ui if present:

```css
--trc-background    /* falls back to --background or #ffffff */
--trc-foreground    /* falls back to --foreground or #0a0a0a */
--trc-primary       /* falls back to --primary or #171717 */
--trc-border        /* falls back to --border or #e5e5e5 */
/* ... and more */
```

Override any variable to customize:

```css
:root {
  --trc-event-default: #8b5cf6;
  --trc-today-bg: #fef3c7;
  --trc-today-text: #d97706;
}
```

## License

MIT
