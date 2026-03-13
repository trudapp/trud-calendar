# CLAUDE.md — Project instructions for AI assistants

This file provides context for Claude Code and other AI-assisted development tools. Contributors using Claude Code will automatically receive these instructions.

## Project overview

trud-calendar is a React calendar component library distributed as a pnpm monorepo:

- `packages/core` — Headless calendar logic (zero dependencies, framework-agnostic)
- `packages/react` — React components and hooks (depends on core)
- `apps/demo` — Interactive demo app (Vite + React)
- `apps/docs` — Documentation site (Astro/Starlight, EN + ES)
- `apps/storybook` — Component stories
- `e2e` — Playwright E2E tests

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages and apps
pnpm test             # Run unit tests (vitest)
pnpm lint             # Run ESLint
pnpm format           # Run Prettier
pnpm dev:demo         # Start demo app (localhost:5173)
pnpm dev:docs         # Start docs site
pnpm storybook        # Start Storybook
pnpm test:e2e         # Run Playwright E2E tests
```

Build packages only: `pnpm --filter "./packages/**" build`

## Architecture rules

### Dates
- ALL dates are **ISO 8601 strings** (`"2026-03-13T09:00:00"`), never `Date` objects
- Types: `DateString` = `"YYYY-MM-DD"`, `DateTimeString` = `"YYYY-MM-DDTHH:mm:ss"`
- Never use `new Date()` in the core package except in parsing utilities

### Core package
- Zero dependencies — no React, no lodash, nothing
- All functions must be **pure** — no side effects, no mutations
- Fully tree-shakeable — named exports only
- Types go in `packages/core/src/types/index.ts`
- Export everything from `packages/core/src/index.ts`

### React package
- Depends only on `react`, `react-dom`, and `trud-calendar-core`
- All interactions use **Pointer Events API** — never MouseEvent or HTML5 Drag API
- Use `touch-action: none` on interactive elements to prevent browser scroll during drag
- 5px movement threshold to distinguish clicks from drags
- Hooks go in `packages/react/src/hooks/`
- Components go in `packages/react/src/components/`
- Context providers go in `packages/react/src/context/`
- Export everything from `packages/react/src/index.ts`

### Styling
- Tailwind CSS v4 with `@source` directive
- All CSS variables use `--trc-` prefix
- Use `cn()` utility (at `packages/react/src/lib/cn.ts`) for conditional classes
- Support dark mode via `.dark` class on parent
- Auto-inherit shadcn/ui variables when present

### Recurrence
- RFC 5545 RRULE semantics
- The calendar does NOT auto-expand recurring events
- Consumers call `expandRecurringEvents(events, rangeStart, rangeEnd)` before passing to `<Calendar />`
- Generated instances have `recurringEventId` and `originalDate` properties
- Exception dates use `exDates` array on the parent event

## Code conventions

- TypeScript strict mode
- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`
- Tests use Vitest with `@testing-library/react` for hooks
- React hook tests go in `packages/react/src/__tests__/`
- Core logic tests go in `packages/core/src/__tests__/`
- No `any` types — use `unknown` and narrow
- Prefer `useCallback` and `useMemo` for handlers and computed values in components
- Use `vi.fn()` for mocks in tests

## Common pitfalls

- **Don't use `as` aliases in core exports** — `export { foo as bar }` breaks DTS generation with tsup. Export with the original name.
- **jsdom lacks `elementsFromPoint`** — polyfill it in test files that test drag hooks
- **jsdom lacks `PointerEvent`** — polyfill with `class PointerEvent extends MouseEvent` in test files
- **Don't import from relative paths across packages** — always import from `"trud-calendar-core"` in the react package
- **Responsive classes** — use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) not media queries
- **enableDnD gates event move only** — resize and slot selection work independently

## Documentation

When adding or changing public API:
1. Update `README.md` at the root
2. Update the English docs in `apps/docs/src/content/docs/en/`
3. Update the Spanish docs in `apps/docs/src/content/docs/es/`
4. If adding a new page, add it to the sidebar in `apps/docs/astro.config.mjs`
