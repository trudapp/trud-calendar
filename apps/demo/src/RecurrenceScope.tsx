import { useEffect, useRef } from "react";

export type RecurrenceScopeChoice = "single" | "series";

interface RecurrenceScopeDialogProps {
  /** "edit" or "delete" — changes the wording */
  action: "edit" | "delete";
  onChoice: (scope: RecurrenceScopeChoice) => void;
  onClose: () => void;
}

export function RecurrenceScopeDialog({
  action,
  onChoice,
  onClose,
}: RecurrenceScopeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const handleBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const title = action === "edit" ? "Edit recurring event" : "Delete recurring event";

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClick={handleBackdrop}
      className="event-modal-dialog"
    >
      <div className="event-modal-content" style={{ maxWidth: 360 }}>
        <h2 className="text-lg font-semibold text-[var(--trc-foreground)] mb-4">
          {title}
        </h2>
        <p className="text-sm text-[var(--trc-muted-foreground)] mb-5">
          This is a recurring event. What would you like to {action}?
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => onChoice("single")}
            className="w-full text-left px-4 py-3 rounded-[var(--trc-radius)] border border-[var(--trc-border)] hover:bg-[var(--trc-accent)] transition-colors"
          >
            <div className="text-sm font-medium text-[var(--trc-foreground)]">
              This event
            </div>
            <div className="text-xs text-[var(--trc-muted-foreground)]">
              Only {action} this occurrence
            </div>
          </button>
          <button
            onClick={() => onChoice("series")}
            className="w-full text-left px-4 py-3 rounded-[var(--trc-radius)] border border-[var(--trc-border)] hover:bg-[var(--trc-accent)] transition-colors"
          >
            <div className="text-sm font-medium text-[var(--trc-foreground)]">
              All events
            </div>
            <div className="text-xs text-[var(--trc-muted-foreground)]">
              {action === "edit" ? "Edit" : "Delete"} all events in the series
            </div>
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-[var(--trc-radius)] border border-[var(--trc-border)] text-[var(--trc-foreground)] hover:bg-[var(--trc-accent)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
