"use client";

import * as React from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  // Riferimento stabile a onClose: evita di ri-eseguire l'effetto (e rubare il
  // focus) a ogni render del genitore mentre l'utente digita.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    // Focus iniziale: primo campo del form (non il bottone di chiusura).
    const panel = panelRef.current;
    const toFocus =
      panel?.querySelector<HTMLElement>("input, textarea, select") ??
      panel?.querySelector<HTMLElement>("button");
    toFocus?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
    // Dipende SOLO da `open`: non deve ri-eseguirsi quando cambia onClose o lo stato del form
    // (onClose è letto tramite ref). Questo evita il furto del focus a ogni digitazione.
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="w-full max-w-lg rounded-2xl border border-[var(--gray-200)] bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--gray-100)] px-6 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-[var(--primary-900)]">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 text-sm text-[var(--gray-600)]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Chiudi finestra"
            className="rounded-lg p-1 text-[var(--gray-500)] hover:bg-[var(--gray-100)] hover:text-[var(--gray-900)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary-400)]"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--gray-100)] px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
