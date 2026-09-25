"use client";

import React, { useEffect, useRef } from "react";
import { useSubmitGuard } from "../hooks/useSubmitGuard";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const { isSubmitting, execute } = useSubmitGuard();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      // Ensure cancel button receives default focus
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    await execute(async () => {
      await onConfirm();
      onCancel();
    });
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="backdrop:bg-black/40 backdrop:backdrop-blur-none p-0 bg-transparent rounded-lg max-w-sm w-full m-auto open:flex open:flex-col shadow-xl border border-[var(--hairline)]"
    >
      <div className="bg-[var(--surface)] text-[var(--ink)] w-full rounded-lg overflow-hidden p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--ink)]">{title}</h3>
          <p className="mt-1.5 text-sm text-[var(--muted-ink)]">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3.5 py-2 text-sm font-medium rounded border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-button"
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-3.5 py-2 text-sm font-medium rounded bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--danger)] transition-colors"
          >
            {isSubmitting ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
