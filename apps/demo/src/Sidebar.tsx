import { useState } from "react";

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  locale: string;
  onLocaleChange: (locale: string) => void;
  weekStartsOn: 0 | 1;
  onWeekStartChange: (v: 0 | 1) => void;
  enableDnD: boolean;
  onToggleDnD: () => void;
  enableSlots: boolean;
  onToggleSlots: () => void;
  onNewEvent: () => void;
  // Phase 1-5 props
  snapDuration: number;
  onSnapDurationChange: (v: number) => void;
  hiddenDays: number[];
  onHiddenDaysChange: (v: number[]) => void;
  showWeekNumbers: boolean;
  onToggleWeekNumbers: () => void;
  highlightedDates: string[];
  onToggleHighlightedDates: () => void;
  validRangeEnabled: boolean;
  onToggleValidRange: () => void;
  flexibleSlotTimeLimits: boolean;
  onToggleFlexibleLimits: () => void;
  longPressDelay: number;
  onLongPressDelayChange: (v: number) => void;
  enableResources: boolean;
  onToggleResources: () => void;
  enableBackgroundEvents: boolean;
  onToggleBackgroundEvents: () => void;
  enableConstraints: boolean;
  onToggleConstraints: () => void;
  dayStartHour: number;
  onDayStartHourChange: (v: number) => void;
  dayEndHour: number;
  onDayEndHourChange: (v: number) => void;
  displayTimeZone: string;
  onDisplayTimeZoneChange: (v: string) => void;
  anchorEvents: boolean;
  onToggleAnchorEvents: () => void;
}

const LOCALES = [
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Espanol" },
  { value: "fr-FR", label: "Francais" },
  { value: "de-DE", label: "Deutsch" },
  { value: "pt-BR", label: "Portugues (BR)" },
  { value: "ja-JP", label: "Japanese" },
];

