import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  RECEIVED: "bg-slate-200 text-slate-900",
  EMAIL_SENT: "bg-green-100 text-green-900",
  PARTIAL_EMAIL_FAILURE: "bg-amber-100 text-amber-950",
  EMAIL_FAILED: "bg-red-100 text-red-900",
  MANUALLY_RESOLVED: "bg-blue-100 text-blue-900",
  CANCELLED: "bg-slate-300 text-slate-900",
};

const labels: Record<string, string> = {
  RECEIVED: "Ricevuta",
  EMAIL_SENT: "Email inviate",
  PARTIAL_EMAIL_FAILURE: "Invio email parziale",
  EMAIL_FAILED: "Invio email fallito",
  MANUALLY_RESOLVED: "Risolta manualmente",
  CANCELLED: "Annullata",
};

export function StatusBadge({ status }: { status: string }) {
  const label = labels[status] ?? status;

  return (
    <span
      className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[status] ?? styles.RECEIVED)}
    >
      <span className="sr-only">Stato: </span>
      {label}
    </span>
  );
}
