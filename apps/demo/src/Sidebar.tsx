interface SidebarProps {
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
}

const LOCALES = [
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Espanol" },
  { value: "fr-FR", label: "Francais" },
  { value: "de-DE", label: "Deutsch" },
  { value: "pt-BR", label: "Portugues (BR)" },
  { value: "ja-JP", label: "Japanese" },
];

const FEATURES = [
  "4 Views",
  "i18n",
  "Dark Mode",
  "Drag & Drop",
  "Slots API",
  "Zero Config",
];

export function Sidebar({
  open,
  onClose,
  darkMode,
  onToggleDarkMode,
  locale,
  onLocaleChange,
  weekStartsOn,
  onWeekStartChange,
  enableDnD,
  onToggleDnD,
  enableSlots,
  onToggleSlots,
  onNewEvent,
}: SidebarProps) {
  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${open ? "sidebar-open" : "sidebar-closed"}`}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-between md:hidden mb-4">
          <span className="text-sm font-semibold text-[var(--trc-foreground)]">Settings</span>
          <button
            onClick={onClose}
            className="text-[var(--trc-muted-foreground)] hover:text-[var(--trc-foreground)] text-xl leading-none"
            aria-label="Close sidebar"
          >
            &times;
          </button>
        </div>

        {/* New Event button */}
        <button
          onClick={() => {
            onNewEvent();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--trc-radius)] bg-[var(--trc-primary)] text-[var(--trc-primary-foreground)] hover:opacity-90 transition-opacity text-sm font-medium mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Event
        </button>

        {/* Config Controls */}
        <div className="space-y-5">
          {/* Theme */}
          <ControlRow label="Theme">
            <TogglePill
              options={["Light", "Dark"]}
              active={darkMode ? 1 : 0}
              onChange={(i) => { if ((i === 1) !== darkMode) onToggleDarkMode(); }}
            />
          </ControlRow>

          {/* Locale */}
          <ControlRow label="Locale">
            <select
              value={locale}
              onChange={(e) => onLocaleChange(e.target.value)}
              className="sidebar-select"
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </ControlRow>

          {/* Week start */}
          <ControlRow label="Week starts on">
            <TogglePill
              options={["Sun", "Mon"]}
              active={weekStartsOn}
              onChange={(i) => onWeekStartChange(i as 0 | 1)}
            />
          </ControlRow>

          {/* DnD */}
          <ControlRow label="Drag & Drop">
            <TogglePill
              options={["Off", "On"]}
              active={enableDnD ? 1 : 0}
              onChange={(i) => { if ((i === 1) !== enableDnD) onToggleDnD(); }}
            />
          </ControlRow>

          {/* Custom Slots */}
          <ControlRow label="Custom Slots">
            <TogglePill
              options={["Default", "Custom"]}
              active={enableSlots ? 1 : 0}
              onChange={(i) => { if ((i === 1) !== enableSlots) onToggleSlots(); }}
            />
          </ControlRow>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--trc-border)] my-6" />

        {/* Feature Highlights */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--trc-muted-foreground)] uppercase tracking-wider mb-3">
            Features
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {FEATURES.map((f) => (
              <span
                key={f}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--trc-accent)] text-[var(--trc-accent-foreground)]"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[var(--trc-border)]">
          <p className="text-xs text-[var(--trc-muted-foreground)]">
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
      <label className="block text-xs font-medium text-[var(--trc-muted-foreground)] mb-1.5">
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
