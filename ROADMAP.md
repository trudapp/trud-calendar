# Roadmap — trud-calendar

> Feature tracking for the path to a top-tier React calendar library.
> Updated: 2026-03-25

## Legend

| Status | Meaning |
|--------|---------|
| `done` | Shipped and tested |
| `wip` | Work in progress |
| `todo` | Planned, not started |

---

## Current state (v0.1.x)

These features are already implemented and tested:

- **Views:** Month, Week, Day, Agenda
- **Interactions:** Drag & drop, event resize (bottom edge), slot selection (drag-to-create), click events/slots, swipe navigation
- **Events:** All-day, multi-day, overlapping (column-packing), per-event colors, recurring (RFC 5545 RRULE), exception dates, undo/redo
- **Customization:** 6 slot overrides (toolbar, dayCell, timeEvent, allDayEvent, popover, agendaEvent), 16+ CSS variables (`--trc-*`), dark mode, shadcn/ui compatibility
- **Navigation:** Today/prev/next, view switching, controlled & uncontrolled modes, keyboard (WAI-ARIA grid), swipe
- **i18n:** BCP 47 locales via `Intl`, configurable labels, week start day
- **Responsive:** Container queries, adaptive visible days (1/3/7), mobile-optimized spacing
- **Accessibility:** ARIA roles, roving tabindex, focus management, keyboard nav
- **Performance:** Memoization, virtual scrolling (opt-in), event filtering by range
- **Architecture:** Zero-dep core, TypeScript strict, tree-shakeable

---

## Phase 1 — Snap, Constraints & Quick Wins

> Goal: Improve interaction UX with low-effort, high-impact features.

| # | Feature | Status | Package | Description |
|---|---------|--------|---------|-------------|
| 1.1 | Configurable snap duration | `done` | core + react | `snapDuration` prop (5, 10, 15, 30, 60 min). Threaded through drag, resize, and slot selection. |
| 1.2 | Resize from start edge | `done` | react | Top resize handle on events in week/day view. Changes start time with same snap behavior. |
| 1.3 | Drag constraints | `done` | core + react | `dragConstraint` callback `(event, newStart, newEnd) => boolean` to validate drops. |
| 1.4 | Resize constraints | `done` | core + react | `resizeConstraint` callback `(event, newStart, newEnd) => boolean` to validate resizes. |
| 1.5 | Select constraints | `done` | core + react | `selectConstraint` callback `(start, end) => boolean` to validate slot selection. |
| 1.6 | Auto-scroll on drag | `done` | react | `useAutoScroll` hook scrolls container when pointer approaches edge during interactions. |
| 1.7 | Hidden days | `done` | core + react | `hiddenDays` prop `number[]` (0-6) excludes days from month, week, day, and agenda views. |

---

## Phase 2 — Background Events & Navigation Polish

> Goal: Support non-interactive visual markers and improve navigation control.

| # | Feature | Status | Package | Description |
|---|---------|--------|---------|-------------|
| 2.1 | Background events | `done` | core + react | `display: "background"` on events renders as colored time blocks behind regular events in week/day views. |
| 2.2 | Valid date range | `done` | core + react | `validRange: { start?, end? }` restricts navigation; prev/next buttons disabled at bounds. |
| 2.3 | Highlighted dates | `done` | core + react | `highlightedDates: DateString[]` adds accent background to specific dates in month grid and week headers. |
| 2.4 | Long press delay (mobile) | `done` | react | `longPressDelay` prop (ms) — touch drag requires hold before activating; mouse/stylus immediate. |
| 2.5 | Week numbers | `done` | core + react | `showWeekNumbers` displays ISO week numbers as left column in month view. `getISOWeekNumber` utility. |
| 2.6 | Configurable slot click time | `done` | core + react | `slotClickTime` prop (default `"09:00:00"`) controls the time used when clicking empty day cells in month view. |

---

## Phase 3 — Resource Views

> Goal: Add resource scheduling — the premium-tier feature that sets libraries apart.

| # | Feature | Status | Package | Description |
|---|---------|--------|---------|-------------|
| 3.1 | Resource data model | `done` | core | `Resource` type, `resourceId` on CalendarEvent, `EventDropExtra`. `flattenResources`, `getEventsForResource`, `groupEventsByResource` utilities. |
| 3.2 | ResourceTimeGrid view | `done` | react | `resources` prop auto-transforms day/week views into resource columns. Day mode: 1 col per resource. Week mode: days × resources grid. |
| 3.3 | ResourceTimeline view | `todo` | react | Horizontal timeline — resources as rows, time on X axis. Day/week/month durations. |
| 3.4 | Drag between resources | `done` | react | Drag detects `data-resource-id`. `onEventDrop`, `onSlotClick`, `onSlotSelect` receive `extra?.resourceId`. |
| 3.5 | Resource header slot | `done` | react | `resourceHeader` slot on CalendarSlots for custom resource label rendering. |

