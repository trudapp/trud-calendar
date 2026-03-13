import type { Meta, StoryObj } from "@storybook/react";
import { Calendar } from "trud-calendar";
import { sampleEvents } from "./sample-events";

const meta: Meta<typeof Calendar> = {
  title: "Calendar",
  component: Calendar,
  decorators: [
    (Story) => (
      <div style={{ height: "90vh", padding: "1rem" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const MonthView: Story = {
  args: {
    events: sampleEvents,
    defaultView: "month",
  },
};

export const WeekView: Story = {
  args: {
    events: sampleEvents,
    defaultView: "week",
  },
};

export const DayView: Story = {
  args: {
    events: sampleEvents,
    defaultView: "day",
  },
};

export const AgendaView: Story = {
  args: {
    events: sampleEvents,
    defaultView: "agenda",
  },
};

export const NoEvents: Story = {
  args: {
    events: [],
    defaultView: "month",
  },
};

export const DarkMode: Story = {
  args: {
    events: sampleEvents,
    defaultView: "month",
  },
  decorators: [
    (Story) => (
      <div className="dark" style={{ height: "90vh", padding: "1rem" }}>
        <Story />
      </div>
    ),
  ],
};

export const MondayStart: Story = {
  args: {
    events: sampleEvents,
    defaultView: "month",
    locale: { weekStartsOn: 1 },
  },
};

export const SpanishLocale: Story = {
  args: {
    events: sampleEvents,
    defaultView: "month",
    locale: { locale: "es-ES", weekStartsOn: 1 },
  },
};

/**
 * Calendar with custom CSS variable overrides for a warm, earthy color scheme.
 * Demonstrates how to theme the calendar purely through CSS custom properties.
 */
export const CustomColors: Story = {
  decorators: [
    (Story) => (
      <div
        style={{
          height: "90vh",
          padding: "1rem",
          // Warm earthy palette
          ["--trc-background" as string]: "#fdf6e3",
          ["--trc-foreground" as string]: "#3c2415",
          ["--trc-muted" as string]: "#f5e6cc",
          ["--trc-muted-foreground" as string]: "#8b7355",
          ["--trc-border" as string]: "#d4b896",
          ["--trc-primary" as string]: "#b45309",
          ["--trc-primary-foreground" as string]: "#fffbeb",
          ["--trc-accent" as string]: "#fef3c7",
          ["--trc-accent-foreground" as string]: "#78350f",
          ["--trc-card" as string]: "#fffbeb",
          ["--trc-card-foreground" as string]: "#3c2415",
          ["--trc-ring" as string]: "#b45309",
          ["--trc-today-bg" as string]: "#fde68a",
          ["--trc-today-text" as string]: "#92400e",
          ["--trc-event-default" as string]: "#d97706",
          ["--trc-current-time" as string]: "#dc2626",
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    events: sampleEvents,
    defaultView: "week",
  },
};

/**
 * Calendar inside a shadcn-style theme wrapper. When the parent page provides
 * shadcn CSS variables (`--background`, `--foreground`, `--primary`, etc.),
 * trud-calendar automatically inherits them through its fallback chain.
 *
 * This story simulates a shadcn "Zinc" dark theme.
 */
export const ShadcnIntegration: Story = {
  decorators: [
    (Story) => (
      <div
        style={{
          height: "90vh",
          padding: "1.5rem",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          // Simulate shadcn Zinc dark theme variables
          // trud-calendar picks these up via var(--background, fallback) etc.
          ["--background" as string]: "#09090b",
          ["--foreground" as string]: "#fafafa",
          ["--muted" as string]: "#27272a",
          ["--muted-foreground" as string]: "#a1a1aa",
          ["--border" as string]: "#27272a",
          ["--primary" as string]: "#fafafa",
          ["--primary-foreground" as string]: "#18181b",
          ["--accent" as string]: "#27272a",
          ["--accent-foreground" as string]: "#fafafa",
          ["--card" as string]: "#09090b",
          ["--card-foreground" as string]: "#fafafa",
          ["--ring" as string]: "#d4d4d8",
          ["--radius" as string]: "0.5rem",
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
          borderRadius: "0.75rem",
        }}
      >
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            color: "#a1a1aa",
          }}
        >
          Simulated <strong style={{ color: "#fafafa" }}>shadcn/ui</strong> Zinc
          dark theme &mdash; the calendar inherits all shadcn CSS variables
          automatically.
        </div>
        <div style={{ flex: 1, height: "calc(90vh - 4rem)" }}>
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    events: sampleEvents,
    defaultView: "month",
  },
};
