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

## Backlog (not scheduled)

These are on the radar but not prioritized yet:

- **Timezone support** — Named timezone handling (America/New_York, etc.)
- **Print styling** — Print-optimized CSS with `@media print`
- **RTL support** — Right-to-left layout for Arabic, Hebrew, etc.
- **Year view** — Full year calendar grid
- **Multi-calendar** — Drag events between separate calendar instances
- **Flexible slot time limits** — Auto-expand time axis for out-of-bounds events
- **Custom toolbar buttons** — Inject arbitrary buttons into the toolbar
- **iCal export** — Export events to `.ics` format

---

## Versioning plan

| Milestone | Target version |
|-----------|---------------|
| Phase 1 complete | v0.2.0 |
| Phase 2 complete | v0.3.0 |
| Phase 3 complete | v0.4.0 (or v1.0.0-beta) |
| Phase 4 complete | v1.0.0 |
