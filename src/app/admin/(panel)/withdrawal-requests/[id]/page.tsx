import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTimeRome } from "@/lib/datetime";
import { RequestActions } from "./request-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WithdrawalRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: {
      emailLogs: { orderBy: { createdAt: "desc" } },
      internalNotes: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true, name: true } } },
      },
    },
  });

  if (!item) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{item.publicId}</h1>
          <p className="text-slate-600">{formatDateTimeRome(item.submittedAt)}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dati richiesta</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <p><strong>Cliente:</strong> {item.customerFirstName} {item.customerLastName}</p>
            <p><strong>CF:</strong> {item.customerFiscalCode}</p>
            <p><strong>Email:</strong> {item.customerEmail}</p>
            <p><strong>Telefono:</strong> {item.customerPhone ?? "—"}</p>
            <p><strong>Polizza:</strong> {item.policyNumber}</p>
            <p><strong>Compagnia:</strong> {item.insuranceCompanyNameSnapshot}</p>
            <p><strong>Email compagnia (snapshot):</strong> {item.insuranceCompanyEmailSnapshot}</p>
            <p><strong>Email broker (snapshot):</strong> {item.brokerEmailSnapshot}</p>
            {item.customerNotes && <p className="sm:col-span-2"><strong>Note:</strong> {item.customerNotes}</p>}
          </CardContent>
        </Card>
        <RequestActions requestId={item.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {item.emailLogs.map((log) => (
            <div key={log.id} className="rounded-lg border border-slate-100 p-3 text-sm">
              <p className="font-medium">{log.emailType} — {log.status}</p>
              <p className="text-slate-600">A: {log.recipientTo}</p>
              <p className="text-slate-600">{log.subject}</p>
              {log.errorMessage && <p className="text-red-600">{log.errorMessage}</p>}
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs">{log.body}</pre>
            </div>
          ))}
        </CardContent>
      </Card>

      {item.internalNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Note interne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {item.internalNotes.map((n) => (
              <div key={n.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="text-xs text-slate-500">{n.user.email} — {formatDateTimeRome(n.createdAt)}</p>
                <p>{n.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
