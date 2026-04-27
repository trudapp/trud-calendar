# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] - 2026-04-26

First production-ready release. Phases 1–6 complete; the library is now feature-complete against its design goals (Google Calendar-level UX, MIT license, shadcn-compatible, headless core).

### Added — ResourceTimeline view (Phase 3.3 + 3.4)

- New `view="timeline"` — opt-in horizontal scheduling layout with resources as rows and time on the X axis.
- `<ResourceTimeline>` component exported from `trud-calendar`. Sticky resource column on the left, sticky hour header on top, vertical now-line when the visible day is today.
- Pointer interactions matching the rest of the calendar (5px click-vs-drag threshold, snapping, constraints):
  - Drag horizontally to change time within the same resource.
  - Drag vertically to reassign across resources — `onEventDrop` receives `extra.resourceId` only when changed.
  - Right-edge resize for end time. Min duration `snapDuration`, max `dayEndHour`.
  - Slot click fires `onSlotClick(\`${day}T${slotClickTime}\`, { resourceId })`.
- `displayTimeZone`-aware time labels and now-line position; drag/resize results returned in each event's anchored zone via `anchorTimesToEventZone`.
- New core util `computeTimelinePositions(events, resourceIds, day, dayStartHour, dayEndHour)` exposing `leftPct` / `widthPct` / `row` / `totalRows` / `isSegmentStart` / `isSegmentEnd` for any custom horizontal layouts.
- New type `TimelinePositionedEvent` and added `"timeline"` to `CalendarView` / `CalendarLabels` / `VIEWS`.
- New documentation page: [Resource Timeline](/resource-timeline/) (EN + ES).

### Added — TZ-aware time-grid positioning (Phase 6.7)

- `computeTimePositions(events, dayStartHour, dayEndHour, displayTimeZone?)` accepts an optional display zone. When the event has its own `timeZone` and `displayTimeZone` is set, `eventWallToDisplay` converts start/end before computing top/height.
- `useEventLayout`, `WeekView`, and `ResourceTimeGrid` now consume `displayTimeZone` from `CalendarContext`.
- An NY-anchored event at 9:00 AM EDT viewed in `displayTimeZone="Asia/Tokyo"` previously showed the label "10:00 PM" but rendered at the 9 AM row — labels and geometry now agree.
- Floating events (no `timeZone`) and the no-`displayTimeZone` case are unchanged. Fully backwards-compatible.
- 8 new tests (6 core, 2 hook) and 1 E2E geometry test.

### Added — Demo timezone playground

- Display TZ selector with 8 IANA zones plus "Browser default" persisted to `localStorage`.
- "Anchor events to NY" toggle that stamps every event with `timeZone: "America/New_York"` to demo Google Calendar–style wall-clock anchoring across display zones.
- Fourth resource (Room D) for richer ResourceTimeline demos.

### Added — End-to-end test coverage

- 25 new Playwright specs: timezones (display selector, anchor mode, NY → UTC/Tokyo/Kolkata conversions, geometry), ResourceTimeline (rows, time axis, drag horizontal/vertical, slot click), ResourceTimeGrid (Day & Week resource columns, drag between resources, toggle off).
- Repaired 11 pre-existing specs that drifted as features evolved (recurring scope dialog, modal selectors, viewport sizing for container queries).
- Suite is **59/59 green in ~6.5s**.

### Fixed

- Time-grid positioning of timezone-anchored events now uses display-zone wall-clock (previously literal). Resolves the only known limitation noted in v0.5.0.

### Known limitations carried into v1.0

- **ResourceTimeline (horizontal Gantt)** still positions anchored events by literal wall-clock; tracked in backlog separately from time-grid Phase 6.7.
- **Cross-day re-bucketing** — when an anchored event's display-zone wall-clock falls on a different calendar day than its literal start (e.g. NY 11 PM = Tokyo 12 PM next day), it currently stays in its literal day's column.
- **Resize from the left edge** is not yet implemented in the timeline.
- **Drag-to-create slot selection** (`onSlotSelect`) is not yet wired on the timeline; `onSlotClick` works.
- **Multi-day timeline scales** (week/month with horizontal time spanning days) are deferred.

## [0.6.0] — superseded by 1.0.0

Phase 6.7 (TZ-aware time-grid positioning) shipped to `main` but was rolled into the 1.0.0 release before publication. See entries above.

## [0.5.0] - 2026-04-26

## [0.5.0] - 2026-04-26

### Added — IANA timezone support (Phase 6)

