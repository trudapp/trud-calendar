# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
