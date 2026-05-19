import { getAppSettings } from "@/lib/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const s = await getAppSettings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurazioni</h1>
      <Card>
        <CardHeader>
          <CardTitle>Valori attuali</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p><strong>Broker:</strong> {s.brokerName}</p>
          <p><strong>Email broker:</strong> {s.brokerEmail}</p>
          <p><strong>Mittente:</strong> {s.emailFrom}</p>
          <p><strong>Reply-To:</strong> {s.emailReplyTo}</p>
          <p><strong>Privacy URL:</strong> {s.privacyPolicyUrl}</p>
          <p><strong>Form pubblico:</strong> {s.publicFormEnabled ? "Attivo" : "Disattivo"}</p>
          <p><strong>Rate limit IP/ora:</strong> {s.rateLimitPerIpPerHour}</p>
          <p><strong>Timezone:</strong> {s.timezone}</p>
        </CardContent>
      </Card>
      <p className="text-sm text-slate-500">Modifica via PUT /api/admin/settings o Prisma Studio.</p>
    </div>
  );
}