- `CalendarEvent.timeZone?: string` — optional IANA zone with RFC 5545 TZID semantics. Floating events (no `timeZone`) preserved as backwards-compatible default.
- `CalendarConfig.displayTimeZone?: string` — IANA zone in which times are rendered. Defaults to the runtime's local zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
- New core utilities (zero-dep, built on `Intl.DateTimeFormat` with cached DTF instances):
  - `getTimeZoneOffset(utc, tz)` — minutes east of UTC
  - `wallTimeToUtc(wall, tz, opts?)` and `utcToWallTime(utc, tz)` — wall-clock ⇄ UTC, with `{ ambiguous, invalid }` options for DST overlap and gap resolution
  - `convertWallTime(wall, fromTz, toTz, opts?)` — direct cross-zone conversion preserving the absolute instant
  - `listTimeZones()` — every supported IANA zone plus `"UTC"` (which `Intl.supportedValuesOf` excludes by spec); 80-zone curated fallback for older runtimes
  - `isValidTimeZone(tz)` — cached validation
  - `getTimeZoneAbbreviation(tz, atInstant?)` — `"EST"`, `"EDT"`, `"GMT+5:30"`, etc.
  - `getBrowserTimeZone()` — runtime's local zone with safe UTC fallback
  - `eventWallToDisplay`, `displayWallToEvent` — used by the React layer; floating events pass through unchanged
- Drag and resize on anchored events now report new wall-clocks in the event's anchored zone (matches Google Calendar). Floating events keep existing semantics.
- Recurring events anchored to a zone preserve their wall-clock across DST transitions (RFC 5545 TZID).
- New documentation page: [Timezones](/timezones/) (EN + ES).
- 76 new tests (319 → 401): timezone offsets across NY/Berlin/Sydney/Tokyo/Kolkata/Kathmandu/Auckland, DST gaps and overlaps in both hemispheres, round-trip identity, half- and quarter-hour offsets, helper functions, and recurring TZ propagation.

### Known limitation

- Anchored events with a `timeZone` different from the calendar's `displayTimeZone` render time labels in the display zone but are positioned in the time grid using their literal wall-clock. The position-conversion pass over the layout pipeline is planned for v1.0.0. Single-zone calendars (the common case) are unaffected.

## [0.4.0]

### Added

- Undo/Redo system — generic `UndoStack<T>` in core + `useUndoableEvents` React hook with Ctrl+Z/Y shortcuts
- Multi-select events — `useEventSelection` hook + `SelectionProvider` context with Ctrl/Shift+click, Delete to remove, Escape to clear
- Mobile responsive layout — `useResponsiveView` (ResizeObserver) with adaptive 1/3/7 day columns, compact month cells
- Swipe navigation — `useSwipeNavigation` (Pointer Events, touch-only) for prev/next on mobile
- Virtual scrolling — `filterVisibleEvents` + `scrollToViewportRange` in core, `useVirtualScroll` hook in React
- 117 new React hook unit tests (useCalendar, useNavigation, useEvents, useEventLayout, useCurrentTime, useDateFormat, useEventDrag, useEventResize, useSlotSelection, useGridKeyboard)
- 33 E2E tests with Playwright (navigation, events, drag-and-drop, keyboard, recurrence, views, dark mode)
- 16 interactive Storybook stories (Interactions, Recurrence, Views, Accessibility, Custom themes)
- CI/CD pipeline — GitHub Actions for build/lint/test (Node 18/20/22 matrix) + automated npm publishing on tags
- Claude PR review action — automated code review on pull requests
- CLAUDE.md — AI assistant project instructions for contributors
- Open source community files — CONTRIBUTING.md, CODE_OF_CONDUCT.md, issue templates, PR template, SECURITY.md

## [0.1.0] - 2026-03-13

### Added

- Initial release
- 4 calendar views: Month, Week, Day, Agenda
- Drag & drop event moving with Pointer Events API (mouse + touch + stylus)
- Event resize in Week/Day view
- Drag-to-create (slot selection) in Week/Day view
- Recurrence engine (RFC 5545 RRULE): daily, weekly, monthly, yearly
  - Supports interval, byDay, byMonthDay, bySetPos, count, until
  - Exception dates (exDates) for excluding single occurrences
  - `expandRecurringEvents()` for generating instances in a date range
- Multi-day timed event segmentation in Week/Day view
- Keyboard navigation (WAI-ARIA grid pattern)
  - Arrow keys, Home/End, Enter/Space, Escape
  - Roving tabindex across all views
- Full i18n via native Intl API + customizable labels
- Dark mode with CSS variables
- shadcn/ui theme compatibility (auto-inherits variables)
- Slots API: replace toolbar, dayCell, timeEvent, allDayEvent, popover, agendaEvent
- Headless core package (trud-calendar-core) — zero dependencies
- Controlled and uncontrolled modes for date and view
- Configurable day start/end hours
- Column-packing algorithm for overlapping events
- Current time indicator in Week/Day views
