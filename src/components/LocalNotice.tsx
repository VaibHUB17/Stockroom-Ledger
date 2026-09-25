import React from "react";

export function LocalNotice() {
  return (
    <div className="py-2 px-3 rounded bg-[var(--surface)] border border-[var(--hairline)] text-xs text-[var(--muted-ink)] flex items-center justify-between">
      <span>
        Saved in this browser only. The demo API does not store changes.
      </span>
    </div>
  );
}
