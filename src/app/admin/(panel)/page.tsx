import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDateTimeRome } from "@/lib/datetime";

export default async function AdminDashboardPage() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [total, last24h, last7d, emailSent, emailFailed, recent] = await Promise.all([
    prisma.withdrawalRequest.count(),
    prisma.withdrawalRequest.count({ where: { submittedAt: { gte: dayAgo } } }),
    prisma.withdrawalRequest.count({ where: { submittedAt: { gte: weekAgo } } }),
    prisma.withdrawalRequest.count({ where: { status: "EMAIL_SENT" } }),
    prisma.withdrawalRequest.count({
      where: { status: { in: ["EMAIL_FAILED", "PARTIAL_EMAIL_FAILURE"] } },
    }),
    prisma.withdrawalRequest.findMany({
      orderBy: { submittedAt: "desc" },
      take: 10,
    }),
  ]);

  const stats = [
    { label: "Totale richieste", value: total },
    { label: "Ultime 24 ore", value: last24h },
    { label: "Ultimi 7 giorni", value: last7d },
    { label: "Email inviate OK", value: emailSent },
    { label: "Errori email", value: emailFailed },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Panoramica richieste di recesso</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ultime richieste</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Data</th>
                <th className="pb-2 pr-4">Cliente</th>
                <th className="pb-2 pr-4">Polizza</th>
                <th className="pb-2 pr-4">Stato</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/withdrawal-requests/${r.id}`} className="text-teal-700 hover:underline">
                      {r.publicId}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{formatDateTimeRome(r.submittedAt)}</td>
                  <td className="py-3 pr-4">
                    {r.customerFirstName} {r.customerLastName}
                  </td>
                  <td className="py-3 pr-4">{r.policyNumber}</td>
                  <td className="py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
