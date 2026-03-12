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