---

## Phase 4 — Data Fetching & External Drag

> Goal: Support real-world data patterns and advanced interactions.

| # | Feature | Status | Package | Description |
|---|---------|--------|---------|-------------|
| 4.1 | Event sources | `done` | react | `useEventSources` hook: fetch events from URL or async function per visible range. Merges multiple sources. |
| 4.2 | Lazy fetching with cache | `done` | react | Range-based cache in `useEventSources`. `refetch()` clears cache and re-fetches. |
| 4.3 | External drag-in | `done` | react | `useExternalDrag` hook: `makeDraggable` + `dropTargetProps` for HTML5 drag from outside onto calendar slots. |
| 4.4 | Loading state | `done` | react | `isLoading` and `onLoading` callback in `useEventSources`. |

---

## Phase 5 — World-Class Completeness

> Goal: Fill remaining gaps to match or exceed every competitor.

| # | Feature | Status | Package | Description |
|---|---------|--------|---------|-------------|
| 5.1 | Year view | `done` | core + react | Full 12-month grid, click day to navigate to day view. Event dots on days with events. |
| 5.2 | Flexible slot time limits | `done` | react | `flexibleSlotTimeLimits` auto-expands dayStartHour/dayEndHour when events fall outside range. |
| 5.3 | Custom toolbar buttons | `done` | core + react | `customButtons` prop injects buttons after the view switcher. |
| 5.4 | Print styling | `done` | react | `@media print` CSS hides toolbar, resize handles; makes content overflow visible. |
| 5.5 | RTL support | `done` | react | Auto-detected from `dir="rtl"` on parent. Flips borders, padding, text alignment. |
| 5.6 | iCal export | `done` | core | `eventsToICal()` and `downloadICal()` generate valid .ics files with RRULE support. |

---

## Phase 6 — Timezones

> Goal: First-class IANA timezone support without taking on any dependencies.

| # | Feature | Status | Package | Description |
|---|---------|--------|---------|-------------|
| 6.1 | Timezone utilities | `done` | core | `getTimeZoneOffset`, `wallTimeToUtc`, `utcToWallTime`, `convertWallTime`, `listTimeZones`, `isValidTimeZone`, `getTimeZoneAbbreviation`, `getBrowserTimeZone`, `eventWallToDisplay`, `displayWallToEvent`. Built on `Intl.DateTimeFormat`, zero deps. |
| 6.2 | Anchored events | `done` | core | Optional `CalendarEvent.timeZone` (RFC 5545 TZID semantics). Floating events (no zone) preserved as backwards-compatible default. |
| 6.3 | Display zone | `done` | react | `CalendarConfig.displayTimeZone` (defaults to runtime's local zone). Drives time formatting, now-line position, and drag/resize math. |
| 6.4 | TZ-aware drag/resize | `done` | react | When dragging or resizing an anchored event, `onEventDrop`/`onEventResize` receive new wall-clocks in the event's anchored zone (Google Calendar semantics). |
| 6.5 | DST safety | `done` | core | Spring-forward gaps shift forward by default (opt-in throw). Fall-back overlaps return earlier instant by default (opt-in later). |
| 6.6 | Recurring events through DST | `done` | core | Anchored recurring series preserves wall-clock across DST transitions, matching RFC 5545 TZID semantics. |
| 6.7 | TZ-aware time-grid positioning | `todo` | react | Convert event positions in week/day columns to display-zone wall-clock. Currently anchored events render at their literal wall-clock position; required for mixed-TZ calendars. |

---

## Backlog (not scheduled)

These are on the radar but not prioritized yet:

- **ResourceTimeline view** — Horizontal timeline with resources as rows, time on X axis
- **Multi-calendar** — Drag events between separate calendar instances

---

## Versioning plan

| Milestone | Target version |
|-----------|---------------|
| Phases 1-5 complete | v0.4.0 |
| Phase 6 (timezones) | **v0.5.0** (current) |
| Phase 6.7 + ResourceTimeline | v1.0.0 |
