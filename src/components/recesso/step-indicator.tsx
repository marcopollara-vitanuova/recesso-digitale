type Step = "landing" | "form" | "review" | "success" | "error";

const steps: { id: Step; label: string }[] = [
  { id: "landing", label: "Introduzione" },
  { id: "form", label: "Dati richiesta" },
  { id: "review", label: "Riepilogo" },
  { id: "success", label: "Conferma" },
];

function stepIndex(step: Step): number {
  if (step === "error") return 2;
  if (step === "success") return 3;
  return steps.findIndex((s) => s.id === step);
}

export function StepIndicator({ current }: { current: Step }) {
  const active = stepIndex(current);

  return (
    <nav aria-label="Avanzamento richiesta di recesso" className="mx-auto mb-8 max-w-2xl">
      <ol className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {steps.map((step, index) => {
          const isCurrent = index === active;
          const isComplete = index < active;

          return (
            <li key={step.id} className="flex items-center gap-2">
              <span
                className={
                  isCurrent
                    ? "rounded-full bg-[var(--primary-700)] px-3 py-1.5 font-semibold text-white shadow-sm"
                    : isComplete
                      ? "rounded-full bg-[var(--primary-100)] px-3 py-1.5 font-semibold text-[var(--primary-900)]"
                      : "rounded-full bg-white px-3 py-1.5 font-medium text-[var(--gray-600)] ring-1 ring-[var(--gray-300)]"
                }
                aria-current={isCurrent ? "step" : undefined}
              >
                <span className="sr-only">Passo {index + 1}: </span>
                {step.label}
              </span>
              {index < steps.length - 1 ? (
                <span aria-hidden="true" className="text-[var(--gray-400)]">
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