const TIMEZONES = [
  { value: "browser", label: "Browser default" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New York (-5/-4)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (-8/-7)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (+1/+2)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (+9)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (+5:30)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (+10/+11)" },
];

const TABS = ["General", "Interactions", "Views", "Resources"] as const;
type Tab = (typeof TABS)[number];

export function Sidebar(props: SidebarProps) {
  const [tab, setTab] = useState<Tab>("General");

  return (
    <>
      {/* Backdrop for mobile */}
      {props.open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={props.onClose}
        />
      )}

      <aside
        className={`sidebar ${props.open ? "sidebar-open" : "sidebar-closed"}`}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-between md:hidden mb-4">
          <span className="text-sm font-semibold text-[var(--trc-foreground)]">Settings</span>
          <button
            onClick={props.onClose}
            className="text-[var(--trc-muted-foreground)] hover:text-[var(--trc-foreground)] text-xl leading-none"
            aria-label="Close sidebar"
          >
            &times;
          </button>
        </div>

        {/* New Event button */}
        <button
          onClick={() => {
            props.onNewEvent();
            props.onClose();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--trc-radius)] bg-[var(--trc-primary)] text-[var(--trc-primary-foreground)] hover:opacity-90 transition-opacity text-sm font-medium mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Event
        </button>

        {/* Tabs */}
        <div className="flex gap-0.5 mb-4 bg-[var(--trc-muted)] rounded-[var(--trc-radius)] p-0.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-[10px] font-medium py-1.5 rounded-[calc(var(--trc-radius)-2px)] transition-colors ${
                tab === t
                  ? "bg-[var(--trc-background)] text-[var(--trc-foreground)] shadow-sm"
                  : "text-[var(--trc-muted-foreground)] hover:text-[var(--trc-foreground)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-4 flex-1 overflow-y-auto">
          {tab === "General" && (
            <>
              <ControlRow label="Theme">
                <TogglePill
                  options={["Light", "Dark"]}
                  active={props.darkMode ? 1 : 0}
                  onChange={(i) => { if ((i === 1) !== props.darkMode) props.onToggleDarkMode(); }}
                />
              </ControlRow>

              <ControlRow label="Locale">
                <select
                  value={props.locale}
                  onChange={(e) => props.onLocaleChange(e.target.value)}
                  className="sidebar-select"
                >
                  {LOCALES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </ControlRow>

              <ControlRow label="Week starts on">
                <TogglePill
                  options={["Sun", "Mon"]}
                  active={props.weekStartsOn}
                  onChange={(i) => props.onWeekStartChange(i as 0 | 1)}
                />
              </ControlRow>

              <ControlRow label="Display timezone">
                <select
                  data-testid="display-timezone"
                  value={props.displayTimeZone}
                  onChange={(e) => props.onDisplayTimeZoneChange(e.target.value)}
                  className="sidebar-select"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </ControlRow>

              <ControlRow label="Custom Slots">
                <TogglePill
                  options={["Default", "Custom"]}
                  active={props.enableSlots ? 1 : 0}
                  onChange={(i) => { if ((i === 1) !== props.enableSlots) props.onToggleSlots(); }}
                />
              </ControlRow>

              <ControlRow label="Day Start Hour">
                <input
                  type="range"
                  min={0}
                  max={12}
                  value={props.dayStartHour}
                  onChange={(e) => props.onDayStartHourChange(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-[10px] text-[var(--trc-muted-foreground)]">{props.dayStartHour}:00</span>
              </ControlRow>

              <ControlRow label="Day End Hour">
                <input
                  type="range"
                  min={12}
                  max={24}
                  value={props.dayEndHour}
                  onChange={(e) => props.onDayEndHourChange(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-[10px] text-[var(--trc-muted-foreground)]">{props.dayEndHour}:00</span>
              </ControlRow>
            </>
          )}

          {tab === "Interactions" && (
            <>
              <ControlRow label="Drag & Drop">
                <TogglePill
                  options={["Off", "On"]}
                  active={props.enableDnD ? 1 : 0}
                  onChange={(i) => { if ((i === 1) !== props.enableDnD) props.onToggleDnD(); }}
                />
              </ControlRow>

              <ControlRow label="Snap Duration">
                <select
                  value={props.snapDuration}
                  onChange={(e) => props.onSnapDurationChange(Number(e.target.value))}
                  className="sidebar-select"
                >
                  {[5, 10, 15, 30, 60].map((v) => (
                    <option key={v} value={v}>{v} min</option>
                  ))}
                </select>
              </ControlRow>

              <ControlRow label="Constraints (9-17h only)">
                <TogglePill
                  options={["Off", "On"]}
                  active={props.enableConstraints ? 1 : 0}
                  onChange={(i) => { if ((i === 1) !== props.enableConstraints) props.onToggleConstraints(); }}
                />
              </ControlRow>

              <ControlRow label="Long Press Delay (touch)">
                <select
                  value={props.longPressDelay}
                  onChange={(e) => props.onLongPressDelayChange(Number(e.target.value))}
                  className="sidebar-select"
                >
                  <option value={0}>0ms (immediate)</option>
                  <option value={300}>300ms</option>
                  <option value={500}>500ms</option>
                  <option value={1000}>1000ms</option>
                </select>
              </ControlRow>

              <ControlRow label="Background Events">
                <TogglePill
                  options={["Off", "On"]}
                  active={props.enableBackgroundEvents ? 1 : 0}
                  onChange={(i) => { if ((i === 1) !== props.enableBackgroundEvents) props.onToggleBackgroundEvents(); }}
                />
              </ControlRow>
            </>
          )}

          {tab === "Views" && (
            <>
              <ControlRow label="Hidden Days">
                <div className="flex gap-1">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => {
                    const hidden = props.hiddenDays.includes(i);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          const next = hidden
                            ? props.hiddenDays.filter((x) => x !== i)
                            : [...props.hiddenDays, i];
                          props.onHiddenDaysChange(next);
                        }}
                        className={`w-7 h-7 text-[10px] font-medium rounded-[var(--trc-radius)] transition-colors ${
                          hidden
                            ? "bg-[var(--trc-destructive)] text-white"
                            : "bg-[var(--trc-accent)] text-[var(--trc-foreground)]"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </ControlRow>

              <ControlRow label="Week Numbers">
                <TogglePill
                  options={["Off", "On"]}
                  active={props.showWeekNumbers ? 1 : 0}
                  onChange={(i) => { if ((i === 1) !== props.showWeekNumbers) props.onToggleWeekNumbers(); }}
                />
              </ControlRow>

              <ControlRow label="Highlighted Dates">
                <TogglePill
                  options={["Off", "On"]}
                  active={props.highlightedDates.length > 0 ? 1 : 0}
                  onChange={() => props.onToggleHighlightedDates()}
                />
                {props.highlightedDates.length > 0 && (
                  <p className="text-[10px] text-[var(--trc-muted-foreground)] mt-1">
                    Today + next 2 days highlighted
                  </p>
                )}
              </ControlRow>

              <ControlRow label="Valid Range (this month)">
                <TogglePill
                  options={["Off", "On"]}
                  active={props.validRangeEnabled ? 1 : 0}
                  onChange={() => props.onToggleValidRange()}
                />
              </ControlRow>

              <ControlRow label="Flexible Time Limits">
                <TogglePill
                  options={["Off", "On"]}
                  active={props.flexibleSlotTimeLimits ? 1 : 0}
                  onChange={(i) => { if ((i === 1) !== props.flexibleSlotTimeLimits) props.onToggleFlexibleLimits(); }}
                />
              </ControlRow>
            </>
          )}

          {tab === "Resources" && (
            <>
              <ControlRow label="Resource View">
                <TogglePill
                  options={["Off", "On"]}
                  active={props.enableResources ? 1 : 0}
                  onChange={(i) => { if ((i === 1) !== props.enableResources) props.onToggleResources(); }}
                />
              </ControlRow>

              {props.enableResources && (
                <div className="text-[10px] text-[var(--trc-muted-foreground)] space-y-1">
                  <p>4 resources: Room A, Room B, Room C, Room D</p>
                  <p>Events auto-assigned to resources.</p>
                  <p>Switch to Day or Week view → vertical resource columns.</p>
                  <p>Switch to <strong>Timeline</strong> view → horizontal rows with drag/resize.</p>
                </div>
              )}

              <ControlRow label="Anchor events to NY">
                <TogglePill
                  options={["Off", "On"]}
                  active={props.anchorEvents ? 1 : 0}
                  onChange={(i) => { if ((i === 1) !== props.anchorEvents) props.onToggleAnchorEvents(); }}
                />
              </ControlRow>

              {props.anchorEvents && (
                <div className="text-[10px] text-[var(--trc-muted-foreground)] space-y-1">
                  <p>All events get <code>timeZone: "America/New_York"</code>.</p>
                  <p>Combine with a different display TZ to see conversion.</p>
                  <p>Drag/resize results return wall-clocks in NY, not display zone.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[var(--trc-border)]">
          <p className="text-[10px] text-[var(--trc-muted-foreground)]">
            MIT Licensed. Built with React.
          </p>
        </div>
      </aside>
    </>
  );
}

// ── Small Sub-Components ────────────────────────────────────────────────

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--trc-muted-foreground)] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function TogglePill({
  options,
  active,
  onChange,
}: {
  options: [string, string];
  active: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className="toggle-pill-group">
      {options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => onChange(i)}
          className={`toggle-pill ${active === i ? "toggle-pill-active" : "toggle-pill-inactive"}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
