import { prisma } from "@/lib/prisma";
import { formatDateTimeRome } from "@/lib/datetime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit log</h1>
      <Card>
        <CardHeader>
          <CardTitle>Ultime attività</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Ultime 100 attività registrate nel sistema</caption>
            <thead>
              <tr className="border-b text-left text-slate-800">
                <th scope="col" className="pb-2 pr-4">Data</th>
                <th scope="col" className="pb-2 pr-4">Utente</th>
                <th scope="col" className="pb-2 pr-4">Azione</th>
                <th scope="col" className="pb-2">Entità</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{formatDateTimeRome(log.createdAt)}</td>
                  <td className="py-2 pr-4">{log.user?.email ?? "—"}</td>
                  <td className="py-2 pr-4">{log.action}</td>
                  <td className="py-2">{log.entityType} {log.entityId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
