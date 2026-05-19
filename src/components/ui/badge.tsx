import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  RECEIVED: "bg-slate-100 text-slate-800",
  EMAIL_SENT: "bg-green-100 text-green-800",
  PARTIAL_EMAIL_FAILURE: "bg-amber-100 text-amber-800",
  EMAIL_FAILED: "bg-red-100 text-red-800",
  MANUALLY_RESOLVED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-slate-200 text-slate-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status] ?? styles.RECEIVED)}>
      {status}
    </span>
  );
}
