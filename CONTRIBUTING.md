# Contributing to trud-calendar

Thanks for your interest in contributing! This guide will help you get started.

## Development setup

**Prerequisites:** Node.js >= 18, pnpm >= 10

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/trud-calendar.git
cd trud-calendar

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start the demo app
pnpm dev:demo

# Start the docs site
pnpm dev:docs

# Start Storybook
pnpm storybook
```

## Project structure

```
packages/
  core/       # Headless calendar logic — zero dependencies, framework-agnostic
  react/      # React components and hooks
apps/
  demo/       # Interactive demo app (Vite + React)
  docs/       # Documentation site (Astro/Starlight, EN + ES)
  storybook/  # Component stories
e2e/          # Playwright E2E tests
```

## How to contribute

1. **Fork** the repo and create a branch from `main`
2. Make your changes
3. Write or update tests
4. Run `pnpm build && pnpm test` to verify everything passes
5. Open a **Pull Request** with a clear description

## Code style

- **TypeScript** strict mode everywhere
- **ESLint + Prettier** — run `pnpm lint` and `pnpm format`
- **Pure functions** in `packages/core` — no side effects, fully tree-shakeable
- **CSS variables** — use `--trc-*` prefix for all styling
- **ISO 8601 strings** — all dates are strings, never `Date` objects
- **Pointer Events API** — for all mouse/touch interactions

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add multi-select event support
fix: correct timezone offset in week view
docs: update recurrence examples
test: add useEventDrag unit tests
chore: update dependencies
```

## Pull request guidelines

- **One feature or fix per PR** — keep it focused
- **Update docs** if you add or change public API
- **Add tests** for new features
- **Make sure CI passes** — build, lint, and tests must all be green

## Reporting bugs

Open a [GitHub Issue](https://github.com/trudcalendar/trud-calendar/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- Browser, OS, and trud-calendar version

## Feature requests

Open an issue with the `enhancement` label. Describe the problem and your proposed solution.

## Code of Conduct

This project follows the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Be respectful and constructive in all interactions.
