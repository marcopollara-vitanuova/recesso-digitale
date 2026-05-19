import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTimeRome } from "@/lib/datetime";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function WithdrawalRequestsPage() {
  const items = await prisma.withdrawalRequest.findMany({
    orderBy: { submittedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--primary-900)]">Richieste di recesso</h1>
        <Link
          href="/api/admin/withdrawal-requests/export"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Esporta CSV
        </Link>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <caption className="sr-only">Elenco delle ultime 100 richieste di recesso</caption>
          <thead className="bg-slate-100 text-left text-slate-800">
            <tr>
              <th scope="col" className="p-3">
                ID
              </th>
              <th scope="col" className="p-3">
                Data
              </th>
              <th scope="col" className="p-3">
                Cliente
              </th>
              <th scope="col" className="p-3">
                Polizza
              </th>
              <th scope="col" className="p-3">
                Compagnia
              </th>
              <th scope="col" className="p-3">
                Stato
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3">
                  <Link
                    href={`/admin/withdrawal-requests/${r.id}`}
                    className="font-semibold text-[var(--primary-700)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary-400)]"
                  >
                    {r.publicId}
                  </Link>
                </td>
                <td className="p-3 text-slate-800">{formatDateTimeRome(r.submittedAt)}</td>
                <td className="p-3 text-slate-800">
                  {r.customerFirstName} {r.customerLastName}
                </td>
                <td className="p-3 text-slate-800">{r.policyNumber}</td>
                <td className="p-3 text-slate-800">{r.insuranceCompanyNameSnapshot}</td>
                <td className="p-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
