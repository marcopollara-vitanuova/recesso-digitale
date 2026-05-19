import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTimeRome } from "@/lib/datetime";
import { Button } from "@/components/ui/button";

export default async function WithdrawalRequestsPage() {
  const items = await prisma.withdrawalRequest.findMany({
    orderBy: { submittedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Richieste di recesso</h1>
        <a href="/api/admin/withdrawal-requests/export">
          <Button variant="outline">Export CSV</Button>
        </a>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Data</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Polizza</th>
              <th className="p-3">Compagnia</th>
              <th className="p-3">Stato</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3">
                  <Link href={`/admin/withdrawal-requests/${r.id}`} className="font-medium text-teal-700 hover:underline">
                    {r.publicId}
                  </Link>
                </td>
                <td className="p-3">{formatDateTimeRome(r.submittedAt)}</td>
                <td className="p-3">{r.customerFirstName} {r.customerLastName}</td>
                <td className="p-3">{r.policyNumber}</td>
                <td className="p-3">{r.insuranceCompanyNameSnapshot}</td>
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
