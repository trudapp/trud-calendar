import type { Meta, StoryObj } from "@storybook/react";
import { Calendar } from "trud-calendar";
import { sampleEvents } from "./sample-events";

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Calendar> = {
  title: "Accessibility",
  component: Calendar,
  decorators: [
    (Story) => (
      <div style={{ height: "90vh", padding: "1rem" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    defaultView: {
      control: "select",
      options: ["month", "week", "day", "agenda"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Demonstrates keyboard navigation within the calendar. Use the keyboard
 * shortcuts listed below to navigate.
 *
 * | Key           | Action                                    |
 * |---------------|-------------------------------------------|
 * | Arrow keys    | Move focus between cells / time slots      |
 * | Enter / Space | Select the focused cell or event           |
 * | Tab           | Move focus to the next interactive element |
 * | Escape        | Close popover / deselect                   |
 */
export const KeyboardNavigation: Story = {
  decorators: [
    (Story) => (
      <div style={{ display: "flex", flexDirection: "column", height: "90vh", padding: "1rem", gap: "1rem" }}>
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "0.5rem",
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.875rem",
            lineHeight: "1.6",
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.5rem", color: "#0c4a6e" }}>
            Keyboard Navigation Guide
          </strong>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              {[
                ["Arrow keys", "Move focus between cells / time slots"],
                ["Enter / Space", "Select the focused cell or event"],
                ["Tab", "Move focus to the next interactive element"],
                ["Shift+Tab", "Move focus to the previous interactive element"],
                ["Escape", "Close popover / deselect"],
              ].map(([key, desc]) => (
                <tr key={key}>
                  <td
                    style={{
                      padding: "0.25rem 1rem 0.25rem 0",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      color: "#1e3a5f",
                    }}
                  >
                    <kbd
                      style={{
                        background: "#e0f2fe",
                        padding: "0.125rem 0.375rem",
                        borderRadius: "0.25rem",
                        border: "1px solid #7dd3fc",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {key}
                    </kbd>
                  </td>
                  <td style={{ padding: "0.25rem 0", color: "#334155" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    events: sampleEvents,
    defaultView: "week",
  },
};

/**
 * A high-contrast theme achieved by overriding `--trc-*` CSS variables.
 * This demonstrates how the calendar adapts to accessibility-focused
 * color schemes without any code changes.
 */
export const HighContrast: Story = {
  decorators: [
    (Story) => (
      <div
        style={{
          height: "90vh",
          padding: "1rem",
          // High-contrast CSS variable overrides
          ["--trc-background" as string]: "#000000",
          ["--trc-foreground" as string]: "#ffffff",
          ["--trc-muted" as string]: "#1a1a1a",
          ["--trc-muted-foreground" as string]: "#e0e0e0",
          ["--trc-border" as string]: "#ffffff",
          ["--trc-primary" as string]: "#ffff00",
          ["--trc-primary-foreground" as string]: "#000000",
          ["--trc-accent" as string]: "#333333",
          ["--trc-accent-foreground" as string]: "#ffffff",
          ["--trc-card" as string]: "#0a0a0a",
          ["--trc-card-foreground" as string]: "#ffffff",
          ["--trc-ring" as string]: "#ffff00",
          ["--trc-today-bg" as string]: "#003300",
          ["--trc-today-text" as string]: "#00ff00",
          ["--trc-event-default" as string]: "#ffff00",
          ["--trc-current-time" as string]: "#ff0000",
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
